# Prompt — App « Ginger Beer offerte » pour l'inauguration du café

## Contexte
J'ouvre un café estudiantin. Lors de l'inauguration, des QR codes seront affichés
(comptoir, tables, flyers). En les scannant, les visiteurs obtiennent un bon pour
une ginger beer offerte **lors de leur prochain passage** (objectif : les faire
revenir). En échange, je collecte leur email (et téléphone optionnel) pour leur
envoyer les événements, annonces et offres, et je les incite à suivre notre
Instagram.

## Objectif
Développe une petite web-app mobile-first, en français, avec le flow le plus
court possible :

1. **Scan du QR** → page d'accueil : visuel sympa, « 🎁 Une ginger beer offerte
   à ton prochain passage ».
2. **Formulaire minimal** : email (obligatoire), téléphone (optionnel), prénom
   (optionnel), case à cocher optionnelle « Je veux recevoir les événements et
   offres du café » (conformité RGPD : consentement explicite, lien vers une
   mention simple de confidentialité).
3. **Étape Instagram (sur l'honneur)** : bouton « Suivre @moncafe sur Instagram »
   qui ouvre le profil, puis bouton « C'est fait, voir mon bon ». Pas de
   vérification par API (impossible techniquement), c'est un nudge, pas un mur.
4. **Page voucher** : code unique court et lisible (ex. `GB-7K3F`), visuel de
   bon cadeau, dates de validité, conseil « fais une capture d'écran ». Le bon
   est aussi sauvegardé en localStorage : si la personne rescanne le QR, elle
   retombe directement sur son bon (pas de doublon).

## Côté staff
- Page `/staff` protégée par un PIN : le serveur saisit le code du client,
  l'app affiche valide / déjà utilisé / inconnu, et le marque comme utilisé
  (usage unique). Gros boutons, utilisable au comptoir en 5 secondes.
- Page `/admin` (même PIN) : compteur de bons émis / utilisés, export CSV des
  emails et téléphones collectés.

## Règles métier
- 1 email = 1 bon (si l'email existe déjà, renvoyer le bon existant).
- Bon à usage unique, valable du lendemain de l'inauguration jusqu'à J+30
  (dates configurables) — « prochain passage », pas le jour même.
- Codes courts sans caractères ambigus (pas de O/0, I/1).

## Contraintes techniques
- Node.js sans dépendance npm (serveur HTTP natif), stockage dans un fichier
  JSON — trivial à héberger gratuitement (Render, Railway, Fly.io) ou sur un
  petit VPS.
- Front : HTML/CSS/JS vanilla, une page, design chaleureux (tons ambre/ginger),
  gros boutons tactiles.
- Configuration en haut du serveur : handle Instagram, PIN staff, dates de
  validité, nom du café.
- README : lancement local, déploiement, génération du QR code, conseils RGPD.
