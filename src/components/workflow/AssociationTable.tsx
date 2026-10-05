import { useState } from 'react'
import { DataTable } from '../common/ui'
import type { Column } from '../common/ui'
export default function AssociationTable<T>(props:{rows:T[];columns:Column<T>[];rowKey:(row:T)=>string;caption:string}) {
 const [page,setPage]=useState(1), max=Math.max(1,Math.ceil(props.rows.length/10)), current=Math.min(page,max)
 return <><DataTable {...props} rows={props.rows.slice((current-1)*10,current*10)} />{props.rows.length>10&&<div className="association-pagination"><span>총 {props.rows.length}건 · {current}/{max}페이지</span><button className="button secondary" disabled={current===1} onClick={()=>setPage(current-1)}>이전</button><button className="button secondary" disabled={current===max} onClick={()=>setPage(current+1)}>다음</button></div>}</>
}
