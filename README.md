# ADMS 오프라인 데모

React + TypeScript + Vite 기반 공통 앱 골격입니다. Mock 로그인, 역할별 홈/메뉴, 사업 Context, 조직·회원사·점포 모델과 공통 UI를 제공합니다. 시스템 관리자의 조직·계정·권한·사업·프로그램은 편집 가능한 시연 화면이며, 그 외 세부 업무 메뉴는 준비 화면입니다.

## 실행

개발 PC:

```sh
npm ci
npm run dev
npm run build
npm run build:single
```

시연 PC에는 **`dist/adms-demo.html` 하나만 복사**하고 Windows Chrome/Edge로 직접 엽니다. 서버, Node.js, 설치 프로그램, 인터넷 연결이 필요 없습니다. 라우팅은 HashRouter입니다.

일반 `build`는 일반 Vite 파일들을 생성합니다. `build:single`은 dist를 정리하여 단일 HTML을 생성하고 정적 검사를 실행합니다. 배포할 때 마지막 명령은 `build:single`이어야 합니다.

## 데모 계정

| ID | PW | Role |
|---|---|---|
| admin | 1234 | 시스템 관리자 |
| at | 1234 | AT / 관리감독기관 |
| assn | 1234 | 협회 / 운영기관 |
| mart | 1234 | 마트 대표 관리자 |

로그인 화면에서 계정 버튼으로 입력란을 채울 수 있습니다. 로그인/로그아웃과 사업 선택이 가능합니다. 저장소 사용이 가능하면 새로고침 후 계정/사업을 복구하고, localStorage가 차단되어도 메모리에서 동작합니다. 저장소 차단 시 새로고침 후에는 다시 로그인합니다. 실제 운영 인증이 아닙니다. 관리 화면에서 생성한 계정도 정상 상태일 때 데모 비밀번호 `1234`로 로그인합니다. 변경된 마스터는 브라우저 저장이 가능하면 새로고침 후에도 유지됩니다.

## 기준 및 구조

- [AGENTS.md](AGENTS.md): 단일 HTML·오프라인 개발 규칙
- [PRD](docs/ADMS_PRD_v1.md): 제품 요구사항의 기준
- [전체 구현계획](docs/IMPLEMENTATION_PLAN.md): 단계별 업무 구현 계획
- [시스템 관리자 구현 결과](docs/SYSTEM_ADMIN_IMPLEMENTATION.md): 변경 파일, 화면/Interaction, 모델, 판단사항, 미구현 범위 및 검증 결과
- [공통 기반 구현 결과](docs/FOUNDATION_IMPLEMENTATION.md): 파일·메뉴·모델·준비 화면·결정사항·검증 결과
- `src/types`, `src/data`: 공통 모델/상태, mock 마스터와 관계
- `src/navigation`, `src/access`: 프로그램/권한/사업 매핑과 공통 접근 판정
- `src/state`: mock 세션, React Context, 저장소 fallback
- `src/pages`, `src/layouts`, `src/components`: 페이지, 앱 셸, 공통 UI

사업과 조직은 N:M 관계로, 회원사와 점포는 별도 객체로 구성했습니다. 메뉴를 Role별 JSX로 중복 작성하지 않습니다. 기존 React Router/Lucide/Tailwind/단일 HTML 플러그인을 사용하며 신규 패키지는 추가하지 않았습니다. Recharts는 후속 업무 차트용으로 기존 의존성을 유지합니다.

농할 운영과 정산 메뉴를 분리했습니다(협회/마트: 농할 정산, AT: 정산 관리). 시스템 관리자의 사업 선택은 사업 관련 조회 Context이며, 전역 마스터와 전체 프로그램 목록은 선택 사업과 독립적입니다.

## 검증

```sh
npm run lint
node scripts/check-foundation.mjs
node scripts/check-admin.mjs
npm run build
npm run build:single
node scripts/smoke-offline.mjs <Playwright의 index.mjs 절대경로>
node scripts/smoke-admin.mjs <Playwright의 index.mjs 절대경로>
node scripts/smoke-navigation.mjs <Playwright의 index.mjs 절대경로>
```

