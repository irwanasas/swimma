create function search_similar_children(
  p_full_name text,
  p_date_of_birth date default null
) returns table (
  id uuid,
  full_name text,
  date_of_birth date,
  parent_id uuid,
  parent_name text,
  similarity real
) language sql stable as $$
  select
    c.id,
    c.full_name,
    c.date_of_birth,
    c.parent_id,
    p.full_name as parent_name,
    greatest(
      similarity(c.full_name, p_full_name),
      case when p_date_of_birth is not null and c.date_of_birth = p_date_of_birth then 1 else 0 end
    ) as similarity
  from children c
  join profiles p on p.id = c.parent_id
  where c.is_active
    and c.tenant_id = current_tenant_id()
    and (
      similarity(c.full_name, p_full_name) > 0.3
      or (p_date_of_birth is not null and c.date_of_birth = p_date_of_birth)
    )
  order by similarity desc
  limit 5;
$$;

grant execute on function search_similar_children(text, date) to authenticated;
