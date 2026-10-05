# ADMS 개발 규칙

- React + TypeScript + Vite 구조와 개발용 `npm run dev`를 유지한다.
- `npm run build:single` 결과는 `dist/adms-demo.html` 파일 하나여야 한다.
- 최종 HTML은 Windows Chrome/Edge에서 `file://`로 직접 열어 모든 시연 기능을 사용할 수 있어야 한다. 시연 PC에는 서버, Node.js, 설치 프로그램, 인터넷 연결이 필요 없어야 한다.
- 모든 CSS, JavaScript, 아이콘, 이미지, 필요한 자산을 HTML 안에 포함한다. 외부 파일 참조와 런타임 청크 로딩을 금지한다.
- 백엔드, 실제 DB, 외부 API, CDN, Google Fonts 등 외부 웹폰트, 외부 이미지 URL을 사용하지 않는다.
- 라우터는 `HashRouter`를 사용한다. `BrowserRouter`는 금지한다.
- `src/data`의 mock 데이터와 React 메모리 상태를 기본으로 사용한다. 핵심 기능은 localStorage가 없어도 동작해야 한다. 저장이 필요한 경우 예외를 처리하고 메모리 fallback을 제공한다.
- 이미지는 inline SVG 또는 import한 번들 내부 자산만 사용한다. public 자산 직접 참조는 금지한다. 시스템 폰트를 사용한다.
- 운영 서비스 수준의 복잡한 상태관리 라이브러리를 추가하지 않는다.
- `src/pages`, `src/components`, `src/layouts`, `src/data`, `src/types`, `src/assets`에 역할별로 코드를 정리한다.
- 요청받기 전에는 실제 업무 화면을 만들지 않는다.
- 변경 완료 시 `npm run build`와 `npm run build:single`을 실행하고 단일 HTML 검사 실패를 수정한다. dist에 추가 파일이 없어야 하며 외부 JS/CSS/CDN/네트워크 리소스 의존성이 없어야 한다.
- 가능한 경우 최종 HTML을 file://로 열어 메뉴, 차트, 상호작용을 검증한다.

## ADMS Product Source of Truth

The authoritative product specification for this project is:

`docs/ADMS_PRD_v1.md`

Rules:

- Always read and follow `docs/ADMS_PRD_v1.md` before making product, IA, workflow, data-model, or UI decisions.
- If the existing prototype or code conflicts with the PRD, the PRD takes precedence.
- Do not interpret the PRD to preserve the current prototype. Modify the prototype to conform to the PRD.
- Do not remove or simplify PRD-defined features merely because this is a prototype.
- Features that require backend integration may use mock data and mock interactions, but their workflow, states, and purpose must remain visible.
- Do not invent detailed specifications for external APIs, banking interfaces, POS-specific protocols, or institutional policies that the PRD leaves undefined. Keep those areas generic and extensible.
- Preserve the existing standalone demo requirement and ensure the final build continues to work as a single offline HTML file.