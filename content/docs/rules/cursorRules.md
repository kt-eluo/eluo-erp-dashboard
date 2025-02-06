
## Next.js: Route Handler 우선 사용

-   **모든 API 엔드포인트는 Route Handler를 사용하여 구현하세요.**
-   **데이터베이스 작업, 외부 API 호출, 인증 등 복잡한 서버 작업은 반드시 Route Handler를 사용하세요.**
-   **Server Action은 단순 폼 제출 또는 간단한 데이터 처리에만 사용하세요.**

---

## Next.js 라우팅: App Router 사용

-   **프로젝트 내 라우팅은 Pages Router 대신 App Router를 사용하세요.**

---

## 프로젝트 구조: 주요 폴더 구조 예시

-   **프로젝트 구조는 다음과 같이 설정하세요. `src` 폴더는 사용하지 않습니다.**

```

your-nextjs-project/
│
├── app/                      # App Router 라우트 폴더
│ ├── api/                    # API 엔드포인트 관련 폴더
│ ├── dashboard/              # 개별 페이지 폴더 예시 (재사용되지 않는 컴포넌트 포함)
│ ├── business/               # 비즈니스 페이지 폴더 예시 (재사용되지 않는 컴포넌트 포함)
│ └─├── page.tsx              # dashboard 페이지
│   └── DashboardStats.tsx    # 페이지 전용 컴포넌트
├── components/               # 공통 컴포넌트 모음
│ ├── ui                      # ShadCN 공통 UI 컴포넌트
│ │ ├── button.tsx
│ │ ├── input.tsx
│ │ ├── select.tsx
│ │ ├── toast.tsx
│ │ ├── toaster.tsx
│ ├── layout/                 # 레이아웃 관련 공통 컴포넌트
│ │ ├── header.tsx
│ │ ├── footer.tsx
│ │ ├── sidebar.tsx
│ ├── OptionsDropdown.tsx
│ ├── PromptInput.tsx
│ └── GeneratedImagePreview.tsx
│
├── store/                    # 상태 관리 관련 폴더
│ ├── gallery.ts              # 갤러리 관련 상태 관리
│ ├── auth.ts                 # 인증 관련 상태 관리
│ ├── community.ts            # 커뮤니티 관련 상태 관리
│ └── index.ts                # 상태 관리 유틸리티 및 타입 정의
│
├── hooks/                    # 커스텀 훅 폴더
│ ├── use-toast.ts            # 토스트 관련 훅
│ ├── use-auth.ts             # 인증 관련 훅
│ └── use-media.ts            # 미디어 쿼리 등 UI 관련 훅
│
├── db/                       # 데이터베이스 관련 폴더
│ ├── schema.ts               # DrizzleORM 스키마 정의 파일
│ └── index.ts                # 데이터베이스 연결 초기화 파일
│
├── drizzle/                  # DrizzleORM 관련 설정 파일
│
├── public/                   # 정적 파일 (이미지, 폰트 등)
│ └── favicon.ico
│
├── styles/                   # 글로벌 스타일 (CSS, SCSS, Tailwind 등)
│ └── globals.css
│
├── types/                    # 공통 인터페이스 및 타입 정의
│ └── index.ts                # 여러 파일에서 사용할 공통 타입 및 인터페이스 정의 파일
│
├── utils/                    # 유틸리티 함수 모음
│ ├── fetcher.ts              # API 호출 등 유틸리티 함수
│ └── mockData.ts             # 목업 데이터 관리
│
├── middleware.ts             # 미들웨어 설정 파일
├── .env                      # 환경 변수 설정 파일
├── drizzle.config.ts         # DrizzleORM 설정 파일
├── next.config.mjs           # Next.js 설정 파일
├── package.json              # 프로젝트 패키지 정보
└── tsconfig.json             # TypeScript 설정 파일

```

---

## TypeScript 사용: TS 사용 권장

-   **프로젝트 전반에 TypeScript를 사용하세요.**
-   **타입 안정성을 위해 모든 컴포넌트와 서버 로직에 TypeScript를 적용하세요.**

---

## TypeScript 인터페이스 정의 규칙: 'I' 접두사 사용

-   **인터페이스 정의 시 이름 앞에 'I'를 접두사로 추가하세요.**
-   예시:
    ```typescript
    export interface IComment {
        id: string
        text: string
        author: string
    }
    ```
-   인터페이스 생성은 types/index.ts 파일에 작성하세요.

---

## 컴포넌트 생성: ShadCN 우선 사용

-   **모든 UI 컴포넌트는 ShadCN을 우선으로 생성하세요.**
-   ShadCN 컴포넌트 생성 CLI 명령어는 `npx shadcn@latest add`입니다.
-   **Toast 관련 컴포넌트는 다음 위치에 있습니다:**
    ```
    components/ui/toast.tsx      # Toast 기본 컴포넌트
    components/ui/toaster.tsx    # Toast 컨테이너 컴포넌트
    hooks/use-toast.ts   # Toast 커스텀 훅
    ```

