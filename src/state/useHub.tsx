import { useSearchParams } from 'react-router'
import { useState } from 'react'
import { useApp } from './AppContext'
import type { HubCommand } from '../types/hub'

export function useHub() {
  const app = useApp()
  const [params, setParams] = useSearchParams()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const hub = app.data.hub
  const pos = hub.poses.find(p => p.id === params.get('pos')) ?? hub.poses[0]
  const interfaces = hub.interfaces.filter(i => i.posId === pos.id)
  const iface = interfaces.find(i => i.id === params.get('interface')) ?? interfaces[0]
  const store = app.data.stores.find(s => s.id === params.get('store')) ?? app.data.stores[0]
  const connection = hub.connections.find(c => c.storeId === store.id)!
  function select(key: string, value: string) { const next = new URLSearchParams(params); next.set(key, value); if (key === 'pos') next.delete('interface'); setParams(next); setMessage(''); setError('') }
  function save(operation: HubCommand) { const result = app.run({ type: 'hub', operation }); setError(result ?? ''); if (!result) setMessage('처리 결과를 저장했습니다. 연결된 화면에 반영했습니다.'); return result }
  return { ...app, hub, pos, interfaces, iface, store, connection, params, select, save,
    feedback: <>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="notice-box" role="status">{message}</p>}{!app.storageAvailable && <p className="notice-box">브라우저 저장이 차단되어 현재 창의 메모리에서 시연합니다.</p>}</>,
  }
}
