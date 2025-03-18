#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
textrank_endpoint.py

TextRank 알고리즘을 위한 전처리 모듈
- 문장 분리, 형태소 분석, 불용어 처리 등을 수행
- 로깅 및 예외 처리 강화
"""

import logging
import sys
from datetime import datetime
from flask import jsonify, request
from typing import Dict, List, Set, Union, Optional

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/textrank_service.log')
    ]
)
logger = logging.getLogger("kiwi-service.textrank")

# 한국어 불용어 (stopwords)
KOREAN_STOPWORDS: Set[str] = {
    "이", "그", "저", "것", "수", "등", "들", "및", "에", "에서", "의", "을", "를", 
    "이다", "있다", "하다", "이런", "그런", "저런", "한", "이", "그", "저", "와", "과", 
    "으로", "로", "에게", "뿐", "다", "도", "만", "까지", "에는", "랑", "이라", "며", 
    "거나", "에도", "든지"
}

class TextRankPreprocessingError(Exception):
    """TextRank 전처리 과정에서 발생하는 사용자 정의 예외"""
    pass

def validate_input(data: Dict) -> str:
    """
    입력 데이터 검증
    
    Args:
        data: JSON 요청 데이터
        
    Returns:
        검증된 텍스트
        
    Raises:
        TextRankPreprocessingError: 입력이 유효하지 않은 경우
    """
    if not data:
        raise TextRankPreprocessingError("요청 데이터가 비어있습니다")
    
    text = data.get('text')
    if not text:
        raise TextRankPreprocessingError("텍스트가 제공되지 않았습니다")
    
    if not isinstance(text, str):
        raise TextRankPreprocessingError("텍스트는 문자열이어야 합니다")
        
    if len(text.strip()) == 0:
        raise TextRankPreprocessingError("텍스트가 비어있습니다")
        
    return text

def create_textrank_preprocessing_endpoint(kiwi_instance):
    """
    TextRank 전처리를 위한 Flask 엔드포인트 함수를 생성합니다.
    
    Args:
        kiwi_instance: Kiwipiepy 인스턴스
        
    Returns:
        Flask 요청 핸들러 함수
    """
    
    def preprocess_for_textrank():
        """TextRank를 위한 전처리 엔드포인트"""
        request_id = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        logger.info(f"[{request_id}] TextRank 전처리 요청 시작")
        
        try:
            # 입력 데이터 검증
            data = request.json
            text = validate_input(data)
            remove_stopwords = data.get('removeStopwords', True)
            
            logger.info(f"[{request_id}] 입력 텍스트 길이: {len(text)}, 불용어 제거: {remove_stopwords}")
            
            # 1) 문장 분리
            start_time = datetime.now()
            sentences = kiwi_instance.split_into_sents(text)
            sentence_texts = [sent.text for sent in sentences]
            logger.info(f"[{request_id}] 문장 분리 완료: {len(sentence_texts)}개 문장, 소요시간: {datetime.now() - start_time}")
            
            # 2) 각 문장 처리
            processed_sentences = []
            for idx, sent_text in enumerate(sentence_texts):
                try:
                    # 형태소 분석
                    analysis = kiwi_instance.analyze(sent_text)[0][0]  # 최적의 결과 선택
                    
                    # 토큰, 정규화된 형태, 품사 태그 추출
                    tokens = []
                    normalized = []
                    pos_tags = []
                    
                    for morpheme in analysis:
                        tokens.append(morpheme[0])
                        normalized.append(morpheme[0].lower())  # 소문자화
                        pos_tags.append(morpheme[1])
                    
                    # 불용어 필터링
                    if remove_stopwords:
                        filtered_tokens = []
                        filtered_normalized = []
                        filtered_pos_tags = []
                        
                        for i, token in enumerate(normalized):
                            if token not in KOREAN_STOPWORDS:
                                filtered_tokens.append(tokens[i])
                                filtered_normalized.append(normalized[i])
                                filtered_pos_tags.append(pos_tags[i])
                    else:
                        filtered_tokens = tokens
                        filtered_normalized = normalized
                        filtered_pos_tags = pos_tags
                    
                    # 처리된 문장 데이터 저장
                    processed_sentences.append({
                        'index': idx,
                        'sentence': sent_text,
                        'tokens': filtered_tokens,
                        'normalized': filtered_normalized,
                        'posTags': filtered_pos_tags,
                        'tokenCount': len(filtered_tokens)
                    })
                except Exception as e:
                    logger.error(f"[{request_id}] 문장 처리 중 오류 발생 (문장 {idx}): {str(e)}")
                    # 개별 문장 처리 실패는 전체 처리를 중단하지 않음
                    continue
            
            # 3) 주요 용어 (명사, 동사, 형용사 등) 추출
            key_terms = set()
            for s in processed_sentences:
                for i, tag in enumerate(s['posTags']):
                    # 명사(N*), 동사(V*), 형용사(VA)를 주요 용어로 간주
                    if tag.startswith('N') or tag.startswith('V') or tag == 'VA':
                        key_terms.add(s['normalized'][i])
            
            # 4) TextRank 알고리즘을 위한 결과 반환
            response_data = {
                'requestId': request_id,
                'sentences': sentence_texts,
                'processedSentences': processed_sentences,
                'keyTerms': list(key_terms),
                'sentenceCount': len(sentence_texts),
                'stats': {
                    'totalTokens': sum(s['tokenCount'] for s in processed_sentences),
                    'avgTokensPerSentence': sum(s['tokenCount'] for s in processed_sentences) / len(processed_sentences) if processed_sentences else 0,
                    'keyTermCount': len(key_terms)
                }
            }
            
            logger.info(f"[{request_id}] TextRank 전처리 완료: {response_data['stats']}")
            return jsonify(response_data)
            
        except TextRankPreprocessingError as e:
            error_msg = f"TextRank 전처리 검증 오류: {str(e)}"
            logger.warning(f"[{request_id}] {error_msg}")
            return jsonify({'error': error_msg, 'requestId': request_id}), 400
            
        except Exception as e:
            error_msg = f"TextRank 전처리 중 오류 발생: {str(e)}"
            logger.error(f"[{request_id}] {error_msg}", exc_info=True)
            return jsonify({'error': error_msg, 'requestId': request_id}), 500
    
    return preprocess_for_textrank 