# 🫚 Ginger Beer offerte — vouchers d'inauguration

Web-app pour l'inauguration du café : les visiteurs scannent un QR code,
laissent leur email (+ téléphone optionnel), sont invités à suivre l'Instagram,
et reçoivent un bon à usage unique pour une ginger beer offerte **à leur
prochain passage**. Le bon s'affiche à l'écran, est mémorisé sur le téléphone,
et est aussi envoyé par email si Brevo est configuré.

**Stack** : Vercel (front statique + fonctions serverless) · Supabase
(base de données) · Brevo (email du bon). Zéro dépendance npm.

## Les pages

| URL | Qui | Quoi |
|---|---|---|
| `/` | Le client (cible du QR code) | Formulaire → bon avec code unique |
| `/staff` | Le staff au comptoir | Valide un code (PIN), usage unique |
| `/admin` | Toi | Stats + export CSV des contacts (PIN) |

## Mise en route (une seule fois)

1. **Supabase** — ouvre le *SQL Editor* du projet, colle le contenu de
   [`supabase/schema.sql`](supabase/schema.sql), clique *Run*.
2. **Brevo** — crée une **clé API REST** (Settings → SMTP & API → onglet
   *API Keys* → Generate ; elle commence par `xkeysib-`). ⚠️ La clé SMTP
   (`xsmtpsib-`) ne fonctionne pas ici. Vérifie aussi que ton adresse
   d'expéditeur est validée (Senders & IP).
3. **Vercel** — Project → Settings → Environment Variables, ajoute les
   variables listées dans [`.env.example`](.env.example) :
   `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (la clé **secrète** `sb_secret_…`,
   pas la publishable), `STAFF_PIN`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`,
   et la personnalisation (`CAFE_NAME`, `INSTAGRAM_HANDLE`, `VALID_FROM`,
   `VALID_UNTIL`).
4. **Redéploie** (Deployments → ⋯ → Redeploy) pour prendre en compte les
   variables.

Aucun secret dans le code : tout passe par les variables d'environnement.

## Générer le QR code

Le QR pointe simplement vers l'URL de l'app :

```bash
# en ligne : https://quickchart.io/qr?text=https://redeem-six.vercel.app&size=600
# ou en local (brew install qrencode) :
qrencode -o qr.png -s 12 "https://redeem-six.vercel.app"
```

Imprime-le avec un appel à l'action clair : **« 🎁 Scanne-moi : une ginger
beer offerte à ton prochain passage »**.

## Anti-abus (sans travail pour le staff)

- **1 email = 1 bon** : re-soumettre le même email renvoie le bon existant.
- Le bon est mémorisé en localStorage : rescanner le QR réaffiche le même bon.
- **Usage unique et atomique** : la validation sur `/staff` brûle le bon en
  base ; une deuxième tentative affiche « déjà utilisé » avec la date.
- Fenêtre de validité : du lendemain de l'inauguration à J+30 (configurable).

## RGPD, en bref

- La case « recevoir les actus » est un consentement explicite et décochable —
  n'envoie la newsletter qu'aux contacts `optin_marketing = oui` du CSV.
- Mentionne la désinscription dans chaque email ; supprime les données sur
  demande (table `vouchers` dans Supabase).
- Supprime les contacts sans opt-in une fois la fenêtre de validité passée.

## Développement local

```bash
npx vercel dev   # nécessite `vercel login` + un fichier .env local
```
