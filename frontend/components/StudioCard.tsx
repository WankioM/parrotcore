import React from 'react';
import Link from 'next/link';

interface StudioCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  variant?: 'default' | 'featured';
}

export const StudioCard: React.FC<StudioCardProps> = ({ 
  href, 
  icon, 
  title, 
  description,
  variant = 'default'
}) => {
  return (
    <Link 
      href={href} 
      className={`
        studio-card group
        ${variant === 'featured' ? 'col-span-full lg:col-span-2' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </span>
        <div className="flex-1">
          <h2 className="studio-heading text-3xl mb-3">
            {title}
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};