# 1. Node.js 20 버전의 베이스 이미지 사용
FROM node:20

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. package.json과 chromium 폴더를 하위 구조까지 복사
COPY package.json ./
COPY chromium ./chromium

# 4. pnpm 설치
RUN npm install -g pnpm

# 5. 의존성 설치
RUN pnpm install

# 6. 소스 파일 복사
COPY . .

# 7. 애플리케이션 빌드
RUN pnpm run build

# 8. CMD 명령어로 빌드된 파일 실행
CMD ["node", "dist/main"]