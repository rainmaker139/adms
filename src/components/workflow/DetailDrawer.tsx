import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
export default function DetailDrawer({title,context,onClose,children}:{title:string;context?:string;onClose:()=>void;children:ReactNode}) {
 const ref=useRef<HTMLDialogElement>(null), titleId=useId()
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close()},[])
 return <dialog className="association-drawer" ref={ref} aria-labelledby={titleId} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><header className="drawer-heading"><div>{context&&<p>{context}</p>}<h2 id={titleId}>{title}</h2></div><button className="icon-button" aria-label="상세 닫기" onClick={onClose}><X size={20} /></button></header><div className="drawer-body">{children}</div><footer className="drawer-footer"><button className="button secondary" onClick={onClose}>목록으로</button></footer></dialog>
}
