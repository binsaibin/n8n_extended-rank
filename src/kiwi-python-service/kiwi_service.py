#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
kiwi_service.py

한국어 형태소 분석을 위한 마이크로서비스
kiwipiepy를 사용하여 한국어 텍스트 분석, 문장 분리, 토큰화 기능을 제공

이 서비스는 기존 Node.js 기반 kiwi-service의 API와 호환됩니다.
"""

import os
import json
import logging
from flask import Flask, request, jsonify, Response
from kiwipiepy import Kiwi, Token

# TextRank 전처리 모듈 임포트
from textrank_endpoint import create_textrank_preprocessing_endpoint

# [STEP 1] 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("kiwi-service")

# [STEP 2] 앱 초기화
app = Flask(__name__)

# [STEP 3] Kiwi 인스턴스 생성
try:
    kiwi = Kiwi()
    logger.info("Kiwi 인스턴스 생성 성공")
except Exception as e:
    logger.error(f"Kiwi 인스턴스 생성 실패: {e}")
    raise

# [STEP 4] API 엔드포인트 정의

@app.route('/health', methods=['GET'])
def health():
    """서비스 상태 확인 엔드포인트"""
    return jsonify({
        'status': 'healthy',
        'service': 'kiwi-service'
    })

@app.route('/', methods=['GET'])
def root():
    """서비스 정보 제공 엔드포인트"""
    return jsonify({
        'service': 'kiwi-service',
        'status': 'running',
        'version': 'kiwipiepy-based',
        'description': 'Korean text preprocessing service for NLP and TextRank summarization'
    })

@app.route('/morpheme', methods=['POST'])
def morpheme():
    """형태소 분석 엔드포인트"""
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        logger.info(f"형태소 분석 요청: {text[:50]}...")
        
        result = kiwi.analyze(text)
        # 기존 Node.js 형식에 맞게 결과 변환
        formatted_result = []
        for tokens, _ in result:
            formatted_tokens = [(token[0], token[1], token[2], token[3]) for token in tokens]
            formatted_result.append(formatted_tokens)
        
        return jsonify({'result': formatted_result})
    except Exception as e:
        logger.error(f"형태소 분석 중 오류 발생: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/sentence-split', methods=['POST'])
def sentence_split():
    """문장 분리 엔드포인트"""
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        logger.info(f"문장 분리 요청: {text[:50]}...")
        
        sentences = kiwi.split_into_sents(text)
        sentence_texts = [sent.text for sent in sentences]
        
        return jsonify({
            'sentences': sentence_texts,
            'count': len(sentence_texts)
        })
    except Exception as e:
        logger.error(f"문장 분리 중 오류 발생: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/tokenize', methods=['POST'])
def tokenize():
    """토큰화 엔드포인트"""
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        logger.info(f"토큰화 요청: {text[:50]}...")
        
        tokens = kiwi.tokenize(text)
        token_forms = [token.form for token in tokens]
        
        return jsonify({
            'tokens': token_forms,
            'count': len(token_forms)
        })
    except Exception as e:
        logger.error(f"토큰화 중 오류 발생: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/preprocess', methods=['POST'])
def preprocess():
    """전처리 엔드포인트"""
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        logger.info(f"전처리 요청: {text[:50]}...")
        
        # 1) 문장 분리
        sentences = kiwi.split_into_sents(text)
        sentence_texts = [sent.text for sent in sentences]
        
        # 2) 각 문장 토큰화
        tokenized = []
        for sent in sentence_texts:
            tokens = kiwi.tokenize(sent)
            tokenized.append([token.form for token in tokens])
        
        return jsonify({
            'sentences': sentence_texts,
            'tokenized': tokenized
        })
    except Exception as e:
        logger.error(f"전처리 중 오류 발생: {e}")
        return jsonify({'error': str(e)}), 500

# TextRank 전처리 엔드포인트 - 외부 모듈에서 가져온 함수 사용
app.route('/preprocess-for-textrank', methods=['POST'])(
    create_textrank_preprocessing_endpoint(kiwi)
)

@app.route('/analyze', methods=['POST'])
def analyze():
    """형태소 분석 엔드포인트 (단순 버전)"""
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        logger.info(f"분석 요청: {text[:50]}...")
        
        tokens = kiwi.tokenize(text)
        result = []
        for token in tokens:
            result.append({
                'form': token.form,
                'tag': token.tag,
                'start': token.start,
                'end': token.start + len(token.form)
            })
        
        return jsonify({'tokens': result})
    except Exception as e:
        logger.error(f"분석 중 오류 발생: {e}")
        return jsonify({'error': str(e)}), 500

# [STEP 5] 서비스 시작
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3000))
    logger.info(f"Kiwi 서비스 시작 (포트: {PORT})")
    app.run(host='0.0.0.0', port=PORT) 