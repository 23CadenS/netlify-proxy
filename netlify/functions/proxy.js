const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const targetUrl = event.queryStringParameters.url;

    if (!targetUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing 'url' parameter" })
        };
    }

    // Check if the URL is a YouTube video link
    if (targetUrl.includes("youtube.com/watch")) {
        return {
            statusCode: 302,
            headers: {
                Location: targetUrl
            }
        };
    }

    try {
        const response = await fetch(targetUrl);
        let data = await response.text();

        // Rewrite all URLs to go through the proxy
        const baseProxyUrl = `${event.rawUrl.split('?')[0]}?url=`;
        data = data.replace(/(href|src)=["'](\/[^"']*)["']/g, (match, attr, path) => {
            return `${attr}="${baseProxyUrl}${encodeURIComponent(new URL(path, targetUrl).href)}"`;
        });

        return {
            statusCode: 200,
            body: data,
            headers: {
                "Content-Type": response.headers.get("content-type")
            }
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