`check-foundation.mjs`는 개발용 Node 24의 TypeScript stripping을 사용합니다. 브라우저 테스트는 개발 PC의 Playwright와 Edge를 사용하며 배포 HTML에는 이 도구들이 필요하지 않습니다.

2026-10-05: 두 빌드, lint, 모델 검증, Edge file://의 네 계정/사업 전환/메뉴/접근가드/검색/상세/로그아웃, localStorage 허용·차단, 손상 세션 복구, 모바일 메뉴 검증을 통과했습니다. 운영·정산 메뉴 분리와 전역 마스터의 사업 독립성도 검증했습니다. 외부 리소스 요청과 JS 오류는 0건입니다. 관리자 생성·수정·상태전환·Role 권한·사업 매핑·메뉴 반영도 실제 클릭으로 검증했습니다. 최종 파일은 약 375 kB입니다.

PRD 업무 화면을 추가할 때도 네트워크 의존, 외부 자산, 별도 런타임 청크를 도입하지 않고 위 검증을 유지합니다.

## 조직 탐색 및 Sidebar UX

조직 관리 Tree는 노드별 접기/펼치기, 전체 제어, 유형 표시, 방향키 탐색을 제공합니다. 검색 중에는 결과의 상위 경로를 자동으로 펼치고 검색 초기화 시 기존 펼침 상태와 스크롤 위치를 복원합니다. 부모를 접어도 하위 펼침 상태는 유지됩니다. Tree 본문은 검색 도구와 분리된 독립 스크롤입니다.

Sidebar는 홈을 독립 메뉴로 두고 현재 페이지의 그룹을 자동으로 펼칩니다. 다른 그룹은 기본적으로 접혀 있으며 사용자가 조작한 상태는 계정별 localStorage에 저장합니다. 저장소 차단 시 현재 앱 세션의 메모리에서 유지합니다. 메뉴명·경로·권한·사업 매핑과 관리자 업무 기능은 변경하지 않았습니다.

추가 검증: Edge file:// 및 offline 환경에서 613개 조직 탐색, 검색 경로/복원, Leaf 표시, Sidebar 자동/수동 펼침과 상태 복구, 모바일 가로 넘침을 확인했습니다. 기존 관리자 업무 회귀검증도 통과했습니다. 최종 HTML은 381,570바이트입니다.

## POS 연동 HUB

중단된 작업의 `hub.ts`, `hubCatalog.ts`, `hubSeed.ts`, `hubStore.ts`를 이어서 사용했습니다. 기존 조직·계정·권한·사업·프로그램 화면과 Navigation 구조는 유지했습니다. 신규 패키지는 추가하지 않았습니다.

| 메뉴 | 시연 Interaction |
|---|---|
| POS 마스터 | 검색, 상세, 등록/수정, 활성화/사용중지 |
| Capability | 기능 조합 선택/저장, 표준 필드 요구 미리보기, 연결 점포 영향 확인 |
| 데이터소스·인터페이스 | POS별 프로파일 등록/수정, 방식·방향·대상 Capability 설정 |
| 표준 스키마 | Schema 선택, Field 검색, 타입·필수 여부·Sample·관련 Capability 상세 |
| 필드·코드 매핑 | 원천 Field 선택, 타입/코드 변환, 가매핑, Sample 검증, 비활성 매핑 조회 |
| 점포 POS 연동 | 방식별 접속 폼, 연결/식별/Sample/매핑/Capability 테스트, 실패·재시도·활성화 |
| 연동 현황·이력 | 상태 필터, 점포 상세·테스트 이력, Mock 수집, 중지·재연결 |

모델은 POS Master → Interface → Field Mapping과 Store → Store Connection을 분리합니다. Capability Catalog가 표준 Schema/Field 요구를 연결하고, 새 기능에 필요한 미매핑 작업을 생성합니다. Capability OFF는 기존 매핑을 보존하며 연결 점포는 재검증합니다. POS 지정과 정상 연동은 별도 상태입니다. 모든 HUB 마스터는 선택 사업과 독립적입니다.

