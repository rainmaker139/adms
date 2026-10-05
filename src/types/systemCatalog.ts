export interface CommonCode { id:string; group:string; code:string; label:string; description:string; order:number; active:boolean }
export interface ExternalRun { id:string; at:string; action:'송수신'|'재처리'|'재검증'; result:'success'|'failure'; sent:number; received:number; message:string; related:string }
export interface ExternalIntegration { id:string; programId:string; target:string; name:string; description:string; method:'API'|'File'|'Excel'|'Manual'|'Batch'; direction:'송신'|'수신'|'양방향'; status:'healthy'|'delayed'|'failed'|'stopped'; specification:string; runs:ExternalRun[] }
