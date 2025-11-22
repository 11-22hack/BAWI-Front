# BAWI - 안전한 밤길 귀가를 돕는 서비스

BAWI는 사용자의 안전한 귀가를 돕기 위해 최적의 경로와 실시간 영상을 제공하는 서비스입니다. Google Maps API를 활용하여 경로를 시각화하고, 생성형 AI를 통해 경로에 대한 사전 영상을 생성하여 보여줍니다.

## 주요 기능

### 1. 목적지 입력 및 경로 탐색
- **자동 완성 기능**: Google Places API를 활용한 주소 및 장소 검색 자동 완성 기능을 제공합니다.
- **좌표 직접 입력**: 필요한 경우 위도/경도 좌표를 직접 입력하여 검색할 수 있습니다.
- **서강대 맞춤 설정**: 서강대학교 주변에 최적화된 초기 화면과 프리셋 버튼을 제공합니다.

### 2. 경로 시각화 (Map)
- **경로 표시**: 출발지와 목적지 사이의 최적 경로를 지도상에 Polyline으로 표시합니다.
- **POI 마커**: 출발지와 도착지 마커를 명확하게 표시하여 위치를 쉽게 파악할 수 있습니다.
- **서강대 경계 표시**: 주요 서비스 구역인 서강대학교 캠퍼스 경계를 시각적으로 구분합니다.

### 3. AI 기반 경로 영상 생성 (Preview & Result)
- **영상 생성 요청**: 선택한 경로를 기반으로 백엔드 서버에 영상 생성을 요청합니다.
- **상태 모니터링**: 실시간 폴링(Polling)을 통해 영상 생성 진행 상태를 확인하고 프로그레스 바로 시각화합니다.
- **결과 확인**: 생성이 완료되면 영상을 재생하고, 경로에 대한 상세 메타데이터를 함께 제공합니다.

## 기술 스택

### Frontend
- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management & Data Fetching**: TanStack Query (React Query)
- **Maps**: Google Maps JavaScript API (Places, Geometry)
- **HTTP Client**: Axios

### DevOps
- **Container**: Docker (Multi-stage build)
- **CI/CD**: Dokploy (Environment variables injection support)
- **Web Server**: Nginx (Alpine Linux based)

## 프로젝트 구조

```
src/
├── api/          # 백엔드 API 통신 로직 (Axios)
├── components/   # 재사용 가능한 UI 컴포넌트 (Map, VideoPlayer 등)
├── hooks/        # 커스텀 React Hooks (usePolling 등)
├── pages/        # 라우트별 페이지 (Home, Preview, Status, Result)
├── types/        # TypeScript 타입 정의
└── utils/        # 유틸리티 함수 (지도 경로 계산 등)
```

## 시작하기

### 요구 사항
- Node.js 18 이상
- Google Maps API Key

### 설치 및 실행

1. 레포지토리 클론
```bash
git clone https://github.com/11-22hack/BAWI-Front.git
cd BAWI-Front
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env` 파일을 생성하고 다음 변수를 설정하세요.
```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
VITE_API_BASE_URL=your_backend_api_url
```

4. 개발 서버 실행
```bash
npm run dev
```

## Docker 실행

```bash
# 이미지 빌드
docker build -t bawi-front .

# 컨테이너 실행 (환경 변수 전달)
docker run -d -p 8080:8080 \
  -e VITE_GOOGLE_MAPS_API_KEY=your_key \
  -e VITE_API_BASE_URL=your_url \
  bawi-front
```
