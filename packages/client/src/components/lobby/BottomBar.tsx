import React from 'react';

interface BottomBarProps {
  children?: React.ReactNode;
}

export const BottomBar: React.FC<BottomBarProps> = ({ children }) => (
  <div className="fixed bottom-0 left-0 w-full bg-clocktower-dark/80 border-t border-gray-700 shadow-lg z-20 flex items-center justify-between px-6 py-3">
    {children}
  </div>
);