초기 상태: 한빛마트 본점 정상 연동, 강서점 데이터 검증중(지원금 미매핑), 마곡점 접속 미설정, 다른 POS 점포는 제한된 기능과 연결 오류 사례입니다. 기존 저장 데이터는 관리자 변경사항을 보존하면서 HUB 데이터를 추가합니다. localStorage 차단 시 현재 세션 메모리에서 동작합니다.

실제 API/DB 통신, POS사별 원천 규격, Excel 파일 파싱, 운영 인증/암호화는 구현하지 않았습니다. 연결·수집·검증은 내장 Mock Sample을 사용합니다. 접속 Secret 원문은 저장하지 않고 설정 여부만 보존합니다. 표준 Schema Catalog는 조회용이며 운영 버전 관리/사용자 정의 필드 편집은 후속 범위입니다.

주요 파일: `src/pages/hub/*`, `src/components/hub/*`, `src/state/useHub.tsx`; 기존 HUB 모델/카탈로그/Seed/Store와 `src/state/platformStore.ts`, `src/types/platform.ts`, `src/data/seed.ts`, `src/pages/ProgramPage.tsx`, `src/index.css`를 연결했습니다.

```sh
node scripts/check-hub.mjs
node scripts/smoke-hub.mjs <Playwright의 index.mjs 절대경로>
```

2026-10-05 POS HUB 검증: `npm run build`, `npm run build:single`, lint 및 공통 기반/관리자/HUB 모델 검증 통과. Edge에서 최종 HTML을 `file://` + offline으로 실행해 7개 실제 화면과 전체 설정→실패→복구→정상 연동 흐름, Capability OFF 매핑 보존, 새로고침 저장, 저장소 차단 fallback을 확인했습니다. 기존 offline/admin/navigation smoke도 통과했습니다. 외부 리소스 요청과 JS 오류는 0건이며 dist에는 `adms-demo.html` 하나(444,656바이트)만 있습니다.

## 시스템 운영

기존 관리자/POS 화면·데이터 구조를 유지하고 `excel-templates`, `jobs`, `notifications`, `audit`에 실제 시연 화면을 연결했습니다. 시스템 운영 데이터는 별도 `adms.demo.operations.v1` 저장 영역과 React 구독 상태로 관리하며 저장소 차단 시 메모리를 사용합니다. 선택 사업은 이 전역 운영 마스터를 제한하지 않습니다. 감사 화면에서 별도 사업 필터를 제공합니다.

| 화면 | Interaction / 사례 |
|---|---|
| Excel 양식 | 8개 업무 양식, 신규 등록, 새 Version 생성, 기간·Column 검증, 활성/중지, 이전 Version 상세/History, Template/Sample 다운로드 Mock. 만료·중지 사례 포함 |
| 자동 작업 현황 | 6개 작업의 상태/주기/최근·정상 실행/다음 예정/처리량/시간/오류, 실행이력, 대상 확인·사유 입력 후 Mock 재실행, 실패/복구. 지연·실패·중지 사례 포함. Scheduler 편집 없음 |
| 알림 관리 | 7개 개발 등록 유형, 수신 Role/조직·채널·시점·반복·사용상태 설정, %, 시간, 분, D일 기준값 검증·변경. Rule/Trigger 생성·수정 없음 |
| 감사·변경 이력 | 기존 관리자 변경 기록·POS 실행 이력·운영 변경/다운로드 기록 통합, 기간/사업/조직/사용자/메뉴/Action/Entity/결과 검색, 시간 정렬, 전후값·사유·연결 ID 상세, 검색 결과 추출. 수정/삭제 없음 |

