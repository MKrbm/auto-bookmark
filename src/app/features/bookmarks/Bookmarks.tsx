import { useEffect, useState } from 'react';

interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

export const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    // Fetch bookmarks from Chrome
    console.log('fetching bookmarks');
    const fetchBookmarks = () => {
      chrome.runtime.sendMessage({ action: 'fetchBookmarks' }, (response) => {
        if (response && response.bookmarks) {
          // console.log("bookmarks", response.bookmarks);
          setBookmarks(flattenBookmarks(response.bookmarks));
        }
      });
    };

    const flattenBookmarks = (nodes: BookmarkNode[]): BookmarkNode[] => {
      let flatList: BookmarkNode[] = [];
      nodes.forEach((node) => {
        flatList.push({ id: node.id, title: node.title, url: node.url });
        if (node.children) {
          flatList = flatList.concat(flattenBookmarks(node.children));
        }
      });
      return flatList;
    };

    fetchBookmarks();
  }, []);

  document.body.className = 'w-[25rem] h-[15rem]';

  const filteredBookmarks = bookmarks.filter((bookmark) =>
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
                {' '}
                {/* Added padding to the list items */}
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
