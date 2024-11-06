
const fetch = require('node-fetch');
const cache = new Map(); // Simple in-memory cache

exports.handler = async function(event, context) {
    const targetUrl = event.queryStringParameters.url;

    if (!targetUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing 'url' parameter" })
        };
    }

    // Use cache for faster repeated requests
    if (cache.has(targetUrl)) {
        return {
            statusCode: 200,
            body: cache.get(targetUrl).data,
            headers: cache.get(targetUrl).headers
        };
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Netlify-Proxy/1.0)',
                'Accept': '*/*',
            }
        });

        // Check if the response is OK
        if (!response.ok) {
            throw new Error(`Error fetching the URL: ${response.statusText}`);
        }

        let data = await response.text();

        // Rewrite all URLs to go through the proxy
        const baseProxyUrl = `${event.rawUrl.split('?')[0]}?url=`;
        data = data.replace(/(href|src)=["'](\/[^"']*)["']/g, (match, attr, path) => {
            return `${attr}="${baseProxyUrl}${encodeURIComponent(new URL(path, targetUrl).href)}"`;
        });

        // Set response headers
        const headers = {
            "Content-Type": response.headers.get("content-type") || "text/html",
            "Cache-Control": "max-age=300"  // Cache control for client-side caching
        };

        // Cache the response
        cache.set(targetUrl, { data, headers });

        return {
            statusCode: 200,
            body: data,
            headers: headers
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
