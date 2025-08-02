class CacheManager {
    private cache: Map<string, any>;

    constructor() {
        this.cache = new Map();
    }

    setCache(key: string, value: any): void {
        this.cache.set(key, value);
    }

    getCache(key: string): any | undefined {
        return this.cache.get(key);
    }
}

export default CacheManager;