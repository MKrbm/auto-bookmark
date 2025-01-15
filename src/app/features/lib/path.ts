// path.ts
// Defines the Path interface and a helper function to create a Path object.

export interface Path {
    segments: string[];

    /** Returns a /-delimited string of all segments. */
    toString(): string;

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

        toString() {
            return segments.join('/');
        },
    };
}
