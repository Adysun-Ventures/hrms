// This file just signals to Netlify that we're using Next.js
exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({message: "Next.js Function Working"})
  };
}; 