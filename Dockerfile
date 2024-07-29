# 1. Node.js 20 버전의 베이스 이미지 사용
FROM node:20

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 패키지 업데이트 및 필수 패키지 설치
RUN apt-get update && \
    apt-get install -y \
    wget \
    libglib2.0-0 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxtst6 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# 4. package.json 파일 복사
COPY package.json ./

# 5. pnpm 설치
RUN npm install -g pnpm

# 6. 의존성 설치
RUN pnpm install

# 7. 소스 파일 복사
COPY . .

# 8. 애플리케이션 빌드
RUN pnpm run build

# 9. CMD 명령어로 빌드된 파일 실행
CMD ["node", "dist/main"]