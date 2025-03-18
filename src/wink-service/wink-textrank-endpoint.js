/**
 * wink-textrank-endpoint.js
 * 
 * An Express route handler that adds TextRank preprocessing capabilities to the Wink service.
 * This separates the TextRank-specific logic from the main service file for better modularity.
 */

"use strict";

/**
 * Creates a preprocessing endpoint for TextRank using wink-nlp
 * @param {Object} options - Configuration options
 * @param {Object} options.nlp - The wink-nlp instance
 * @param {Object} options.its - The wink-nlp its object
 * @param {Set} options.stopwords - Set of English stopwords
 * @returns {Function} An Express route handler
 */
function createTextRankPreprocessingEndpoint(options) {
  // [STEP 1] Extract options
  const nlp = options.nlp;
  const its = options.its;
  const stopwords = options.stopwords || new Set();
  
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
      
      // [STEP 1] Process text with winkNLP
      const doc = nlp.readDoc(text);
      
      // [STEP 2] Extract sentences
      const sentences = doc.sentences().out();
      
      // [STEP 3] Process each sentence
      const processedSentences = sentences.map((sentence, index) => {
        // Create a sentence document
        const sentDoc = nlp.readDoc(sentence);
        
        // Get tokens (words only, no punctuation)
        const tokens = sentDoc.tokens()
          .filter((tkn) => tkn.out(its.type) === 'word')
          .out();
        
        // Get normalized forms
        const normalized = sentDoc.tokens()
          .filter((tkn) => tkn.out(its.type) === 'word')
          .out(its.normal);
        
        // Get POS tags
        const posTags = sentDoc.tokens()
          .filter((tkn) => tkn.out(its.type) === 'word')
          .out(its.pos);
        
        // Filter out stopwords if requested
        let filteredTokens = tokens;
        let filteredNormalized = normalized;
        let filteredPosTags = posTags;
        
        if (removeStopwords) {
          const keepIndices = [];
          normalized.forEach((token, i) => {
            if (!stopwords.has(token.toLowerCase())) {
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
      
      // [STEP 4] Extract key terms (nouns, adjectives, proper nouns)
      // These are particularly important for TextRank
      const keyTerms = new Set();
      processedSentences.forEach(s => {
        s.normalized.forEach((token, i) => {
          // Consider nouns (NN*), adjectives (JJ*), and verbs (VB*) as key terms
          if (s.posTags[i].startsWith('NN') || 
              s.posTags[i].startsWith('JJ') || 
              s.posTags[i].startsWith('VB')) {
            keyTerms.add(token.toLowerCase());
          }
        });
      });

      // [STEP 5] Prepare result for TextRank algorithm
      res.json({
        sentences: processedSentences.map(s => s.sentence),
        processedSentences,
        keyTerms: Array.from(keyTerms),
        sentenceCount: sentences.length,
        // Include document-level sentiment if needed for weighting
        sentiment: doc.out(its.sentiment)
      });
    } catch (error) {
      console.error("Error in TextRank preprocessing:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

module.exports = createTextRankPreprocessingEndpoint;