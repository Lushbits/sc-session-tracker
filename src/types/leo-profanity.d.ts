declare module 'leo-profanity' {
  interface Filter {
    /**
     * Check if a string contains profanity
     */
    check: (text: string) => boolean;
    
    /**
     * Clean profanity from a string, replacing it with a substitute
     */
    clean: (text: string, substitute?: string) => string;
    
    /**
     * Add words to the profanity list
     */
    add: (words: string | string[]) => void;
    
    /**
     * Remove words from the profanity list
     */
    remove: (words: string | string[]) => void;
    
    /**
     * Get the list of profanity words
     */
    list: () => string[];
    
    /**
     * Reset the profanity list to its default state
     */
    reset: () => void;
    
    /**
     * Clear all words from the profanity list
     */
    clearList: () => void;

    /**
     * Load a dictionary for a specific language
     */
    loadDictionary: (lang?: string) => void;
  }

  const filter: Filter;
  export default filter;
} 