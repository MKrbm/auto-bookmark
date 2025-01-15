import React from 'react';
import { Bookmarks } from '../app/features/components/Bookmarks';

const Popup = () => {
  // Remove any old classes
  document.body.className = '';
  // Force body to be white (so margin around the gray "card" is visible).

  return (
    <div className="h-full bg-gray-100">
      <h1 className="text-xl font-bold text-center bg-red-50 mb-4">
        Auto-Bookmark3
      </h1>
      <Bookmarks/>
    </div>
  );
};

export default Popup;
