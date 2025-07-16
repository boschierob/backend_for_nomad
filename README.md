# Nomad Republik Backend

## Présentation

Ce dépôt contient le backend Node.js/Express de l’application Nomad Republik, conçu pour offrir une API sécurisée, scalable et moderne pour la gestion d’utilisateurs, l’authentification (email/mot de passe et Google OAuth), et l’intégration avec une base de données PostgreSQL/Supabase.

---

## Stack technique

- **Node.js** + **Express** : serveur HTTP principal, organisation modulaire.
- **Prisma ORM** : accès typé et sécurisé à la base PostgreSQL (schéma Supabase).
- **Supabase** : base de données PostgreSQL managée, schéma auth.users utilisé pour la gestion des utilisateurs.
- **Passport.js** : gestion de l’authentification Google OAuth 2.0 (stratégie Google).
- **JWT (jsonwebtoken)** : gestion des tokens d’authentification pour les API protégées.
- **express-session** : gestion des sessions pour Passport (nécessaire pour OAuth).
- **CORS** : configuration pour permettre l’accès frontend (Vite/React).
- **Socket.io** : support du temps réel (si besoin).
- **Body-parser** : parsing JSON des requêtes HTTP.

---

## Organisation du code

- `controllers/` : logique métier des routes HTTP et WebSocket (ex : AuthController, UserManagementController).
- `middleware/` : middlewares Express (authentification JWT, authorisation admin, etc.).
- `models/` : modèles Mongoose (legacy, non utilisé avec Prisma/Supabase).
- `prisma/` : schéma Prisma (`schema.prisma`), mapping du schéma Supabase (auth.users).
- `routes/` : définition des routes HTTP et WebSocket, centralisation de l’API.
- `services/` : services transverses (connexion Prisma, Passport, gestion JWT, mailjet, etc.).
- `index.js` : point d’entrée principal, configuration globale, initialisation des middlewares, routes et serveur.

---

## Fonctionnalités principales

### Authentification & Sécurité
- **Login email/mot de passe** : via `/auth/login`, génération d’un JWT, validation via Prisma/Supabase.
- **Inscription** : via `/auth/register`, création d’un utilisateur dans Supabase.
- **Google OAuth** : via `/auth/google` et `/auth/google/callback`, gestion avec Passport.js, création/recherche utilisateur dans Supabase, génération d’un JWT backend.
- **JWT** : toutes les routes protégées nécessitent un JWT valide (middleware `authorisation`).
- **Session** : gestion des sessions pour Passport (Google OAuth), non utilisée pour les API JWT.
- **Route `/me`** : retourne l’utilisateur courant à partir du JWT (sécurisée).
- **Logout** : destruction de la session côté backend (pour Passport).

### Gestion des utilisateurs
- **CRUD admin** : routes `/users`, `/users/:id` protégées par le middleware `requireAdmin`.
- **Mise à jour du profil** : via `/auth/update` (JWT requis).

### Intégration Supabase/Prisma
- **Schéma Prisma** : mapping complet de la table `auth.users` (Supabase) pour garantir la compatibilité avec l’auth Supabase et l’API custom.
- **Connexion sécurisée** : variables d’environnement pour la connexion à la base (voir `.env.example`).

### Autres
- **WebSocket** : support du temps réel via Socket.io (ex : notifications, chat, etc.).
- **Gestion des erreurs** : middleware global pour un retour d’erreur structuré.
- **CORS** : configuration permissive en dev, à restreindre en production.

---

## Bonnes pratiques & choix techniques

- **Séparation des responsabilités** : chaque dossier a un rôle précis (contrôleurs, services, middlewares, routes).
- **Sécurité** : JWT signé côté backend, Passport pour OAuth, aucune clé sensible exposée côté frontend.
- **Scalabilité** : Prisma permet de faire évoluer le schéma sans rupture, Supabase gère la base.
- **Interopérabilité** : le backend peut être utilisé par n’importe quel frontend (React, mobile, etc.) via l’API REST.
- **Extensibilité** : ajout facile de nouvelles routes, middlewares ou services.

---

## Démarrage & développement

1. **Installer les dépendances**
   ```sh
   npm install
   # ou
   yarn install
   ```
2. **Configurer les variables d’environnement**
   - Crée un fichier `.env` à la racine avec les variables nécessaires (voir `.env.example`).
   - Variables importantes :
     - `DATABASE_URL` (URL PostgreSQL Supabase)
     - `APP_JWT` (clé secrète JWT)
     - `SESSION_SECRET` (clé session Express)
     - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (OAuth Google)
     - `SUPABASE_SERVICE_ROLE_KEY` (clé service Supabase, jamais côté frontend)
3. **Lancer le serveur**
   ```sh
   node index.js
   # ou
   npm run dev
   ```
4. **Tester l’API**
   - Utilise Postman ou le frontend React pour tester les endpoints (`/auth/login`, `/auth/google`, `/me`, etc.).

---

## À propos

Ce backend est conçu pour être un socle réutilisable, sécurisé et moderne pour toute application nécessitant une gestion d’utilisateurs avancée, une intégration OAuth, et une base PostgreSQL/Supabase. N’y ajoutez pas de logique métier spécifique sans discussion d’architecture.
