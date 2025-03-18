/**
 * Wink Service Test Script
 * 
 * This script tests the wink-service for English language processing.
 * It sends HTTP requests to the wink-service API and validates the responses.
 */

const axios = require('axios');
const assert = require('assert');

// Configuration
const WINK_SERVICE_URL = process.env.WINK_SERVICE_URL || 'http://localhost:3001';

// Test data
const testCases = [
  // 서비스 상태 테스트
  {
    input: null,
    description: 'Health check endpoint',
    endpoint: '/health',
    method: 'GET'
  },
  {
    input: null,
    description: 'Root endpoint with service info',
    endpoint: '/',
    method: 'GET'
  },
  // 기본 기능 테스트
  {
    input: 'Hello world! This is a test for text summarization system.',
    description: 'Basic English greeting and introduction',
    endpoint: '/tokenize',
    method: 'POST'
  },
  {
    input: 'Natural Language Processing is an interdisciplinary field that combines computer science, artificial intelligence, and linguistics.',
    description: 'Technical English sentence about NLP',
    endpoint: '/tokenize',
    method: 'POST'
  },
  {
    input: 'The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet.',
    description: 'English pangram for tokenization test',
    endpoint: '/tokenize',
    method: 'POST'
  },
  // 정규화 테스트
  {
    input: 'Text summarization is the process of creating a short, accurate, and fluent summary of a longer text document.',
    description: 'English sentence about text summarization',
    endpoint: '/normalize',
    method: 'POST'
  },
  // 문장 분리 테스트
  {
    input: 'Hello! How are you today? I am doing well. Thank you for asking.',
    description: 'Sentence splitting test',
    endpoint: '/sentence-split',
    method: 'POST'
  },
  // 품사 태깅 테스트
  {
    input: 'The quick brown fox jumps over the lazy dog.',
    description: 'Part-of-speech tagging test',
    endpoint: '/pos',
    method: 'POST'
  },
  // TextRank 전처리 테스트
  {
    input: 'Artificial intelligence is a technology that allows computers to mimic human intelligence. Machine learning is a subset of AI that learns from data. Deep learning is an advanced form of machine learning that uses neural networks.',
    description: 'Test TextRank preprocessing functionality',
    endpoint: '/preprocess-for-textrank',
    method: 'POST',
    options: { removeStopwords: true }
  },
  // 에러 케이스 테스트
  {
    input: '',
    description: 'Empty text error case',
    endpoint: '/preprocess-for-textrank',
    method: 'POST',
    options: { removeStopwords: true },
    expectedError: true,
    expectedStatus: 400
  },
  {
    input: null,
    description: 'Null text error case',
    endpoint: '/preprocess-for-textrank',
    method: 'POST',
    options: { removeStopwords: true },
    expectedError: true,
    expectedStatus: 400
  },
  {
    input: 123,
    description: 'Invalid text type error case',
    endpoint: '/preprocess-for-textrank',
    method: 'POST',
    options: { removeStopwords: true },
    expectedError: true,
    expectedStatus: 400
  }
];

// Main test function
async function runTests() {
  console.log('🔍 Starting Wink Service Tests...\n');

  for (const [index, test] of testCases.entries()) {
    console.log(`Test Case ${index + 1}: ${test.description}`);
    if (test.input !== null) console.log(`Input: "${test.input}"`);
    console.log(`Endpoint: ${test.method} ${test.endpoint}`);
    
    try {
      // Send request to wink-service
      let response;
      if (test.method === 'GET') {
        response = await axios.get(`${WINK_SERVICE_URL}${test.endpoint}`);
      } else {
        response = await axios.post(`${WINK_SERVICE_URL}${test.endpoint}`, {
          text: test.input,
          ...test.options
        });
      }
      
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      // Basic validation
      if (test.expectedError) {
        throw new Error('Expected error but got success response');
      }
      
      assert(response.status === 200, 'Expected status code 200');
      assert(response.data, 'Response should have data');
      
      // Endpoint-specific validations
      if (test.endpoint === '/health') {
        assert(response.data.status === 'healthy', 'Health status should be healthy');
        assert(response.data.service === 'wink-service', 'Service name should be wink-service');
      } else if (test.endpoint === '/') {
        assert(response.data.service === 'wink-service', 'Service name should be wink-service');
        assert(response.data.status === 'running', 'Service status should be running');
      } else if (test.endpoint === '/tokenize') {
        assert(Array.isArray(response.data.tokens), 'Response should contain tokens array');
        assert(typeof response.data.count === 'number', 'Response should contain count field');
      } else if (test.endpoint === '/normalize') {
        assert(typeof response.data.original === 'string', 'Response should contain original text');
        assert(typeof response.data.normalized === 'string', 'Response should contain normalized text');
      } else if (test.endpoint === '/sentence-split') {
        assert(Array.isArray(response.data.sentences), 'Response should contain sentences array');
        assert(typeof response.data.count === 'number', 'Response should contain count field');
      } else if (test.endpoint === '/pos') {
        assert(Array.isArray(response.data.result), 'Response should contain result array');
      } else if (test.endpoint === '/preprocess-for-textrank') {
        // 기본 필드 검증
        assert(response.data.requestId, 'Response should contain requestId');
        assert(Array.isArray(response.data.sentences), 'Response should contain sentences array');
        assert(Array.isArray(response.data.processedSentences), 'Response should contain processedSentences array');
        assert(Array.isArray(response.data.keyTerms), 'Response should contain keyTerms array');
        assert(typeof response.data.sentenceCount === 'number', 'Response should contain sentenceCount');
        
        // 통계 정보 검증
        assert(response.data.stats, 'Response should contain stats object');
        assert(typeof response.data.stats.totalTokens === 'number', 'Stats should contain totalTokens');
        assert(typeof response.data.stats.avgTokensPerSentence === 'number', 'Stats should contain avgTokensPerSentence');
        assert(typeof response.data.stats.keyTermCount === 'number', 'Stats should contain keyTermCount');
        
        // 처리된 문장 구조 검증
        for (const sentence of response.data.processedSentences) {
          assert(typeof sentence.index === 'number', 'Processed sentence should have index');
          assert(typeof sentence.sentence === 'string', 'Processed sentence should have original text');
          assert(Array.isArray(sentence.tokens), 'Processed sentence should have tokens array');
          assert(Array.isArray(sentence.normalized), 'Processed sentence should have normalized array');
          assert(Array.isArray(sentence.posTags), 'Processed sentence should have posTags array');
          assert(typeof sentence.tokenCount === 'number', 'Processed sentence should have tokenCount');
          
          // 배열 길이 일치 검증
          assert(sentence.tokens.length === sentence.normalized.length, 'Tokens and normalized arrays should have same length');
          assert(sentence.tokens.length === sentence.posTags.length, 'Tokens and posTags arrays should have same length');
          assert(sentence.tokens.length === sentence.tokenCount, 'tokenCount should match actual token count');
        }
      }
      
      console.log('✅ Test passed!\n');
    } catch (error) {
      if (test.expectedError) {
        assert(error.response.status === test.expectedStatus, `Expected error status ${test.expectedStatus}`);
        assert(error.response.data.error, 'Error response should contain error message');
        assert(error.response.data.requestId, 'Error response should contain requestId');
        console.log('✅ Expected error case passed!\n');
      } else {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
          console.error('Error status:', error.response.status);
          console.error('Error data:', error.response.data);
        }
        console.log('\n');
      }
    }
  }
  
  console.log('Test run completed.');
}

// Run tests
runTests()
  .catch(err => {
    console.error('Critical error in test execution:', err);
    process.exit(1);
  }); 