다운로드는 서버나 Excel 설치 없이 브라우저 Blob으로 생성하는 UTF-8 CSV Mock입니다. 실제 XLSX와 기관별 공식 양식/파싱 규격, 실 Scheduler/메시지 발송/금융 처리, 서버의 변조 방지 감사 저장·보존정책은 TBD입니다. 신규 운영 로그에는 처리자/조직/Role 스냅샷을 저장합니다. 기존 로그에 없던 당시 사유/Role/조직은 복원했다고 주장하지 않으며 상세에 메타데이터 한계를 표시합니다. 예산/정산/지급 등 미구현 업무의 이력은 명시적인 Seed 예시입니다.

추가 파일: `src/types/operations.ts`, `src/data/operations.ts`, `src/state/operationsStore.ts`, `src/state/useOperations.tsx`, `src/pages/system/{TemplatesPage,JobsPage,NotificationsPage,AuditPage,SystemPage}.tsx`, `scripts/check-operations.mjs`, `scripts/smoke-operations.mjs`. 연결을 위해 `src/pages/ProgramPage.tsx`와 운영 전용 스타일을 추가한 `src/index.css`, 이 README를 수정했습니다. 신규 패키지는 없습니다.

```sh
node scripts/check-operations.mjs
node scripts/smoke-operations.mjs <Playwright의 index.mjs 절대경로>
```

시스템 운영 검증: 두 빌드 및 lint/모델 검증 통과. Edge file:// + offline에서 저장소 허용·차단 모두 양식/Version, CSV 파일 다운로드, 재실행 실패/복구, 알림 변경, 감사 검색/추출/접근가드를 확인했습니다. 기존 관리자/POS/Navigation 회귀검증도 모두 통과했습니다. 최종 산출물은 `dist/adms-demo.html` 하나(475,280바이트)입니다.

## 협회 / 운영기관 업무 기반

`assn / 1234`로 로그인합니다. 기존 시스템 관리자·POS HUB·시스템 운영 화면은 유지하고 협회 홈과 24개 프로그램에 업무 화면을 연결했습니다. 공통 Navigation의 사업-프로그램 매핑과 Role Action 권한을 계속 사용합니다. 현재 사업에 연결되지 않은 메뉴는 표시되지 않으므로 농할과 알뜰소비플랫폼을 각각 선택해 시연합니다.

### 공통 모델과 데이터 흐름

`src/types/workflow.ts`는 플랫폼의 조직/회원사/점포/계정/사업/참여 객체를 참조하며 동일 객체를 협회 전용으로 복제하지 않습니다. CompanyProfile/StoreProfile은 기존 ID에 연결된 부가 정보입니다. 운영기관과 하위조직 Scope는 조직 관계로 계산하고, 사업의 operator 매핑으로 업무 범위를 결정합니다. 한국마트협회 외 비교용 운영조직도 같은 Seed 생성기를 사용합니다.

- 가입 신청과 사업 참여 신청을 분리합니다. 가입 승인으로 기존 플랫폼 Store에 조직·회원사·기본점포·대표 관리자·미설정 POS 연결이 생성되며, 사업 참여는 별도로 점포를 선택해 승인합니다.
- WeeklyRound는 공식 AT 원천값과 협회 운영값을 분리합니다. 목~수, 동일 사업의 기간 중복, 연간 한도와 배분 합계를 검증합니다. 확정된 주차가 점포별 상품등록 대상이 되며 직접/지회 경유 배분은 동일 점포 배정 원장을 사용합니다.
- RepresentativeProduct 1:N StoreEventProduct → SaleTransaction → ExecutionSummary를 연결합니다. 집행 KPI·잔액·소진율·예산소진 이상감지는 같은 거래에서 계산합니다. POS 상품/매출 입력은 기존 HUB의 실제 연결 및 해당 Capability를 확인합니다.
- SettlementBatch는 여러 주차를 묶고 최초 SettlementClaimSnapshot의 금액/거래는 고정합니다. API/Excel 제출은 같은 원본의 별도 제출 이력입니다. RejectionCase/AppealCase는 증빙·소명·협회 의견·판정 이력을 보존합니다. 재심사중 금액은 보류하며 최종 불인정만 가용예산 환원 Ledger를 생성합니다.
- FinalSettlement에서 점포별 Payout을 생성합니다. 정부지급 대기 → 협회 입금확인 → 검증계좌 지급준비 → 승인/지급중 → 완료 또는 실패/재처리 순서입니다. 지급ID는 재시도에서도 유지하며 완료 대상의 중복 지급을 차단합니다. 정부 송금 자체는 실행하지 않습니다.
- Due/Deposit/Receipt/Alias, PublicProduct/FlyerPublication/IntegrationStatus, 내부 Notice/외부 CMS 콘텐츠, 운영기관 설정도 같은 PlatformData.workflow 상태에서 관리합니다. 가입 승인·예산·정산·지급 변경 기록은 기존 감사 화면에서 조회 가능합니다.

