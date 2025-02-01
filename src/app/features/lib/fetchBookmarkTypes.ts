export interface FetchedBookmark {
  userid: string;
  url: string;
  path: {
    segments: string[];
    name: string;
  };
  searchStrings: string;
}
