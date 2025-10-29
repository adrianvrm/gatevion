# Gatevion — Static starter (pentru Vercel)

Acest folder conține un **site static minim** (un singur `index.html`) ca să poți face primul deploy pe Vercel.

## Pași
1) Creează un repo pe GitHub (nume: `gatevion`).
2) În GitHub → `Add file` → `Upload files` → urcă **tot folderul** (sau arhiva ZIP dezarhivată).
3) În Vercel → **Add New → Project → Import Git Repository** → alege repo-ul → **Deploy**.
4) În proiectul din Vercel → **Settings → Domains → Add** → `gatevion.ro`.  
   - În DNS la .ro: **A** `@` → `76.76.21.21` ; **CNAME** `www` → `cname.vercel-dns.com`
5) După propagare: site-ul va fi live pe `https://gatevion.ro`.

Ulterior vom înlocui conținutul cu proiectul Next.js complet.
