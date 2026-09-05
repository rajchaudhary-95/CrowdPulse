const { createClient } = require('@supabase/supabase-js');

function cleanUrl(url) {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseUrl = cleanUrl(rawUrl);
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

let supabaseInstance = null;

function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id'));
}

function getSupabase() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseInstance;
}

async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase credentials not configured in .env (running in local fallback mode)',
    };
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('zones').select('id').limit(1);
    if (error) {
      return {
        connected: false,
        message: `Supabase query error: ${error.message}`,
      };
    }
    return {
      connected: true,
      message: 'Supabase PostgreSQL connected successfully',
      data,
    };
  } catch (err) {
    return {
      connected: false,
      message: `Supabase connection exception: ${err.message}`,
    };
  }
}

module.exports = {
  isSupabaseConfigured,
  getSupabase,
  testSupabaseConnection,
};
