-- RaasLeela — complete-look accessories ke liye migration
-- Dashboard > SQL Editor me Run karo (safe: column ho to skip).
-- Format: [{"name":"Oxidised jhumka","tag":"addon","price":99}]
-- tag = included (rent me) | free (muft) | addon (extra charge)

alter table public.products add column if not exists accessories jsonb default '[]'::jsonb;
alter table public.products add column if not exists images jsonb default '[]'::jsonb;
