import { useEffect, useState } from 'react';
import { Bookmarks } from '../app/features/bookmarks';

const Popup = () => {
  document.body.className = 'w-[25rem] h-[15rem]';

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '0.5rem',
          fontSize: '1rem',
          fontWeight: 'bold',
          color: '#000',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        Auto-Bookmark
      </div>
      <Bookmarks />
    </>
  );
};

export default Popup;
