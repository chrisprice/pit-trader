export default (factory) => {
    const cache = new Map();
    return (key) => {
        const cachedValue = cache.get(key);
        if (cachedValue != null) {
            return cachedValue;
        }
        const value = factory(key);
        cache.set(key, value);
        return value;
    };
};
