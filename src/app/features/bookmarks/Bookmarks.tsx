import { useEffect, useState } from 'react';

interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
}

export const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState<{ [url: string]: Bookmark }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchBookmarks = () => {
    chrome.runtime.sendMessage({ action: 'fetchBookmarks' }, (response) => {
      if (response && response.bookmarks) {
        setBookmarks(flattenBookmarks(response.bookmarks));
      }
    });
  };

  const flattenBookmarks = (nodes: BookmarkNode[]): { [url: string]: Bookmark } => {
    let flatMap: { [url: string]: Bookmark } = {};
    nodes.forEach((node) => {
      if (node.url && node.title !== '') {
        flatMap[node.url] = { id: node.id, title: node.title, url: node.url };
      }
      if (node.children) {
        flatMap = { ...flatMap, ...flattenBookmarks(node.children) };
      }
    });
    return flatMap;
  };
  console.log('bookmarks', bookmarks);

  //   useEffect(() => {
  //     fetchBookmarks();
  //   }, []);

  document.body.className = 'w-[25rem] h-[15rem]';

  const filteredBookmarks = Object.values(bookmarks).filter((bookmark) =>
    bookmark.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: '1rem',
          paddingRight: '1rem',
        }}
      >
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 p-2 border border-gray-300 rounded"
        />
        <button onClick={fetchBookmarks} className="mb-4 p-2 bg-blue-500 text-white rounded">
          Sync Bookmarks
        </button>
        <div
          className="custom-scrollbar"
          style={{
            display: 'flex',
            paddingLeft: '1rem',
            height: '12rem',
          }}
        >
          <ul
            className="list-disc"
            style={{
              paddingLeft: '1rem',
            }}
          >
            {filteredBookmarks.map((bookmark) => (
              <li key={bookmark.id} className="pb-2">
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                  {bookmark.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};
