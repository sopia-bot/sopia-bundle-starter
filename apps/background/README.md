# DJ Board Background Server

Express 기반의 Background 서버로, Frontend와 API 서버 간의 통신을 중계합니다.

## 🎯 역할

- **Protocol**: `stp://dj-board.sopia.dev`로 요청 수신
- **Proxy**: 실제 API 서버(`http://localhost:3000`)로 요청 전달
- **Data Management**: CMS 페이지 데이터 저장/조회

## 🚀 실행 방법

```bash
# 의존성 설치
cd apps/background
pnpm install

# 개발 모드 (Hot Reload)
pnpm run dev

# 프로덕션 모드
pnpm start
```

## 📡 API Endpoints

### 1. 페이지 조회
```
GET /api/dj-board/pages/:userId
```

**Response (200 OK)**:
```json
{
  "userId": 2,
  "title": "나만의 대시보드",
  "content": [...],
  "updatedAt": "2025-07-22T12:00:00Z"
}
```

### 2. 페이지 저장
```
POST /api/dj-board/pages
```

**Request Body**:
```json
{
  "userId": 2,
  "title": "나만의 대시보드",
  "content": [...]
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "userId": 2
}
```

## 🔧 설정 변경

`src/const.ts` 파일에서 설정을 변경할 수 있습니다:

```typescript
// API 서버 URL
export const API_BASE_URL = 'http://localhost:3000';

// Background 서버 포트
export const PORT = 9999;
```

**변경 후 다시 빌드해야 합니다:**
```bash
pnpm run build
```

## 📝 주의사항

- Frontend는 `http://localhost:9999`로 요청을 보냅니다
- Background 서버가 실제 API 서버로 프록시합니다
- userId는 현재 고정값 `2`를 사용합니다
