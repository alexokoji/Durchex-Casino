module.exports = function override(config) {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "assert": require.resolve("assert"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": require.resolve("os-browserify"),
        "url": require.resolve("url")
    })
    config.resolve.fallback = fallback;
    // Ensure source-map-loader does not attempt to read TypeScript source maps from node_modules
    // (prevents "Failed to parse source map" warnings when packages include .map pointing to .ts files)
    try {
        const rules = config.module && config.module.rules;
        if (Array.isArray(rules)) {
            const walkSetExclude = (r) => {
                if (!r) return;
                if (r.use) {
                    const uses = Array.isArray(r.use) ? r.use : [r.use];
                    for (const u of uses) {
                        const loader = u && (u.loader || u);
                        if (typeof loader === 'string' && loader.includes('source-map-loader')) {
                            // add exclude for node_modules
                            r.exclude = r.exclude || [/node_modules/];
                        }
                    }
                }
                if (r.oneOf && Array.isArray(r.oneOf)) {
                    r.oneOf.forEach(walkSetExclude);
                }
            };
            rules.forEach(walkSetExclude);
        }
    } catch (e) {
        // ignore and continue with config as-is
    }

    return config;
}