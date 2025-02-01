declare namespace chrome {
  namespace runtime {
    interface GetContextsOptions {
      contextTypes: Array<'OFFSCREEN'>;
    }

    interface ExtensionContext {
      contextType: 'OFFSCREEN';
      contextId: string;
    }

    interface ScrapeResponse {
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

    interface FetchBookmarksResponse {
      bookmarks?: chrome.bookmarks.BookmarkTreeNode[];
      error?: string;
    }

    interface ProcessBookmarksResponse {
      success: boolean;
      error?: string;
    }

    interface LastError {
      message?: string;
    }

    interface MessageSender {
      id?: string;
      tab?: chrome.tabs.Tab;
      frameId?: number;
      url?: string;
      origin?: string;
    }

    const lastError: LastError | undefined;

    function getContexts(options: GetContextsOptions): Promise<ExtensionContext[]>;
    type ExtensionMessage =
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

    type ExtensionResponse<T> =
      T extends { action: 'fetchBookmarks' } ? FetchBookmarksResponse :
      T extends { action: 'processBookmarks' } ? ProcessBookmarksResponse :
      T extends { type: 'SCRAPE_PAGE' } ? ScrapeResponse :
      never;

    // コールバック版
    function sendMessage<T extends ExtensionMessage>(
      message: T,
      responseCallback: (response: ExtensionResponse<T>) => void
    ): void;

    // Promise版
    function sendMessage<T extends ExtensionMessage>(message: T): Promise<ExtensionResponse<T>>;

    const onMessage: {
      addListener(
        callback: (
          message: ExtensionMessage,
          sender: MessageSender,
          sendResponse: (response: ExtensionResponse<typeof message>) => void
        ) => void | boolean
      ): void;
    };
  }

  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | object | null): Promise<{ [key: string]: any }>;
      set(items: object): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    }

    const local: StorageArea;
    const sync: StorageArea;
  }

  namespace bookmarks {
    interface BookmarkTreeNode {
      id: string;
      parentId?: string;
      index?: number;
      url?: string;
      title: string;
      dateAdded?: number;
      dateGroupModified?: number;
      children?: BookmarkTreeNode[];
    }
  }

  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      favIconUrl?: string;
      status?: string;
      active: boolean;
      windowId: number;
    }
  }

  namespace offscreen {
    interface CreateDocumentOptions {
      url: string;
      reasons: Array<'DOM_MANIPULATION'>;
      justification: string;
    }

    function createDocument(options: CreateDocumentOptions): Promise<void>;
  }
}
