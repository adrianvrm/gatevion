# Gatevion – Landing (static)
Acest pachet conține varianta statică pentru pagina principală Gatevion:

- `index.html` (landing)
- `styles.css` (CSS personalizat)
- `app.js` (JS pentru pickere: aeroport, dată, oră, + FAQ, + reguli validare)
- `rezultate.html` (stub, ca să nu 404 la butonul „Caută mașini disponibile”)

## Cum testez local
Deschide `index.html` în browser (dublu click). Nu sunt necesare servere locale – totul e static.

## Deploy pe Vercel
1. Autentifică-te pe vercel.com.
2. Creează un proiect nou -> **Import Project** -> **Drag&drop** acest folder/zip.
3. Build settings: nu e nevoie de build; output static.
4. După preview, apasă **Promote to Production**.

## Note tehnice
- Folosește Tailwind CDN doar pentru prototip. Când migrezi la Next.js, mutăm CSS în module + folosim Tailwind CLI/JIT.
- Calendarul blochează datele din trecut, iar returnarea nu poate fi înaintea preluării (în aceeași zi).
- Pickerul de aeroport e custom, cu popover „over” (z-index mare) și închide alte popovere când se deschide.
