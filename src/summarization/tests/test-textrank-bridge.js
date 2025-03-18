/**
 * test-textrank-bridge.js
 * 
 * This script tests the TextRankBridge module to verify it works correctly
 * with both Korean and English language services.
 */

"use strict";

const TextRankBridge = require('../textrank-bridge');
const axios = require('axios');

// Mock URLs to test
const KIWI_SERVICE_URL = 'http://localhost:3000';
const WINK_SERVICE_URL = 'http://localhost:3001';

// Create sample texts
const koreanText = '한국어 텍스트 요약 시스템을 테스트합니다. 이 시스템은 한국어와 영어를 모두 지원합니다. 확장된 TextRank 알고리즘을 사용하여 문서를 요약합니다.';
const englishText = 'This is a test of the text summarization system. The system supports both Korean and English languages. It uses an extended TextRank algorithm to summarize documents.';

// Test function
async function runTests() {
  console.log('=== TextRankBridge Test ===');
  
  try {
    // First, check if services are running
    console.log('\n[TEST 1] Checking if services are running...');
    
    try {
      // Check Kiwi service
      const kiwiHealth = await axios.get(`${KIWI_SERVICE_URL}/health`);
      console.log(`✅ Kiwi service is running: ${JSON.stringify(kiwiHealth.data)}`);
    } catch (error) {
      console.error(`❌ Kiwi service is not running: ${error.message}`);
      console.log('⚠️ Make sure Kiwi service is running on http://localhost:3000');
    }
    
    try {
      // Check Wink service
      const winkHealth = await axios.get(`${WINK_SERVICE_URL}/health`);
      console.log(`✅ Wink service is running: ${JSON.stringify(winkHealth.data)}`);
    } catch (error) {
      console.error(`❌ Wink service is not running: ${error.message}`);
      console.log('⚠️ Make sure Wink service is running on http://localhost:3001');
    }
    
    // Initialize TextRankBridge
    const bridge = new TextRankBridge({
      kiwiServiceUrl: KIWI_SERVICE_URL,
      winkServiceUrl: WINK_SERVICE_URL
    });
    
    // Test language detection
    console.log('\n[TEST 2] Testing language detection...');
    const koreanLang = bridge.detectLanguage(koreanText);
    const englishLang = bridge.detectLanguage(englishText);
    
    console.log(`Korean text detected as: ${koreanLang}`);
    console.log(`English text detected as: ${englishLang}`);
    
    if (koreanLang === 'ko' && englishLang === 'en') {
      console.log('✅ Language detection works correctly');
    } else {
      console.error('❌ Language detection failed');
    }
    
    // Test preprocessing
    console.log('\n[TEST 3] Testing preprocessing...');
    try {
      const koreanPreprocessed = await bridge.preprocessText(koreanText, 'ko');
      console.log('✅ Korean preprocessing successful:');
      console.log(`- Sentences: ${koreanPreprocessed.sentences.length}`);
      console.log(`- Key terms: ${koreanPreprocessed.keyTerms ? koreanPreprocessed.keyTerms.length : 0}`);
    } catch (error) {
      console.error(`❌ Korean preprocessing failed: ${error.message}`);
    }
    
    try {
      const englishPreprocessed = await bridge.preprocessText(englishText, 'en');
      console.log('✅ English preprocessing successful:');
      console.log(`- Sentences: ${englishPreprocessed.sentences.length}`);
      console.log(`- Key terms: ${englishPreprocessed.keyTerms ? englishPreprocessed.keyTerms.length : 0}`);
    } catch (error) {
      console.error(`❌ English preprocessing failed: ${error.message}`);
    }
    
    // Test summarization
    console.log('\n[TEST 4] Testing summarization...');
    try {
      const koreanSummary = await bridge.summarize(koreanText);
      console.log('✅ Korean summarization successful:');
      console.log(`- Original: ${koreanText}`);
      console.log(`- Summary: ${koreanSummary.summary}`);
      console.log(`- Damping factor: ${koreanSummary.algorithm.dampingFactor}`);
    } catch (error) {
      console.error(`❌ Korean summarization failed: ${error.message}`);
    }
    
    try {
      const englishSummary = await bridge.summarize(englishText);
      console.log('✅ English summarization successful:');
      console.log(`- Original: ${englishText}`);
      console.log(`- Summary: ${englishSummary.summary}`);
      console.log(`- Damping factor: ${englishSummary.algorithm.dampingFactor}`);
    } catch (error) {
      console.error(`❌ English summarization failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

// Run the tests
runTests().catch(console.error); 