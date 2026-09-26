import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const people=sqliteTable('people',{id:text('id').primaryKey(),name:text('name').notNull(),active:integer('active').notNull().default(1)});
export const meals=sqliteTable('meals',{date:text('date').notNull(),personId:text('person_id').notNull().references(()=>people.id),cents:integer('cents').notNull(),kind:text('kind').notNull()},t=>[primaryKey({columns:[t.date,t.personId]})]);
