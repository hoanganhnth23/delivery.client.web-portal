import React, { useState } from 'react';

interface LivestreamInteractionsProps {
  onLike?: () => void;
  onShare?: () => void;
  likeCount?: number;
}

const LivestreamInteractions: React.FC<LivestreamInteractionsProps> = ({ 
  onLike, 
  onShare, 
  likeCount = 0 
}) => {
  const [hearts, setHearts] = useState<{ id: number; left: number }[]>([]);

  const handleLike = () => {
    if (onLike) onLike();
    
    // Create floating heart animation
    const id = Date.now();
    const left = Math.random() * 80 + 10; // Random % from 10 to 90
    setHearts(prev => [...prev, { id, left }]);
    
    // Remove heart after animation
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 2000);
  };

  return (
    <div className="relative flex flex-col items-center gap-3">
      {/* Floating Hearts Container */}
      <div className="absolute bottom-full left-0 w-full h-64 pointer-events-none overflow-hidden">
        {hearts.map(heart => (
          <div
            key={heart.id}
            className="absolute bottom-0 text-red-500 animate-float-heart"
            style={{ left: `${heart.left}%` }}
          >
            <span className="material-symbols-outlined text-2xl fill-red-500">favorite</span>
          </div>
        ))}
      </div>

      {/* Share Button */}
      <button
        onClick={onShare}
        className="w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all border border-white/30 shadow-lg active:scale-90"
        title="Chia sẻ"
      >
        <span className="material-symbols-outlined">share</span>
      </button>

      {/* Like Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={handleLike}
          className="w-14 h-14 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-xl active:scale-90 relative overflow-hidden"
          title="Thả tim"
        >
          <span className="material-symbols-outlined text-3xl fill-white">favorite</span>
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-white/20 blur-xl"></div>
        </button>
        <span className="text-white text-xs font-bold mt-1 drop-shadow-md">
          {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
        </span>
      </div>
    </div>
  );
};

export default LivestreamInteractions;
