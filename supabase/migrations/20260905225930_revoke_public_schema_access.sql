-- À hauteur d'habitants V4 — Lot 2
-- Retire l'accès hérité via PUBLIC au schéma Data API par défaut.

revoke all on schema public from public;
notify pgrst, 'reload config';