---

## Git 커밋 메시지 작성 규칙

**포맷:**

```
<type>: <subject>

<body>
```

**커밋 타입 (Type):**

-   feat: 새로운 기능 추가
-   fix: 버그 수정
-   docs: 문서 수정
-   style: 코드 포맷팅, 세미콜론 누락, 코드 변경이 없는 경우
-   refactor: 코드 리팩토링
-   test: 테스트 코드, 리팩토링 테스트 코드 추가
-   chore: 빌드 업무 수정, 패키지 매니저 수정

**제목 (Subject):**

-   변경 사항에 대한 간단한 설명
-   50자 이내로 작성
-   마침표 없이 작성
-   현재 시제 사용

**본문 (Body):**

-   변경 사항에 대한 자세한 설명
-   어떻게 보다는 무엇을, 왜 변경했는지 설명
-   여러 줄의 메시지를 작성할 땐 "-"로 구분

**예시:**

```plaintext
feat: 로그인 화면 키보드 UX 개선
- TextInput ref를 사용하여 자동 포커스 기능 추가
- returnKeyType 설정으로 키보드 엔터키 동작 개선
- 전화번호 입력 후 자동으로 비밀번호 입력창으로 포커스 이동
- 비밀번호 입력 후 엔터키로 로그인 가능하도록 개선
```

## Clerk 인증: clerkMiddleware() 사용

-   모든 인증은 Clerk을 사용하세요.
-   middleware.ts 파일에서는 **clerkMiddleware()**를 사용하세요.
-   authMiddleware는 사용하지 않습니다.
-   기본 미들웨어 설정:

    ```typescript
    import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

    const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

    export default clerkMiddleware(async (auth, request) => {
        if (!isPublicRoute(request)) {
            await auth.protect()
        }
    })

    export const config = {
        matcher: ['/((?!.*\..*|_next).*)', '/', '/(api|trpc)(.*)']
    }
    ```

## ClerkClient: 유저 정보 조회 규칙

-   **ClerkClient를 사용하여 유저 정보를 조회할 때는 다음 규칙을 따르세요:**
-   기본 사용법:

```typescript
import { clerkClient } from '@clerk/nextjs/server'

const client = await clerkClient()

// 단일 유저 조회
const user = await client.users.getUser(userId)

// 다수 유저 조회 (권장)
const users = await client.users.getUserList({
    userId: userIds // string[] 타입
})
```

---

## ORM: Drizzle 사용

-   **데이터베이스 작업을 위해 ORM으로 Drizzle을 사용하세요.**
-   **Drizzle을 사용하여 데이터베이스 모델을 정의하고, CRUD 작업을 구현하세요.**

---

## Responsive Optimization (반응형 최적화)
- **다양한 화면 크기**(모바일, 태블릿, 데스크톱)에서 원활하게 작동해야 합니다.
- 버튼, 입력 필드 등의 **UI 요소는 터치와 클릭 모두 최적화**되어야 합니다.
- 가독성을 높이기 위해 **반응형 폰트 크기** 및 **유동적인 레이아웃**을 적용해야 합니다.

---

## Accessibility (접근성)
- **키보드 네비게이션**을 지원해야 합니다.
- 화면 낭독기(Screen Reader)와 호환되도록 **ARIA 속성**을 적용합니다.
- 색약 사용자를 고려한 **명확한 대비 색상**을 유지합니다.

---

# 강조색 사용 규칙

## 1. 색상 정의
강조색은 다음과 같습니다.

### Primary Colors (주요 색상)
- **chakra-colors-primary**: `#2C74FF`
- **chakra-colors-primary-50**: `#F8FAFF`
- **chakra-colors-primary-100**: `#E7EFFF`
- **chakra-colors-primary-200**: `#C0D6FF`
- **chakra-colors-primary-300**: `#9EBFFF`
- **chakra-colors-primary-400**: `#70A1FF`
- **chakra-colors-primary-500**: `#2C74FF`
- **chakra-colors-primary-600**: `#0359FF`
- **chakra-colors-primary-700**: `#004AD9`
- **chakra-colors-primary-800**: `#003CB1`
- **chakra-colors-primary-900**: `#002E88`

### Secondary Colors (보조 색상)
- **chakra-colors-secondary**: `#FFEB73`
- **chakra-colors-secondary-50**: `#FFFDF2`
- **chakra-colors-secondary-100**: `#FFFAD9`
- **chakra-colors-secondary-200**: `#FFF6BF`
- **chakra-colors-secondary-500**: `#FFEB73`