### 화면과 Interaction

| 영역 | 구현 범위 |
|---|---|
| 홈 | 처리 필요 업무 이동, 회원/회비/금주/차주/정산 지표, 공지. 공개 사업에서는 참여/공개/오류/전단 지표 |
| 가입·참여 심사 | 별도 유형, 신청 상세, 점포 다중 선택, 승인/반려, 공통 객체 생성 |
| 회원사·관리자·지회 | 법적정보와 공식서류 확인 후 수정, 지회 이동, 점포/POS 지정 변경 경고, 계정 상태·대표 경고·부관리자 상한, 지회 생성/수정/상태 |
| 회비·수납 | 추천 회원사 확인/수정, 분류·수납 확정·Alias, 회비/비회비 및 자동·수기·Excel Source |
| 예산·주차 | 연간 조정, AT 계획 수신 Mock/운영값 등록/확정, 균등/가중치 Sample 배분, 예비비 추가/미사용 회수, 원장 |
| 상품·집행·이상 | 점포→실제 판매상품→거래 상세, POS 수집/AI 후보·Excel Sample·직접 입력, 사진/제어된 Override/확정, 집행 추가/종료 Mock, 이상 건 상태·메모 |
| 청구·재심사·지급 | 차수 생성, 최초청구 고정, API/Excel 제출, AT 결과/마트 소명 수신 Mock, 협회 검토, AT 판정 수신, 보류/환원, 최종정산 및 지급 실패/복구 |
| 알뜰소비플랫폼 | 참여 상태, 공개 상품 선택, 전단/OCR 후보 확인/게시, 마지막 성공 스냅샷·실패/재전송 |
| 통계·공지·CMS·설정 | 공통 Filter 및 Recharts/표, 공지 대상/기간/중요, 외부 콘텐츠 작성·수정·중지, 표시명·부관리자 상한 |

### Mock / 후속 명세

이번 대상 메뉴에는 설명만 있는 Placeholder가 없습니다. CMS는 콘텐츠 메타데이터 편집이며 실제 외부 홈페이지 게시/이미지 편집기가 아닙니다. 통계는 공통 데이터의 기본 집계·차트이며 각 업무의 전체 보고서 규격은 후속 범위입니다. 지회/마트/AT Role의 상세 업무 UI는 이번에 확대하지 않았고 해당 역할 이벤트를 명시적인 수신 Mock으로 재현합니다.

AT 공식 계획/판정, POS 수집, 은행 결과, OCR/AI, 자동입금 추천은 외부 통신 없이 재현합니다. 전단 Upload는 파일명과 내장 SVG 원본 예시를 사용합니다. 업무 Excel 다운로드는 UTF-8 CSV Mock이며 공식 XLSX 양식/기관 규격은 미정입니다. 가중치 입력은 Sample 또는 CSV 미리보기입니다. 법적서류·사진·계좌검증은 확인 상태와 내장 증빙 Mock입니다. Alias는 기록하되 실제 은행 매칭 알고리즘은 구현하지 않습니다.

PRD를 변경하지 않았습니다. 부관리자 기본 상한 2명은 수정 가능한 시연 설정이며 기관 정책으로 확정하지 않습니다. Home 마감 시간은 명시한 시연 기준일로 계산합니다. 최종판정의 승인/반려와 마트의 불인정 수용은 별도 상태입니다. 최종청구/정산과 지급 상태를 합치지 않으며, 재시도는 기존 지급ID를 사용합니다. 외부 규격, 마감 자동처리 정책, 실제 이체 승인 권한/은행 파일, 공식 문서 보존 규칙은 추가 명세가 필요합니다.

