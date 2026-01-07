import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

interface AudioVisualizerProps {
  variant?: 'wave' | 'ripple' | 'pulse';
  width?: number;
  height?: number;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  variant = 'wave',
  width = 400,
  height = 400,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    // Initialize PixiJS Application
    const app = new PIXI.Application();
    
    app.init({
      width,
      height,
      backgroundColor: 0x251A66,
      antialias: true,
    }).then(() => {
      if (containerRef.current && app.canvas) {
        containerRef.current.appendChild(app.canvas);
        appRef.current = app;

        const graphics = new PIXI.Graphics();
        app.stage.addChild(graphics);

        let time = 0;

        // Animation loop
        app.ticker.add(() => {
          graphics.clear();
          time += 0.05;

          if (variant === 'wave') {
            // Horizontal wave effect
            for (let i = 0; i < 50; i++) {
              const x = (i / 50) * width;
              const y = height / 2 + Math.sin(time + i * 0.2) * 50;
              const alpha = 1 - Math.abs(i - 25) / 25;
              
              graphics.circle(x, y, 20);
              graphics.fill({ color: 0xFF4500, alpha: alpha * 0.3 });
            }
          } else if (variant === 'ripple') {
            // Sound wave bars
            for (let i = 0; i < 7; i++) {
              const x = width / 2 + i * 40 - 120;
              const barHeight = 150 + Math.sin(time + i * 0.5) * 50;
              const hue = (i * 50 + time * 50) % 360;
              const color = hslToHex(hue, 80, 60);
              
              graphics.roundRect(
                x, 
                height / 2 - barHeight / 2, 
                30, 
                barHeight, 
                15
              );
              graphics.fill({ color, alpha: 0.6 });
            }
          } else if (variant === 'pulse') {
            // Center pulse with concentric circles
            const baseRadius = 80 + Math.sin(time) * 30;
            
            for (let r = baseRadius; r > 0; r -= 10) {
              const alpha = (r / baseRadius) * 0.5;
              graphics.circle(width / 2, height / 2, r);
              graphics.fill({ color: 0x00FFFF, alpha });
            }
          }
        });
      }
    });

    // Cleanup
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [variant, width, height]);

  return <div ref={containerRef} className={className} />;
};

// Helper function to convert HSL to hex
function hslToHex(h: number, s: number, l: number): number {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return parseInt(`0x${f(0)}${f(8)}${f(4)}`);
}