/**
 * n8n-textrank-node-example.js
 * 
 * An example n8n Code node that performs TextRank summarization using the TextRankBridge
 */

// This code would be placed in an n8n Code node

// Import the TextRankBridge
// Note: In n8n, you'll need to make sure this module is installed and accessible
const TextRankBridge = require("./src/summarization/textrank-bridge");

// Create a new TextRankBridge instance
const textRankBridge = new TextRankBridge({
  kiwiServiceUrl: "http://kiwi-service:3000",
  winkServiceUrl: "http://wink-service:3001"
});

// Get the input text from the previous node
const inputText = items[0].json.text;

// Get desired summary length
const numSentences = items[0].json.numSentences || 3;

// Process text and return summary
return textRankBridge.summarize(inputText, numSentences, {
  dynamicDamping: true
})
.then(result => {
  // Return the result to be used in subsequent nodes
  return {
    json: {
      summary: result.summary,
      language: result.language,
      reduction: result.reduction,
      originalSentences: result.sentences.original,
      summarySentences: result.sentences.summary
    }
  };
})
.catch(error => {
  console.error("Summarization error:", error.message);
  throw new Error(`Failed to summarize text: ${error.message}`);
});