주요 추가 파일: `src/types/workflow.ts`, `src/data/workflow{Seed,Permissions,Format}.ts`, `src/state/{workflowStore.ts,useWorkflow.tsx}`, `src/components/workflow/WorkflowUI.tsx`, `src/pages/association/{AssociationPage,AssociationHome,MembershipPage,AgriculturePage,SettlementPage,PublicPage,SupportingPage}.tsx`, `scripts/{check-workflow,smoke-workflow}.mjs`. 연결 변경: 플랫폼 타입/Seed/Store, HomePage/ProgramPage, 기존 smoke-offline 및 README. 신규 패키지는 없습니다.

### 검증

```sh
node scripts/check-workflow.mjs
node scripts/smoke-workflow.mjs <Playwright의 index.mjs 절대경로>
```

2026-10-05: build/build:single/lint 및 공통 기반/관리자/POS HUB/시스템 운영/협회 도메인 모델 검증 통과. Edge file:// + offline에서 저장소 허용·차단 모두 전체 협회 메뉴와 핵심 Cross-page 흐름을 실제 클릭했습니다. 최초청구 4,720,000원 → 보류 100,000원 → 최종반려 환원 → 인정 4,620,000원 → 지급 실패/재처리를 검증했고 최초 스냅샷은 유지됩니다. 저장소 허용 시 새로고침 후 상태 보존, 차단 시 메모리 동작, 모바일 넘침 방지, 기존 4계정/admin/613노드 탐색/POS/시스템 운영 회귀 검증도 통과했습니다. 외부 요청·JS 오류는 0건이며 dist에는 adms-demo.html 하나만 생성됩니다. 일반 build의 큰 번들 경고는 Recharts 포함 크기 안내이며 최종 배포는 요구사항대로 단일 HTML입니다.

## 협회 UI/UX 및 시연 데이터 개선

업무 Domain/State, 청구 Snapshot, 예산 Ledger 및 Cross-page 처리 로직을 유지하면서 협회 화면 표현과 Seed를 개선했습니다. 시스템 관리자/POS HUB 화면 코드는 수정하지 않았습니다. 공통 플랫폼 객체에 회원사·점포 사례가 추가되어 관리자 마스터 목록에서도 같은 객체를 조회합니다.

- 협회 회원사 25개 / 점포 58개 / 5개 지회, 다양한 POS·연동상태·참여/미참여·휴면/탈퇴 예정 사례입니다. 회원사 관리에 5개 KPI, 이름/대표자/사업자번호 검색, 지회/POS/농할 참여 Filter, 10/20/50개 Pagination을 제공합니다. 기존 회원사 상세와 수정 Interaction은 유지합니다.
- 회비는 회비 현황 / 입금 매칭 / 미납 관리로 구분합니다. 25개 회원사의 당월 청구 2,500,000원, 수납 1,000,000원, 미수금 1,500,000원과 31개 입금 거래를 공유 데이터로 계산합니다. 정상납부/미납/1개월 및 장기 연체/선납/부분납 사례를 포함하고, 차월 선납과 비회비 수납은 당월 수납률에서 제외합니다. 추천 회원사 변경/분류/적용월/수납 확정/Alias는 기존 Command를 그대로 사용합니다.
- 모든 주차 선택은 현재31 → 차주32 → 지난30 → 지난29 → 지난28 순입니다. 주차명은 시간과 회차만 표현하며 정산/재심사 상태는 별도 한글 Badge로 표시합니다. 내부 코드/개발 표현과 하단 공통 Workflow 이동 버튼을 제거했습니다.
- 주차 KPI는 최대 6개이며 예산 화면의 연간 수치는 별도 펼침 영역입니다. 점포 Table의 배정/집행/잔액/소진율/상태/최근집계/Action을 분리하고 예산/상품/집행 화면의 편집 Action을 각 업무에 한정합니다. 확정 상품은 조회 상세를 제공하며 지급 처리는 해당 상태의 다음 업무만 표시합니다.
- 현재 주차의 예산 100,000,000원, 점포 배정 95,000,000원, 예비비 5,000,000원, 집행 50,320,000원, 참여 34점포를 같은 데이터에서 계산합니다. 확장된 지난30차 최초청구 예시는 26,368,000원이며 기존 불인정 처리/환원/지급 규칙은 동일합니다. 통계 차트는 많은 점포명을 겹쳐 표시하는 대신 지회별 합계로 표현합니다.
- 협회 전용 CSS로 1920px 본문 폭, 밀도, 상태 색상/크기, Table·Pagination·탭을 정리했습니다. 내부 공지와 외부 CMS 콘텐츠도 여러 조회 사례를 추가했습니다.

