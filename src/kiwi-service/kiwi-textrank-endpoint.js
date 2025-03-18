/**
 * kiwi-textrank-endpoint.js
 * 
 * An Express route handler that adds TextRank preprocessing capabilities to the Kiwi service.
 * This can be imported and used in the main kiwi-service.js file.
 */

"use strict";

/**
 * Creates a preprocessing endpoint for TextRank using Kiwi
 * @param {Object} options - Configuration options
 * @param {Object} options.kiwi - The Kiwi instance for Korean text processing
 * @returns {Function} An Express route handler
 */
function createTextRankPreprocessingEndpoint(options) {
  // [STEP 1] Extract options
  const kiwi = options.kiwi;
  
  // [STEP 2] Korean stopwords commonly filtered in text summarization
  // These words add little semantic value to the text
  const koreanStopwords = new Set([
    "이", "그", "저", "것", "수", "등", "들", "및", "에", "에서", "의", "을", "를", 
    "이다", "있다", "하다", "이런", "그런", "저런", "한", "이", "그", "저", "와", "과", 
    "으로", "로", "에게", "뿐", "다", "도", "만", "까지", "에는", "랑", "이라", "며", 
    "거나", "에도", "든지"
  ]);
  
  /**
   * Express route handler for TextRank preprocessing
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  return function preprocessForTextRank(req, res) {
    try {
      const { text, removeStopwords = true } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }
      
      // [STEP 3] Analyze text with Kiwi
      // This performs morphological analysis on the Korean text
      const result = kiwi.analyze(text);
      
      // [STEP 4] Extract sentences
      // If Kiwi doesn't provide direct sentence splitting, use a simple approach
      const sentences = text.split(/(?<=[.!?…])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      // [STEP 5] Process each sentence
      const processedSentences = sentences.map((sentence, index) => {
        // Analyze the sentence
        const sentenceAnalysis = kiwi.analyze(sentence);
        
        // Extract tokens, normalized forms, and POS tags
        const tokens = [];
        const normalized = [];
        const posTags = [];
        
        // Process morphemes from the analysis
        sentenceAnalysis.forEach(token => {
          token.forEach(morpheme => {
            // morpheme[0] is the token, morpheme[1] is the POS tag
            tokens.push(morpheme[0]);
            normalized.push(morpheme[0].toLowerCase());
            posTags.push(morpheme[1]);
          });
        });
        
        // Filter out stopwords if requested
        let filteredTokens = tokens;
        let filteredNormalized = normalized;
        let filteredPosTags = posTags;
        
        if (removeStopwords) {
          const keepIndices = [];
          normalized.forEach((token, i) => {
            if (!koreanStopwords.has(token)) {
              keepIndices.push(i);
            }
          });
          
          filteredTokens = keepIndices.map(i => tokens[i]);
          filteredNormalized = keepIndices.map(i => normalized[i]);
          filteredPosTags = keepIndices.map(i => posTags[i]);
        }
        
        // Return structured sentence data
        return {
          index,
          sentence,
          tokens: filteredTokens,
          normalized: filteredNormalized,
          posTags: filteredPosTags
        };
      });
      
      // [STEP 6] Extract key terms (nouns, verbs, adjectives)
      // These are particularly important for TextRank
      const keyTerms = new Set();
      processedSentences.forEach(s => {
        s.posTags.forEach((tag, i) => {
          // Consider nouns (N*), verbs (V*), and adjectives (VA) as key terms
          // Kiwi POS tags reference: https://github.com/bab2min/Kiwi#pos-table
          if (tag.startsWith('N') || tag.startsWith('V') || tag === 'VA') {
            keyTerms.add(s.normalized[i]);
          }
        });
      });
      
      // [STEP 7] Prepare result for TextRank algorithm
      res.json({
        sentences: processedSentences.map(s => s.sentence),
        processedSentences,
        keyTerms: Array.from(keyTerms),
        sentenceCount: sentences.length
      });
    } catch (error) {
      console.error("Error in TextRank preprocessing:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

module.exports = createTextRankPreprocessingEndpoint; 