import React from 'react';
import { css } from '@/styled-system/css';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className={css({ 
      minH: 'screen', 
      display: 'flex', 
      flexDir: 'column' 
    })}>
      <Header />
      <main className={css({ flex: 1 })}>
        {children}
      </main>
      <Footer />
    </div>
  );
};