기존 저장 데이터에는 회원사/회비/콘텐츠 사례를 추가하지만 기존 사용자의 거래·배정·원장·청구는 재계산하지 않습니다. 따라서 기존에 진행한 주차의 대상·금액은 그대로 보존되며 확장된 전체 주차 데이터는 새 시연 데이터에서 확인됩니다. 저장소 차단 시 기존 메모리 fallback을 유지합니다. 사용자 추가 데이터가 있는 경우 전체 회원사/점포 수는 기본 Seed보다 많을 수 있습니다.

추가 파일: `src/data/{associationDemo,associationSummary,workflowPresentation}.ts`, `src/components/workflow/{AssociationList,AssociationTable,WorkflowStatus}.tsx`, `src/pages/association/{CompanyList,FeesPage}.tsx`, `scripts/{check-association-ux,smoke-association-ux}.mjs`. 변경: 협회 기존 페이지, WorkflowUI, Seed/저장 데이터의 추가 이관 연결, 협회 전용 CSS, 확장 Seed에 맞춘 기존 검사 스크립트 및 README. 모델 관계와 workflowStore의 상태 전이·계산은 변경하지 않았고 신규 패키지는 없습니다.

검증: build/build:single/lint, 모델 정합성, Edge file:// offline의 전체 협회 메뉴·개발 Label 제거·주차 순서·Filter/Pagination/Detail·회비 합계·화면별 Action·기존 핵심 Workflow를 저장소 허용/차단에서 통과했습니다. 1920px와 390px 화면, 기존 4계정/offline/admin/POS HUB/시스템 운영 및 695개 조직 탐색 회귀검증도 통과했습니다. 외부 요청과 JS 오류는 0건이며 최종 dist에는 adms-demo.html 하나만 있습니다.

## 협회 직접 계획 및 업무 상세

- 주차별 계획의 직접 등록/AT 가져오기는 같은 주차 Command와 생성·확정 State를 사용한다. 출처는 각각 협회 직접 등록/AT 연계로 보존한다. 대표품목 복수 선택/추가, 예비비 비율·금액 입력, 기존 목~수 주차 정책과 동일 사업 기간 중복·필수값 검증을 제공한다.
- 회원사 6개 탭, 점포, 지회, 행사상품, 집행, 이상건, 청구, 불인정 Summary/Case, 최종정산/지급은 공통 데이터 조회 Drawer로 연결된다. Drawer를 닫아도 현재 List Filter/Page/주차는 유지된다.
- 행사상품 대표품목 1:N, 집행/청구 품목→거래 Drill-down과 기존 예산 증감·재심사·지급 Action을 재사용한다. 예산 Ledger와 최초 청구 Snapshot은 그대로 보존한다. 자동 파생 무실적 건은 최초 조치 시 기존 AnomalyCase에 보존하고 기존 변경로그로 이력을 조회한다.
- 사진은 기존 첨부 여부 Mock으로 표시한다. 실제 사진 원본/판매상품 규격/외부 POS 상품코드/은행 계좌 원문은 현재 데이터에 없으므로 임의 생성하지 않는다. 대표규격, ADMS 상품코드 및 마스킹된 시연 계좌를 구분해서 표시한다. 초기 이상건 발생시각/일부 초기 지급일은 원본 미등록으로 표시한다. 외부 API·기관 정책 상세는 기존 TBD를 유지한다.
- 추가 검증: node scripts/check-association-details.mjs 및 node scripts/smoke-association-details.mjs <Playwright index.mjs 경로>. Edge file:// offline / localStorage 허용·차단 모두 직접 등록부터 상세 조회·조치·지급까지 검증한다.

