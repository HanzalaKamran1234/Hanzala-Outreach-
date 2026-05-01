const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://iwqcqjfzqfitsbdudnj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
