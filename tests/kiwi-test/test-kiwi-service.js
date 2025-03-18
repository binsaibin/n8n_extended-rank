/**
 * Kiwi Service Test Script
 * 
 * This script tests the kiwi-service for Korean language processing.
 * It sends HTTP requests to the kiwi-service API and validates the responses.
 */

const axios = require('axios');
const assert = require('assert');

// Configuration
const KIWI_SERVICE_URL = process.env.KIWI_SERVICE_URL || 'http://localhost:3000';

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
    input: '안녕하세요 반갑습니다. 텍스트 요약 시스템입니다.',
    description: 'Basic Korean greeting and introduction',
    endpoint: '/analyze',
    method: 'POST'
  },
  {
    input: '자연어 처리는 컴퓨터 과학, 인공 지능, 언어학이 중첩된 영역입니다.',
    description: 'Technical Korean sentence about NLP',
    endpoint: '/analyze',
    method: 'POST'
  },
  {
    input: '한국어 형태소 분석기를 테스트 중입니다. 결과가 정확한지 확인해보겠습니다.',
    description: 'Test sentence for morphological analysis',
    endpoint: '/analyze',
    method: 'POST'
  },
  // 형태소 분석 테스트
  {
    input: '한국어는 교착어로 조사와 어미가 발달했습니다.',
    description: 'Morpheme analysis',
    endpoint: '/morpheme',
    method: 'POST'
  },
  // 문장 분리 테스트
  {
    input: '안녕하세요. 오늘은 날씨가 좋네요. 산책하기 좋은 날입니다.',
    description: 'Sentence splitting',
    endpoint: '/sentence-split',
    method: 'POST'
  },
  // 토큰화 테스트
  {
    input: '자연어 처리 기술은 계속 발전하고 있습니다.',
    description: 'Tokenization',
    endpoint: '/tokenize',
    method: 'POST'
  },
  // 전처리 테스트
  {
    input: '자연어 처리는 컴퓨터가 인간의 언어를 이해하고 생성하는 과정입니다. 다양한 응용 분야가 있습니다.',
    description: 'Preprocessing',
    endpoint: '/preprocess',
    method: 'POST'
  },
  // TextRank 전처리 테스트
  {
    input: '인공지능은 컴퓨터가 인간의 지능을 모방하는 기술입니다. 머신러닝은 인공지능의 한 분야로 데이터를 통해 학습합니다. 딥러닝은 머신러닝의 발전된 형태로 신경망을 이용합니다.',
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
  console.log('🔍 Starting Kiwi Service Tests...\n');

  for (const [index, test] of testCases.entries()) {
    console.log(`Test Case ${index + 1}: ${test.description}`);
    if (test.input !== null) console.log(`Input: "${test.input}"`);
    console.log(`Endpoint: ${test.method} ${test.endpoint}`);
    
    try {
      // Send request to kiwi-service
      let response;
      if (test.method === 'GET') {
        response = await axios.get(`${KIWI_SERVICE_URL}${test.endpoint}`);
      } else {
        response = await axios.post(`${KIWI_SERVICE_URL}${test.endpoint}`, {
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
        assert(response.data.service === 'kiwi-service', 'Service name should be kiwi-service');
      } else if (test.endpoint === '/') {
        assert(response.data.service === 'kiwi-service', 'Service name should be kiwi-service');
        assert(response.data.status === 'running', 'Service status should be running');
      } else if (test.endpoint === '/analyze') {
        assert(Array.isArray(response.data.tokens), 'Response should contain tokens array');
      } else if (test.endpoint === '/morpheme') {
        assert(Array.isArray(response.data.result), 'Response should contain result array');
      } else if (test.endpoint === '/sentence-split') {
        assert(Array.isArray(response.data.sentences), 'Response should contain sentences array');
        assert(typeof response.data.count === 'number', 'Response should contain count');
      } else if (test.endpoint === '/tokenize') {
        assert(Array.isArray(response.data.tokens), 'Response should contain tokens array');
        assert(typeof response.data.count === 'number', 'Response should contain count');
      } else if (test.endpoint === '/preprocess') {
        assert(Array.isArray(response.data.sentences), 'Response should contain sentences array');
        assert(Array.isArray(response.data.tokenized), 'Response should contain tokenized array');
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