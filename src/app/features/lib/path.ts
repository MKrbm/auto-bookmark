// path.ts
// Defines the Path interface and a helper function to create a Path object.

export interface Path {
    segments: string[];
  
    /** Returns a /-delimited string of all segments. */
    toString(includeRoot?: boolean): string;
  
    /** Returns the parent path (all but last segment). */
    parents(): Path;
  
    /**
     * Returns the last segment (similar to Python's Path.name).
     * If segments is empty, returns empty string.
     */
    readonly name: string;
  }
  
  /**
   * Helper to create a Path from an array of segments.
   */
  export function createPath(segments: string[]): Path {
    return {
      segments,
  
      get name() {
        return segments.length > 0 ? segments[segments.length - 1] : '';
      },
  
      toString(includeRoot: boolean = false) {
        return includeRoot ? segments.join('/') : segments.slice(1).join('/');
      },
  
      parents() {
        if (segments.length === 0) {
          return createPath([]);
        }
        return createPath(segments.slice(0, -1));
      },
    };
  }
  