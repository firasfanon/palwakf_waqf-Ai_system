\pset pager off
\set ON_ERROR_STOP on
begin transaction read only;
select 'ASSISTANT_DEFAULT_PRIVILEGES_LOCAL_HARDENING_WHATIF_START' marker,current_setting('transaction_read_only') transaction_read_only;
do $x$
declare v_owner text; v_count int; v_global bool; v_direct int;
begin
 select pg_get_userbyid(nspowner) into v_owner from pg_namespace where nspname='assistant';
 if v_owner is distinct from 'postgres' then raise exception 'ASSISTANT_SCHEMA_OWNER_DRIFT:%',v_owner; end if;
 select count(distinct owner_oid) into v_count from (
   select c.relowner owner_oid from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='assistant' and c.relkind in('r','p','v','m','S','f')
   union select p.proowner from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='assistant')q;
 if v_count<>1 then raise exception 'ASSISTANT_OBJECT_OWNER_COUNT_DRIFT:%',v_count; end if;
 with g as(select coalesce(d.defaclacl,acldefault('f',r.oid)) acl from pg_roles r left join pg_default_acl d on d.defaclrole=r.oid and d.defaclnamespace=0 and d.defaclobjtype='f' where r.rolname='postgres')
 select exists(select 1 from g cross join lateral aclexplode(g.acl)a where a.grantee=0 and a.privilege_type='EXECUTE') into v_global;
 if not v_global then raise exception 'GLOBAL_PUBLIC_FUNCTION_EXECUTE_PREIMAGE_CHANGED'; end if;
 with d as(select x.defaclacl from pg_default_acl x join pg_namespace n on n.oid=x.defaclnamespace join pg_roles r on r.oid=x.defaclrole where n.nspname='assistant' and r.rolname='postgres')
 select count(*) into v_direct from d cross join lateral aclexplode(d.defaclacl)a where a.grantee in(select oid from pg_roles where rolname in('anon','authenticated'));
 if v_direct<>26 then raise exception 'DIRECT_CLIENT_DEFAULT_GRANT_PREIMAGE_DRIFT:%',v_direct; end if;
end$x$;
select 'ASSISTANT_DEFAULT_PRIVILEGES_LOCAL_HARDENING_WHATIF_COMPLETE' marker,
 'EXPECTED_DIRECT_CLIENT_DEFAULT_GRANTS=0' expected_direct_client_defaults,
 'SERVICE_ROLE_SCHEMA_DEFAULTS=PRESERVED' service_role_defaults,
 'GLOBAL_PUBLIC_FUNCTION_EXECUTE=REMAINS_EFFECTIVE' global_function_hold,
 'NO_DATABASE_WRITE' database_write,'NO_EXISTING_OBJECT_GRANT_CHANGE' existing_object_grants,
 'NO_KNOWLEDGE_MUTATION' knowledge_mutation,'NO_CHAT_RELEASE' chat_release,'NO_PRODUCTION' production;
rollback;
