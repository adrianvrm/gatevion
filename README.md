# Gatevion – Landing (static) v4
Cerințe implementate:
- **Picker aeroport** peste celelalte controale la reselectare (fix stacking context): fără `transform` pe `.field.filled`, `overflow: visible` pe panou, `.field.active{ z-index:100000; isolation:isolate }` + toggle din JS la open/close.
- **Badge-uri** mai mici, încât să încapă pe **o singură linie** (nowrap pe ≥768px).
- **Dată & oră** puțin mai mici (13px) și padding redus pentru a încăpea complet în casete.
- Header stilizat + link **Întrebări frecvente**.

Testează local deschizând `index.html`.
\n\n## Backend API\n\nA fost adăugat un backend Node.js/Express în folderul `backend/`:\n\n- pornești API-ul cu:\n  ```bash\n  cd backend\n  npm install\n  npm run dev\n  ```\n- endpoint health: `http://localhost:4000/api/health`\n- rezervările din formularul de booking se salvează automat în `POST /api/reservations`\n- dashboard de admin: deschizi `admin.html` în browser și te loghezi cu `admin@gatevion.local / Admin123!`\n\nVezi și `backend/README-backend.md` pentru detalii.\n