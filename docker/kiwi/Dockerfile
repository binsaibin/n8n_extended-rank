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

# 로그 디렉토리 생성 및 권한 설정
RUN mkdir -p /app/logs && \
    chmod -R 777 /app/logs && \
    touch /app/logs/textrank_service.log && \
    chmod 666 /app/logs/textrank_service.log

# 일반 사용자 생성 및 권한 설정
RUN useradd -m appuser && \
    chown -R appuser:appuser /app

# 사용자 전환
USER appuser

# 포트 설정
EXPOSE 3000

# 서비스 실행
CMD ["gunicorn", "--bind", "0.0.0.0:3000", "kiwi_service:app", "--timeout", "120", "--workers", "4", "--log-file", "/app/logs/textrank_service.log"]
