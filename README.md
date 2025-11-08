# Gatevion – Landing + Admin Dashboard

Proiectul conține:

- frontend static (landing, flow de rezervare, login, contul meu, admin)
- backend Node.js + SQLite (autentificare, rezervări, mașini, aeroporturi, parteneri, reguli de preț)

## 1. Rulare LOCALĂ (recomandat pentru test)

### 1.1. Pornește backend-ul

Ai nevoie de **Node.js** instalat.

```bash
cd backend
npm install
npm run dev
```

Asta va porni API-ul pe `http://localhost:4000`, va crea automat baza de date SQLite și utilizatorul admin:

- **user:** `vermana`
- **parolă:** `123QWEasdZXC`
- **rol:** `admin`

### 1.2. Accesează frontend-ul

Backend-ul servește automat fișierele statice din root-ul proiectului, deci poți deschide direct:

- `http://localhost:4000/` – landing
- `http://localhost:4000/login.html` – login
- `http://localhost:4000/admin.html` – admin dashboard

Login:

- pentru admin: `vermana / 123QWEasdZXC`
- pentru clienți: îți poți crea cont prin `signup.html` (când vei conecta și flow-ul complet).

Admin-ul folosește token-ul salvat în `localStorage` (`gatevion_token`) și îl trimite cu `Authorization: Bearer <token>` la API.

## 2. Deploy pe Vercel (frontend static)

Dacă pui repo-ul pe GitHub și îl legi la Vercel, Vercel va servi **DOAR frontend-ul static** (HTML/CSS/JS) din root.

Backend-ul Express din `backend/` NU rulează automat pe Vercel în acest setup – trebuie hostat separat (Railway / Render / VPS etc.).

Frontend-ul (login + admin) folosește o constantă:

```js
const API_BASE = (window.GATEVION_API_BASE || 'http://localhost:4000');
```

### Variante:

- **Local** → la tine pe laptop: lasă implicit `http://localhost:4000` și rulează backend-ul local.
- **Online** → când vei avea backend-ul hostat undeva (ex: `https://api.gatevion.ro`), poți seta în pagini un mic script înainte de JS-ul de admin/login:

  ```html
  <script>
    window.GATEVION_API_BASE = 'https://api.gatevion.ro';
  </script>
  ```

  astfel încât toate cererile `/api/...` să meargă către backend-ul online.

## 3. Ce expune backend-ul (rezumat)

- `POST /api/auth/register` – înregistrare utilizator
- `POST /api/auth/login` – login (returnează `{ token, user }`)
- `GET  /api/auth/me` – datele utilizatorului curent (cu JWT)

- `GET  /api/airports` – listă aeroporturi (public)
- `POST /api/airports` – creare aeroport (admin)

- `GET  /api/cars` – listă mașini active (public)
- `POST /api/cars` – creare mașină (admin)

- `GET  /api/pricing/rules` – listă reguli de preț
- `POST /api/pricing/rules` – creare regulă de preț (admin)

- `POST /api/reservations` – creare rezervare (public, folosit de flow-ul de booking)
- `GET  /api/reservations` – listă rezervări (admin, cu filtre de status)
- `GET  /api/reservations/mine` – rezervările utilizatorului logat
- `POST /api/reservations/:id/cancel` – anulare (admin)
- `PATCH /api/reservations/:id/extend` – prelungire (admin)

- `GET  /api/partners` – listă parteneri (admin)
- `POST /api/partners` – creare partener
- `POST /api/partners/:id/send-reservation` – marchează rezervarea ca trimisă către un partener (stocată în `partner_reservations`).

## 4. Admin Dashboard – ce face acum

- Login direct din `admin.html` (card peste dashboard)
- Auto-login dacă există deja token admin
- Tab „Overview / Rezervări” cu:
  - listă rezervări
  - filtre după status
  - statistici simple (total / pending / confirmed / cancelled)
  - acțiuni:
    - *Trimite partener* (apelează `/api/partners/:id/send-reservation`)
    - *+1 zi* – folosește `PATCH /api/reservations/:id/extend`
    - *Anulează* – `POST /api/reservations/:id/cancel`
- Tab „Parteneri” – listare + creare
- Tab „Mașini” – listare + creare simplă
- Tab „Reguli de preț” – listare + creare
- Tab „Aeroporturi” – listare + creare
- Tab „Cont” – afișează JSON cu datele lui `/api/auth/me`

De aici putem extinde ușor orice logică: status-uri suplimentare, loguri, rapoarte etc.
