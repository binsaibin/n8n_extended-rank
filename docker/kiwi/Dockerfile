FROM python:3.9-slim

WORKDIR /app

# 시스템 패키지 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 필요한 Python 패키지 설치
COPY src/kiwi-python-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 서비스 코드 복사 - textrank_endpoint.py도 포함
COPY src/kiwi-python-service/kiwi_service.py .
COPY src/kiwi-python-service/textrank_endpoint.py .

# 일반 사용자 생성
RUN useradd -m appuser

# 애플리케이션 디렉토리 권한 설정
RUN chown -R appuser:appuser /app

# 사용자 전환
USER appuser

# 포트 설정
EXPOSE 3000

# 서비스 실행 (stdout으로 로그 출력)
CMD ["gunicorn", "--bind", "0.0.0.0:3000", "kiwi_service:app", "--timeout", "120", "--workers", "4", "--log-level", "info", "--access-logfile", "-", "--error-logfile", "-"]
