-- Remove profile name columns that are no longer used by the app.
-- Safe to run multiple times.

alter table if exists public.profiles
	drop constraint if exists profiles_first_name_not_blank,
	drop constraint if exists profiles_last_name_not_blank,
	drop constraint if exists profiles_first_name_max_len,
	drop constraint if exists profiles_last_name_max_len;

alter table if exists public.profiles
	drop column if exists first_name,
	drop column if exists last_name,
	drop column if exists display_name;
