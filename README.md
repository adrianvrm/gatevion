# Gatevion – Landing (static)
Acest pachet conține varianta statică pentru pagina principală Gatevion:

- `index.html` (landing)
- `styles.css` (CSS personalizat)
- `app.js` (JS pentru pickere: aeroport, dată, oră, + FAQ, + reguli validare)
- `rezultate.html` (stub, ca să nu 404 la butonul „Caută mașini disponibile”)

## Schimbări solicitate în această versiune
- Placeholder „Alege data/ora” -> **„Data”** / **„Ora”**
- Copy hero: **„Trimiți solicitarea. Primești confirmarea. Plătești la livrare.”**
- 4 badge-uri noi sub hero: **Fără card de credit**, **Fără depozit**, **Fără limită de km**, **Plata cash sau cu cardul**
- Divizoare decorative între secțiuni (CSS `.divider`)
- Z-index fix pentru popovere (airport/date/time) să fie mereu peste badge-uri
- Text mai mic în inputuri pentru a încăpea în controllere

## Cum testez local
Deschide `index.html` în browser (dublu click). Nu sunt necesare servere locale – totul e static.

## Deploy pe Vercel
1. Autentifică-te pe vercel.com.
2. Creează un proiect nou -> **Import Project** -> **Drag&drop** acest folder/zip.
3. Build settings: nu e nevoie de build; output static.
4. După preview, apasă **Promote to Production**.
