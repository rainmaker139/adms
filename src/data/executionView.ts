import type { SaleTransaction, StoreEventProduct } from '../types/workflow.ts'
import type { PosSaleRow } from '../types/executionView.ts'

const shortCode=(text:string)=>{let n=0;for(const c of text)n=(n*31+c.charCodeAt(0))>>>0;return String(n%900000+100000)}
// Existing demo transactions include consolidated quantities (e.g. 14,500 units in one record).
// Expand those into deterministic one-unit POS examples without changing any domain record.
// Balanced cancellation/return pairs demonstrate original links and have zero net effect.
export function executionView(transactions:SaleTransaction[],products:StoreEventProduct[],storeId:string):PosSaleRow[] {
 const rows:PosSaleRow[]=[],storeCode=`S${shortCode(storeId)}`
 for(const t of transactions){
  const p=products.find(p=>p.id===t.productId),count=Math.max(1,t.quantity),supportBase=Math.floor(t.support/count),remainder=t.support%count,stamp=Date.parse(/Z$|[+-]\d\d:\d\d$/.test(t.at)?t.at:t.at+'Z')
  for(let i=0;i<count;i++){
   const support=supportBase+(i<remainder?1:0),price=t.price,ownDiscount=Math.min(Math.floor(price*.02),Math.max(0,price-support)),sequence=rows.length+1,number=`${t.at.slice(0,10).replaceAll('-','')}-${String(sequence).padStart(6,'0')}`
   rows.push({number,receipt:`R${String(sequence).padStart(7,'0')}`,at:new Date(stamp-(count-1-i)*1000).toISOString().slice(0,19).replace('T',' '),storeCode,terminal:`${String(i%3+1).padStart(2,'0')}`,customer:`C****${String(i%97+1).padStart(4,'0')}`,productCode:`P${shortCode(t.productId)}`,productName:p?.name||'상품 정보 미등록',representativeId:p?.representativeId||'',quantity:1,price,gross:price,ownDiscount,support,net:price-ownDiscount-support,kind:'정상',original:'',validation:!t.valid?t.exclusion||'검증 제외':i%17===8?'주의 · 회원정보 재확인':'정상'})
  }
 }
 if(!rows.length)return rows
 const example=rows.at(-1)!,needed=Math.max(2,Math.ceil((20-rows.length)/2))
 for(let i=0;i<needed;i++){
  const number=`${example.number.slice(0,8)}-${String(rows.length+1).padStart(6,'0')}`,receipt=`R${String(rows.length+1).padStart(7,'0')}`,normal={...example,number,receipt,customer:`C****${String(800+i).padStart(4,'0')}`,validation:i===0?'주의 · 원거래 대조':'정상'}
  rows.push(normal,{...normal,number:`${example.number.slice(0,8)}-${String(rows.length+2).padStart(6,'0')}`,receipt:`R${String(rows.length+2).padStart(7,'0')}`,quantity:-normal.quantity,gross:-normal.gross,ownDiscount:-normal.ownDiscount,support:-normal.support,net:-normal.net,kind:i%2?'반품':'취소',original:normal.number,validation:'정상 · 원거래 확인'})
 }
 return rows
}
