# Gatevion – Landing (static) v4
Cerințe implementate:
- **Picker aeroport** peste celelalte controale la reselectare (fix stacking context): fără `transform` pe `.field.filled`, `overflow: visible` pe panou, `.field.active{ z-index:100000; isolation:isolate }` + toggle din JS la open/close.
- **Badge-uri** mai mici, încât să încapă pe **o singură linie** (nowrap pe ≥768px).
- **Dată & oră** puțin mai mici (13px) și padding redus pentru a încăpea complet în casete.
- Header stilizat + link **Întrebări frecvente**.

Testează local deschizând `index.html`.

## Admin Dashboard – Quickstart

1. **Backend** (Node.js 18+ recommended)
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   The API will start (default port **4000**). On first start, it **auto-creates** an admin user:
   - **user:** `vermana`
   - **parolă:** `123QWEasdZXC`

2. **Frontend**
   Serve the project root as static files (any server) or open `login.html` directly if CORS allows.
   - Autentifică-te cu userul de mai sus și vei fi redirecționat în `admin.html` (dashboard).

3. **Ce face dashboard-ul (prima implementare):**
   - Autentificare JWT (stocată în `localStorage`).
   - Vizualizare + filtre pentru **Rezervări** (cu acțiuni: *Trimite la partener*, *+1 zi*, *Anulează*).
   - CRUD de bază pentru **Parteneri, Mașini, Reguli de preț** și **Aeroporturi** (create + list).
   - Tab **Cont** (detalii utilizator curent).
   - Design simplu, **user-friendly**, accent de brand `#02ac8e`.

> Notă: dashboard-ul folosește toate endpoint-urile existente: `/api/reservations`, `/api/partners`, `/api/cars`, `/api/pricing/rules`, `/api/airports`, `/api/auth/me`.
> Ruta `/api/reservations` este protejată cu rol `admin`.
