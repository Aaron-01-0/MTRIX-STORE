-- Ensure Sequence Exists
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

-- Ensure RPC Exists (Re-runnable)
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_val bigint;
BEGIN
  SELECT nextval('invoice_number_seq') INTO next_val;
  RETURN 'MTRIX-INV-' || next_val;
END;
$$;
