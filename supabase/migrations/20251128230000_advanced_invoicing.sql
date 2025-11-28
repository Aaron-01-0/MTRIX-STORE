-- Create Invoice Number Sequence (starts at 1000)
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

-- Create Credit Notes Table
CREATE TABLE IF NOT EXISTS credit_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id),
    reason TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on credit_notes
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_notes
CREATE POLICY "Admins can view all credit notes" ON credit_notes
    FOR SELECT USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert credit notes" ON credit_notes
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Alter Orders Table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_breakdown JSONB DEFAULT '{}'::jsonb;

-- Alter Invoices Table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'issued'; -- issued, cancelled

-- Add RLS for Invoices (if not already present or needs update)
-- (Assuming basic RLS exists from previous migration, ensuring admin access)

-- Function to generate next invoice number
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
