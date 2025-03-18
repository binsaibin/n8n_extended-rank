/**
 * textrank-bridge.js
 * 
 * A bridge module to connect n8n with language services (kiwi/wink) and node-summarizer.
 * This module orchestrates the process of:
 * 1. Detecting the language of input text
 * 2. Sending text to the appropriate language service for preprocessing
 * 3. Using node-summarizer to create a summary with the preprocessed text
 * 
 * The module implements the Extended TextRank algorithm with dynamic damping factors.
 */

"use strict";

// [STEP 1] Import required dependencies
const axios = require('axios');
const { SummarizerManager } = require('node-summarizer');

/**
 * @class TextRankBridge
 * @description A bridge class for connecting language services with node-summarizer.
 */
class TextRankBridge {
  /**
   * Creates an instance of TextRankBridge.
   * @param {Object} options - Configuration options
   * @param {string} options.kiwiServiceUrl - URL for the Korean language service
   * @param {string} options.winkServiceUrl - URL for the English language service
   */
  constructor(options = {}) {
    // [STEP 1.1] Initialize service URLs
    this.kiwiServiceUrl = options.kiwiServiceUrl || 'http://kiwi-service:3000';
    this.winkServiceUrl = options.winkServiceUrl || 'http://wink-service:3001';
    
    // [STEP 1.2] Initialize summarizer
    this.summarizer = new SummarizerManager();
  }

  /**
   * Detects the language of the input text.
   * @param {string} text - The text to analyze
   * @returns {string} The detected language code ('ko' or 'en')
   */
  detectLanguage(text) {
    // [STEP 2.1] Simple language detection based on character set
    // Count Korean characters (Hangul)
    const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
    
    // If more than 10% of the text contains Korean characters, assume it's Korean
    const threshold = text.length * 0.1;
    return koreanChars > threshold ? 'ko' : 'en';
  }

  /**
   * Preprocesses text using the appropriate language service.
   * @param {string} text - The text to preprocess
   * @param {string} language - The language code ('ko' or 'en')
   * @returns {Promise<Object>} The preprocessed text data
   */
  async preprocessText(text, language) {
    try {
      // [STEP 2.2] Select the appropriate language service
      const serviceUrl = language === 'ko' 
        ? `${this.kiwiServiceUrl}/preprocess-for-textrank`
        : `${this.winkServiceUrl}/preprocess-for-textrank`;
      
      // [STEP 2.3] Call the language service for preprocessing
      const response = await axios.post(serviceUrl, { 
        text, 
        removeStopwords: true
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error preprocessing text: ${error.message}`);
      throw new Error(`Preprocessing failed: ${error.message}`);
    }
  }

  /**
   * Calculates a dynamic damping factor based on text characteristics.
   * @param {Object} preprocessedData - The preprocessed text data
   * @returns {number} The calculated damping factor
   */
  calculateDynamicDampingFactor(preprocessedData) {
    // [STEP 3.1] Basic damping factor (default PageRank value is 0.85)
    let dampingFactor = 0.85;
    
    // [STEP 3.2] Adjust based on text characteristics
    
    // Shorter texts need higher damping for more connectivity
    const sentenceCount = preprocessedData.sentenceCount;
    if (sentenceCount < 5) {
      dampingFactor += 0.05; // Increase connectivity for very short texts
    } else if (sentenceCount > 20) {
      dampingFactor -= 0.05; // Decrease connectivity for very long texts
    }
    
    // If we have key terms, use them to further adjust the damping factor
    // More key terms suggest more topical diversity, which may need higher connectivity
    if (preprocessedData.keyTerms) {
      const keyTermRatio = preprocessedData.keyTerms.length / sentenceCount;
      if (keyTermRatio > 3) {
        dampingFactor -= 0.03; // Many key terms per sentence - lower connectivity
      } else if (keyTermRatio < 1) {
        dampingFactor += 0.03; // Few key terms per sentence - higher connectivity
      }
    }
    
    // Ensure damping factor stays in reasonable bounds
    return Math.max(0.7, Math.min(0.95, dampingFactor));
  }

  /**
   * Summarizes text using the Extended TextRank algorithm.
   * @param {string} text - The text to summarize
   * @param {Object} options - Summarization options
   * @param {number} options.ratio - The target length ratio (0-1) of the summary
   * @param {string} options.language - The language code ('ko', 'en', or 'auto')
   * @returns {Promise<Object>} The summary and metadata
   */
  async summarize(text, options = {}) {
    try {
      // [STEP 4.1] Set default options
      const ratio = options.ratio || 0.3; // Default to 30% of original text
      let language = options.language || 'auto';
      
      // [STEP 4.2] Detect language if set to auto
      if (language === 'auto') {
        language = this.detectLanguage(text);
      }
      
      // [STEP 4.3] Preprocess text with the appropriate language service
      const preprocessedData = await this.preprocessText(text, language);
      
      // [STEP 4.4] Calculate dynamic damping factor
      const dampingFactor = this.calculateDynamicDampingFactor(preprocessedData);
      
      // [STEP 4.5] Determine number of sentences for the summary
      const sentenceCount = preprocessedData.sentenceCount;
      const targetSentences = Math.max(1, Math.round(sentenceCount * ratio));
      
      // [STEP 4.6] Use node-summarizer with TextRank method
      // Create configuration with dynamic parameters
      const summarizerConfig = {
        type: 'TextRank',
        sentences: targetSentences,
        // The TextRank algorithm needs a minimum number of sentences to work effectively
        min_length: Math.min(3, sentenceCount), 
        ideal_length: targetSentences,
        max_length: Math.min(targetSentences + 2, sentenceCount),
        custom_options: {
          damping_factor: dampingFactor,
        }
      };
      
      // [STEP 4.7] Generate summary using node-summarizer
      const result = this.summarizer.getSummaryByRawData({
        title: '',
        text: text, // We use original text but with our custom preprocessing
        options: summarizerConfig
      });
      
      // [STEP 4.8] Return the summary and metadata
      return {
        summary: result.summary,
        originalText: text,
        language,
        originalLength: text.length,
        summaryLength: result.summary.length,
        ratio: result.summary.length / text.length,
        sentences: {
          original: sentenceCount,
          summary: targetSentences
        },
        preprocessed: preprocessedData,
        algorithm: {
          name: 'Extended TextRank',
          dampingFactor
        }
      };
    } catch (error) {
      console.error(`Error summarizing text: ${error.message}`);
      throw new Error(`Summarization failed: ${error.message}`);
    }
  }
}

module.exports = TextRankBridge; 