## 집행실적 점포 판매 검증 상세

집행실적 Drawer만 한 줄 6항목 Summary, 품목별 8컬럼 합계, POS 판매 16컬럼 Table로 변경했다. 20/50행 Pagination과 가로 Scroll을 제공하고, 추가배정/예산회수/이력조회만 제공한다. 다른 업무 상세와 집행 계산·State·Ledger·청구 Snapshot은 변경하지 않는다.

기존 수량 집계 거래를 읽기 전용 판매 예시로 펼친다. 거래/영수증/상품/점포/POS/마스킹 고객 코드는 표시용 Mock이며 실제 POS 규격을 확정하지 않는다. 자체할인도 표시용 예시다. 취소·반품은 신규 정상 예시와 음수 원거래로 상계하여 농할지원금·수량·판매금액의 전체 합계를 유지한다. 상세 총 거래건수는 펼친 시연 판매 행 기준이며, 기존 도메인 집계 레코드 수와 구분한다. 이 행은 거래 State/정산 원본에 저장하거나 반영하지 않는다.

검증: node scripts/check-execution-view.mjs 및 node scripts/smoke-execution-view.mjs <Playwright 경로>. 모든 점포/주차 합계와 원본 불변성, 20행·16컬럼·취소/반품/주의·원거래, Filter/Pagination/Scroll, 예산 Action, 저장소 차단 및 offline를 검사한다.

## 관리자 범용 연동/공통코드 및 심사 IA 보완

외부 연동 4메뉴는 공통 관리 UI를 사용한다. AT/알뜰소비/금융/기타 8개 전역 Mock 프로파일의 API/File/Excel/Manual/Batch 방식, 방향, 상태, 성공/실패 시각, 오류, 송수신 건수 및 보존 이력을 조회하고 Mock 재처리/재검증한다. 실제 Endpoint/인증/은행 전문은 TBD이며 기존 농할/지급 State에 반영하지 않는다.

공통코드는 조직유형/계정/사업/POS/정산 상태와 알림채널의 전역 Catalog다. 등록/표시명·설명·순서 수정/활성·비활성과 그룹 내 중복검증을 제공한다. 기존 코드키는 유지하며 기존 업무 enum/표시/Workflow는 바꾸지 않는다. 두 신규 운영 객체는 기존 operations 저장소에 추가하고 감사이력에 기록한다. 이전 저장소의 양식/작업/알림/이력을 유지하고 누락된 Catalog만 추가한다.

협회 회원가입 심사(membership-review)와 사업 참여 심사(participation-review)를 분리했다. 전자는 소속기관의 Membership Application, 후자는 선택 사업의 Participation Application을 동일 컴포넌트의 mode로 조회한다. 기존 승인/반려 Command와 객체 생성/참여 반영은 유지한다. 참여 Command의 프로그램 권한만 새 메뉴에 연결한다. 이전 저장 데이터는 기존 심사 권한/조직 예외/프로그램 중지 및 상위메뉴를 승계하고 반복 이관이나 새로고침 시 의도적 권한 제거를 되돌리지 않는다. 운영자 계정 현황은 관리자 계정 관리로 표시한다.

추가 검증: scripts/check-structural-completion.mjs, scripts/smoke-structural-completion.mjs, scripts/audit-placeholders.mjs. Role별 실제 Sidebar 준비 화면의 전체 목록은 docs/PLACEHOLDER_STATUS.md에 기록한다. 종합통계/CMS는 기존 제한된 Mock 화면을 유지하며 별도 고도화 예정이다.
