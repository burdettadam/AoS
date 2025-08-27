import React from 'react';
import { Link } from 'react-router-dom';

const Navigation: React.FC = () => {
  return (
    <nav className="bg-clocktower-dark border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-medieval font-bold text-clocktower-accent">
            BotC Digital
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
              About
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
