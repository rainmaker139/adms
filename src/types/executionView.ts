// Read-only POS demo projection. These rows are never submitted to the workflow ledger.
export interface PosSaleRow {
 number:string; receipt:string; at:string; storeCode:string; terminal:string; customer:string;
 productCode:string; productName:string; representativeId:string; quantity:number; price:number;
 gross:number; ownDiscount:number; support:number; net:number;
 kind:'정상'|'취소'|'반품'; original:string; validation:string;
}
