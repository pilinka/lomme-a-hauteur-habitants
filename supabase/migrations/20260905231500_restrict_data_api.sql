-- À hauteur d'habitants V4 — Lot 2
-- La Data API n'expose que les projections explicites du schéma api.

revoke all on schema public from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;

alter role authenticator set pgrst.db_schemas = 'api';
notify pgrst, 'reload config';
