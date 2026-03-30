require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── CATEGORIES ───────────────────────────────────────────────

// GET all categories
app.get('/api/categories', async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST create category
app.post('/api/categories', async (req, res) => {
  const { name, color, icon, description } = req.body;
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, color, icon, description }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT update category
app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name, color, icon, description } = req.body;
  const { data, error } = await supabase
    .from('categories')
    .update({ name, color, icon, description })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE category (cascade deletes entries)
app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── ENTRIES (notes/scripts/exemples) ─────────────────────────

// GET entries by category (or all)
app.get('/api/entries', async (req, res) => {
  const { category_id } = req.query;
  let query = supabase
    .from('entries')
    .select('*, categories(name, color, icon)')
    .order('updated_at', { ascending: false });
  if (category_id) query = query.eq('category_id', category_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET single entry
app.get('/api/entries/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('entries')
    .select('*, categories(name, color, icon)')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST create entry
app.post('/api/entries', async (req, res) => {
  const { category_id, title, note, script_code, script_location, script_type, tags, entry_type } = req.body;
  const { data, error } = await supabase
    .from('entries')
    .insert([{ category_id, title, note, script_code, script_location, script_type, tags, entry_type }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT update entry
app.put('/api/entries/:id', async (req, res) => {
  const { id } = req.params;
  const { title, note, script_code, script_location, script_type, tags, entry_type } = req.body;
  const { data, error } = await supabase
    .from('entries')
    .update({ title, note, script_code, script_location, script_type, tags, entry_type, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE entry
app.delete('/api/entries/:id', async (req, res) => {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── SEARCH ───────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const { data, error } = await supabase
    .from('entries')
    .select('*, categories(name, color, icon)')
    .or(`title.ilike.%${q}%,note.ilike.%${q}%,script_code.ilike.%${q}%,tags.ilike.%${q}%`)
    .order('updated_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── STATS ────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  const [cats, entries] = await Promise.all([
    supabase.from('categories').select('id', { count: 'exact' }),
    supabase.from('entries').select('id, entry_type', { count: 'exact' })
  ]);
  const scripts = entries.data?.filter(e => e.entry_type === 'script').length || 0;
  const notes = entries.data?.filter(e => e.entry_type === 'note').length || 0;
  const examples = entries.data?.filter(e => e.entry_type === 'example').length || 0;
  res.json({
    categories: cats.count || 0,
    total: entries.count || 0,
    scripts, notes, examples
  });
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
