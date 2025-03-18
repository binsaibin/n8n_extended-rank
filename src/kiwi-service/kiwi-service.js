/**
 * kiwi-service.js
 *
 * A Node.js Express service that exposes endpoints for morphological analysis (Korean),
 * sentence splitting, tokenization, and an optional combined "preprocess" route
 * for extended text processing. Adapt or split endpoints as needed.
 */

"use strict";

const path = require("path");
const express = require("express");

// [STEP 1] Import kiwi addon and TextRank preprocessing endpoint creator
const kiwiAddon = require("./kiwi_addon");
const createTextRankPreprocessingEndpoint = null;

// [STEP 2] Create a Kiwi instance pointing to your model directory:
const kiwi = new kiwiAddon.KiwiBuilder("/app/models");

// [STEP 3] Initialize Express application
const app = express();
app.use(express.json({ limit: '50mb' }));

// [STEP 4] Define API endpoints

/**
 * 1) Morphological Analysis (Korean)
 *    POST /morpheme
 *    Body: { text: "..." }
 *    Returns Kiwi morphological analysis results
 */
app.post("/morpheme", (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // Kiwi morphological analysis
    const result = kiwi.analyze(text);
    // result is typically an array of morphs, POS tags, etc.
    res.json({ result });
  } catch (error) {
    console.error("Error in morphological analysis:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2) Sentence Split
 *    POST /sentence-split
 *    Body: { text: "..." }
 *
 *    Uses Kiwi's analysis plus regex patterns to split Korean text into sentences
 */
app.post("/sentence-split", (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // Kiwi might not have an official "splitSentences" method, but you can approximate:
    // One approach: use kiwi.analyze(text) and then chunk by sentence-ending punctuation.
    // For demonstration, we do a simplistic approach:
    const splitted = text.split(/(?<=[.?!])\s+/);
    const sentences = splitted.filter((s) => s.trim().length > 0);

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
 * 3) Tokenization
 *    POST /tokenize
 *    Body: { text: "..." }
 *
 *    Uses Kiwi morphological analysis to return token lists
 */
app.post("/tokenize", (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // Kiwi approach: morphological analysis => get tokens
    const analysis = kiwi.analyze(text);
    let tokens = [];

    // Flatten the analysis to get just token strings
    analysis.forEach((sentenceAnalysis) => {
      sentenceAnalysis.forEach((tokenObj) => {
        // e.g., tokenObj might have structure: [ 'token', 'POS', '...']
        tokens.push(tokenObj[0]);
      });
    });

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
 * 4) Extended Preprocessing - for general NLP tasks (Korean specific)
 *    POST /preprocess
 *    Body: { text: "..." }
 */
app.post("/preprocess", (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // 1) Split sentences
    const splitted = text.split(/(?<=[.?!])\s+/);
    const sentences = splitted.filter((s) => s.trim().length > 0);

    // 2) Tokenize each sentence with Kiwi
    const tokenized = [];
    sentences.forEach((sent) => {
      const analysis = kiwi.analyze(sent);
      const tokensInThisSentence = [];
      analysis.forEach((sentenceAnalysis) => {
        sentenceAnalysis.forEach((tokenObj) => {
          tokensInThisSentence.push(tokenObj[0]);
        });
      });
      tokenized.push(tokensInThisSentence);
    });

    // 3) Return preprocessed data
    res.json({
      sentences,
      tokenized
    });
  } catch (error) {
    console.error("Error in preprocessing:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5) TextRank Preprocessing - specifically optimized for TextRank summarization
 *    POST /preprocess-for-textrank
 *    Body: { text: "...", removeStopwords: true/false }
 */
app.post(
  "/preprocess-for-textrank", 
  createTextRankPreprocessingEndpoint
);

/**
 * 6) Health Check Endpoint
 *    GET /
 *    Returns service information
 */
app.get("/", (req, res) => {
  try {
    res.json({ 
      service: "kiwi-service",
      status: "running", 
      description: "Korean text preprocessing service for NLP and TextRank summarization"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start the service
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`kiwi-service running on port ${PORT}`);
});

