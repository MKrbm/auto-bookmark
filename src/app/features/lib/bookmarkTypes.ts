// bookmarkTypes.ts

export interface Path {
    segments: string[];
    name: string;
  }
  
  export interface Bookmark {
    id: string;
    path: Path; 
    url: string;
  }
  