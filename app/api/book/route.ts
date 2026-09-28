import { db } from '@/lib/db';
export const dynamic='force-dynamic';
function fail(message:string,status=400){return Response.json({error:message},{status});}
export async function GET(){try{const d=db();const [people,meals,payments]=await Promise.all([d.prepare('SELECT * FROM people ORDER BY name COLLATE NOCASE').all(),d.prepare('SELECT date,person_id AS personId,cents,kind FROM meals ORDER BY date DESC').all(),d.prepare('SELECT id,person_id AS personId,cents,created_at AS createdAt,cancelled_at AS cancelledAt FROM payments ORDER BY created_at DESC,id DESC').all()]);return Response.json({people:people.results,meals:meals.results,payments:payments.results},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error(e);return fail('Die Daten konnten nicht geladen werden. Bitte erneut versuchen.',503);}}
export async function POST(request:Request){try{if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Ungültiger Ursprung',403);const parsedBody=await request.json();if(!parsedBody||typeof parsedBody!=="object"||Array.isArray(parsedBody))return fail("Ungültige Eingabe");const body=parsedBody as Record<string,unknown>;const d=db();if(body.action==='person'){const name=typeof body.name==='string'?body.name.trim():'';if(!name||name.length>80)return fail('Bitte einen Namen mit höchstens 80 Zeichen eingeben.');await d.prepare('INSERT INTO people(id,name) VALUES(?,?)').bind(crypto.randomUUID(),name).run();}
else if(body.action==='active'){if(typeof body.id!=='string'||typeof body.active!=='boolean')return fail('Ungültige Eingabe');await d.prepare('UPDATE people SET active=? WHERE id=?').bind(body.active?1:0,body.id).run();}
else if(body.action==='meal'){const {date,personId,present}=body;if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||typeof personId!=='string'||typeof present!=='boolean')return fail('Ungültiger Eintrag');const parsed=new Date(date+'T12:00:00Z');if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)return fail('Ungültiges Datum');const day=parsed.getUTCDay();if(day!==3&&day!==5)return fail('Bitte einen Mittwoch oder Freitag wählen.');const person=await d.prepare('SELECT id,active FROM people WHERE id=?').bind(personId).first();if(!person)return fail('Person nicht gefunden');if(present&&!person.active)return fail('Person ist archiviert');if(present)await d.prepare('INSERT INTO meals(date,person_id,cents,kind) VALUES(?,?,?,?) ON CONFLICT(date,person_id) DO NOTHING').bind(date,personId,day===3?400:300,day===3?'wed':'fri').run();else await d.prepare('DELETE FROM meals WHERE date=? AND person_id=?').bind(date,personId).run();}
else if(body.action==='payment'){
  const {id,personId,cents,expectedBalance}=body;
  if(typeof id!=='string'||! /^[0-9a-f-]{36}$/i.test(id)||typeof personId!=='string'||typeof cents!=='number'||!Number.isSafeInteger(cents)||cents<=0||cents>999999999)return fail('Ungültiger Zahlungsbetrag.');
  if(expectedBalance!==undefined&&(typeof expectedBalance!=='number'||!Number.isSafeInteger(expectedBalance)))return fail('Ungültiger offener Betrag.');
  const existing=await d.prepare('SELECT person_id,cents FROM payments WHERE id=?').bind(id).first();
  if(existing){if(existing.person_id!==personId||existing.cents!==cents)return fail('Diese Zahlung wurde bereits mit anderen Angaben erfasst.',409);return Response.json({ok:true});}
  const balanceSQL='COALESCE((SELECT SUM(cents) FROM meals WHERE person_id=?),0)-COALESCE((SELECT SUM(cents) FROM payments WHERE person_id=? AND cancelled_at IS NULL),0)';
  const result=await d.prepare(`INSERT INTO payments(id,person_id,cents,created_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM people WHERE id=?) AND ? <= (${balanceSQL}) AND (? IS NULL OR ? = (${balanceSQL})) ON CONFLICT(id) DO NOTHING`).bind(id,personId,cents,new Date().toISOString(),personId,cents,personId,personId,expectedBalance??null,expectedBalance??null,personId,personId).run();
  if(!result.meta.changes){
    const duplicate=await d.prepare('SELECT person_id,cents FROM payments WHERE id=?').bind(id).first();
    if(!duplicate||duplicate.person_id!==personId||duplicate.cents!==cents)return fail('Der offene Betrag hat sich geändert oder die Zahlung ist zu hoch. Bitte schließen und die Übersicht neu laden.',409);
  }
}
else if(body.action==='cancelPayment'){
  if(typeof body.id!=='string')return fail('Ungültige Zahlung.');
  await d.prepare('UPDATE payments SET cancelled_at=COALESCE(cancelled_at,?) WHERE id=?').bind(new Date().toISOString(),body.id).run();
}
else return fail('Unbekannte Aktion');return Response.json({ok:true});}catch(e){console.error(e);return fail('Speichern fehlgeschlagen. Bitte erneut versuchen.',503);}}
