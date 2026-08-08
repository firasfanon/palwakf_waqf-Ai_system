-- MEGA_BATCH_ASSISTANT_SCHEMA_DEFAULT_PRIVILEGES_HARDENING_V1
-- Effective Default ACL discovery and decision gate.
-- Strictly read-only.
\pset pager off
\set ON_ERROR_STOP on
\x off

begin transaction read only;

select
  'ASSISTANT_SCHEMA_DEFAULT_PRIVILEGES_PREFLIGHT_START' as marker,
  current_database() as database_name,
  current_user as execution_role,
  now() as checked_at,
  current_setting('transaction_read_only') as transaction_read_only;

select
  n.nspname as schema_name,
  pg_get_userbyid(n.nspowner) as schema_owner,
  r.rolname as inspected_role,
  has_schema_privilege(r.rolname,n.oid,'USAGE') as has_usage,
  has_schema_privilege(r.rolname,n.oid,'CREATE') as has_create
from pg_namespace n
cross join pg_roles r
where n.nspname='assistant'
  and r.rolname in ('anon','authenticated','service_role','postgres')
order by r.rolname;

select
  rolname, rolsuper, rolbypassrls, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin
from pg_roles
where rolname in ('anon','authenticated','service_role','postgres')
order by rolname;

with objects as (
  select c.relowner as owner_oid,
         case c.relkind
           when 'r' then 'TABLE'
           when 'p' then 'PARTITIONED_TABLE'
           when 'v' then 'VIEW'
           when 'm' then 'MATERIALIZED_VIEW'
           when 'S' then 'SEQUENCE'
           when 'f' then 'FOREIGN_TABLE'
           else c.relkind::text
         end as object_type,
         count(*) as object_count
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='assistant'
    and c.relkind in ('r','p','v','m','S','f')
  group by c.relowner,c.relkind
  union all
  select p.proowner,'FUNCTION_OR_PROCEDURE',count(*)
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='assistant'
  group by p.proowner
)
select pg_get_userbyid(owner_oid) as owner_role, object_type, object_count
from objects
order by owner_role,object_type;

select
  d.defaclrole::regrole::text as owner_role,
  coalesce(n.nspname,'<GLOBAL>') as default_scope,
  case d.defaclobjtype
    when 'r' then 'TABLES'
    when 'S' then 'SEQUENCES'
    when 'f' then 'FUNCTIONS'
    when 'T' then 'TYPES'
    when 'n' then 'SCHEMAS'
    when 'L' then 'LARGE_OBJECTS'
    else d.defaclobjtype::text
  end as object_type,
  d.defaclacl
from pg_default_acl d
left join pg_namespace n on n.oid=d.defaclnamespace
where d.defaclrole in (
  select oid from pg_roles where rolname in ('postgres','service_role')
)
  and (d.defaclnamespace=0 or n.nspname='assistant')
order by owner_role,default_scope,object_type;

select
  r.rolname as owner_role,
  acldefault('r',r.oid) as builtin_table_default_acl,
  acldefault('S',r.oid) as builtin_sequence_default_acl,
  acldefault('f',r.oid) as builtin_function_default_acl
from pg_roles r
where r.rolname in ('postgres','service_role')
order by r.rolname;

with owners as (
  select oid,rolname from pg_roles where rolname in ('postgres','service_role')
),
global_function_defaults as (
  select
    o.rolname as owner_role,
    coalesce(d.defaclacl,acldefault('f',o.oid)) as effective_global_acl
  from owners o
  left join pg_default_acl d
    on d.defaclrole=o.oid
   and d.defaclnamespace=0
   and d.defaclobjtype='f'
),
expanded as (
  select g.owner_role,x.grantee,x.privilege_type,x.is_grantable
  from global_function_defaults g
  cross join lateral aclexplode(g.effective_global_acl) x
)
select
  owner_role,
  case when grantee=0 then 'PUBLIC' else grantee::regrole::text end as grantee,
  privilege_type,
  is_grantable
from expanded
order by owner_role,grantee,privilege_type;

