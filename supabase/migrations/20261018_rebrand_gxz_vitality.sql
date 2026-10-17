-- Align existing catalog records with the public GXZ Vitality brand.
update public.products
set
  name = replace(name, 'GXZ Peptides', 'GXZ Vitality'),
  description = replace(description, 'GXZ Peptides', 'GXZ Vitality'),
  long_description = case
    when long_description is null then null
    else replace(long_description, 'GXZ Peptides', 'GXZ Vitality')
  end
where
  name like '%GXZ Peptides%'
  or description like '%GXZ Peptides%'
  or long_description like '%GXZ Peptides%';