### 상태 색상 (Status Colors)
- **Success**
  - **chakra-colors-success**: `#2FB916`
  - **chakra-colors-success-500**: `#2FB916`
  - **chakra-colors-success-900**: `#185e0b`
- **Caution**
  - **chakra-colors-caution**: `#F9A825`
  - **chakra-colors-caution-500**: `#F9A825`
  - **chakra-colors-caution-900**: `#b37105`
- **Error**
  - **chakra-colors-error**: `#FF2F2F`
  - **chakra-colors-error-500**: `#FF2F2F`
  - **chakra-colors-error-900**: `#c80000`

## 2. 강조색 사용 지침

### UI 요소별 색상 사용
- **Primary Colors**: 주요 버튼, 헤더, 링크, 핵심 액션 요소
- **Secondary Colors**: 보조 버튼, 카드 배경, 서브 액션 요소
- **Success, Caution, Error Colors**: 상태 메시지, 알림, 경고창 등
- **Job Colors**: 역할별 구분이 필요한 UI 요소

### 명도 및 대비 기준
- 강조색이 포함된 UI 요소는 텍스트 대비 최소 **4.5:1** 이상의 명도 대비를 유지해야 합니다.

### Dark Mode 고려
- 다크 모드에서 밝은 색상이 너무 눈부시지 않도록 `dim-primary`, `dim-secondary` 같은 보정 색상을 적용합니다.

## 3. 유사한 색상 그룹화
비슷한 색상의 사용 기준을 명확히 정리합니다.

- **Primary (기본 색상)** → 버튼, 주요 액션
- **Cobalt (코발트 계열)** → 정보성 배경, 카드
- **Blue (파란 계열)** → 보조 강조, 링크
- **Violet (보라 계열)** → 창의적인 UI 요소

## 4. 토큰화 및 확장성 고려
역할별 색상을 더욱 세분화하여 확장성을 고려합니다.

- **chakra-colors-job-frontend**: `#7E8BFF`
- **chakra-colors-job-backend**: `#6BB8FF`
- **chakra-colors-job-design**: `#FFA877`
- **chakra-colors-job-pm**: `#FF7B7B`
- **chakra-colors-job-qa**: `#B587FF`

## 5. 예제 코드

```tsx
const theme = extendTheme({
  colors: {
    primary: {
      50: "#F8FAFF",
      100: "#E7EFFF",
      500: "#2C74FF",
      900: "#002E88",
    },
    secondary: {
      50: "#FFFDF2",
      100: "#FFFAD9",
      500: "#FFEB73",
    },
    success: {
      500: "#2FB916",
    },
    caution: {
      500: "#F9A825",
    },
    error: {
      500: "#FF2F2F",
    },
  },
});
```

---

# 폰트 사이즈 사용 규칙

## 1. 폰트 사이즈 정의
폰트 크기는 다음과 같습니다.

### 기본 폰트 크기 (Font Sizes)
- **chakra-fontSizes-title**: `20px`
- **chakra-fontSizes-subtitle**: `18px`
- **chakra-fontSizes-body**: `16px`
- **chakra-fontSizes-small**: `14px`
- **chakra-fontSizes-tiny**: `12px`

## 2. 폰트 크기 사용 지침

### UI 요소별 폰트 크기 사용
- **Title (`20px`)**: 주요 헤딩 (`h1`)
- **Subtitle (`18px`)**: 보조 헤딩 (`h2, h3`)
- **Body (`16px`)**: 기본 본문 텍스트
- **Small (`14px`)**: 보조 정보, 캡션 등
- **Tiny (`12px`)**: 버튼 레이블, 메타데이터

### 가독성 및 디자인 원칙
- **기본 폰트 크기**는 `16px` (`1rem`)을 기준으로 설정합니다.
- **헤딩 (`h1~h3`)**은 본문 대비 1.25~1.5배 크기로 설정하여 시각적 계층 구조를 유지합니다.
- **반응형 디자인**에서는 `rem` 단위를 사용하여 조정 가능하도록 설정합니다.

### Dark Mode 고려
- 다크 모드에서 작은 폰트(`14px 이하`)는 대비를 강화하기 위해 `font-weight: 500 이상`을 권장합니다.

## 3. 폰트 크기 그룹화
유사한 역할을 하는 폰트 크기를 정리합니다.

- **Title (`20px`)** → 헤딩 (`h1`)
- **Subtitle (`18px`)** → 섹션 제목, `h2`
- **Body (`16px`)** → 기본 텍스트
- **Small (`14px`)** → 캡션, 설명 텍스트
- **Tiny (`12px`)** → 메타데이터, 툴팁

## 4. 예제 코드

```tsx
const theme = extendTheme({
  fontSizes: {
    title: "20px",
    subtitle: "16px",
    body: "15px",
    small: "12px",
    tiny: "11px",
  },
});
```

---

# 폰트 사이즈 사용 규칙
