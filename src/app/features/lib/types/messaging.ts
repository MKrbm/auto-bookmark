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

// モジュール拡張を使用して型を拡張
declare module 'chrome' {
  export namespace runtime {
    export function sendMessage<T extends ExtensionMessage>(
      message: T
    ): Promise<ExtensionResponse<T>>;
    export function sendMessage<T extends ExtensionMessage>(
      message: T,
      responseCallback: (response: ExtensionResponse<T>) => void
    ): void;
  }
}

// 型のエクスポート
export type { ExtensionMessage, ExtensionResponse };
