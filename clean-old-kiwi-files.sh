#!/bin/bash

# Kiwi 관련 기존 파일 정리 스크립트
# 주의: 신규 서비스 정상 작동 확인 후 실행하세요.

echo "경고: 이 스크립트는 기존 Kiwi 관련 파일을 삭제합니다."
echo "신규 Python 기반 kiwi-service가 정상 작동하는 것을 확인한 후 실행하세요."
echo "계속하려면 'yes'를 입력하세요:"

read confirmation

if [[ "$confirmation" != "yes" ]]; then
    echo "작업이 취소되었습니다."
    exit 0
fi

echo "기존 Kiwi 파일 삭제 중..."

# 기존 파일 백업
BACKUP_DIR="/home/lizere0824/custom-n8n/backup_kiwi_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /home/lizere0824/custom-n8n/src/kiwi-service "$BACKUP_DIR/"
cp -r /home/lizere0824/custom-n8n/src/kiwi-addon "$BACKUP_DIR/"
cp -r /home/lizere0824/custom-n8n/src/kiwi-lib "$BACKUP_DIR/"
cp -r /home/lizere0824/custom-n8n/docker/kiwi "$BACKUP_DIR/"

echo "백업 완료: $BACKUP_DIR"

# Docker 이미지 및 컨테이너 정리
echo "Docker 이미지 정리 중..."
docker rmi $(docker images | grep kiwi | awk '{print $3}') 2>/dev/null || true

# 기존 파일 삭제
echo "파일 삭제 중..."
rm -rf /home/lizere0824/custom-n8n/src/kiwi-service
rm -rf /home/lizere0824/custom-n8n/src/kiwi-addon
rm -rf /home/lizere0824/custom-n8n/src/kiwi-lib
rm -rf /home/lizere0824/custom-n8n/docker/kiwi

echo "정리 완료!"
echo "삭제된 파일은 '$BACKUP_DIR'에 백업되었습니다." 