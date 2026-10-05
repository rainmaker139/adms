// PRD 6장. 서로 다른 객체의 상태를 하나의 전역 status로 합치지 않는다.
export const statuses = {
  business: { planned: '준비', active: '진행', paused: '일시중지', ended: '종료', archived: '보관' },
  account: { pending: '승인대기', active: '정상', suspended: '정지', inactive: '비활성', deletable: '영구삭제 가능' },
  participation: { none: '미참여', draft: '신청작성중', submitted: '신청완료', reviewing: '심사중', rejected: '반려', scheduled: '참여예정', active: '참여중', stopping: '중지예정', stopped: '중지' },
  eventWeek: { received: '계획수신/등록', confirmed: '협회 확인', allocating: '예산배정중', registering: '행사상품 등록중', ready: '행사대기', executing: '집행중', ended: '집행종료', eligible: '정산대상', settling: '정산진행중', settled: '최종정산완료', paying: '지급대기/지급중', completed: '완료' },
  registration: { waiting: '데이터대기', mapped: '가매핑', checking: '확인필요', invalid: '검증오류', exception: '예외설정', confirmed: '정상확정', exceptionConfirmed: '예외확정', overdue: '마감미완료' },
  posConnection: { unset: '미설정', configuring: '설정중', pending: '연결테스트 대기', connected: '연결성공', validating: '데이터검증중', active: '정상연동', error: '연동오류', stopped: '연동중지' },
  settlement: { planned: '청구예정', submitted: '청구완료', reviewing: 'AT/정산 검토중', completed: '최종 정산 완료' },
  appeal: { checking: '마트 확인중', accepted: '불인정 수용', submitted: '이의신청 제출', associationReview: '협회 검토중', atReview: 'AT 재심사중', approved: '최종 승인', rejected: '최종 반려' },
  payment: { settled: '최종정산 완료', governmentPending: '정부지급 대기', received: '협회 입금확인', preparing: '점포 지급준비', processing: '지급중', partialFailure: '부분실패', completed: '지급완료' },
} as const

export type StatusDomain = keyof typeof statuses
export type StatusCode<D extends StatusDomain> = keyof typeof statuses[D]
