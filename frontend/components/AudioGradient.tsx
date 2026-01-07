import React from 'react';

interface AudioGradientProps {
  variant?: 'wave' | 'ripple' | 'pulse' | 'echo' | 'spectrum';
  size?: number;
  className?: string;
}

export const AudioGradient: React.FC<AudioGradientProps> = ({ 
  variant = 'wave', 
  size = 200,
  className = '' 
}) => {
  const gradients = {
    // Horizontal wave (top left)
    wave: (
      <svg width={size} height={size} viewBox="0 0 200 200" className={className}>
        <defs>
          <radialGradient id="wave-gradient">
            <stop offset="0%" stopColor="#4B0082" />
            <stop offset="30%" stopColor="#FF4500" />
            <stop offset="60%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FF1493" />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="100" rx="80" ry="60" fill="url(#wave-gradient)" opacity="0.8" />
      </svg>
    ),

    // Sound wave bars (top right)
    ripple: (
      <svg width={size} height={size} viewBox="0 0 200 200" className={className}>
        <defs>
          <radialGradient id="ripple-gradient">
            <stop offset="0%" stopColor="#00FFFF" />
            <stop offset="40%" stopColor="#FF4500" />
            <stop offset="80%" stopColor="#FF1493" />
          </radialGradient>
        </defs>
        {[...Array(7)].map((_, i) => (
          <ellipse 
            key={i}
            cx={100 + i * 12} 
            cy="100" 
            rx="6" 
            ry={80 - i * 10} 
            fill="url(#ripple-gradient)" 
            opacity={0.7 - i * 0.08}
          />
        ))}
      </svg>
    ),

    // Center pulse variations (middle row)
    pulse: (
      <svg width={size} height={size} viewBox="0 0 200 200" className={className}>
        <defs>
          <radialGradient id="pulse-gradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#00FFFF" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FF4500" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="70" fill="url(#pulse-gradient)" opacity="0.9" />
      </svg>
    ),

    // 3D echo effect (bottom middle)
    echo: (
      <svg width={size} height={size} viewBox="0 0 200 200" className={className}>
        <defs>
          <linearGradient id="echo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B9D" />
            <stop offset="30%" stopColor="#C724B1" />
            <stop offset="70%" stopColor="#6C5CE7" />
            <stop offset="100%" stopColor="#0984E3" />
          </linearGradient>
        </defs>
        {[...Array(6)].map((_, i) => (
          <ellipse 
            key={i}
            cx={60 + i * 20} 
            cy="100" 
            rx={30 - i * 3} 
            ry={50 - i * 5} 
            fill="url(#echo-gradient)" 
            opacity={0.8 - i * 0.1}
          />
        ))}
      </svg>
    ),

    // Speaker cones (bottom)
    spectrum: (
      <svg width={size} height={size} viewBox="0 0 200 200" className={className}>
        <defs>
          <radialGradient id="spectrum-gradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#E8F5E9" />
            <stop offset="30%" stopColor="#81C784" />
            <stop offset="60%" stopColor="#FF9800" />
            <stop offset="100%" stopColor="#E91E63" />
          </radialGradient>
        </defs>
        {[...Array(4)].map((_, i) => (
          <path
            key={i}
            d={`M ${50 + i * 30} 100 Q ${60 + i * 30} 50, ${80 + i * 30} 100 Q ${60 + i * 30} 150, ${50 + i * 30} 100`}
            fill="url(#spectrum-gradient)"
            opacity={0.7 - i * 0.1}
          />
        ))}
      </svg>
    ),
  };

  return gradients[variant];
};