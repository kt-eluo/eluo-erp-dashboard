
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

# sql 관련 규칙

1. Read Access Policy for Test Table
CREATE POLICY "Enable read access for all users" ON "test_table"
FOR SELECT USING (true);

2. User Profiles Table
-- 기존 user_profiles 테이블 삭제 (필요한 경우)
DROP TABLE IF EXISTS user_profiles;
DROP TYPE IF EXISTS user_role;

-- ENUM 타입 생성 (기존과 동일)
CREATE TYPE user_role AS ENUM ('CPO', 'BD', 'PM', 'PA', 'CLIENT');

-- 사용자 프로필 테이블 생성 (이메일 필드 추가)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'CLIENT',  -- 기본값을 CLIENT로 설정
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- RLS 정책 설정
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 사용자가 자신의 프로필을 볼 수 있도록 정책 설정 (기존과 동일)
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- CPO는 모든 프로필을 볼 수 있도록 정책 설정 (기존과 동일)
CREATE POLICY "CPO can view all profiles"
ON user_profiles FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'CPO'
  )
);

-- 사용자가 자신의 프로필을 생성할 수 있도록 정책 추가
CREATE POLICY "Users can insert their own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 사용자가 자신의 프로필을 수정할 수 있도록 정책 추가
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- CPO가 모든 프로필을 수정할 수 있도록 정책 추가
CREATE POLICY "CPO can update all profiles"
ON user_profiles FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'CPO'
  )
);

3. User Profile Access Policies
-- 기존 정책이 있다면 삭제 (선택사항)
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- 새로운 정책들 추가
CREATE POLICY "Users can insert their own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = id);

4. User Profiles Row Level Security Policies
-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- RLS 활성화 확인
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- INSERT 정책 추가
CREATE POLICY "Enable insert for authenticated users only"
ON user_profiles
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- SELECT 정책 추가
CREATE POLICY "Enable select for authenticated users only"
ON user_profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- UPDATE 정책 추가
CREATE POLICY "Enable update for users based on id"
ON user_profiles
FOR UPDATE
USING (auth.uid() = id);

5. Disable RLS and Grant Accesss
-- RLS 비활성화
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 접근 권한 부여
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;

6. User Profiles Table
-- 기존 테이블이 있다면 삭제
DROP TABLE IF EXISTS user_profiles;

-- user_profiles 테이블 생성
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Client'
    CHECK (role IN ('CPO', 'BD/BM', 'PM/PL', 'PA', 'Client')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 비활성화 (테스트를 위해)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 접근 권한 부여
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;

7. User Profiles Access Control
-- 기존 정책들 제거
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 기본 정책 설정
CREATE POLICY "Enable insert access for all users" ON user_profiles
    FOR INSERT 
    WITH CHECK (true);  -- 모든 사용자가 INSERT 가능

CREATE POLICY "Enable select access for all users" ON user_profiles
    FOR SELECT
    USING (true);  -- 모든 사용자가 SELECT 가능

-- 테이블 권한 부여
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;

8. User Profiles Role Management
alter table public.user_profiles
add column role text not null default 'Client'
check (role in ('CPO', 'BD/BM', 'PM/PL', 'PA', 'Client'));

9. Row Level Security for User Profiles
-- 기존 CPO 정책들만 삭제
DROP POLICY IF EXISTS "CPO can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "CPO can update all profiles" ON user_profiles;

-- CPO 정책들 새로 생성
CREATE POLICY "CPO can view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'CPO'
);

CREATE POLICY "CPO can update all profiles"
ON user_profiles FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'CPO'
);

10. Update User Role to CPO
-- 테이블 확인
SELECT * FROM user_profiles;

-- 특정 사용자의 role 수정
UPDATE user_profiles 
SET role = 'CPO' 
WHERE id = '5c07a0ee-0ecd-4cae-9696-ae1eb5bcd283';

11. Update User Role
update auth.users
set raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{role}',
  '"CPO"'
)
where id = '5c07a0ee-0ecd-4cae-9696-ae1eb5bcd283';

12. Annual M/M Records Table
-- 기존 테이블 삭제 후 재생성
drop table if exists worker_mm_records;

