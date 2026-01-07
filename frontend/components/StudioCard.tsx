import React from 'react';
import Link from 'next/link';
import { css, cva } from '@/styled-system/css';
import { flex } from '@/styled-system/patterns';

interface StudioCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  variant?: 'default' | 'featured';
}

const cardStyles = cva({
  base: {
    bg: 'white',
    border: '2px solid',
    borderColor: 'gray.200',
    rounded: 'xl',
    p: 8,
    transition: 'all 0.3s',
    shadow: 'sm',
    _hover: {
      transform: 'scale(1.02)',
      borderColor: 'cayenne',
      shadow: 'xl'
    }
  },
  variants: {
    variant: {
      default: {},
      featured: {
        gridColumn: { base: 'span 1', lg: 'span 2' }
      }
    }
  }
});

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
      className={cardStyles({ variant })}
    >
      <div className={flex({ alignItems: 'flex-start', gap: 4 })}>
        <span className={css({ 
          fontSize: '5xl',
          transition: 'transform 0.3s',
          _groupHover: { transform: 'scale(1.1)' }
        })}>
          {icon}
        </span>
        <div className={css({ flex: 1 })}>
          <h2 className={css({ 
            fontSize: '3xl',
            fontWeight: 800,
            color: 'cayenne',
            letterSpacing: '-0.025em',
            mb: 3
          })}>
            {title}
          </h2>
          <p className={css({ 
            color: 'gray.600',
            fontSize: 'lg',
            lineHeight: 'relaxed'
          })}>
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};