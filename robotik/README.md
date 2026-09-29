# EGE Robotik Cərrahiyyə Mərkəzi

Robotik cərrahiyyə, texnologiya, tətbiq sahələri və pasiyent təcrübəsi haqqında sayt.

## Lokal başlatmaq

Node.js 18+ tələb olunur. Əlavə paket lazım deyil.

```sh
npm start
```

http://localhost:3000 ünvanını açın. Port istifadədədirsə PowerShell-də:

```powershell
$env:PORT=3001
npm start
```

## Struktur

- dist/ — hazır statik sayt, səhifələr və vizuallar.
- dist/app.js — məzmun və səhifə davranışları.
- dist/premium-current.css — son dizayn vurğuları.
- dist/intro.js və dist/intro-scene.js — 3D loqo animasiyası.
- server.cjs — Node.js lokal serveri.

Qəbul forması yoxdur; telefon və WhatsApp keçidləri mövcuddur. Statik hostinqdə sayt kökü dist olmalıdır. Repo yaratmaq saytı avtomatik yayımlamır.

Google Fonts və Microsoft Clarity istifadə olunur. Video YouTube-da, xəritə Google Maps-də açılır. Three.js lisenziyası dist/vendor/THREE-LICENSE.txt faylındadır. Brend materiallarına ayrıca açıq istifadə lisenziyası verilmir.
