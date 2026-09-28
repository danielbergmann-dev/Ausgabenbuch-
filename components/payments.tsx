'use client';
import {useRef,useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {account,parseAmount,type Payment} from '@/lib/payments';
const euro=(n:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n/100);
type Props={people:{id:string;name:string;active:number}[];meals:{personId:string;cents:number}[];payments:Payment[];loaded:boolean;busy:boolean;reload:()=>Promise<unknown>};
export function Payments({people,meals,payments,loaded,busy,reload}:Props){
  const [filter,setFilter]=useState('all');
  const [personId,setPersonId]=useState<string|null>(null);
  const [amount,setAmount]=useState('');
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const [cancel,setCancel]=useState<Payment|null>(null);
  const requestId=useRef('');
  const pending=useRef(false);
  const person=people.find(p=>p.id===personId);
  const balance=person?account(person.id,meals,payments).balance:0;
  const rows=people.filter(p=>p.active||meals.some(m=>m.personId===p.id)||payments.some(x=>x.personId===p.id)).map(p=>({...p,...account(p.id,meals,payments)}));
  const visible=rows.filter(p=>filter!=='open'||p.balance>0);
  async function send(body:object){
    if(pending.current)return false;
    pending.current=true;setSaving(true);setError('');
    try{
      const r=await fetch('/api/book',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const result=await r.json() as {error?:string};
      if(!r.ok)throw Error(result.error||'Zahlung konnte nicht gespeichert werden.');
      await reload();return true;
    }catch(e){setError((e as Error).message);return false;}
    finally{pending.current=false;setSaving(false);}
  }
  async function pay(all=false){
    const cents=all?balance:parseAmount(amount);
    if(!person||!cents||cents<=0||cents>balance){setError('Bitte einen gültigen Betrag bis zum offenen Betrag eingeben.');return;}
    if(await send({action:'payment',id:requestId.current,personId:person.id,cents,expectedBalance:all?balance:undefined})){
      setMessage(`${euro(cents)} für ${person.name} erfasst.`);setPersonId(null);
    }
  }
  return <section className="panel payments-panel">
    <div className="sectionhead"><div><p className="eyebrow">ZAHLUNGEN · ALLE MONATE</p><h2>Wer hat noch etwas offen?</h2></div></div>
    <div className="payment-overview"><div><span>Insgesamt offen</span><strong>{euro(rows.reduce((n,p)=>n+Math.max(0,p.balance),0))}</strong></div><div className="payment-filter" aria-label="Mitarbeiter filtern">{[['all','Alle'],['open','Noch offen']].map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div></div>
    {message&&<p className="payment-success" role="status">✓ {message}</p>}
    {!loaded?<p className="empty">Zahlungen werden geladen …</p>:!visible.length?<p className="empty">{filter==='open'?'Alles ausgeglichen – keine offenen Beträge.':'Noch keine Mitarbeiter angelegt.'}</p>:visible.map(p=>{
      const history=payments.filter(x=>x.personId===p.id);
      return <article className="payment-card" key={p.id}>
        <div className="payment-card-head"><h3>{p.name}{!p.active&&<small>Archiviert</small>}</h3><div className={'balance '+(p.balance<=0?'settled':'')}><strong>{euro(Math.abs(p.balance))}</strong><span>{p.balance>0?'offen':p.balance<0?'Guthaben':p.paid>0?'✓ Bezahlt':'Ausgeglichen'}</span></div></div>
        <div className="payment-card-action"><p>Essen {euro(p.total)} · Bezahlt {euro(p.paid)}</p>{p.balance>0&&<button className="primary" disabled={busy||saving} onClick={()=>{requestId.current=crypto.randomUUID();setAmount('');setError('');setPersonId(p.id)}}>Zahlung erfassen</button>}</div>
        {history.length>0&&<details className="payment-history"><summary>Zahlungsverlauf ({history.length})</summary><ul>{history.map(x=><li key={x.id}><div><strong>{euro(x.cents)}</strong><span>{new Date(x.createdAt).toLocaleString('de-DE',{timeZone:'Europe/Berlin',dateStyle:'short',timeStyle:'short'})}{x.cancelledAt?' · Storniert':''}</span></div>{!x.cancelledAt&&<button className="payment-secondary" disabled={saving||busy} onClick={()=>{setError('');setCancel(x)}}>Rückgängig</button>}</li>)}</ul></details>}
      </article>;
    })}
    <Dialog open={!!person} onOpenChange={open=>{if(!open&&!saving)setPersonId(null)}}><DialogContent className="payment-dialog" showCloseButton={false}><DialogTitle>Zahlung für {person?.name}</DialogTitle><DialogDescription>Noch offen: {euro(balance)} · alle Monate</DialogDescription><form onSubmit={e=>{e.preventDefault();void pay()}}><label htmlFor="payment-amount">Bezahlter Betrag in Euro</label><input id="payment-amount" inputMode="decimal" placeholder="z. B. 10,00" value={amount} onChange={e=>{setAmount(e.target.value);requestId.current=crypto.randomUUID()}} disabled={saving} autoComplete="off"/><button className="primary" disabled={saving||!amount.trim()}>{saving?'Wird gespeichert …':'Teilzahlung speichern'}</button></form><button className="payment-secondary" disabled={saving||balance<=0} onClick={()=>pay(true)}>Alles bezahlt · {euro(Math.max(0,balance))}</button>{error&&<p className="error" role="alert">{error}</p>}<button className="payment-secondary" disabled={saving} onClick={()=>setPersonId(null)}>Schließen</button></DialogContent></Dialog>
    <Dialog open={!!cancel} onOpenChange={open=>{if(!open&&!saving)setCancel(null)}}><DialogContent className="payment-dialog" showCloseButton={false}><DialogTitle>Zahlung rückgängig machen?</DialogTitle><DialogDescription>{cancel?euro(cancel.cents):''} werden wieder zum offenen Betrag hinzugefügt. Die Buchung bleibt als storniert im Verlauf sichtbar.</DialogDescription>{error&&<p className="error" role="alert">{error}</p>}<button className="primary" disabled={saving} onClick={async()=>{if(cancel&&await send({action:'cancelPayment',id:cancel.id})){setCancel(null);setMessage('Zahlung rückgängig gemacht.')}}}>Zahlung rückgängig machen</button><button className="payment-secondary" disabled={saving} onClick={()=>setCancel(null)}>Abbrechen</button></DialogContent></Dialog>
  </section>;
}
