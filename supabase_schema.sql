-- ============================================================
-- SCHEMA pour Roblox Knowledge Base
-- Colle ce SQL dans Supabase > SQL Editor > Run
-- ============================================================

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#00d4ff',
  icon TEXT DEFAULT '📁',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des entrées (notes, scripts, exemples)
CREATE TABLE IF NOT EXISTS entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  entry_type TEXT DEFAULT 'note' CHECK (entry_type IN ('note', 'script', 'example')),
  note TEXT DEFAULT '',
  script_code TEXT DEFAULT '',
  script_location TEXT DEFAULT '',  -- ex: ServerScriptService, ReplicatedStorage...
  script_type TEXT DEFAULT '',      -- ex: Script, LocalScript, ModuleScript
  tags TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la recherche
CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category_id);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(entry_type);

-- Données de démonstration (optionnel, supprime si tu veux partir de zéro)
INSERT INTO categories (name, color, icon, description) VALUES
('Systèmes de base', '#00d4ff', '⚙️', 'Les fondamentaux que j''ai appris'),
('Physique & Mouvements', '#c8ff00', '🏃', 'Tout ce qui concerne les mouvements de perso'),
('UI / Interface', '#ff6b35', '🖥️', 'StarterGui, ScreenGui, Frames...')
ON CONFLICT DO NOTHING;
