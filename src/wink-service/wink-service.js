/**
 * wink-service.js
 *
 * An Express service that provides English text preprocessing capabilities for TextRank summarization.
 * This service works alongside kiwi-service, providing similar preprocessing capabilities but for English text.
 * 
 * Features:
 * - Sentence splitting for unpunctuated text
 * - Text normalization
 * - Tokenization with stopword filtering
 * - Part-of-speech tagging
 * - Full preprocessing pipeline optimized for TextRank
 */

"use strict";

// [STEP 1] Import required libraries
const express = require("express");
const cors = require("cors");
const winkNLP = require("wink-nlp");
const model = require("wink-eng-lite-web-model");
const createTextRankPreprocessingEndpoint = require("./wink-textrank-endpoint");

// [STEP 2] Initialize NLP components
const nlp = winkNLP(model);
const its = nlp.its;
const as = nlp.as;

// [STEP 3] Initialize common English stopwords
// These words are often filtered out in text summarization as they add little semantic value
const englishStopwords = new Set([
  "the", "a", "an", "and", "but", "if", "or", "because", "as", "until", 
  "while", "of", "at", "by", "for", "with", "about", "against", "between",
  "into", "through", "during", "before", "after", "above", "below", "to",
  "from", "up", "down", "in", "out", "on", "off", "over", "under", "again",
  "further", "then", "once", "here", "there", "when", "where", "why", "how",
  "all", "any", "both", "each", "few", "more", "most", "other", "some", "such",
  "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
  "s", "t", "can", "will", "just", "don", "should", "now"
]);

// [STEP 4] Set up Express application
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

/**
 * [API ENDPOINT] Health Check
 * GET /
 * Provides basic service information and health status
 */
app.get("/", (req, res) => {
  try {
    res.json({ 
      service: "wink-service",
      status: "running", 
      description: "English text preprocessing service for TextRank"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * [API ENDPOINT] Health Check for Docker
 * GET /health
 * Specific endpoint for Docker healthcheck
 */
app.get("/health", (req, res) => {
  try {
    res.json({ 
      status: "healthy", 
      service: "wink-service"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * [API ENDPOINT] Sentence Splitting
 * POST /sentence-split
 * Body: { text: "..." }
 * 
 * Splits input text into sentences, handling both punctuated and unpunctuated text.
 */
app.post("/sentence-split", (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // Process text with winkNLP
    const doc = nlp.readDoc(text);
    const sentences = doc.sentences().out();
    
    res.json({ 
      sentences,
      count: sentences.length
    });
  } catch (error) {
    console.error("Error in sentence splitting:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * [API ENDPOINT] Text Normalization
 * POST /normalize
 * Body: { text: "..." }
 * 
 * Normalizes text by:
 * - Converting to lowercase
 * - Removing extra whitespace
 * - Handling contractions
 */
app.post("/normalize", (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // Process text with winkNLP
    const doc = nlp.readDoc(text);
    
    // Get normalized tokens and join back to text
    const normalizedTokens = doc.tokens().out(its.normal);
    const normalizedText = normalizedTokens.join(' ');
    
    res.json({ 
      original: text,
      normalized: normalizedText
    });
  } catch (error) {
    console.error("Error in text normalization:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * [API ENDPOINT] Tokenization
 * POST /tokenize
 * Body: { text: "...", removeStopwords: true/false }
 * 
 * Tokenizes text and optionally removes stopwords.
 */
app.post("/tokenize", (req, res) => {
  try {
    const { text, removeStopwords = false } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // Process text with winkNLP
    const doc = nlp.readDoc(text);
    
    // Get all tokens
    let tokens = doc.tokens().out();
    
    // Optional: filter out punctuation and whitespace if needed
    tokens = tokens.filter(token => doc.tokens().itemAt(tokens.indexOf(token)).out(its.type) === 'word');
    
    // Optional: remove stopwords if requested
    if (removeStopwords) {
      tokens = tokens.filter(token => !englishStopwords.has(token.toLowerCase()));
    }

    res.json({ 
      tokens,
      count: tokens.length
    });
  } catch (error) {
    console.error("Error in tokenization:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * [API ENDPOINT] Part-of-Speech Tagging
 * POST /pos
 * Body: { text: "..." }
 * 
 * Tags each token with its part of speech.
 */
app.post("/pos", (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // Process text with winkNLP
    const doc = nlp.readDoc(text);
    
    // Get tokens and their POS tags
    const tokens = doc.tokens().out();
    const posTags = doc.tokens().out(its.pos);
    
    // Combine tokens and tags
    const result = tokens.map((token, i) => ({
      token,
      pos: posTags[i]
    }));

    res.json({ result });
  } catch (error) {
    console.error("Error in POS tagging:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * [API ENDPOINT] Complete Preprocessing for TextRank
 * POST /preprocess-for-textrank
 * Body: { text: "...", removeStopwords: true/false }
 * 
 * Performs a complete preprocessing pipeline optimized for TextRank using
 * the extracted module for better modularity and consistency with kiwi-service.
 */
app.post(
  "/preprocess-for-textrank",
  createTextRankPreprocessingEndpoint({ 
    nlp, 
    its, 
    stopwords: englishStopwords 
  })
);

// [STEP 5] Start the service
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Wink NLP service running on port ${PORT}`);
}); 