-- Enable pg_cron and pg_net extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule the abandoned cart recovery job
-- Runs every 10 minutes
-- NOTE: This job requires your Project URL and Service Role Key.
-- Please replace the placeholders below before applying this migration in production.

select
  cron.schedule(
    'abandoned-cart-recovery',
    '*/10 * * * *',
    $$
    select
      net.http_post(
        -- ⚠️ REPLACE WITH YOUR PROJECT URL ⚠️
        url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/recover-abandoned-carts',
        -- ⚠️ REPLACE WITH YOUR SERVICE ROLE KEY ⚠️
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
      ) as request_id;
    $$
  );
