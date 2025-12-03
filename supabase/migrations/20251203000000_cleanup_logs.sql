-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Schedule a daily job to delete logs older than 90 days
-- Runs at midnight every day (0 0 * * *)
select
  cron.schedule(
    'cleanup-old-logs',
    '0 0 * * *',
    $$
    delete from activity_logs where created_at < now() - interval '90 days';
    $$
  );
