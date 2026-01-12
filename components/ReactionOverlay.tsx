
import React, { useEffect, useState } from 'react';

interface ReactionOverlayProps {
  emoji: string;
}

const ReactionOverlay: React.FC<ReactionOverlayProps> = ({ emoji }) => {
  const [particles, setParticles] = useState<{ id: number, x: number, y: number, size: number, delay: number }[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 100 + Math.random() * 20,
      size: 20 + Math.random() * 30,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
  }, [emoji]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
        }
        .particle {
          position: absolute;
          animation: floatUp 3s ease-out forwards;
        }
      `}</style>
      {particles.map(p => (
        <div 
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
};

export default ReactionOverlay;
