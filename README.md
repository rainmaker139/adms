# ADMS 오프라인 시연 개발환경

React + TypeScript + Vite를 유지하는 회사 내부 시연용 mock 프로젝트입니다.
실제 업무 화면 대신 사이드 메뉴, Dashboard KPI 3개, Recharts 차트 1개,
참여마트/농할운영의 메모리 카운터로 빌드와 상호작용만 검증합니다.

## 개발과 배포

개발 PC에는 Node.js와 npm이 필요합니다.

```sh
npm ci
npm run dev
npm run build
npm run build:single
```

`build`는 일반 Vite 빌드이며 `build:single`은 dist를 정리하고
**`dist/adms-demo.html` 하나만 생성**한 뒤 자동 정적 검사를 실행합니다.
배포에는 `build:single` 결과를 사용합니다. 단일 결과를 만든 뒤 일반 build를
다시 실행하면 dist는 일반 빌드 결과로 교체됩니다.

시연 PC에는 HTML 파일 하나만 복사하고 Chrome 또는 Edge로 직접 엽니다.
서버, Node.js, 설치 프로그램, 인터넷 연결은 필요하지 않습니다.
주소는 `file:///.../adms-demo.html#/dashboard` 형태이며 메뉴는 HashRouter로 전환합니다.
모든 데이터는 mock이며 상태는 메모리에만 있습니다. localStorage를 사용하지 않습니다.

## 구조

- `src/pages`: 최소 검증 화면
- `src/components`: KPI 카드
- `src/layouts`: 사이드 메뉴와 Outlet
- `src/data`: mock 데이터
- `src/types`: 데이터 타입
- `src/assets`: 향후 import하여 인라인할 로컬 자산
- `scripts/verify-single.mjs`: 파일 수, HTML/CSS 리소스, 모듈 참조 검사
- `scripts/smoke-offline.mjs`: Playwright를 사용하는 개발용 Edge file:// 검증
- `AGENTS.md`: 앞으로 적용할 오프라인/mock 개발 규칙

Tailwind CSS는 Vite 플러그인으로 컴파일하고 Lucide는 inline SVG로 렌더링합니다.
`vite-plugin-singlefile`은 JS/CSS를 HTML에 포함합니다.
public 디렉터리는 복사하지 않습니다. 시스템 폰트만 사용합니다.
일반 빌드의 500 kB 초과 경고는 React/Recharts를 함께 번들링한 결과입니다.
오프라인 배포에서는 코드 분할을 도입하지 않습니다.

## 검증

```sh
npm run verify:single
npm run lint
node scripts/smoke-offline.mjs <Playwright의 index.mjs 절대경로>
```

브라우저 검증 스크립트는 개발 PC의 Playwright와 Edge를 사용합니다.
시연 HTML에는 Playwright가 포함되지 않으며 시연 PC에 설치할 필요가 없습니다.
네트워크 offline과 localStorage 차단 상태에서 메뉴 3개, KPI 3개, 차트의 막대,
버튼 클릭, hash 경로 새로고침을 검사하고 추가 요청 및 JS 오류가 없는지 확인합니다.
React Router 내부의 프레임워크용 비정적 로더는 번들에 남지만 현재 HashRouter
구성에서는 호출되지 않습니다. 실제 페이지 코드에 동적 import를 추가하지 않습니다.

2026-10-03 검증: 일반/단일 빌드, lint, Edge file:// 검증 모두 통과했습니다.
최종 HTML은 약 630 kB입니다.

## 의존성 참고

설정은 [Tailwind Vite 공식 문서](https://tailwindcss.com/docs/installation/using-vite),
[HashRouter 공식 문서](https://reactrouter.com/api/declarative-routers/HashRouter),
[singlefile 플러그인 문서](https://github.com/richardtallent/vite-plugin-singlefile)를 참고했습니다.

현재 npm audit는 singlefile의 개발 전용 간접 의존성 `braces`와 그 상위 패키지에
high 항목 3개를 보고합니다. braces 최신 3.0.3에도 해당 항목이 있고, npm이 제안하는
singlefile 0.9.0 강제 다운그레이드는 Vite 8과의 호환성을 해칠 수 있어 적용하지 않았습니다.
이 의존성은 시연 HTML에 포함되지 않으며 현재 빌드는 외부 glob 입력을 받지 않습니다.
