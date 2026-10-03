import { useState } from 'react'
export default function TestPage({ title }: { title: string }) {
  const [count, setCount] = useState(0)
  return <>
    <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
    <p className="mb-4">메뉴 전환과 메모리 상태 확인용 화면입니다. 실제 업무 기능은 없습니다.</p>
    <button className="rounded border border-slate-300 bg-white px-4 py-2" onClick={() => setCount((value) => value + 1)}>동작 확인: {count}</button>
    <p className="mt-3 text-sm text-slate-500">횟수는 화면 이동 또는 새로고침 시 초기화됩니다.</p>
  </>
}
