import { useState } from 'react'
import { useApp } from './AppContext'
import type { Command } from './platformStore'
export function useAdmin() {
  const app = useApp()
  const [message, setMessage] = useState('')
  function save(command: Command) { const error = app.run(command); if (!error) setMessage('저장했습니다. 연결된 화면에 변경사항을 반영했습니다.'); return error }
  const feedback = <>{message && <p role="status" className="notice-box">{message}</p>}{!app.storageAvailable && <p className="notice-box">브라우저 저장을 사용할 수 없어 현재 창의 메모리에서 시연합니다. 새로고침하면 변경사항이 초기화됩니다.</p>}</>
  return { ...app, save, feedback }
}
