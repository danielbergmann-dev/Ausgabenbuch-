export type Payment={id:string;personId:string;cents:number;createdAt:string;cancelledAt:string|null};
export function parseAmount(value:string){
  const normalized=value.trim().replace(',','.');
  if(!/^\d{1,7}(\.\d{1,2})?$/.test(normalized))return null;
  const [whole,fraction='']=normalized.split('.');
  const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  return cents>0?cents:null;
}
export function account(personId:string,meals:{personId:string;cents:number}[],payments:Payment[]){
  const total=meals.filter(m=>m.personId===personId).reduce((n,m)=>n+m.cents,0);
  const paid=payments.filter(p=>p.personId===personId&&!p.cancelledAt).reduce((n,p)=>n+p.cents,0);
  return {total,paid,balance:total-paid};
}