with assistant_defaults as (
  select d.defaclrole,d.defaclobjtype,d.defaclacl
  from pg_default_acl d
  join pg_namespace n on n.oid=d.defaclnamespace
  where n.nspname='assistant'
),
expanded as (
  select a.defaclrole,a.defaclobjtype,x.grantee,x.privilege_type,x.is_grantable
  from assistant_defaults a
  cross join lateral aclexplode(a.defaclacl) x
)
select
  defaclrole::regrole::text as owner_role,
  case defaclobjtype
    when 'r' then 'TABLES'
    when 'S' then 'SEQUENCES'
    when 'f' then 'FUNCTIONS'
    else defaclobjtype::text
  end as object_type,
  case when grantee=0 then 'PUBLIC' else grantee::regrole::text end as grantee,
  privilege_type,
  is_grantable
from expanded
order by owner_role,object_type,grantee,privilege_type;

select
  count(*) as assistant_function_count,
  count(*) filter (where has_function_privilege('anon',p.oid,'EXECUTE')) as anon_effective_execute_count,
  count(*) filter (where has_function_privilege('authenticated',p.oid,'EXECUTE')) as authenticated_effective_execute_count,
  count(*) filter (where has_function_privilege('service_role',p.oid,'EXECUTE')) as service_role_effective_execute_count
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='assistant';

select
  table_name,grantee,array_agg(privilege_type order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema='assistant'
  and grantee in ('PUBLIC','anon','authenticated','service_role','postgres')
group by table_name,grantee
order by table_name,grantee;

select routine_name,grantee,privilege_type
from information_schema.routine_privileges
where specific_schema='assistant'
  and grantee in ('PUBLIC','anon','authenticated','service_role','postgres')
order by routine_name,grantee,privilege_type;

with postgres_role as (
  select oid from pg_roles where rolname='postgres'
),
global_function_acl as (
  select coalesce(d.defaclacl,acldefault('f',p.oid)) as acl
  from postgres_role p
  left join pg_default_acl d
    on d.defaclrole=p.oid
   and d.defaclnamespace=0
   and d.defaclobjtype='f'
),
global_public_execute as (
  select exists(
    select 1
    from global_function_acl g
    cross join lateral aclexplode(g.acl) x
    where x.grantee=0 and x.privilege_type='EXECUTE'
  ) as present
),
assistant_owner_variance as (
  select count(distinct owner_oid) as owner_count
  from (
    select c.relowner as owner_oid
    from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='assistant' and c.relkind in ('r','p','v','m','S','f')
    union
    select p.proowner
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='assistant'
  ) q
)
select
  'ASSISTANT_SCHEMA_DEFAULT_PRIVILEGES_DECISION' as marker,
  case when g.present then 'YES' else 'NO' end as global_postgres_public_function_execute_effective,
  case when g.present then 'NO' else 'YES' end as schema_only_function_hardening_sufficient,
  case when g.present then 'YES' else 'NO' end as global_function_default_scope_decision_required,
  case when o.owner_count=1 then 'YES' else 'NO' end as single_current_object_owner,
  o.owner_count as current_object_owner_count,
  'SCHEMA_LOCAL_TABLE_SEQUENCE_DIRECT_ROLE_DEFAULT_REVOKE=READY_FOR_CONTROLLED_DESIGN' as table_sequence_decision,
  'EXISTING_OBJECT_GRANTS=UNCHANGED_BY_DEFAULT_PRIVILEGE_BATCH' as existing_object_boundary,
  'NO_DATABASE_WRITE' as database_write,
  'NO_DEFAULT_ACL_CHANGE' as default_acl_change,
  'NO_KNOWLEDGE_MUTATION' as knowledge_mutation,
  'NO_CHAT_RELEASE' as chat_release,
  'NO_PRODUCTION' as production
from global_public_execute g
cross join assistant_owner_variance o;

select
  'ASSISTANT_SCHEMA_DEFAULT_PRIVILEGES_PREFLIGHT_COMPLETE' as marker,
  current_setting('transaction_read_only') as transaction_read_only,
  'NO_DATABASE_WRITE' as database_write,
  'NO_DEFAULT_ACL_CHANGE' as default_acl_change,
  'NO_EXISTING_OBJECT_GRANT_CHANGE' as existing_object_grant_change,
  'NO_KNOWLEDGE_MUTATION' as knowledge_mutation,
  'NO_CHAT_RELEASE' as chat_release,
  'NO_PRODUCTION' as production;

rollback;
