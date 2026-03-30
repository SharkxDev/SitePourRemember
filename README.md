# 🎮 ROBLOX KB — Ma Base de Connaissance

Site personnel pour documenter mon avancée sur Roblox Studio.

## Stack
- **Frontend** : HTML / CSS / JS vanilla
- **Backend** : Node.js + Express
- **Base de données** : Supabase (PostgreSQL)
- **Hébergement** : Railway

---

## 🚀 Setup en 4 étapes

### 1. Supabase — Créer la base de données

1. Va sur [supabase.com](https://supabase.com) → **New Project**
2. Donne un nom, choisis un mot de passe fort → **Create Project**
3. Dans le menu gauche : **SQL Editor** → **New Query**
4. Colle tout le contenu de `supabase_schema.sql` → **Run**
5. Va dans **Project Settings** → **API** :
   - Copie `Project URL` → c'est ton `SUPABASE_URL`
   - Copie `anon / public` key → c'est ton `SUPABASE_ANON_KEY`

---

### 2. GitHub — Push le projet

```bash
git init
git add .
git commit -m "init roblox kb"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/roblox-kb.git
git push -u origin main
```

---

### 3. Railway — Déployer

1. Va sur [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → sélectionne `roblox-kb`
3. Dans ton service → **Variables** → ajoute :
   ```
   SUPABASE_URL     = https://XXXX.supabase.co
   SUPABASE_ANON_KEY = eyJ...
   PORT             = 3000
   ```
4. Railway redéploie automatiquement → ton site est en ligne ! 🎉

---

### 4. Tester en local

```bash
# Copie le fichier d'environnement
cp .env.example .env
# Remplis .env avec tes vraies clés Supabase

npm install
npm run dev
# → http://localhost:3000
```

---

## 📁 Structure du projet

```
roblox-kb/
├── public/
│   ├── index.html        ← Interface principale
│   ├── css/
│   │   └── style.css     ← Styles (thème hologramme bleu)
│   └── js/
│       ├── planet.js     ← Rendu planète canvas
│       └── app.js        ← Logique app + appels API
├── server/
│   └── index.js          ← Serveur Express + routes Supabase
├── supabase_schema.sql   ← SQL à coller dans Supabase
├── railway.toml          ← Config Railway
├── .env.example          ← Template variables d'env
└── package.json
```

---

## ✨ Fonctionnalités

- **Catégories** avec couleur et icône personnalisées
- **3 types d'entrées** :
  - 📝 **Note** — Explication libre
  - 💻 **Script** — Code Lua/Luau avec emplacement Studio
  - 🔬 **Exemple** — Script + explication combinés
- **Emplacement Roblox** — Chips cliquables (ServerScriptService, ReplicatedStorage, etc.)
- **Type de script** — Script / LocalScript / ModuleScript / RemoteEvent...
- **Tags** pour filtrer
- **Recherche** globale
- **Sauvegarde Supabase** — Tout est persisté en base

---

## ⌨️ Raccourcis

| Raccourci | Action |
|-----------|--------|
| `Ctrl+S` | Sauvegarder l'entrée en cours |
| `Escape` | Retour à la liste / Fermer modal |
