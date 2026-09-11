-- Keep existing catalog records aligned with the public GXZ Peptides rebrand.
update public.products
set
  name = replace(name, 'GXZ Health', 'GXZ Peptides'),
  description = replace(description, 'GXZ Health', 'GXZ Peptides'),
  long_description = case
    when long_description is null then null
    else replace(long_description, 'GXZ Health', 'GXZ Peptides')
  end,
  updated_at = now()
where
  name ilike '%GXZ Health%'
  or description ilike '%GXZ Health%'
  or long_description ilike '%GXZ Health%';
