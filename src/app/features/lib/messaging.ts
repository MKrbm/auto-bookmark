export type ExtensionMessage =
  | { action: 'fetchBookmarks' }
  | { action: 'processBookmarks' }
  | {
      type: 'SCRAPE_PAGE';
      data: {
        url: string;
        html: string;
        userTitle: string;
      };
    };

export interface ScrapeResponse {
  success: boolean;
  document?: {
    page_content: string;
    metadata: {
      url: string;
      title: string;
      userTitle: string;
    };
  };
  error?: string;
}

export interface FetchBookmarksResponse {
  bookmarks?: chrome.bookmarks.BookmarkTreeNode[];
  error?: string;
}

export interface ProcessBookmarksResponse {
  success: boolean;
  error?: string;
}

export type ExtensionResponse<T> =
  T extends { action: 'fetchBookmarks' } ? FetchBookmarksResponse :
  T extends { action: 'processBookmarks' } ? ProcessBookmarksResponse :
  T extends { type: 'SCRAPE_PAGE' } ? ScrapeResponse :
  never;

// 型付きのメッセージング関数
export function sendMessage<T extends ExtensionMessage>(
  message: T
): Promise<ExtensionResponse<T>> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response as ExtensionResponse<T>);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// コールバック版
export function sendMessageWithCallback<T extends ExtensionMessage>(
  message: T,
  callback: (response: ExtensionResponse<T>) => void
): void {
  chrome.runtime.sendMessage(message, callback as (response: any) => void);
}
