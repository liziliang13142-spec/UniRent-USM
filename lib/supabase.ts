// app/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dgrcidqtlujobhdqekvn.supabase.co'
const supabaseKey = 'sb_publishable_xE1AZuRw4EFq2pg_S_sZ7A_nSzAtWJC'

export const supabase = createClient(supabaseUrl, supabaseKey)