create table worker_mm_records (
  id uuid default uuid_generate_v4() primary key,
  worker_id uuid references workers(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  year int not null,
  month int not null,
  mm_value decimal(5,2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(worker_id, project_id, year, month)
);

13. Worker Management Schema

-- 1. 기존 테이블/타입 삭제
DROP TABLE IF EXISTS worker_mm_records;
DROP TABLE IF EXISTS workers;
DROP TYPE IF EXISTS worker_job_type;
DROP TYPE IF EXISTS worker_level_type;
DROP TYPE IF EXISTS worker_type;
DROP TYPE IF EXISTS worker_grade_type;

-- 2. ENUM 타입 생성
CREATE TYPE worker_job_type AS ENUM ('기획', '디자인', '퍼블리싱', '개발', '기타');
CREATE TYPE worker_level_type AS ENUM ('초급', '중급', '고급', '특급');
CREATE TYPE worker_type AS ENUM ('임직원', '협력사임직원', '프리랜서(기업)', '프리랜서(개인)');
CREATE TYPE worker_grade_type AS ENUM ('BD', 'BM', 'PM', 'PL', 'PA');

-- 3. workers 테이블 생성
CREATE TABLE workers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR NOT NULL,
  worker_type worker_type,
  grade worker_grade_type,
  job_type worker_job_type,
  level worker_level_type,
  price INTEGER,
  is_dispatched BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. worker_mm_records 테이블 생성
CREATE TABLE worker_mm_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  mm_value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 활성 상태의 실무자 이름에 대한 유니크 인덱스 생성
CREATE UNIQUE INDEX workers_active_name_idx ON workers (name) 
WHERE deleted_at IS NULL;

14. Projects Table
-- 기존 테이블들과 타입 삭제
DROP TABLE IF EXISTS project_manpower;
DROP TABLE IF EXISTS project_workers;
DROP TABLE IF EXISTS projects;
DROP TYPE IF EXISTS project_role_type;

-- 직무 타입 생성
CREATE TYPE project_role_type AS ENUM (
  'BD(BM)',
  'PM(PL)',
  '기획',
  '디자이너',
  '퍼블리셔',
  '개발'
);

-- projects 테이블 생성
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  client VARCHAR,
  start_date DATE,
  end_date DATE,
  status VARCHAR CHECK (status IN ('준비중', '진행중', '완료', '보류')),
  budget BIGINT,
  category VARCHAR CHECK (category IN ('운영', '구축', '개발', '기타')),
  major_category VARCHAR CHECK (major_category IN ('금융', '커머스', 'AI', '기타')),
  description TEXT,
  
  -- 계약 관련 정보
  contract_type VARCHAR CHECK (contract_type IN ('회차 정산형', '정기 결제형')),
  is_vat_included BOOLEAN DEFAULT false,
  common_expense BIGINT,
  
  -- 회차 정산형 정보
  down_payment BIGINT,
  intermediate_payments BIGINT[],
  final_payment BIGINT,
  
  -- 정기 결제형 정보
  periodic_unit VARCHAR CHECK (periodic_unit IN ('month', 'week')),
  periodic_interval INTEGER,
  periodic_amount BIGINT,
  
  -- 직무별 전체 공수 정보
  planning_manpower NUMERIC,              -- 기획 전체 공수
  design_manpower NUMERIC,                -- 디자인 전체 공수
  publishing_manpower NUMERIC,            -- 퍼블리싱 전체 공수
  development_manpower NUMERIC,           -- 개발 전체 공수
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 프로젝트-실무자 연결 및 공수 정보 테이블
CREATE TABLE project_manpower (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  role project_role_type NOT NULL,
  mm_value NUMERIC NOT NULL DEFAULT 0 CHECK (mm_value >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  UNIQUE(project_id, worker_id, role)
);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- projects 테이블 트리거
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- project_manpower 테이블 트리거
CREATE TRIGGER update_project_manpower_updated_at
    BEFORE UPDATE ON project_manpower
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책 설정
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_manpower ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 접근 권한을 주는 새로운 정책
CREATE POLICY "Enable access for all users" ON projects
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable access for all users" ON project_manpower
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 모든 사용자(익명 포함)에게 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

15. Access Control Policeies for Projects
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON project_manpower;

-- 모든 사용자에게 접근 권한 부여하는 새로운 정책
CREATE POLICY "Enable access for all users" ON projects
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable access for all users" ON project_manpower
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 익명 사용자에게도 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

16. Add columms and create project monthly efforts table
-- NULL 데이터 삭제 및 테이블 구조 수정을 위한 통합 SQL
-- 1. NULL 데이터 삭제
DELETE FROM project_manpower 
WHERE project_id IS NULL;

-- 2. project_manpower 테이블 수정
ALTER TABLE project_manpower 
ALTER COLUMN project_id SET NOT NULL,
ALTER COLUMN role DROP NOT NULL,
ALTER COLUMN grade DROP NOT NULL;

-- 3. 복합 유니크 제약조건 추가
ALTER TABLE project_manpower
ADD CONSTRAINT unique_project_worker_role 
UNIQUE (project_id, worker_id, role);

-- 4. project_monthly_efforts 테이블 수정
ALTER TABLE project_monthly_efforts 
ALTER COLUMN mm_value DROP NOT NULL,
ALTER COLUMN mm_value SET DEFAULT NULL;
