/**
 * ViewerLivestreamPage - Trang xem livestream (Viewer side)
 * Thiết kế theo Figma Amber Hearth
 */
import { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useViewerLivestream } from '../hooks/useViewerLivestream';
import PinnedProductCard from '../components/PinnedProductCard';
import LivestreamChat from '../components/LivestreamChat';
import { livestreamRealtimeService, LiveProductPin } from '../services/livestreamRealtimeService';

const ViewerLivestreamPage = () => {
  const { livestreamId } = useParams<{ livestreamId: string }>();
  const navigate = useNavigate();

  const {
    status,
    viewerCount,
    remoteUsers,
    joinLivestream,
    leaveLivestream,
  } = useViewerLivestream();

  const [pinnedProduct, setPinnedProduct] = useState<LiveProductPin | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [likeAnimations, setLikeAnimations] = useState<{ id: number; x: number; emoji: string }[]>([]);
  const likeAnimIdRef = useRef(0);

  const remoteVideoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (livestreamId && status === 'IDLE') handleJoin();
  }, [livestreamId]);

  useEffect(() => {
    if (livestreamId && status === 'WATCHING') {
      const unsubscribe = livestreamRealtimeService.subscribeToMetadata(livestreamId, (meta) => {
        if (meta?.pinnedProduct) setPinnedProduct(meta.pinnedProduct);
        else setPinnedProduct(null);
        if (meta?.likeCount) setLikeCount(meta.likeCount);
      });
      return () => unsubscribe();
    }
  }, [livestreamId, status]);

  // Subscribe to likes for floating heart animations
  useEffect(() => {
    if (!livestreamId || status !== 'WATCHING') return;
    let prevCount = 0;
    const unsubscribe = livestreamRealtimeService.subscribeToLikes(livestreamId, (likes) => {
      const newCount = likes.length;
      if (newCount > prevCount) {
        const diff = Math.min(newCount - prevCount, 5);
        for (let i = 0; i < diff; i++) {
          const heartEmojis = ['❤️', '🧡', '💛', '💖', '💗', '💜'];
          const animId = likeAnimIdRef.current++;
          setLikeAnimations(prev => [...prev, {
            id: animId,
            x: 20 + Math.random() * 60,
            emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)],
          }]);
          setTimeout(() => {
            setLikeAnimations(prev => prev.filter(a => a.id !== animId));
          }, 2500);
        }
      }
      prevCount = newCount;
    });
    return () => unsubscribe();
  }, [livestreamId, status]);

  useEffect(() => {
    if (remoteUsers.length > 0) {
      remoteUsers.forEach(user => {
        if (user.videoTrack) {
          const el = document.getElementById(`remote-video-${user.uid}`);
          if (el) user.videoTrack.play(el as HTMLElement);
        }
        if (user.audioTrack) user.audioTrack.play();
      });
    }
  }, [remoteUsers]);

  const handleJoin = async () => {
    if (!livestreamId) return;
    try { await joinLivestream(livestreamId); }
    catch (err) { alert('❌ ' + (err as Error).message); }
  };

  const handleLeave = async () => {
    try { await leaveLivestream(); navigate('/'); }
    catch (err) { alert('❌ ' + (err as Error).message); }
  };

  const handleLike = () => {
    setLikeCount(prev => prev + 1);
    if (livestreamId) livestreamRealtimeService.sendLike(livestreamId);
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#1a1a1a' }}>
      {/* LEFT: Video Area */}
      <div className="flex-1 relative bg-black">
        <div ref={remoteVideoContainerRef} className="w-full h-full">
          {remoteUsers.length > 0 ? (
            remoteUsers.map(user => (
              <div key={user.uid} id={`remote-video-${user.uid}`} className="w-full h-full" />
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
              {status === 'CONNECTING' ? (
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white/70 text-sm">Đang kết nối...</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mb-4 mx-auto">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="opacity-50"><rect x="1" y="6" width="18" height="14" rx="2"/><path d="M19 10l4-2v8l-4-2"/></svg>
                  </div>
                  <p className="text-white/50 text-sm">Đang chờ host phát sóng...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top-left: Restaurant name */}
        <div className="absolute top-5 left-5">
          <p className="text-white/90 font-semibold text-sm drop-shadow-lg">Amber Hearth</p>
        </div>

        {/* Back button */}
        <button
          onClick={handleLeave}
          className="absolute top-5 right-5 w-9 h-9 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-white/10 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        {/* Bottom: Host info + viewer count */}
        <div className="absolute bottom-0 left-0 right-0 pb-6 px-5 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-orange-400 overflow-hidden border-2 border-white/30">
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">CM</div>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Masterclass: Wood-Fired Ribeye</p>
              <p className="text-white/70 text-xs">Chef Marcus • The Urban Hearth</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 w-fit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f49d25" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <p className="text-white text-xs font-semibold">{viewerCount.toLocaleString() || '4,281'} watching</p>
          </div>
        </div>

        {/* Floating heart animations (TikTok-style) */}
        {likeAnimations.map(anim => (
          <div
            key={anim.id}
            className="absolute pointer-events-none"
            style={{
              right: `${anim.x}px`,
              bottom: '120px',
              animation: 'floatHeart 2.5s ease-out forwards',
              fontSize: '28px',
              zIndex: 30,
            }}
          >
            {anim.emoji}
          </div>
        ))}
        <style>{`
          @keyframes floatHeart {
            0% { transform: translateY(0) scale(0.5); opacity: 0; }
            10% { transform: translateY(-20px) scale(1.1); opacity: 1; }
            50% { transform: translateY(-150px) scale(1) translateX(20px); opacity: 0.8; }
            100% { transform: translateY(-350px) scale(0.6) translateX(-20px); opacity: 0; }
          }
        `}</style>
      </div>

      {/* RIGHT: Chat Panel */}
      <div className="w-80 lg:w-96 flex flex-col bg-white border-l border-gray-100">
        {/* Pinned Product (top of chat panel) */}
        {pinnedProduct && (
          <div className="p-3 border-b border-gray-100 bg-gray-50 animate-bounce-in">
            <PinnedProductCard product={pinnedProduct} isHost={false} onAction={() => alert('Đã thêm vào giỏ hàng!')} />
          </div>
        )}

        {/* Real-time Chat via Firebase */}
        {livestreamId && (
          <div className="flex-1 flex flex-col min-h-0">
            <LivestreamChat livestreamId={livestreamId} role="viewer" />
          </div>
        )}

        {/* Like button */}
        <div className="px-4 pb-3 flex justify-end">
          <button
            type="button"
            onClick={handleLike}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-500 hover:bg-orange-100 transition-all active:scale-95"
            title="Thả tim"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={likeCount > 0 ? '#f49d25' : 'none'} stroke="#f49d25" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            {likeCount > 0 && <span className="text-xs font-bold">{likeCount}</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewerLivestreamPage;
