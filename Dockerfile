# Build Stage
FROM node:20-alpine as builder

WORKDIR /app

# 빌드 시 필요한 환경변수 정의 (docker build --build-arg 로 전달)
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_MAPS_API_KEY

# Vite 빌드에서 사용할 수 있도록 환경변수 설정
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine

# 기본 설정 제거
RUN rm -rf /etc/nginx/conf.d/*

# 빌드 결과물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 8080 포트 노출
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
