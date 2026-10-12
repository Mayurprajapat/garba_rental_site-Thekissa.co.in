-- TheKissa.co — shop-tile tags ke liye migration
-- Dashboard > SQL Editor me Run karo (safe: column ho to skip).
-- Format: ["lehenga","blouse"] (Admin → Categories wale tile ids, lowercase)
-- Tags tick hain to dress/item SIRF wahi tiles me dikhega; khaali = keyword auto-match.

alter table public.products add column if not exists tags jsonb default '[]'::jsonb;
