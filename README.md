# NdongoLink — Le réseau social des étudiants africains

Une plateforme type LinkedIn, mais pensée pour les étudiants : profils enrichis, recherche par université/filière, connexions, messagerie temps réel, fil d'actualité et notifications.

## Stack technique

- **Frontend** : Next.js 16 (App Router), TypeScript 5, Tailwind CSS 4, shadcn/ui
- **Backend** : Next.js Route Handlers + Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Auth** : Email/mot de passe + Google OAuth (via Supabase Auth)
- **Temps réel** : Supabase Realtime (posts, messages, notifications)
- **Stockage** : Supabase Storage (avatars, bannières, images de posts)

## Structure du projet

```
src/
├── app/
│   ├── (auth)/                  # Groupe de routes auth (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── (app)/                   # Groupe de routes authentifiées
│   │   ├── feed/                # Fil d'actualité
│   │   ├── profile/
│   │   │   ├── [id]/            # Vue profil public
│   │   │   └── edit/            # Édition de son propre profil
│   │   ├── search/              # Recherche d'étudiants
│   │   ├── network/             # Connexions et invitations
│   │   ├── messages/            # Messagerie temps réel
│   │   └── notifications/       # Notifications
│   ├── auth/callback/           # Callback OAuth Google
│   ├── api/                     # API routes (optionnel, la plupart des appels vont direct à Supabase)
│   ├── layout.tsx               # Layout racine
│   ├── page.tsx                 # Landing page (redirect vers /feed si connecté)
│   └── landing.tsx              # Composant landing page marketing
├── components/
│   ├── ui/                      # Composants shadcn/ui
│   └── ndongo/                  # Composants NdongoLink (logo, avatar, app-shell)
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Client Supabase navigateur
│   │   ├── server.ts            # Client Supabase serveur (+ service role)
│   │   └── middleware.ts        # Middleware refresh session + route protection
│   └── utils.ts
├── types/
│   └── database.ts              # Types TypeScript du schéma Supabase
└── middleware.ts                # Middleware Next.js

supabase/
├── schema.sql                   # Schéma complet à exécuter dans Supabase
└── rpc_find_or_create_conversation.sql  # Fonction RPC utilitaire
```

## Configuration Supabase

### 1. Variables d'environnement

Copiez `.env.example` en `.env.local` et remplissez avec vos valeurs Supabase Studio > Project Settings > API :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (côté serveur uniquement)

### 2. Schéma de base de données

Dans Supabase Studio > SQL Editor, exécutez dans l'ordre :
1. `supabase/schema.sql` — crée toutes les tables, triggers, RLS policies et storage buckets
2. `supabase/rpc_find_or_create_conversation.sql` — fonction utilitaire pour la messagerie

### 3. Authentification Google OAuth

Dans Supabase Studio > Authentication > Providers :
1. Activez le provider Google
2. Renseignez le Client ID et Client Secret (depuis Google Cloud Console > APIs & Services > Credentials)
3. Configurez l'URL de redirection : `https://VOTRE-DOMAINE/auth/callback`
   - Local : `http://localhost:3000/auth/callback`
   - Prod : `https://VOTRE-SITE.netlify.app/auth/callback`

Dans Google Cloud Console :
1. Créez un projet (ou utilisez celui déjà configuré)
2. APIs & Services > OAuth consent screen → configurez
3. APIs & Services > Credentials > Create Credentials > OAuth client ID
4. Application type : Web application
5. Authorized redirect URIs : `https://VOTRE-PROJET.supabase.co/auth/v1/callback`
6. Copiez le Client ID et Secret dans Supabase

### 4. Realtime

Le schéma active déjà Realtime pour les tables `posts`, `post_likes`, `comments`, `messages`, `notifications`, `connections`. Vérifiez dans Supabase Studio > Database > Replication que `supabase_realtime` est bien activée.

## Déploiement sur Netlify

1. Connectez votre dépôt GitHub/GitLab à Netlify
2. Build command : `bun run build` (ou `npm run build`)
3. Publish directory : `.next`
4. Variables d'environnement (Netlify dashboard > Site settings > Environment variables) :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL=https://VOTRE-SITE.netlify.app`
5. Le plugin `@netlify/plugin-nextjs` est configuré dans `netlify.toml`

Après le premier déploiement, mettez à jour les URLs de redirection OAuth dans Supabase Auth et Google Cloud Console avec l'URL Netlify.

## Développement local

```bash
# Installer les dépendances
bun install

# Lancer le serveur dev
bun run dev

# Lint
bun run lint
```

Ouvrez http://localhost:3000 — la landing page s'affiche, cliquez sur "Rejoindre" pour créer un compte.

## Fonctionnalités

### Authentification
- Inscription email/mot de passe (avec création auto de profil via trigger)
- Connexion email/mot de passe
- Google OAuth (avec callback sécurisé)
- Middleware de protection de routes
- Déconnexion

### Profils étudiants
- Photo de profil + bannière (upload vers Supabase Storage)
- Identité : prénom, nom, titre, bio
- Études : université, filière, niveau, année de diplôme, localisation
- Compétences (avec suggestions)
- Centres d'intérêt (avec suggestions)
- Liens : site web, LinkedIn, GitHub, Twitter, téléphone
- Badges #OpenToWork et #StageRecherche
- Parcours & expériences (stages, jobs, projets, bénévolat, formations) CRUD complet

### Recherche
- Recherche par nom, titre, compétence (recherche full-text)
- Filtres par université et filière
- Affichage des compétences
- Statut de connexion affiché (connecté / en attente / pas connecté)

### Réseau
- Envoyer / accepter / refuser / annuler des invitations
- Liste des connexions acceptées
- Liste des invitations reçues (avec pastille rouge dans la nav)
- Liste des invitations envoyées (avec retrait possible)
- Suggestions d'étudiants à connecter
- Suppression d'une connexion

### Fil d'actualité (Feed)
- Créer un post (texte + image, max 5 Mo)
- Compteur de likes / commentaires auto via triggers SQL
- Like / unlike optimiste
- Commentaires (avec Cmd+Enter pour publier)
- Partage (Web Share API ou copie du lien)
- Suppression de ses propres posts
- Realtime : nouveaux posts apparaissent en direct
- Toast à chaque nouvel post

### Messagerie
- Liste des conversations avec dernier message + unread count
- Vue conversation temps réel (Supabase Realtime)
- Marquage auto comme lu à l'ouverture
- Création auto de conversation depuis un profil via `/messages/new?to=USER_ID`
- Saisie avec Entrée pour envoyer, Maj+Entrée pour nouvelle ligne

### Notifications
- Likes, commentaires, invitations, acceptations, messages
- Icône par type avec couleur associée
- Marquage auto comme lu après 1,5 s
- Badge rouge dans la nav avec compteur
- Liens cliquables vers le contexte

## Sécurité

- **RLS activée** sur toutes les tables : un utilisateur ne lit/modifie que ses propres données (sauf ce qui est explicitement public)
- **Service role key** utilisée uniquement côté serveur, jamais exposée au client
- **Middleware** : refresh de session à chaque requête, redirection auto vers /login si non authentifié
- **Storage policies** : un utilisateur ne modère que ses propres fichiers
- **TypeScript strict** sur tout le projet

## Licence

Projet privé — NdongoLink © 2026
