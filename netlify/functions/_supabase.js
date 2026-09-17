const { createClient } = require('@supabase/supabase-js');
function db(){const url=process.env.SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('尚未設定 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');return createClient(url,key,{auth:{persistSession:false}})}
module.exports={db};