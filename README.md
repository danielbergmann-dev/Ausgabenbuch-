# Dein Essensbuch

**[Dein Essensbuch öffnen](https://danielbergmann-dev.github.io/Ausgabenbuch-/)**

Die GitHub-Pages-Adresse zeigt die Tischliste an. Die App und ihre Datenbank laufen weiterhin bei ChatGPT Sites. Die Web-App ist ohne Anmeldung erreichbar. Alle mit dem Link können die Mitarbeiterliste und Essenseinträge ansehen und bearbeiten. Dieses Repository enthält den Quellcode; die gespeicherten Daten liegen in der Sites-Datenbank.

Responsive Essensliste mit dauerhafter Sites-D1-Datenbank.

- Mittwoch: Mittagessen, 4 € pro Person
- Freitag: Frühstück, 3 € pro Person
- Datum wählen und Teilnahme an- oder abwählen
- Monatliche Auswertung je Mitarbeiter: Mittwoch, Freitag und gesamt
- Gesamtbetrag pro Mitarbeiter über alle Monate
- Mitarbeiter hinzufügen und archivieren; historische Einträge bleiben erhalten
- Öffentliche Veröffentlichung über ChatGPT Sites

Personennamen und Essenseinträge werden nur in der Datenbank gespeichert, nicht in diesem öffentlichen Repository. Die Daten benötigen eine Internetverbindung; fehlgeschlagene Änderungen werden als Fehler angezeigt.

## Entwicklung

Node.js ab 22.13, pnpm. Abhängigkeiten mit `pnpm install` installieren. `pnpm dev` startet die Entwicklung, `pnpm build` erzeugt den Cloudflare-Worker. Sites verwaltet die produktive D1-Bindung `DB` und die Migrationen unter `drizzle/`. Lokale Migrationen sind separat anzuwenden. Dies ist eine servergestützte App und kein GitHub-Pages-Projekt.

Die Datenbank enthält `people` und `meals`. Pro Datum und Mitarbeiter ist höchstens ein Eintrag erlaubt. Preise werden in Cent im jeweiligen Eintrag gespeichert.
