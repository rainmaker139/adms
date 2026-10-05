# Role별 Placeholder 점검

- 기준: 2026-10-05 / 기본 Mock 프로그램·권한·사업 매핑
- Edge file:// offline에서 Role별 연결 사업의 Sidebar 메뉴를 모두 순회해 generic 준비 화면(placeholder-panel)을 확인했다.
- 지회·마트 부/일반 관리자는 테스트 세션으로 Role·조직·점포 범위를 구성했다. 실제 로그인 계정은 추가하지 않았다.
- 홈과 접근 거부 화면은 Placeholder 목록에 포함하지 않는다. 관리자 프로그램 마스터에서 다른 Role의 미구현 프로그램을 조회하는 경우는 Sidebar 점검과 구분한다.

## 시스템 관리자

점검 메뉴 24개 · Placeholder 0개

- 없음

## AT / 관리감독기관

점검 메뉴 10개 · Placeholder 10개

- 주차별 계획 관리 (week-plan)
- 운영 현황 (execution)
- 청구 내역 관리 (claims)
- 불인정·재심사 (appeals)
- 최종 정산 (settlement)
- 종합 통계 (statistics)
- 참여 현황 (public-participation)
- 공개 데이터 (public-data)
- 전단 게시 (flyers)
- 연동 현황·이력 (public-history)

## 협회 / 운영기관

점검 메뉴 25개 · Placeholder 0개

- 없음

## 지회 관리자

점검 메뉴 14개 · Placeholder 14개

- 회원사 관리 (companies)
- 회비·수납 (fees)
- 지회 정보 (branch-info)
- 주차별 계획 (week-plan)
- 행사상품 (event-products)
- 집행 실적 (execution)
- 정산 청구 (claims)
- 불인정·재심사 (appeals)
- 최종 정산 (settlement)
- 공지사항 (notices)
- 참여 관리 (public-participation)
- 공개 데이터 (public-data)
- 전단 게시 (flyers)
- 연동 현황·이력 (public-history)

## 마트 대표 관리자

점검 메뉴 17개 · Placeholder 17개

- 회원사 정보 (company-profile)
- 점포 운영 관리 (stores)
- 관리자 계정 관리 (company-accounts)
- 농할 참여 (join-nonghal)
- 알뜰소비 참여 (join-public)
- 향후 사업 (join-future)
- 행사상품 등록 (event-products)
- 집행 실적 (execution)
- 이상 감지 (anomalies)
- 정산 청구 (claims)
- 불인정·재심사 (appeals)
- 최종 정산·지급 (settlement)
- 공지사항 (notices)
- 공개 데이터 (public-data)
- 전단 게시 (flyers)
- 소비자 노출 미리보기 (consumer-preview)
- 연동 현황·이력 (public-history)

## 마트 부관리자

점검 메뉴 16개 · Placeholder 16개

- 회원사 정보 (company-profile)
- 점포 운영 관리 (stores)
- 농할 참여 (join-nonghal)
- 알뜰소비 참여 (join-public)
- 향후 사업 (join-future)
- 행사상품 등록 (event-products)
- 집행 실적 (execution)
- 이상 감지 (anomalies)
- 정산 청구 (claims)
- 불인정·재심사 (appeals)
- 최종 정산·지급 (settlement)
- 공지사항 (notices)
- 공개 데이터 (public-data)
- 전단 게시 (flyers)
- 소비자 노출 미리보기 (consumer-preview)
- 연동 현황·이력 (public-history)

## 마트 일반 관리자

점검 메뉴 15개 · Placeholder 15개

- 점포 운영 관리 (stores)
- 농할 참여 (join-nonghal)
- 알뜰소비 참여 (join-public)
- 향후 사업 (join-future)
- 행사상품 등록 (event-products)
- 집행 실적 (execution)
- 이상 감지 (anomalies)
- 정산 청구 (claims)
- 불인정·재심사 (appeals)
- 최종 정산·지급 (settlement)
- 공지사항 (notices)
- 공개 데이터 (public-data)
- 전단 게시 (flyers)
- 소비자 노출 미리보기 (consumer-preview)
- 연동 현황·이력 (public-history)

## 상세 고도화 예정 영역

- 협회 종합통계 및 홈페이지 CMS(게시판·게시물, 배너·팝업, 메뉴·콘텐츠, 회원가입 안내)는 기존 제한된 Mock 화면을 유지했다. generic Placeholder는 아니지만 상세 고도화 대상이다.
- 외부 연동 관리화면은 상태/처리/오류 이력과 Mock 재처리·재검증을 제공한다. 실제 Endpoint·인증·은행 전문·계약은 TBD다.
- 임의로 등록한 신규 프로그램은 연결된 전용 화면이 없으면 generic 준비 화면으로 표시될 수 있다.
