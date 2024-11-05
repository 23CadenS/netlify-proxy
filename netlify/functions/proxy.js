const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const targetUrl = event.queryStringParameters.url;
    
    if (!targetUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing 'url' parameter" })
        };
    }

    try {
        const response = await fetch(targetUrl);
        const data = await response.text();
        
        return {
            statusCode: 200,
            body: data
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
