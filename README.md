# Gatevion – Landing (static) v4
Cerințe implementate:
- **Picker aeroport** peste celelalte controale la reselectare (fix stacking context): fără `transform` pe `.field.filled`, `overflow: visible` pe panou, `.field.active{ z-index:100000; isolation:isolate }` + toggle din JS la open/close.
- **Badge-uri** mai mici, încât să încapă pe **o singură linie** (nowrap pe ≥768px).
- **Dată & oră** puțin mai mici (13px) și padding redus pentru a încăpea complet în casete.
- Header stilizat + link **Întrebări frecvente**.

Testează local deschizând `index.html`.
