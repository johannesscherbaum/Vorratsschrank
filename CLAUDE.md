# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Entwicklungsserver starten (Port 3000, öffnet Browser automatisch)
npm run dev

# Produktions-Build
npm run build

# Build-Vorschau
npm run preview
```

Kein Test-Framework vorhanden. Es gibt auch keinen Linter – der Code verwendet vanilla JS/JSX ohne TypeScript.

Der Dev-Server muss aus dem Root-Verzeichnis gestartet werden, da `node_modules` nur dort vorhanden ist. Bei Verwendung eines Git-Worktrees:
```bash
/Users/johannes/Documents/vorrat/node_modules/.bin/vite --port 5174
```

## Umgebungsvariablen

Datei `.env` im Root anlegen (Vorlage: `.env.example Kopie`):
```
VITE_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key-hier
```

Fehlen die Variablen oder enthalten sie Platzhalter, läuft die App automatisch im **Local Mode** (localStorage statt Supabase, kein Login).

## Architektur

### Dual-Mode: Local vs. Supabase

Die App erkennt anhand von `VITE_SUPABASE_URL`, ob sie im lokalen Testmodus oder gegen Supabase läuft. Das Flag `isLocalMode` wird in `src/lib/db.js` und `src/lib/adminDb.js` exportiert und steuert, welches Backend genutzt wird.

- **Local Mode**: Items in `localStorage` via `localDb` (`src/lib/localDb.js`), Stammdaten ebenfalls localStorage mit Seed-Daten aus `adminDb.js`
- **Supabase Mode**: Items in `public.items` (Row Level Security: nur eigene Daten), Stammdaten in `public.locations`, `public.food_groups`, `public.units` (geteilt zwischen allen Nutzern, öffentlich lesbar)

### Datenfluss

```
App.jsx (AppInner)
  ├── src/lib/db.js          – CRUD für Items (fetchItems / insertItem / updateItem / deleteItem)
  │     ├── localDb.js       – localStorage-Fallback
  │     └── supabase.js      – Supabase-Client
  ├── src/lib/adminDb.js     – Stammdaten-Stores (locationStore, foodGroupStore, unitStore, userStore)
  │     └── makeLocalStore / makeSupabaseStore – einheitliche Store-API mit subscribe()
  └── src/components/
        ├── ItemModal.jsx    – Formular zum Einlagern/Bearbeiten von Artikeln
        ├── AdminPanel.jsx   – Stammdatenverwaltung (4 Tabs: Lagerorte, Lebensmittelgruppen, Einheiten, Benutzer)
        ├── AuthProvider.jsx – React Context für Supabase-Session
        ├── LoginPage.jsx    – Login-Formular (nur im Supabase-Modus sichtbar)
        └── BarcodeScanner.jsx – Kamera-Scanner via @zxing/library
```

### Store-API (adminDb)

Alle Stammdaten-Stores (locationStore, foodGroupStore, unitStore, userStore) teilen dieselbe API:

```js
store.getAll()        // synchron, aus Cache
store.subscribe(fn)   // fn() bei jeder Änderung, gibt unsubscribe zurück
store.add(item)
store.update(id, patch)
store.remove(id)
store.duplicate(id)
store.reorder(ids[])  // setzt sort_order anhand der Reihenfolge
```

Im Supabase-Modus wird ein In-Memory-Cache gehalten und per Realtime-Subscription aktuell gehalten.

### Artikelfelder (Items)

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `name` | text | Pflichtfeld |
| `location` | text | Standortname (Freitext, referenziert Lagerorte) |
| `food_group` | text | Gruppenname (Freitext, referenziert food_groups) |
| `qty` | numeric | Menge |
| `unit` | text | Einheit (Freitext) |
| `stored_at` | date | Einlagerungsdatum |
| `expires_at` | date | MHD – kann leer/null sein, produziert keinen Fehler |
| `ean` | text | Barcode, wird gegen Open Food Facts API aufgelöst |
| `note` | text | Freitext |

Standort und Gruppe werden als Freitext gespeichert (nicht als FK), damit historische Daten bei Umbenennung erhalten bleiben.

### MHD-Logik

`expiryStatus(item)` in `App.jsx` liefert `'ok'`, `'soon'` (≤ 7 Tage) oder `'expired'` (< 0 Tage). `expires_at = null` gilt immer als `'ok'`.

Lebensmittelgruppen haben ein optionales Feld `default_days`, das in der Stammdatenverwaltung gepflegt wird – aktuell nur zur Information, keine automatische MHD-Berechnung beim Einlagern (da Haltbarkeit vom Lagerort abhängt).

### Supabase-Schema

Das Schema liegt in `supabase-schema.sql`. Bei Änderungen an der Tabellenstruktur muss das SQL in der Supabase-Konsole ausgeführt werden. Für die `food_groups`-Tabelle gilt:
```sql
alter table public.food_groups add column if not exists default_days integer;
```
