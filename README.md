# 🤖 Job Agent Frontend

> 취업 지원 AI 서비스 프론트엔드 (React + Vite 기반)

---

## 📌 프로젝트 개요

본 프로젝트는 취준생이 **기업 분석부터 자기소개서, 면접 준비까지** AI의 도움을 받아 효율적으로 취업 준비를 할 수 있도록 지원하는 AI 서비스의 프론트엔드입니다.

---

## 🧩 주요 기능

- **기업 분석 (Company Analysis)** — 기업 최신 뉴스 및 핵심 정보 AI 분석
- **JD 분석 (Job Description Analysis)** — 채용공고 키워드 및 적합도 분석
- **자기소개서 생성 (Resume Generation)** — AI가 작성해주는 맞춤형 자기소개서
- **면접 준비 (Interview Preparation)** — 기업별 예상 질문 및 답변 코칭

---

## 🧱 프로젝트 구조

```
frontend/
├── public/
├── src/
│    ├── assets/              # 정적 자원 (이미지, 폰트 등)
│    ├── components/
│    │    ├── common/         # 공통 UI 컴포넌트
│    │    └── layout/         # 레이아웃 (MainLayout, 사이드바)
│    │
│    ├── constants/           # 상수값 (라우트, API URL)
│    ├── hooks/               # 커스텀 React 훅
│    │
│    ├── pages/               # 라우트별 페이지 컴포넌트
│    │    ├── Home/
│    │    ├── Company/
│    │    ├── JD/
│    │    ├── Resume/
│    │    └── Interview/
│    │
│    ├── services/            # API 통신 함수 (axios 기반)
│    │    ├── api.ts          # axios 인스턴스 (baseURL, 인터셉터)
│    │    ├── companyService.ts
│    │    ├── jdService.ts
│    │    ├── resumeService.ts
│    │    └── interviewService.ts
│    │
│    ├── store/               # Zustand 전역 상태
│    ├── styles/              # 글로벌 CSS / 디자인 토큰
│    ├── types/               # TypeScript 공통 타입 정의
│    └── utils/               # 순수 유틸리티 함수
│
├── .env.example
├── .gitignore
├── .gitattributes
├── .prettierrc
└── README.md
```

---

## 🛠 기술 스택

| 항목 | 기술 |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Routing | React Router v6 |
| 상태 관리 | Zustand |
| HTTP 클라이언트 | Axios |
| Styling | CSS Modules |
| Linting | ESLint + Prettier |

---

## ⚙️ 실행 방법

### 1. 저장소 클론
```bash
git clone https://github.com/fininsight-internship/frontend.git
cd frontend
```

### 2. 패키지 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
cp .env.example .env
```

`.env` 파일에 아래 값 입력:
```
VITE_API_BASE_URL=http://localhost:8000
```

### 4. 개발 서버 실행
```bash
npm run dev
```

👉 **http://localhost:5173** 에서 확인

---

## 📡 화면 구성 (라우트)

| 화면 | 경로 | 설명 |
|---|---|---|
| 홈 | `/` | 기능 목록 및 소개 |
| 기업 분석 | `/company` | 기업명 입력 → AI 분석 리포트 |
| JD 분석 | `/jd` | 채용공고 텍스트 → 키워드 분석 |
| 자기소개서 | `/resume` | 정보 입력 → AI 자소서 생성 |
| 면접 준비 | `/interview` | 기업/직무 입력 → 예상 질문 |

---

## 🔗 백엔드 연동

백엔드 서버가 실행 중이어야 API 기능이 동작합니다.

```bash
# 백엔드 실행 (별도 레포)
uvicorn app.main:app --reload
# → http://localhost:8000
```

Swagger UI로 API 확인: 👉 **http://localhost:8000/docs**

---

## 📌 개발 규칙

- 페이지 컴포넌트는 `pages/` 폴더에서 관리
- API 통신 로직은 `services/`에서 구현
- 전역 상태는 `store/` (Zustand)에서 관리
- 타입 정의는 `types/index.ts`에서 일원 관리
- 린트 검사: `npm run lint`

---

## ⚠️ 주의사항

- `.env` 파일은 Git에 업로드 금지 (`.gitignore` 처리됨)
- 백엔드 서버가 꺼져 있으면 API 호출 기능은 동작하지 않음

---

## 📌 현재 상태

- ✅ Vite + React + TypeScript 프로젝트 세팅 완료
- ✅ 라우팅 구조 및 레이아웃(사이드바) 구현 완료
- ✅ 백엔드 API 연동 서비스 파일 기본 구조 완료
- 🚧 각 페이지 기능 구현 진행 예정

---

## 📌 한 줄 정리

👉 **"clone → env 설정 → 실행 → 바로 개발 시작 가능"**
