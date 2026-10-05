import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, ShieldCheck, Layers3 } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router'
import { useApp } from '../state/AppContext'

export default function LoginPage() {
  const { account, login, data } = useApp()
  const { roles } = data
  const accounts = data.accounts.filter(a => ['account-admin', 'account-at', 'account-assn', 'account-mart'].includes(a.id))
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  if (account) return <Navigate to="/home" replace />
  function submit(event: FormEvent) {
    event.preventDefault()
    if (login(loginId, password)) navigate('/home', { replace: true })
    else setError('아이디 또는 비밀번호가 올바르지 않습니다.')
  }
  return <div className="login-page">
    <section className="login-intro"><div className="brand"><span className="brand-mark"><Layers3 size={22} /></span><span>ADMS</span><small>통합 운영 플랫폼</small></div>
      <div className="intro-copy"><span className="intro-label">CONNECTED OPERATIONS</span><h1>조직과 사업을 연결하는<br />하나의 운영 공간</h1><p>회원사와 점포, 사업과 데이터를 연결합니다.<br />역할에 맞는 업무 공간에서 시연을 시작하세요.</p><div className="intro-path"><span>조직</span><span>사업</span><span>점포</span></div></div>
      <p className="intro-footer"><ShieldCheck size={17} />내부 시연용 · 오프라인 데모</p>
    </section>
    <main className="login-main"><div className="login-form-wrap"><p className="eyebrow">WELCOME TO ADMS</p><h2>로그인</h2><p className="page-description">데모 계정으로 역할별 업무 공간을 확인하세요.</p>
      <form onSubmit={submit} className="login-form">
        <label htmlFor="login-id">아이디</label><input id="login-id" name="username" autoComplete="username" placeholder="아이디를 입력하세요" required value={loginId} onChange={(e) => { setLoginId(e.target.value); setError('') }} />
        <label htmlFor="login-password">비밀번호</label><input id="login-password" name="password" type="password" autoComplete="current-password" placeholder="비밀번호를 입력하세요" required value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} />
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="button primary login-submit" type="submit">로그인<ArrowRight size={18} /></button>
      </form>
      <div className="demo-accounts"><div className="section-heading"><h3>시연 계정</h3><span>공통 비밀번호 <strong>1234</strong></span></div><div className="account-grid">{accounts.map((item) => <button key={item.id} type="button" onClick={() => { setLoginId(item.loginId); setPassword('1234'); setError('') }}><strong>{item.loginId}</strong><span>{roles.find((r) => r.id === item.roleId)?.name}</span></button>)}</div><p>계정을 선택하면 입력란이 채워집니다.</p></div>
      <p className="login-note">실제 인증을 수행하지 않는 Mock 로그인입니다.<br />브라우저 저장이 제한되어도 현재 창에서 시연할 수 있습니다.</p>
    </div></main>
  </div>
}
