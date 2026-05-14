-- Phase 1.3: make receipt attachments bucket private.
-- App now stores object paths and resolves signed URLs at read time.

update storage.buckets
set public = false
where id = 'service-attachments';
