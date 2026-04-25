/**
 * LivestreamPage - Trang Host phát Livestream
 * Bao gồm 2 trạng thái: Set the Stage (cấu hình) và Active Stream (đang phát)
 */
import { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import { useLivestream, StreamProvider } from '../hooks/useLivestream';
import { useRestaurant } from '@/modules/restaurant/hooks/useRestaurant';
import TokenStorage from '@/services/storage/localStorage';
import LivestreamChat from '../components/LivestreamChat';
import LiveProductList from '../components/LiveProductList';
import PinnedProductCard from '../components/PinnedProductCard';
import { livestreamRealtimeService, LiveProductPin } from '../services/livestreamRealtimeService';
import { ROUTES } from '@/utils/constants';

const LivestreamPage = () => {
  const { id: existingLivestreamId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    livestreamData,
    videoTrack,
    audioTrack,
    createRoom,
    previewCamera,
    startLive,
    endLive,
    loadExistingLivestream,
    resetContext,
  } = useLivestream();
  const status = livestreamData.status;

  const { currentRestaurant } = useRestaurant();

  const isLive = status === 'LIVE' && !!existingLivestreamId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'products'>('chat');
  const [pinnedProduct, setPinnedProduct] = useState<LiveProductPin | null>(null);
  const [tags, setTags] = useState<string[]>(['#LiveFood']);
  const [tagInput, setTagInput] = useState('');

  const localVideoRef = useRef<HTMLDivElement>(null);

  const [isCamMuted, setIsCamMuted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);

  useEffect(() => {
    if (!existingLivestreamId) {
      // If we directly enter the create page, reset any lingering old stream state
      resetContext();
    }
  }, []); // Run only on mount

  useEffect(() => {
    if (existingLivestreamId && livestreamData.livestreamId !== existingLivestreamId) {
      loadExistingLivestream(existingLivestreamId);
    }
  }, [existingLivestreamId, loadExistingLivestream]);

  useEffect(() => {
    if (livestreamData.title) setTitle(livestreamData.title);
    if (livestreamData.description) setDescription(livestreamData.description);
  }, [livestreamData.title, livestreamData.description]);

  useEffect(() => {
    if (livestreamData.livestreamId && !existingLivestreamId) {
      navigate(ROUTES.RESTAURANT_LIVESTREAM_DETAIL.replace(':id', livestreamData.livestreamId), { replace: true });
    }
  }, [livestreamData.livestreamId, navigate, existingLivestreamId]);

  useEffect(() => {
    if (videoTrack && localVideoRef.current) {
      // Small timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
          console.log('✅ Video attached to element');
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [videoTrack, isLive]);

  useEffect(() => {
    if (livestreamData.livestreamId && status === 'LIVE') {
      const unsubscribe = livestreamRealtimeService.subscribeToMetadata(
        livestreamData.livestreamId,
        (meta) => {
          if (meta?.pinnedProduct) setPinnedProduct(meta.pinnedProduct);
        }
      );
      return () => unsubscribe();
    }
  }, [livestreamData.livestreamId, status]);

  const handleCreateRoom = async () => {
    if (!title.trim()) {
      alert('❌ Vui lòng nhập tiêu đề livestream');
      return;
    }
    let restaurantId = currentRestaurant?.id;
    if (!restaurantId) {
      const savedId = TokenStorage.getCurrentRestaurantId();
      if (savedId) restaurantId = savedId;
      else { alert('❌ Không tìm thấy thông tin nhà hàng.'); return; }
    }
    try {
      await createRoom({ title: title.trim(), description: description.trim() || undefined, restaurantId, streamProvider: StreamProvider.AGORA });
    } catch (err) {
      alert('❌ Lỗi: ' + (err as Error).message);
    }
  };

  const handleStartLive = async () => {
    try { await startLive(); setActiveTab('chat'); }
    catch (err) { alert('❌ Lỗi: ' + (err as Error).message); }
  };

  const handleEndLive = async () => {
    try { await endLive(); }
    catch (err) { alert('❌ Lỗi: ' + (err as Error).message); }
  };

  const handleToggleCam = async () => {
    if (videoTrack) {
      await videoTrack.setMuted(!isCamMuted);
      setIsCamMuted(!isCamMuted);
    }
  };

  const handleToggleMic = async () => {
    if (audioTrack) {
      await audioTrack.setMuted(!isMicMuted);
      setIsMicMuted(!isMicMuted);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const tag = tagInput.startsWith('#') ? tagInput.trim() : `#${tagInput.trim()}`;
      setTags(prev => [...prev, tag]);
      setTagInput('');
    }
  };



  // ==================== ACTIVE STREAM VIEW ====================
  if (isLive) {
    return (
      <div className="flex h-screen bg-black overflow-hidden">
        {/* VIDEO AREA */}
        <div className="flex-1 relative bg-gray-950">
          {/* Video */}
          <div ref={localVideoRef} id="local-video" className="w-full h-full" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-white font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {title || 'Live Stream'}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
              </span>
              <button
                onClick={handleEndLive}
                className="px-4 py-2 bg-red-500/80 backdrop-blur-md border border-red-500/20 text-white text-xs font-bold rounded-full hover:bg-red-500 transition-all"
              >
                End Stream
              </button>
            </div>
          </div>

          {/* Overlay controls inside Active Stream */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 z-10">
            <button onClick={handleToggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all ${isMicMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0014 0M12 21v-4M8 21h8"/></svg>
              {isMicMuted && <div className="absolute w-[2px] h-6 bg-white rotate-45"></div>}
            </button>
            <button onClick={handleToggleCam} className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all ${isCamMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              {isCamMuted && <div className="absolute w-[2px] h-6 bg-white rotate-45"></div>}
            </button>
          </div>

          {/* Pinned product overlay - top right above chat */}
          {pinnedProduct && (
            <div className="absolute top-20 left-6 animate-bounce-in">
              <PinnedProductCard product={pinnedProduct} isHost={true} />
            </div>
          )}

          {/* Bottom info bar */}
          <div className="absolute bottom-0 left-0 right-0 px-6 py-5 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-white/80 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {currentRestaurant?.name || 'Your Restaurant'}
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: Chat + Products */}
        <div className="w-96 flex flex-col bg-white border-l border-gray-100">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3.5 text-xs font-bold tracking-wide transition-all border-b-2 ${activeTab === 'chat' ? 'border-orange-400 text-orange-500' : 'border-transparent text-gray-400'}`}
            >
              CHAT TRỰC TIẾP
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 py-3.5 text-xs font-bold tracking-wide transition-all border-b-2 ${activeTab === 'products' ? 'border-orange-400 text-orange-500' : 'border-transparent text-gray-400'}`}
            >
              SẢN PHẨM
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && livestreamData.livestreamId ? (
              <LivestreamChat livestreamId={livestreamData.livestreamId} role="host" />
            ) : activeTab === 'products' && currentRestaurant ? (
              <LiveProductList restaurantId={currentRestaurant.id} livestreamId={livestreamData.livestreamId || ''} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                Đang tải...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== SET THE STAGE VIEW ====================
  return (
    <div className="flex h-screen" style={{ background: '#f8f7f5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <RestaurantSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Header */}
        <div className="shrink-0 px-8 pt-8 pb-4 flex items-end justify-between border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div>
            <h1 className="text-4xl font-extrabold text-[#1c160d] tracking-tight">Set the Stage.</h1>
            <p className="text-[#9c7a49] mt-1 text-base">Configure your stream before going live to your audience.</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-[#f49d25] text-white rounded-full font-semibold shadow-lg shadow-orange-200 hover:bg-orange-500 transition-all text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
            Schedule Stream
          </button>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto flex gap-6">
            {/* LEFT: Configuration */}
            <div className="flex-1 flex flex-col gap-5">
              {/* Stream Details Card */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2.5 mb-6">
                  <svg width="18" height="16" viewBox="0 0 18 16" fill="none"><path d="M1 4h16M1 8h10M1 12h13" stroke="#f49d25" strokeWidth="2" strokeLinecap="round" /></svg>
                  <h2 className="text-xl font-bold text-[#1c160d]">Stream Details</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-[#9c7a49] text-sm font-medium mb-2 block">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Chef's Special: Handcrafted Pasta Masterclass"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 bg-white placeholder:text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="text-[#9c7a49] text-sm font-medium mb-2 block">Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={5}
                      placeholder="Join me in the kitchen as we prepare fresh tagliatelle from scratch..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 bg-white placeholder:text-gray-300 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#9c7a49] text-sm font-medium mb-2 block">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag, i) => (
                        <span key={i} className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold border border-orange-100">
                          {tag}
                        </span>
                      ))}
                      <button
                        onClick={() => document.getElementById('tag-input')?.focus()}
                        className="text-gray-400 px-3 py-1 rounded-full text-xs border border-dashed border-gray-300 hover:border-gray-400 transition-all"
                      >
                        + Add Tag
                      </button>
                    </div>
                    <input
                      id="tag-input"
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Nhấn Enter để thêm tag..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-200 placeholder:text-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Hardware Setup Card */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2.5 mb-6">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9c7a49" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3l-4 4-4-4" /></svg>
                  <h2 className="text-xl font-bold text-[#1c160d]">Hardware Setup</h2>
                </div>
                <div className="space-y-4">
                  {/* Camera */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-[#9c7a49] text-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="18" height="14" rx="2" /><path d="M19 10l4-2v8l-4-2" /></svg>
                        Camera
                      </div>
                      <span className="text-green-500 text-xs font-semibold">Connected</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-2xl text-sm text-[#1c160d]">
                      <span>{videoTrack ? 'Camera đang hoạt động' : 'Chưa kết nối camera'}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9c7a49" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                  </div>
                  {/* Microphone */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-[#9c7a49] text-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="2" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0014 0M12 21v-4M8 21h8" /></svg>
                        Microphone
                      </div>
                      <span className="text-green-500 text-xs font-semibold">Active</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-2xl text-sm text-[#1c160d]">
                      <span>Microphone hệ thống</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9c7a49" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                  </div>
                  {/* Audio levels */}
                  <div className="flex items-center gap-1 px-4 py-3 border border-gray-200 rounded-2xl">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9c7a49" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" /></svg>
                    <div className="flex gap-0.5 items-end h-5 ml-2">
                      {[4, 6, 8, 10, 12, 10, 8, 10, 12, 8, 10, 6, 4].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}px`, backgroundColor: i < 8 ? '#22c55e' : i < 10 ? '#f49d25' : '#e5e7eb' }}
                          className="w-2.5 rounded-sm"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Preview + Go Live */}
            <div className="w-[420px] flex-shrink-0 flex flex-col gap-4">
              {/* Camera Preview Card */}
              <div className="bg-black rounded-3xl overflow-hidden relative aspect-[4/3] shadow-md">
                {/* Preview badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-white text-xs font-semibold">PREVIEW</span>
                </div>
                <div className="absolute top-4 right-4 z-10 text-white text-xs font-semibold bg-black/50 rounded-full px-3 py-1">
                  1080p • 60fps
                </div>

                {/* Video or placeholder */}
                <div ref={localVideoRef} id="local-video" className="w-full h-full">
                  {!videoTrack && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-950">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-gray-600"><rect x="1" y="6" width="18" height="14" rx="2" /><path d="M19 10l4-2v8l-4-2" /></svg>
                      <p className="text-sm">Camera preview</p>
                      <button onClick={() => previewCamera().catch(console.error)} className="mt-3 text-xs text-orange-400 hover:text-orange-300 underline">
                        Bật camera
                      </button>
                    </div>
                  )}
                </div>

                {/* Controls overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                  <button onClick={handleToggleMic} className={`w-10 h-10 ${isMicMuted ? 'bg-red-500' : 'bg-black/60'} backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 relative`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0014 0M12 21v-4M8 21h8"/></svg>
                    {isMicMuted && <div className="absolute w-[2px] h-5 bg-white rotate-45"></div>}
                  </button>
                  <button onClick={handleToggleCam} className={`w-10 h-10 ${isCamMuted ? 'bg-red-500' : 'bg-black/60'} backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 relative`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                    {isCamMuted && <div className="absolute w-[2px] h-5 bg-white rotate-45"></div>}
                  </button>
                  <button className="px-4 py-2 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                    Fullscreen
                  </button>
                </div>
              </div>

              {/* Ready to go card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#1c160d] mb-1">Ready to cook? 🍳</h3>
                    <p className="text-[#9c7a49] text-sm leading-relaxed">
                      {currentRestaurant
                        ? `Phát sóng từ ${currentRestaurant.name} ngay!`
                        : 'Your audience is waiting. Go live now!'}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3">
                  {status === 'LOADING' ? (
                    <div className="w-full py-4 bg-gray-100 rounded-2xl animate-pulse" />
                  ) : status === 'IDLE' || status === 'ENDED' || !livestreamData.livestreamId ? (
                    <button
                      onClick={handleCreateRoom}
                      className="w-full py-4 bg-[#f49d25] text-white font-bold rounded-2xl shadow-md shadow-orange-200 hover:bg-orange-500 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#fff3" /><path d="M10 8l6 4-6 4V8z" /></svg>
                      Tạo Phòng Live
                    </button>
                  ) : status === 'CREATED' && !videoTrack ? (
                    <button
                      onClick={() => previewCamera().catch(console.error)}
                      className="w-full py-4 bg-indigo-500 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all active:scale-95"
                    >
                      Kiểm tra Camera
                    </button>
                  ) : status === 'CREATED' ? (
                    <button
                      onClick={handleStartLive}
                      className="w-full py-4 bg-[#f49d25] text-white font-bold rounded-2xl shadow-md shadow-orange-200 hover:bg-orange-500 transition-all active:scale-95 flex items-center justify-center gap-2 animate-pulse"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#fff3" /><path d="M10 8l6 4-6 4V8z" /></svg>
                      Go Live Now
                    </button>
                  ) : null}

                  {livestreamData.livestreamId && status === 'CREATED' && (
                    <div className="bg-green-50 text-green-700 px-4 py-3 rounded-2xl text-sm text-center">
                      ✅ Phòng live đã được tạo! Nhấn bắt đầu phát sóng.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LivestreamPage;
