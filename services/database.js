// Connexion à la base PostgreSQL Supabase via Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// (Optionnel) Connexion au client Supabase JS si tu veux utiliser les services Supabase (auth, storage, etc)
// Décommente les lignes suivantes si tu utilises aussi @supabase/supabase-js
// const { createClient } = require('@supabase/supabase-js');
// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_KEY;
// const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
  prisma,
  // supabase, // Décommente si tu utilises le client Supabase JS
};
