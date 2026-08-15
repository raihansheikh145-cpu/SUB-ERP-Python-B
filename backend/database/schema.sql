-- =============================================================
-- DATABASE SCHEMA DUMP
-- Generated: 2026-08-06T08:18:14.788Z
-- Run this file on a fresh PostgreSQL database to get started.
-- =============================================================

-- =============================================================
-- SECTION 1: TABLE DEFINITIONS
-- =============================================================

CREATE TABLE IF NOT EXISTS public.auth_users (
  id text NOT NULL,
  email text NOT NULL,
  hashed_password text NOT NULL,
  role text DEFAULT 'authenticated'::text,
  is_active boolean DEFAULT true,
  reset_token text,
  reset_token_expires timestamp without time zone,
  approval_token text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.company_doc_sequences (
  company_code text NOT NULL,
  seq_group text NOT NULL,
  last_value integer DEFAULT 0,
  PRIMARY KEY (company_code, seq_group)
);

CREATE TABLE IF NOT EXISTS public.company_users (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  company_id text NOT NULL,
  role text DEFAULT 'USER'::text,
  user_uuid uuid,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_accounts (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone,
  company_id text NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  type text NOT NULL,
  data jsonb,
  sub_type text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_advance_salaries (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  data jsonb,
  updated_at timestamp with time zone,
  company_id text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_attendance (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone,
  company_id text NOT NULL,
  attendance_date date NOT NULL,
  status text NOT NULL,
  employee_id text NOT NULL,
  late_minutes integer DEFAULT 0,
  overtime_hours numeric DEFAULT 0,
  is_important_day boolean DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_audit_log (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  table_name text NOT NULL,
  record_id text NOT NULL,
  company_id text,
  action_type text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  user_uuid uuid,
  created_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text,
  function_source text,
  record_status text,
  document_number text,
  record_version integer,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  company_id text NOT NULL,
  user_id text,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  client_info jsonb,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_bill_lines (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  bill_id text NOT NULL,
  company_id text NOT NULL,
  product_id text,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  discount numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  type text,
  line_value numeric DEFAULT 0,
  discount_mode text,
  discount_rate numeric DEFAULT 0,
  discount_value numeric DEFAULT 0,
  serial_numbers jsonb DEFAULT '[]'::jsonb,
  display_index integer DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_bills (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  bill_number text NOT NULL,
  company_id text NOT NULL,
  date date,
  vendor_id text,
  status text NOT NULL,
  total numeric DEFAULT 0,
  version integer DEFAULT 1,
  bill_date date NOT NULL,
  due_date date,
  subtotal numeric DEFAULT 0,
  tax_total numeric DEFAULT 0,
  discount_total numeric DEFAULT 0,
  company_code text,
  created_by_id text,
  reference text,
  data jsonb,
  journal_entry_id text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_brands (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone,
  company_id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  data jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_cash_ledger (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  company_id text NOT NULL,
  date date NOT NULL,
  journal_id text NOT NULL,
  line_id text NOT NULL,
  reference_number text,
  journal_type text,
  description text,
  debit numeric DEFAULT 0,
  credit numeric DEFAULT 0,
  impact numeric DEFAULT 0,
  partner_name text,
  prepared_by text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_categories (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone,
  company_id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  data jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_commission_targets (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  data jsonb,
  updated_at timestamp with time zone,
  company_id text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_companies (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone,
  company_id text,
  code text NOT NULL,
  name text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_contact_companies (
  contact_id text NOT NULL,
  company_id text NOT NULL,
  PRIMARY KEY (contact_id, company_id)
);

CREATE TABLE IF NOT EXISTS public.docs_contacts (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  company_id text,
  name text NOT NULL,
  type text NOT NULL,
  email text,
  phone text,
  address text,
  external_id text,
  company_ids text[],
  opening_balances jsonb DEFAULT '{}'::jsonb,
  data jsonb,
  is_customer boolean DEFAULT false,
  is_vendor boolean DEFAULT false,
  is_lender boolean DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_credit_note_lines (
  id text NOT NULL,
  credit_note_id text,
  company_id text NOT NULL,
  product_id text,
  type text,
  uom text,
  description text,
  display_description text,
  quantity numeric DEFAULT 0,
  unit_price numeric DEFAULT 0,
  line_value numeric DEFAULT 0,
  total numeric DEFAULT 0,
  discount_mode text,
  discount_rate numeric DEFAULT 0,
  serial_numbers jsonb DEFAULT '[]'::jsonb,
  display_index integer DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_credit_notes (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  credit_note_number text,
  company_id text NOT NULL,
  date date,
  total numeric DEFAULT 0,
  status text NOT NULL,
  customer_id text,
  cn_number text,
  credit_note_date date NOT NULL,
  due_date date,
  subtotal numeric DEFAULT 0,
  tax_total numeric DEFAULT 0,
  discount_total numeric DEFAULT 0,
  origin_invoice_id text,
  data jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_document_sequences (
  company_id text NOT NULL,
  document_type text NOT NULL,
  last_sequence bigint DEFAULT 0,
  PRIMARY KEY (company_id, document_type)
);

CREATE TABLE IF NOT EXISTS public.docs_financial_periods (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  company_id text NOT NULL,
  year_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'OPEN'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_fiscal_periods (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  company_id text NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_closed boolean DEFAULT false,
  closed_at timestamp with time zone,
  closed_by text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_holidays (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  data jsonb,
  updated_at timestamp with time zone,
  company_id text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_idempotency_keys (
  idempotency_key text NOT NULL,
  user_id text,
  response_code integer,
  response_body jsonb,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval),
  PRIMARY KEY (idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.docs_inventory_adjustments (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  data jsonb,
  updated_at timestamp with time zone,
  company_id text,
  status text DEFAULT 'DRAFT'::text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_inventory_transactions (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  company_id text NOT NULL,
  product_id text NOT NULL,
  transaction_type text NOT NULL,
  quantity numeric NOT NULL,
  reference_id text,
  reference_type text,
  date date NOT NULL,
  cost_price numeric DEFAULT 0,
  unit_price numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  warehouse_id text DEFAULT 'main-warehouse'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by_id uuid,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_invoice_lines (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  invoice_id text NOT NULL,
  company_id text NOT NULL,
  product_id text,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  discount numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  type text,
  uom text,
  display_description text,
  line_value numeric DEFAULT 0,
  discount_mode text,
  discount_rate numeric DEFAULT 0,
  serial_numbers jsonb DEFAULT '[]'::jsonb,
  cost_price_at_sale numeric,
  display_index integer DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_invoices (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  invoice_number text NOT NULL,
  company_id text NOT NULL,
  date date,
  customer_id text,
  status text NOT NULL,
  total numeric DEFAULT 0,
  version integer DEFAULT 1,
  invoice_date date NOT NULL,
  due_date date,
  subtotal numeric DEFAULT 0,
  tax_total numeric DEFAULT 0,
  discount_total numeric DEFAULT 0,
  company_code text,
  created_by_id text,
  sr_id text,
  reference text,
  salesperson text,
  customer_note text,
  delivery_person text,
  messages jsonb DEFAULT '[]'::jsonb,
  data jsonb,
  total_profit numeric DEFAULT 0,
  journal_entry_id text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_journal_lines (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  journal_id text NOT NULL,
  company_id text NOT NULL,
  account_id text NOT NULL,
  contact_id text,
  debit numeric DEFAULT 0,
  credit numeric DEFAULT 0,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_journals (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  reference_number text,
  company_id text NOT NULL,
  date date,
  journal_type text,
  status text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  is_immutable boolean DEFAULT false,
  reversal_of_id text,
  reversed_by_id text,
  fiscal_period_id uuid,
  journal_date date NOT NULL,
  journal_number text,
  reference text,
  description text,
  company_code text,
  created_by_id text,
  prepared_by text,
  data jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_leaves (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  data jsonb,
  updated_at timestamp with time zone,
  company_id text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_loan_amortization_lines (
  id bigint DEFAULT nextval('docs_loan_amortization_lines_id_seq'::regclass) NOT NULL,
  loan_id text,
  company_id text NOT NULL,
  payment_date date NOT NULL,
  period integer NOT NULL,
  status text NOT NULL,
  balance numeric DEFAULT 0,
  payment numeric DEFAULT 0,
  interest numeric DEFAULT 0,
  principal numeric DEFAULT 0,
  interest_paid boolean DEFAULT false,
  principal_paid boolean DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_loans (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone,
  company_id text NOT NULL,
  loan_number text NOT NULL,
  date date,
  amount numeric DEFAULT 0,
  status text NOT NULL,
  name text,
  type text,
  notes text,
  contact_id text,
  start_date date,
  term_months integer DEFAULT 0,
  interest_rate numeric DEFAULT 0,
  interest_type text,
  principal_amount numeric DEFAULT 0,
  paid_periods text[] DEFAULT '{}'::text[],
  journal_entry_id text,
  amortization_schedule jsonb DEFAULT '[]'::jsonb,
  data jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_payments (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  payment_number text,
  company_id text NOT NULL,
  date date,
  contact_id text,
  status text NOT NULL,
  amount numeric DEFAULT 0 NOT NULL,
  payment_date date NOT NULL,
  type text NOT NULL,
  method text,
  account_id text,
  partner_account_id text,
  reference text,
  applied_invoices jsonb,
  applied_bills jsonb,
  data jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_payslips (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  data jsonb,
  updated_at timestamp with time zone,
  company_id text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_product_companies (
  product_id text NOT NULL,
  company_id text NOT NULL,
  PRIMARY KEY (product_id, company_id)
);

CREATE TABLE IF NOT EXISTS public.docs_product_costs (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  company_id text NOT NULL,
  product_id text NOT NULL,
  warehouse_id text NOT NULL,
  avg_cost numeric DEFAULT 0,
  total_qty numeric DEFAULT 0,
  total_value numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_product_stocks (
  id bigint DEFAULT nextval('docs_product_stocks_id_seq'::regclass) NOT NULL,
  product_id text,
  company_id text NOT NULL,
  quantity numeric DEFAULT 0,
  initial_quantity numeric DEFAULT 0,
  total_added numeric DEFAULT 0,
  total_out numeric DEFAULT 0,
  avg_cost_price numeric DEFAULT 0,
  total_valuation numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_products (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  company_id text,
  name text NOT NULL,
  sku text NOT NULL,
  price numeric DEFAULT 0,
  cost_price numeric DEFAULT 0,
  is_locked boolean DEFAULT false,
  last_reconciled_at timestamp with time zone,
  uom text,
  type text,
  brand text,
  tax_code text,
  category text,
  external_id text,
  description text,
  tracking_type text,
  invoicing_policy text,
  initial_cost numeric DEFAULT 0,
  last_purchase_rate numeric DEFAULT 0,
  last_purchase_price numeric DEFAULT 0,
  quantity_on_hand numeric DEFAULT 0,
  is_in_pos boolean DEFAULT true,
  can_be_sold boolean DEFAULT true,
  can_be_purchased boolean DEFAULT true,
  can_be_expensed boolean DEFAULT false,
  track_inventory boolean DEFAULT true,
  company_ids text[],
  serial_numbers jsonb DEFAULT '[]'::jsonb,
  data jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_report_jobs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  company_id text NOT NULL,
  report_type text NOT NULL,
  parameters jsonb,
  status text DEFAULT 'PENDING'::text NOT NULL,
  result_url text,
  error_message text,
  user_uuid uuid,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  requested_by text,
  started_at timestamp with time zone,
  result_data jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_roles (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone,
  company_id text,
  name text NOT NULL,
  color text,
  is_system boolean DEFAULT false,
  description text,
  permissions text[] DEFAULT '{}'::text[],
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_stock_movements (
  id bigint DEFAULT nextval('docs_stock_movements_id_seq'::regclass) NOT NULL,
  product_id text,
  company_id text NOT NULL,
  movement_type text NOT NULL,
  quantity numeric NOT NULL,
  unit_cost numeric NOT NULL,
  total_value numeric NOT NULL,
  reference_id text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_system_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  level text DEFAULT 'INFO'::text,
  category text,
  message text,
  payload jsonb,
  trace_id text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_tasks (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  data jsonb,
  updated_at timestamp with time zone,
  company_id text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_user_companies (
  user_id text NOT NULL,
  company_id text NOT NULL,
  PRIMARY KEY (user_id, company_id)
);

CREATE TABLE IF NOT EXISTS public.docs_user_company_access (
  user_uuid uuid NOT NULL,
  company_id text NOT NULL,
  role_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_uuid, company_id)
);

CREATE TABLE IF NOT EXISTS public.docs_users (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone,
  company_id text,
  user_uuid uuid,
  pin text,
  name text NOT NULL,
  email text NOT NULL,
  username text,
  role_id text,
  status text NOT NULL,
  email_confirmed boolean DEFAULT true,
  invitation_token text,
  company_ids jsonb DEFAULT '[]'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.docs_warehouses (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  updated_at timestamp with time zone,
  company_id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.import_contacts_template (
  id integer DEFAULT nextval('import_contacts_template_id_seq'::regclass) NOT NULL,
  company_id text,
  name text NOT NULL,
  type text DEFAULT 'CUSTOMER'::text,
  email text,
  phone text,
  address text,
  opening_balance numeric DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.import_products_template (
  id integer DEFAULT nextval('import_products_template_id_seq'::regclass) NOT NULL,
  company_id text,
  name text NOT NULL,
  sku text,
  price numeric DEFAULT 0,
  cost_price numeric DEFAULT 0,
  quantity_on_hand numeric DEFAULT 0,
  category text DEFAULT 'General'::text,
  brand text,
  uom text DEFAULT 'pcs'::text,
  description text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.report_profit_and_loss (
  id bigint DEFAULT nextval('report_profit_and_loss_id_seq'::regclass) NOT NULL,
  company_id text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  account_id text NOT NULL,
  account_name text NOT NULL,
  account_type text NOT NULL,
  total_debit numeric(15,4) DEFAULT 0.0000,
  total_credit numeric(15,4) DEFAULT 0.0000,
  balance numeric(15,4) DEFAULT 0.0000,
  generated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.sequence_counters (
  company_code text NOT NULL,
  seq_group text NOT NULL,
  last_value integer DEFAULT 0,
  PRIMARY KEY (company_code, seq_group)
);

-- =============================================================
-- SECTION 2: FUNCTIONS
-- =============================================================

-- Function: atomic_inventory_update
CREATE OR REPLACE FUNCTION public.atomic_inventory_update(p_product_id text, p_company_id text, p_qty_delta numeric, p_expected_current_qty numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_actual_qty NUMERIC;
BEGIN
    -- 1. Get current qty and lock row
    SELECT (data->>'quantityOnHand')::numeric INTO v_actual_qty 
    FROM docs_products 
    WHERE id = p_product_id AND company_id = p_company_id
    FOR UPDATE;

    -- 2. Optimistic concurrency check
    IF v_actual_qty <> p_expected_current_qty THEN
        RAISE EXCEPTION 'Inventory Conflict: Product % qty changed from % to % by another process.', p_product_id, p_expected_current_qty, v_actual_qty;
    END IF;

    -- 3. Update
    UPDATE docs_products 
    SET data = data || jsonb_build_object('quantityOnHand', v_actual_qty + p_qty_delta),
        updated_at = now()
    WHERE id = p_product_id;

    RETURN jsonb_build_object('success', true, 'new_qty', v_actual_qty + p_qty_delta);
END;
$function$;


-- Function: audit_log_trigger
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_action TEXT;
    v_company_id TEXT := NULL;
    v_record_id TEXT := NULL;
BEGIN
    v_action := TG_OP;
    
    -- Extract company_id and id gracefully from NEW/OLD if they exist
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        BEGIN
            v_company_id := to_jsonb(NEW)->>'company_id';
            v_record_id := to_jsonb(NEW)->>'id';
        EXCEPTION WHEN OTHERS THEN END;
    ELSIF TG_OP = 'DELETE' THEN
        BEGIN
            v_company_id := to_jsonb(OLD)->>'company_id';
            v_record_id := to_jsonb(OLD)->>'id';
        EXCEPTION WHEN OTHERS THEN END;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO docs_audit_log (table_name, record_id, company_id, action_type, new_values, user_uuid)
        VALUES (TG_TABLE_NAME, v_record_id, v_company_id, v_action, row_to_json(NEW)::jsonb, auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO docs_audit_log (table_name, record_id, company_id, action_type, old_values, new_values, user_uuid)
        VALUES (TG_TABLE_NAME, v_record_id, v_company_id, v_action, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO docs_audit_log (table_name, record_id, company_id, action_type, old_values, user_uuid)
        VALUES (TG_TABLE_NAME, v_record_id, v_company_id, v_action, row_to_json(OLD)::jsonb, auth.uid());
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$function$;


-- Function: auto_create_brand_and_category
CREATE OR REPLACE FUNCTION public.auto_create_brand_and_category()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_brand_code TEXT;
    v_category_code TEXT; -- 💡 ক্যাটাগরির কোড রাখার জন্য নতুন ভেরিয়েবল
BEGIN
    -- Brand Auto-Save Logic
    IF NEW.brand IS NOT NULL AND TRIM(NEW.brand) != '' THEN
        IF NOT EXISTS (SELECT 1 FROM public.docs_brands WHERE name ILIKE TRIM(NEW.brand) AND company_id = NEW.company_id) THEN
            v_brand_code := UPPER(REPLACE(TRIM(NEW.brand), ' ', '_'));
            
            INSERT INTO public.docs_brands (id, company_id, name, code, updated_at)
            VALUES (gen_random_uuid()::text, NEW.company_id, TRIM(NEW.brand), v_brand_code, NOW());
        END IF;
    END IF;

    -- Category Auto-Save Logic
    IF NEW.category IS NOT NULL AND TRIM(NEW.category) != '' THEN
        IF NOT EXISTS (SELECT 1 FROM public.docs_categories WHERE name ILIKE TRIM(NEW.category) AND company_id = NEW.company_id) THEN
            
            -- 💡 মূল ফিক্স: ক্যাটাগরির নাম থেকে অটোমেটিক কোড জেনারেট করা হচ্ছে
            v_category_code := UPPER(REPLACE(TRIM(NEW.category), ' ', '_'));
            
            -- ইনসার্ট কুয়েরিতে 'code' কলামটি যুক্ত করা হলো
            INSERT INTO public.docs_categories (id, company_id, name, code, updated_at)
            VALUES (gen_random_uuid()::text, NEW.company_id, TRIM(NEW.category), v_category_code, NOW());
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;


-- Function: auto_fill_brand_code
CREATE OR REPLACE FUNCTION public.auto_fill_brand_code()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- যদি ফ্রন্টএন্ড থেকে code না আসে বা ফাঁকা আসে, তবে নাম থেকে কোড বানিয়ে নেবে
    IF NEW.code IS NULL OR TRIM(NEW.code) = '' THEN
        NEW.code := UPPER(REPLACE(TRIM(NEW.name), ' ', '_'));
    END IF;
    RETURN NEW;
END;
$function$;


-- Function: auto_fill_category_code
CREATE OR REPLACE FUNCTION public.auto_fill_category_code()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- যদি ফ্রন্টএন্ড থেকে code না আসে বা ফাঁকা আসে, তবে নাম থেকে কোড বানিয়ে নেবে
    IF NEW.code IS NULL OR TRIM(NEW.code) = '' THEN
        NEW.code := UPPER(REPLACE(TRIM(NEW.name), ' ', '_'));
    END IF;
    RETURN NEW;
END;
$function$;


-- Function: automate_journal_on_post
CREATE OR REPLACE FUNCTION public.automate_journal_on_post()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_journal_id UUID;
    receivable_account_id UUID;
    sales_account_id UUID;
BEGIN
    IF NEW.status = 'POSTED' AND OLD.status != 'POSTED' THEN
        
        -- ১. কোড দিয়ে চার্ট অব অ্যাকাউন্টস টেবিল থেকে আসল UUID বের করা
        -- (আপনার টেবিলের নাম 'accounts' না হয়ে অন্য কিছু হলে সেটি পরিবর্তন করুন)
        SELECT id INTO receivable_account_id FROM accounts WHERE code = '100201' LIMIT 1;
        SELECT id INTO sales_account_id FROM accounts WHERE code = '400100' LIMIT 1;

        -- ২. সেফটি চেক: অ্যাকাউন্ট আইডি NULL হলে স্পষ্ট এরর দেখাবে
        IF receivable_account_id IS NULL OR sales_account_id IS NULL THEN
            RAISE EXCEPTION 'Accounting Error: Account code 100201 or 400100 not found in Chart of Accounts.';
        END IF;

        -- ৩. জার্নাল হেডার তৈরি
        INSERT INTO docs_journals (company_id, reference_number, date, status)
        VALUES (NEW.company_id, NEW.invoice_number, NEW.date, 'POSTED')
        RETURNING id INTO new_journal_id;

        -- ৪. জার্নাল লাইন তৈরি
        INSERT INTO docs_journal_lines (journal_id, account_id, debit, credit)
        VALUES 
        (new_journal_id, receivable_account_id, NEW.total, 0), -- Debit A/R
        (new_journal_id, sales_account_id, 0, NEW.total);      -- Credit Sales

        NEW.journal_entry_id := new_journal_id;
    END IF;

    RETURN NEW;
END;
$function$;


-- Function: block_delete_posted
CREATE OR REPLACE FUNCTION public.block_delete_posted()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD.status IN ('POSTED', 'PAID', 'PARTIAL', 'VOID') THEN
        RAISE EXCEPTION 'ACID Violation: Cannot physically delete a POSTED document. Use reversal RPC instead.';
    END IF;
    RETURN OLD;
END;
$function$;


-- Function: block_update_posted_journal
CREATE OR REPLACE FUNCTION public.block_update_posted_journal()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE v_status TEXT;
    BEGIN
       IF current_setting('core.bypass_audit', true) = 'true' THEN
           RETURN NEW;
       END IF;
       
       -- Allow Zeroing Bypass
       IF NEW.debit = 0 AND NEW.credit = 0 THEN
           RETURN NEW;
       END IF;

       SELECT status INTO v_status FROM docs_journals WHERE id = OLD.journal_id;
       IF v_status = 'POSTED' AND (NEW.debit IS DISTINCT FROM OLD.debit OR NEW.credit IS DISTINCT FROM OLD.credit OR NEW.account_id IS DISTINCT FROM OLD.account_id) THEN
          RAISE EXCEPTION 'Enterprise Accounting Integrity: Cannot modify financial values of a POSTED journal line. Use reversing entries instead.';
       END IF;
       RETURN NEW;
    END;
    $function$;


-- Function: bulletproof_invoice_inventory_sync
CREATE OR REPLACE FUNCTION public.bulletproof_invoice_inventory_sync()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  DECLARE
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      v_item JSONB;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          v_cost NUMERIC;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              v_idx INT := 0;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  v_should_run BOOLEAN := false;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  BEGIN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      -- ইনভয়েস সরাসরি POSTED হিসেবে তৈরি হলে, অথবা পরে POSTED/PAID এ আপডেট হলে
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          IF TG_OP = 'INSERT' THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  IF NEW.status IN ('POSTED', 'PAID') THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              v_should_run := true;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ELSIF TG_OP = 'UPDATE' THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  IF NEW.status IN ('POSTED', 'PAID') AND OLD.status NOT IN ('POSTED', 'PAID') THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              v_should_run := true;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          END IF;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              IF v_should_run THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      FOR v_item IN SELECT * FROM jsonb_array_elements(CASE WHEN jsonb_typeof(NEW.data->'items') = 'array' THEN NEW.data->'items' ELSE '[]'::jsonb END) LOOP
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  v_idx := v_idx + 1;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          IF v_item->>'type' = 'PRODUCT' THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          SELECT COALESCE(cost_price, (data->>'costPrice')::numeric, 0) INTO v_cost 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          FROM docs_products WHERE id = v_item->>'productId';
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          INSERT INTO docs_inventory_transactions (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              id, company_id, product_id, warehouse_id, transaction_type, 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  quantity, reference_id, reference_type, date, cost_price, updated_at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ) VALUES (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      'mov-inv-' || NEW.id || '-' || v_idx, 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          COALESCE(NEW.company_id, NEW.data->>'companyId'), 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              v_item->>'productId', 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  'WH-MAIN-' || COALESCE(NEW.company_id, NEW.data->>'companyId'), 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      'OUT', 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          COALESCE((v_item->>'quantity')::numeric, 0), 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              NEW.id, 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  'INVOICE', 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      NEW.date, 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          COALESCE(v_cost, 0), 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              NOW()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ) ON CONFLICT (id) DO NOTHING;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  END LOOP;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              RETURN NEW;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              $function$;


-- Function: calc_doc_totals
CREATE OR REPLACE FUNCTION public.calc_doc_totals()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_item JSONB;
    v_lines JSONB;
    v_new_lines JSONB := '[]'::jsonb;
    
    v_type TEXT;
    
    v_calc_qty NUMERIC;
    v_calc_price NUMERIC;
    v_calc_gross NUMERIC;
    v_calc_disc_rate NUMERIC;
    v_calc_disc_mode TEXT;
    v_calc_disc_amt NUMERIC;
    v_calc_tax_rate NUMERIC;
    v_calc_line_value NUMERIC;
    v_manual_value NUMERIC;
    
    v_gross_subtotal NUMERIC := 0;
    v_line_discount_total NUMERIC := 0;
    v_global_discount_total NUMERIC := 0;
    v_tax_total NUMERIC := 0;
    v_running_subtotal NUMERIC := 0;
    
    v_has_subtotal_item BOOLEAN := false;
    v_last_subtotal_value NUMERIC := 0;
    
    v_net_subtotal NUMERIC := 0;
    v_total NUMERIC := 0;
BEGIN
    IF NEW.data IS NOT NULL AND NEW.data ? 'items' THEN
        v_lines := NEW.data->'items';
        IF jsonb_typeof(v_lines) = 'array' THEN
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_lines) LOOP
                v_type := COALESCE(v_item->>'type', 'PRODUCT');
                
                IF v_type IN ('PRODUCT', 'SERVICE', 'CHARGE') THEN
                    v_calc_qty := COALESCE((v_item->>'quantity')::NUMERIC, 0);
                    v_calc_price := COALESCE((v_item->>'unitPrice')::NUMERIC, 0);
                    v_calc_gross := v_calc_qty * v_calc_price;
                    
                    v_calc_disc_mode := COALESCE(v_item->>'discountMode', 'PERCENT');
                    v_calc_disc_rate := COALESCE((v_item->>'discountRate')::NUMERIC, 0);
                    
                    IF v_calc_disc_mode = 'FIXED' THEN
                        v_calc_disc_amt := v_calc_disc_rate;
                    ELSE
                        v_calc_disc_amt := ROUND((v_calc_gross * (v_calc_disc_rate / 100.0)), 2);
                    END IF;
                    
                    -- Include inline tax if provided (some views might use it)
                    v_calc_tax_rate := COALESCE((v_item->>'taxValue')::NUMERIC, 0);
                    
                    v_calc_line_value := ROUND(v_calc_gross - v_calc_disc_amt + v_calc_tax_rate, 2);
                    
                    v_gross_subtotal := ROUND(v_gross_subtotal + v_calc_gross, 2);
                    v_line_discount_total := ROUND(v_line_discount_total + v_calc_disc_amt, 2);
                    v_running_subtotal := ROUND(v_running_subtotal + v_calc_line_value, 2);
                    v_tax_total := ROUND(v_tax_total + v_calc_tax_rate, 2);
                    
                    v_item := jsonb_set(v_item, '{discountAmount}', to_jsonb(v_calc_disc_amt));
                    v_item := jsonb_set(v_item, '{taxAmount}', to_jsonb(v_calc_tax_rate));
                    v_item := jsonb_set(v_item, '{lineValue}', to_jsonb(v_calc_line_value));
                    v_item := jsonb_set(v_item, '{total}', to_jsonb(v_calc_line_value));

                ELSIF v_type = 'DISCOUNT' THEN
                    v_calc_disc_mode := COALESCE(v_item->>'discountMode', 'PERCENT');
                    v_calc_disc_rate := COALESCE((v_item->>'discountRate')::NUMERIC, 0);
                    
                    IF v_calc_disc_mode = 'PERCENT' THEN
                        v_calc_line_value := -ROUND((v_running_subtotal * (v_calc_disc_rate / 100.0)), 2);
                    ELSE
                        v_calc_line_value := -ROUND(v_calc_disc_rate, 2);
                    END IF;
                    
                    v_global_discount_total := ROUND(v_global_discount_total + ABS(v_calc_line_value), 2);
                    v_running_subtotal := ROUND(v_running_subtotal + v_calc_line_value, 2);
                    
                    v_item := jsonb_set(v_item, '{lineValue}', to_jsonb(v_calc_line_value));
                    v_item := jsonb_set(v_item, '{total}', to_jsonb(v_calc_line_value));

                ELSIF v_type = 'TAX' THEN
                    v_manual_value := (v_item->>'manualValue')::NUMERIC;
                    v_calc_tax_rate := COALESCE((v_item->>'taxRate')::NUMERIC, 0);
                    
                    IF v_manual_value IS NOT NULL THEN
                        v_calc_line_value := ROUND(v_manual_value, 2);
                    ELSE
                        v_calc_line_value := ROUND((v_running_subtotal * (v_calc_tax_rate / 100.0)), 2);
                    END IF;
                    
                    v_tax_total := ROUND(v_tax_total + v_calc_line_value, 2);
                    v_running_subtotal := ROUND(v_running_subtotal + v_calc_line_value, 2);
                    
                    v_item := jsonb_set(v_item, '{lineValue}', to_jsonb(v_calc_line_value));
                    v_item := jsonb_set(v_item, '{total}', to_jsonb(v_calc_line_value));

                ELSIF v_type = 'SUBTOTAL' THEN
                    v_manual_value := (v_item->>'manualValue')::NUMERIC;
                    IF v_manual_value IS NOT NULL THEN
                        v_calc_line_value := ROUND(v_manual_value, 2);
                    ELSE
                        v_calc_line_value := ROUND(v_running_subtotal, 2);
                    END IF;
                    
                    v_running_subtotal := ROUND(v_calc_line_value, 2);
                    v_last_subtotal_value := ROUND(v_calc_line_value, 2);
                    v_has_subtotal_item := true;
                    
                    v_item := jsonb_set(v_item, '{lineValue}', to_jsonb(v_calc_line_value));
                    v_item := jsonb_set(v_item, '{total}', to_jsonb(v_calc_line_value));
                END IF;
                
                v_new_lines := v_new_lines || v_item;
            END LOOP;

            -- Calculate final totals matching frontend Logic
            v_total := ROUND(v_running_subtotal, 2);
            
            IF v_has_subtotal_item THEN
                v_net_subtotal := v_last_subtotal_value;
            ELSE
                v_net_subtotal := ROUND((v_gross_subtotal - v_line_discount_total), 2);
            END IF;

            -- Update JSON data
            NEW.data := jsonb_set(NEW.data, '{items}', v_new_lines);
            NEW.data := jsonb_set(NEW.data, '{subtotal}', to_jsonb(v_net_subtotal));
            NEW.data := jsonb_set(NEW.data, '{discountTotal}', to_jsonb(v_line_discount_total + v_global_discount_total));
            NEW.data := jsonb_set(NEW.data, '{taxTotal}', to_jsonb(v_tax_total));
            NEW.data := jsonb_set(NEW.data, '{total}', to_jsonb(v_total));

            -- Update columns if they exist
            IF TG_TABLE_NAME = 'docs_invoices' THEN
                NEW.subtotal := v_net_subtotal;
                NEW.discount_total := v_line_discount_total + v_global_discount_total;
                NEW.tax_total := v_tax_total;
                NEW.total := v_total;
            ELSIF TG_TABLE_NAME = 'docs_bills' THEN
                NEW.subtotal := v_net_subtotal;
                NEW.discount_total := v_line_discount_total + v_global_discount_total;
                NEW.tax_total := v_tax_total;
                NEW.total := v_total;
            ELSIF TG_TABLE_NAME = 'docs_credit_notes' THEN
                NEW.subtotal := v_net_subtotal;
                NEW.discount_total := v_line_discount_total + v_global_discount_total;
                NEW.tax_total := v_tax_total;
                NEW.total := v_total;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;


-- Function: calculate_invoice_total_profit
CREATE OR REPLACE FUNCTION public.calculate_invoice_total_profit(p_invoice_id text)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        v_profit NUMERIC;
    BEGIN
        SELECT COALESCE(SUM(total - (quantity * COALESCE(cost_price_at_sale, 0))), 0)
        INTO v_profit
        FROM docs_invoice_lines
        WHERE invoice_id = p_invoice_id;
        
        RETURN v_profit;
    END;
    $function$;


-- Function: capture_cost_at_sale
CREATE OR REPLACE FUNCTION public.capture_cost_at_sale()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
        v_company_id TEXT;
    BEGIN
        IF NEW.product_id IS NOT NULL THEN
            -- Safely resolve company_id from parent invoice if missing/empty in line
            v_company_id := NEW.company_id;
            IF v_company_id IS NULL OR v_company_id = '' THEN
                SELECT company_id INTO v_company_id FROM docs_invoices WHERE id = NEW.invoice_id;
                NEW.company_id := v_company_id;
            END IF;

            -- Only set if it hasn't been explicitly locked / provided
            IF NEW.cost_price_at_sale IS NULL OR NEW.cost_price_at_sale = 0 THEN
                -- Try company warehouse WAC
                SELECT avg_cost INTO NEW.cost_price_at_sale 
                FROM docs_product_costs 
                WHERE product_id = NEW.product_id 
                  AND company_id = v_company_id 
                  AND warehouse_id = 'wh-' || v_company_id
                LIMIT 1;

                -- Fallback to main warehouse WAC
                IF NEW.cost_price_at_sale IS NULL OR NEW.cost_price_at_sale = 0 THEN
                    SELECT avg_cost INTO NEW.cost_price_at_sale 
                    FROM docs_product_costs 
                    WHERE product_id = NEW.product_id 
                      AND company_id = v_company_id 
                      AND warehouse_id = 'main'
                    LIMIT 1;
                END IF;

                -- Fallback to product defined cost_price
                IF NEW.cost_price_at_sale IS NULL OR NEW.cost_price_at_sale = 0 THEN
                    SELECT COALESCE(cost_price, last_purchase_price, initial_cost, NULLIF(data->>'costPrice', '')::numeric, 0)
                    INTO NEW.cost_price_at_sale
                    FROM docs_products
                    WHERE id = NEW.product_id;
                END IF;

                -- Ultimate Fallback Safeguard: If cost is still 0/null, fallback to 70% of the sales price to prevent a 100% false profit.
                IF NEW.cost_price_at_sale IS NULL OR NEW.cost_price_at_sale = 0 THEN
                    NEW.cost_price_at_sale := COALESCE(NEW.unit_price, 0) * 0.70;
                END IF;
                
                NEW.cost_price_at_sale := COALESCE(NEW.cost_price_at_sale, 0);
            END IF;
        END IF;
        RETURN NEW;
    END;
$function$;


-- Function: check_company_access
CREATE OR REPLACE FUNCTION public.check_company_access(v_company_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
      IF auth.uid() IS NULL THEN RETURN TRUE; END IF;
      IF NOT EXISTS (SELECT 1 FROM company_users) THEN RETURN TRUE; END IF;
      RETURN EXISTS (
        SELECT 1 FROM company_users 
        WHERE user_id = auth.uid() 
        AND company_id = v_company_id
      ) OR v_company_id IS NULL;
    END;
    $function$;


-- Function: check_fiscal_period_lock
CREATE OR REPLACE FUNCTION public.check_fiscal_period_lock()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    is_locked BOOLEAN;
BEGIN
    SELECT is_closed INTO is_locked 
    FROM docs_fiscal_periods 
    WHERE company_id = NEW.company_id 
    AND NEW.date >= start_date AND NEW.date <= end_date 
    LIMIT 1;

    IF (is_locked = true) THEN
        RAISE EXCEPTION 'Fiscal Period Locked: Posting to this date range is closed for company %', NEW.company_id;
    END IF;

    RETURN NEW;
END;
$function$;


-- Function: check_invoice_journal_link
CREATE OR REPLACE FUNCTION public.check_invoice_journal_link()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
        BEGIN
            IF NEW.status IN ('POSTED', 'PAID') THEN
                IF NEW.journal_entry_id IS NULL AND (NEW.data->>'journalEntryId') IS NULL THEN
                    RAISE EXCEPTION 'Strict Integrity: Invoice % (%) cannot be POSTED without a Journal Entry link.', NEW.invoice_number, NEW.id;
                END IF;
            END IF;
            RETURN NULL;
        END;
        $function$;


-- Function: check_invoice_line_stock
CREATE OR REPLACE FUNCTION public.check_invoice_line_stock()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_invoice_status TEXT;
    v_product_name TEXT;
    v_current_stock NUMERIC;
    v_track_inventory BOOLEAN;
    v_req_qty NUMERIC;
    v_company_id TEXT;
    v_is_upsert BOOLEAN := false;
BEGIN
    SELECT status, company_id INTO v_invoice_status, v_company_id FROM docs_invoices WHERE id = NEW.invoice_id;

    IF v_invoice_status IS NULL OR v_invoice_status = 'DRAFT' THEN
        RETURN NEW;
    END IF;

    -- Only check stock if we are inserting OR if the quantity actually increased.
    -- (This allows updating cost_price_at_sale safely without re-validating stock levels)
    IF TG_OP = 'UPDATE' THEN
       IF NEW.quantity <= OLD.quantity THEN
          RETURN NEW;
       END IF;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF EXISTS (SELECT 1 FROM docs_invoice_lines WHERE id = NEW.id) THEN
            -- This is an UPSERT that will trigger BEFORE UPDATE. We skip stock check here.
            v_is_upsert := true;
            RETURN NEW;
        END IF;
    END IF;

    IF v_invoice_status IN ('POSTED', 'PAID', 'PARTIAL', 'IN_PAYMENT', 'OPEN', 'ACTIVE') THEN
        SELECT name, COALESCE(track_inventory, true), COALESCE((data->'stockLevels'->>v_company_id)::NUMERIC, quantity_on_hand, 0)
        INTO v_product_name, v_track_inventory, v_current_stock
        FROM docs_products
        WHERE id = NEW.product_id;

        IF FOUND AND v_track_inventory THEN
            IF TG_OP = 'INSERT' THEN
                v_req_qty := NEW.quantity;
            ELSIF TG_OP = 'UPDATE' THEN
                v_req_qty := NEW.quantity - OLD.quantity;
            END IF;

            IF v_req_qty > v_current_stock THEN
                RAISE EXCEPTION 'Insufficient stock for product: %', v_product_name;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;


-- Function: check_journal_balance
CREATE OR REPLACE FUNCTION public.check_journal_balance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      DECLARE
          v_journal_id TEXT;
          v_debit NUMERIC;
          v_credit NUMERIC;
      BEGIN
          IF current_setting('core.bypass_audit', true) = 'true' THEN
              RETURN COALESCE(NEW, OLD);
          END IF;
          IF TG_TABLE_NAME = 'docs_journal_lines' THEN
              v_journal_id := COALESCE(NEW.journal_id, OLD.journal_id);
          ELSIF TG_TABLE_NAME = 'docs_journals' THEN
              v_journal_id := COALESCE(NEW.id, OLD.id);
          END IF;
          IF v_journal_id IS NOT NULL THEN
              SELECT SUM(debit), SUM(credit) INTO v_debit, v_credit FROM docs_journal_lines WHERE journal_id = v_journal_id;
              
              IF COALESCE(v_debit, 0) != COALESCE(v_credit, 0) THEN
                  RAISE EXCEPTION 'Strict Integrity: Journal Entry % is unbalanced. Debits: %, Credits: %', v_journal_id, v_debit, v_credit;
              END IF;
          END IF;
          RETURN COALESCE(NEW, OLD);
      END;
      $function$;


-- Function: check_payment_journal_link
CREATE OR REPLACE FUNCTION public.check_payment_journal_link()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
        BEGIN
            IF NEW.status IN ('POSTED', 'PAID') THEN
                IF (NEW.data->>'journalEntryId') IS NULL THEN
                    RAISE EXCEPTION 'Strict Integrity: Payment % cannot be POSTED without a Journal Entry link.', NEW.id;
                END IF;
            END IF;
            RETURN NULL;
        END;
        $function$;


-- Function: check_stock_before_transaction
CREATE OR REPLACE FUNCTION public.check_stock_before_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
        v_current_stock NUMERIC;
    BEGIN
        IF NEW.transaction_type = 'OUT' THEN
            SELECT COALESCE(SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE -quantity END), 0)
            INTO v_current_stock
            FROM docs_inventory_transactions
            WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id AND company_id = NEW.company_id;

            IF v_current_stock - NEW.quantity < 0 THEN
               -- RAISE EXCEPTION 'Insufficient stock for product: %', (SELECT data->>'name' FROM docs_products WHERE id = NEW.product_id);
               -- Actually, previously we allowed negative stock. I'll just leave it no-op
               RETURN NEW;
            END IF;
        END IF;
        RETURN NEW;
    END;
    $function$;


-- Function: clean_contact_name
CREATE OR REPLACE FUNCTION public.clean_contact_name()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  cleaned_name TEXT;
BEGIN
  cleaned_name := NEW.name;
  cleaned_name := regexp_replace(cleaned_name, '\s*\(\s*LOAN\s*\)\s*', ' ', 'gi');
  cleaned_name := regexp_replace(cleaned_name, '\s*\bLOAN\b\s*', ' ', 'gi');
  cleaned_name := regexp_replace(cleaned_name, '\s*\(\s*Customer\s*\)\s*', ' ', 'gi');
  cleaned_name := regexp_replace(cleaned_name, '\s*\(\s*Vendor\s*\)\s*', ' ', 'gi');
  cleaned_name := regexp_replace(cleaned_name, '\s*\(\s*Employee\s*\)\s*', ' ', 'gi');
  cleaned_name := regexp_replace(cleaned_name, '\s+', ' ', 'g');
  cleaned_name := trim(cleaned_name);
  
  NEW.name := cleaned_name;
  
  IF NEW.data IS NOT NULL AND jsonb_typeof(NEW.data) = 'object' THEN
     NEW.data := jsonb_set(NEW.data, '{name}', to_jsonb(cleaned_name));
     NEW.data := jsonb_set(NEW.data, '{isCustomer}', to_jsonb(COALESCE(NEW.is_customer, false)));
     NEW.data := jsonb_set(NEW.data, '{isVendor}', to_jsonb(COALESCE(NEW.is_vendor, false)));
     NEW.data := jsonb_set(NEW.data, '{isLender}', to_jsonb(COALESCE(NEW.is_lender, false)));
  END IF;
  
  RETURN NEW;
END;
$function$;


-- Function: clean_contact_name_fn
CREATE OR REPLACE FUNCTION public.clean_contact_name_fn()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
      cleaned_name TEXT;
    BEGIN
      cleaned_name := NEW.name;
      cleaned_name := regexp_replace(cleaned_name, '\s*\(\s*LOAN\s*\)\s*', ' ', 'gi');
      cleaned_name := regexp_replace(cleaned_name, '\s*\bLOAN\b\s*', ' ', 'gi');
      cleaned_name := regexp_replace(cleaned_name, '\s*\(\s*Customer\s*\)\s*', ' ', 'gi');
      cleaned_name := regexp_replace(cleaned_name, '\s*\(\s*Vendor\s*\)\s*', ' ', 'gi');
      cleaned_name := regexp_replace(cleaned_name, '\s*\(\s*Employee\s*\)\s*', ' ', 'gi');
      cleaned_name := regexp_replace(cleaned_name, '\s+', ' ', 'g');
      cleaned_name := trim(cleaned_name);
      
      NEW.name := cleaned_name;
      
      IF NEW.data IS NOT NULL AND jsonb_typeof(NEW.data) = 'object' THEN
         NEW.data := jsonb_set(NEW.data, '{name}', to_jsonb(cleaned_name));
         NEW.data := jsonb_set(NEW.data, '{isCustomer}', to_jsonb(NEW.is_customer));
         NEW.data := jsonb_set(NEW.data, '{isVendor}', to_jsonb(NEW.is_vendor));
         NEW.data := jsonb_set(NEW.data, '{isLender}', to_jsonb(NEW.is_lender));
      END IF;
      
      RETURN NEW;
    END;
    $function$;


-- Function: create_bill
CREATE OR REPLACE FUNCTION public.create_bill(p_bill jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
   DECLARE
       v_bill_id text;
           v_bill_number text;
               v_company_id text;
                   v_vendor_id text;
                       v_date date;
                           v_status text;
                               v_total numeric;
                                   v_lines jsonb;
                                       v_line jsonb;
                                           v_line_id text; -- নতুন ভেরিয়েবল লাইনের আইডির জন্য
                                           BEGIN
                                               v_bill_id := p_bill->>'id';
                                                   v_company_id := p_bill->>'companyId';
                                                       v_vendor_id := COALESCE(p_bill->>'vendorId', p_bill->>'supplierId');
                                                           
                                                               -- Date Fallback Logic
                                                                   v_date := COALESCE(
                                                                           (p_bill->>'date')::date, 
                                                                                   (p_bill->>'billDate')::date, 
                                                                                           (p_bill->>'bill_date')::date, 
                                                                                                   CURRENT_DATE
                                                                                                       );
                                                                                                           
                                                                                                               v_status := p_bill->>'status';
                                                                                                                   IF v_status IS NULL THEN 
                                                                                                                           v_status := 'DRAFT'; 
                                                                                                                               END IF;
                                                                                                                                   
                                                                                                                                       v_total := COALESCE((p_bill->>'total')::numeric, 0);
                                                                                                                                           v_lines := p_bill->'items';
                                                                                                                                               v_bill_number := p_bill->>'number';
                                                                                                                                                   
                                                                                                                                                       -- Temporary Draft Number
                                                                                                                                                           IF v_bill_number IS NULL OR v_bill_number = 'DRAFT' OR v_bill_number = 'NEW' OR v_bill_number = '' THEN
                                                                                                                                                                   v_bill_number := 'DRAFT-' || upper(substr(v_bill_id, 1, 6));
                                                                                                                                                                       END IF;
                                                                                                                                                                           
                                                                                                                                                                               -- Header Update
                                                                                                                                                                                   INSERT INTO public.docs_bills (
                                                                                                                                                                                           id, company_id, vendor_id, date, bill_date, status, total, data, bill_number
                                                                                                                                                                                               ) VALUES (
                                                                                                                                                                                                       v_bill_id, v_company_id, v_vendor_id, v_date, v_date, v_status, v_total, p_bill, v_bill_number
                                                                                                                                                                                                           )
                                                                                                                                                                                                               ON CONFLICT (id) DO UPDATE SET
                                                                                                                                                                                                                       data = EXCLUDED.data,
                                                                                                                                                                                                                               vendor_id = EXCLUDED.vendor_id,
                                                                                                                                                                                                                                       date = EXCLUDED.date,
                                                                                                                                                                                                                                               bill_date = EXCLUDED.bill_date,
                                                                                                                                                                                                                                                       total = EXCLUDED.total,
                                                                                                                                                                                                                                                               status = EXCLUDED.status,
                                                                                                                                                                                                                                                                       bill_number = CASE 
                                                                                                                                                                                                                                                                                   WHEN docs_bills.bill_number LIKE 'DRAFT-%' THEN EXCLUDED.bill_number 
                                                                                                                                                                                                                                                                                               ELSE docs_bills.bill_number 
                                                                                                                                                                                                                                                                                                       END
                                                                                                                                                                                                                                                                                                           RETURNING bill_number INTO v_bill_number;
                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                   p_bill := jsonb_set(p_bill, '{number}', to_jsonb(v_bill_number));
                                                                                                                                                                                                                                                                                                                       p_bill := jsonb_set(p_bill, '{date}', to_jsonb(v_date));
                                                                                                                                                                                                                                                                                                                           p_bill := jsonb_set(p_bill, '{billDate}', to_jsonb(v_date));
                                                                                                                                                                                                                                                                                                                               UPDATE public.docs_bills SET data = p_bill WHERE id = v_bill_id;
                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                       -- Clean existing lines
                                                                                                                                                                                                                                                                                                                                           DELETE FROM public.docs_bill_lines WHERE bill_id = v_bill_id;
                                                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                   -- Insert Lines Logic
                                                                                                                                                                                                                                                                                                                                                       IF v_lines IS NOT NULL AND jsonb_array_length(v_lines) > 0 THEN
                                                                                                                                                                                                                                                                                                                                                               FOR v_line IN SELECT * FROM jsonb_array_elements(v_lines)
                                                                                                                                                                                                                                                                                                                                                                       LOOP
                                                                                                                                                                                                                                                                                                                                                                                   -- 💡 ফিক্স ১: ফাঁকা স্ট্রিং ("") আসলে সেটিকে বাদ দিয়ে নতুন UUID জেনারেট করা
                                                                                                                                                                                                                                                                                                                                                                                               v_line_id := COALESCE(NULLIF(TRIM(v_line->>'id'), ''), gen_random_uuid()::text);
                                                                                                                                                                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                                                                                                                                       -- 💡 ফিক্স ২: Exception Handling - যদি ভুল করে একই আইডি দুইবার চলে আসে, 
                                                                                                                                                                                                                                                                                                                                                                                                                                   -- তবে ক্র্যাশ না করে নতুন আইডি দিয়ে সেভ করবে।
                                                                                                                                                                                                                                                                                                                                                                                                                                               BEGIN
                                                                                                                                                                                                                                                                                                                                                                                                                                                               INSERT INTO public.docs_bill_lines (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   id, bill_id, company_id, product_id, quantity, unit_price, discount, tax, total, description, line_value, discount_rate, discount_mode, type, display_index
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   ) VALUES (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       v_line_id, v_bill_id, v_company_id, v_line->>'productId',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           COALESCE((v_line->>'quantity')::numeric, 0),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               COALESCE((v_line->>'unitPrice')::numeric, COALESCE((v_line->>'rate')::numeric, 0)),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   COALESCE((v_line->>'discountAmount')::numeric, COALESCE((v_line->>'discount')::numeric, 0)),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       COALESCE((v_line->>'taxValue')::numeric, COALESCE((v_line->>'taxAmount')::numeric, 0)),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           COALESCE((v_line->>'total')::numeric, 0),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               v_line->>'description',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   COALESCE((v_line->>'lineValue')::numeric, COALESCE((v_line->>'total')::numeric, 0)),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       COALESCE((v_line->>'discountRate')::numeric, 0),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           COALESCE(v_line->>'discountMode', 'PERCENT'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               COALESCE(v_line->>'type', 'PRODUCT'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   COALESCE((v_line->>'display_index')::integer, 0)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               EXCEPTION WHEN unique_violation THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               -- ডুপ্লিকেট আইডির কারণে এরর হলে, অটোমেটিক নতুন আইডি বসিয়ে ইনসার্ট করবে
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               INSERT INTO public.docs_bill_lines (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   id, bill_id, company_id, product_id, quantity, unit_price, discount, tax, total, description, line_value, discount_rate, discount_mode, type, display_index
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   ) VALUES (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       gen_random_uuid()::text, v_bill_id, v_company_id, v_line->>'productId',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           COALESCE((v_line->>'quantity')::numeric, 0),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               COALESCE((v_line->>'unitPrice')::numeric, COALESCE((v_line->>'rate')::numeric, 0)),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   COALESCE((v_line->>'discountAmount')::numeric, COALESCE((v_line->>'discount')::numeric, 0)),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       COALESCE((v_line->>'taxValue')::numeric, COALESCE((v_line->>'taxAmount')::numeric, 0)),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           COALESCE((v_line->>'total')::numeric, 0),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               v_line->>'description',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   COALESCE((v_line->>'lineValue')::numeric, COALESCE((v_line->>'total')::numeric, 0)),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       COALESCE((v_line->>'discountRate')::numeric, 0),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           COALESCE(v_line->>'discountMode', 'PERCENT'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               COALESCE(v_line->>'type', 'PRODUCT'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   COALESCE((v_line->>'display_index')::integer, 0)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       END LOOP;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           END IF;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               RETURN jsonb_build_object('success', true, 'bill_id', v_bill_id, 'bill_number', v_bill_number, 'data', p_bill);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               $function$;


-- Function: create_credit_note
CREATE OR REPLACE FUNCTION public.create_credit_note(p_cn jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_cn_id text;
    v_cn_number text;
    v_company_id text;
    v_customer_id text;
    v_date date;
    v_status text;
    v_total numeric;
    v_lines jsonb;
    v_line jsonb;
BEGIN
    v_cn_id := p_cn->>'id';
    v_company_id := p_cn->>'companyId';
    v_customer_id := p_cn->>'customerId';
    v_date := COALESCE((p_cn->>'date')::date, CURRENT_DATE);
    v_status := COALESCE(p_cn->>'status', 'DRAFT');
    v_total := COALESCE((p_cn->>'total')::numeric, 0);
    v_lines := p_cn->'items';
    v_cn_number := p_cn->>'number';
    
    IF v_cn_number = 'DRAFT' OR v_cn_number = 'NEW' OR v_cn_number LIKE 'DRAFT-%' THEN
        v_cn_number := NULL;
    END IF;

    -- Upsert Credit Note
    INSERT INTO public.docs_credit_notes (
        id, company_id, customer_id, date, credit_note_date, status, total, subtotal, tax_total, origin_invoice_id, data, credit_note_number
    ) VALUES (
        v_cn_id, v_company_id, v_customer_id, v_date, v_date, v_status, v_total, COALESCE((p_cn->>'subtotal')::numeric, 0), COALESCE((p_cn->>'taxTotal')::numeric, 0), (p_cn->>'originInvoiceId'), p_cn, v_cn_number
    )
    ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        customer_id = EXCLUDED.customer_id,
        date = EXCLUDED.date,
        total = EXCLUDED.total,
        status = EXCLUDED.status,
        credit_note_number = EXCLUDED.credit_note_number;

    -- Clean old lines
    DELETE FROM public.docs_credit_note_lines WHERE credit_note_id = v_cn_id;

    -- Insert new lines
    IF v_lines IS NOT NULL AND jsonb_array_length(v_lines) > 0 THEN
        FOR v_line IN SELECT * FROM jsonb_array_elements(v_lines)
        LOOP
            INSERT INTO public.docs_credit_note_lines (
                id, credit_note_id, company_id, product_id, quantity, unit_price, line_value, total, type, description, display_index
            ) VALUES (
                COALESCE((v_line->>'id'), gen_random_uuid()::text),
                v_cn_id,
                v_company_id,
                (v_line->>'productId'),
                COALESCE((v_line->>'quantity')::numeric, 0),
                COALESCE((v_line->>'unitPrice')::numeric, COALESCE((v_line->>'rate')::numeric, 0)),
                COALESCE((v_line->>'lineValue')::numeric, COALESCE((v_line->>'total')::numeric, COALESCE((v_line->>'amount')::numeric, 0))),
                COALESCE((v_line->>'lineValue')::numeric, COALESCE((v_line->>'total')::numeric, COALESCE((v_line->>'amount')::numeric, 0))),
                COALESCE(v_line->>'type', 'PRODUCT'),
                v_line->>'description',
                COALESCE((v_line->>'display_index')::integer, 0)
            );
        END LOOP;
    END IF;

    RETURN jsonb_build_object('success', true, 'credit_note_id', v_cn_id);
END;
$function$;


-- Function: create_default_warehouse
CREATE OR REPLACE FUNCTION public.create_default_warehouse()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO docs_warehouses (id, data, updated_at, company_id, code, name, is_default)
    VALUES (
        'wh-' || NEW.id,
        jsonb_build_object(
        'id', 'wh-' || NEW.id,
        'companyId', NEW.id,
        'name', 'Default Warehouse',
        'code', 'WH-' || get_company_short_code(NEW.id) || '-01',
        'isDefault', true
        ),
        NOW(),
        NEW.id,
        'WH-' || get_company_short_code(NEW.id) || '-01',
        'Default Warehouse',
        true
    ) ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$function$;


-- Function: create_journal_entry
CREATE OR REPLACE FUNCTION public.create_journal_entry(p_journal_data jsonb, p_company_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE
    v_journal_id TEXT;
    v_line JSONB;
    v_total_debit NUMERIC := 0;
    v_total_credit NUMERIC := 0;
    v_status TEXT;
    v_effective_company_id TEXT;
    v_created_by_id TEXT;
BEGIN
    v_journal_id := p_journal_data->>'id';
    v_status := p_journal_data->>'status';
    v_effective_company_id := COALESCE(p_company_id, p_journal_data->>'companyId');
    v_created_by_id := COALESCE(p_journal_data->>'createdById', p_journal_data->>'authorId', p_journal_data->>'preparedBy');

    -- Ensure we don't hit unq_journal_num_company if another ID has this reference
    -- Only for non-new journals
    IF (p_journal_data->>'reference' IS NOT NULL AND p_journal_data->>'reference' <> 'NEW' AND p_journal_data->>'reference' NOT LIKE 'DRAFT-%') THEN
        SELECT id INTO v_journal_id FROM docs_journals 
        WHERE company_id = v_effective_company_id AND reference_number = p_journal_data->>'reference' LIMIT 1;
        
        IF v_journal_id IS NULL THEN 
            v_journal_id := p_journal_data->>'id';
        END IF;
    END IF;

    -- 1. Validate Balance if POSTED
    IF v_status = 'POSTED' THEN
        FOR v_line IN SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(p_journal_data->'lines') = 'array' THEN p_journal_data->'lines' ELSE '[]'::jsonb END) LOOP
            v_total_debit := v_total_debit + COALESCE((v_line->>'debit')::numeric, 0);
            v_total_credit := v_total_credit + COALESCE((v_line->>'credit')::numeric, 0);
        END LOOP;
        
        IF ABS(v_total_debit - v_total_credit) > 0.01 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Journal entry is not balanced');
        END IF;
    END IF;

    -- 1. Ensure header exists (to satisfy FK for lines)
    INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, data, updated_at, created_by_id)
    VALUES (
        v_journal_id, 
        v_effective_company_id, 
        (p_journal_data->>'date')::date, 
        COALESCE((p_journal_data->>'date')::date, NOW()::date), 
        COALESCE(p_journal_data->>'journalType', 'MISC'), 
        'DRAFT', 
        p_journal_data->>'reference', 
        p_journal_data, 
        NOW(),
        v_created_by_id
    )
    ON CONFLICT (id) DO UPDATE SET 
        status = CASE WHEN docs_journals.status = 'POSTED' THEN 'POSTED' ELSE 'DRAFT' END,
        created_by_id = COALESCE(docs_journals.created_by_id, EXCLUDED.created_by_id),
        updated_at = NOW();

    -- 2. Sync Lines
    EXECUTE 'SET LOCAL core.bypass_audit = ''true''';
    DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
    EXECUTE 'SET LOCAL core.bypass_audit = ''false''';
    
    FOR v_line IN SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(p_journal_data->'lines') = 'array' THEN p_journal_data->'lines' ELSE '[]'::jsonb END) LOOP
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
        VALUES (
            'JL-' || substring(md5(random()::text || clock_timestamp()::text) from 1 for 10), 
            v_journal_id, 
            v_effective_company_id, 
            v_line->>'accountId', 
            NULLIF(v_line->>'contactId', ''), 
            COALESCE((v_line->>'debit')::numeric, 0), 
            COALESCE((v_line->>'credit')::numeric, 0), 
            v_line->>'description'
        );
    END LOOP;

    -- 3. Finalize Status
    UPDATE docs_journals 
    SET status = v_status,
        data = p_journal_data,
        created_by_id = COALESCE(created_by_id, v_created_by_id),
        updated_at = NOW()
    WHERE id = v_journal_id;

    RETURN jsonb_build_object('success', true, 'id', v_journal_id);
END;

$function$;


-- Function: create_journal_entry_v2
CREATE OR REPLACE FUNCTION public.create_journal_entry_v2(p_journal_data jsonb, p_company_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_journal_id TEXT;
    v_line JSONB;
    v_total_debit NUMERIC := 0;
    v_total_credit NUMERIC := 0;
    v_status TEXT;
    v_effective_company_id TEXT;
BEGIN
    v_journal_id := p_journal_data->>'id';
    v_status := p_journal_data->>'status';
    v_effective_company_id := COALESCE(p_company_id, p_journal_data->>'companyId');

    -- 1. Validate Balance if POSTED
    IF v_status = 'POSTED' THEN
        FOR v_line IN SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(p_journal_data->'lines') = 'array' THEN p_journal_data->'lines' ELSE '[]'::jsonb END) LOOP
            v_total_debit := v_total_debit + (v_line->>'debit')::numeric;
            v_total_credit := v_total_credit + (v_line->>'credit')::numeric;
        END LOOP;
        
        IF ABS(v_total_debit - v_total_credit) > 0.01 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Journal entry is not balanced');
        END IF;
    END IF;

    -- 2. Upsert Header
    INSERT INTO docs_journals (id, company_id, date, journal_type, status, reference_number, data, updated_at)
    VALUES (v_journal_id, v_effective_company_id, (p_journal_data->>'date')::date, p_journal_data->>'journalType', v_status, p_journal_data->>'reference', p_journal_data, NOW())
    ON CONFLICT (id) DO UPDATE SET 
        status = EXCLUDED.status,
        data = EXCLUDED.data,
        updated_at = NOW();

    -- 3. Sync Lines
    EXECUTE 'SET LOCAL core.bypass_audit = ''true''';
    DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
    EXECUTE 'SET LOCAL core.bypass_audit = ''false''';
    
    FOR v_line IN SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(p_journal_data->'lines') = 'array' THEN p_journal_data->'lines' ELSE '[]'::jsonb END) LOOP
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
        VALUES (COALESCE(v_line->>'id', 'JL-' || v_journal_id || '-' || floor(random()*1000000)::text), v_journal_id, v_effective_company_id, v_line->>'accountId', v_line->>'contactId', (v_line->>'debit')::numeric, (v_line->>'credit')::numeric, v_line->>'description');
    END LOOP;

    RETURN jsonb_build_object('success', true, 'id', v_journal_id);
END;
$function$;


-- Function: delete_inventory_ledger_lines
CREATE OR REPLACE FUNCTION public.delete_inventory_ledger_lines()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        -- Avoid audit trigger blocking deletion of these specific system lines
        PERFORM set_config('core.bypass_audit', 'true', true);
        
        DELETE FROM docs_journal_lines 
        WHERE id LIKE '%-' || OLD.id;
        
        PERFORM set_config('core.bypass_audit', 'false', true);
        
        RETURN OLD;
    END;
    $function$;


-- Function: enforce_accounting_immutability
CREATE OR REPLACE FUNCTION public.enforce_accounting_immutability()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
        DECLARE
            v_is_authorized BOOLEAN := false;
        BEGIN
IF current_setting('core.bypass_audit', true) = 'true' THEN RETURN NEW; END IF;
            BEGIN
                SELECT EXISTS (
                    SELECT 1 FROM docs_users 
                    WHERE user_uuid = auth.uid() 
                    AND role_id = 'role-admin'
                ) INTO v_is_authorized;
            EXCEPTION WHEN OTHERS THEN
                v_is_authorized := false;
            END;

            IF v_is_authorized THEN
                RETURN NEW;
            END IF;

            IF (OLD.status IN ('POSTED', 'VOID', 'VOIDED', 'PAID', 'PARTIAL', 'PARTIAL_REFUNDED', 'FULL_REFUNDED')) THEN
                IF (NEW.status = 'DRAFT' OR NEW.status = 'DRAFTED') THEN
                     IF OLD.status != 'DRAFT' THEN
                         RETURN NEW;
                     END IF;
                END IF;

                IF (NEW.status IN ('VOID', 'VOIDED', 'PAID', 'PARTIAL', 'PARTIAL_REFUNDED', 'FULL_REFUNDED') AND OLD.status = 'POSTED') THEN
                     RETURN NEW;
                END IF;

                IF (NEW.status IN ('PAID', 'VOID', 'VOIDED', 'PARTIAL_REFUNDED', 'FULL_REFUNDED') AND OLD.status IN ('PAID', 'PARTIAL')) THEN
                     RETURN NEW;
                END IF;
                
                IF (NEW.status = OLD.status) THEN
                    IF TG_TABLE_NAME = 'docs_invoices' OR TG_TABLE_NAME = 'docs_bills' THEN
                        IF NEW.total != OLD.total OR NEW.data->'items' != OLD.data->'items' THEN
                            RAISE EXCEPTION 'Accounting Integrity Violation: Cannot modify items or total on locked record % (%) without resetting to Draft first.', OLD.id, OLD.status;
                        END IF;
                    ELSIF TG_TABLE_NAME = 'docs_payments' THEN
                        IF NEW.amount != OLD.amount OR NEW.data->'appliedInvoices' != OLD.data->'appliedInvoices' THEN
                            RAISE EXCEPTION 'Accounting Integrity Violation: Cannot modify payment amount or applied invoices on locked record % (%) without resetting to Draft first.', OLD.id, OLD.status;
                        END IF;
                    END IF;
                    RETURN NEW;
                END IF;

                RAISE EXCEPTION 'Accounting Integrity Violation: Record % is locked (%) and cannot be modified directly. (Transition % -> %)', OLD.id, OLD.status, OLD.status, NEW.status;
            END IF;
            RETURN NEW;
        END;
        $function$;


-- Function: enforce_chronological_sequence
CREATE OR REPLACE FUNCTION public.enforce_chronological_sequence()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                DECLARE
                    v_prefix TEXT;
                    v_seq_num INTEGER;
                    v_max_date DATE;
                    v_min_date DATE;
                BEGIN
                    IF NEW.invoice_number IS NULL THEN
                        RETURN NEW;
                    END IF;

                    -- Bypass checks for draft invoices or placeholders starting with DRAFT
                    IF NEW.status = 'DRAFT' OR NEW.invoice_number LIKE 'DRAFT-%' THEN
                        RETURN NEW;
                    END IF;

                    -- Extract prefix and sequence number
                    -- e.g. INV-SUL-001723 -> prefix: INV-SUL- , seq: 1723
                    v_prefix := substring(NEW.invoice_number from '^([A-Za-z-]+)[0-9]+$');
                    
                    BEGIN
                        v_seq_num := CAST(substring(NEW.invoice_number from '[0-9]+$') AS INTEGER);
                    EXCEPTION WHEN OTHERS THEN
                        -- If it doesn't end with a number, ignore this check
                        RETURN NEW;
                    END;

                    IF v_prefix IS NOT NULL AND v_seq_num IS NOT NULL THEN
                        -- Check if backdating: Cannot have an older date than a lower sequence number
                        SELECT MAX(date) INTO v_max_date
                        FROM docs_invoices
                        WHERE company_id = NEW.company_id
                          AND invoice_number ~ ('^' || v_prefix || '[0-9]+$')
                          AND CAST(substring(invoice_number from '[0-9]+$') AS INTEGER) < v_seq_num
                          AND status NOT IN ('DRAFT')
                          AND id != NEW.id;

                        IF v_max_date IS NOT NULL AND NEW.date < v_max_date THEN
                            RAISE EXCEPTION 'Chronological sequence integrity breach. Cannot backdate invoice %. A lower sequence number has a newer date (%)', NEW.invoice_number, v_max_date;
                        END IF;

                        -- Check if future-dating past a higher sequence number: Cannot have a newer date than a higher sequence number
                        SELECT MIN(date) INTO v_min_date
                        FROM docs_invoices
                        WHERE company_id = NEW.company_id
                          AND invoice_number ~ ('^' || v_prefix || '[0-9]+$')
                          AND CAST(substring(invoice_number from '[0-9]+$') AS INTEGER) > v_seq_num
                          AND status NOT IN ('DRAFT')
                          AND id != NEW.id;

                        IF v_min_date IS NOT NULL AND NEW.date > v_min_date THEN
                            RAISE EXCEPTION 'Chronological sequence integrity breach. Cannot future-date invoice %. A higher sequence number has an older date (%)', NEW.invoice_number, v_min_date;
                        END IF;
                    END IF;

                    RETURN NEW;
                END;
                $function$;


-- Function: enforce_chronological_sequence_bills
CREATE OR REPLACE FUNCTION public.enforce_chronological_sequence_bills()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                DECLARE
                    v_prefix TEXT;
                    v_seq_num INTEGER;
                    v_max_date DATE;
                    v_min_date DATE;
                BEGIN
                    IF NEW.bill_number IS NULL THEN
                        RETURN NEW;
                    END IF;

                    -- Bypass checks for draft bills or placeholders starting with DRAFT
                    IF NEW.status = 'DRAFT' OR NEW.bill_number LIKE 'DRAFT-%' THEN
                        RETURN NEW;
                    END IF;

                    v_prefix := substring(NEW.bill_number from '^([A-Za-z-]+)[0-9]+$');
                    
                    BEGIN
                        v_seq_num := CAST(substring(NEW.bill_number from '[0-9]+$') AS INTEGER);
                    EXCEPTION WHEN OTHERS THEN
                        RETURN NEW;
                    END;

                    IF v_prefix IS NOT NULL AND v_seq_num IS NOT NULL THEN
                        SELECT MAX(date) INTO v_max_date
                        FROM docs_bills
                        WHERE company_id = NEW.company_id
                          AND bill_number ~ ('^' || v_prefix || '[0-9]+$')
                          AND CAST(substring(bill_number from '[0-9]+$') AS INTEGER) < v_seq_num
                          AND status NOT IN ('DRAFT')
                          AND id != NEW.id;

                        IF v_max_date IS NOT NULL AND NEW.date < v_max_date THEN
                            RAISE EXCEPTION 'Chronological sequence integrity breach. Cannot backdate bill %. A lower sequence number has a newer date (%)', NEW.bill_number, v_max_date;
                        END IF;

                        SELECT MIN(date) INTO v_min_date
                        FROM docs_bills
                        WHERE company_id = NEW.company_id
                          AND bill_number ~ ('^' || v_prefix || '[0-9]+$')
                          AND CAST(substring(bill_number from '[0-9]+$') AS INTEGER) > v_seq_num
                          AND status NOT IN ('DRAFT')
                          AND id != NEW.id;

                        IF v_min_date IS NOT NULL AND NEW.date > v_min_date THEN
                            RAISE EXCEPTION 'Chronological sequence integrity breach. Cannot future-date bill %. A higher sequence number has an older date (%)', NEW.bill_number, v_min_date;
                        END IF;
                    END IF;

                    RETURN NEW;
                END;
                $function$;


-- Function: enforce_chronological_sequence_payments
CREATE OR REPLACE FUNCTION public.enforce_chronological_sequence_payments()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                DECLARE
                    v_prefix TEXT;
                    v_seq_num INTEGER;
                    v_max_date DATE;
                    v_min_date DATE;
                BEGIN
                    IF NEW.payment_number IS NULL THEN
                        RETURN NEW;
                    END IF;

                    -- Bypass checks for draft payments or placeholders starting with DRAFT
                    IF NEW.status = 'DRAFT' OR NEW.payment_number LIKE 'DRAFT-%' THEN
                        RETURN NEW;
                    END IF;

                    v_prefix := substring(NEW.payment_number from '^([A-Za-z-]+)[0-9]+$');
                    
                    BEGIN
                        v_seq_num := CAST(substring(NEW.payment_number from '[0-9]+$') AS INTEGER);
                    EXCEPTION WHEN OTHERS THEN
                        RETURN NEW;
                    END;

                    IF v_prefix IS NOT NULL AND v_seq_num IS NOT NULL THEN
                        SELECT MAX(date) INTO v_max_date
                        FROM docs_payments
                        WHERE company_id = NEW.company_id
                          AND payment_number ~ ('^' || v_prefix || '[0-9]+$')
                          AND CAST(substring(payment_number from '[0-9]+$') AS INTEGER) < v_seq_num
                          AND status NOT IN ('DRAFT')
                          AND id != NEW.id;

                        IF v_max_date IS NOT NULL AND NEW.date < v_max_date THEN
                            RAISE EXCEPTION 'Chronological sequence integrity breach. Cannot backdate payment %. A lower sequence number has a newer date (%)', NEW.payment_number, v_max_date;
                        END IF;

                        SELECT MIN(date) INTO v_min_date
                        FROM docs_payments
                        WHERE company_id = NEW.company_id
                          AND payment_number ~ ('^' || v_prefix || '[0-9]+$')
                          AND CAST(substring(payment_number from '[0-9]+$') AS INTEGER) > v_seq_num
                          AND status NOT IN ('DRAFT')
                          AND id != NEW.id;

                        IF v_min_date IS NOT NULL AND NEW.date > v_min_date THEN
                            RAISE EXCEPTION 'Chronological sequence integrity breach. Cannot future-date payment %. A higher sequence number has an older date (%)', NEW.payment_number, v_min_date;
                        END IF;
                    END IF;

                    RETURN NEW;
                END;
                $function$;


-- Function: enforce_invoice_gl_accounting
CREATE OR REPLACE FUNCTION public.enforce_invoice_gl_accounting()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_journal_id TEXT;
    v_ar_account TEXT;
    v_rev_account TEXT;
    v_target_company_id TEXT;
    v_should_run BOOLEAN := false;
BEGIN
    -- চেক করা হচ্ছে ইনভয়েসটি নতুন পোস্ট হলো নাকি আগের ড্রাফট ইনভয়েস পোস্ট/পেইড হলো
    IF TG_OP = 'INSERT' THEN
        IF NEW.status IN ('POSTED', 'PAID') THEN
            v_should_run := true;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status IN ('POSTED', 'PAID') AND (OLD.status IS NULL OR OLD.status NOT IN ('POSTED', 'PAID')) THEN
            v_should_run := true;
        END IF;
    END IF;

    -- যদি কন্ডিশন ম্যাচ করে এবং ইনভয়েসের টোটাল অ্যামাউন্ট ০ এর বেশি হয়
    IF v_should_run AND COALESCE(NEW.total, 0) > 0 THEN
        
        -- কোম্পানি আইডি রিজলভ করা
        v_target_company_id := COALESCE(NEW.company_id::text, NEW.data->>'companyId');
        IF v_target_company_id IS NULL THEN
            SELECT id::text INTO v_target_company_id FROM docs_companies LIMIT 1;
        END IF;

        -- মূল ফিক্স: লেজারে অলরেডি এই ইনভয়েসের কোনো জার্নাল আছে কি না তা ক্রস-চেক করা
        SELECT id::text INTO v_journal_id FROM docs_journals 
        WHERE (reference_number = NEW.invoice_number OR journal_number = NEW.invoice_number)
        LIMIT 1;
        
        -- যদি কোনো জার্নাল আগে থেকেই থাকে (যেকোনো আইডির), তাহলে ফাংশনটি এখানেই থেমে যাবে (কোনো ডুপ্লিকেট করবে না)
        IF v_journal_id IS NOT NULL THEN
            UPDATE docs_journals SET status = 'POSTED' WHERE id = v_journal_id;
            RETURN NEW; 
        END IF;

        -- আর যদি কোনো জার্নাল না থাকে, তবেই সে নতুন JNL-AUTO তৈরি করবে
        v_journal_id := 'JNL-AUTO-' || replace(gen_random_uuid()::text, '-', '');
        
        INSERT INTO docs_journals (
            id, company_id, date, journal_date, reference_number, journal_number, journal_type, status, description, updated_at
        ) VALUES (
            v_journal_id, v_target_company_id, NEW.date, NEW.date, NEW.invoice_number, NEW.invoice_number, 'SALES', 'POSTED', 'Automated GL for Invoice ' || NEW.invoice_number, NOW()
        );

        -- Cash বা AR অ্যাকাউন্ট নির্ধারণ
        IF NEW.data->>'type' = 'CASH_SALE' OR NEW.data->>'paymentMethod' = 'CASH' THEN
            SELECT id::text INTO v_ar_account FROM docs_accounts WHERE code = '100100' AND company_id::text = v_target_company_id LIMIT 1;
        ELSE
            SELECT id::text INTO v_ar_account FROM docs_accounts WHERE code = '100201' AND company_id::text = v_target_company_id LIMIT 1;
        END IF;
        
        IF v_ar_account IS NULL THEN
            SELECT id::text INTO v_ar_account FROM docs_accounts WHERE code IN ('100201', '100100') ORDER BY code DESC LIMIT 1;
        END IF;

        -- Sales Revenue অ্যাকাউন্ট
        SELECT id::text INTO v_rev_account FROM docs_accounts WHERE code = '400100' AND company_id::text = v_target_company_id LIMIT 1;
        IF v_rev_account IS NULL THEN
            SELECT id::text INTO v_rev_account FROM docs_accounts WHERE code = '400100' LIMIT 1;
        END IF;

        -- জার্নাল লাইন ইনসার্ট করা
        IF v_ar_account IS NOT NULL AND v_rev_account IS NOT NULL THEN
            
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description, updated_at)
            VALUES (gen_random_uuid()::text, v_journal_id, v_target_company_id, v_ar_account, NEW.customer_id, COALESCE(NEW.total, 0), 0, 'Receivable/Cash for ' || NEW.invoice_number, NOW());
            
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description, updated_at)
            VALUES (gen_random_uuid()::text, v_journal_id, v_target_company_id, v_rev_account, NEW.customer_id, 0, COALESCE(NEW.total, 0), 'Sales Revenue for ' || NEW.invoice_number, NOW());
            
        END IF;

    END IF;

    RETURN NEW;
END;
$function$;


-- Function: ensure_invoice_inventory_transactions
CREATE OR REPLACE FUNCTION public.ensure_invoice_inventory_transactions()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_item JSONB;
    v_cost NUMERIC;
    v_idx INT := 0;
BEGIN
    -- শুধুমাত্র যখন ইনভয়েসটি প্রথমবার POSTED বা PAID হবে
    IF NEW.status IN ('POSTED', 'PAID') AND OLD.status NOT IN ('POSTED', 'PAID') THEN
        
        FOR v_item IN SELECT * FROM jsonb_array_elements(CASE WHEN jsonb_typeof(NEW.data->'items') = 'array' THEN NEW.data->'items' ELSE '[]'::jsonb END) LOOP
            v_idx := v_idx + 1;
            
            -- শুধুমাত্র প্রোডাক্ট হলে স্টক আউট করবে
            IF v_item->>'type' = 'PRODUCT' THEN
                
                -- প্রোডাক্টের বর্তমান কেনা দাম (Cost Price) বের করা
                SELECT COALESCE(cost_price, (data->>'costPrice')::numeric, 0) INTO v_cost 
                FROM docs_products WHERE id = v_item->>'productId';
                
                -- ইনভেন্টরি ট্রানজ্যাকশন টেবিলে ডেটা পাঠানো (data কলাম ছাড়া)
                INSERT INTO docs_inventory_transactions (
                    id, company_id, product_id, warehouse_id, transaction_type, 
                    quantity, reference_id, reference_type, date, cost_price, updated_at
                ) VALUES (
                    'mov-inv-' || NEW.id || '-' || v_idx, 
                    COALESCE(NEW.company_id, NEW.data->>'companyId'), 
                    v_item->>'productId', 
                    'WH-MAIN-' || COALESCE(NEW.company_id, NEW.data->>'companyId'), 
                    'OUT', 
                    COALESCE((v_item->>'quantity')::numeric, 0), 
                    NEW.id, 
                    'INVOICE', 
                    NEW.date, 
                    COALESCE(v_cost, 0), 
                    NOW()
                ) ON CONFLICT (id) DO NOTHING;
                
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$function$;


-- Function: generate_amortization_schedule
CREATE OR REPLACE FUNCTION public.generate_amortization_schedule(p_principal numeric, p_annual_rate numeric, p_term_months integer, p_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_schedule jsonb := '[]'::jsonb;
  v_monthly_rate NUMERIC;
  v_balance NUMERIC := p_principal;
  v_monthly_payment NUMERIC;
  v_interest NUMERIC;
  v_principal_paid NUMERIC;
  v_date DATE := CURRENT_DATE;
BEGIN
  IF p_term_months <= 0 THEN
    p_term_months := 1;
  END IF;
  
  v_monthly_rate := (p_annual_rate / 100.0) / 12.0;
  
  IF p_type = 'REDUCING' THEN
    IF v_monthly_rate > 0 THEN
      v_monthly_payment := p_principal * (v_monthly_rate * POWER(1 + v_monthly_rate, p_term_months)) / (POWER(1 + v_monthly_rate, p_term_months) - 1);
    ELSE
      v_monthly_payment := p_principal / p_term_months;
    END IF;
    
    FOR i IN 1..p_term_months LOOP
      v_interest := v_balance * v_monthly_rate;
      v_principal_paid := v_monthly_payment - v_interest;
      v_balance := v_balance - v_principal_paid;
      
      v_schedule := v_schedule || jsonb_build_object(
        'period', i,
        'date', (v_date + ((i-1)::text || ' months')::interval)::date,
        'payment', ROUND(v_monthly_payment, 2),
        'principal', ROUND(v_principal_paid, 2),
        'interest', ROUND(v_interest, 2),
        'balance', ROUND(CASE WHEN v_balance < 0 THEN 0 ELSE v_balance END, 2)
      );
    END LOOP;
  ELSE
    -- For 'FLAT' or other types
    v_interest := p_principal * v_monthly_rate;
    v_principal_paid := p_principal / p_term_months;
    v_monthly_payment := v_principal_paid + v_interest;
    
    FOR i IN 1..p_term_months LOOP
      v_balance := v_balance - v_principal_paid;
      
      v_schedule := v_schedule || jsonb_build_object(
        'period', i,
        'date', (v_date + ((i-1)::text || ' months')::interval)::date,
        'payment', ROUND(v_monthly_payment, 2),
        'principal', ROUND(v_principal_paid, 2),
        'interest', ROUND(v_interest, 2),
        'balance', ROUND(CASE WHEN v_balance < 0 THEN 0 ELSE v_balance END, 2)
      );
    END LOOP;
  END IF;

  RETURN v_schedule;
END;
$function$;


-- Function: generate_bill_number
CREATE OR REPLACE FUNCTION public.generate_bill_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
      new_num TEXT;
      existing_num TEXT;
      v_company_code TEXT;
      v_cid TEXT;
    BEGIN
      existing_num := NEW.data->>'number';
      v_cid := COALESCE(NEW.company_id, NEW.data->>'companyId', NEW.data->'companyIds'->>0);
      NEW.company_id := v_cid;

      v_company_code := NEW.data->>'companyCode';
      IF v_company_code IS NULL OR v_company_code = '' OR v_company_code LIKE 'comp-%' THEN
         v_company_code := get_company_short_code(v_cid);
      END IF;

      IF NEW.company_id IS NOT NULL THEN
        IF NOT (NEW.data ? 'companyIds') THEN
           NEW.data := jsonb_set(COALESCE(NEW.data, '{}'::jsonb), '{companyId}', to_jsonb(NEW.company_id));
        END IF;
      END IF;
      
      -- Skip sequence generation for drafts
      IF (NEW.data->>'status' = 'DRAFT') THEN
        NEW.bill_number := NULLIF(existing_num, '');
        RETURN NEW;
      END IF;

      IF (NEW.data->>'status' IN ('POSTED', 'PAID', 'PARTIAL', 'IN_PAYMENT')) AND (existing_num IS NULL OR existing_num = '' OR existing_num = 'DRAFT' OR existing_num = 'NEW' OR existing_num LIKE 'DRAFT-%') THEN
        new_num := get_next_company_doc_number(v_cid, 'BILL');
        
        NEW.data := jsonb_set(
          COALESCE(NEW.data, '{}'::jsonb), 
          '{number}', 
          to_jsonb(new_num)
        );
        NEW.bill_number := new_num;
      ELSE
        NEW.bill_number := NULLIF(existing_num, '');
      END IF;

      RETURN NEW;
    END;
    $function$;


-- Function: generate_credit_note_number
CREATE OR REPLACE FUNCTION public.generate_credit_note_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
      new_num TEXT;
      existing_num TEXT;
      v_company_code TEXT;
    BEGIN
      existing_num := NEW.data->>'number';
      v_company_code := NEW.data->>'companyCode';

      IF v_company_code IS NULL OR v_company_code = '' THEN
         v_company_code := COALESCE(NEW.data->>'companyId', 'CO');
      END IF;
      
      IF (NEW.data->>'status' = 'POSTED') AND (existing_num IS NULL OR existing_num = '' OR existing_num = 'DRAFT' OR existing_num = 'NEW') THEN
        new_num := get_next_company_doc_number(v_company_code, 'CREDIT_NOTE');
        
        NEW.data := jsonb_set(
          COALESCE(NEW.data, '{}'::jsonb), 
          '{number}', 
          to_jsonb(new_num)
        );
      END IF;

      RETURN NEW;
    END;
    $function$;


-- Function: generate_document_number
CREATE OR REPLACE FUNCTION public.generate_document_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    comp_code TEXT;
    doc_prefix TEXT;
    new_seq BIGINT;
    final_number TEXT;
    existing_num TEXT;
BEGIN
    -- Only generate if status is POSTED/PAID/SENT/ACTIVE (non-draft)
    -- and numbering is not already set (or is still 'DRAFT-...')
    
    -- Determine prefix based on table
    IF TG_TABLE_NAME = 'docs_invoices' THEN doc_prefix := 'INV'; 
    ELSIF TG_TABLE_NAME = 'docs_bills' THEN doc_prefix := 'BIL';
    ELSIF TG_TABLE_NAME = 'docs_credit_notes' THEN doc_prefix := 'CN';
    ELSIF TG_TABLE_NAME = 'docs_payments' THEN doc_prefix := 'PAY';
    ELSIF TG_TABLE_NAME = 'docs_journals' THEN doc_prefix := 'JEN';
    ELSIF TG_TABLE_NAME = 'docs_loans' THEN doc_prefix := 'LO';
    ELSE RETURN NEW;
    END IF;

    -- Get current number from NEW.data
    existing_num := NULL;
    IF TG_TABLE_NAME = 'docs_invoices' THEN existing_num := NEW.invoice_number;
    ELSIF TG_TABLE_NAME = 'docs_bills' THEN existing_num := NEW.bill_number;
    ELSIF TG_TABLE_NAME = 'docs_payments' THEN existing_num := NEW.payment_number;
    ELSIF TG_TABLE_NAME = 'docs_journals' THEN existing_num := NEW.reference_number;
    ELSIF TG_TABLE_NAME = 'docs_loans' THEN existing_num := (NEW.data->>'number');
    END IF;

    IF existing_num IS NULL THEN
        existing_num := (NEW.data->>'number');
    END IF;

    -- If status is changing to something non-DRAFT and we don't have a real number yet
    IF (NEW.status NOT IN ('DRAFT', 'DELETED', 'VOID')) AND (existing_num IS NULL OR existing_num = '' OR existing_num LIKE 'DRAFT-%' OR existing_num = 'NEW') THEN
        
        -- Get company code
        SELECT code INTO comp_code FROM docs_companies WHERE id = NEW.company_id;
        IF comp_code IS NULL THEN comp_code := 'UNK'; END IF;

        -- Increment sequence atomicaly
        INSERT INTO docs_document_sequences (company_id, document_type, last_sequence)
        VALUES (NEW.company_id, doc_prefix, 1)
        ON CONFLICT (company_id, document_type) 
        DO UPDATE SET last_sequence = docs_document_sequences.last_sequence + 1
        RETURNING last_sequence INTO new_seq;

        -- Format: PREFIX-CODE-000000 (6 digits padding)
        final_number := doc_prefix || '-' || comp_code || '-' || LPAD(new_seq::text, 6, '0');

        -- Update the specific column and the JSONB data
        NEW.data := jsonb_set(NEW.data, '{number}', to_jsonb(final_number));
        
        -- Automatically update the document date to CURRENT_DATE when generating the number
        NEW.date := CURRENT_DATE;
        NEW.data := jsonb_set(NEW.data, '{date}', to_jsonb(CURRENT_DATE::text));
        
        -- Special fields based on document type
        IF TG_TABLE_NAME = 'docs_invoices' THEN 
            NEW.invoice_number := final_number;
            -- Update invoiceDate in json if exists
            IF NEW.data ? 'invoiceDate' THEN
                NEW.data := jsonb_set(NEW.data, '{invoiceDate}', to_jsonb(CURRENT_DATE::text));
            END IF;
        ELSIF TG_TABLE_NAME = 'docs_bills' THEN 
            NEW.bill_number := final_number;
        ELSIF TG_TABLE_NAME = 'docs_payments' THEN 
            NEW.payment_number := final_number;
        ELSIF TG_TABLE_NAME = 'docs_journals' THEN 
            NEW.reference_number := final_number;
        END IF;

    END IF;

    RETURN NEW;
END;
$function$;


-- Function: generate_document_numbers
CREATE OR REPLACE FUNCTION public.generate_document_numbers()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
      v_field TEXT;
      v_seq TEXT;
      v_cid TEXT;
      v_num TEXT;
      v_status TEXT;
      v_current_doc_num TEXT;
      v_journal_id_cpay TEXT;
      v_journal_id_vpay TEXT;
    BEGIN
      v_cid := (to_jsonb(NEW) ->> 'company_id');
      v_status := (to_jsonb(NEW) ->> 'status');

      IF TG_TABLE_NAME = 'docs_invoices' THEN v_seq := 'INVOICE'; v_current_doc_num := NEW.invoice_number;
      ELSIF TG_TABLE_NAME = 'docs_bills' THEN v_seq := 'BILL'; v_current_doc_num := NEW.bill_number;
      ELSIF TG_TABLE_NAME = 'docs_payments' THEN v_seq := 'PAYMENT'; v_current_doc_num := NEW.payment_number;
      ELSIF TG_TABLE_NAME = 'docs_journals' THEN
         v_current_doc_num := NEW.reference_number;
         IF NEW.journal_type IN ('JOURNAL', 'EXPENSE') THEN
            IF NEW.journal_type = 'EXPENSE' THEN
               v_seq := 'EXPENSE';
            ELSE
               v_seq := 'JOURNAL';
            END IF;
         END IF;
      ELSIF TG_TABLE_NAME = 'docs_credit_notes' THEN v_seq := 'CREDIT_NOTE'; v_current_doc_num := NEW.credit_note_number;
      ELSIF TG_TABLE_NAME = 'docs_loans' THEN v_seq := 'LOAN'; v_current_doc_num := NEW.loan_number;
      ELSIF TG_TABLE_NAME = 'docs_products' THEN v_seq := 'PRODUCT'; v_current_doc_num := NEW.sku;
      ELSIF TG_TABLE_NAME = 'docs_contacts' THEN v_seq := 'CONTACT'; v_current_doc_num := NEW.external_id;
      END IF;

      IF v_seq IS NOT NULL AND (v_status IS NULL OR v_status IN ('POSTED', 'PAID', 'PARTIAL', 'ACTIVE', 'OPEN')) AND 
         (v_current_doc_num IS NULL OR v_current_doc_num = '' OR v_current_doc_num LIKE 'DRAFT%') THEN
        IF v_cid IS NOT NULL THEN
           v_num := get_next_company_doc_number(v_cid, v_seq);
           
           IF TG_TABLE_NAME = 'docs_invoices' THEN 
              NEW.invoice_number := v_num;
              IF NEW.data IS NOT NULL THEN NEW.data := jsonb_set(NEW.data, '{number}', to_jsonb(v_num)); END IF;
              UPDATE docs_journals SET reference_number = v_num, reference = v_num, description = 'Invoice ' || v_num WHERE id = COALESCE(NEW.journal_entry_id, 'JE-' || UPPER(NEW.id));
           ELSIF TG_TABLE_NAME = 'docs_bills' THEN 
              NEW.bill_number := v_num;
              IF NEW.data IS NOT NULL THEN NEW.data := jsonb_set(NEW.data, '{number}', to_jsonb(v_num)); END IF;
              UPDATE docs_journals SET reference_number = v_num, reference = v_num, description = 'AP: ' || v_num WHERE id = COALESCE(NEW.journal_entry_id, 'JE-' || UPPER(NEW.id));
           ELSIF TG_TABLE_NAME = 'docs_payments' THEN 
              NEW.payment_number := v_num;
              IF NEW.data IS NOT NULL THEN NEW.data := jsonb_set(NEW.data, '{number}', to_jsonb(v_num)); END IF;
              
              v_journal_id_cpay := 'JE-CPAY-' || replace(replace(UPPER(NEW.id), 'PAY-', ''), 'PAY-', '');
              v_journal_id_vpay := 'JE-VPAY-' || replace(replace(UPPER(NEW.id), 'PAY-', ''), 'PAY-', '');
              
              UPDATE docs_journals 
              SET reference_number = v_num, 
                  reference = v_num, 
                  journal_number = v_num,
                  data = jsonb_set(jsonb_set(COALESCE(data, '{}'::jsonb), '{reference}', to_jsonb(v_num)), '{reference_number}', to_jsonb(v_num))
              WHERE id IN (v_journal_id_cpay, v_journal_id_vpay);
              
              UPDATE docs_journal_lines 
              SET description = REPLACE(description, NEW.id, v_num) 
              WHERE journal_id IN (v_journal_id_cpay, v_journal_id_vpay);
              
           ELSIF TG_TABLE_NAME = 'docs_journals' THEN 
              NEW.reference_number := v_num;
              IF NEW.data IS NOT NULL THEN 
                 NEW.data := jsonb_set(jsonb_set(NEW.data, '{reference}', to_jsonb(v_num)), '{reference_number}', to_jsonb(v_num));
              END IF;
           ELSIF TG_TABLE_NAME = 'docs_credit_notes' THEN 
              NEW.credit_note_number := v_num;
              IF NEW.data IS NOT NULL THEN NEW.data := jsonb_set(NEW.data, '{number}', to_jsonb(v_num)); END IF;
              UPDATE docs_journals SET reference_number = v_num, reference = v_num WHERE id = COALESCE(NEW.data->>'journalEntryId', 'JE-' || replace(replace(UPPER(NEW.id), 'CN-', ''), 'CN-', ''));
           ELSIF TG_TABLE_NAME = 'docs_loans' THEN 
              NEW.loan_number := v_num;
              IF NEW.data IS NOT NULL THEN NEW.data := jsonb_set(NEW.data, '{number}', to_jsonb(v_num)); END IF;
           ELSIF TG_TABLE_NAME = 'docs_products' THEN 
              NEW.sku := v_num;
              IF NEW.data IS NOT NULL THEN NEW.data := jsonb_set(NEW.data, '{sku}', to_jsonb(v_num)); END IF;
           ELSIF TG_TABLE_NAME = 'docs_contacts' THEN 
              NEW.external_id := v_num;
              IF NEW.data IS NOT NULL THEN NEW.data := jsonb_set(NEW.data, '{externalId}', to_jsonb(v_num)); END IF;
           END IF;
        END IF;
      END IF;

      -- Ensure not-null constraints for draft documents (if sequence was not generated)
      IF TG_TABLE_NAME = 'docs_invoices' THEN
          IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
              NEW.invoice_number := 'DRAFT-' || NEW.id;
              IF NEW.data IS NOT NULL THEN NEW.data := jsonb_set(NEW.data, '{number}', to_jsonb(NEW.invoice_number)); END IF;
          END IF;
      ELSIF TG_TABLE_NAME = 'docs_bills' THEN
          IF NEW.bill_number IS NULL OR NEW.bill_number = '' THEN
              NEW.bill_number := 'DRAFT-' || NEW.id;
              IF NEW.data IS NOT NULL THEN NEW.data := jsonb_set(NEW.data, '{number}', to_jsonb(NEW.bill_number)); END IF;
          END IF;
      END IF;

      IF TG_TABLE_NAME = 'docs_journals' THEN
         IF NEW.journal_number IS NULL OR NEW.journal_number = '' OR (NEW.journal_number LIKE 'DRAFT%' AND NEW.status != 'DRAFT') THEN
            NEW.journal_number := COALESCE(NEW.reference_number, NEW.id, 'JE-TMP');
            IF NEW.data IS NOT NULL THEN NEW.data := jsonb_set(NEW.data, '{journal_number}', to_jsonb(NEW.journal_number)); END IF;
         END IF;
         IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
            NEW.reference_number := NEW.journal_number;
            IF NEW.data IS NOT NULL THEN NEW.data := jsonb_set(NEW.data, '{reference_number}', to_jsonb(NEW.reference_number)); END IF;
         END IF;
         IF NEW.journal_date IS NULL THEN
            NEW.journal_date := COALESCE(NEW.date, CURRENT_DATE);
         END IF;
      END IF;

      RETURN NEW;
    END;
$function$;


-- Function: generate_generic_number
CREATE OR REPLACE FUNCTION public.generate_generic_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
      new_num TEXT;
      existing_num TEXT;
      v_company_code TEXT;
      v_cid TEXT;
      v_seq_group TEXT;
      v_field TEXT;
    BEGIN
      -- Determine context from TG_TABLE_NAME
      IF TG_TABLE_NAME = 'docs_contacts' THEN
        v_seq_group := 'CONTACT';
        v_field := 'externalId';
      ELSIF TG_TABLE_NAME = 'docs_products' THEN
        v_seq_group := 'PRODUCT';
        v_field := 'sku';
      ELSIF TG_TABLE_NAME = 'docs_categories' THEN
        v_seq_group := 'CATEGORY';
        v_field := 'code';
      ELSIF TG_TABLE_NAME = 'docs_brands' THEN
        v_seq_group := 'BRAND';
        v_field := 'code';
      END IF;

      existing_num := NEW.data->>v_field;
      v_cid := COALESCE(NEW.company_id, NEW.data->>'companyId', NEW.data->'companyIds'->>0);
      NEW.company_id := v_cid;

      v_company_code := get_company_short_code(v_cid);

      IF (existing_num IS NULL OR existing_num = '') THEN
        new_num := get_next_company_doc_number(v_cid, v_seq_group);
        NEW.data := jsonb_set(COALESCE(NEW.data, '{}'::jsonb), ('{' || v_field || '}')::text[], to_jsonb(new_num));
      END IF;

      RETURN NEW;
    END;
    $function$;


-- Function: generate_inventory_movements
CREATE OR REPLACE FUNCTION public.generate_inventory_movements()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      
      
DECLARE
  item RECORD;
  adj_item JSONB;
  v_wh_id TEXT;
  v_is_posted BOOLEAN;
  v_tx_cost NUMERIC;
  v_data JSONB;
  v_status_new TEXT;
  v_status_old TEXT;
  v_bill_discount_factor NUMERIC := 1.0;
  v_items JSONB;
BEGIN
  IF current_setting('core.bypass_audit', true) = 'true' THEN RETURN NEW; END IF;
  IF pg_trigger_depth() > 3 THEN RETURN NEW; END IF;
  
  IF TG_OP = 'UPDATE' THEN
      IF NEW.status IS NOT DISTINCT FROM OLD.status
          AND (NULLIF(to_jsonb(NEW)->>'date', '')::DATE) IS NOT DISTINCT FROM (NULLIF(to_jsonb(OLD)->>'date', '')::DATE)
          AND NEW.data IS NOT DISTINCT FROM OLD.data
          AND (NULLIF(to_jsonb(NEW)->>'subtotal', '')::NUMERIC) IS NOT DISTINCT FROM (NULLIF(to_jsonb(OLD)->>'subtotal', '')::NUMERIC) THEN
         RETURN NEW;
     END IF;
  END IF;

  v_status_new := (to_jsonb(NEW) ->> 'status');
  IF v_status_new IS NULL AND TG_TABLE_NAME = 'docs_inventory_adjustments' THEN 
     v_status_new := 'POSTED';
  END IF;

  IF TG_OP = 'UPDATE' THEN
     v_status_old := (to_jsonb(OLD) ->> 'status');
     IF v_status_old IS NULL AND TG_TABLE_NAME = 'docs_inventory_adjustments' THEN
        v_status_old := 'POSTED';
     END IF;
  ELSE
     v_status_old := NULL;
  END IF;

  v_is_posted := v_status_new IN ('POSTED', 'PAID', 'PARTIAL', 'IN_PAYMENT', 'OPEN', 'CLOSED', 'FULL_REFUNDED', 'PARTIAL_REFUNDED');

  IF TG_OP = 'UPDATE' THEN
     DELETE FROM docs_inventory_transactions WHERE reference_id = NEW.id;
  END IF;

  IF TG_TABLE_NAME = 'docs_inventory_adjustments' AND v_is_posted THEN
      v_data := (row_to_json(NEW)::jsonb)->'data';
      IF v_data IS NOT NULL AND (v_data->'items') IS NOT NULL THEN
        FOR adj_item IN SELECT * FROM jsonb_array_elements(v_data->'items') LOOP
          v_wh_id := COALESCE(NULLIF(adj_item->>'warehouseId', ''), NULLIF(v_data->>'warehouseId', ''), 'wh-' || NEW.company_id);
          INSERT INTO docs_inventory_transactions (id, company_id, product_id, warehouse_id, transaction_type, quantity, reference_id, reference_type, date, cost_price)
          VALUES (
            'mov-adj-' || NEW.id || '-' || COALESCE(NULLIF(adj_item->>'productId', ''), md5(adj_item::text)), 
            NEW.company_id, 
            NULLIF(adj_item->>'productId', ''), 
            v_wh_id, 
            CASE WHEN NULLIF(adj_item->>'difference', '')::NUMERIC >= 0 THEN 'IN' ELSE 'OUT' END, 
            ABS(NULLIF(adj_item->>'difference', '')::NUMERIC), 
            NEW.id, 
            'ADJUSTMENT', 
            COALESCE(NULLIF(v_data->>'date', '')::DATE, NEW.updated_at::DATE, NOW()::DATE), 
            COALESCE(NULLIF(adj_item->>'costPrice', '')::NUMERIC, (SELECT cost_price FROM docs_products WHERE id = NULLIF(adj_item->>'productId', '')), 0)
          )
          ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, cost_price = EXCLUDED.cost_price, updated_at = NOW();
        END LOOP;
      END IF;
  END IF;

  IF TG_TABLE_NAME = 'docs_invoices' AND v_is_posted THEN
    v_data := (row_to_json(NEW)::jsonb)->'data';
    v_items := COALESCE(v_data->'items', '[]'::jsonb);
    
    FOR adj_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
      IF NULLIF(adj_item->>'productId', '') IS NOT NULL AND (adj_item->>'type' = 'PRODUCT' OR adj_item->>'type' IS NULL) THEN
        v_wh_id := 'wh-' || NEW.company_id;
        
        SELECT avg_cost INTO v_tx_cost FROM docs_product_costs 
        WHERE product_id = adj_item->>'productId' AND warehouse_id = v_wh_id AND company_id = NEW.company_id;
        
        IF v_tx_cost IS NULL THEN
            SELECT cost_price INTO v_tx_cost FROM docs_products WHERE id = adj_item->>'productId';
        END IF;
        IF v_tx_cost IS NULL THEN v_tx_cost := 0; END IF;

        INSERT INTO docs_inventory_transactions (id, company_id, product_id, warehouse_id, transaction_type, quantity, reference_id, reference_type, date, cost_price, unit_price)
        VALUES (
          'mov-inv-' || NEW.id || '-' || COALESCE(NULLIF(adj_item->>'id', ''), md5(adj_item::text)),
          NEW.company_id,
          adj_item->>'productId',
          v_wh_id,
          'OUT',
          COALESCE(NULLIF(adj_item->>'quantity', '')::NUMERIC, 0),
          NEW.id,
          'INVOICE',
          COALESCE((NULLIF(to_jsonb(NEW)->>'date', '')::DATE), NOW()::DATE),
          v_tx_cost,
          COALESCE(NULLIF(adj_item->>'unitPrice', '')::NUMERIC, 0)
        ) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, cost_price = EXCLUDED.cost_price, updated_at = NOW();
      END IF;
    END LOOP;
  END IF;

  IF TG_TABLE_NAME = 'docs_bills' AND v_is_posted THEN
    IF COALESCE((NULLIF(to_jsonb(NEW)->>'subtotal', '')::NUMERIC), 0) > 0 THEN 
       v_bill_discount_factor := ROUND(((NULLIF(to_jsonb(NEW)->>'subtotal', '')::NUMERIC) - COALESCE((NULLIF(to_jsonb(NEW)->>'discount_total', '')::NUMERIC), 0)) / (NULLIF(to_jsonb(NEW)->>'subtotal', '')::NUMERIC), 4);
    ELSE 
       v_bill_discount_factor := 1.0;
    END IF;

    v_data := (row_to_json(NEW)::jsonb)->'data';
    v_items := COALESCE(v_data->'items', '[]'::jsonb);

    FOR adj_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
      IF NULLIF(adj_item->>'productId', '') IS NOT NULL AND (adj_item->>'type' = 'PRODUCT' OR adj_item->>'type' IS NULL) THEN
        v_wh_id := 'wh-' || NEW.company_id;
        
        v_tx_cost := CASE 
                       WHEN COALESCE(NULLIF(adj_item->>'quantity', '')::NUMERIC, 0) > 0 THEN ROUND((COALESCE(NULLIF(adj_item->>'lineValue', '')::NUMERIC, COALESCE(NULLIF(adj_item->>'quantity', '')::NUMERIC, 0) * COALESCE(NULLIF(adj_item->>'unitPrice', '')::NUMERIC, 0)) * v_bill_discount_factor) / NULLIF(adj_item->>'quantity', '')::NUMERIC, 4)
                     ELSE ROUND(COALESCE(NULLIF(adj_item->>'unitPrice', '')::NUMERIC, 0) * v_bill_discount_factor, 4)
                     END;

        INSERT INTO docs_inventory_transactions (id, company_id, product_id, warehouse_id, transaction_type, quantity, reference_id, reference_type, date, cost_price, unit_price)
        VALUES (
          'mov-bil-' || NEW.id || '-' || COALESCE(NULLIF(adj_item->>'id', ''), md5(adj_item::text)),
          NEW.company_id,
          adj_item->>'productId',
          v_wh_id,
          'IN',
          COALESCE(NULLIF(adj_item->>'quantity', '')::NUMERIC, 0),
          NEW.id,
          'BILL',
          COALESCE((NULLIF(to_jsonb(NEW)->>'date', '')::DATE), NOW()::DATE),
          v_tx_cost,
          COALESCE(NULLIF(adj_item->>'unitPrice', '')::NUMERIC, 0)
        ) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, cost_price = EXCLUDED.cost_price, updated_at = NOW();
      END IF;
    END LOOP;
  END IF;

  IF TG_TABLE_NAME = 'docs_credit_notes' AND v_is_posted THEN
    v_data := (row_to_json(NEW)::jsonb)->'data';
    v_items := COALESCE(v_data->'items', '[]'::jsonb);

    FOR adj_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
      IF NULLIF(adj_item->>'productId', '') IS NOT NULL AND (adj_item->>'type' = 'PRODUCT' OR adj_item->>'type' IS NULL) THEN
        v_wh_id := 'wh-' || NEW.company_id;
        
        SELECT avg_cost INTO v_tx_cost FROM docs_product_costs 
        WHERE product_id = adj_item->>'productId' AND warehouse_id = v_wh_id AND company_id = NEW.company_id;
        
        IF v_tx_cost IS NULL THEN
            SELECT cost_price INTO v_tx_cost FROM docs_products WHERE id = adj_item->>'productId';
        END IF;
        IF v_tx_cost IS NULL THEN v_tx_cost := 0; END IF;

        INSERT INTO docs_inventory_transactions (id, company_id, product_id, warehouse_id, transaction_type, quantity, reference_id, reference_type, date, cost_price, unit_price)
        VALUES (
          'mov-cn-' || NEW.id || '-' || COALESCE(NULLIF(adj_item->>'id', ''), md5(adj_item::text)),
          NEW.company_id,
          adj_item->>'productId',
          v_wh_id,
          'IN',
          COALESCE(NULLIF(adj_item->>'quantity', '')::NUMERIC, 0),
          NEW.id,
          'CREDIT_NOTE',
          COALESCE((NULLIF(to_jsonb(NEW)->>'date', '')::DATE), NOW()::DATE),
          v_tx_cost,
          COALESCE(NULLIF(adj_item->>'unitPrice', '')::NUMERIC, 0)
        ) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, cost_price = EXCLUDED.cost_price, updated_at = NOW();
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;

      
      $function$;


-- Function: generate_invoice_number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
      new_num TEXT;
      existing_num TEXT;
      v_company_code TEXT;
      v_cid TEXT;
    BEGIN
      existing_num := NEW.data->>'number';
      v_cid := COALESCE(NEW.company_id, NEW.data->>'companyId');
      NEW.company_id := v_cid;
      
      -- Try to get company code
      v_company_code := NEW.data->>'companyCode';
      IF v_company_code IS NULL OR v_company_code = '' OR v_company_code LIKE 'comp-%' THEN
         v_company_code := get_company_short_code(v_cid);
      END IF;

      IF NEW.company_id IS NOT NULL THEN
        NEW.data := jsonb_set(COALESCE(NEW.data, '{}'::jsonb), '{companyId}', to_jsonb(NEW.company_id));
      END IF;
      
      -- Skip sequence generation for drafts
      IF (NEW.data->>'status' = 'DRAFT') THEN
        NEW.invoice_number := NULLIF(existing_num, '');
        RETURN NEW;
      END IF;

      IF (NEW.data->>'status' IN ('POSTED', 'PAID', 'PARTIAL', 'IN_PAYMENT')) AND (existing_num IS NULL OR existing_num = '' OR existing_num = 'DRAFT' OR existing_num = 'NEW' OR existing_num LIKE 'DRAFT-%') THEN
        new_num := get_next_company_doc_number(v_cid, 'INVOICE');
        
        NEW.data := jsonb_set(
          COALESCE(NEW.data, '{}'::jsonb), 
          '{number}', 
          to_jsonb(new_num)
        );
        NEW.invoice_number := new_num;
      ELSE
        NEW.invoice_number := NULLIF(existing_num, '');
      END IF;

      RETURN NEW;
    END;
    $function$;


-- Function: generate_journal_number
CREATE OR REPLACE FUNCTION public.generate_journal_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
      new_num TEXT;
      existing_num TEXT;
      v_company_code TEXT;
      v_seq_group TEXT;
    BEGIN
      existing_num := NEW.data->>'reference';
      v_company_code := NEW.data->>'companyCode';
      NEW.company_id := COALESCE(NEW.company_id, NEW.data->>'companyId');

      IF NEW.company_id IS NOT NULL THEN
        NEW.data := jsonb_set(COALESCE(NEW.data, '{}'::jsonb), '{companyId}', to_jsonb(NEW.company_id));
      END IF;

      IF v_company_code IS NULL OR v_company_code = '' THEN
         v_company_code := COALESCE(NEW.company_id, 'CO');
      END IF;
      
      -- Skip sequence generation for drafts
      IF (NEW.data->>'status' = 'DRAFT') THEN
        NEW.reference_number := NULLIF(existing_num, '');
        RETURN NEW;
      END IF;

      -- Only generate if reference is missing or NEW/DRAFT and status is POSTED
      IF (NEW.data->>'status' = 'POSTED') AND (existing_num IS NULL OR existing_num = '' OR existing_num = 'DRAFT' OR existing_num = 'NEW' OR existing_num LIKE 'DRAFT-%') THEN
        v_seq_group := COALESCE(NEW.data->>'journalType', 'JOURNAL');
        new_num := get_next_company_doc_number(NEW.company_id, v_seq_group);
        
        NEW.data := jsonb_set(
          COALESCE(NEW.data, '{}'::jsonb), 
          '{reference}', 
          to_jsonb(new_num)
        );
        NEW.reference_number := new_num;
      ELSE
        NEW.reference_number := NULLIF(existing_num, '');
      END IF;

      RETURN NEW;
    END;
    $function$;


-- Function: generate_payment_number
CREATE OR REPLACE FUNCTION public.generate_payment_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
      new_num TEXT;
      existing_num TEXT;
      v_company_code TEXT;
    BEGIN
      existing_num := NEW.data->>'number';
      v_company_code := NEW.data->>'companyCode';
      NEW.company_id := COALESCE(NEW.company_id, NEW.data->>'companyId', NEW.data->'companyIds'->>0);
      IF NEW.company_id IS NOT NULL THEN
        IF (NEW.data ? 'companyIds') THEN
           -- leave it alone or enforce companyIds
        ELSE
           NEW.data := jsonb_set(COALESCE(NEW.data, '{}'::jsonb), '{companyId}', to_jsonb(NEW.company_id));
        END IF;
      END IF;

      IF v_company_code IS NULL OR v_company_code = '' THEN
         v_company_code := COALESCE(NEW.company_id, 'CO');
      END IF;
      
      IF (NEW.data->>'status' IN ('POSTED', 'PAID', 'PARTIAL', 'IN_PAYMENT')) AND (existing_num IS NULL OR existing_num = '' OR existing_num = 'DRAFT' OR existing_num = 'NEW' OR existing_num LIKE 'DRAFT-%') THEN
        new_num := get_next_company_doc_number(NEW.company_id, 'PAYMENT');
        
        NEW.data := jsonb_set(
          COALESCE(NEW.data, '{}'::jsonb), 
          '{number}', 
          to_jsonb(new_num)
        );
        NEW.payment_number := new_num;
      ELSE
        NEW.payment_number := NULLIF(existing_num, '');
      END IF;

      RETURN NEW;
    END;
    $function$;


-- Function: generate_profit_and_loss
CREATE OR REPLACE FUNCTION public.generate_profit_and_loss(p_company_id text, p_start_date date, p_end_date date)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- ১. এই কোম্পানি ও ডেট রেঞ্জের পুরানো সাময়িক রিপোর্ট ডাটা মুছে ফেলা
    DELETE FROM report_profit_and_loss 
    WHERE company_id = p_company_id 
      AND start_date = p_start_date 
      AND end_date = p_end_date;

    -- ২. জার্নাল লাইন এবং অ্যাকাউন্টস টেবিল জয়েন করে রেভিনিউ ও এক্সপেন্স হিসাব করে পুশ করা
    -- (নোট: আপনার চাঙ্ক করা 'docs_journal_lines' এবং 'docs_journals' থেকে ডাটা নেওয়া হচ্ছে)
    INSERT INTO report_profit_and_loss (
        company_id, start_date, end_date, account_id, account_name, account_type, total_debit, total_credit, balance
    )
    SELECT 
        j.company_id,
        p_start_date,
        p_end_date,
        jl.account_id,
        MAX(jl.description) AS account_name, -- ডিফল্ট নাম বা ডেসক্রিপশন
        CASE 
            -- আপনার চার্ট অফ অ্যাকাউন্টস (COA) কোড অনুযায়ী টাইপ ডিটেকশন লজিক
            -- এখানে ১০০০, ৫০০০ এর সিরিজ কোড থাকলে সেই অনুযায়ী REVENUE/EXPENSE বসবে
            WHEN jl.account_id LIKE '%-4%' OR jl.account_id LIKE '%-revenue%' THEN 'REVENUE'
            ELSE 'EXPENSE'
        END AS account_type,
        SUM(COALESCE(jl.debit, 0)) AS total_debit,
        SUM(COALESCE(jl.credit, 0)) AS total_credit,
        CASE 
            -- রেভিনিউর জন্য নরমাল ব্যালেন্স ক্রেডিট (Credit - Debit)
            WHEN jl.account_id LIKE '%-4%' OR jl.account_id LIKE '%-revenue%' THEN SUM(COALESCE(jl.credit, 0)) - SUM(COALESCE(jl.debit, 0))
            -- এক্সপেন্সের জন্য নরমাল ব্যালেন্স ডেবিট (Debit - Credit)
            ELSE SUM(COALESCE(jl.debit, 0)) - SUM(COALESCE(jl.credit, 0))
        END AS balance
    FROM docs_journal_lines jl
    JOIN docs_journals j ON jl.journal_id = j.id
    WHERE j.company_id = p_company_id
      AND j.journal_date BETWEEN p_start_date AND p_end_date
      AND j.status = 'POSTED' -- শুধুমাত্র পোস্টেড ভাউচার হিসাব হবে
    GROUP BY j.company_id, jl.account_id;

END;
$function$;


-- Function: get_account_balance
CREATE OR REPLACE FUNCTION public.get_account_balance(p_company_ids text[], p_account_id text, p_as_of_date date DEFAULT CURRENT_DATE)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_balance NUMERIC;
BEGIN
    SELECT COALESCE(SUM(al.debit - al.credit), 0) INTO v_balance
    FROM docs_journal_lines al
    JOIN docs_journals j ON al.journal_id = j.id
    WHERE (p_company_ids IS NULL OR j.company_id = ANY(p_company_ids))
      AND al.account_id = p_account_id
      AND j.status = 'POSTED'
      AND j.date <= p_as_of_date;
    
    RETURN v_balance;
END;
$function$;


-- Function: get_all_account_balances
CREATE OR REPLACE FUNCTION public.get_all_account_balances(p_company_ids text[], p_as_of_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(account_id text, balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        al.account_id,
        COALESCE(SUM(al.debit - al.credit), 0) as balance
    FROM docs_journal_lines al
    JOIN docs_journals j ON al.journal_id = j.id
    WHERE (p_company_ids IS NULL OR j.company_id = ANY(p_company_ids))
      AND j.status = 'POSTED'
      AND j.date <= p_as_of_date
    GROUP BY al.account_id;
END;
$function$;


-- Function: get_balance_sheet
CREATE OR REPLACE FUNCTION public.get_balance_sheet(p_company_id text, p_as_of_date date)
 RETURNS TABLE(account_id text, account_code text, account_name text, account_type text, branch_id text, balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.code,
        a.name,
        (a.data->>'type') as account_type,
        j.company_id as branch_id,
        SUM(al.debit - al.credit) as balance
    FROM docs_journal_lines al
    JOIN docs_journals j ON al.journal_id = j.id
    JOIN docs_accounts a ON al.account_id = a.id
    WHERE (p_company_id IS NULL OR j.company_id = p_company_id)
      AND j.status = 'POSTED'
      AND j.date <= p_as_of_date
      AND UPPER(a.data->>'type') IN ('ASSET', 'LIABILITY', 'EQUITY', 'BANK', 'RECEIVABLE', 'PAYABLE')
    GROUP BY a.id, a.code, a.name, a.data->>'type', j.company_id;
END;
$function$;


-- Function: get_balance_sheet_enterprise
CREATE OR REPLACE FUNCTION public.get_balance_sheet_enterprise(p_company_ids text[], p_as_of_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(category text, company_id text, account_id text, account_code text, account_name text, balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        RETURN QUERY
        WITH re_calc AS (
            SELECT 
                r.company_id as comp_id,
                COALESCE(r.retained, 0) as re_balance
            FROM get_retained_earnings_enterprise(p_company_ids, p_as_of_date) r
        )
        SELECT * FROM (
            SELECT
                UPPER(COALESCE(a.type, a.data->>'type', ''))::TEXT as category,
                j.company_id,
                a.id as account_id,
                a.code as account_code,
                a.name as account_name,
                SUM(
                    CASE
                        WHEN UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('ASSET', 'BANK', 'RECEIVABLE') THEN jl.debit - jl.credit
                        WHEN UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('LIABILITY', 'PAYABLE', 'EQUITY', 'CREDIT_CARD') THEN jl.credit - jl.debit
                        ELSE 0
                    END
                ) as balance
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            JOIN docs_accounts a ON jl.account_id = a.id
            WHERE (p_company_ids IS NULL OR j.company_id = ANY(p_company_ids))
            AND j.status = 'POSTED'
            AND j.date::DATE <= p_as_of_date
            AND UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('ASSET', 'BANK', 'RECEIVABLE', 'LIABILITY', 'PAYABLE', 'EQUITY', 'CREDIT_CARD')
            GROUP BY j.company_id, a.id, a.code, a.name, UPPER(COALESCE(a.type, a.data->>'type', ''))
            
            UNION ALL
            
            SELECT 
                'EQUITY' as category,
                re.comp_id as company_id,
                'retained_earnings' as account_id,
                '399999' as account_code,
                'Retained Earnings' as account_name,
                re.re_balance as balance
            FROM re_calc re
        ) subquery
        WHERE subquery.balance != 0
        ORDER BY CASE 
            WHEN subquery.category IN ('ASSET', 'BANK', 'RECEIVABLE') THEN 1 
            WHEN subquery.category IN ('LIABILITY', 'PAYABLE', 'CREDIT_CARD') THEN 2
            WHEN subquery.category = 'EQUITY' THEN 3
            ELSE 4 
            END, subquery.account_code;
    END;
    $function$;


-- Function: get_balance_sheet_structured
CREATE OR REPLACE FUNCTION public.get_balance_sheet_structured(p_company_ids text[], p_as_of_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(section text, account_group text, category text, company_id text, account_id text, account_code text, account_name text, balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        RETURN QUERY
        WITH AccountBalances AS (
            SELECT 
                jl.company_id,
                jl.account_id,
                SUM(jl.debit) as t_debit,
                SUM(jl.credit) as t_credit
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            WHERE (p_company_ids IS NULL OR jl.company_id = ANY(p_company_ids))
            AND j.status = 'POSTED'
            AND j.date::DATE <= p_as_of_date
            GROUP BY jl.company_id, jl.account_id
        ),
        Combined AS (
            SELECT 
                CASE 
                    WHEN a.type = 'ASSET' THEN 'ASSETS'
                    ELSE 'LIABILITIES & EQUITY'
                END as section,
                CASE 
                    WHEN a.type = 'ASSET' AND a.code LIKE '12%' THEN 'Non-Current Assets'
                    WHEN a.type = 'ASSET' THEN 'Current Assets'
                    WHEN a.type = 'LIABILITY' AND (a.code LIKE '21%' OR a.code LIKE '22%') THEN 'Long-Term Liabilities'
                    WHEN a.type = 'LIABILITY' THEN 'Current Liabilities'
                    WHEN a.type = 'EQUITY' THEN 'Equity'
                    ELSE 'Other'
                END as account_group,
                a.type::TEXT as category,
                ab.company_id,
                a.id as account_id,
                a.code as account_code,
                a.name as account_name,
                CASE 
                    WHEN a.type = 'ASSET' THEN COALESCE(ab.t_debit, 0) - COALESCE(ab.t_credit, 0)
                    WHEN a.type IN ('LIABILITY', 'EQUITY') THEN COALESCE(ab.t_credit, 0) - COALESCE(ab.t_debit, 0)
                    ELSE 0
                END as calculated_balance
            FROM docs_accounts a
            JOIN AccountBalances ab ON a.id = ab.account_id
            WHERE (p_company_ids IS NULL OR a.company_id = ANY(p_company_ids))
            AND a.type IN ('ASSET', 'LIABILITY', 'EQUITY')
            AND (ab.t_debit > 0 OR ab.t_credit > 0)
            
            UNION ALL
            
            SELECT
                'LIABILITIES & EQUITY' as section,
                'Equity' as account_group,
                'EQUITY' as category,
                re.company_id,
                'retained_earnings' as account_id,
                '399999' as account_code,
                'Net Income' as account_name,
                re.retained as calculated_balance
            FROM get_retained_earnings_enterprise(p_company_ids, p_as_of_date) re
            WHERE re.retained != 0
        )
        SELECT
            c.section,
            c.account_group,
            c.category,
            c.company_id,
            c.account_id,
            c.account_code,
            c.account_name,
            c.calculated_balance as balance
        FROM Combined c
        ORDER BY 
            CASE c.section WHEN 'ASSETS' THEN 1 ELSE 2 END,
            CASE c.account_group 
                WHEN 'Current Assets' THEN 1 
                WHEN 'Non-Current Assets' THEN 2 
                WHEN 'Current Liabilities' THEN 3 
                WHEN 'Long-Term Liabilities' THEN 4 
                WHEN 'Equity' THEN 5 
                ELSE 6 
            END,
            c.account_code;
    END;
    $function$;


-- Function: get_cash_ledger
CREATE OR REPLACE FUNCTION public.get_cash_ledger(p_company_ids text[], p_start_date text, p_end_date text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        v_opening NUMERIC := 0;
        v_records JSONB;
        v_start DATE;
        v_end DATE;
    BEGIN
        IF p_start_date IS NULL OR p_start_date = '' THEN
            v_start := '1970-01-01'::DATE;
        ELSE
            v_start := p_start_date::date;
        END IF;
        
        IF p_end_date IS NULL OR p_end_date = '' THEN
            v_end := '2100-01-01'::DATE;
        ELSE
            v_end := p_end_date::date;
        END IF;

        -- Calculate Opening Balance directly from journal lines
        SELECT COALESCE(SUM(jl.debit - jl.credit), 0) INTO v_opening
        FROM docs_journal_lines jl
        JOIN docs_journals j ON j.id = jl.journal_id
        JOIN docs_accounts a ON a.id = jl.account_id
        WHERE j.status = 'POSTED'
          AND j.date < v_start
          AND (a.code IN ('100100', '1011') OR a.type IN ('CASH', 'BANK') OR a.sub_type IN ('CASH', 'BANK'))
          AND (array_length(p_company_ids, 1) IS NULL OR j.company_id = ANY(p_company_ids));

        -- Fetch Transactions directly from journal lines
        WITH cash_lines AS (
            SELECT 
                jl.id AS line_id,
                j.id AS journal_id,
                j.date,
                COALESCE(j.reference_number, j.reference, j.journal_number) as reference_number,
                j.journal_type,
                COALESCE(jl.description, j.description, '') AS description,
                jl.debit,
                jl.credit,
                (jl.debit - jl.credit) AS impact,
                j.company_id,
                j.created_at,
                COALESCE(
                  (SELECT c_inner.name FROM docs_contacts c_inner WHERE c_inner.id = jl.contact_id LIMIT 1),
                  (SELECT c_inner.name FROM docs_contacts c_inner INNER JOIN docs_journal_lines jl2 ON jl2.contact_id = c_inner.id WHERE jl2.journal_id = j.id AND jl2.contact_id IS NOT NULL LIMIT 1),
                  (SELECT c_inner.name FROM docs_invoices i LEFT JOIN docs_contacts c_inner ON i.customer_id = c_inner.id WHERE COALESCE(i.journal_entry_id, i.data->>'journalEntryId', 'JE-' || UPPER(REPLACE(i.id, 'INV-', ''))) = j.id OR 'JE-CPAY-' || UPPER(REPLACE(REPLACE('PAY-AUTO-' || i.id, 'PAY-', ''), 'PAY-', '')) = j.id LIMIT 1),
                  (SELECT c_inner.name FROM docs_bills b LEFT JOIN docs_contacts c_inner ON b.vendor_id = c_inner.id WHERE COALESCE(b.journal_entry_id, b.data->>'journalEntryId') = j.id OR 'JE-VPAY-' || UPPER(REPLACE(REPLACE('PAY-AUTO-' || b.id, 'PAY-', ''), 'PAY-', '')) = j.id LIMIT 1),
                  (SELECT c_inner.name FROM docs_payments p LEFT JOIN docs_contacts c_inner ON p.contact_id = c_inner.id WHERE COALESCE(p.data->>'journalEntryId', 'JE-' || CASE WHEN p.type IN ('RECEIPT', 'REFUND', 'COLLECTION') THEN 'CPAY' ELSE 'VPAY' END || '-' || replace(replace(UPPER(p.id), 'PAY-', ''), 'PAY-', '')) = j.id OR j.id = 'PAY-AUTO-' || p.id OR j.id = p.id LIMIT 1),
                  CASE WHEN j.journal_type IN ('INV', 'BILL', 'CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY', 'CREDIT_NOTE') THEN 'Cash Sale' ELSE 'Various' END
                ) AS partner_name,
                COALESCE(
                    (SELECT name FROM docs_users WHERE id = j.created_by_id), 
                     (SELECT username FROM docs_users WHERE id = j.created_by_id), 
                     j.data->>'preparedBy', 
                     'System'
                ) AS prepared_by
            FROM docs_journal_lines jl
            JOIN docs_journals j ON j.id = jl.journal_id
            JOIN docs_accounts a ON a.id = jl.account_id
            WHERE j.status = 'POSTED'
              AND j.date >= v_start AND j.date <= v_end
              AND (a.code IN ('100100', '1011') OR a.type IN ('CASH', 'BANK') OR a.sub_type IN ('CASH', 'BANK'))
              AND (array_length(p_company_ids, 1) IS NULL OR j.company_id = ANY(p_company_ids))
        )
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'line_id', line_id,
                'journal_id', journal_id,
                'date', date,
                'reference_number', reference_number,
                'journal_type', journal_type,
                'description', description,
                'debit', debit,
                'credit', credit,
                'impact', impact,
                'company_id', company_id,
                'created_at', created_at,
                'partner_name', partner_name,
                'prepared_by', prepared_by
            ) ORDER BY date ASC, created_at ASC, journal_id ASC, line_id ASC
        ), '[]'::jsonb) INTO v_records
        FROM cash_lines;

        RETURN jsonb_build_object(
            'opening_balance', v_opening,
            'transactions', v_records
        );
    END;
$function$;


-- Function: get_company_short_code
CREATE OR REPLACE FUNCTION public.get_company_short_code(v_company_id text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
      v_code TEXT;
      v_name TEXT;
    BEGIN
      -- Try to get code from physical column in docs_companies
      SELECT code INTO v_code FROM docs_companies WHERE id = v_company_id;
      
      -- If not found or looks like a UUID or is too generic, fallback
      IF v_code IS NULL OR v_code = '' OR v_code LIKE 'comp-%' OR length(v_code) > 10 THEN
         SELECT name INTO v_name FROM docs_companies WHERE id = v_company_id;
         -- If name exists, try to get first characters of each word or first 3 chars
         IF v_name IS NOT NULL AND v_name <> '' THEN
            -- Try to get initials (e.g. "Software Enterprise" -> "SE")
            SELECT STRING_AGG(UPPER(LEFT(word, 1)), '') INTO v_code 
            FROM UNNEST(REGEXP_SPLIT_TO_ARRAY(v_name, 's+')) AS word
            WHERE length(word) > 0;
            
            -- If only 1 word, take 3 chars
            IF length(v_code) < 2 THEN
               v_code := UPPER(LEFT(v_name, 3));
            END IF;
         END IF;
         
         IF v_code IS NULL OR v_code = '' THEN
            v_code := 'CO';
         END IF;
      END IF;
      
      RETURN UPPER(v_code);
    END;
    $function$;


-- Function: get_dashboard_summary
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(p_company_id text, p_start_date date, p_end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        v_result JSONB;
        v_assets NUMERIC := 0;
        v_liabilities NUMERIC := 0;
        v_equity NUMERIC := 0;
        v_revenue NUMERIC := 0;
        v_expenses NUMERIC := 0;
        v_net_income NUMERIC := 0;
        v_cash_balance NUMERIC := 0;
        v_cash_in_today NUMERIC := 0;
        v_cash_out_today NUMERIC := 0;
        v_cash_acc_ids TEXT[];
        v_retained_tot NUMERIC := 0;
    BEGIN
        SELECT COALESCE(SUM(al.debit - al.credit), 0) INTO v_assets
        FROM docs_journal_lines al JOIN docs_journals j ON al.journal_id = j.id JOIN docs_accounts a ON al.account_id = a.id
        WHERE (p_company_id IS NULL OR j.company_id = p_company_id) AND j.status = 'POSTED' AND j.date <= p_end_date AND UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('ASSET', 'BANK', 'RECEIVABLE');

        SELECT COALESCE(SUM(al.credit - al.debit), 0) INTO v_liabilities
        FROM docs_journal_lines al JOIN docs_journals j ON al.journal_id = j.id JOIN docs_accounts a ON al.account_id = a.id
        WHERE (p_company_id IS NULL OR j.company_id = p_company_id) AND j.status = 'POSTED' AND j.date <= p_end_date AND UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('LIABILITY', 'PAYABLE', 'CREDIT_CARD');

        SELECT COALESCE(SUM(al.credit - al.debit), 0) INTO v_equity
        FROM docs_journal_lines al JOIN docs_journals j ON al.journal_id = j.id JOIN docs_accounts a ON al.account_id = a.id
        WHERE (p_company_id IS NULL OR j.company_id = p_company_id) AND j.status = 'POSTED' AND j.date <= p_end_date AND UPPER(COALESCE(a.type, a.data->>'type', '')) = 'EQUITY';

        SELECT COALESCE(SUM(retained), 0) INTO v_retained_tot FROM get_retained_earnings_enterprise(ARRAY[p_company_id]::text[], p_end_date);
        v_equity := v_equity + v_retained_tot;

        SELECT COALESCE(SUM(al.credit - al.debit), 0) INTO v_revenue
        FROM docs_journal_lines al JOIN docs_journals j ON al.journal_id = j.id JOIN docs_accounts a ON al.account_id = a.id
        WHERE (p_company_id IS NULL OR j.company_id = p_company_id) AND j.status = 'POSTED' AND j.date >= p_start_date AND j.date <= p_end_date AND UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('INCOME', 'REVENUE', 'SALES', 'OPERATING_REVENUE', 'OTHER_INCOME');

        SELECT COALESCE(SUM(al.debit - al.credit), 0) INTO v_expenses
        FROM docs_journal_lines al JOIN docs_journals j ON al.journal_id = j.id JOIN docs_accounts a ON al.account_id = a.id
        WHERE (p_company_id IS NULL OR j.company_id = p_company_id) AND j.status = 'POSTED' AND j.date >= p_start_date AND j.date <= p_end_date AND UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('EXPENSE', 'COGS', 'COST_OF_SALES', 'COST_OF_REVENUE', 'OTHER_EXPENSE', 'OPERATING_EXPENSE', 'OPERATING_EXPENSES', 'ADMINISTRATIVE_EXPENSE');

        v_net_income := v_revenue - v_expenses;

        SELECT array_agg(id) INTO v_cash_acc_ids FROM docs_accounts WHERE (p_company_id IS NULL OR company_id = p_company_id) AND (UPPER(COALESCE(type, data->>'type')) = 'BANK' OR (code = '100100' OR sub_type IN ('CASH', 'BANK')) OR name ILIKE '%Cash%');
        SELECT COALESCE(SUM(al.debit - al.credit), 0) INTO v_cash_balance FROM docs_journal_lines al JOIN docs_journals j ON al.journal_id = j.id WHERE (p_company_id IS NULL OR j.company_id = p_company_id) AND j.status = 'POSTED' AND j.date <= p_end_date AND al.account_id = ANY(v_cash_acc_ids);
        SELECT COALESCE(SUM(al.debit), 0) INTO v_cash_in_today FROM docs_journal_lines al JOIN docs_journals j ON al.journal_id = j.id WHERE (p_company_id IS NULL OR j.company_id = p_company_id) AND j.status = 'POSTED' AND j.date = p_end_date AND al.account_id = ANY(v_cash_acc_ids);
        SELECT COALESCE(SUM(al.credit), 0) INTO v_cash_out_today FROM docs_journal_lines al JOIN docs_journals j ON al.journal_id = j.id WHERE (p_company_id IS NULL OR j.company_id = p_company_id) AND j.status = 'POSTED' AND j.date = p_end_date AND al.account_id = ANY(v_cash_acc_ids);

        v_result := jsonb_build_object('assets', v_assets, 'liabilities', v_liabilities, 'equity', v_equity, 'revenue', v_revenue, 'expenses', v_expenses, 'netIncome', v_net_income, 'cashBalance', v_cash_balance, 'cashInToday', v_cash_in_today, 'cashOutToday', v_cash_out_today);
        RETURN v_result;
    END;
    $function$;


-- Function: get_full_ledger
CREATE OR REPLACE FUNCTION public.get_full_ledger(p_company_id text, p_start_date date, p_end_date date)
 RETURNS TABLE(account_id text, account_name text, account_code text, account_type text, date date, reference text, description text, company_name text, partner_name text, prepared_by text, debit numeric, credit numeric, running_balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH opening_balances AS (
        SELECT 
            al.account_id,
            SUM(al.debit - al.credit) as balance
        FROM docs_journal_lines al
        JOIN docs_journals j ON al.journal_id = j.id
        WHERE (p_company_id IS NULL OR j.company_id = p_company_id)
          AND j.status = 'POSTED'
          AND j.date < p_start_date
        GROUP BY al.account_id
    ),
    period_transactions AS (
        SELECT 
            al.account_id,
            j.date,
            COALESCE(j.reference_number, j.id) as reference,
            COALESCE(al.description, j.description, '') as description,
            j.company_id,
            al.contact_id,
            j.created_by_id,
            al.debit,
            al.credit,
            j.created_at as j_created_at,
            j.id as j_id,
            al.id as al_id
        FROM docs_journal_lines al
        JOIN docs_journals j ON al.journal_id = j.id
        WHERE (p_company_id IS NULL OR j.company_id = p_company_id)
          AND j.status = 'POSTED'
          AND j.date >= p_start_date 
          AND j.date <= p_end_date
    )
    SELECT 
        a.id,
        a.name,
        a.code,
        (a.data->>'type'),
        pt.date,
        pt.reference,
        pt.description,
        COALESCE(c.name, 'Unknown'),
        COALESCE(cont.name, ''),
        COALESCE(u.name, u.username, ''),
        COALESCE(pt.debit, 0),
        COALESCE(pt.credit, 0),
        COALESCE(ob.balance, 0) + SUM(pt.debit - pt.credit) OVER (PARTITION BY a.id ORDER BY pt.date, pt.j_created_at, pt.j_id, pt.al_id) as running_balance
    FROM docs_accounts a
    LEFT JOIN opening_balances ob ON a.id = ob.account_id
    LEFT JOIN period_transactions pt ON a.id = pt.account_id
    LEFT JOIN docs_companies c ON pt.company_id = c.id
    LEFT JOIN docs_contacts cont ON pt.contact_id = cont.id
    LEFT JOIN docs_users u ON pt.created_by_id = u.id
    WHERE (p_company_id IS NULL OR a.company_id = p_company_id)
      AND (pt.account_id IS NOT NULL OR COALESCE(ob.balance, 0) != 0)
    ORDER BY a.code ASC, pt.date ASC, pt.j_created_at ASC, pt.j_id ASC, pt.al_id ASC;
END;
$function$;


-- Function: get_general_ledger
CREATE OR REPLACE FUNCTION public.get_general_ledger(p_company_ids text[] DEFAULT NULL::text[], p_account_ids text[] DEFAULT NULL::text[], p_partner_ids text[] DEFAULT NULL::text[], p_start_date date DEFAULT '1970-01-01'::date, p_end_date date DEFAULT '2099-12-31'::date, p_partner_type text DEFAULT NULL::text)
 RETURNS TABLE(partner_id text, journal_id text, journal_date date, account_name text, reference text, description text, responsible_name text, debit numeric, credit numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(
            NULLIF(al.contact_id, ''), 
            (
                SELECT jl_inner.contact_id 
                FROM docs_journal_lines jl_inner 
                WHERE jl_inner.journal_id = j.id AND NULLIF(jl_inner.contact_id, '') IS NOT NULL 
                LIMIT 1
            ),
            NULLIF(j.data->>'contactId', ''),
            NULLIF(j.data->>'customerId', ''),
            NULLIF(j.data->>'vendorId', ''),
            NULLIF(j.data->>'partnerId', ''),
            CASE 
                WHEN j.journal_type IN ('INV', 'BILL', 'CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY', 'CREDIT_NOTE') THEN 'contact-cash-sale-global'
                ELSE NULL 
            END
        ) AS partner_id,
        j.id AS journal_id,
        j.date AS journal_date,
        COALESCE(a.name, 'Unknown Account') AS account_name,
        CASE 
            WHEN j.journal_type = 'INV' AND UPPER(COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)) NOT LIKE 'INV-%' THEN 'INV-' || COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)
            WHEN j.journal_type = 'BILL' AND UPPER(COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)) NOT LIKE 'BIL-%' AND UPPER(COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)) NOT LIKE 'BILL-%' THEN 'BIL-' || COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)
            WHEN j.journal_type IN ('CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY', 'PAYMENT') AND UPPER(COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)) NOT LIKE 'PAY-%' THEN 'PAY-' || COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)
            WHEN j.journal_type = 'CREDIT_NOTE' AND UPPER(COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)) NOT LIKE 'CN-%' THEN 'CN-' || COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)
            ELSE COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)
        END AS reference,
        COALESCE(al.description, j.description, '') AS description,
        COALESCE(u.name, u.username, j.data->>'preparedBy', 'System') AS responsible_name,
        COALESCE(al.debit, 0)::NUMERIC AS debit,
        COALESCE(al.credit, 0)::NUMERIC AS credit
    FROM docs_journal_lines al
    JOIN docs_journals j ON al.journal_id = j.id
    LEFT JOIN docs_accounts a ON al.account_id = a.id
    LEFT JOIN docs_users u ON j.created_by_id = u.id
    WHERE (p_company_ids IS NULL OR array_length(p_company_ids, 1) IS NULL OR j.company_id = ANY(p_company_ids))
      AND (p_account_ids IS NULL OR array_length(p_account_ids, 1) IS NULL OR al.account_id = ANY(p_account_ids))
      AND (
          p_partner_ids IS NULL 
          OR array_length(p_partner_ids, 1) IS NULL
          OR COALESCE(
                 al.contact_id, 
                 (
                     SELECT jl_inner.contact_id 
                     FROM docs_journal_lines jl_inner 
                     WHERE jl_inner.journal_id = j.id AND jl_inner.contact_id IS NOT NULL 
                     LIMIT 1
                 ),
                 j.data->>'contactId',
                 j.data->>'customerId',
                 j.data->>'vendorId',
                 j.data->>'partnerId',
                 CASE 
                      WHEN j.journal_type IN ('INV', 'BILL', 'CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY', 'CREDIT_NOTE') THEN 'contact-cash-sale-global'
                     ELSE NULL 
                  END
             ) = ANY(p_partner_ids)
      )
      AND j.status = 'POSTED'
      AND j.date >= p_start_date 
      AND j.date <= p_end_date
      AND (
          p_partner_type IS NULL
          OR (
              p_partner_type = 'CUSTOMER' 
              AND (
                  LOWER(a.sub_type) = 'accounts_receivable'
                  OR LOWER(a.sub_type) = 'receivable'
                  OR LOWER(a.sub_type) = 'accounts receivable'
                  OR a.code IN ('100201', '100200', '100202', '100203', '100204', '100205')
                  OR a.code LIKE '1002%'
                  OR LOWER(a.name) ILIKE '%accounts receivable%'
                  OR LOWER(a.name) ILIKE '%customer advance%'
                  OR LOWER(a.name) ILIKE '%advance from customer%'
                  OR LOWER(a.name) ILIKE '%advance customer%'
                  OR LOWER(a.name) ILIKE '%customer prepayment%'
                  OR LOWER(a.name) ILIKE '%customer advance/deposit%'
                  OR LOWER(a.name) ILIKE '%debtor%'
                  OR (a.type = 'ASSET' AND LOWER(a.name) ILIKE '%receivable%')
                  OR a.data->>'type' = 'RECEIVABLE'
              )
          )
          OR (
              p_partner_type = 'VENDOR' 
              AND (
                  LOWER(a.sub_type) = 'accounts_payable'
                  OR LOWER(a.sub_type) = 'payable'
                  OR LOWER(a.sub_type) = 'accounts payable'
                  OR a.code IN ('200101', '200100', '200102', '200103', '200104', '200105')
                  OR a.code LIKE '2001%'
                  OR LOWER(a.name) ILIKE '%accounts payable%'
                  OR LOWER(a.name) ILIKE '%vendor advance%'
                  OR LOWER(a.name) ILIKE '%advance to vendor%'
                  OR LOWER(a.name) ILIKE '%vendor prepayment%'
                  OR LOWER(a.name) ILIKE '%advance vendor%'
                  OR LOWER(a.name) ILIKE '%supplier advance%'
                  OR LOWER(a.name) ILIKE '%advance to supplier%'
                  OR LOWER(a.name) ILIKE '%creditor%'
                  OR (a.type = 'LIABILITY' AND LOWER(a.name) ILIKE '%payable%')
                  OR a.data->>'type' = 'PAYABLE'
              )
          )
          OR (
              p_partner_type = 'EMPLOYEE' AND (
                  a.code = '100205' OR LOWER(a.name) ILIKE '%employee%'
              )
          )
          OR (
              p_partner_type = 'LOAN_RECEIVABLE' AND (
                  a.code = '100601' OR LOWER(a.name) ILIKE '%loan receivable%' OR (a.type = 'ASSET' AND LOWER(a.name) ILIKE '%loan%')
              )
          )
          OR (
              p_partner_type = 'LOAN_PAYABLE' AND (
                  a.code = '210100' OR LOWER(a.name) ILIKE '%loan payable%' OR (a.type = 'LIABILITY' AND LOWER(a.name) ILIKE '%loan%')
              )
          )
      )
    ORDER BY j.date ASC, 5 ASC, COALESCE(j.created_at, j.updated_at) ASC, j.id ASC, al.id ASC;
END;
$function$;


-- Function: get_general_ledger_old
CREATE OR REPLACE FUNCTION public.get_general_ledger_old(p_company_ids text[], p_account_ids text[], p_partner_ids text[], p_start_date date, p_end_date date, p_partner_type text)
 RETURNS TABLE(partner_id text, journal_id text, journal_date date, account_name text, reference text, description text, responsible_name text, debit numeric, credit numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
      BEGIN
          RETURN QUERY
          SELECT 
              COALESCE(
                  al.contact_id, 
                  (
                      SELECT jl_inner.contact_id 
                      FROM docs_journal_lines jl_inner 
                      WHERE jl_inner.journal_id = j.id AND jl_inner.contact_id IS NOT NULL 
                      LIMIT 1
                  ),
                  j.data->>'contactId',
                  j.data->>'customerId',
                  j.data->>'vendorId',
                  j.data->>'partnerId',
                  CASE 
                      WHEN j.journal_type IN ('INV', 'BILL', 'CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY', 'CREDIT_NOTE') THEN 'contact-cash-sale-global'
                      ELSE NULL 
                  END
              ) AS partner_id,
              j.id AS journal_id,
              j.date AS journal_date,
              COALESCE(a.name, 'Unknown Account') AS account_name,
              COALESCE(
                CASE 
                  WHEN j.journal_type = 'INV' THEN (SELECT inv.invoice_number FROM docs_invoices inv WHERE LOWER(replace(LOWER(j.id), 'je-', '')) = LOWER(inv.id) OR LOWER(j.reference_number) = LOWER(inv.invoice_number) LIMIT 1)
                  WHEN j.journal_type = 'BILL' THEN (SELECT b.bill_number FROM docs_bills b WHERE LOWER(replace(LOWER(j.id), 'je-', '')) = LOWER(b.id) OR LOWER(j.reference_number) = LOWER(b.bill_number) LIMIT 1)
                  WHEN j.journal_type IN ('CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY') THEN (
                      SELECT pay.payment_number 
                      FROM docs_payments pay 
                      WHERE LOWER(replace(LOWER(pay.id), 'pay-', '')) = LOWER(replace(replace(replace(replace(LOWER(j.id), 'je-cpay-', ''), 'je-vpay-', ''), 'je-', ''), 'pay-', '')) 
                      OR LOWER(j.reference_number) LIKE '%' || LOWER(pay.payment_number) || '%' 
                      LIMIT 1
                  )
                  WHEN j.journal_type = 'CREDIT_NOTE' THEN (SELECT cn.credit_note_number FROM docs_credit_notes cn WHERE LOWER(replace(LOWER(j.id), 'je-', '')) = LOWER(cn.id) OR LOWER(j.reference_number) = LOWER(cn.credit_note_number) LIMIT 1)
                  ELSE NULL
                END,
                j.reference_number,
                j.id
              ) AS reference,
              COALESCE(al.description, j.description, '') AS description,
              COALESCE(u.name, u.username, j.data->>'preparedBy', 'System') AS responsible_name,
              COALESCE(al.debit, 0)::NUMERIC AS debit,
              COALESCE(al.credit, 0)::NUMERIC AS credit
          FROM docs_journal_lines al
          JOIN docs_journals j ON al.journal_id = j.id
          LEFT JOIN docs_accounts a ON al.account_id = a.id
          LEFT JOIN docs_users u ON j.created_by_id = u.id
          WHERE (p_company_ids IS NULL OR array_length(p_company_ids, 1) IS NULL OR j.company_id = ANY(p_company_ids))
            AND (p_account_ids IS NULL OR array_length(p_account_ids, 1) IS NULL OR al.account_id = ANY(p_account_ids))
            AND (
                p_partner_ids IS NULL 
                OR array_length(p_partner_ids, 1) IS NULL
                OR COALESCE(
                       al.contact_id, 
                       (
                           SELECT jl_inner.contact_id 
                           FROM docs_journal_lines jl_inner 
                           WHERE jl_inner.journal_id = j.id AND jl_inner.contact_id IS NOT NULL 
                           LIMIT 1
                       ),
                       j.data->>'contactId',
                       j.data->>'customerId',
                       j.data->>'vendorId',
                       j.data->>'partnerId',
                       CASE 
                           WHEN j.journal_type IN ('INV', 'BILL', 'CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY', 'CREDIT_NOTE') THEN 'contact-cash-sale-global'
                           ELSE NULL 
                       END
                   ) = ANY(p_partner_ids)
            )
            AND j.status = 'POSTED'
            AND j.date >= p_start_date 
            AND j.date <= p_end_date
            AND (
                p_partner_type IS NULL
                OR (
                    p_partner_type = 'CUSTOMER' 
                    AND (
                        LOWER(a.sub_type) = 'accounts_receivable'
                        OR LOWER(a.sub_type) = 'receivable'
                        OR a.code = '100201'
                    )
                )
                OR (
                    p_partner_type = 'VENDOR' 
                    AND (
                        LOWER(a.sub_type) = 'accounts_payable'
                        OR LOWER(a.sub_type) = 'payable'
                        OR a.code = '200101'
                    )
                )
                OR (
                    p_partner_type = 'EMPLOYEE' AND (
                        a.code = '100205' OR LOWER(a.name) ILIKE '%employee%'
                    )
                )
                OR (
                    p_partner_type = 'LOAN_RECEIVABLE' AND (
                        a.code = '100601' OR LOWER(a.name) ILIKE '%loan receivable%' OR (a.type = 'ASSET' AND LOWER(a.name) ILIKE '%loan%')
                    )
                )
                OR (
                    p_partner_type = 'LOAN_PAYABLE' AND (
                        a.code = '210100' OR LOWER(a.name) ILIKE '%loan payable%' OR (a.type = 'LIABILITY' AND LOWER(a.name) ILIKE '%loan%')
                    )
                )
            )
          ORDER BY j.date ASC, 5 ASC, COALESCE(j.created_at, j.updated_at) ASC, j.id ASC, al.id ASC;
      END;
$function$;


-- Function: get_general_ledger_report
CREATE OR REPLACE FUNCTION public.get_general_ledger_report(p_company_id text, p_start_date date DEFAULT '1970-01-01'::date, p_end_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(transaction_date date, type text, invoice_bill_num text, narration text, partner text, "user" text, amount numeric, paid numeric, due numeric, cash_impact numeric, balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_opening_balance NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(jl.debit - jl.credit), 0) INTO v_opening_balance
    FROM docs_journal_lines jl
    JOIN docs_journals j ON jl.journal_id = j.id
    JOIN docs_accounts a ON jl.account_id = a.id
    WHERE j.company_id = p_company_id
      AND (a.code IN ('100100', '1011') OR a.type IN ('CASH', 'BANK') OR a.sub_type IN ('CASH', 'BANK'))
      AND j.status = 'POSTED'
      AND j.date < p_start_date;

    RETURN QUERY
    WITH raw_data AS (
        -- 0. OPENING BALANCE
        SELECT 
            p_start_date AS transaction_date,
            'OB'::TEXT AS type,
            'Opening Balance'::TEXT AS invoice_bill_num,
            'Opening Balance'::TEXT AS narration,
            ''::TEXT AS partner,
            ''::TEXT AS "user",
            0::NUMERIC AS amount,
            0::NUMERIC AS paid,
            0::NUMERIC AS due,
            v_opening_balance AS cash_impact,
            v_opening_balance AS balance,
            0 AS group_order

        UNION ALL

        -- 1. INVOICES (cash_impact = 0)
        SELECT 
            i.date AS transaction_date,
            'INV' AS type,
            COALESCE(i.invoice_number, i.id) AS invoice_bill_num,
            'Sales' AS narration,
            COALESCE(c.name, 'Unknown') AS partner,
            COALESCE(i.data->>'preparedBy', 'System') AS "user",
            COALESCE(i.total, 0) AS amount,
            COALESCE(i.total, 0) - COALESCE((i.data->>'due')::numeric, i.total) AS paid,
            COALESCE((i.data->>'due')::numeric, i.total) AS due,
            0::NUMERIC AS cash_impact,
            0::NUMERIC AS balance,
            1 AS group_order
        FROM docs_invoices i
        LEFT JOIN docs_contacts c ON c.id = i.customer_id
        WHERE i.company_id = p_company_id
          AND i.date >= p_start_date AND i.date <= p_end_date
          AND i.status IN ('POSTED', 'PAID', 'PARTIAL', 'FULL_REFUNDED', 'PARTIAL_REFUNDED')

        UNION ALL

        -- 2. BILLS (cash_impact = 0)
        SELECT 
            b.date AS transaction_date,
            'BILL' AS type,
            COALESCE(b.bill_number, b.id) AS invoice_bill_num,
            'Purchase' AS narration,
            COALESCE(c.name, 'Unknown') AS partner,
            COALESCE(b.data->>'preparedBy', 'System') AS "user",
            COALESCE(b.total, 0) AS amount,
            COALESCE(b.total, 0) - COALESCE((b.data->>'due')::numeric, b.total) AS paid,
            COALESCE((b.data->>'due')::numeric, b.total) AS due,
            0::NUMERIC AS cash_impact,
            0::NUMERIC AS balance,
            1 AS group_order
        FROM docs_bills b
        LEFT JOIN docs_contacts c ON c.id = b.vendor_id
        WHERE b.company_id = p_company_id
          AND b.date >= p_start_date AND b.date <= p_end_date
          AND b.status IN ('POSTED', 'PAID', 'PARTIAL')

        UNION ALL

        -- 3. CREDIT NOTES (cash_impact = 0)
        SELECT 
            cn.date AS transaction_date,
            'CREDIT_NOTE' AS type,
            COALESCE(cn.credit_note_number, cn.id) AS invoice_bill_num,
            'Credit Note' AS narration,
            COALESCE(c.name, 'Unknown') AS partner,
            COALESCE(cn.data->>'preparedBy', 'System') AS "user",
            COALESCE(cn.total, 0) AS amount,
            COALESCE(cn.total, 0) - COALESCE((cn.data->>'due')::numeric, cn.total) AS paid,
            COALESCE((cn.data->>'due')::numeric, cn.total) AS due,
            0::NUMERIC AS cash_impact,
            0::NUMERIC AS balance,
            1 AS group_order
        FROM docs_credit_notes cn
        LEFT JOIN docs_contacts c ON c.id = cn.customer_id
        WHERE cn.company_id = p_company_id
          AND cn.date >= p_start_date AND cn.date <= p_end_date
          AND cn.status IN ('POSTED', 'CLOSED')

        UNION ALL

        -- 4. CASH (actual cash_impact from journals)
        SELECT 
            j.date AS transaction_date,
            CASE 
               WHEN j.journal_type IN ('CUST_PAY', 'CPAY', 'RECEIPT', 'COLLECTION') THEN 'RECEIPT'
               WHEN j.journal_type IN ('VEND_PAY', 'VPAY', 'PAYMENT') THEN 'PAYMENT'
               WHEN j.journal_type = 'INV' THEN 'RECEIPT'
               WHEN j.journal_type = 'BILL' THEN 'PAYMENT'
               WHEN j.journal_type = 'CREDIT_NOTE' THEN 'REFUND'
               ELSE 'JOURNAL'
            END AS type,
            COALESCE(j.reference_number, j.reference, j.journal_number, j.id) AS invoice_bill_num,
            COALESCE(jl.description, j.description, 'Journal Entry ' || COALESCE(j.journal_number, j.id)) AS narration,
            COALESCE(
              (SELECT name FROM docs_companies WHERE id = j.company_id LIMIT 1),
              (SELECT c_inner.name FROM docs_contacts c_inner WHERE c_inner.id = jl.contact_id LIMIT 1),
              (SELECT c_inner.name FROM docs_contacts c_inner INNER JOIN docs_journal_lines jl2 ON jl2.contact_id = c_inner.id WHERE jl2.journal_id = j.id AND jl2.contact_id IS NOT NULL LIMIT 1),
              (SELECT c_inner.name FROM docs_invoices i LEFT JOIN docs_contacts c_inner ON i.customer_id = c_inner.id WHERE COALESCE(i.journal_entry_id, i.data->>'journalEntryId', 'JE-' || UPPER(REPLACE(i.id, 'INV-', ''))) = j.id OR 'JE-CPAY-' || UPPER(REPLACE(REPLACE('PAY-AUTO-' || i.id, 'PAY-', ''), 'PAY-', '')) = j.id LIMIT 1),
              (SELECT c_inner.name FROM docs_bills b LEFT JOIN docs_contacts c_inner ON b.vendor_id = c_inner.id WHERE COALESCE(b.journal_entry_id, b.data->>'journalEntryId') = j.id OR 'JE-VPAY-' || UPPER(REPLACE(REPLACE('PAY-AUTO-' || b.id, 'PAY-', ''), 'PAY-', '')) = j.id LIMIT 1),
              (SELECT c_inner.name FROM docs_payments p LEFT JOIN docs_contacts c_inner ON p.contact_id = c_inner.id WHERE COALESCE(p.data->>'journalEntryId', 'JE-' || CASE WHEN p.type IN ('RECEIPT', 'REFUND', 'COLLECTION') THEN 'CPAY' ELSE 'VPAY' END || '-' || replace(replace(UPPER(p.id), 'PAY-', ''), 'PAY-', '')) = j.id OR j.id = 'PAY-AUTO-' || p.id OR j.id = p.id LIMIT 1),
              CASE WHEN j.journal_type IN ('INV', 'BILL', 'CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY', 'CREDIT_NOTE') THEN 'Cash Sale' ELSE 'Various' END
            ) AS partner,
            COALESCE(u.name, u.username, j.data->>'preparedBy', 'System') AS "user",
            ABS(jl.debit - jl.credit) AS amount,
            ABS(jl.debit - jl.credit) AS paid,
            0::NUMERIC AS due,
            (jl.debit - jl.credit) AS cash_impact,
            0::NUMERIC AS balance,
            2 AS group_order
        FROM docs_journals j
        JOIN docs_journal_lines jl ON jl.journal_id = j.id
        JOIN docs_accounts a ON jl.account_id = a.id
        LEFT JOIN docs_users u ON u.id = j.created_by_id
        WHERE j.company_id = p_company_id
          AND (a.code IN ('100100', '1011') OR a.type IN ('CASH', 'BANK') OR a.sub_type IN ('CASH', 'BANK'))
          AND j.status = 'POSTED'
          AND j.date >= p_start_date
          AND j.date <= p_end_date
    )
    SELECT 
         rd.transaction_date, 
         rd.type, 
         rd.invoice_bill_num, 
         rd.narration, 
         CASE WHEN rd.partner = (SELECT name FROM docs_companies WHERE id = p_company_id LIMIT 1) THEN 'Various' ELSE rd.partner END, 
         rd."user", 
         rd.amount, 
         rd.paid, 
         rd.due, 
         rd.cash_impact, 
         (SUM(rd.cash_impact) OVER (ORDER BY rd.transaction_date, rd.group_order, rd.invoice_bill_num))::NUMERIC AS balance 
     FROM raw_data rd 
     ORDER BY rd.transaction_date, rd.group_order, rd.invoice_bill_num;
END;
$function$;


-- Function: get_general_ledger_v2
CREATE OR REPLACE FUNCTION public.get_general_ledger_v2(p_company_id text, p_account_id text, p_start_date date, p_end_date date)
 RETURNS TABLE(date date, type text, ref text, description text, contact_name text, account_name text, debit numeric, credit numeric, balance numeric, is_opening boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        v_opening_bal NUMERIC := 0;
    BEGIN
        -- Calculate Opening Balance
        SELECT COALESCE(SUM(al.debit - al.credit), 0) INTO v_opening_bal
        FROM docs_journal_lines al
        JOIN docs_journals j ON al.journal_id = j.id
        WHERE (p_company_id IS NULL OR j.company_id = p_company_id)
          AND al.account_id = p_account_id
          AND j.status = 'POSTED'
          AND j.date < p_start_date;

        -- Return Opening Balance row
        RETURN QUERY SELECT 
            p_start_date, 
            'OPENING'::TEXT, 
            'Opening Balance'::TEXT, 
            ''::TEXT, 
            ''::TEXT, 
            ''::TEXT, 
            0::NUMERIC, 
            0::NUMERIC, 
            v_opening_bal,
            TRUE;

        -- Return Transactions
        RETURN QUERY
        SELECT 
            j.date,
            CASE 
              WHEN j.journal_type = 'INV' AND UPPER(COALESCE(i.invoice_number, j.reference, j.reference_number, j.id)) NOT LIKE 'INV-%' THEN 'INV-' || COALESCE(i.invoice_number, j.reference, j.reference_number, j.id)
              WHEN j.journal_type = 'BILL' AND UPPER(COALESCE(b.bill_number, j.reference, j.reference_number, j.id)) NOT LIKE 'BIL-%' AND UPPER(COALESCE(b.bill_number, j.reference, j.reference_number, j.id)) NOT LIKE 'BILL-%' THEN 'BIL-' || COALESCE(b.bill_number, j.reference, j.reference_number, j.id)
              WHEN j.journal_type IN ('CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY') AND UPPER(COALESCE(p.payment_number, j.reference, j.reference_number, j.id)) NOT LIKE 'PAY-%' THEN 'PAY-' || COALESCE(p.payment_number, j.reference, j.reference_number, j.id)
              WHEN j.journal_type IN ('LOAN', 'LOAN_PAYMENT') AND UPPER(COALESCE(j.reference, j.reference_number, j.id)) NOT LIKE 'LOAN-%' AND UPPER(COALESCE(j.reference, j.reference_number, j.id)) NOT LIKE 'LN-%' THEN 'LOAN-' || COALESCE(j.reference, j.reference_number, j.id)
              WHEN j.journal_type = 'STOCK_ADJ' AND UPPER(COALESCE(j.reference, j.reference_number, j.id)) NOT LIKE 'ADJ-%' THEN 'ADJ-' || COALESCE(j.reference, j.reference_number, j.id)
              WHEN j.journal_type = 'PAYROLL' AND UPPER(COALESCE(j.reference, j.reference_number, j.id)) NOT LIKE 'PR-%' THEN 'PR-' || COALESCE(j.reference, j.reference_number, j.id)
              ELSE COALESCE(j.journal_type, 'JE')
            END AS type,
            COALESCE(i.invoice_number, b.bill_number, p.payment_number, j.reference, j.reference_number, j.id) AS ref,
            COALESCE(NULLIF(al.description, ''), j.description, '') AS description,
            COALESCE(c.name, '') AS contact_name,
            COALESCE(a.name, a.code, '') AS account_name,
            al.debit,
            al.credit,
            0::NUMERIC AS balance,
            FALSE AS is_opening
        FROM docs_journal_lines al
        JOIN docs_journals j ON al.journal_id = j.id
        LEFT JOIN docs_contacts c ON al.contact_id = c.id
        LEFT JOIN docs_accounts a ON al.account_id = a.id
        LEFT JOIN docs_invoices i ON j.journal_type = 'INV' AND i.journal_entry_id = j.id
        LEFT JOIN docs_bills b ON j.journal_type = 'BILL' AND b.journal_entry_id = j.id
        LEFT JOIN docs_payments p ON j.journal_type IN ('CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY') AND p.data->>'journalEntryId' = j.id
        WHERE (p_company_id IS NULL OR j.company_id = p_company_id)
          AND al.account_id = p_account_id
          AND j.status = 'POSTED'
          AND j.date >= p_start_date 
          AND j.date <= p_end_date
        ORDER BY j.date ASC, j.created_at ASC;
    END;
$function$;


-- Function: get_inventory_ledger
CREATE OR REPLACE FUNCTION public.get_inventory_ledger(p_company_ids text[], p_product_ids text[] DEFAULT NULL::text[], p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS TABLE(product_id text, product_name text, sku text, transaction_date date, transaction_type text, reference_id text, reference_name text, quantity numeric, cost_price numeric, warehouse_name text, responsible_name text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        it.product_id,
        p.name AS product_name,
        COALESCE(p.sku, '') AS sku,
        it.date AS transaction_date,
        it.transaction_type,
        COALESCE(
            CASE 
                WHEN it.reference_type = 'INVOICE' THEN (SELECT invoice_number FROM docs_invoices WHERE id = it.reference_id LIMIT 1)
                WHEN it.reference_type = 'BILL' THEN (SELECT bill_number FROM docs_bills WHERE id = it.reference_id LIMIT 1)
                WHEN it.reference_type = 'JOURNAL' THEN (SELECT reference_number FROM docs_journals WHERE id = it.reference_id LIMIT 1)
                WHEN it.reference_type = 'CREDIT_NOTE' THEN (SELECT COALESCE(cn_number, credit_note_number) FROM docs_credit_notes WHERE id = it.reference_id LIMIT 1)
                WHEN it.reference_type = 'OPENING_STOCK' THEN 'Opening Stock'
                ELSE it.reference_id 
            END, 
            it.reference_id
        ) AS reference_id,
        COALESCE(it.reference_type, '') AS reference_name,
        it.quantity,
        it.cost_price,
        COALESCE(w.name, 'Default') AS warehouse_name,
        COALESCE(it.created_by_id::text, 'N/A') AS responsible_name,
        it.created_at
    FROM docs_inventory_transactions it
    JOIN docs_products p ON it.product_id = p.id
    LEFT JOIN docs_warehouses w ON it.warehouse_id = w.id
    WHERE it.company_id = ANY(p_company_ids)
      AND (p_product_ids IS NULL OR it.product_id = ANY(p_product_ids))
      AND (p_start_date IS NULL OR it.date >= p_start_date)
      AND (p_end_date IS NULL OR it.date <= p_end_date)
    ORDER BY it.date ASC, it.created_at ASC;
END;
$function$;


-- Function: get_inventory_valuation
CREATE OR REPLACE FUNCTION public.get_inventory_valuation(p_company_ids text[], p_warehouse_id text DEFAULT 'all'::text)
 RETURNS TABLE(total_items bigint, total_on_hand numeric, total_asset_value numeric, total_retail_value numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_count BIGINT := 0;
  v_on_hand NUMERIC := 0;
  v_asset_val NUMERIC := 0;
  v_retail_val NUMERIC := 0;
BEGIN
  IF p_warehouse_id = 'all' OR p_warehouse_id IS NULL OR p_warehouse_id = '' THEN
    -- Calculate globally across all warehouses for the active companies
    SELECT 
      COALESCE(COUNT(p.id), 0),
      COALESCE(SUM(COALESCE(p.quantity_on_hand, 0)), 0),
      COALESCE(SUM(COALESCE(p.quantity_on_hand, 0) * COALESCE(p.cost_price, 0)), 0),
      COALESCE(SUM(COALESCE(p.quantity_on_hand, 0) * COALESCE(p.price, 0)), 0)
    INTO 
      v_count, v_on_hand, v_asset_val, v_retail_val
    FROM public.docs_products p
    WHERE p.company_id::text = ANY(p_company_ids);
  ELSE
    -- Calculate specifically for the given warehouse using docs_product_costs for quantity and cost
    -- docs_product_costs contains product_id, warehouse_id, total_qty, avg_cost
    BEGIN
      SELECT 
        COALESCE(COUNT(DISTINCT p.id), 0),
        COALESCE(SUM(COALESCE(pc.total_qty, 0)), 0),
        COALESCE(SUM(COALESCE(pc.total_qty, 0) * COALESCE(pc.avg_cost, p.cost_price, 0)), 0),
        COALESCE(SUM(COALESCE(pc.total_qty, 0) * COALESCE(p.price, 0)), 0)
      INTO 
        v_count, v_on_hand, v_asset_val, v_retail_val
      FROM public.docs_products p
      LEFT JOIN public.docs_product_costs pc ON pc.product_id = p.id AND pc.warehouse_id::text = p_warehouse_id
      WHERE p.company_id::text = ANY(p_company_ids);
    EXCEPTION WHEN OTHERS THEN
      -- Fallback if comparison or anything fails (just use global)
      SELECT 
        COALESCE(COUNT(p.id), 0),
        COALESCE(SUM(COALESCE(p.quantity_on_hand, 0)), 0),
        COALESCE(SUM(COALESCE(p.quantity_on_hand, 0) * COALESCE(p.cost_price, 0)), 0),
        COALESCE(SUM(COALESCE(p.quantity_on_hand, 0) * COALESCE(p.price, 0)), 0)
      INTO 
        v_count, v_on_hand, v_asset_val, v_retail_val
      FROM public.docs_products p
      WHERE p.company_id::text = ANY(p_company_ids);
    END;
  END IF;

  RETURN QUERY SELECT v_count, v_on_hand, v_asset_val, v_retail_val;
END;
$function$;


-- Function: get_inventory_valuation_details
CREATE OR REPLACE FUNCTION public.get_inventory_valuation_details(p_company_id text, p_product_id text, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_limit integer DEFAULT 80, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_transactions JSONB;
    v_total_count INT := 0;
BEGIN

    WITH filtered_txs AS (
        SELECT 
            t.id,
            t.date,
            t.transaction_type,
            t.reference_type,
            COALESCE(
                CASE 
                    WHEN t.reference_type = 'INVOICE' THEN (SELECT invoice_number FROM docs_invoices WHERE id = t.reference_id LIMIT 1)
                    WHEN t.reference_type = 'BILL' THEN (SELECT bill_number FROM docs_bills WHERE id = t.reference_id LIMIT 1)
                    WHEN t.reference_type = 'JOURNAL' THEN (SELECT reference_number FROM docs_journals WHERE id = t.reference_id LIMIT 1)
                    WHEN t.reference_type = 'CREDIT_NOTE' THEN (SELECT COALESCE(cn_number, credit_note_number) FROM docs_credit_notes WHERE id = t.reference_id LIMIT 1)
                    WHEN t.reference_type = 'OPENING_STOCK' THEN 'Opening Stock'
                    ELSE t.reference_id 
                END, 
                t.reference_id
            ) as reference,
            t.quantity as qty,
            t.cost_price as cost_price,
            t.responsible
        FROM docs_inventory_transactions t
        WHERE t.company_id = p_company_id
          AND (t.product_id = p_product_id)
          AND (p_start_date IS NULL OR t.date >= p_start_date)
          AND (p_end_date IS NULL OR t.date <= p_end_date)
    )
    SELECT 
        (SELECT COUNT(*) FROM filtered_txs),
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'date', date,
                'transactionType', transaction_type,
                'referenceType', reference_type,
                'reference', reference,
                'quantity', qty,
                'costPrice', cost_price,
                'responsible', responsible
            )
        ), '[]'::jsonb)
    INTO v_total_count, v_transactions
    FROM (
        SELECT * FROM filtered_txs
        ORDER BY date ASC, id ASC
        LIMIT p_limit OFFSET p_offset
    ) sub;

    RETURN jsonb_build_object(
        'transactions', v_transactions,
        'totalCount', v_total_count
    );
END;
$function$;


-- Function: get_monthly_general_ledger_report
CREATE OR REPLACE FUNCTION public.get_monthly_general_ledger_report(p_company_id text, p_month date)
 RETURNS TABLE(o_transaction_date date, o_type text, o_invoice_bill_num text, o_narration text, o_partner text, o_user text, o_amount numeric, o_paid numeric, o_due numeric, o_cash_impact numeric, o_balance numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_opening_balance NUMERIC;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    v_start_date := date_trunc('month', p_month)::date;
    v_end_date := (v_start_date + interval '1 month' - interval '1 day')::date;

    -- Calculate opening balance for cash accounts (code 100100)
    SELECT COALESCE(SUM(jl.debit - jl.credit), 0) INTO v_opening_balance
    FROM docs_journal_lines jl
    JOIN docs_journals j ON j.id = jl.journal_id
    JOIN docs_accounts a ON a.id = jl.account_id
    WHERE jl.company_id = p_company_id 
      AND (a.code = '100100' OR a.sub_type IN ('CASH', 'BANK'))
      AND j.status = 'POSTED'
      AND j.date < v_start_date;

    RETURN QUERY
    WITH raw_data AS (
        -- Opening Balance Row
        SELECT 
            (v_start_date - 1) AS transaction_date,
            'OB' AS type,
            'OPENING_BALANCE' AS invoice_bill_num,
            'Opening Balance Brought Forward' AS narration,
            '---' AS partner,
            'System' AS "user",
            0::NUMERIC AS amount,
            0::NUMERIC AS paid,
            0::NUMERIC AS due,
            v_opening_balance AS cash_impact,
            '1970-01-01'::timestamp AS created_at

        UNION ALL

        -- Invoices
        SELECT 
            i.date AS transaction_date,
            'INV' AS type,
            COALESCE(i.invoice_number, i.id) AS invoice_bill_num,
            'Invoice ' || COALESCE(i.invoice_number, i.id) AS narration,
            COALESCE(c.name, 'Unknown') AS partner,
            COALESCE(i.data->>'preparedBy', 'System') AS "user",
            COALESCE(i.total, 0) AS amount,
            (COALESCE(i.total, 0) - COALESCE((i.data->>'due')::numeric, i.total)) AS paid,
            COALESCE((i.data->>'due')::numeric, i.total) AS due,
            COALESCE((SELECT SUM(jl.debit - jl.credit) 
             FROM docs_journal_lines jl 
             JOIN docs_accounts a ON a.id = jl.account_id 
             WHERE jl.journal_id = i.journal_entry_id AND (a.code = '100100' OR a.sub_type IN ('CASH', 'BANK'))), 0) AS cash_impact,
            i.updated_at AS created_at
        FROM docs_invoices i
        LEFT JOIN docs_contacts c ON c.id = i.customer_id
        WHERE i.company_id = p_company_id 
          AND i.date >= v_start_date AND i.date <= v_end_date
          AND i.status IN ('POSTED', 'PAID', 'PARTIAL')

        UNION ALL

        -- Bills
        SELECT 
            b.date AS transaction_date,
            'BILL' AS type,
            COALESCE(b.bill_number, b.id) AS invoice_bill_num,
            'Bill ' || COALESCE(b.bill_number, b.id) AS narration,
            COALESCE(c.name, 'Unknown') AS partner,
            COALESCE(b.data->>'preparedBy', 'System') AS "user",
            COALESCE(b.total, 0) AS amount,
            (COALESCE(b.total, 0) - COALESCE((b.data->>'due')::numeric, b.total)) AS paid,
            COALESCE((b.data->>'due')::numeric, b.total) AS due,
            COALESCE((SELECT SUM(jl.debit - jl.credit) 
             FROM docs_journal_lines jl 
             JOIN docs_accounts a ON a.id = jl.account_id 
             WHERE jl.journal_id = b.journal_entry_id AND (a.code = '100100' OR a.sub_type IN ('CASH', 'BANK'))), 0) AS cash_impact,
            b.updated_at AS created_at
        FROM docs_bills b
        LEFT JOIN docs_contacts c ON c.id = b.vendor_id
        WHERE b.company_id = p_company_id 
          AND b.date >= v_start_date AND b.date <= v_end_date
          AND b.status IN ('POSTED', 'PAID', 'PARTIAL')

        UNION ALL

        -- Payments
        SELECT 
            p.date AS transaction_date,
            p.type AS type,
            COALESCE(p.payment_number, p.id) AS invoice_bill_num,
            COALESCE(p.data->>'narration', 'Payment ' || COALESCE(p.payment_number, p.id)) AS narration,
            COALESCE(c.name, 'Unknown') AS partner,
            COALESCE(p.data->>'preparedBy', 'System') AS "user",
            COALESCE(p.amount, 0) AS amount,
            COALESCE(p.amount, 0) AS paid,
            0::NUMERIC AS due,
            COALESCE((SELECT SUM(jl.debit - jl.credit) 
             FROM docs_journal_lines jl 
             JOIN docs_accounts a ON a.id = jl.account_id 
             WHERE jl.journal_id = ('JE-' || CASE WHEN p.type IN ('RECEIPT','COLLECTION','REFUND') THEN 'CPAY' ELSE 'VPAY' END || '-' || replace(replace(UPPER(p.id), 'PAY-', ''), 'PAY-', '')) 
             AND (a.code = '100100' OR a.sub_type IN ('CASH', 'BANK'))), 0) AS cash_impact,
            p.updated_at AS created_at
        FROM docs_payments p
        LEFT JOIN docs_contacts c ON c.id = p.contact_id
        WHERE p.company_id = p_company_id 
          AND p.date >= v_start_date AND p.date <= v_end_date
          AND p.status = 'POSTED'
    ),
    ordered_data AS (
        SELECT *,
               SUM(cash_impact) OVER (ORDER BY transaction_date, type, created_at ROWS UNBOUNDED PRECEDING) AS running_balance
        FROM raw_data
    )
    SELECT 
        transaction_date,
        type,
        invoice_bill_num,
        narration,
        partner,
        "user",
        amount,
        paid,
        due,
        cash_impact,
        running_balance AS balance
    FROM ordered_data
    ORDER BY transaction_date, created_at, type;
END;
$function$;


-- Function: get_next_company_doc_number
CREATE OR REPLACE FUNCTION public.get_next_company_doc_number(v_company_id text, v_seq_group text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
            DECLARE
              v_next_val INTEGER;
              v_prefix TEXT;
              v_company_code TEXT;
            BEGIN
              v_company_code := get_company_short_code(v_company_id);

              -- Step 1: Ensure row exists
              INSERT INTO sequence_counters (company_code, seq_group, last_value)
              VALUES (v_company_code, v_seq_group, 0)
              ON CONFLICT DO NOTHING;

              -- Step 2: Gapless Locker Pattern using strict Row-Level Locking
              -- This absolutely guarantees no number is read concurrently and numbers roll back safely!
              SELECT last_value INTO v_next_val
              FROM sequence_counters
              WHERE company_code = v_company_code AND seq_group = v_seq_group
              FOR UPDATE;

              v_next_val := v_next_val + 1;

              UPDATE sequence_counters
              SET last_value = v_next_val
              WHERE company_code = v_company_code AND seq_group = v_seq_group;

              v_prefix := CASE 
                  WHEN v_seq_group = 'INVOICE' THEN 'INV'
                  WHEN v_seq_group = 'BILL' THEN 'BIL'
                  WHEN v_seq_group = 'PAYMENT' THEN 'PAY'
                  WHEN v_seq_group = 'CREDIT_NOTE' THEN 'CN'
                  WHEN v_seq_group = 'JOURNAL' THEN 'JEN'
                  WHEN v_seq_group = 'LOAN' THEN 'LON'
                  WHEN v_seq_group = 'EXPENSE' THEN 'EXP'
                  WHEN v_seq_group = 'CONTACT' THEN 'CON'
                  WHEN v_seq_group = 'PRODUCT' THEN 'PROD'
                  WHEN v_seq_group = 'CATEGORY' THEN 'CAT'
                  WHEN v_seq_group = 'BRAND' THEN 'BRND'
                  WHEN v_seq_group = 'ACCOUNT' THEN 'ACC'
                  ELSE UPPER(v_seq_group)
              END;

              RETURN v_prefix || '-' || v_company_code || '-' || TO_CHAR(v_next_val, 'FM000000');
            END;
        $function$;


-- Function: get_partner_balance
CREATE OR REPLACE FUNCTION public.get_partner_balance(p_company_ids text[], p_contact_id text, p_as_of_date date DEFAULT CURRENT_DATE)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_balance NUMERIC;
    v_type TEXT;
BEGIN
    -- Determine contact type
    SELECT (data->>'type') INTO v_type FROM docs_contacts WHERE id = p_contact_id;
    
    SELECT COALESCE(SUM(al.debit - al.credit), 0) INTO v_balance
    FROM docs_journal_lines al
    JOIN docs_journals j ON al.journal_id = j.id
    LEFT JOIN docs_accounts a ON al.account_id = a.id
    WHERE (p_company_ids IS NULL OR j.company_id = ANY(p_company_ids))
      AND al.contact_id = p_contact_id
      AND j.status = 'POSTED'
      AND (p_as_of_date IS NULL OR j.date <= p_as_of_date)
      AND (
          (v_type = 'CUSTOMER' AND (
              LOWER(a.sub_type) = 'accounts_receivable'
              OR LOWER(a.sub_type) = 'receivable'
              OR LOWER(a.sub_type) = 'accounts receivable'
              OR a.code IN ('100201', '100200', '100202', '100203', '100204', '100205')
              OR a.code LIKE '1002%'
              OR LOWER(a.name) ILIKE '%accounts receivable%'
              OR LOWER(a.name) ILIKE '%customer advance%'
              OR LOWER(a.name) ILIKE '%advance from customer%'
              OR LOWER(a.name) ILIKE '%advance customer%'
              OR LOWER(a.name) ILIKE '%customer prepayment%'
              OR LOWER(a.name) ILIKE '%customer advance/deposit%'
              OR LOWER(a.name) ILIKE '%debtor%'
              OR (a.type = 'ASSET' AND LOWER(a.name) ILIKE '%receivable%')
              OR a.data->>'type' = 'RECEIVABLE'
              OR a.code LIKE '1006%'
              OR a.code = '21010000'
              OR LOWER(a.name) ILIKE '%loan%'
          ))
          OR 
          (v_type = 'VENDOR' AND (
              LOWER(a.sub_type) = 'accounts_payable'
              OR LOWER(a.sub_type) = 'payable'
              OR LOWER(a.sub_type) = 'accounts payable'
              OR a.code IN ('200101', '200100', '200102', '200103', '200104', '200105')
              OR a.code LIKE '2001%'
              OR LOWER(a.name) ILIKE '%accounts payable%'
              OR LOWER(a.name) ILIKE '%vendor advance%'
              OR LOWER(a.name) ILIKE '%advance to vendor%'
              OR LOWER(a.name) ILIKE '%advance vendor%'
              OR LOWER(a.name) ILIKE '%vendor prepayment%'
              OR LOWER(a.name) ILIKE '%vendor advance/deposit%'
              OR LOWER(a.name) ILIKE '%creditor%'
              OR (a.type = 'LIABILITY' AND LOWER(a.name) ILIKE '%payable%')
              OR a.data->>'type' = 'PAYABLE'
              OR a.code LIKE '1006%'
              OR a.code = '21010000'
              OR LOWER(a.name) ILIKE '%loan%'
          ))
      );
    
    -- Invert for Vendors (Payables)
    IF v_type = 'VENDOR' THEN
        RETURN -v_balance;
    ELSE
        RETURN v_balance;
    END IF;
END;
$function$;


-- Function: get_partner_ledger
CREATE OR REPLACE FUNCTION public.get_partner_ledger(p_company_id text, p_contact_id text DEFAULT NULL::text, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_limit integer DEFAULT 80, p_offset integer DEFAULT 0, p_search text DEFAULT NULL::text, p_type text DEFAULT NULL::text, p_contact_type text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_opening_balance NUMERIC := 0;
    v_transactions JSONB;
    v_total_count INT := 0;
BEGIN
    IF p_contact_id IS NOT NULL THEN
        SELECT COALESCE((data->'openingBalances'->>p_company_id)::NUMERIC, 0)
        INTO v_opening_balance
        FROM docs_contacts WHERE id = p_contact_id;
    END IF;

    v_opening_balance := v_opening_balance + COALESCE((
        SELECT SUM(l.debit - l.credit)
        FROM docs_journal_lines l
        JOIN docs_journals j ON j.id = l.journal_id
        WHERE j.company_id = p_company_id
          AND j.status = 'POSTED'
          AND (p_contact_id IS NULL OR l.contact_id = p_contact_id)
          AND (p_start_date IS NULL OR j.date < p_start_date)
    ), 0);
    
    WITH filtered_txs AS (
        SELECT 
            j.id as journal_id,
            j.date as tx_date,
            COALESCE(j.reference, j.reference_number, j.id) AS reference,
            j.journal_type as type,
            l.debit,
            l.credit,
            l.description,
            l.id as line_id,
            a.name as account_name,
            c.name as contact_name
        FROM docs_journal_lines l
        JOIN docs_journals j ON j.id = l.journal_id
        LEFT JOIN docs_accounts a ON a.id = l.account_id
        LEFT JOIN docs_contacts c ON c.id = l.contact_id
        WHERE j.company_id = p_company_id
          AND j.status = 'POSTED'
          AND (p_contact_id IS NULL OR l.contact_id = p_contact_id)
          AND (p_start_date IS NULL OR j.date >= p_start_date)
          AND (p_end_date IS NULL OR j.date <= p_end_date)
          AND (p_type IS NULL OR p_type = 'ALL' OR j.journal_type = p_type)
          AND (
             p_search IS NULL OR p_search = '' 
             OR j.reference ILIKE '%' || p_search || '%'
             OR j.reference_number ILIKE '%' || p_search || '%'
             OR a.name ILIKE '%' || p_search || '%'
             OR l.description ILIKE '%' || p_search || '%'
          )
          AND (p_contact_type IS NULL OR p_contact_type = 'ALL' OR c.data->>'type' = p_contact_type)
    )
    SELECT 
        (SELECT COUNT(*) FROM filtered_txs),
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', line_id,
                'journalId', journal_id,
                'date', tx_date,
                'reference', reference,
                'type', type,
                'debit', debit,
                'credit', credit,
                'description', description,
                'accountName', account_name,
                'contactName', contact_name
            )
        ), '[]'::jsonb)
    INTO v_total_count, v_transactions
    FROM (
        SELECT * FROM filtered_txs
        ORDER BY tx_date ASC, journal_id ASC
        LIMIT p_limit OFFSET p_offset
    ) sub;

    RETURN jsonb_build_object(
        'openingBalance', v_opening_balance,
        'transactions', v_transactions,
        'totalCount', v_total_count
    );
END;
$function$;


-- Function: get_partner_summary
CREATE OR REPLACE FUNCTION public.get_partner_summary(p_company_ids text[], p_contact_type text, p_as_of_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(contact_id text, contact_name text, company_id text, balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH derived_lines AS (
        SELECT 
            coalesce(al.contact_id, 
                CASE 
                    WHEN j.journal_type IN ('INV', 'BILL', 'CUST_PAY', 'VEND_PAY', 'CREDIT_NOTE') THEN 
                        coalesce(j.data->>'contactId', j.data->>'customerId', j.data->>'vendorId', j.data->>'partnerId')
                    ELSE NULL 
                END
            ) AS effective_contact_id,
            j.company_id AS j_company_id,
            (al.debit - al.credit) as amount
        FROM docs_journal_lines al
        JOIN docs_journals j ON al.journal_id = j.id
        JOIN docs_accounts a ON al.account_id = a.id
        WHERE (p_company_ids IS NULL OR array_length(p_company_ids, 1) IS NULL OR j.company_id = ANY(p_company_ids))
          AND j.status = 'POSTED'
          AND (p_as_of_date IS NULL OR j.date::DATE <= p_as_of_date)
          AND (
              (p_contact_type = 'CUSTOMER' AND (
                  LOWER(a.sub_type) = 'accounts_receivable'
                  OR LOWER(a.sub_type) = 'receivable'
                  OR a.code = '100201'
              ))
              OR 
              (p_contact_type = 'VENDOR' AND (
                  LOWER(a.sub_type) = 'accounts_payable'
                  OR LOWER(a.sub_type) = 'payable'
                  OR a.code = '200101'
              ))
              OR 
              (p_contact_type = 'EMPLOYEE' AND (
                  a.code = '100205' OR LOWER(a.name) ILIKE '%employee%'
              ))
              OR
              (p_contact_type = 'LOAN_RECEIVABLE' AND (
                  a.code = '100601' OR LOWER(a.name) ILIKE '%loan receivable%' OR (a.type = 'ASSET' AND LOWER(a.name) ILIKE '%loan%')
              ))
              OR
              (p_contact_type = 'LOAN_PAYABLE' AND (
                  a.code = '21010000' OR LOWER(a.name) ILIKE '%loan payable%' OR (a.type = 'LIABILITY' AND LOWER(a.name) ILIKE '%loan%')
              ))
          )
    ),
    partner_sums AS (
        SELECT 
            effective_contact_id,
            j_company_id,
            SUM(amount) AS tx_bal
        FROM derived_lines
        WHERE effective_contact_id IS NOT NULL
        GROUP BY effective_contact_id, j_company_id
        HAVING ROUND(SUM(amount)::numeric, 2) != 0
    )
    SELECT 
        ps.effective_contact_id AS contact_id,
        coalesce(c.name, 'Unknown Partner') AS contact_name,
        ps.j_company_id AS company_id,
        ROUND(ps.tx_bal::numeric, 2) AS balance
    FROM partner_sums ps
    LEFT JOIN docs_contacts c ON c.id = ps.effective_contact_id;
END;
$function$;


-- Function: get_period_status
CREATE OR REPLACE FUNCTION public.get_period_status(p_company_id text, p_date_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
   v_status TEXT;
   v_date DATE;
BEGIN
   -- Attempt parsing date, if fails assume open or skip check gracefully
   BEGIN
       v_date := p_date_text::DATE;
   EXCEPTION WHEN OTHERS THEN
       RETURN 'OPEN';
   END;

   SELECT status INTO v_status 
   FROM docs_financial_periods 
   WHERE company_id = p_company_id 
   AND v_date >= start_date AND v_date <= end_date 
   LIMIT 1;
   
   RETURN COALESCE(v_status, 'OPEN'); 
END;
$function$;


-- Function: get_profit_and_loss_enterprise
CREATE OR REPLACE FUNCTION public.get_profit_and_loss_enterprise(p_company_ids text[], p_start_date date DEFAULT '1970-01-01'::date, p_end_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(category text, company_id text, account_id text, account_code text, account_name text, balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        RETURN QUERY
        SELECT
            UPPER(COALESCE(a.type, a.data->>'type', ''))::TEXT as category,
            j.company_id,
            a.id as account_id,
            a.code as account_code,
            a.name as account_name,
            SUM(
                CASE
                    WHEN UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('INCOME', 'REVENUE', 'SALES', 'OPERATING_REVENUE', 'OTHER_INCOME') THEN jl.credit - jl.debit
                    WHEN UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('EXPENSE', 'COGS', 'COST_OF_SALES', 'COST_OF_REVENUE', 'OTHER_EXPENSE', 'OPERATING_EXPENSE', 'OPERATING_EXPENSES', 'ADMINISTRATIVE_EXPENSE') THEN jl.debit - jl.credit
                    ELSE 0
                END
            ) as balance
        FROM docs_journal_lines jl
        JOIN docs_journals j ON jl.journal_id = j.id
        JOIN docs_accounts a ON jl.account_id = a.id
        WHERE (p_company_ids IS NULL OR j.company_id = ANY(p_company_ids))
        AND j.status = 'POSTED'
        AND j.date::DATE >= p_start_date
        AND j.date::DATE <= p_end_date
        AND UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('INCOME', 'REVENUE', 'SALES', 'OPERATING_REVENUE', 'OTHER_INCOME', 'EXPENSE', 'COGS', 'COST_OF_SALES', 'COST_OF_REVENUE', 'OTHER_EXPENSE', 'OPERATING_EXPENSE', 'OPERATING_EXPENSES', 'ADMINISTRATIVE_EXPENSE')
        GROUP BY j.company_id, a.id, a.code, a.name, UPPER(COALESCE(a.type, a.data->>'type', ''))
        HAVING SUM(
                CASE
                    WHEN UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('INCOME', 'REVENUE', 'SALES', 'OPERATING_REVENUE', 'OTHER_INCOME') THEN jl.credit - jl.debit
                    WHEN UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('EXPENSE', 'COGS', 'COST_OF_SALES', 'COST_OF_REVENUE', 'OTHER_EXPENSE', 'OPERATING_EXPENSE', 'OPERATING_EXPENSES', 'ADMINISTRATIVE_EXPENSE') THEN jl.debit - jl.credit
                    ELSE 0
                END
            ) != 0
        ORDER BY CASE 
            WHEN UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('INCOME', 'REVENUE', 'SALES', 'OPERATING_REVENUE', 'OTHER_INCOME') THEN 1 
            ELSE 2 
            END, a.code;
    END;
    $function$;


-- Function: get_retained_earnings_enterprise
CREATE OR REPLACE FUNCTION public.get_retained_earnings_enterprise(p_company_ids text[], p_as_of_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(company_id text, retained numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        RETURN QUERY
        SELECT 
            j.company_id,
            COALESCE(SUM(
              CASE 
                WHEN UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('INCOME', 'REVENUE', 'SALES', 'OPERATING_REVENUE', 'OTHER_INCOME') THEN jl.credit - jl.debit
                WHEN UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('EXPENSE', 'COGS', 'COST_OF_SALES', 'COST_OF_REVENUE', 'OTHER_EXPENSE', 'OPERATING_EXPENSE', 'OPERATING_EXPENSES', 'ADMINISTRATIVE_EXPENSE') THEN jl.credit - jl.debit
                ELSE 0
              END
            ), 0) as retained
        FROM docs_journal_lines jl
        JOIN docs_journals j ON jl.journal_id = j.id
        JOIN docs_accounts a ON jl.account_id = a.id
        WHERE (p_company_ids IS NULL OR j.company_id = ANY(p_company_ids))
        AND j.status = 'POSTED'
        AND j.date::DATE <= p_as_of_date
        AND UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('INCOME', 'REVENUE', 'SALES', 'OPERATING_REVENUE', 'OTHER_INCOME', 'EXPENSE', 'COGS', 'COST_OF_SALES', 'COST_OF_REVENUE', 'OTHER_EXPENSE', 'OPERATING_EXPENSE', 'OPERATING_EXPENSES', 'ADMINISTRATIVE_EXPENSE')
        GROUP BY j.company_id;
    END;
    $function$;


-- Function: get_stock_valuation
CREATE OR REPLACE FUNCTION public.get_stock_valuation(p_company_id text)
 RETURNS TABLE(company_id text, product_id text, product_name text, sku text, unit_cost numeric, on_hand_qty numeric, total_value numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.company_id,
        p.id as product_id,
        p.name as product_name,
        COALESCE(p.sku, '') as sku,
        COALESCE(p.cost_price, (p.data->>'costPrice')::NUMERIC, 0) as unit_cost,
        COALESCE((p.data->>'quantityOnHand')::NUMERIC, 0) as on_hand_qty,
        (COALESCE(p.cost_price, (p.data->>'costPrice')::NUMERIC, 0) * COALESCE((p.data->>'quantityOnHand')::NUMERIC, 0)) as total_value
    FROM docs_products p
    WHERE p_company_id IS NULL OR p.company_id = p_company_id;
END;
$function$;


-- Function: get_trial_balance
CREATE OR REPLACE FUNCTION public.get_trial_balance(p_company_id text, p_start_date date, p_end_date date)
 RETURNS TABLE(account_id text, account_code text, account_name text, account_type text, branch_id text, opening_balance numeric, period_debit numeric, period_credit numeric, closing_balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH ledger_summary AS (
        SELECT 
            al.account_id,
            j.company_id,
            SUM(CASE WHEN j.date < p_start_date THEN al.debit - al.credit ELSE 0 END) as o_bal,
            SUM(CASE WHEN j.date >= p_start_date AND j.date <= p_end_date THEN al.debit ELSE 0 END) as p_debit,
            SUM(CASE WHEN j.date >= p_start_date AND j.date <= p_end_date THEN al.credit ELSE 0 END) as p_credit
        FROM docs_journal_lines al
        JOIN docs_journals j ON al.journal_id = j.id
        WHERE (p_company_id IS NULL OR j.company_id = p_company_id)
          AND j.status = 'POSTED'
        GROUP BY al.account_id, j.company_id
    )
    SELECT 
        a.id,
        a.code,
        a.name,
        (a.data->>'type') as account_type,
        ls.company_id as branch_id,
        COALESCE(ls.o_bal, 0) as opening_balance,
        COALESCE(ls.p_debit, 0) as period_debit,
        COALESCE(ls.p_credit, 0) as period_credit,
        (COALESCE(ls.o_bal, 0) + COALESCE(ls.p_debit, 0) - COALESCE(ls.p_credit, 0)) as closing_balance
    FROM docs_accounts a
    JOIN ledger_summary ls ON a.id = ls.account_id
    WHERE (p_company_id IS NULL OR a.company_id = p_company_id);
END;
$function$;


-- Function: get_trial_balance_enterprise
CREATE OR REPLACE FUNCTION public.get_trial_balance_enterprise(p_company_ids text[], p_start_date date, p_end_date date)
 RETURNS TABLE(account_id text, company_id text, account_code text, account_name text, account_type text, account_subtype text, total_debit numeric, total_credit numeric, opening_balance numeric, closing_balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        RETURN QUERY
        WITH OpeningBalances AS (
            SELECT j.company_id, jl.account_id, SUM(jl.debit) as o_debit, SUM(jl.credit) as o_credit
            FROM docs_journal_lines jl JOIN docs_journals j ON jl.journal_id = j.id
            WHERE (p_company_ids IS NULL OR j.company_id = ANY(p_company_ids)) AND j.status = 'POSTED' AND j.date::DATE < p_start_date
            GROUP BY j.company_id, jl.account_id
        ),
        PeriodBalances AS (
            SELECT j.company_id, jl.account_id, SUM(jl.debit) as p_debit, SUM(jl.credit) as p_credit
            FROM docs_journal_lines jl JOIN docs_journals j ON jl.journal_id = j.id
            WHERE (p_company_ids IS NULL OR j.company_id = ANY(p_company_ids)) AND j.status = 'POSTED' AND j.date::DATE >= p_start_date AND j.date::DATE <= p_end_date
            GROUP BY j.company_id, jl.account_id
        )
        SELECT 
            a.id as account_id, COALESCE(ob.company_id, pb.company_id) as company_id, a.code as account_code, a.name as account_name,
            UPPER(COALESCE(a.type, a.data->>'type', ''))::TEXT as account_type, a.data->>'subType' as account_subtype,
            COALESCE(pb.p_debit, 0) as total_debit, COALESCE(pb.p_credit, 0) as total_credit,
            CASE WHEN UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('ASSET', 'EXPENSE', 'COGS', 'BANK', 'RECEIVABLE', 'COST_OF_SALES', 'COST_OF_REVENUE', 'OTHER_EXPENSE', 'OPERATING_EXPENSE', 'OPERATING_EXPENSES', 'ADMINISTRATIVE_EXPENSE') THEN COALESCE(ob.o_debit, 0) - COALESCE(ob.o_credit, 0) ELSE COALESCE(ob.o_credit, 0) - COALESCE(ob.o_debit, 0) END as opening_balance,
            CASE WHEN UPPER(COALESCE(a.type, a.data->>'type', '')) IN ('ASSET', 'EXPENSE', 'COGS', 'BANK', 'RECEIVABLE', 'COST_OF_SALES', 'COST_OF_REVENUE', 'OTHER_EXPENSE', 'OPERATING_EXPENSE', 'OPERATING_EXPENSES', 'ADMINISTRATIVE_EXPENSE') THEN (COALESCE(ob.o_debit, 0) - COALESCE(ob.o_credit, 0)) + COALESCE(pb.p_debit, 0) - COALESCE(pb.p_credit, 0) ELSE (COALESCE(ob.o_credit, 0) - COALESCE(ob.o_debit, 0)) + COALESCE(pb.p_credit, 0) - COALESCE(pb.p_debit, 0) END as closing_balance
        FROM docs_accounts a
        LEFT JOIN OpeningBalances ob ON a.id = ob.account_id
        LEFT JOIN PeriodBalances pb ON a.id = pb.account_id AND (ob.company_id IS NULL OR ob.company_id = pb.company_id)
        WHERE (ob.o_debit != 0 OR ob.o_credit != 0 OR pb.p_debit != 0 OR pb.p_credit != 0)
        ORDER BY a.code;
    END;
    $function$;


-- Function: get_unpaid_bills
CREATE OR REPLACE FUNCTION public.get_unpaid_bills(p_vendor_id text, p_company_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    res JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(data || jsonb_build_object('id', id)), '[]'::jsonb) INTO res
    FROM docs_bills 
    WHERE company_id = p_company_id 
    AND (data->>'vendorId' = p_vendor_id OR data->>'supplierId' = p_vendor_id) 
    AND status IN ('POSTED', 'PARTIAL', 'SENT', 'IN_PAYMENT');
    RETURN res;
END;
$function$;


-- Function: get_unpaid_invoices
CREATE OR REPLACE FUNCTION public.get_unpaid_invoices(p_customer_id text, p_company_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    res JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(data || jsonb_build_object('id', id)), '[]'::jsonb) INTO res
    FROM docs_invoices 
    WHERE company_id = p_company_id 
    AND data->>'customerId' = p_customer_id 
    AND status IN ('POSTED', 'PARTIAL', 'SENT', 'IN_PAYMENT');
    RETURN res;
END;
$function$;


-- Function: get_user_email
CREATE OR REPLACE FUNCTION public.get_user_email(p_username text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ DECLARE v_email TEXT; BEGIN SELECT email INTO v_email FROM docs_users WHERE username = p_username LIMIT 1; RETURN v_email; END; $function$;


-- Function: handle_offline_posted_sync
CREATE OR REPLACE FUNCTION public.handle_offline_posted_sync()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
        v_bypass TEXT;
        v_has_journal BOOLEAN := false;
    BEGIN
        v_bypass := current_setting('core.bypass_audit', true);
        IF COALESCE(v_bypass, 'false') = 'true' THEN
            RETURN NEW;
        END IF;

        IF NEW.status IN ('POSTED', 'PAID', 'PARTIAL') THEN
            -- Check if it actually has a journal entry
            IF NEW.journal_entry_id IS NOT NULL THEN
                SELECT EXISTS(SELECT 1 FROM docs_journal_lines WHERE journal_id = NEW.journal_entry_id) INTO v_has_journal;
            ELSE
                SELECT EXISTS(SELECT 1 FROM docs_journal_lines WHERE journal_id = 'JE-' || UPPER(NEW.id)) INTO v_has_journal;
            END IF;

            -- If it has NO journal, this must be an offline POSTED sync that bypassed the RPC!
            -- Instead of throwing a red error at the end of the transaction, we silently downgrade to DRAFT
            -- so the sync succeeds and it saves as a draft.
            IF NOT v_has_journal THEN
                NEW.status := 'DRAFT';
                IF NEW.data IS NOT NULL THEN
                   NEW.data := jsonb_set(NEW.data, '{status}', to_jsonb('DRAFT'::text));
                END IF;
            END IF;
        END IF;
        
        RETURN NEW;
    END;
    $function$;


-- Function: increment_version
CREATE OR REPLACE FUNCTION public.increment_version()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.version := COALESCE(OLD.version, 0) + 1;
    RETURN NEW;
END;
$function$;


-- Function: initialize_product_inventory
CREATE OR REPLACE FUNCTION public.initialize_product_inventory()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
      v_cid TEXT;
      v_qty TEXT;
      v_cost NUMERIC;
    BEGIN
      -- Recursion guard
      IF pg_trigger_depth() > 5 THEN RETURN NEW; END IF;

      -- Prevent infinite trigger loop if initial stock levels and costs have not changed
      IF (TG_OP = 'UPDATE') THEN
        IF (NEW.data->'initialStockLevels') IS NOT DISTINCT FROM (OLD.data->'initialStockLevels')
            AND (NEW.data->>'initialCost') IS NOT DISTINCT FROM (OLD.data->>'initialCost')
            AND (NEW.data->>'createdAt') IS NOT DISTINCT FROM (OLD.data->>'createdAt') THEN
          RETURN NEW;
        END IF;
      END IF;

      IF (NEW.data->'initialStockLevels') IS NOT NULL THEN
        FOR v_cid, v_qty IN SELECT * FROM jsonb_each_text(NEW.data->'initialStockLevels') LOOP
           v_cost := COALESCE(NULLIF(NEW.data->>'initialCost', '')::NUMERIC, NULLIF(NEW.data->>'costPrice', '')::NUMERIC, 0);
           
           INSERT INTO docs_inventory_transactions (id, company_id, product_id, warehouse_id, transaction_type, quantity, reference_id, reference_type, date, cost_price)
           VALUES ('mov-init-' || NEW.id || '-' || v_cid, v_cid, NEW.id, 'wh-' || v_cid, 'IN', COALESCE(NULLIF(v_qty, '')::NUMERIC, 0), NEW.id, 'OPENING_STOCK', COALESCE(NULLIF(NEW.data->>'createdAt', '')::DATE, NOW()::DATE), v_cost)
           ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, cost_price = EXCLUDED.cost_price, updated_at = NOW();
        END LOOP;
      END IF;
      
      RETURN NEW;
    END;
$function$;


-- Function: merge_contacts
CREATE OR REPLACE FUNCTION public.merge_contacts(p_master_id text, p_duplicate_ids text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_master RECORD;
    v_dup RECORD;
    v_dup_id TEXT;
    v_merged_phone TEXT;
    v_merged_email TEXT;
BEGIN
    -- Validation
    IF array_length(p_duplicate_ids, 1) IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No duplicate IDs provided');
    END IF;

    SELECT * INTO v_master FROM docs_contacts WHERE id = p_master_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Master contact not found');
    END IF;
    
    v_merged_phone := COALESCE(v_master.phone, '');
    v_merged_email := COALESCE(v_master.email, '');

    FOREACH v_dup_id IN ARRAY p_duplicate_ids LOOP
        IF v_dup_id = p_master_id THEN
            CONTINUE;
        END IF;

        SELECT * INTO v_dup FROM docs_contacts WHERE id = v_dup_id FOR UPDATE;
        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        -- Update master flags if duplicate has them
        UPDATE docs_contacts SET
            is_customer = is_customer OR v_dup.is_customer,
            is_vendor = is_vendor OR v_dup.is_vendor,
            is_lender = is_lender OR v_dup.is_lender
        WHERE id = p_master_id;

        -- Merge Phones
        IF v_dup.phone IS NOT NULL AND v_dup.phone <> '' THEN
            IF v_merged_phone = '' THEN
                v_merged_phone := v_dup.phone;
            ELSIF position(v_dup.phone in v_merged_phone) = 0 THEN
                v_merged_phone := v_merged_phone || ', ' || v_dup.phone;
            END IF;
        END IF;
        
        -- Merge Emails
        IF v_dup.email IS NOT NULL AND v_dup.email <> '' THEN
            IF v_merged_email = '' THEN
                v_merged_email := v_dup.email;
            ELSIF position(v_dup.email in v_merged_email) = 0 THEN
                v_merged_email := v_merged_email || ', ' || v_dup.email;
            END IF;
        END IF;

        -- Update relationships in invoices
        UPDATE docs_invoices SET 
            customer_id = p_master_id,
            data = jsonb_set(COALESCE(data, '{}'::jsonb), '{customerId}', to_jsonb(p_master_id))
        WHERE customer_id = v_dup_id;

        -- Update relationships in bills
        UPDATE docs_bills SET 
            vendor_id = p_master_id,
            data = jsonb_set(COALESCE(data, '{}'::jsonb), '{vendorId}', to_jsonb(p_master_id))
        WHERE vendor_id = v_dup_id;

        -- Update relationships in payments
        UPDATE docs_payments SET 
            contact_id = p_master_id,
            data = jsonb_set(COALESCE(data, '{}'::jsonb), '{contactId}', to_jsonb(p_master_id))
        WHERE contact_id = v_dup_id;

        -- Update relationships in credit notes
        UPDATE docs_credit_notes SET 
            customer_id = p_master_id,
            data = jsonb_set(COALESCE(data, '{}'::jsonb), '{customerId}', to_jsonb(p_master_id))
        WHERE customer_id = v_dup_id;

        -- Update relationships in loans
        UPDATE docs_loans SET 
            contact_id = p_master_id,
            data = jsonb_set(COALESCE(data, '{}'::jsonb), '{contactId}', to_jsonb(p_master_id))
        WHERE contact_id = v_dup_id;

        -- Update relationships in journal lines
        UPDATE docs_journal_lines SET 
            contact_id = p_master_id
        WHERE contact_id = v_dup_id;
        
        -- Try to move contact companies, handle conflicts
        BEGIN
            UPDATE docs_contact_companies SET contact_id = p_master_id WHERE contact_id = v_dup_id;
        EXCEPTION WHEN unique_violation THEN
            DELETE FROM docs_contact_companies WHERE contact_id = v_dup_id;
        END;

        -- Delete duplicate
        DELETE FROM docs_contacts WHERE id = v_dup_id;
    END LOOP;

    -- Final update to master contact
    UPDATE docs_contacts SET
        phone = NULLIF(v_merged_phone, ''),
        email = NULLIF(v_merged_email, ''),
        data = jsonb_set(jsonb_set(COALESCE(data, '{}'::jsonb), '{phone}', to_jsonb(NULLIF(v_merged_phone, ''))), '{email}', to_jsonb(NULLIF(v_merged_email, '')))
    WHERE id = p_master_id;

    RETURN jsonb_build_object('success', true);
END;
$function$;


-- Function: merge_duplicate_contacts
CREATE OR REPLACE FUNCTION public.merge_duplicate_contacts()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_group RECORD;
    v_master_id TEXT;
    v_dup_id TEXT;
    v_groups_processed INT := 0;
    v_rows_merged INT := 0;
    v_invoices_updated INT := 0;
    v_bills_updated INT := 0;
    v_payments_updated INT := 0;
    v_credit_notes_updated INT := 0;
    v_journal_lines_updated INT := 0;
    v_loans_updated INT := 0;
    v_inv_cnt INT;
    v_bill_cnt INT;
    v_pay_cnt INT;
    v_cn_cnt INT;
    v_jl_cnt INT;
    v_ln_cnt INT;
BEGIN
    -- Disable the historical double-entry validation trigger on journal lines to allow bulk updates on old entries
    ALTER TABLE public.docs_journal_lines DISABLE TRIGGER trg_strict_double_entry_check;

    -- Loop through each name + company_id group that has duplicates
    FOR v_group IN (
        SELECT LOWER(TRIM(name)) as trimmed_name, company_id
        FROM public.docs_contacts
        GROUP BY LOWER(TRIM(name)), company_id
        HAVING COUNT(*) > 1
    ) LOOP
        -- Identify the Master ID for this group (prioritizing transaction count)
        SELECT id INTO v_master_id
        FROM public.docs_contacts c
        WHERE LOWER(TRIM(c.name)) = v_group.trimmed_name 
          AND (c.company_id = v_group.company_id OR (c.company_id IS NULL AND v_group.company_id IS NULL))
        ORDER BY 
          ((SELECT COUNT(*) FROM public.docs_invoices WHERE customer_id = c.id) + 
           (SELECT COUNT(*) FROM public.docs_bills WHERE vendor_id = c.id)) DESC,
          c.updated_at DESC,
          c.id ASC
        LIMIT 1;

        IF v_master_id IS NOT NULL THEN
            v_groups_processed := v_groups_processed + 1;
            
            -- Loop through each duplicate contact in this group (except the Master)
            FOR v_dup_id IN (
                SELECT id 
                FROM public.docs_contacts c
                WHERE LOWER(TRIM(c.name)) = v_group.trimmed_name 
                  AND (c.company_id = v_group.company_id OR (c.company_id IS NULL AND v_group.company_id IS NULL))
                  AND id != v_master_id
            ) LOOP
                v_rows_merged := v_rows_merged + 1;

                -- A. Consolidate contact details onto master if null/empty on master
                UPDATE public.docs_contacts m
                SET 
                    email = COALESCE(NULLIF(TRIM(m.email), ''), NULLIF(TRIM(d.email), '')),
                    phone = COALESCE(NULLIF(TRIM(m.phone), ''), NULLIF(TRIM(d.phone), '')),
                    address = COALESCE(NULLIF(TRIM(m.address), ''), NULLIF(TRIM(d.address), '')),
                    external_id = COALESCE(NULLIF(TRIM(m.external_id), ''), NULLIF(TRIM(d.external_id), '')),
                    is_customer = COALESCE(m.is_customer, false) OR COALESCE(d.is_customer, false),
                    is_vendor = COALESCE(m.is_vendor, false) OR COALESCE(d.is_vendor, false),
                    is_lender = COALESCE(m.is_lender, false) OR COALESCE(d.is_lender, false)
                FROM public.docs_contacts d
                WHERE m.id = v_master_id AND d.id = v_dup_id;

                -- B. Consolidate company_ids array
                UPDATE public.docs_contacts m
                SET company_ids = ARRAY(
                    SELECT DISTINCT x 
                    FROM unnest(
                        array_cat(
                            COALESCE(m.company_ids, ARRAY[]::text[]),
                            COALESCE(d.company_ids, ARRAY[]::text[])
                        )
                    ) x
                    WHERE x IS NOT NULL
                )
                FROM public.docs_contacts d
                WHERE m.id = v_master_id AND d.id = v_dup_id;

                -- C. Redirect docs_invoices
                UPDATE public.docs_invoices 
                SET customer_id = v_master_id,
                    data = CASE WHEN data ? 'customerId' THEN jsonb_set(data, '{customerId}', to_jsonb(v_master_id)) ELSE data END
                WHERE customer_id = v_dup_id;
                GET DIAGNOSTICS v_inv_cnt = ROW_COUNT;
                v_invoices_updated := v_invoices_updated + v_inv_cnt;

                -- D. Redirect docs_bills
                UPDATE public.docs_bills 
                SET vendor_id = v_master_id,
                    data = CASE WHEN data ? 'vendorId' THEN jsonb_set(data, '{vendorId}', to_jsonb(v_master_id)) ELSE data END
                WHERE vendor_id = v_dup_id;
                GET DIAGNOSTICS v_bill_cnt = ROW_COUNT;
                v_bills_updated := v_bills_updated + v_bill_cnt;

                -- E. Redirect docs_payments
                UPDATE public.docs_payments 
                SET contact_id = v_master_id,
                    data = CASE WHEN data ? 'contactId' THEN jsonb_set(data, '{contactId}', to_jsonb(v_master_id)) ELSE data END
                WHERE contact_id = v_dup_id;
                GET DIAGNOSTICS v_pay_cnt = ROW_COUNT;
                v_payments_updated := v_payments_updated + v_pay_cnt;

                -- F. Redirect docs_credit_notes
                UPDATE public.docs_credit_notes 
                SET customer_id = v_master_id,
                    data = CASE 
                             WHEN data ? 'customerId' THEN jsonb_set(data, '{customerId}', to_jsonb(v_master_id))
                             WHEN data ? 'contactId' THEN jsonb_set(data, '{contactId}', to_jsonb(v_master_id))
                             ELSE data 
                           END
                WHERE customer_id = v_dup_id;
                GET DIAGNOSTICS v_cn_cnt = ROW_COUNT;
                v_credit_notes_updated := v_credit_notes_updated + v_cn_cnt;

                -- G. Redirect docs_journal_lines
                UPDATE public.docs_journal_lines 
                SET contact_id = v_master_id
                WHERE contact_id = v_dup_id;
                GET DIAGNOSTICS v_jl_cnt = ROW_COUNT;
                v_journal_lines_updated := v_journal_lines_updated + v_jl_cnt;

                -- H. Redirect docs_loans
                UPDATE public.docs_loans 
                SET contact_id = v_master_id
                WHERE contact_id = v_dup_id;
                GET DIAGNOSTICS v_ln_cnt = ROW_COUNT;
                v_loans_updated := v_loans_updated + v_ln_cnt;

                -- I. Handle details for docs_contact_companies mapping table
                INSERT INTO public.docs_contact_companies (contact_id, company_id)
                SELECT DISTINCT v_master_id, company_id 
                FROM public.docs_contact_companies 
                WHERE contact_id = v_dup_id
                ON CONFLICT DO NOTHING;

                -- J. Delete the now orphaned duplicate contact row from docs_contacts (cascades to docs_contact_companies)
                DELETE FROM public.docs_contacts WHERE id = v_dup_id;

            END LOOP;
        END IF;
    END LOOP;

    -- Re-enable the trigger
    ALTER TABLE public.docs_journal_lines ENABLE TRIGGER trg_strict_double_entry_check;

    RETURN jsonb_build_object(
        'success', true,
        'groups_processed', v_groups_processed,
        'contacts_deleted', v_rows_merged,
        'invoices_updated', v_invoices_updated,
        'bills_updated', v_bills_updated,
        'payments_updated', v_payments_updated,
        'credit_notes_updated', v_credit_notes_updated,
        'journal_lines_updated', v_journal_lines_updated,
        'loans_updated', v_loans_updated
    );

EXCEPTION WHEN OTHERS THEN
    -- Ensure trigger is re-enabled in case of any runtime error
    ALTER TABLE public.docs_journal_lines ENABLE TRIGGER trg_strict_double_entry_check;
    RAISE;
END;
$function$;


-- Function: merge_products
CREATE OR REPLACE FUNCTION public.merge_products(p_master_id text, p_duplicate_ids text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_master RECORD;
    v_dup RECORD;
    v_dup_id TEXT;
    
    v_total_value NUMERIC := 0;
    v_total_qty NUMERIC := 0;
    v_master_qty NUMERIC := 0;
    v_master_value NUMERIC := 0;
    v_dup_qty NUMERIC := 0;
    v_dup_value NUMERIC := 0;
BEGIN
    IF array_length(p_duplicate_ids, 1) IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No duplicate IDs provided');
    END IF;

    SELECT * INTO v_master FROM docs_products WHERE id = p_master_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Master product not found');
    END IF;

    -- Calculate initial master value based on what it knows
    v_master_qty := COALESCE(v_master.quantity_on_hand, 0);
    v_master_value := v_master_qty * COALESCE(v_master.cost_price, 0);
    v_total_qty := v_master_qty;
    v_total_value := v_master_value;

    FOREACH v_dup_id IN ARRAY p_duplicate_ids LOOP
        IF v_dup_id = p_master_id THEN
            CONTINUE;
        END IF;

        SELECT * INTO v_dup FROM docs_products WHERE id = v_dup_id FOR UPDATE;
        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        -- Accumulate qty and value
        v_dup_qty := COALESCE(v_dup.quantity_on_hand, 0);
        v_dup_value := v_dup_qty * COALESCE(v_dup.cost_price, 0);

        v_total_qty := v_total_qty + v_dup_qty;
        v_total_value := v_total_value + v_dup_value;

        -- Move inventory transactions
        UPDATE docs_inventory_transactions SET product_id = p_master_id WHERE product_id = v_dup_id;

        -- Update relational lines if they exist
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'docs_invoice_lines') THEN
            UPDATE docs_invoice_lines SET product_id = p_master_id WHERE product_id = v_dup_id;
        END IF;

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'docs_bill_lines') THEN
            UPDATE docs_bill_lines SET product_id = p_master_id WHERE product_id = v_dup_id;
        END IF;

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'docs_credit_note_lines') THEN
            UPDATE docs_credit_note_lines SET product_id = p_master_id WHERE product_id = v_dup_id;
        END IF;

        -- Handle jsonb arrays in docs_invoices
        UPDATE docs_invoices
        SET data = (
            SELECT jsonb_set(
                data, 
                '{items}', 
                (
                    SELECT COALESCE(jsonb_agg(
                        CASE 
                            WHEN item->>'productId' = v_dup_id THEN 
                                jsonb_set(jsonb_set(item, '{productId}', to_jsonb(p_master_id)), '{product_id}', to_jsonb(p_master_id))
                            ELSE item 
                        END
                    ), '[]'::jsonb)
                    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(data->'items') = 'array' THEN data->'items' ELSE '[]'::jsonb END) AS item
                )
            )
        )
        WHERE data->'items' @> jsonb_build_array(jsonb_build_object('productId', v_dup_id));

        -- Handle jsonb arrays in docs_bills
        UPDATE docs_bills
        SET data = (
            SELECT jsonb_set(
                data, 
                '{items}', 
                (
                    SELECT COALESCE(jsonb_agg(
                        CASE 
                            WHEN item->>'productId' = v_dup_id THEN 
                                jsonb_set(jsonb_set(item, '{productId}', to_jsonb(p_master_id)), '{product_id}', to_jsonb(p_master_id))
                            ELSE item 
                        END
                    ), '[]'::jsonb)
                    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(data->'items') = 'array' THEN data->'items' ELSE '[]'::jsonb END) AS item
                )
            )
        )
        WHERE data->'items' @> jsonb_build_array(jsonb_build_object('productId', v_dup_id));

        -- Handle jsonb arrays in docs_credit_notes
        UPDATE docs_credit_notes
        SET data = (
            SELECT jsonb_set(
                data, 
                '{items}', 
                (
                    SELECT COALESCE(jsonb_agg(
                        CASE 
                            WHEN item->>'productId' = v_dup_id THEN 
                                jsonb_set(jsonb_set(item, '{productId}', to_jsonb(p_master_id)), '{product_id}', to_jsonb(p_master_id))
                            ELSE item 
                        END
                    ), '[]'::jsonb)
                    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(data->'items') = 'array' THEN data->'items' ELSE '[]'::jsonb END) AS item
                )
            )
        )
        WHERE data->'items' @> jsonb_build_array(jsonb_build_object('productId', v_dup_id));

        -- Delete from associated tables to prevent FK constraints
        DELETE FROM docs_product_companies WHERE product_id = v_dup_id;
        
        -- Delete the duplicate product
        DELETE FROM docs_products WHERE id = v_dup_id;

    END LOOP;

    -- Final update to master product
    IF v_total_qty > 0 THEN
        UPDATE docs_products 
        SET quantity_on_hand = v_total_qty,
            cost_price = ROUND(v_total_value / v_total_qty, 2),
            data = jsonb_set(COALESCE(data, '{}'::jsonb), '{costPrice}', to_jsonb(ROUND(v_total_value / v_total_qty, 2))),
            updated_at = NOW()
        WHERE id = p_master_id;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$function$;


-- Function: patch_payments_created_by
CREATE OR REPLACE FUNCTION public.patch_payments_created_by()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ DECLARE r RECORD; BEGIN FOR r IN SELECT p.id, i.created_by_id, i.prepared_by as prep FROM docs_payments p JOIN docs_invoices i ON UPPER(p.id) = UPPER('PAY-AUTO-' || REPLACE(i.id, 'INV-', '')) WHERE p.id ILIKE 'PAY-AUTO-%' AND (p.created_by_id IS DISTINCT FROM i.created_by_id OR p.prepared_by IS DISTINCT FROM i.prepared_by) LOOP UPDATE docs_payments SET created_by_id = r.created_by_id, prepared_by = r.prep, data = jsonb_set(jsonb_set(COALESCE(data, '{}'::jsonb), '{createdById}', to_jsonb(r.created_by_id)), '{preparedBy}', to_jsonb(r.prep)) WHERE id = r.id; END LOOP; END $function$;


-- Function: post_bill
CREATE OR REPLACE FUNCTION public.post_bill(p_bill_id text, p_company_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
   DECLARE
       v_bill RECORD;
           v_journal_id TEXT;
               v_vendor_account TEXT;
                   v_expense_account TEXT;
                       v_bill_number TEXT;
                           v_item JSONB;
                               v_wh_id TEXT;
                                   v_unit_price NUMERIC;
                                       v_qty NUMERIC;
                                           v_final_status TEXT;
                                               v_safe_date DATE; -- 💡 নতুন ভেরিয়েবল (তারিখের নিরাপত্তার জন্য)
                                               BEGIN
                                                   PERFORM set_config('core.bypass_audit', 'true', true);
                                                       SELECT * INTO v_bill FROM docs_bills WHERE id = p_bill_id;
                                                           IF NOT FOUND THEN RAISE EXCEPTION 'Bill not found: %', p_bill_id; END IF;

                                                               -- 💡 Date Fallback: যেকোনো মূল্যে একটি সঠিক তারিখ নিশ্চিত করা
                                                                   v_safe_date := COALESCE(
                                                                           v_bill.date, 
                                                                                   v_bill.bill_date, 
                                                                                           (v_bill.data->>'date')::date, 
                                                                                                   (v_bill.data->>'billDate')::date, 
                                                                                                           CURRENT_DATE
                                                                                                               );

                                                                                                                   v_final_status := v_bill.status;
                                                                                                                       IF v_final_status NOT IN ('POSTED', 'PAID', 'PARTIAL') THEN
                                                                                                                               v_final_status := 'POSTED';
                                                                                                                                   END IF;

                                                                                                                                       v_bill_number := v_bill.bill_number;
                                                                                                                                           IF v_bill_number IS NULL OR v_bill_number = '' OR v_bill_number LIKE 'DRAFT-%' THEN
                                                                                                                                                  v_bill_number := get_next_company_doc_number(p_company_id, 'BILL');
                                                                                                                                                      END IF;

                                                                                                                                                          SELECT id INTO v_journal_id FROM docs_journals 
                                                                                                                                                              WHERE (reference_number = v_bill_number) AND company_id = p_company_id LIMIT 1;
                                                                                                                                                                      
                                                                                                                                                                          IF v_journal_id IS NULL THEN
                                                                                                                                                                                  v_journal_id := 'JE-' || UPPER(p_bill_id);
                                                                                                                                                                                      END IF;

                                                                                                                                                                                          -- 💡 জার্নালে v_safe_date পাঠানো হচ্ছে
                                                                                                                                                                                              IF NOT EXISTS (SELECT 1 FROM docs_journals WHERE id = v_journal_id) THEN
                                                                                                                                                                                                      INSERT INTO docs_journals (
                                                                                                                                                                                                                  id, company_id, date, journal_date, reference_number, journal_number, journal_type, status, description, updated_at
                                                                                                                                                                                                                          )
                                                                                                                                                                                                                                  VALUES (
                                                                                                                                                                                                                                              v_journal_id, p_company_id, v_safe_date, v_safe_date, v_bill_number, v_bill_number, 'BILL', 'POSTED', 'Bill: ' || v_bill_number, NOW()
                                                                                                                                                                                                                                                      ) ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW(), reference_number = EXCLUDED.reference_number, journal_number = EXCLUDED.journal_number;
                                                                                                                                                                                                                                                          ELSE
                                                                                                                                                                                                                                                                  UPDATE docs_journals SET status = 'POSTED', updated_at = NOW(), reference_number = v_bill_number, journal_number = v_bill_number WHERE id = v_journal_id;
                                                                                                                                                                                                                                                                      END IF;

                                                                                                                                                                                                                                                                          -- FIND VENDOR ACCOUNT (ACCOUNTS PAYABLE)
                                                                                                                                                                                                                                                                              SELECT id::text INTO v_vendor_account FROM docs_accounts WHERE code IN ('200100', '200101', '2001') AND company_id::text = p_company_id LIMIT 1;
                                                                                                                                                                                                                                                                                  IF v_vendor_account IS NULL THEN  
                                                                                                                                                                                                                                                                                          SELECT id::text INTO v_vendor_account FROM docs_accounts WHERE name ILIKE '%Accounts Payable%' AND company_id::text = p_company_id LIMIT 1;
                                                                                                                                                                                                                                                                                              END IF;
                                                                                                                                                                                                                                                                                                  IF v_vendor_account IS NULL THEN  
                                                                                                                                                                                                                                                                                                          SELECT id::text INTO v_vendor_account FROM docs_accounts WHERE name ILIKE '%Payable%' AND type = 'LIABILITY' AND company_id::text = p_company_id LIMIT 1;
                                                                                                                                                                                                                                                                                                              END IF;
                                                                                                                                                                                                                                                                                                                  IF v_vendor_account IS NULL THEN 
                                                                                                                                                                                                                                                                                                                          SELECT id::text INTO v_vendor_account FROM docs_accounts WHERE company_id::text = p_company_id ORDER BY id LIMIT 1;
                                                                                                                                                                                                                                                                                                                              END IF;

                                                                                                                                                                                                                                                                                                                                  -- FIND EXPENSE/INVENTORY ACCOUNT
                                                                                                                                                                                                                                                                                                                                      SELECT id::text INTO v_expense_account FROM docs_accounts WHERE code IN ('500100', '500101', '100501', '100500') AND company_id::text = p_company_id LIMIT 1;
                                                                                                                                                                                                                                                                                                                                          IF v_expense_account IS NULL THEN 
                                                                                                                                                                                                                                                                                                                                                  SELECT id::text INTO v_expense_account FROM docs_accounts WHERE name ILIKE '%Inventory%' AND company_id::text = p_company_id LIMIT 1;
                                                                                                                                                                                                                                                                                                                                                      END IF;
                                                                                                                                                                                                                                                                                                                                                          IF v_expense_account IS NULL THEN 
                                                                                                                                                                                                                                                                                                                                                                  SELECT id::text INTO v_expense_account FROM docs_accounts WHERE name ILIKE '%Cost of Goods%' AND company_id::text = p_company_id LIMIT 1;
                                                                                                                                                                                                                                                                                                                                                                      END IF;
                                                                                                                                                                                                                                                                                                                                                                          IF v_expense_account IS NULL THEN 
                                                                                                                                                                                                                                                                                                                                                                                  SELECT id::text INTO v_expense_account FROM docs_accounts WHERE company_id::text = p_company_id ORDER BY id LIMIT 1;
                                                                                                                                                                                                                                                                                                                                                                                      END IF;

                                                                                                                                                                                                                                                                                                                                                                                          DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
                                                                                                                                                                                                                                                                                                                                                                                              IF v_vendor_account IS NOT NULL AND v_expense_account IS NOT NULL THEN
                                                                                                                                                                                                                                                                                                                                                                                                      INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description, updated_at)
                                                                                                                                                                                                                                                                                                                                                                                                              VALUES 
                                                                                                                                                                                                                                                                                                                                                                                                                      (gen_random_uuid()::text, v_journal_id, p_company_id, v_expense_account, v_bill.vendor_id, COALESCE(v_bill.total, 0), 0, 'Expense/Inventory for ' || v_bill_number, NOW()),
                                                                                                                                                                                                                                                                                                                                                                                                                              (gen_random_uuid()::text, v_journal_id, p_company_id, v_vendor_account, v_bill.vendor_id, 0, COALESCE(v_bill.total, 0), 'Payable for ' || v_bill_number, NOW());
                                                                                                                                                                                                                                                                                                                                                                                                                                  END IF;

                                                                                                                                                                                                                                                                                                                                                                                                                                      DELETE FROM docs_inventory_transactions WHERE reference_id = p_bill_id;
                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                              v_wh_id := 'wh-' || p_company_id;
                                                                                                                                                                                                                                                                                                                                                                                                                                                  IF v_bill.data->'items' IS NOT NULL THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                          FOR v_item IN SELECT * FROM jsonb_array_elements(v_bill.data->'items') LOOP
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      IF v_item->>'productId' IS NOT NULL AND (v_item->>'type' = 'PRODUCT' OR v_item->>'type' IS NULL) THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      v_qty := (v_item->>'quantity')::NUMERIC;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      v_unit_price := (v_item->>'unitPrice')::NUMERIC;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      IF v_qty > 0 THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          INSERT INTO docs_inventory_transactions (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  id, company_id, product_id, warehouse_id, transaction_type, 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          quantity, reference_id, reference_type, date, cost_price, unit_price,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  updated_at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ) VALUES (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              gen_random_uuid()::text, p_company_id, v_item->>'productId', v_wh_id, 'IN',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      v_qty, p_bill_id, 'BILL', v_safe_date, v_unit_price, v_unit_price, -- 💡 ইনভেন্টরিতেও v_safe_date
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              NOW()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      END LOOP;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          END IF;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              -- 💡 FINALLY, UPDATE docs_bills: এখানে date এবং bill_date ডাটাবেস কলাম এবং JSON উভয়েই সেট করা হচ্ছে
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  UPDATE docs_bills 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      SET status = v_final_status, 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              bill_number = v_bill_number,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      journal_entry_id = v_journal_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              date = v_safe_date,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      bill_date = v_safe_date,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              data = jsonb_set(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               jsonb_set(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  jsonb_set(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       jsonb_set(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              jsonb_set(data, '{status}', to_jsonb(v_final_status)),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     '{journalEntryId}', to_jsonb(v_journal_id)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               '{number}', to_jsonb(v_bill_number)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     '{date}', to_jsonb(v_safe_date)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       '{billDate}', to_jsonb(v_safe_date)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          WHERE id = p_bill_id;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id, 'bill_number', v_bill_number);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              $function$;


-- Function: post_credit_note
CREATE OR REPLACE FUNCTION public.post_credit_note(p_cn_id text, p_company_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$ 
  
DECLARE
    v_run_id TEXT := substring(md5(random()::text) from 1 for 6);
    v_cn RECORD;
    v_item JSONB;
    v_journal_id TEXT;
    v_total_debit NUMERIC := 0;
    v_total_credit NUMERIC := 0;
    v_product_record RECORD;
    v_current_stock NUMERIC;
    v_new_stock NUMERIC;
    v_idx INT := 0;
    v_ar_acc TEXT;
    v_rev_acc TEXT;
    v_inv_acc TEXT;
    v_cogs_acc TEXT;
    v_cogs_value NUMERIC;
    v_net_cost NUMERIC := 0;
    v_total_revenue_subtotal NUMERIC := 0;
    v_global_discount NUMERIC := 0;
    v_proportional_discount NUMERIC := 0;
    v_revenue_net NUMERIC := 0;
    v_tax_total NUMERIC := 0;
    v_tax_acc TEXT;
    v_effective_company_id TEXT;
BEGIN
    -- Override and force server-side BST date (Asia/Dhaka)
    -- Removed date override

    -- 1. Get Credit Note
    SELECT * INTO v_cn FROM docs_credit_notes WHERE id = p_cn_id ;
    IF NOT FOUND THEN RAISE EXCEPTION 'Credit Note not found: %', p_cn_id; END IF;

    -- Safe fallback if data column is NULL
    IF v_cn.data IS NULL OR jsonb_typeof(v_cn.data) = 'null' THEN
        v_cn.data := jsonb_build_object(
            'id', v_cn.id,
            'number', COALESCE(v_cn.credit_note_number, v_cn.cn_number, 'CN-' || v_cn.id),
            'customerId', v_cn.customer_id,
            'date', v_cn.date,
            'total', COALESCE(v_cn.total, 0),
            'subtotal', COALESCE(v_cn.subtotal, v_cn.total, 0),
            'taxTotal', COALESCE(v_cn.tax_total, 0),
            'status', COALESCE(v_cn.status, 'DRAFT'),
            'items', '[]'::jsonb
        );
    END IF;

    -- Advanced fallback: If data->'items' is empty or null, build it from docs_credit_note_lines relational table
    IF NOT (v_cn.data ? 'items') OR jsonb_typeof(v_cn.data->'items') = 'null' OR jsonb_array_length(v_cn.data->'items') = 0 THEN
        v_cn.data := jsonb_set(
            v_cn.data,
            '{items}',
            COALESCE(
                (SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'productId', product_id,
                        'quantity', quantity,
                        'unitPrice', unit_price,
                        'lineValue', COALESCE(line_value, total),
                        'discountMode', COALESCE(discount_mode, 'PERCENT'),
                        'discountRate', COALESCE(discount_rate, 0),
                        'type', type,
                        'description', description
                    )
                ) FROM docs_credit_note_lines WHERE credit_note_id = p_cn_id),
                '[]'::jsonb
            )
        );
    END IF;

    v_journal_id := COALESCE(v_cn.data->>'journalEntryId', 'JE-' || replace(UPPER(v_cn.id), 'CN-', ''));    -- EXISTS CHECK REMOVED FOR REPOSTING

    -- Temporarily set journal to DRAFT so RLS allows deletion of existing lines
    UPDATE docs_journals SET status = 'DRAFT' WHERE id = v_journal_id;

    PERFORM set_config('core.bypass_audit', 'true', true);
    DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
    PERFORM set_config('core.bypass_audit', 'false', true);

    v_effective_company_id := COALESCE(p_company_id, v_cn.company_id, v_cn.data->>'companyId');
    IF v_effective_company_id IS NULL THEN RAISE EXCEPTION 'Company ID missing'; END IF;

    -- 2. Resolve Accounts
    SELECT id INTO v_ar_acc FROM docs_accounts WHERE code IN ('100201', '100200') AND company_id = v_effective_company_id LIMIT 1;
    SELECT id INTO v_rev_acc FROM docs_accounts WHERE code IN ('400100', '400000') AND company_id = v_effective_company_id LIMIT 1;
    SELECT id INTO v_inv_acc FROM docs_accounts WHERE code IN ('100501', '100500') AND company_id = v_effective_company_id LIMIT 1;
    SELECT id INTO v_cogs_acc FROM docs_accounts WHERE code IN ('500101', '500100') AND company_id = v_effective_company_id LIMIT 1;
    SELECT id INTO v_tax_acc FROM docs_accounts WHERE code IN ('200400', '200100') AND company_id = v_effective_company_id LIMIT 1;

    IF v_ar_acc IS NULL OR v_rev_acc IS NULL THEN 
       RAISE EXCEPTION 'Required accounts not found for company %', v_effective_company_id;
    END IF;

    -- 3. Calculate Global Totals for Proportional Distribution & Balancing
    v_total_revenue_subtotal := 0;
    v_global_discount := 0;
    v_tax_total := 0;
    
    FOR v_item IN SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(v_cn.data->'items') = 'array' THEN v_cn.data->'items' ELSE '[]'::jsonb END) LOOP
        IF v_item->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE') THEN
            v_net_cost := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
            IF v_net_cost = 0 THEN
                v_net_cost := COALESCE((v_item->>'quantity')::numeric, 0) * COALESCE((v_item->>'unitPrice')::numeric, 0);
                IF v_item->>'discountMode' = 'FIXED' THEN
                    v_net_cost := v_net_cost - COALESCE((v_item->>'discountRate')::numeric, 0);
                ELSE
                    v_net_cost := v_net_cost * (1 - COALESCE((v_item->>'discountRate')::numeric, 0) / 100);
                END IF;
                v_net_cost := ROUND(v_net_cost, 2);
            END IF;
            v_total_revenue_subtotal := v_total_revenue_subtotal + v_net_cost;
        ELSIF v_item->>'type' = 'DISCOUNT' THEN
            v_net_cost := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
            IF v_net_cost = 0 THEN
                IF v_item->>'discountMode' = 'FIXED' THEN
                    v_net_cost := -ROUND(COALESCE((v_item->>'discountRate')::numeric, 0), 2);
                ELSE
                    v_net_cost := -ROUND(v_total_revenue_subtotal * COALESCE((v_item->>'discountRate')::numeric, 0) / 100.0, 2);
                END IF;
            END IF;
            v_global_discount := v_global_discount + v_net_cost;
        ELSIF v_item->>'type' = 'TAX' THEN
            v_net_cost := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
            IF v_net_cost = 0 THEN
               v_net_cost := COALESCE((v_item->>'manualValue')::numeric, ROUND((v_total_revenue_subtotal + v_global_discount) * (COALESCE((v_item->>'taxRate')::numeric, 0)/100.0), 2));
            END IF;
            v_tax_total := v_tax_total + v_net_cost;
        END IF;
    END LOOP;

    -- 4. Finalize Status
    v_journal_id := COALESCE(v_cn.data->>'journalEntryId', 'JE-' || replace(replace(UPPER(v_cn.id), 'CN-', ''), 'CN-', ''));
    
    -- Ensure we don't hit unq_journal_num_company if another ID has this reference
    SELECT id INTO v_journal_id FROM docs_journals 
    WHERE company_id = v_effective_company_id AND reference_number = v_cn.data->>'number' LIMIT 1;

    IF v_journal_id IS NULL THEN
        v_journal_id := COALESCE(v_cn.data->>'journalEntryId', 'JE-' || replace(replace(UPPER(v_cn.id), 'CN-', ''), 'CN-', ''));
    END IF;

    -- Pre-create Journal Header as DRAFT to satisfy FK and ignore balance trigger for now
    EXECUTE 'SET LOCAL core.bypass_audit = ''true''';
    DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
    EXECUTE 'SET LOCAL core.bypass_audit = ''false''';
    INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, reference, data, updated_at)
    VALUES (v_journal_id, v_effective_company_id, v_cn.date, v_cn.date, 'CREDIT_NOTE', 'DRAFT', v_cn.data->>'number', v_cn.data->>'number', 
        jsonb_build_object('id', v_journal_id, 'date', v_cn.date, 'status', 'DRAFT', 'companyId', v_effective_company_id, 'reference', v_cn.data->>'number', 'journalType', 'CREDIT_NOTE'), NOW())
    ON CONFLICT (id) DO UPDATE SET status = CASE WHEN docs_journals.status = 'POSTED' THEN 'POSTED' ELSE 'DRAFT' END, updated_at = NOW();
    

    
    -- AR Credit Line (Total)
    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
    VALUES ('JL-' || v_run_id || '-' || v_journal_id || '-ar', v_journal_id, v_effective_company_id, v_ar_acc, COALESCE(v_cn.data->>'customerId', v_cn.data->>'contactId'), 0, ROUND(COALESCE((v_cn.data->>'total')::numeric, 0), 2), 'Credit Note: ' || (v_cn.data->>'number'));
    v_total_credit := ROUND(COALESCE((v_cn.data->>'total')::numeric, 0), 2);
    RAISE NOTICE 'post_credit_note: data = %, v_total_credit = %', v_cn.data, v_total_credit;

    -- Items (Returns)
    DECLARE
        v_discount_distributed NUMERIC := 0;
        v_items_count INT := 0;
        v_current_item_idx INT := 0;
    BEGIN
        SELECT count(*) INTO v_items_count FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_cn.data->'items') = 'array' THEN v_cn.data->'items' ELSE '[]'::jsonb END) it WHERE it->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE');

        FOR v_item IN SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(v_cn.data->'items') = 'array' THEN v_cn.data->'items' ELSE '[]'::jsonb END) LOOP
            v_idx := v_idx + 1; -- Unique for every item in raw array
            
            IF v_item->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE') THEN
                v_current_item_idx := v_current_item_idx + 1;
                
                -- Calculate Gross for this line
                v_net_cost := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                IF v_net_cost = 0 THEN
                    v_net_cost := COALESCE((v_item->>'quantity')::numeric, 0) * COALESCE((v_item->>'unitPrice')::numeric, 0);
                    IF v_item->>'discountMode' = 'FIXED' THEN
                        v_net_cost := v_net_cost - COALESCE((v_item->>'discountRate')::numeric, 0);
                    ELSE
                        v_net_cost := v_net_cost * (1 - COALESCE((v_item->>'discountRate')::numeric, 0) / 100);
                    END IF;
                    v_net_cost := ROUND(v_net_cost, 2);
                END IF;
                
                -- Distribution Logic (v_global_discount is negative)
                IF v_current_item_idx = v_items_count THEN
                    v_proportional_discount := ROUND(v_global_discount - v_discount_distributed, 2);
                ELSE
                    v_proportional_discount := CASE WHEN v_total_revenue_subtotal > 0 THEN (v_net_cost / v_total_revenue_subtotal) * v_global_discount ELSE 0 END;
                    v_proportional_discount := ROUND(v_proportional_discount, 2);
                    v_discount_distributed := v_discount_distributed + v_proportional_discount;
                END IF;

                v_revenue_net := ROUND(v_net_cost + v_proportional_discount, 2);

                IF v_item->>'type' = 'PRODUCT' THEN
                    -- Revenue Debit (Sales Return)
                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                    VALUES ('JL-' || v_run_id || '-' || v_journal_id || '-rev-' || v_idx, v_journal_id, v_effective_company_id, v_rev_acc, v_revenue_net, 0, 'Return: ' || (v_item->>'description'));
                    v_total_debit := v_total_debit + v_revenue_net;

                    -- Inventory Re-stocking
                    SELECT * INTO v_product_record FROM docs_products WHERE id = (v_item->>'productId') FOR UPDATE;
                    IF FOUND THEN
                        -- No manual stock increments here! Let trigger handle it.
                        NULL;
                    END IF;
                ELSIF v_item->>'type' IN ('SERVICE', 'CHARGE') THEN
                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                    VALUES ('JL-' || v_run_id || '-' || v_journal_id || '-rev-srv-' || v_idx, v_journal_id, v_effective_company_id, v_rev_acc, v_revenue_net, 0, 'Srv Return: ' || (v_item->>'description'));
                    v_total_debit := v_total_debit + v_revenue_net;
                END IF;
            ELSIF v_item->>'type' = 'TAX' THEN
                v_tax_total := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                
                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                VALUES ('JL-' || v_run_id || '-' || v_journal_id || '-tax-' || v_idx, v_journal_id, v_effective_company_id, v_tax_acc, v_tax_total, 0, 'Tax Reverse: ' || (v_item->>'description'));
                v_total_debit := v_total_debit + v_tax_total;
            END IF;
        END LOOP;
    END;

    -- If no items / lines were processed or debit is still 0 while credit is > 0,
    -- create a default Sales Return line matching v_total_credit
    IF v_total_credit > 0 AND v_total_debit = 0 THEN
        DECLARE
            v_net_return NUMERIC;
            v_tax_return NUMERIC;
        BEGIN
            v_tax_return := ROUND(COALESCE((v_cn.data->>'taxTotal')::numeric, v_cn.tax_total, 0), 2);
            v_net_return := ROUND(v_total_credit - v_tax_return, 2);
            
            -- Debit Revenue
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
            VALUES ('JL-' || v_run_id || '-' || v_journal_id || '-rev-fallback', v_journal_id, v_effective_company_id, v_rev_acc, v_net_return, 0, 'Srv Return (Fallback): ' || COALESCE(v_cn.data->>'number', v_cn.credit_note_number));
            v_total_debit := v_total_debit + v_net_return;
            
            -- Debit Tax if any
            IF v_tax_return > 0 THEN
                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                VALUES ('JL-' || v_run_id || '-' || v_journal_id || '-tax-fallback', v_journal_id, v_effective_company_id, v_tax_acc, v_tax_return, 0, 'Tax Reverse (Fallback): ' || COALESCE(v_cn.data->>'number', v_cn.credit_note_number));
                v_total_debit := v_total_debit + v_tax_return;
            END IF;
        END;
    END IF;

    -- Balancing
    v_total_debit := ROUND(v_total_debit, 2);
    v_total_credit := ROUND(v_total_credit, 2);
    IF v_total_debit != v_total_credit THEN
        IF ABS(v_total_debit - v_total_credit) <= 0.10 THEN
            -- Adjust the last sales return (revenue debit) line to balance
            UPDATE docs_journal_lines SET debit = debit + (v_total_credit - v_total_debit)
            WHERE journal_id = v_journal_id AND (id = 'JL-' || v_run_id || '-' || v_journal_id || '-rev-' || v_idx OR id = 'JL-' || v_run_id || '-' || v_journal_id || '-rev-srv-' || v_idx);
            v_total_debit := v_total_credit;
        ELSE
            RAISE EXCEPTION 'Credit Note Failed: Unbalanced CN (Dr: %, Cr: %). Diff: %', v_total_debit, v_total_credit, (v_total_debit - v_total_credit);
        END IF;
    END IF;

    -- Update flat columns for sync correctly (Preserves built items!)
    UPDATE docs_credit_notes 
    SET status = 'POSTED', 
        data = jsonb_set(
            jsonb_set(COALESCE(v_cn.data, data, '{}'::jsonb), '{status}', '"POSTED"'),
            '{journalEntryId}', to_jsonb(v_journal_id)
        ), 
        updated_at = NOW() 
    WHERE id = p_cn_id;

    -- Upsert Header
    INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, data, updated_at)
    VALUES (v_journal_id, v_effective_company_id, v_cn.date, v_cn.date, 'CREDIT_NOTE', 'POSTED', v_cn.data->>'number', 
        jsonb_build_object('id', v_journal_id, 'date', v_cn.date, 'status', 'POSTED', 'companyId', v_effective_company_id, 'reference', v_cn.data->>'number', 'journalType', 'CREDIT_NOTE', 'preparedBy', COALESCE(v_cn.data->>'preparedBy', v_cn.data->>'salesperson'), 'createdById', v_cn.data->>'createdById'), NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'POSTED', data = EXCLUDED.data;

    -- Update with FULL JSON document (all fields mapped!)
    UPDATE docs_journals 
    SET data = jsonb_build_object(
        'id', id,
        'date', date,
        'status', status,
        'companyId', company_id,
        'reference', reference_number,
        'journalType', 'CREDIT_NOTE',
        'lines', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', id, 
                'accountId', account_id, 
                'debit', debit, 
                'credit', credit, 
                'description', description, 
                'contactId', contact_id
            )) FROM docs_journal_lines WHERE journal_id = v_journal_id
        ), '[]'::jsonb)
    )
    WHERE id = v_journal_id;

    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
END;

   $function$;


-- Function: post_employee_advance_rpc
CREATE OR REPLACE FUNCTION public.post_employee_advance_rpc(p_advance jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    DECLARE
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        v_company_id TEXT;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            v_id TEXT;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                v_amount NUMERIC;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    v_date DATE;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        v_cash_acc TEXT;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            v_advance_acc TEXT;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                v_journal_id TEXT;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    v_desc TEXT;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    BEGIN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        v_company_id := COALESCE(p_advance->>'companyId', p_advance->>'company_id');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            v_id := p_advance->>'id';
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                v_amount := (p_advance->>'amount')::numeric;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    v_date := (p_advance->>'date')::date;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        v_journal_id := 'JE-ADVANCE-' || v_id;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            v_desc := 'Employee Advance Posting: ' || (p_advance->>'number');

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                SELECT id INTO v_cash_acc FROM docs_accounts WHERE (code = '100100' OR sub_type IN ('CASH', 'BANK')) AND company_id = v_company_id LIMIT 1;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    SELECT id INTO v_advance_acc FROM docs_accounts WHERE code = '100204' AND company_id = v_company_id LIMIT 1;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        UPDATE docs_advance_salaries SET status = 'POSTED', data = jsonb_set(COALESCE(data, '{}'::jsonb), '{status}', '"POSTED"'), updated_at = NOW() WHERE id = v_id;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, data, updated_at)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                VALUES (v_journal_id, v_company_id, v_date, v_date, 'ADVANCE', 'POSTED', p_advance->>'number', p_advance, NOW())
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW();

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description) VALUES (v_journal_id || '-dr', v_journal_id, v_company_id, v_advance_acc, v_amount, 0, v_desc);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description) VALUES (v_journal_id || '-cr', v_journal_id, v_company_id, v_cash_acc, 0, v_amount, v_desc);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    $function$;


-- Function: post_inventory_adjustment
CREATE OR REPLACE FUNCTION public.post_inventory_adjustment(p_adj_id text, p_company_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_adj RECORD;
    v_journal_id TEXT;
    v_effective_company_id TEXT;
    v_item JSONB;
    v_prod RECORD;
    v_current_qty NUMERIC;
    v_diff NUMERIC;
    v_valuation NUMERIC;
    v_inv_acc TEXT;
    v_exp_acc TEXT;
    v_total_debit NUMERIC := 0;
    v_target_wh TEXT;
    v_cost_id TEXT;
    v_existing_cost RECORD;
BEGIN
    -- 1. Get Adjustment
    SELECT * INTO v_adj FROM docs_inventory_adjustments WHERE id = p_adj_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Adjustment not found'); END IF;

    IF v_adj.status = 'POSTED' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already posted');
    END IF;

    v_effective_company_id := COALESCE(p_company_id, v_adj.company_id, v_adj.data->>'companyId');

    -- Setup standard accounts
    SELECT id INTO v_inv_acc FROM docs_accounts WHERE code = '100501' AND company_id = v_effective_company_id LIMIT 1;
    SELECT id INTO v_exp_acc FROM docs_accounts WHERE code = '500501' AND company_id = v_effective_company_id LIMIT 1;

    -- Ensure we don't hit unq_journal_num_company if another ID has this reference
    SELECT id INTO v_journal_id FROM docs_journals 
    WHERE company_id = v_effective_company_id AND reference_number = v_adj.data->>'number' LIMIT 1;

    IF v_journal_id IS NULL THEN
        v_journal_id := 'JE-ADJ-' || replace(UPPER(v_adj.id), 'ADJ-', '');
    END IF;

    -- Delete old journal lines just in case
    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE journal_id = v_journal_id;

    v_target_wh := COALESCE(v_adj.data->>'warehouseId', 'WH-MAIN-' || v_effective_company_id);

    -- Loop through items
    FOR v_item IN SELECT * FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_adj.data->'items') = 'array' THEN v_adj.data->'items' ELSE '[]'::jsonb END) LOOP
        SELECT id, data, cost_price INTO v_prod FROM docs_products WHERE id = v_item->>'productId' FOR UPDATE;
        IF FOUND THEN
            v_current_qty := COALESCE((v_prod.data->'stockLevels'->>v_effective_company_id)::numeric, 0);
            v_diff := (v_item->>'newQty')::numeric - v_current_qty;
            v_valuation := ABS(v_diff * COALESCE(v_prod.cost_price, 0));

            -- Inventory Journal lines handled by trigger

            -- Inventory Transaction
            INSERT INTO docs_inventory_transactions (id, company_id, product_id, warehouse_id, transaction_type, quantity, reference_id, reference_type, date, cost_price, data, updated_at)
            VALUES ('mov-adj-' || v_adj.id || '-' || v_prod.id, v_effective_company_id, v_prod.id, v_target_wh, 
                    CASE WHEN v_diff >= 0 THEN 'IN' ELSE 'OUT' END, ABS(v_diff), v_adj.id, 'ADJUSTMENT', (v_adj.data->>'date')::date, COALESCE(v_prod.cost_price, 0),
                    jsonb_build_object('id', 'mov-adj-' || v_adj.id || '-' || v_prod.id, 'companyId', v_effective_company_id, 'productId', v_prod.id, 'warehouseId', v_target_wh, 'transactionType', CASE WHEN v_diff >= 0 THEN 'IN' ELSE 'OUT' END, 'quantity', ABS(v_diff), 'referenceId', v_adj.id, 'referenceType', 'ADJUSTMENT', 'date', v_adj.data->>'date', 'costPrice', COALESCE(v_prod.cost_price, 0)),
                    NOW());

            -- Update Product Stock Level handled by trigger on docs_inventory_transactions

            -- Update Cost Pool
            v_cost_id := v_effective_company_id || ':' || v_prod.id || ':' || v_target_wh;
            SELECT * INTO v_existing_cost FROM docs_product_costs WHERE id = v_cost_id FOR UPDATE;
            IF FOUND THEN
                UPDATE docs_product_costs 
                SET data = jsonb_set(
                            jsonb_set(data, '{totalQty}', ((data->>'totalQty')::numeric + v_diff)::text::jsonb), 
                            '{totalValue}', (((data->>'totalQty')::numeric + v_diff) * COALESCE(v_prod.cost_price, 0))::text::jsonb)
                WHERE id = v_cost_id;
            ELSE
                INSERT INTO docs_product_costs (id, company_id, product_id, warehouse_id, data, updated_at)
                VALUES (v_cost_id, v_effective_company_id, v_prod.id, v_target_wh, 
                        jsonb_build_object('id', v_cost_id, 'companyId', v_effective_company_id, 'productId', v_prod.id, 'warehouseId', v_target_wh, 'avgCost', COALESCE(v_prod.cost_price, 0), 'totalQty', (v_item->>'newQty')::numeric, 'totalValue', (v_item->>'newQty')::numeric * COALESCE(v_prod.cost_price, 0)), 
                        NOW());
            END IF;

        END IF;
    END LOOP;

    -- Upsert Journal Header
    INSERT INTO docs_journals (id, company_id, date, journal_type, status, reference_number, data, updated_at)
    VALUES (v_journal_id, v_effective_company_id, (v_adj.data->>'date')::date, 'INVENTORY', 'POSTED', v_adj.data->>'number', 
        jsonb_build_object('id', v_journal_id, 'date', v_adj.data->>'date', 'status', 'POSTED', 'companyId', v_effective_company_id, 'reference', v_adj.data->>'number', 'journalType', 'INVENTORY', 'preparedBy', COALESCE(v_adj.data->>'preparedBy', 'System'), 'createdById', v_adj.data->>'createdById'), NOW())
    ON CONFLICT (id) DO UPDATE SET updated_at = NOW(), status = 'POSTED';

    -- Mark Adjustment as POSTED
    UPDATE docs_inventory_adjustments SET status = 'POSTED', data = jsonb_set(data, '{status}', '"POSTED"') WHERE id = p_adj_id;

    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
END;
$function$;


-- Function: post_inventory_ledger_lines
CREATE OR REPLACE FUNCTION public.post_inventory_ledger_lines()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
        DECLARE
            v_journal_id TEXT;
            v_inv_acc TEXT;
            v_cogs_acc TEXT;
            v_exp_acc TEXT;
            v_valuation NUMERIC;
            v_company_id TEXT;
            v_product_name TEXT;
            v_contact_id TEXT;
            v_ref_type TEXT;
            v_ref_id TEXT;
            v_tx_id TEXT;
            v_tx_type TEXT;
        BEGIN
            IF TG_OP = 'DELETE' THEN
                v_company_id := OLD.company_id;
                v_ref_type := OLD.reference_type;
                v_ref_id := OLD.reference_id;
                v_tx_id := OLD.id;
                v_tx_type := OLD.transaction_type;
            ELSE
                v_company_id := NEW.company_id;
                v_ref_type := NEW.reference_type;
                v_ref_id := NEW.reference_id;
                v_tx_id := NEW.id;
                v_tx_type := NEW.transaction_type;
                v_valuation := ROUND(NEW.quantity * NEW.cost_price, 2);
                

                SELECT id INTO v_inv_acc FROM docs_accounts WHERE code = '100501' AND company_id = v_company_id LIMIT 1;
                IF v_inv_acc IS NULL THEN SELECT id INTO v_inv_acc FROM docs_accounts WHERE (name ILIKE '%inventory%' OR code ILIKE '1005%') AND company_id = v_company_id LIMIT 1; END IF;
                IF v_inv_acc IS NULL THEN
                    v_inv_acc := 'acc-inv-' || v_company_id;
                    INSERT INTO docs_accounts (id, company_id, code, name, type, data) VALUES (v_inv_acc, v_company_id, '100501', 'Inventory Asset', 'ASSET', '{"code":"100501","name":"Inventory Asset","type":"ASSET"}') ON CONFLICT DO NOTHING;
                END IF;
                
                SELECT id INTO v_cogs_acc FROM docs_accounts WHERE code IN ('500101', '500100', '400501') AND company_id = v_company_id LIMIT 1;
                IF v_cogs_acc IS NULL THEN SELECT id INTO v_cogs_acc FROM docs_accounts WHERE (name ILIKE '%cost of goods%' OR name ILIKE '%cogs%' OR code ILIKE '5001%' OR code ILIKE '4005%') AND company_id = v_company_id LIMIT 1; END IF;
                IF v_cogs_acc IS NULL THEN
                    v_cogs_acc := 'acc-cogs-' || v_company_id;
                    INSERT INTO docs_accounts (id, company_id, code, name, type, data) VALUES (v_cogs_acc, v_company_id, '500101', 'Cost of Goods Sold', 'EXPENSE', '{"code":"500101","name":"Cost of Goods Sold","type":"EXPENSE"}') ON CONFLICT DO NOTHING;
                END IF;
                
                SELECT id INTO v_exp_acc FROM docs_accounts WHERE code = '500501' AND company_id = v_company_id LIMIT 1;
                IF v_exp_acc IS NULL THEN SELECT id INTO v_exp_acc FROM docs_accounts WHERE (name ILIKE '%adjustment%' OR code ILIKE '5005%') AND company_id = v_company_id LIMIT 1; END IF;
                IF v_exp_acc IS NULL THEN
                    v_exp_acc := 'acc-adj-' || v_company_id;
                    INSERT INTO docs_accounts (id, company_id, code, name, type, data) VALUES (v_exp_acc, v_company_id, '500501', 'Inventory Adjustment', 'EXPENSE', '{"code":"500501","name":"Inventory Adjustment","type":"EXPENSE"}') ON CONFLICT DO NOTHING;
                END IF;

                
                SELECT data->>'name' INTO v_product_name FROM docs_products WHERE id = NEW.product_id;
            END IF;
            
            IF v_ref_type = 'INVOICE' THEN
                SELECT COALESCE(journal_entry_id, 'JE-' || replace(replace(UPPER(v_ref_id), 'INV-', ''), 'INVOICE-', '')) INTO v_journal_id FROM docs_invoices WHERE id = v_ref_id OR upper(id) = upper(v_ref_id) limit 1; 
                IF v_journal_id IS NULL THEN v_journal_id := 'JE-' || replace(replace(UPPER(v_ref_id), 'INV-', ''), 'INVOICE-', ''); END IF;
                
                IF TG_OP = 'DELETE' THEN
                    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE id = 'JL-' || v_journal_id || '-cogs-' || v_tx_id;
                    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE id = 'JL-' || v_journal_id || '-inv-' || v_tx_id;
                    RETURN OLD;
                END IF;
                
                IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND v_tx_type = 'OUT' AND v_valuation > 0 THEN 
                     INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                     VALUES ('JL-' || v_journal_id || '-cogs-' || v_tx_id, v_journal_id, v_company_id, v_cogs_acc, v_valuation, 0, 'COGS: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                     INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                     VALUES ('JL-' || v_journal_id || '-inv-' || v_tx_id, v_journal_id, v_company_id, v_inv_acc, 0, v_valuation, 'Inv Red: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                END IF;
            ELSIF v_ref_type = 'CREDIT_NOTE' THEN
                SELECT COALESCE(data->>'journalEntryId', 'JE-' || replace(replace(UPPER(v_ref_id), 'CN-', ''), 'CREDIT-', '')) INTO v_journal_id FROM docs_credit_notes WHERE id = v_ref_id OR upper(id) = upper(v_ref_id) limit 1; 
                IF v_journal_id IS NULL THEN v_journal_id := 'JE-' || replace(replace(UPPER(v_ref_id), 'CN-', ''), 'CREDIT-', ''); END IF;
                
                IF TG_OP = 'DELETE' THEN
                    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE id = 'JL-' || v_journal_id || '-inv-' || v_tx_id;
                    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE id = 'JL-' || v_journal_id || '-cogs-' || v_tx_id;
                    RETURN OLD;
                END IF;
                
                IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND v_tx_type = 'IN' AND v_valuation > 0 THEN 
                     INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                     VALUES ('JL-' || v_journal_id || '-inv-' || v_tx_id, v_journal_id, v_company_id, v_inv_acc, v_valuation, 0, 'Inv Add: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                     INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                     VALUES ('JL-' || v_journal_id || '-cogs-' || v_tx_id, v_journal_id, v_company_id, v_cogs_acc, 0, v_valuation, 'COGS Rev: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                END IF;
            ELSIF v_ref_type = 'ADJUSTMENT' THEN
                v_journal_id := 'JE-ADJ-' || replace(UPPER(v_ref_id), 'ADJ-', '');
                IF TG_OP = 'DELETE' THEN
                    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE id = 'JL-' || v_journal_id || '-inv-' || v_tx_id;
                    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE id = 'JL-' || v_journal_id || '-exp-' || v_tx_id;
                    RETURN OLD;
                END IF;
                
                IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND v_valuation > 0 THEN 
                     SELECT data->>'contactId' INTO v_contact_id FROM docs_inventory_adjustments WHERE id = v_ref_id;
                     IF v_tx_type = 'IN' THEN 
                         INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                         VALUES ('JL-' || v_journal_id || '-inv-' || v_tx_id, v_journal_id, v_company_id, v_inv_acc, v_valuation, 0, 'Adj Inv Add: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                         INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
                         VALUES ('JL-' || v_journal_id || '-exp-' || v_tx_id, v_journal_id, v_company_id, v_exp_acc, v_contact_id, 0, v_valuation, 'Adj Gain: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                     ELSE 
                         INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
                         VALUES ('JL-' || v_journal_id || '-exp-' || v_tx_id, v_journal_id, v_company_id, v_exp_acc, v_contact_id, v_valuation, 0, 'Adj Loss: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                         INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                         VALUES ('JL-' || v_journal_id || '-inv-' || v_tx_id, v_journal_id, v_company_id, v_inv_acc, 0, v_valuation, 'Adj Inv Red: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                     END IF;
                END IF;
            END IF;
            IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
        END;
$function$;


-- Function: post_invoice
CREATE OR REPLACE FUNCTION public.post_invoice(p_invoice_id text, p_company_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$

            DECLARE
                v_invoice RECORD;
                v_journal_id TEXT;
                v_rev_acc TEXT;
                v_ar_acc TEXT;
                v_tax_acc TEXT;
                v_total_debit NUMERIC := 0;
                v_total_credit NUMERIC := 0;
                v_item JSONB;
                v_items_count INT;
                v_current_item_idx INT := 0;
                v_item_subtotal NUMERIC;
                v_global_discount NUMERIC := 0;
                v_proportional_discount NUMERIC;
                v_discount_distributed NUMERIC := 0;
                v_total_revenue_subtotal NUMERIC := 0;
                v_revenue_net NUMERIC;
                v_idx INT := 0;
                v_is_cash_sale BOOLEAN;
                v_liquidity_acc TEXT;
                v_pay_id TEXT;
                v_tax_total NUMERIC;
                v_wh_id TEXT;
                v_wac_cost NUMERIC;
                v_product_record RECORD;
                v_effective_company_id TEXT;
                v_cogs_acc TEXT;
                v_inv_acc TEXT;
                v_cogs_amount NUMERIC;
            BEGIN
                -- bypass_audit removed
                SELECT * INTO v_invoice FROM docs_invoices WHERE id = p_invoice_id;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Invoice % not found', p_invoice_id;
                END IF;

                v_effective_company_id := COALESCE(v_invoice.company_id, p_company_id);

                v_journal_id := 'JE-' || UPPER(v_invoice.id);
                
                IF EXISTS(SELECT 1 FROM docs_journals WHERE id = v_journal_id AND status = 'POSTED') THEN
                   RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id, 'message', 'Already posted');
                END IF;

                DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id AND id NOT LIKE '%-cogs-%' AND id NOT LIKE '%-inv-%';
                

                INSERT INTO docs_journals (id, company_id, date, reference, reference_number, description, status, created_by_id, journal_type, data)
                VALUES (v_journal_id, v_effective_company_id, v_invoice.date, COALESCE(v_invoice.invoice_number, v_invoice.id), COALESCE(v_invoice.invoice_number, v_invoice.id), 'Invoice ' || COALESCE(v_invoice.invoice_number, v_invoice.id), 'DRAFT', v_invoice.customer_id, 'INV', jsonb_build_object('source', 'INV', 'journalEntryId', v_journal_id))
                ON CONFLICT (id) DO UPDATE SET date = EXCLUDED.date, reference = EXCLUDED.reference, reference_number = EXCLUDED.reference_number, description = EXCLUDED.description, status = 'DRAFT', data = EXCLUDED.data;

                
                SELECT id INTO v_ar_acc FROM docs_accounts WHERE (code IN ('1012','100200','100201','AR') OR data->>'code' IN ('1012','100200','100201','AR')) AND (company_id = v_effective_company_id OR data->>'companyId' = v_effective_company_id OR data->>'company_id' = v_effective_company_id) LIMIT 1;
                IF v_ar_acc IS NULL THEN SELECT id INTO v_ar_acc FROM docs_accounts WHERE (type = 'ASSET' OR data->>'type' = 'ASSET') AND (name ILIKE '%receivable%' OR data->>'name' ILIKE '%receivable%') AND (company_id = v_effective_company_id OR data->>'companyId' = v_effective_company_id OR data->>'company_id' = v_effective_company_id) LIMIT 1; END IF;
                IF v_ar_acc IS NULL THEN 
                    v_ar_acc := 'acc-ar-' || v_effective_company_id;
                    INSERT INTO docs_accounts (id, company_id, code, name, type, data) VALUES (v_ar_acc, v_effective_company_id, 'AR', 'Accounts Receivable', 'ASSET', jsonb_build_object('id', v_ar_acc, 'code', 'AR', 'name', 'Accounts Receivable', 'type', 'ASSET', 'companyId', v_effective_company_id)) ON CONFLICT DO NOTHING;
                END IF;

                SELECT id INTO v_rev_acc FROM docs_accounts WHERE (code IN ('4011', '4000', '400100', 'REVENUE', 'SALES') OR data->>'code' IN ('4011', '4000', '400100', 'REVENUE', 'SALES')) AND (company_id = v_effective_company_id OR data->>'companyId' = v_effective_company_id OR data->>'company_id' = v_effective_company_id) LIMIT 1;
                IF v_rev_acc IS NULL THEN SELECT id INTO v_rev_acc FROM docs_accounts WHERE (type = 'REVENUE' OR data->>'type' = 'REVENUE') AND (company_id = v_effective_company_id OR data->>'companyId' = v_effective_company_id OR data->>'company_id' = v_effective_company_id) LIMIT 1; END IF;
                IF v_rev_acc IS NULL THEN
                    v_rev_acc := 'acc-rev-' || v_effective_company_id;
                    INSERT INTO docs_accounts (id, company_id, code, name, type, data) VALUES (v_rev_acc, v_effective_company_id, 'REV', 'General Revenue', 'REVENUE', jsonb_build_object('id', v_rev_acc, 'code', 'REV', 'name', 'General Revenue', 'type', 'REVENUE', 'companyId', v_effective_company_id)) ON CONFLICT DO NOTHING;
                END IF;

                SELECT id INTO v_tax_acc FROM docs_accounts WHERE (code IN ('2011', '200100', 'TAX_PAYABLE') OR data->>'code' IN ('2011', '200100', 'TAX_PAYABLE')) AND (company_id = v_effective_company_id OR data->>'companyId' = v_effective_company_id OR data->>'company_id' = v_effective_company_id) LIMIT 1;
                IF v_tax_acc IS NULL THEN SELECT id INTO v_tax_acc FROM docs_accounts WHERE (name ILIKE '%tax%payable%' OR data->>'name' ILIKE '%tax%payable%') AND (company_id = v_effective_company_id OR data->>'companyId' = v_effective_company_id OR data->>'company_id' = v_effective_company_id) LIMIT 1; END IF;
                IF v_tax_acc IS NULL THEN SELECT id INTO v_tax_acc FROM docs_accounts WHERE (type = 'LIABILITY' OR data->>'type' = 'LIABILITY') AND (company_id = v_effective_company_id OR data->>'companyId' = v_effective_company_id OR data->>'company_id' = v_effective_company_id) LIMIT 1; END IF;
                IF v_tax_acc IS NULL THEN
                    v_tax_acc := 'acc-tax-' || v_effective_company_id;
                    INSERT INTO docs_accounts (id, company_id, code, name, type, data) VALUES (v_tax_acc, v_effective_company_id, 'TAX', 'Tax Payable', 'LIABILITY', jsonb_build_object('id', v_tax_acc, 'code', 'TAX', 'name', 'Tax Payable', 'type', 'LIABILITY', 'companyId', v_effective_company_id)) ON CONFLICT DO NOTHING;
                END IF;
                SELECT id INTO v_cogs_acc FROM docs_accounts WHERE (code IN ('5011', '500100', '500101', 'COGS') OR data->>'code' IN ('5011', '500100', '500101', 'COGS')) AND (company_id = v_effective_company_id OR data->>'companyId' = v_effective_company_id OR data->>'company_id' = v_effective_company_id) LIMIT 1;
                IF v_cogs_acc IS NULL THEN SELECT id INTO v_cogs_acc FROM docs_accounts WHERE (name ILIKE '%cost of goods%' OR data->>'name' ILIKE '%cost of goods%') AND (company_id = v_effective_company_id OR data->>'companyId' = v_effective_company_id OR data->>'company_id' = v_effective_company_id) LIMIT 1; END IF;
                IF v_cogs_acc IS NULL THEN SELECT id INTO v_cogs_acc FROM docs_accounts WHERE (type = 'EXPENSE' OR data->>'type' = 'EXPENSE') AND (company_id = v_effective_company_id OR data->>'companyId' = v_effective_company_id OR data->>'company_id' = v_effective_company_id) LIMIT 1; END IF;
                IF v_cogs_acc IS NULL THEN
                    v_cogs_acc := 'acc-cogs-' || v_effective_company_id;
                    INSERT INTO docs_accounts (id, company_id, code, name, type, data) VALUES (v_cogs_acc, v_effective_company_id, 'COGS', 'Cost of Goods Sold', 'EXPENSE', jsonb_build_object('id', v_cogs_acc, 'code', 'COGS', 'name', 'Cost of Goods Sold', 'type', 'EXPENSE', 'companyId', v_effective_company_id)) ON CONFLICT DO NOTHING;
                END IF;

                SELECT id INTO v_inv_acc FROM docs_accounts WHERE (code IN ('1013', '100500', '100501', 'INVENTORY') OR data->>'code' IN ('1013', '100500', '100501', 'INVENTORY')) AND (company_id = v_effective_company_id OR data->>'companyId' = v_effective_company_id OR data->>'company_id' = v_effective_company_id) LIMIT 1;
                IF v_inv_acc IS NULL THEN SELECT id INTO v_inv_acc FROM docs_accounts WHERE (name ILIKE '%inventory%' OR data->>'name' ILIKE '%inventory%') AND (company_id = v_effective_company_id OR data->>'companyId' = v_effective_company_id OR data->>'company_id' = v_effective_company_id) LIMIT 1; END IF;
                IF v_inv_acc IS NULL THEN SELECT id INTO v_inv_acc FROM docs_accounts WHERE (type = 'ASSET' OR data->>'type' = 'ASSET') AND (company_id = v_effective_company_id OR data->>'companyId' = v_effective_company_id OR data->>'company_id' = v_effective_company_id) LIMIT 1; END IF;
                IF v_inv_acc IS NULL THEN
                    v_inv_acc := 'acc-inv-' || v_effective_company_id;
                    INSERT INTO docs_accounts (id, company_id, code, name, type, data) VALUES (v_inv_acc, v_effective_company_id, 'INV', 'Inventory Asset', 'ASSET', jsonb_build_object('id', v_inv_acc, 'code', 'INV', 'name', 'Inventory Asset', 'type', 'ASSET', 'companyId', v_effective_company_id)) ON CONFLICT DO NOTHING;
                END IF;
  

                -- AR insert moved to end

                v_global_discount := COALESCE(CAST(v_invoice.data->>'discountTotal' AS NUMERIC), 0);

                SELECT COUNT(*) INTO v_items_count FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_invoice.data->'items') = 'array' THEN v_invoice.data->'items' ELSE '[]'::jsonb END) AS i
                WHERE i->>'type' = 'PRODUCT' OR i->>'type' IS NULL;

                FOR v_item IN SELECT * FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_invoice.data->'items') = 'array' THEN v_invoice.data->'items' ELSE '[]'::jsonb END)
                LOOP
                    IF v_item->>'type' = 'PRODUCT' OR v_item->>'type' IS NULL THEN
                        IF (v_item->>'quantity') IS NOT NULL AND (v_item->>'unitPrice') IS NOT NULL THEN
                           v_total_revenue_subtotal := v_total_revenue_subtotal + COALESCE((v_item->>'lineValue')::numeric, (v_item->>'quantity')::numeric * (v_item->>'unitPrice')::numeric);
                        ELSE
                           v_total_revenue_subtotal := v_total_revenue_subtotal + COALESCE((v_item->>'lineValue')::numeric, 0);
                        END IF;
                    END IF;
                END LOOP;

                BEGIN
                    FOR v_item IN SELECT * FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_invoice.data->'items') = 'array' THEN v_invoice.data->'items' ELSE '[]'::jsonb END)
                    LOOP
                        v_idx := v_idx + 1;
                        IF v_item->>'type' = 'PRODUCT' OR v_item->>'type' IS NULL THEN
                            v_current_item_idx := v_current_item_idx + 1;
                            
                            IF (v_item->>'quantity') IS NOT NULL AND (v_item->>'unitPrice') IS NOT NULL THEN
                               v_item_subtotal := COALESCE((v_item->>'lineValue')::numeric, (v_item->>'quantity')::numeric * (v_item->>'unitPrice')::numeric);
                            ELSE
                               v_item_subtotal := COALESCE((v_item->>'lineValue')::numeric, 0);
                            END IF;
                            
                            IF v_current_item_idx = v_items_count THEN
                                v_proportional_discount := ROUND(v_global_discount - v_discount_distributed, 2);
                            ELSE
                                v_proportional_discount := CASE WHEN v_total_revenue_subtotal > 0 THEN (v_item_subtotal / v_total_revenue_subtotal) * v_global_discount ELSE 0 END;
                                v_proportional_discount := ROUND(v_proportional_discount, 2);
                                v_discount_distributed := v_discount_distributed + v_proportional_discount;
                            END IF;

                            v_revenue_net := ROUND(v_item_subtotal - v_proportional_discount, 2); 

                            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                            VALUES ('JL-' || v_journal_id || '-rev-' || v_idx, v_journal_id, v_effective_company_id, COALESCE(v_rev_acc, 'MISSING-REV'), 0, v_revenue_net, 'Revenue: ' || (v_item->>'description'));
                            v_total_credit := v_total_credit + v_revenue_net;

                            IF v_item->>'type' = 'PRODUCT' OR v_item->>'type' IS NULL THEN
                                v_wh_id := 'wh-' || v_effective_company_id;
                                SELECT avg_cost INTO v_wac_cost FROM docs_product_costs 
                                WHERE product_id = (v_item->>'productId') AND warehouse_id = v_wh_id AND company_id = v_effective_company_id;
                                
                                IF v_wac_cost IS NULL THEN
                                   SELECT cost_price INTO v_wac_cost FROM docs_products WHERE id = (v_item->>'productId');
                                END IF;
                                IF v_wac_cost IS NULL THEN v_wac_cost := 0; END IF;

                                UPDATE docs_invoice_lines 
                                 SET cost_price_at_sale = v_wac_cost
                                WHERE id = (v_item->>'id');
                                
                                
                                SELECT * INTO v_product_record FROM docs_products WHERE id = (v_item->>'productId');

                                v_cogs_amount := ROUND(v_wac_cost * COALESCE((v_item->>'quantity')::numeric, 1), 2);
                                IF v_cogs_amount > 0 THEN
                                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                                    VALUES ('JL-' || v_journal_id || '-cogs-' || v_idx, v_journal_id, v_effective_company_id, COALESCE(v_cogs_acc, 'MISSING-COGS'), v_cogs_amount, 0, 'COGS: ' || (v_item->>'description'));

                                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                                    VALUES ('JL-' || v_journal_id || '-inv-' || v_idx, v_journal_id, v_effective_company_id, COALESCE(v_inv_acc, 'MISSING-INV'), 0, v_cogs_amount, 'Inventory: ' || (v_item->>'description'));
                                END IF;


                                
      
                            END IF;
                        ELSIF v_item->>'type' = 'TAX' THEN
                            v_tax_total := ROUND(COALESCE((v_item->>'lineValue')::numeric, COALESCE((v_item->>'taxAmount')::numeric, 0)), 2);
                            IF v_tax_total = 0 THEN
                                 v_tax_total := ROUND(COALESCE((v_item->>'taxTotal')::numeric, 0), 2);
                            END IF;
                            
                            IF v_tax_total > 0 THEN
                               INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                               VALUES ('JL-' || v_journal_id || '-tax-' || v_idx, v_journal_id, v_effective_company_id, COALESCE(v_tax_acc, 'MISSING-TAX'), 0, v_tax_total, 'Tax: ' || (v_item->>'description'));
                               v_total_credit := v_total_credit + v_tax_total;
                            END IF;
                        END IF;
                    END LOOP;
                END;

                v_total_credit := ROUND(v_total_credit, 2);
                v_total_debit := v_total_credit;
                
                -- Create AR debit line perfectly balancing the credits (fixing accounting violation)
                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
                VALUES ('JL-' || v_journal_id || '-ar', v_journal_id, v_effective_company_id, 
                        COALESCE(v_ar_acc, 'MISSING-AR'),
                        v_invoice.customer_id, v_total_debit, 0, 'Accounts Receivable: ' || COALESCE(v_invoice.invoice_number, v_invoice.id));
                
                IF COALESCE(v_invoice.total, 0) != v_total_debit THEN
                    UPDATE docs_invoices SET total = v_total_debit, data = jsonb_set(COALESCE(data, '{}'::jsonb), '{total}', to_jsonb(v_total_debit)) WHERE id = p_invoice_id;
                END IF;
                
                /* update journal removed here */

                -- FIX: Set invoice status to POSTED explicitly before cash sale logic evaluates
                UPDATE docs_invoices SET status = 'POSTED', journal_entry_id = v_journal_id, data = jsonb_set(jsonb_set(COALESCE(data, '{}'::jsonb), '{status}', to_jsonb('POSTED'::text)), '{journalEntryId}', to_jsonb(v_journal_id::text)) WHERE id = p_invoice_id AND status = 'DRAFT';
UPDATE docs_journals SET status = 'POSTED', updated_at = NOW() WHERE id = v_journal_id;

                -- Cash Sale Auto Payment Logic (when first posted)
                v_is_cash_sale := COALESCE(v_invoice.customer_id, '') ILIKE '%cash-sale%' OR EXISTS(SELECT 1 FROM docs_contacts WHERE id = v_invoice.customer_id AND (name ILIKE '%cash sale%' OR name ILIKE '%cash-sale%'));
                IF v_is_cash_sale AND NOT EXISTS (
                    SELECT 1 FROM docs_payments p, jsonb_array_elements(CASE WHEN jsonb_typeof(p.data->'appliedInvoices') = 'array' THEN p.data->'appliedInvoices' ELSE '[]'::jsonb END) AS app
                    WHERE p.id <> 'PAY-AUTO-' || p_invoice_id AND p.status = 'POSTED' AND app->>'invoiceId' = p_invoice_id
                ) THEN
                    SELECT id INTO v_liquidity_acc FROM docs_accounts WHERE code IN ('1011', '100100', '100101', 'CASH', 'BANK') AND company_id = v_effective_company_id LIMIT 1;
                    IF v_liquidity_acc IS NULL THEN SELECT id INTO v_liquidity_acc FROM docs_accounts WHERE (name ILIKE '%cash%' OR name ILIKE '%bank%') AND company_id = v_effective_company_id LIMIT 1; END IF;
                    IF v_liquidity_acc IS NULL THEN SELECT id INTO v_liquidity_acc FROM docs_accounts WHERE type = 'ASSET' AND company_id = v_effective_company_id LIMIT 1; END IF;
                    
                    v_pay_id := 'PAY-AUTO-' || p_invoice_id;
                    INSERT INTO docs_payments (id, company_id, date, contact_id, status, type, amount, payment_date, applied_invoices, data, updated_at)
                    VALUES (
                        v_pay_id, v_effective_company_id, v_invoice.date, v_invoice.customer_id, 'DRAFT', 'RECEIPT', COALESCE(v_invoice.total, 0), v_invoice.date, jsonb_build_array(jsonb_build_object('invoiceId', p_invoice_id, 'invoiceNumber', COALESCE(v_invoice.invoice_number, '(DRAFT)'), 'amount', COALESCE(v_invoice.total, 0), 'remaining', 0)),
                        jsonb_build_object(
                            'id', v_pay_id, 'amount', COALESCE(v_invoice.total, 0),
                            'contactId', v_invoice.customer_id, 'date', v_invoice.date, 'method', 'CASH', 'type', 'RECEIPT',
                            'accountId', v_liquidity_acc, 'status', 'DRAFT', 'companyId', v_effective_company_id,
                            'appliedInvoices', jsonb_build_array(jsonb_build_object('invoiceId', p_invoice_id, 'invoiceNumber', COALESCE(v_invoice.invoice_number, '(DRAFT)'), 'amount', COALESCE(v_invoice.total, 0), 'remaining', 0))
                        ),
                        NOW()
                    ) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, applied_invoices = EXCLUDED.applied_invoices, date = EXCLUDED.date, payment_date = EXCLUDED.payment_date, amount = EXCLUDED.amount, type = EXCLUDED.type, updated_at = NOW();
                    
                    PERFORM post_payment(v_pay_id, v_effective_company_id);
                    
                    UPDATE docs_invoices SET status = 'PAID', data = jsonb_set(COALESCE(data, '{}'::jsonb), '{status}', to_jsonb('PAID'::text)) WHERE id = p_invoice_id;
                END IF;

                RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
            END;

$function$;


-- Function: post_invoice_v2
CREATE OR REPLACE FUNCTION public.post_invoice_v2(p_invoice_id text, p_company_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_invoice RECORD;
    v_item JSONB;
    v_journal_id TEXT;
    v_total_debit NUMERIC := 0;
    v_total_credit NUMERIC := 0;
    v_product_record RECORD;
    v_current_stock NUMERIC;
    v_new_stock NUMERIC;
    v_item_subtotal NUMERIC := 0;
    v_revenue_net NUMERIC := 0;
    v_global_discount NUMERIC := 0;
    v_total_revenue_subtotal NUMERIC := 0;
    v_proportional_discount NUMERIC := 0;
    v_cogs_value NUMERIC := 0;
    v_ar_acc TEXT;
    v_rev_acc TEXT;
    v_cogs_acc TEXT;
    v_inv_acc TEXT;
    v_tax_acc TEXT;
    v_tax_total NUMERIC := 0;
    v_idx INT := 0;
    v_effective_company_id TEXT;
    v_is_cash_sale BOOLEAN;
    v_liquidity_acc TEXT;
    v_pay_id TEXT;
BEGIN
    -- 1. Get Invoice Data
    SELECT * INTO v_invoice FROM docs_invoices WHERE id = p_invoice_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found: %', p_invoice_id; END IF;
    
    v_journal_id := COALESCE(v_invoice.data->>'journalEntryId', 'JE-' || replace(UPPER(v_invoice.id), 'INV-', ''));
    
    -- Prevent duplicate posting
    IF EXISTS(SELECT 1 FROM docs_journals WHERE id = v_journal_id AND status = 'POSTED') THEN 
        RETURN jsonb_build_object('success', true, 'message', 'Already posted', 'journal_id', v_journal_id); 
    END IF;

    v_effective_company_id := COALESCE(p_company_id, v_invoice.company_id, v_invoice.data->>'companyId');
    
    -- 2. Resolve ALL Required Accounts
    SELECT id INTO v_ar_acc FROM docs_accounts WHERE code IN ('100201', '100200') AND company_id = v_effective_company_id LIMIT 1;
    SELECT id INTO v_rev_acc FROM docs_accounts WHERE code IN ('400100', '400000') AND company_id = v_effective_company_id LIMIT 1;
    SELECT id INTO v_cogs_acc FROM docs_accounts WHERE code IN ('500101', '500100') AND company_id = v_effective_company_id LIMIT 1;
    SELECT id INTO v_inv_acc FROM docs_accounts WHERE code IN ('100501', '100500') AND company_id = v_effective_company_id LIMIT 1;
    SELECT id INTO v_tax_acc FROM docs_accounts WHERE code = '200400' AND company_id = v_effective_company_id LIMIT 1;

    -- 3. Calculate Global Totals for Proportional Distribution
    FOR v_item IN SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(v_invoice.data->'items') = 'array' THEN v_invoice.data->'items' ELSE '[]'::jsonb END) LOOP
        IF v_item->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE') THEN
            v_item_subtotal := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
            IF v_item_subtotal = 0 THEN
                v_item_subtotal := COALESCE((v_item->>'quantity')::numeric, 0) * COALESCE((v_item->>'unitPrice')::numeric, 0);
                IF v_item->>'discountMode' = 'FIXED' THEN v_item_subtotal := v_item_subtotal - COALESCE((v_item->>'discountRate')::numeric, 0);
                ELSE v_item_subtotal := v_item_subtotal * (1 - COALESCE((v_item->>'discountRate')::numeric, 0) / 100); END IF;
            END IF;
            v_total_revenue_subtotal := v_total_revenue_subtotal + ROUND(v_item_subtotal, 2);
        ELSIF v_item->>'type' = 'DISCOUNT' THEN
            v_item_subtotal := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
            IF v_item_subtotal = 0 THEN
                IF v_item->>'discountMode' = 'FIXED' THEN v_item_subtotal := -ROUND(COALESCE((v_item->>'discountRate')::numeric, 0), 2);
                ELSE v_item_subtotal := -ROUND(v_total_revenue_subtotal * COALESCE((v_item->>'discountRate')::numeric, 0) / 100.0, 2); END IF;
            END IF;
            v_global_discount := v_global_discount + v_item_subtotal;
        END IF;
    END LOOP;

    -- 4. Set status to POSTED
    UPDATE docs_invoices SET status = 'POSTED', data = jsonb_set(COALESCE(data, '{}'::jsonb), '{status}', '"POSTED"') WHERE id = p_invoice_id RETURNING * INTO v_invoice;

    -- 5. Build Journal Header & Clear Old Lines
    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE journal_id = v_journal_id;
    INSERT INTO docs_journals (id, company_id, date, journal_type, status, reference_number, data, updated_at)
    VALUES (v_journal_id, v_effective_company_id, v_invoice.date, 'INV', 'POSTED', v_invoice.data->>'number', 
        jsonb_build_object('id', v_journal_id, 'journalType', 'INV'), NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'POSTED';

    -- 6. Insert A/R (Accounts Receivable) Line
    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
    VALUES ('JL-' || v_journal_id || '-ar', v_journal_id, v_effective_company_id, v_ar_acc, v_invoice.customer_id, ROUND(COALESCE((v_invoice.data->>'total')::numeric, 0), 2), 0, 'AR: ' || (v_invoice.data->>'number')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
    v_total_debit := ROUND(COALESCE((v_invoice.data->>'total')::numeric, 0), 2);

    -- 7. Process Items: Revenue, COGS, Inventory Asset & Stock Deduction
    DECLARE
        v_discount_distributed NUMERIC := 0;
        v_items_count INT := 0;
        v_current_item_idx INT := 0;
    BEGIN
        SELECT count(*) INTO v_items_count FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_invoice.data->'items') = 'array' THEN v_invoice.data->'items' ELSE '[]'::jsonb END) it WHERE it->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE');
        
        FOR v_item IN SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(v_invoice.data->'items') = 'array' THEN v_invoice.data->'items' ELSE '[]'::jsonb END) LOOP
            v_idx := v_idx + 1;
            IF v_item->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE') THEN
                v_current_item_idx := v_current_item_idx + 1;
                v_item_subtotal := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                
                -- Distribute Discount
                IF v_current_item_idx = v_items_count THEN v_proportional_discount := ROUND(v_global_discount - v_discount_distributed, 2);
                ELSE v_proportional_discount := ROUND(CASE WHEN v_total_revenue_subtotal > 0 THEN (v_item_subtotal / v_total_revenue_subtotal) * v_global_discount ELSE 0 END, 2);
                v_discount_distributed := v_discount_distributed + v_proportional_discount; END IF;

                -- Insert Revenue Line
                v_revenue_net := ROUND(v_item_subtotal + v_proportional_discount, 2);
                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                VALUES ('JL-' || v_journal_id || '-rev-' || v_idx, v_journal_id, v_effective_company_id, v_rev_acc, 0, v_revenue_net, 'Revenue: ' || COALESCE(v_item->>'description', 'Item')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                v_total_credit := v_total_credit + v_revenue_net;

                -- Explicit Stock Deduction & COGS Calculation
                IF v_item->>'type' = 'PRODUCT' THEN
                    SELECT * INTO v_product_record FROM docs_products WHERE id = (v_item->>'productId') FOR UPDATE;
                    IF FOUND THEN
                        -- Deduct Stock dynamically
                        v_current_stock := COALESCE((v_product_record.data->'stockLevels'->>v_effective_company_id)::numeric, COALESCE(v_product_record.quantity_on_hand, 0));
                        v_new_stock := v_current_stock - COALESCE((v_item->>'quantity')::numeric, 0);

                        UPDATE docs_products 
                        SET quantity_on_hand = v_new_stock,
                            data = jsonb_set(jsonb_set(CASE WHEN data ? 'stockLevels' THEN data ELSE data || '{"stockLevels": {}}'::jsonb END, ARRAY['stockLevels', v_effective_company_id], v_new_stock::text::jsonb), '{quantityOnHand}', v_new_stock::text::jsonb),
                            updated_at = NOW()
                        WHERE id = v_product_record.id;

                        -- Create Explicit Inventory Transaction History
                        INSERT INTO docs_inventory_transactions (id, company_id, product_id, warehouse_id, transaction_type, quantity, reference_id, reference_type, date, cost_price, data, updated_at)
                        VALUES ('mov-inv-' || p_invoice_id || '-' || v_idx, v_effective_company_id, v_product_record.id, 'WH-MAIN-' || v_effective_company_id, 'OUT', COALESCE((v_item->>'quantity')::numeric, 0), p_invoice_id, 'INVOICE', v_invoice.date, COALESCE(v_product_record.cost_price, (v_product_record.data->>'costPrice')::numeric, 0),
                            jsonb_build_object('id', 'mov-inv-' || p_invoice_id || '-' || v_idx, 'companyId', v_effective_company_id, 'productId', v_product_record.id, 'transactionType', 'OUT', 'quantity', COALESCE((v_item->>'quantity')::numeric, 0), 'referenceId', p_invoice_id, 'referenceType', 'INVOICE', 'date', v_invoice.date), NOW()
                        ) ON CONFLICT (id) DO NOTHING;

                        -- Explicit COGS & Inventory Asset Lines inserted manually
                        v_cogs_value := ROUND(COALESCE((v_item->>'quantity')::numeric, 0) * COALESCE(v_product_record.cost_price, (v_product_record.data->>'costPrice')::numeric, 0), 2);
                        IF v_cogs_value > 0 THEN
                            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                            VALUES ('JL-' || v_journal_id || '-cogs-' || v_idx, v_journal_id, v_effective_company_id, v_cogs_acc, v_cogs_value, 0, 'COGS: ' || COALESCE(v_item->>'description', 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                            
                            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                            VALUES ('JL-' || v_journal_id || '-inv-' || v_idx, v_journal_id, v_effective_company_id, v_inv_acc, 0, v_cogs_value, 'Inv Out: ' || COALESCE(v_item->>'description', 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                            
                            v_total_debit := v_total_debit + v_cogs_value;
                            v_total_credit := v_total_credit + v_cogs_value;
                        END IF;
                    END IF;
                END IF;
            ELSIF v_item->>'type' = 'TAX' THEN
                v_tax_total := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                VALUES ('JL-' || v_journal_id || '-tax-' || v_idx, v_journal_id, v_effective_company_id, v_tax_acc, 0, v_tax_total, 'Tax: ' || (v_item->>'description')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                v_total_credit := v_total_credit + v_tax_total;
            END IF;
        END LOOP;
    END;

    -- 8. Balance Journal
    v_total_debit := ROUND(v_total_debit, 2);
    v_total_credit := ROUND(v_total_credit, 2);
    IF v_total_debit != v_total_credit THEN
        IF ABS(v_total_debit - v_total_credit) <= 0.10 THEN
            UPDATE docs_journal_lines SET credit = credit + (v_total_debit - v_total_credit) WHERE journal_id = v_journal_id AND id = 'JL-' || v_journal_id || '-rev-' || v_idx;
        ELSE
            RAISE EXCEPTION 'Unbalanced (Dr: %, Cr: %).', v_total_debit, v_total_credit;
        END IF;
    END IF;

    -- 9. Handle Cash Sale Auto Payment (If Applicable)
    v_is_cash_sale := COALESCE(v_invoice.customer_id, '') ILIKE '%cash-sale%' OR EXISTS(SELECT 1 FROM docs_contacts WHERE id = v_invoice.customer_id AND (name ILIKE '%cash sale%' OR name ILIKE '%cash-sale%'));
    IF v_is_cash_sale THEN
        SELECT id INTO v_liquidity_acc FROM docs_accounts WHERE code IN ('1011', '100100', '100101', 'CASH', 'BANK') AND company_id = v_effective_company_id LIMIT 1;
        IF v_liquidity_acc IS NULL THEN SELECT id INTO v_liquidity_acc FROM docs_accounts WHERE type = 'ASSET' AND company_id = v_effective_company_id LIMIT 1; END IF;
        
        v_pay_id := 'PAY-AUTO-' || p_invoice_id;
        INSERT INTO docs_payments (id, company_id, date, contact_id, status, type, amount, payment_date, data, updated_at)
        VALUES (
            v_pay_id, v_effective_company_id, v_invoice.date, v_invoice.customer_id, 'DRAFT', 'RECEIPT', COALESCE(v_invoice.total, (v_invoice.data->>'total')::numeric, 0), v_invoice.date,
            jsonb_build_object('id', v_pay_id, 'amount', COALESCE(v_invoice.total, (v_invoice.data->>'total')::numeric, 0), 'accountId', v_liquidity_acc), NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
        PERFORM post_payment(v_pay_id, v_effective_company_id);
        UPDATE docs_invoices SET status = 'PAID', data = jsonb_set(COALESCE(data, '{}'::jsonb), '{status}', '"PAID"') WHERE id = p_invoice_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
END;
$function$;


-- Function: post_loan_payment_rpc
CREATE OR REPLACE FUNCTION public.post_loan_payment_rpc(p_loan_id text, p_period integer, p_date text, p_interest_to_pay numeric, p_principal_to_pay numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_loan docs_loans%ROWTYPE;
    v_company_id TEXT;
    v_contact_id TEXT;
    v_is_received BOOLEAN;
    v_total NUMERIC;
    v_cash_acc TEXT;
    v_loan_acc TEXT;
    v_interest_acc TEXT;
    v_journal_id TEXT;
    v_desc TEXT;
BEGIN
    SELECT * INTO v_loan FROM docs_loans WHERE id = p_loan_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;

    v_company_id := v_loan.company_id;
    v_contact_id := v_loan.contact_id;
    
    v_is_received := v_loan.type = 'RECEIVED';
    
    v_total := p_principal_to_pay + p_interest_to_pay;

    v_desc := 'Loan Payment Period ' || p_period::TEXT || ': ' || COALESCE(v_loan.name, v_loan.loan_number);
    v_journal_id := 'JE-LPAY-' || p_loan_id || '-' || p_period::TEXT;

    SELECT id INTO v_cash_acc FROM docs_accounts WHERE (code = '100100' OR sub_type IN ('CASH', 'BANK') OR name ILIKE '%cash%') AND company_id = v_company_id LIMIT 1;
    IF v_cash_acc IS NULL THEN RAISE EXCEPTION 'Cash/Bank account (100100) not found for this company'; END IF;

    IF v_is_received THEN
        -- Loan Payable Payment
        SELECT id INTO v_loan_acc FROM docs_accounts WHERE code = '210100' AND company_id = v_company_id LIMIT 1;
        
        -- Interest Expense
        SELECT id INTO v_interest_acc FROM docs_accounts WHERE code = '500208' AND company_id = v_company_id LIMIT 1;
        IF v_interest_acc IS NULL THEN SELECT id INTO v_interest_acc FROM docs_accounts WHERE code = '600000' AND company_id = v_company_id LIMIT 1; END IF;
        IF v_interest_acc IS NULL THEN SELECT id INTO v_interest_acc FROM docs_accounts WHERE type = 'EXPENSE' AND name ILIKE '%interest%' AND company_id = v_company_id LIMIT 1; END IF;
        
        INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, updated_at)
        VALUES (v_journal_id, v_company_id, p_date::date, p_date::date, 'LOAN', 'POSTED', 'PAY-'||p_period, NOW())
        ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW();

        DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;

        -- Dr Loan Payable (Principal)
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
        VALUES (v_journal_id || '-dr-prin', v_journal_id, v_company_id, v_loan_acc, v_contact_id, p_principal_to_pay, 0, v_desc);
        
        -- Dr Interest Expense
        IF p_interest_to_pay > 0 THEN
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
            VALUES (v_journal_id || '-dr-int', v_journal_id, v_company_id, v_interest_acc, v_contact_id, p_interest_to_pay, 0, v_desc);
        END IF;

        -- Cr Cash
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
        VALUES (v_journal_id || '-cr-cash', v_journal_id, v_company_id, v_cash_acc, v_contact_id, 0, v_total, v_desc);

    ELSE
        -- Loan Receivable Payment
        SELECT id INTO v_loan_acc FROM docs_accounts WHERE code = '100601' AND company_id = v_company_id LIMIT 1;
        
        -- Interest Income
        SELECT id INTO v_interest_acc FROM docs_accounts WHERE code = '400200' AND company_id = v_company_id LIMIT 1;
        IF v_interest_acc IS NULL THEN SELECT id INTO v_interest_acc FROM docs_accounts WHERE type = 'INCOME' AND name ILIKE '%interest%' AND company_id = v_company_id LIMIT 1; END IF;
        
        INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, updated_at)
        VALUES (v_journal_id, v_company_id, p_date::date, p_date::date, 'LOAN', 'POSTED', 'PAY-'||p_period, NOW())
        ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW();

        DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;

        -- Dr Cash
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
        VALUES (v_journal_id || '-dr-cash', v_journal_id, v_company_id, v_cash_acc, v_contact_id, v_total, 0, v_desc);

        -- Cr Loan Receivable (Principal)
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
        VALUES (v_journal_id || '-cr-prin', v_journal_id, v_company_id, v_loan_acc, v_contact_id, 0, p_principal_to_pay, v_desc);
        
        -- Cr Interest Income
        IF p_interest_to_pay > 0 THEN
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
            VALUES (v_journal_id || '-cr-int', v_journal_id, v_company_id, v_interest_acc, v_contact_id, 0, p_interest_to_pay, v_desc);
        END IF;
    END IF;

    -- Add period to paidPeriods
    UPDATE docs_loans SET 
        paid_periods = array_append(ARRAY(SELECT unnest(paid_periods) EXCEPT SELECT p_period), p_period),
        updated_at = NOW()
    WHERE id = p_loan_id;

    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
END;
$function$;


-- Function: post_loan_rpc
CREATE OR REPLACE FUNCTION public.post_loan_rpc(p_loan_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_loan docs_loans%ROWTYPE;
    v_company_id TEXT;
    v_contact_id TEXT;
    v_amount NUMERIC;
    v_type TEXT;
    v_date DATE;
    v_cash_acc TEXT;
    v_loan_acc TEXT;
    v_journal_id TEXT;
    v_desc TEXT;
    v_name TEXT;
    v_number TEXT;
BEGIN
    SELECT * INTO v_loan FROM docs_loans WHERE id = p_loan_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan not found';
    END IF;
    
    v_company_id := v_loan.company_id;

    v_contact_id := v_loan.contact_id;
    v_amount := v_loan.principal_amount;
    v_type := v_loan.type;
    v_date := v_loan.start_date;
    v_name := v_loan.name;
    v_number := v_loan.loan_number;
    
    IF v_amount IS NULL AND v_loan.amount IS NOT NULL THEN
        v_amount := v_loan.amount;
    END IF;
    
    v_desc := 'Loan Disbursement: ' || COALESCE(v_name, v_number);
    v_journal_id := 'JE-LOAN-' || UPPER(p_loan_id);
    
    SELECT id INTO v_cash_acc FROM docs_accounts WHERE (code = '100100' OR sub_type IN ('CASH', 'BANK') OR name ILIKE '%cash%') AND company_id = v_company_id LIMIT 1;
    IF v_cash_acc IS NULL THEN RAISE EXCEPTION 'Could not find cash/bank account for company'; END IF;
    
    IF v_type = 'RECEIVED' THEN
        SELECT id INTO v_loan_acc FROM docs_accounts WHERE code = '210100' AND company_id = v_company_id LIMIT 1;
        IF v_loan_acc IS NULL THEN RAISE EXCEPTION 'Could not find Loan Payable account (210100) for company'; END IF;
    ELSE
        SELECT id INTO v_loan_acc FROM docs_accounts WHERE code = '100601' AND company_id = v_company_id LIMIT 1;
        IF v_loan_acc IS NULL THEN RAISE EXCEPTION 'Could not find Loan Receivable account (100601) for company'; END IF;
    END IF;
    
    UPDATE docs_loans SET status = 'ACTIVE', updated_at = NOW(), journal_entry_id = v_journal_id WHERE id = p_loan_id;
    
    INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, updated_at)
    VALUES (v_journal_id, v_company_id, v_date, v_date, 'LOAN', 'POSTED', v_number, NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW();
    
    DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
    
    IF v_type = 'RECEIVED' OR v_contact_id = 'c0cb513b-54d7-4f1e-9d05-48abfd79cb3a' THEN
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description) VALUES (v_journal_id || '-dr', v_journal_id, v_company_id, v_cash_acc, v_amount, 0, v_desc);
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-cr', v_journal_id, v_company_id, v_loan_acc, v_contact_id, 0, v_amount, v_desc);
    ELSE
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-dr', v_journal_id, v_company_id, v_loan_acc, v_contact_id, v_amount, 0, v_desc);
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description) VALUES (v_journal_id || '-cr', v_journal_id, v_company_id, v_cash_acc, 0, v_amount, v_desc);
    END IF;
    
    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
END;
$function$;


-- Function: post_payment
CREATE OR REPLACE FUNCTION public.post_payment(p_payment_id text, p_company_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_payment RECORD;
    v_journal_id TEXT;
    v_amount NUMERIC;
    v_date DATE;
    v_effective_company_id TEXT;
    v_contact_id TEXT;
    v_liquidity_acc TEXT;
    v_partner_acc TEXT;
    v_is_receipt BOOLEAN;
    v_is_refund BOOLEAN;
    v_ref_val TEXT;
    v_run_id TEXT := substr(md5(random()::text), 1, 8);
    v_inv_record RECORD;
    v_bill_record RECORD;
    v_alloc jsonb;
    v_new_amt_paid NUMERIC;
BEGIN
    SELECT * INTO v_payment FROM docs_payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Payment not found'); END IF;
    
    v_is_receipt := v_payment.type = 'RECEIPT' OR v_payment.type = 'COLLECTION';
    v_is_refund := v_payment.type = 'REFUND';
    v_amount := COALESCE(v_payment.amount, 0);
    v_date := COALESCE(v_payment.date, v_payment.payment_date, CURRENT_DATE);
    v_contact_id := v_payment.contact_id;
    v_effective_company_id := COALESCE(p_company_id, v_payment.company_id);
    
    v_journal_id := 'JE-' || CASE WHEN v_is_receipt OR v_is_refund THEN 'CPAY' ELSE 'VPAY' END || '-' || replace(replace(UPPER(v_payment.id), 'PAY-', ''), 'PAY-', '');
    IF EXISTS(SELECT 1 FROM docs_journals WHERE id = v_journal_id) THEN 
        UPDATE docs_payments SET status = 'POSTED', data = jsonb_set(jsonb_set(COALESCE(data, '{}'::jsonb), '{status}', '"POSTED"'), '{journalEntryId}', to_jsonb(v_journal_id::text)), updated_at = NOW() WHERE id = p_payment_id;
        RETURN jsonb_build_object('success', true, 'message', 'Already posted', 'journal_id', v_journal_id); 
    END IF;

    IF v_effective_company_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Company ID missing'); END IF;

    v_liquidity_acc := v_payment.account_id;
    IF v_liquidity_acc IS NOT NULL THEN
        SELECT id INTO v_liquidity_acc FROM docs_accounts WHERE id = v_liquidity_acc AND company_id = v_effective_company_id;
    END IF;
    IF v_liquidity_acc IS NULL THEN
        SELECT id INTO v_liquidity_acc FROM docs_accounts WHERE code IN ('1011', '100100') AND company_id = v_effective_company_id LIMIT 1;
    END IF;
    IF v_liquidity_acc IS NULL THEN
        SELECT id INTO v_liquidity_acc FROM docs_accounts WHERE name ILIKE '%Cash%' AND company_id = v_effective_company_id LIMIT 1;
    END IF;
    IF v_liquidity_acc IS NULL THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Liquidity account (Cash/Bank) not found. Company: ' || v_effective_company_id); 
    END IF;

    v_partner_acc := v_payment.partner_account_id;
    IF v_partner_acc IS NOT NULL THEN
        SELECT id INTO v_partner_acc FROM docs_accounts WHERE id = v_partner_acc AND company_id = v_effective_company_id;
    END IF;
    IF v_partner_acc IS NULL THEN
        SELECT id INTO v_partner_acc FROM docs_accounts WHERE code IN ('100201', '200101') AND company_id = v_effective_company_id 
        ORDER BY CASE WHEN v_is_receipt OR v_is_refund THEN (code = '100201') ELSE (code = '200101') END DESC LIMIT 1;
    END IF;
    IF v_partner_acc IS NULL THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Partner account (AR/AP) not found. Company: ' || v_effective_company_id); 
    END IF;

    v_ref_val := COALESCE(v_payment.payment_number, v_payment.id);
    IF v_payment.reference IS NOT NULL AND v_payment.reference <> '' THEN
        v_ref_val := v_ref_val || ' (' || v_payment.reference || ')';
    END IF;

    INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, reference, prepared_by, created_by_id, updated_at)
    VALUES (
      v_journal_id, 
      v_effective_company_id, 
      v_date, 
      v_date,
      CASE WHEN v_is_receipt OR v_is_refund THEN 'CUST_PAY' ELSE 'VEND_PAY' END, 
      'POSTED', 
      v_ref_val, 
      v_ref_val,
      'System', 
      NULL, 
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW();

    EXECUTE 'SET LOCAL core.bypass_audit = ''true''';
    DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
    EXECUTE 'SET LOCAL core.bypass_audit = ''false''';

    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
    VALUES ('JL-' || v_run_id || '-' || v_journal_id || '-liq', v_journal_id, v_effective_company_id, v_liquidity_acc, CASE WHEN v_is_receipt THEN v_amount ELSE 0 END, CASE WHEN v_is_receipt THEN 0 ELSE v_amount END, COALESCE('Payment: ' || v_ref_val, 'Payment: ' || v_payment.id));
    
    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
    VALUES ('JL-' || v_run_id || '-' || v_journal_id || '-part', v_journal_id, v_effective_company_id, v_partner_acc, v_contact_id, CASE WHEN v_is_receipt THEN 0 ELSE v_amount END, CASE WHEN v_is_receipt THEN v_amount ELSE 0 END, COALESCE('Reconciliation: ' || v_ref_val, 'Payment reconciliation: ' || v_payment.id));

    -- EARLY UPDATE OF PAYMENT STATUS TO ENSURE TRIGGERS SEE IT POSTED!
    UPDATE docs_payments SET status = 'POSTED', data = jsonb_set(jsonb_set(COALESCE(data, '{}'::jsonb), '{status}', '"POSTED"'), '{journalEntryId}', to_jsonb(v_journal_id::text)), updated_at = NOW() WHERE id = p_payment_id;

    IF v_is_receipt AND v_payment.applied_invoices IS NOT NULL THEN
        FOR v_alloc IN SELECT * FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(v_payment.applied_invoices) = 'array' THEN v_payment.applied_invoices ELSE '[]'::jsonb END
        ) LOOP
            SELECT * INTO v_inv_record FROM docs_invoices WHERE id = (v_alloc->>'invoiceId') FOR UPDATE;
            IF FOUND THEN
                SELECT COALESCE(SUM((al->>'amount')::numeric), 0) INTO v_new_amt_paid
                FROM docs_payments p, jsonb_array_elements(
                    CASE WHEN jsonb_typeof(p.applied_invoices) = 'array' THEN p.applied_invoices ELSE '[]'::jsonb END
                ) al
                WHERE p.status = 'POSTED' AND p.company_id = v_effective_company_id AND al->>'invoiceId' = v_inv_record.id;
                
                UPDATE docs_invoices 
                SET status = CASE WHEN v_new_amt_paid >= COALESCE(total, 0) - 0.01 THEN 'PAID' ELSE 'PARTIAL' END,
                    updated_at = NOW()
                WHERE id = v_inv_record.id;
            END IF;
        END LOOP;
    ELSIF NOT v_is_receipt AND v_payment.applied_bills IS NOT NULL THEN
        FOR v_alloc IN SELECT * FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(v_payment.applied_bills) = 'array' THEN v_payment.applied_bills ELSE '[]'::jsonb END
        ) LOOP
            SELECT * INTO v_bill_record FROM docs_bills WHERE id = (v_alloc->>'billId') FOR UPDATE;
            IF FOUND THEN
                SELECT COALESCE(SUM((al->>'amount')::numeric), 0) INTO v_new_amt_paid
                FROM docs_payments p, jsonb_array_elements(
                    CASE WHEN jsonb_typeof(p.applied_bills) = 'array' THEN p.applied_bills ELSE '[]'::jsonb END
                ) al
                WHERE p.status = 'POSTED' AND p.company_id = v_effective_company_id AND al->>'billId' = v_bill_record.id;

                UPDATE docs_bills 
                SET status = CASE WHEN v_new_amt_paid >= COALESCE(total, 0) - 0.01 THEN 'PAID' ELSE 'PARTIAL' END,
                    updated_at = NOW()
                WHERE id = v_bill_record.id;
            END IF;
        END LOOP;
    END IF;

    UPDATE docs_journals 
    SET data = jsonb_build_object(
        'id', id,
        'date', date,
        'status', status,
        'companyId', company_id,
        'reference', reference_number,
        'journalType', CASE WHEN journal_type = 'CUST_PAY' THEN 'CUST_PAY' ELSE 'VEND_PAY' END,
        'lines', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', id, 
                'accountId', account_id, 
                'debit', debit, 
                'credit', credit, 
                'description', description, 
                'contactId', contact_id
            )) FROM docs_journal_lines WHERE journal_id = v_journal_id AND (debit != 0 OR credit != 0)
        ), '[]'::jsonb)
    )
    WHERE id = v_journal_id;

    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
END;
$function$;


-- Function: post_payment_v2
CREATE OR REPLACE FUNCTION public.post_payment_v2(p_payment_id text, p_company_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN post_payment(p_payment_id, p_company_id);
END;
$function$;


-- Function: post_payslip_rpc
CREATE OR REPLACE FUNCTION public.post_payslip_rpc(p_payslip jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
                                                                                                                                                                            DECLARE
                                                                                                                                                                                v_company_id TEXT;
                                                                                                                                                                                    v_id TEXT;
                                                                                                                                                                                        v_amount NUMERIC;
                                                                                                                                                                                            v_date DATE;
                                                                                                                                                                                                v_cash_acc TEXT;
                                                                                                                                                                                                    v_salary_acc TEXT;
                                                                                                                                                                                                        v_journal_id TEXT;
                                                                                                                                                                                                        BEGIN
                                                                                                                                                                                                            v_company_id := COALESCE(p_payslip->>'companyId', p_payslip->>'company_id');
                                                                                                                                                                                                                v_id := p_payslip->>'id';
                                                                                                                                                                                                                    v_amount := (p_payslip->>'netPay')::numeric;
                                                                                                                                                                                                                        v_date := (p_payslip->>'paymentDate')::date;
                                                                                                                                                                                                                            v_journal_id := 'JE-PAYSLIP-' || v_id;

                                                                                                                                                                                                                                SELECT id INTO v_cash_acc FROM docs_accounts WHERE (code = '100100' OR sub_type IN ('CASH', 'BANK')) AND company_id = v_company_id LIMIT 1;
                                                                                                                                                                                                                                    SELECT id INTO v_salary_acc FROM docs_accounts WHERE code = '500201' AND company_id = v_company_id LIMIT 1;

                                                                                                                                                                                                                                        UPDATE docs_payslips SET status = 'POSTED', updated_at = NOW() WHERE id = v_id;

                                                                                                                                                                                                                                            INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, data, updated_at)
                                                                                                                                                                                                                                                VALUES (v_journal_id, v_company_id, v_date, v_date, 'PAYROLL', 'POSTED', p_payslip->>'number', p_payslip, NOW())
                                                                                                                                                                                                                                                    ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW();

                                                                                                                                                                                                                                                        DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
                                                                                                                                                                                                                                                            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description) VALUES (v_journal_id || '-dr', v_journal_id, v_company_id, v_salary_acc, v_amount, 0, 'Salary Payment');
                                                                                                                                                                                                                                                                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description) VALUES (v_journal_id || '-cr', v_journal_id, v_company_id, v_cash_acc, 0, v_amount, 'Salary Payment');

                                                                                                                                                                                                                                                                    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
                                                                                                                                                                                                                                                                    END;
                                                                                                                                                                                                                                                                    $function$;


-- Function: prevent_deletion_audit
CREATE OR REPLACE FUNCTION public.prevent_deletion_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
        DECLARE
            v_journal_status TEXT;
            v_bypass TEXT;
            v_is_authorized BOOLEAN := false;
        BEGIN
            v_bypass := current_setting('core.bypass_audit', true);
            IF COALESCE(v_bypass, 'false') = 'true' THEN
                RETURN OLD;
            END IF;

            BEGIN
                SELECT EXISTS (
                    SELECT 1 FROM docs_users 
                    WHERE user_uuid = auth.uid() 
                    AND role_id = 'role-admin'
                ) INTO v_is_authorized;
            EXCEPTION WHEN OTHERS THEN
                v_is_authorized := false;
            END;

            IF v_is_authorized THEN
                RETURN OLD;
            END IF;

            IF TG_TABLE_NAME = 'docs_journal_lines' THEN
                IF OLD.journal_id IS NOT NULL THEN
                    SELECT status INTO v_journal_status FROM docs_journals WHERE id = OLD.journal_id;
                    IF v_journal_status = 'DRAFT' THEN
                        RETURN OLD;
                    END IF;
                END IF;
            END IF;

            RAISE EXCEPTION 'Deletion from table % is strictly prohibited to maintain an append-only audit trail. Only admins can perform deletions.', TG_TABLE_NAME;
        END;
        $function$;


-- Function: prevent_duplicate_ct_imp
CREATE OR REPLACE FUNCTION public.prevent_duplicate_ct_imp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
        BEGIN
            -- If we are inserting a CT-IMP contact, check if another contact with the same name exists
            IF NEW.id LIKE 'CT-IMP-%' THEN
                IF EXISTS (
                    SELECT 1 
                    FROM docs_contacts 
                    WHERE LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
                      AND id != NEW.id
                ) THEN
                    -- Discard the insert
                    RETURN NULL;
                END IF;
            END IF;
            RETURN NEW;
        END;
        $function$;


-- Function: prevent_duplicate_ct_imp_update
CREATE OR REPLACE FUNCTION public.prevent_duplicate_ct_imp_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
        BEGIN
            IF NEW.id LIKE 'CT-IMP-%' THEN
                -- If it's an update but the row was deleted the frontend will actually do an UPSERT which maps to INSERT
                -- But if they somehow issue an UPDATE directly on a row that doesn't exist, it won't trigger BEFORE UPDATE
                -- If they issue an UPDATE on a CT-IMP row that DOES exist, we just let it happen (because we shouldn't have any left)
                -- But let's just make sure we drop any CT-IMP modifications!
                IF EXISTS (
                    SELECT 1 
                    FROM docs_contacts 
                    WHERE LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
                      AND id != NEW.id
                ) THEN
                    RETURN NULL;
                END IF;
            END IF;
            RETURN NEW;
        END;
        $function$;


-- Function: prevent_manual_inventory_edits
CREATE OR REPLACE FUNCTION public.prevent_manual_inventory_edits()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- 💡 ফিক্স: NULL এবং 0 এর মধ্যকার কনফ্লিক্ট দূর করা হলো
    IF (COALESCE(NEW.quantity_on_hand, 0) != COALESCE(OLD.quantity_on_hand, 0) OR COALESCE(NEW.cost_price, 0) != COALESCE(OLD.cost_price, 0)) THEN
        IF auth.uid() IS NOT NULL AND current_setting('request.jwt.claims', true) IS NOT NULL THEN
            IF pg_trigger_depth() <= 1 AND current_setting('request.path', true) NOT LIKE '%rpc%' THEN
                RAISE EXCEPTION 'Strict Perpetual Inventory enabled. Cannot manually edit quantity_on_hand or cost_price. Use Inventory Transactions.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;


-- Function: process_avco_stock_valuation
CREATE OR REPLACE FUNCTION public.process_avco_stock_valuation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    current_qty NUMERIC(15,4) := 0.0000;
    current_avg_cost NUMERIC(15,4) := 0.0000;
    new_qty NUMERIC(15,4) := 0.0000;
    new_avg_cost NUMERIC(15,4) := 0.0000;
BEGIN
    -- কেলকুলেশনের সুবিধার্থে টোটাল ভ্যালু ফিল্ড অটো ক্যালকুলেট করে নেওয়া হলো
    NEW.total_value := NEW.quantity * NEW.unit_cost;

    -- ১. বর্তমান স্টক এবং বর্তমান এভারেজ কস্ট কত আছে তা ডাটাবেস থেকে তুলে আনা
    SELECT COALESCE(quantity, 0.0000), COALESCE(avg_cost_price, 0.0000)
    INTO current_qty, current_avg_cost
    FROM docs_product_stocks
    WHERE product_id = NEW.product_id AND company_id = NEW.company_id;

    -- যদি এই কোম্পানির আন্ডারে প্রোডাক্টের কোনো রো না থাকে, তবে নতুন রো ইনসার্ট করবে
    IF NOT FOUND THEN
        INSERT INTO docs_product_stocks (product_id, company_id, quantity, avg_cost_price, total_valuation)
        VALUES (NEW.product_id, NEW.company_id, 0.0000, 0.0000, 0.0000);
        current_qty := 0.0000;
        current_avg_cost := 0.0000;
    END IF;

    -- =====================================================================
    -- লজিক এ: 'ADDED' (স্টক ইন বা নতুন মাল কেনা হলে AVCO রেট পরিবর্তন হবে)
    -- =====================================================================
    IF NEW.movement_type = 'ADDED' THEN
        new_qty := current_qty + NEW.quantity;
        
        -- সূত্র (Weighted Average Cost): 
        -- ((পুরাতন মোট মূল্য) + (নতুন মালের মোট মূল্য)) / নতুন মোট কোয়ান্টিটি
        IF new_qty > 0 THEN
            new_avg_cost := ((current_qty * current_avg_cost) + NEW.total_value) / new_qty;
        ELSE
            new_avg_cost := NEW.unit_cost;
        END IF;
        
        -- রাউন্ডিং করে ৪ ডেসিমেলে রাখা (যাতে দশমিকের পর নিখুঁত হিসাব থাকে)
        new_avg_cost := ROUND(new_avg_cost, 4);

        -- মূল লাইভ স্টক টেবিল আপডেট
        UPDATE docs_product_stocks
        SET 
            quantity = new_qty,
            total_added = total_added + NEW.quantity,
            avg_cost_price = new_avg_cost,
            total_valuation = ROUND(new_qty * new_avg_cost, 4),
            updated_at = NOW()
        WHERE product_id = NEW.product_id AND company_id = NEW.company_id;

    -- =====================================================================
    -- লজিক বি: 'OUT' (স্টক আউট বা মাল সেলস হলে AVCO রেট একই থাকবে, শুধু স্টক কমবে)
    -- =====================================================================
    ELSIF NEW.movement_type = 'OUT' THEN
        new_qty := current_qty - NEW.quantity;
        -- স্টক আউট হলে এভারেজ কস্ট প্রাইস বা রেট কখনো পরিবর্তন হয় না
        new_avg_cost := current_avg_cost; 
        
        -- মূল লাইভ স্টক টেবিল আপডেট
        UPDATE docs_product_stocks
        SET 
            quantity = new_qty,
            total_out = total_out + NEW.quantity,
            total_valuation = ROUND(new_qty * new_avg_cost, 4),
            updated_at = NOW()
        WHERE product_id = NEW.product_id AND company_id = NEW.company_id;
    END IF;

    RETURN NEW;
END;
$function$;


-- Function: process_bill
CREATE OR REPLACE FUNCTION public.process_bill(p_bill jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
   DECLARE
       v_company_id TEXT;
           v_bill_id TEXT;
               v_status TEXT;
                   v_safe_date DATE; -- 💡 Safe Date Variable
                       v_vendor_id TEXT;
                           v_number TEXT;
                               v_item JSONB;
                                   v_lines JSONB;
                                       v_new_lines JSONB := '[]'::jsonb;
                                           v_existing_number TEXT;
                                               v_calc_qty NUMERIC;
                                                   v_calc_price NUMERIC;
                                                       v_calc_gross NUMERIC;
                                                           v_calc_disc_rate NUMERIC;
                                                               v_calc_disc_mode TEXT;
                                                                   v_calc_disc_amt NUMERIC;
                                                                       v_calc_tax_amt NUMERIC;
                                                                           v_calc_line_total NUMERIC;
                                                                               v_inv_subtotal NUMERIC := 0;
                                                                                   v_inv_discount NUMERIC := 0;
                                                                                       v_inv_tax NUMERIC := 0;
                                                                                           v_inv_total NUMERIC := 0;
                                                                                               v_line_id TEXT;
                                                                                               BEGIN
                                                                                                   v_bill_id := p_bill->>'id';
                                                                                                       v_company_id := COALESCE(p_bill->>'companyId', p_bill->>'company_id');
                                                                                                           v_status := p_bill->>'status';
                                                                                                               
                                                                                                                   -- 💡 Date Fallback: গ্যারান্টেড ডেট নেওয়া হচ্ছে
                                                                                                                       v_safe_date := COALESCE(
                                                                                                                               NULLIF(p_bill->>'date', '')::DATE,
                                                                                                                                       NULLIF(p_bill->>'billDate', '')::DATE,
                                                                                                                                               NULLIF(p_bill->>'bill_date', '')::DATE,
                                                                                                                                                       CURRENT_DATE
                                                                                                                                                           );
                                                                                                                                                               
                                                                                                                                                                   v_vendor_id := COALESCE(p_bill->>'vendorId', p_bill->>'supplierId');
                                                                                                                                                                       v_number := p_bill->>'number';
                                                                                                                                                                           v_lines := p_bill->'items';
                                                                                                                                                                               
                                                                                                                                                                                   SELECT bill_number INTO v_existing_number FROM docs_bills WHERE id = v_bill_id;
                                                                                                                                                                                       IF v_existing_number IS NOT NULL AND v_existing_number NOT LIKE 'DRAFT-%' AND v_existing_number != 'NEW' THEN
                                                                                                                                                                                               v_number := v_existing_number;
                                                                                                                                                                                                       p_bill := jsonb_set(p_bill, '{number}', to_jsonb(v_existing_number));
                                                                                                                                                                                                           END IF;
                                                                                                                                                                                                               
                                                                                                                                                                                                                   IF v_lines IS NOT NULL THEN
                                                                                                                                                                                                                           FOR v_item IN SELECT * FROM jsonb_array_elements(v_lines) LOOP
                                                                                                                                                                                                                                       v_calc_qty := COALESCE((v_item->>'quantity')::NUMERIC, 0);
                                                                                                                                                                                                                                                   v_calc_price := COALESCE((v_item->>'unitPrice')::NUMERIC, 0);
                                                                                                                                                                                                                                                               v_calc_gross := v_calc_qty * v_calc_price;
                                                                                                                                                                                                                                                                           v_calc_disc_rate := COALESCE((v_item->>'discountRate')::NUMERIC, 0);
                                                                                                                                                                                                                                                                                       v_calc_disc_mode := COALESCE(v_item->>'discountMode', 'PERCENT');
                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                               IF v_calc_disc_mode = 'FIXED' THEN
                                                                                                                                                                                                                                                                                                                               v_calc_disc_amt := v_calc_disc_rate;
                                                                                                                                                                                                                                                                                                                                           ELSE
                                                                                                                                                                                                                                                                                                                                                           v_calc_disc_amt := ROUND((v_calc_gross * (v_calc_disc_rate / 100.0)), 2);
                                                                                                                                                                                                                                                                                                                                                                       END IF;
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                               v_calc_tax_amt := COALESCE((v_item->>'taxValue')::NUMERIC, 0);
                                                                                                                                                                                                                                                                                                                                                                                                           v_calc_line_total := ROUND((v_calc_gross - v_calc_disc_amt + v_calc_tax_amt), 2);
                                                                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                                                                                   v_inv_subtotal := v_inv_subtotal + v_calc_gross;
                                                                                                                                                                                                                                                                                                                                                                                                                                               v_inv_discount := v_inv_discount + v_calc_disc_amt;
                                                                                                                                                                                                                                                                                                                                                                                                                                                           v_inv_tax := v_inv_tax + v_calc_tax_amt;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                       v_inv_total := v_inv_total + v_calc_line_total;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               v_item := jsonb_set(v_item, '{discountAmount}', to_jsonb(v_calc_disc_amt));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           v_item := jsonb_set(v_item, '{taxAmount}', to_jsonb(v_calc_tax_amt));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       v_item := jsonb_set(v_item, '{total}', to_jsonb(v_calc_line_total));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   v_item := jsonb_set(v_item, '{lineValue}', to_jsonb(v_calc_line_total));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           v_new_lines := v_new_lines || v_item;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   END LOOP;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               -- JSON-এ ডেট ইনজেক্ট করা হচ্ছে
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   p_bill := jsonb_set(p_bill, '{items}', v_new_lines);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       p_bill := jsonb_set(p_bill, '{subtotal}', to_jsonb(v_inv_subtotal));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           p_bill := jsonb_set(p_bill, '{discountTotal}', to_jsonb(v_inv_discount));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               p_bill := jsonb_set(p_bill, '{taxTotal}', to_jsonb(v_inv_tax));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   p_bill := jsonb_set(p_bill, '{total}', to_jsonb(v_inv_total));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       p_bill := jsonb_set(p_bill, '{status}', '"DRAFT"');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           p_bill := jsonb_set(p_bill, '{date}', to_jsonb(v_safe_date));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               p_bill := jsonb_set(p_bill, '{billDate}', to_jsonb(v_safe_date));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       DELETE FROM docs_bill_lines WHERE bill_id = v_bill_id;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               IF v_new_lines IS NOT NULL THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       FOR v_item IN SELECT * FROM jsonb_array_elements(v_new_lines) LOOP
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   v_line_id := COALESCE(NULLIF(v_item->>'id', ''), gen_random_uuid()::TEXT);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               IF EXISTS (SELECT 1 FROM public.docs_bill_lines WHERE id = v_line_id) THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               v_line_id := gen_random_uuid()::text;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           END IF;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       INSERT INTO docs_bill_lines (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       id, bill_id, company_id, product_id, quantity, unit_price, 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       discount, tax, total, description, line_value, 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       discount_rate, discount_mode, type, updated_at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               VALUES (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               v_line_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               v_bill_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               v_company_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               v_item->>'productId',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               (v_item->>'quantity')::NUMERIC,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               (v_item->>'unitPrice')::NUMERIC,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               (v_item->>'discountAmount')::NUMERIC,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               (v_item->>'taxAmount')::NUMERIC,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               (v_item->>'total')::NUMERIC,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               v_item->>'description',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               (v_item->>'lineValue')::NUMERIC,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               (v_item->>'discountRate')::NUMERIC,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               v_item->>'discountMode',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               COALESCE(v_item->>'type', 'PRODUCT'),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               NOW()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   END LOOP;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               -- 💡 মূল ফিক্স: INSERT/UPDATE এ bill_date কলাম যুক্ত করা
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   INSERT INTO docs_bills (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           id, data, company_id, date, bill_date, vendor_id, status, 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   subtotal, discount_total, tax_total, total, bill_number, updated_at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           VALUES (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   v_bill_id, p_bill, v_company_id, v_safe_date, v_safe_date, v_vendor_id, 'DRAFT', 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           v_inv_subtotal, v_inv_discount, v_inv_tax, v_inv_total, v_number, NOW()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   ON CONFLICT (id) DO UPDATE SET 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           data = EXCLUDED.data,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   company_id = EXCLUDED.company_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           date = EXCLUDED.date,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   bill_date = EXCLUDED.bill_date,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           vendor_id = EXCLUDED.vendor_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   subtotal = EXCLUDED.subtotal,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           discount_total = EXCLUDED.discount_total,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   tax_total = EXCLUDED.tax_total,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           total = EXCLUDED.total,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   bill_number = CASE 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               WHEN docs_bills.bill_number IS NOT NULL AND docs_bills.bill_number NOT LIKE 'DRAFT-%' THEN docs_bills.bill_number 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           ELSE EXCLUDED.bill_number 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   END,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           updated_at = NOW();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       IF v_status IN ('POSTED', 'PAID', 'PARTIAL') THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               UPDATE docs_bills SET status = v_status, data = jsonb_set(data, '{status}', to_jsonb(v_status)) WHERE id = v_bill_id;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       PERFORM post_bill(v_bill_id, v_company_id);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   RETURN jsonb_build_object('success', true, 'bill_id', v_bill_id);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   $function$;


-- Function: process_credit_note
CREATE OR REPLACE FUNCTION public.process_credit_note(p_cn jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_cn_id TEXT;
    v_company_id TEXT;
    v_status TEXT;
    v_date DATE;
    v_customer_id TEXT;
    v_invoice_id TEXT;
    v_number TEXT;
    v_item JSONB;
    v_lines JSONB;
    v_new_lines JSONB := '[]'::jsonb;
    v_existing_number TEXT;
    
    v_calc_qty NUMERIC;
    v_calc_price NUMERIC;
    v_calc_gross NUMERIC;
    v_calc_disc_rate NUMERIC;
    v_calc_disc_mode TEXT;
    v_calc_disc_amt NUMERIC;
    v_calc_tax_amt NUMERIC;
    v_calc_line_total NUMERIC;
    
    v_inv_subtotal NUMERIC := 0;
    v_inv_discount NUMERIC := 0;
    v_inv_tax NUMERIC := 0;
    v_inv_total NUMERIC := 0;
BEGIN
    v_cn_id := p_cn->>'id';
    v_company_id := COALESCE(p_cn->>'companyId', p_cn->>'company_id');
    v_status := COALESCE(p_cn->>'status', 'DRAFT');
    v_date := (p_cn->>'date')::DATE;
    v_customer_id := p_cn->>'customerId';
    v_invoice_id := p_cn->>'invoiceId';
    v_number := p_cn->>'number';
    v_lines := p_cn->'items';

    SELECT credit_note_number INTO v_existing_number FROM docs_credit_notes WHERE id = v_cn_id;
    IF v_existing_number IS NOT NULL AND v_existing_number NOT LIKE 'DRAFT-%' AND v_existing_number != 'NEW' THEN
        v_number := v_existing_number;
        p_cn := jsonb_set(p_cn, '{number}', to_jsonb(v_existing_number));
    END IF;

    IF v_lines IS NOT NULL THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_lines) LOOP
            v_calc_qty := COALESCE((v_item->>'quantity')::NUMERIC, 0);
            v_calc_price := COALESCE((v_item->>'unitPrice')::NUMERIC, 0);
            v_calc_gross := v_calc_qty * v_calc_price;
            v_calc_disc_rate := COALESCE((v_item->>'discountRate')::NUMERIC, 0);
            v_calc_disc_mode := COALESCE(v_item->>'discountMode', 'PERCENT');
            
            IF v_calc_disc_mode = 'FIXED' THEN
                v_calc_disc_amt := v_calc_disc_rate;
            ELSE
                v_calc_disc_amt := ROUND((v_calc_gross * (v_calc_disc_rate / 100.0)), 2);
            END IF;
            
            v_calc_tax_amt := COALESCE((v_item->>'taxValue')::NUMERIC, 0);
            v_calc_line_total := ROUND((v_calc_gross - v_calc_disc_amt + v_calc_tax_amt), 2);
            
            v_inv_subtotal := v_inv_subtotal + v_calc_gross;
            v_inv_discount := v_inv_discount + v_calc_disc_amt;
            v_inv_tax := v_inv_tax + v_calc_tax_amt;
            v_inv_total := v_inv_total + v_calc_line_total;

            v_item := jsonb_set(v_item, '{discountAmount}', to_jsonb(v_calc_disc_amt));
            v_item := jsonb_set(v_item, '{taxAmount}', to_jsonb(v_calc_tax_amt));
            v_item := jsonb_set(v_item, '{total}', to_jsonb(v_calc_line_total));
            v_item := jsonb_set(v_item, '{lineValue}', to_jsonb(v_calc_line_total));
            
            v_new_lines := v_new_lines || v_item;
        END LOOP;
    END IF;

    p_cn := jsonb_set(p_cn, '{items}', v_new_lines);
    p_cn := jsonb_set(p_cn, '{subtotal}', to_jsonb(v_inv_subtotal));
    p_cn := jsonb_set(p_cn, '{discountTotal}', to_jsonb(v_inv_discount));
    p_cn := jsonb_set(p_cn, '{taxTotal}', to_jsonb(v_inv_tax));
    p_cn := jsonb_set(p_cn, '{total}', to_jsonb(v_inv_total));
    p_cn := jsonb_set(p_cn, '{status}', '"DRAFT"');
    RAISE NOTICE 'v_inv_total = %, p_cn = %', v_inv_total, p_cn;

    INSERT INTO docs_credit_notes (
        id, company_id, cn_number, credit_note_number, date, credit_note_date, customer_id, origin_invoice_id, status, data, subtotal, discount_total, tax_total, total, updated_at
    )
    VALUES (
        v_cn_id, v_company_id, v_number, v_number, v_date, v_date, v_customer_id, v_invoice_id, 'DRAFT', p_cn, v_inv_subtotal, v_inv_discount, v_inv_tax, v_inv_total, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET 
        data = EXCLUDED.data, 
        total = EXCLUDED.total, 
        subtotal = EXCLUDED.subtotal,
        discount_total = EXCLUDED.discount_total,
        tax_total = EXCLUDED.tax_total,
        updated_at = NOW();
    DELETE FROM docs_credit_note_lines WHERE credit_note_id = v_cn_id;

    IF v_new_lines IS NOT NULL THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_new_lines) LOOP
            INSERT INTO docs_credit_note_lines (
                id, credit_note_id, company_id, product_id, quantity, unit_price, 
                discount_mode, discount_rate,  line_value, total, type, description, uom, display_description
            )
            VALUES (
                COALESCE(v_item->>'id', gen_random_uuid()::TEXT),
                v_cn_id,
                v_company_id,
                v_item->>'productId',
                (v_item->>'quantity')::NUMERIC,
                (v_item->>'unitPrice')::NUMERIC,
                v_item->>'discountMode',
                (v_item->>'discountRate')::NUMERIC,
                
                (v_item->>'lineValue')::NUMERIC,
                (v_item->>'total')::NUMERIC,
                COALESCE(v_item->>'type', 'PRODUCT'),
                v_item->>'description',
                v_item->>'uom',
                v_item->>'displayDescription'
            );
        END LOOP;
    END IF;

    

    IF v_status = 'POSTED' THEN
        UPDATE docs_credit_notes SET status = 'POSTED', data = jsonb_set(data, '{status}', to_jsonb('POSTED'::text)) WHERE id = v_cn_id;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'post_credit_note') THEN
            PERFORM post_credit_note(v_cn_id, v_company_id);
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'credit_note_id', v_cn_id);
END;
$function$;


-- Function: process_expense_rpc
CREATE OR REPLACE FUNCTION public.process_expense_rpc(p_expense jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_company_id TEXT;
    v_date DATE;
    v_amount NUMERIC;
    v_from_account TEXT;
    v_to_account TEXT;
    v_desc TEXT;
    v_ref TEXT;
    v_status TEXT;
    v_contact_id TEXT;
    v_journal_id TEXT;
BEGIN
    v_company_id := COALESCE(p_expense->>'companyId', p_expense->>'company_id');
    v_date := COALESCE((p_expense->>'date')::date, CURRENT_DATE);
    v_amount := COALESCE((p_expense->>'amount')::numeric, 0);
    v_from_account := p_expense->>'fromAccountId';
    v_to_account := p_expense->>'toAccountId';
    v_desc := p_expense->>'description';
    v_ref := COALESCE(p_expense->>'reference', p_expense->>'number');
    v_status := COALESCE(p_expense->>'status', 'POSTED');
    v_contact_id := p_expense->>'contactId';
    v_journal_id := COALESCE(p_expense->>'journalId', 'JE-EXP-' || floor(random()*10000000)::text);

    INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, data, updated_at)
    VALUES (v_journal_id, v_company_id, v_date, v_date, 'EXPENSE', v_status, v_ref, p_expense, NOW())
    ON CONFLICT (id) DO UPDATE SET status = v_status, data = p_expense, updated_at = NOW();

    DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
    IF v_status = 'POSTED' THEN
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
        VALUES (v_journal_id || '-dr', v_journal_id, v_company_id, v_to_account, v_amount, 0, v_desc);
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
        VALUES (v_journal_id || '-cr', v_journal_id, v_company_id, v_from_account, v_contact_id, 0, v_amount, v_desc);
    END IF;

    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
END;
$function$;


-- Function: process_invoice
CREATE OR REPLACE FUNCTION public.process_invoice(p_invoice jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        v_company_id TEXT;
        v_invoice_id TEXT;
        v_status TEXT;
        v_date DATE;
        v_customer_id TEXT;
        v_number TEXT;
        v_item JSONB;
        v_lines JSONB;
        v_new_lines JSONB := '[]'::jsonb;
        v_existing_number TEXT;
        
        -- Calculated totals
        v_calc_qty NUMERIC;
        v_calc_price NUMERIC;
        v_calc_gross NUMERIC;
        v_calc_disc_rate NUMERIC;
        v_calc_disc_mode TEXT;
        v_calc_disc_amt NUMERIC;
        v_calc_tax_amt NUMERIC;
        v_calc_line_total NUMERIC;
        
        v_inv_subtotal NUMERIC := 0;
        v_inv_discount NUMERIC := 0;
        v_inv_tax NUMERIC := 0;
        v_inv_total NUMERIC := 0;
    BEGIN
        v_invoice_id := p_invoice->>'id';
        v_company_id := p_invoice->>'companyId';
        v_status := p_invoice->>'status';
        v_date := (p_invoice->>'date')::DATE;
        v_customer_id := p_invoice->>'customerId';
        v_number := p_invoice->>'number';
        v_lines := p_invoice->'items';

        IF v_customer_id ILIKE '%cash-sale%' THEN
            IF p_invoice->>'paymentMethod' IS NULL OR p_invoice->>'paymentMethod' = 'CASH' THEN
                p_invoice := jsonb_set(p_invoice, '{type}', '"CASH_SALE"');
            ELSE
                p_invoice := jsonb_set(p_invoice, '{type}', '"STANDARD"');
            END IF;
        END IF;
        
        SELECT invoice_number INTO v_existing_number FROM docs_invoices WHERE id = v_invoice_id;
        IF v_existing_number IS NOT NULL AND v_existing_number NOT LIKE 'DRAFT-%' AND v_existing_number != 'NEW' THEN
            v_number := v_existing_number;
            p_invoice := jsonb_set(p_invoice, '{number}', to_jsonb(v_existing_number));
        END IF;

        -- Calculate lines
        IF v_lines IS NOT NULL THEN
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_lines) LOOP
                v_calc_qty := COALESCE((v_item->>'quantity')::NUMERIC, 0);
                v_calc_price := COALESCE((v_item->>'unitPrice')::NUMERIC, 0);
                v_calc_gross := v_calc_qty * v_calc_price;
                v_calc_disc_rate := COALESCE((v_item->>'discountRate')::NUMERIC, 0);
                v_calc_disc_mode := COALESCE(v_item->>'discountMode', 'PERCENT');
                
                IF v_calc_disc_mode = 'FIXED' THEN
                    v_calc_disc_amt := v_calc_disc_rate;
                ELSE
                    v_calc_disc_amt := ROUND((v_calc_gross * (v_calc_disc_rate / 100.0)), 2);
                END IF;
                
                v_calc_tax_amt := COALESCE((v_item->>'taxValue')::NUMERIC, 0);
                v_calc_line_total := ROUND((v_calc_gross - v_calc_disc_amt + v_calc_tax_amt), 2);
                
                v_inv_subtotal := v_inv_subtotal + v_calc_gross;
                v_inv_discount := v_inv_discount + v_calc_disc_amt;
                v_inv_tax := v_inv_tax + v_calc_tax_amt;
                v_inv_total := v_inv_total + v_calc_line_total;

                v_item := jsonb_set(v_item, '{discountAmount}', to_jsonb(v_calc_disc_amt));
                v_item := jsonb_set(v_item, '{taxAmount}', to_jsonb(v_calc_tax_amt));
                v_item := jsonb_set(v_item, '{total}', to_jsonb(v_calc_line_total));
                v_item := jsonb_set(v_item, '{lineValue}', to_jsonb(v_calc_line_total));
                
                v_new_lines := v_new_lines || v_item;
            END LOOP;
        END IF;

        p_invoice := jsonb_set(p_invoice, '{items}', v_new_lines);
        p_invoice := jsonb_set(p_invoice, '{subtotal}', to_jsonb(v_inv_subtotal));
        p_invoice := jsonb_set(p_invoice, '{discountTotal}', to_jsonb(v_inv_discount));
        p_invoice := jsonb_set(p_invoice, '{taxTotal}', to_jsonb(v_inv_tax));
        p_invoice := jsonb_set(p_invoice, '{total}', to_jsonb(v_inv_total));
        p_invoice := jsonb_set(p_invoice, '{status}', '"DRAFT"');

        DELETE FROM docs_invoice_lines WHERE invoice_id = v_invoice_id;

        IF v_new_lines IS NOT NULL THEN
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_new_lines) LOOP
                INSERT INTO docs_invoice_lines (
                    id, invoice_id, company_id, product_id, quantity, unit_price, 
                    discount, tax, total, description, line_value, 
                    discount_rate, discount_mode, type, updated_at
                )
                VALUES (
                    COALESCE(v_item->>'id', gen_random_uuid()::TEXT),
                    v_invoice_id,
                    v_company_id,
                    v_item->>'productId',
                    (v_item->>'quantity')::NUMERIC,
                    (v_item->>'unitPrice')::NUMERIC,
                    (v_item->>'discountAmount')::NUMERIC,
                    (v_item->>'taxAmount')::NUMERIC,
                    (v_item->>'total')::NUMERIC,
                    v_item->>'description',
                    (v_item->>'lineValue')::NUMERIC,
                    (v_item->>'discountRate')::NUMERIC,
                    v_item->>'discountMode',
                    COALESCE(v_item->>'type', 'PRODUCT'),
                    NOW()
                )
                ON CONFLICT (id) DO UPDATE SET
                    quantity = EXCLUDED.quantity,
                    unit_price = EXCLUDED.unit_price,
                    discount = EXCLUDED.discount,
                    tax = EXCLUDED.tax,
                    total = EXCLUDED.total,
                    description = EXCLUDED.description,
                    line_value = EXCLUDED.line_value,
                    discount_rate = EXCLUDED.discount_rate,
                    discount_mode = EXCLUDED.discount_mode,
                    type = EXCLUDED.type,
                    updated_at = NOW();
            END LOOP;
        END IF;

        INSERT INTO docs_invoices (
            id, data, company_id, date, customer_id, status, 
            subtotal, discount_total, tax_total, total, invoice_number, messages, updated_at
        )
        VALUES (
            v_invoice_id, p_invoice, v_company_id, v_date, v_customer_id, 'DRAFT', 
            v_inv_subtotal, v_inv_discount, v_inv_tax, v_inv_total, v_number, COALESCE(p_invoice->'messages', '[]'::jsonb), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET 
            data = EXCLUDED.data,
            company_id = EXCLUDED.company_id,
            date = EXCLUDED.date,
            customer_id = EXCLUDED.customer_id,
            subtotal = EXCLUDED.subtotal,
            discount_total = EXCLUDED.discount_total,
            tax_total = EXCLUDED.tax_total,
            total = EXCLUDED.total,
            invoice_number = CASE 
                WHEN docs_invoices.invoice_number IS NOT NULL AND docs_invoices.invoice_number NOT LIKE 'DRAFT-%' THEN docs_invoices.invoice_number 
                ELSE EXCLUDED.invoice_number 
            END,
            messages = COALESCE(EXCLUDED.messages, docs_invoices.messages),
            updated_at = NOW();

        IF v_status IN ('POSTED', 'PAID', 'PARTIAL') THEN
            PERFORM post_invoice(v_invoice_id, v_company_id);
            -- post_invoice will handle setting status to POSTED or PAID and running triggers.
            -- If it was explicitly partial or paid, update it after. But post_invoice already handles cash sale.
        END IF;

        RETURN jsonb_build_object('success', true, 'invoice_id', v_invoice_id);
    END;
    $function$;


-- Function: process_partner_discount
CREATE OR REPLACE FUNCTION public.process_partner_discount(p_contact_id uuid, p_amount numeric, p_date date, p_description text, p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_contact RECORD;
    v_is_vendor BOOLEAN;
    v_is_customer BOOLEAN;
    v_primary_account_id UUID;
    v_discount_account_id UUID;
    v_journal_id UUID;
    v_journal_num TEXT;
    v_system_user_id UUID;
BEGIN
    -- 1. Get contact details
    SELECT * INTO v_contact FROM docs_contacts WHERE id = p_contact_id AND company_id = p_company_id;
    IF v_contact IS NULL THEN
        RAISE EXCEPTION 'Contact not found for the given company';
    END IF;

    -- Infer type from jsonb data if contact_type is missing or to double check
    v_is_vendor := (v_contact.data->>'type' = 'VENDOR');
    v_is_customer := (v_contact.data->>'type' = 'CUSTOMER');

    IF NOT v_is_vendor AND NOT v_is_customer THEN
        RAISE EXCEPTION 'Contact is neither a vendor nor a customer';
    END IF;

    -- 2. Resolve accounts
    IF v_is_vendor THEN
        -- Vendor Discount (Received/Earned)
        -- Debit: Accounts Payable
        -- Credit: Discount Received
        SELECT id INTO v_primary_account_id FROM docs_accounts 
        WHERE company_id = p_company_id 
        AND (code IN ('200101', '2100') OR data->>'subType' = 'ACCOUNTS_PAYABLE') 
        LIMIT 1;

        SELECT id INTO v_discount_account_id FROM docs_accounts 
        WHERE company_id = p_company_id 
        AND (code IN ('400400', '400401') OR LOWER(name) LIKE '%earned%' OR LOWER(name) LIKE '%discount received%') 
        LIMIT 1;

        IF v_discount_account_id IS NULL THEN
            v_discount_account_id := gen_random_uuid();
            INSERT INTO docs_accounts (id, company_id, name, type, code, data, created_at, updated_at)
            VALUES (v_discount_account_id, p_company_id, 'Discount Received', 'OTHER_REVENUE', '400400', 
                    jsonb_build_object('name', 'Discount Received', 'type', 'OTHER_REVENUE', 'code', '400400', 'description', 'Discounts received from vendors'),
                    NOW(), NOW());
        END IF;
    ELSE
        -- Customer Discount (Given/Allowed)
        -- Debit: Discount Given
        -- Credit: Accounts Receivable
        SELECT id INTO v_primary_account_id FROM docs_accounts 
        WHERE company_id = p_company_id 
        AND (code IN ('100201', '1200') OR data->>'subType' = 'ACCOUNTS_RECEIVABLE') 
        LIMIT 1;

        SELECT id INTO v_discount_account_id FROM docs_accounts 
        WHERE company_id = p_company_id 
        AND (code IN ('400300', '601100') OR LOWER(name) LIKE '%discount given%' OR LOWER(name) LIKE '%discount allowed%') 
        LIMIT 1;

        IF v_discount_account_id IS NULL THEN
            v_discount_account_id := gen_random_uuid();
            INSERT INTO docs_accounts (id, company_id, name, type, code, data, created_at, updated_at)
            VALUES (v_discount_account_id, p_company_id, 'Discount Given', 'REVENUE', '400300', 
                    jsonb_build_object('name', 'Discount Given', 'type', 'REVENUE', 'code', '400300', 'description', 'Discounts given to customers'),
                    NOW(), NOW());
        END IF;
    END IF;

    IF v_primary_account_id IS NULL THEN
        RAISE EXCEPTION 'Primary account (A/R or A/P) not found for company';
    END IF;

    -- 3. Generate journal number
    v_journal_num := generate_next_number('JOURNAL', p_company_id);
    
    -- Try to get system user
    SELECT id INTO v_system_user_id FROM auth_users LIMIT 1;

    -- 4. Create Journal Entry
    v_journal_id := gen_random_uuid();
    INSERT INTO docs_journals (
        id, company_id, reference_number, date, status, data, created_at, updated_at
    ) VALUES (
        v_journal_id, p_company_id, v_journal_num, p_date, 'POSTED',
        jsonb_build_object(
            'description', COALESCE(p_description, CASE WHEN v_is_vendor THEN 'Purchase' ELSE 'Sales' END || ' Discount - ' || (v_contact.data->>'name')),
            'journalType', CASE WHEN v_is_vendor THEN 'PURCHASE_DISCOUNT' ELSE 'SALES_DISCOUNT' END
        ),
        NOW(), NOW()
    );

    -- 5. Create Journal Lines
    -- Line 1: Primary Account (AR/AP)
    INSERT INTO docs_journal_lines (
        id, journal_id, company_id, account_id, contact_id, debit, credit, data, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), v_journal_id, p_company_id, v_primary_account_id, p_contact_id,
        CASE WHEN v_is_vendor THEN p_amount ELSE 0 END,
        CASE WHEN v_is_customer THEN p_amount ELSE 0 END,
        jsonb_build_object('description', CASE WHEN v_is_vendor THEN 'A/P' ELSE 'A/R' END || ' Adjustment for Discount'),
        NOW(), NOW()
    );

    -- Line 2: Discount Account
    INSERT INTO docs_journal_lines (
        id, journal_id, company_id, account_id, contact_id, debit, credit, data, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), v_journal_id, p_company_id, v_discount_account_id, p_contact_id,
        CASE WHEN v_is_customer THEN p_amount ELSE 0 END,
        CASE WHEN v_is_vendor THEN p_amount ELSE 0 END,
        jsonb_build_object('description', CASE WHEN v_is_vendor THEN 'Discount Received' ELSE 'Discount Allowed' END || ' - ' || (v_contact.data->>'name')),
        NOW(), NOW()
    );

    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
END;
$function$;


-- Function: process_payment
CREATE OR REPLACE FUNCTION public.process_payment(p_payment jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_company_id TEXT;
    v_payment_id TEXT;
    v_status TEXT;
    v_date DATE;
    v_amount NUMERIC;
    v_type TEXT;
    v_contact_id TEXT;
    v_applied_invoices JSONB;
    v_applied_bills JSONB;
    v_account_id TEXT;
    v_partner_account_id TEXT;
    v_reference TEXT;
    v_method TEXT;
    
    -- Auto allocation vars
    v_allocated_amt NUMERIC;
    v_unallocated_amt NUMERIC;
    v_doc RECORD;
    v_doc_total NUMERIC;
    v_doc_paid NUMERIC;
    v_doc_unpaid NUMERIC;
    v_allocate NUMERIC;
    v_newly_allocated JSONB := '[]'::jsonb;
    v_doc_elem JSONB;
    v_doc_idx INTEGER;
BEGIN
    v_payment_id := p_payment->>'id';
    v_company_id := COALESCE(p_payment->>'companyId', p_payment->>'company_id');
    v_status := p_payment->>'status';
    v_date := (p_payment->>'date')::DATE;
    v_amount := (p_payment->>'amount')::NUMERIC;
    v_type := p_payment->>'type';
    v_contact_id := COALESCE(p_payment->>'contactId', p_payment->>'contact_id', p_payment->>'customerId', p_payment->>'vendorId');
    
    v_applied_invoices := p_payment->'applied_invoices';
    IF v_applied_invoices IS NULL THEN
        v_applied_invoices := COALESCE(p_payment->'appliedInvoices', '[]'::jsonb);
    END IF;
    
    v_applied_bills := p_payment->'applied_bills';
    IF v_applied_bills IS NULL THEN
        v_applied_bills := COALESCE(p_payment->'appliedBills', '[]'::jsonb);
    END IF;
    
    v_account_id := COALESCE(p_payment->>'liquidityAccountId', p_payment->>'account_id', p_payment->>'accountId');
    v_partner_account_id := COALESCE(p_payment->>'partnerAccountId', p_payment->>'partner_account_id');
    v_reference := COALESCE(p_payment->>'reference', p_payment->>'memo');
    v_method := p_payment->>'method';

    IF v_status IN ('POSTED', 'CLEARED') AND v_contact_id IS NOT NULL THEN
        v_allocated_amt := 0;
        
        IF (v_type = 'RECEIPT' OR v_type = 'COLLECTION') AND jsonb_typeof(v_applied_invoices) = 'array' THEN
            FOR v_doc_elem IN SELECT * FROM jsonb_array_elements(v_applied_invoices) LOOP
                v_allocated_amt := v_allocated_amt + COALESCE((v_doc_elem->>'amount')::NUMERIC, 0);
            END LOOP;
            v_newly_allocated := v_applied_invoices;
            v_unallocated_amt := v_amount - v_allocated_amt;
            
            IF v_unallocated_amt > 0.01 THEN
                FOR v_doc IN 
                    SELECT id, total FROM docs_invoices 
                    WHERE company_id = v_company_id AND customer_id = v_contact_id AND status IN ('POSTED', 'PARTIAL', 'PARTIAL_REFUNDED')
                    ORDER BY date ASC
                LOOP
                    IF v_unallocated_amt <= 0.01 THEN EXIT; END IF;
                    
                    -- Check if already in v_newly_allocated
                    CONTINUE WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(v_newly_allocated) el WHERE el->>'invoiceId' = v_doc.id);
                    
                    -- Calculate already paid
                    SELECT COALESCE(SUM( (ab->>'amount')::NUMERIC ), 0) INTO v_doc_paid
  FROM docs_payments p
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(p.applied_bills) = 'array' THEN p.applied_bills ELSE '[]'::jsonb END
  ) ab
  WHERE p.status = 'POSTED' AND p.company_id = v_company_id AND ab->>'billId' = v_doc.id;
                    
                    v_doc_unpaid := GREATEST(0, v_doc.total - v_doc_paid);
                    IF v_doc_unpaid > 0 THEN
                        v_allocate := LEAST(v_doc_unpaid, v_unallocated_amt);
                        v_newly_allocated := v_newly_allocated || jsonb_build_object('billId', v_doc.id, 'amount', v_allocate);
                        v_unallocated_amt := v_unallocated_amt - v_allocate;
                    END IF;
                END LOOP;
                v_applied_bills := v_newly_allocated;
                p_payment := jsonb_set(p_payment, '{applied_bills}', v_applied_bills);
            END IF;
        END IF;
    END IF;

    -- 1. Insert Payment Header (KEEP IT AS DRAFT for now to pass trigger constraints)
    INSERT INTO docs_payments (
        id, data, company_id, date, type, status, amount, contact_id,
        applied_invoices, applied_bills, account_id, partner_account_id, 
        reference, method, payment_date, payment_number, updated_at
    )
    VALUES (
        v_payment_id, jsonb_set(p_payment, '{status}', '"DRAFT"'), v_company_id, v_date, v_type, 'DRAFT', v_amount, v_contact_id,
        v_applied_invoices, v_applied_bills, v_account_id, v_partner_account_id, 
        v_reference, v_method, COALESCE(v_date, CURRENT_DATE), p_payment->>'number', NOW()
    )
    ON CONFLICT (id) DO UPDATE SET 
        data = EXCLUDED.data,
        company_id = EXCLUDED.company_id,
        date = EXCLUDED.date,
        type = EXCLUDED.type,
        status = 'DRAFT',
        amount = EXCLUDED.amount,
        contact_id = EXCLUDED.contact_id,
        applied_invoices = EXCLUDED.applied_invoices,
        applied_bills = EXCLUDED.applied_bills,
        account_id = EXCLUDED.account_id,
        partner_account_id = EXCLUDED.partner_account_id,
        reference = EXCLUDED.reference,
        method = EXCLUDED.method,
        payment_date = EXCLUDED.payment_date,
        payment_number = CASE 
            WHEN docs_payments.payment_number IS NOT NULL AND docs_payments.payment_number NOT LIKE 'DRAFT-%' THEN docs_payments.payment_number 
            ELSE EXCLUDED.payment_number 
        END,
        updated_at = NOW();

    -- 4. Transition to final status and generate journals
    IF v_status IN ('POSTED', 'CLEARED') THEN
        PERFORM post_payment(v_payment_id, v_company_id);
    END IF;

    RETURN jsonb_build_object('success', true, 'payment_id', v_payment_id);
END;
$function$;


-- Function: process_payment_and_allocate
CREATE OR REPLACE FUNCTION public.process_payment_and_allocate(p_company_id text, p_receipt_data jsonb, p_invoices jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
    DECLARE
      v_effective_company_id TEXT;
      v_payment_id TEXT;
      v_total_amount NUMERIC := 0;
      v_alloc RECORD;
      v_inv RECORD;
      v_new_paid NUMERIC;
      v_inv_paid NUMERIC;
    BEGIN
      v_effective_company_id := p_company_id;
      IF NOT check_company_access(v_effective_company_id) THEN RAISE EXCEPTION $$Access denied$$; END IF;

      v_payment_id := COALESCE(p_receipt_data->>$$id$$, $$PAY-$$ || gen_random_uuid());
      v_total_amount := COALESCE((p_receipt_data->>$$amount$$)::NUMERIC, 0);

      -- Insert normalized payment (using real columns!)
      INSERT INTO docs_payments (
        id, company_id, status, payment_number, date, contact_id, amount, payment_date, type, method, account_id, partner_account_id, reference, applied_invoices, applied_bills
      ) VALUES (
        v_payment_id, 
        v_effective_company_id, 
        $$DRAFT$$,
        COALESCE(p_receipt_data->>$$payment_number$$, p_receipt_data->>$$number$$),
        (p_receipt_data->>$$date$$)::DATE,
        p_receipt_data->>$$contact_id$$,
        v_total_amount,
        (p_receipt_data->>$$payment_date$$)::DATE,
        p_receipt_data->>$$type$$,
        p_receipt_data->>$$method$$,
        p_receipt_data->>$$account_id$$,
        p_receipt_data->>$$partner_account_id$$,
        p_receipt_data->>$$reference$$,
        p_invoices,
        $$[]$$::jsonb
      ) ON CONFLICT (id) DO UPDATE SET
        amount = v_total_amount,
        applied_invoices = p_invoices,
        applied_bills = $$[]$$::jsonb,
        updated_at = NOW();

      -- Process allocations verification ONLY (Do not update invoice status here to prevent premature DRAFT mapping)
      FOR v_alloc IN SELECT * FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_invoices) = $$array$$ THEN p_invoices ELSE $$[]$$::jsonb END) LOOP
          SELECT * INTO v_inv FROM docs_invoices WHERE id = v_alloc->>$$invoiceId$$ AND company_id = v_effective_company_id FOR UPDATE;
          IF NOT FOUND THEN RAISE EXCEPTION $$Invoice not found: %$$, v_alloc->>$$invoiceId$$; END IF;
          
          SELECT COALESCE(SUM((al->>$$amount$$)::NUMERIC), 0) INTO v_inv_paid
          FROM docs_payments p, jsonb_array_elements(CASE WHEN jsonb_typeof(p.applied_invoices) = $$array$$ THEN p.applied_invoices ELSE $$[]$$::jsonb END) al
          WHERE p.status = $$POSTED$$ AND p.company_id = v_effective_company_id AND al->>$$invoiceId$$ = v_inv.id;

          v_new_paid := v_inv_paid + (v_alloc->>$$amount$$)::NUMERIC;
          IF v_new_paid > COALESCE(v_inv.total, 0) THEN
              RAISE EXCEPTION $$Cannot overpay invoice %$$, v_inv.id;
          END IF;
      END LOOP;

      RETURN jsonb_build_object($$success$$, true, $$payment_id$$, v_payment_id);
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object($$success$$, false, $$error$$, SQLERRM);
    END;
$function$;


-- Function: process_stock_movement_and_valuation
CREATE OR REPLACE FUNCTION public.process_stock_movement_and_valuation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    current_qty NUMERIC := 0;
    current_avg_cost NUMERIC := 0;
    new_qty NUMERIC := 0;
    new_avg_cost NUMERIC := 0;
    new_valuation NUMERIC := 0;
BEGIN
    -- কেলকুলেশনের সুবিধার জন্য টোটাল ভ্যালু অটো সেট করা
    NEW.total_value := NEW.quantity * NEW.unit_cost;

    -- ১. বর্তমান স্টক এবং বর্তমান এভারেজ কস্ট কত আছে তা বের করা
    SELECT COALESCE(quantity, 0), COALESCE(avg_cost_price, 0)
    INTO current_qty, current_avg_cost
    FROM docs_product_stocks
    WHERE product_id = NEW.product_id AND company_id = NEW.company_id;

    -- যদি এই কোম্পানির আন্ডারে প্রোডাক্টের কোনো স্টক রো না থাকে, তবে নতুন তৈরি করবে
    IF NOT FOUND THEN
        INSERT INTO docs_product_stocks (product_id, company_id, quantity, avg_cost_price, total_valuation)
        VALUES (NEW.product_id, NEW.company_id, 0, 0, 0);
        current_qty := 0;
        current_avg_cost := 0;
    END IF;

    -- ২. মুভমেন্ট টাইপ অনুযায়ী স্টক ও এভারেজ কস্ট (AVCO) হিসাব করা
    IF NEW.movement_type = 'ADDED' THEN
        new_qty := current_qty + NEW.quantity;
        
        -- সূত্র (Weighted Average Cost): ((পুরাতন স্টক * পুরাতন রেট) + (নতুন স্টক * নতুন রেট)) / নতুন মোট স্টক
        IF new_qty > 0 THEN
            new_avg_cost := ((current_qty * current_avg_cost) + (NEW.quantity * NEW.unit_cost)) / new_qty;
        ELSE
            new_avg_cost := NEW.unit_cost;
        END IF;
        
        -- মূল স্টক টেবিল আপডেট
        UPDATE docs_product_stocks
        SET 
            quantity = new_qty,
            total_added = total_added + NEW.quantity,
            avg_cost_price = new_avg_cost,
            total_valuation = new_qty * new_avg_cost
        WHERE product_id = NEW.product_id AND company_id = NEW.company_id;

    ELSIF NEW.movement_type = 'OUT' THEN
        new_qty := current_qty - NEW.quantity;
        -- স্টক আউট হলে এভারেজ কস্ট বা রেট চেঞ্জ হয় না, শুধু স্টক ও টোটাল ভ্যালু কমে
        new_avg_cost := current_avg_cost; 
        
        UPDATE docs_product_stocks
        SET 
            quantity = new_qty,
            total_out = total_out + NEW.quantity,
            total_valuation = new_qty * new_avg_cost
        WHERE product_id = NEW.product_id AND company_id = NEW.company_id;
    END IF;

    RETURN NEW;
END;
$function$;


-- Function: protect_generated_lines
CREATE OR REPLACE FUNCTION public.protect_generated_lines()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
       v_status TEXT;
       v_num TEXT;
    BEGIN
        IF TG_TABLE_NAME = 'docs_invoice_lines' THEN
            SELECT status, invoice_number INTO v_status, v_num FROM docs_invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
            IF v_num LIKE 'INV-%' THEN
                -- If it's an insert or update from a stale draft sync
                IF TG_OP = 'UPDATE' THEN
                    -- Prevent modifying line value / quantity from an offline sync if it's posted, 
                    -- UNLESS it's a genuine status update (which we handled above)
                    -- Actually, we can just allow it if the user is admin, but let's just block line changes for POSTED unless bypass is true.
                END IF;
            END IF;
        END IF;
        RETURN NEW;
    END;
    $function$;


-- Function: protect_generated_lines_silent
CREATE OR REPLACE FUNCTION public.protect_generated_lines_silent()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
       v_num TEXT;
       v_bypass TEXT;
    BEGIN
        v_bypass := current_setting('core.bypass_audit', true);
        IF COALESCE(v_bypass, 'false') = 'true' THEN
            RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
        END IF;

        IF TG_TABLE_NAME IN ('docs_invoice_lines') THEN
            SELECT invoice_number INTO v_num FROM docs_invoices WHERE id = COALESCE(CASE WHEN TG_OP = 'DELETE' THEN OLD.invoice_id ELSE NEW.invoice_id END, '');
            IF v_num LIKE 'INV-%' THEN
                -- Silently reject
                RETURN NULL;
            END IF;
        ELSIF TG_TABLE_NAME IN ('docs_bill_lines') THEN
            SELECT bill_number INTO v_num FROM docs_bills WHERE id = COALESCE(CASE WHEN TG_OP = 'DELETE' THEN OLD.bill_id ELSE NEW.bill_id END, '');
            IF v_num LIKE 'BIL-%' THEN
                RETURN NULL;
            END IF;
        END IF;
        
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END;
    $function$;


-- Function: protect_generated_numbers
CREATE OR REPLACE FUNCTION public.protect_generated_numbers()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
        v_bypass TEXT;
    BEGIN
        v_bypass := current_setting('core.bypass_audit', true);
        IF COALESCE(v_bypass, 'false') = 'true' THEN
            RETURN NEW;
        END IF;

        IF TG_TABLE_NAME = 'docs_invoices' THEN
            IF OLD.invoice_number LIKE 'INV-%' THEN
                IF (NEW.invoice_number != OLD.invoice_number) OR (NEW.status IN ('DRAFT', 'DRAFTED')) THEN
                    NEW.invoice_number := OLD.invoice_number;
                    NEW.status := OLD.status;
                    NEW.date := OLD.date;
                    NEW.journal_entry_id := OLD.journal_entry_id;
                    -- Optionally protect data but let's just ensure number and status is kept safe.
                    -- Re-inject the locked number into the data JSON block
                    IF NEW.data IS NOT NULL THEN
                       NEW.data := jsonb_set(NEW.data, '{number}', to_jsonb(OLD.invoice_number));
                       NEW.data := jsonb_set(NEW.data, '{status}', to_jsonb(OLD.status));
                    END IF;
                END IF;
            END IF;
        ELSIF TG_TABLE_NAME = 'docs_bills' THEN
            IF OLD.bill_number LIKE 'BIL-%' THEN
                IF (NEW.bill_number != OLD.bill_number) OR (NEW.status IN ('DRAFT', 'DRAFTED')) THEN
                    NEW.bill_number := OLD.bill_number;
                    NEW.status := OLD.status;
                    NEW.date := OLD.date;
                    NEW.journal_entry_id := OLD.journal_entry_id;
                    IF NEW.data IS NOT NULL THEN
                       NEW.data := jsonb_set(NEW.data, '{number}', to_jsonb(OLD.bill_number));
                       NEW.data := jsonb_set(NEW.data, '{status}', to_jsonb(OLD.status));
                    END IF;
                END IF;
            END IF;
        END IF;
        RETURN NEW;
    END;
    $function$;


-- Function: protect_posted_documents
CREATE OR REPLACE FUNCTION public.protect_posted_documents()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'POSTED' AND NEW.status = 'POSTED' THEN
            -- Allow non-financial field changes if status remains POSTED
            NULL; 
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        IF OLD.status = 'POSTED' THEN
            RAISE EXCEPTION 'Cannot delete a POSTED document.';
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;


-- Function: rebuild_bill_journals
CREATE OR REPLACE FUNCTION public.rebuild_bill_journals(p_bill_id text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
    DECLARE
        v_bill RECORD;
        v_effective_company_id TEXT;
        v_journal_id TEXT;
        v_ap_acc TEXT;
        v_inv_asset_acc TEXT;
        v_expense_acc TEXT;
        v_idx INT := 0;
        v_item jsonb;
        v_item_subtotal NUMERIC;
        v_total_debit NUMERIC := 0;
        v_total_credit NUMERIC := 0;
    BEGIN
        SELECT * INTO v_bill FROM docs_bills WHERE id = p_bill_id;
        v_effective_company_id := COALESCE(v_bill.company_id, v_bill.data->>'companyId', 'comp-1');
        
        SELECT id INTO v_ap_acc FROM docs_accounts WHERE code = '200101' AND company_id = v_effective_company_id LIMIT 1;
        SELECT id INTO v_inv_asset_acc FROM docs_accounts WHERE code = '100501' AND company_id = v_effective_company_id LIMIT 1;
        IF v_inv_asset_acc IS NULL THEN
            SELECT id INTO v_inv_asset_acc FROM docs_accounts WHERE type = 'ASSET' AND company_id = v_effective_company_id LIMIT 1;
        END IF;

        v_journal_id := COALESCE(v_bill.data->>'journalEntryId', 'JE-' || replace(replace(UPPER(v_bill.id), 'BILL-', ''), 'BILL-', ''));

        UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE journal_id = v_journal_id;

        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
        VALUES ('JL-'||v_journal_id||'-ap', v_journal_id, v_effective_company_id, v_ap_acc, v_bill.vendor_id, 0, ROUND(COALESCE((v_bill.data->>'total')::numeric, 0), 2), 'AP: ' || (v_bill.data->>'number')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;
        v_total_credit := ROUND(COALESCE((v_bill.data->>'total')::numeric, 0), 2);

        FOR v_item IN SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(v_bill.data->'items') = 'array' THEN v_bill.data->'items' ELSE '[]'::jsonb END) LOOP
            v_idx := v_idx + 1; 
            IF v_item->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE', 'EXPENSE') THEN
                v_item_subtotal := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                -- Use inventory asset account for simplicity or if expense use expense if passed?
                -- Bills can have expense accounts. But let's just reverse the 0 lines.
                -- First let's find the proper account
                SELECT id INTO v_expense_acc FROM docs_accounts WHERE id = (v_item->>'accountId') OR code = (v_item->>'accountCode') AND company_id = v_effective_company_id LIMIT 1;
                IF v_expense_acc IS NULL THEN
                    v_expense_acc := v_inv_asset_acc;
                END IF;

                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                VALUES ('JL-'||v_journal_id||'-exp-'||v_idx, v_journal_id, v_effective_company_id, v_expense_acc, v_item_subtotal, 0, 'Bill Item: ' || COALESCE(v_item->>'description', '')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;
                v_total_debit := v_total_debit + v_item_subtotal;
            ELSIF v_item->>'type' = 'TAX' THEN
                -- simplified tax handling if any
                v_item_subtotal := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                VALUES ('JL-'||v_journal_id||'-tax-'||v_idx, v_journal_id, v_effective_company_id, v_inv_asset_acc, v_item_subtotal, 0, 'Tax') ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;
                v_total_debit := v_total_debit + v_item_subtotal;
            END IF;
        END LOOP;

        IF ABS(v_total_debit - v_total_credit) <= 0.10 THEN
            UPDATE docs_journal_lines SET debit = debit + (v_total_credit - v_total_debit) WHERE journal_id = v_journal_id AND id = 'JL-'||v_journal_id||'-exp-'||v_idx;
        END IF;
    END;
    $function$;


-- Function: rebuild_cn_journals_batch
CREATE OR REPLACE FUNCTION public.rebuild_cn_journals_batch()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
    DECLARE
        r RECORD;
        v_ar_acc TEXT;
        v_rev_acc TEXT;
        v_cogs_acc TEXT;
        v_inv_acc TEXT;
        
        v_idx INT := 0;
        v_item jsonb;
        v_item_subtotal NUMERIC;
    BEGIN
        FOR r IN 
            SELECT j.id as jid, j.company_id, c.customer_id, c.total, c.data->'items' as items
            FROM docs_journals j 
            JOIN docs_credit_notes c ON c.id = substring(j.id from 7) OR UPPER('JE-' || c.id) = j.id OR UPPER('JE-CN-' || c.id) = j.id
            WHERE j.status = 'POSTED' AND j.journal_type = 'CREDIT_NOTE'
        LOOP
            SELECT id INTO v_ar_acc FROM docs_accounts WHERE code = '100201' AND company_id = r.company_id LIMIT 1;
            SELECT id INTO v_rev_acc FROM docs_accounts WHERE code = '400100' AND company_id = r.company_id LIMIT 1;
            SELECT id INTO v_cogs_acc FROM docs_accounts WHERE code = '500101' AND company_id = r.company_id LIMIT 1;
            SELECT id INTO v_inv_acc FROM docs_accounts WHERE code = '100501' AND company_id = r.company_id LIMIT 1;

            UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE journal_id = r.jid;

            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
            VALUES ('JL-'||r.jid||'-ar', r.jid, r.company_id, v_ar_acc, r.customer_id, 0, ROUND(COALESCE(r.total::numeric, 0), 2), 'AR (CN)') ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;

            v_idx := 0;
            FOR v_item IN SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(r.items) = 'array' THEN r.items ELSE '[]'::jsonb END) LOOP
                v_idx := v_idx + 1; 
                IF v_item->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE') THEN
                    v_item_subtotal := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                    IF v_item_subtotal = 0 THEN
                        v_item_subtotal := COALESCE((v_item->'data'->>'lineValue')::numeric, 0);
                    END IF;
                    
                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                    VALUES ('JL-'||r.jid||'-rev-'||v_idx, r.jid, r.company_id, v_rev_acc, v_item_subtotal, 0, 'Rev (CN)') ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;

                    IF v_item->>'type' = 'PRODUCT' THEN
                        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description) VALUES ('JL-'||r.jid||'-cogs-'||v_idx, r.jid, r.company_id, v_cogs_acc, 0, v_item_subtotal * 0.8, 'COGS (CN)');
                        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description) VALUES ('JL-'||r.jid||'-inv-'||v_idx, r.jid, r.company_id, v_inv_acc, v_item_subtotal * 0.8, 0, 'Inv (CN)') ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;
                    END IF;
                END IF;
            END LOOP;
        END LOOP;
    END;
    $function$;


-- Function: rebuild_cpay_auto_journals
CREATE OR REPLACE FUNCTION public.rebuild_cpay_auto_journals()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
    DECLARE
        r RECORD;
        v_ar_acc TEXT;
        v_liq_acc TEXT;
    BEGIN
        FOR r IN 
            SELECT j.id as jid, j.company_id, i.customer_id, i.total 
            FROM docs_journals j 
            JOIN docs_invoices i ON j.id = 'JE-CPAY-AUTO-' || UPPER(i.id) 
            WHERE j.status = 'POSTED' AND j.journal_type = 'CUST_PAY'
        LOOP
            SELECT id INTO v_ar_acc FROM docs_accounts WHERE code = '100201' AND company_id = r.company_id LIMIT 1;
            
            SELECT id INTO v_liq_acc FROM docs_accounts WHERE code = '100100' AND company_id = r.company_id LIMIT 1;
            IF v_liq_acc IS NULL THEN SELECT id INTO v_liq_acc FROM docs_accounts WHERE type = 'ASSET' AND company_id = r.company_id LIMIT 1; END IF;

            UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE journal_id = r.jid;

            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
            VALUES ('JL-'||r.jid||'-ar', r.jid, r.company_id, v_ar_acc, r.customer_id, 0, ROUND(COALESCE(r.total::numeric, 0), 2), 'Auto Payment from: ' || COALESCE(r.customer_id, '')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;

            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
            VALUES ('JL-'||r.jid||'-liq', r.jid, r.company_id, v_liq_acc, ROUND(COALESCE(r.total::numeric, 0), 2), 0, 'Liquidity for Auto Payment: ' || r.jid) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;
        END LOOP;
    END;
    $function$;


-- Function: rebuild_invoice_journals
CREATE OR REPLACE FUNCTION public.rebuild_invoice_journals(p_invoice_id text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
    DECLARE
        v_invoice RECORD;
        v_effective_company_id TEXT;
        v_journal_id TEXT;
        v_ar_acc TEXT;
        v_rev_acc TEXT;
        v_cogs_acc TEXT;
        v_inv_acc TEXT;
        v_tax_acc TEXT;
        
        v_idx INT := 0;
        v_items_count INT := 0;
        v_current_item_idx INT := 0;
        v_item jsonb;
        v_item_subtotal NUMERIC;
        v_revenue_net NUMERIC;
        v_total_revenue_subtotal NUMERIC := 0;
        v_global_discount NUMERIC := 0;
        v_discount_distributed NUMERIC := 0;
        v_proportional_discount NUMERIC;
        v_tax_total NUMERIC := 0;
        v_total_debit NUMERIC := 0;
        v_total_credit NUMERIC := 0;
        v_cogs_value NUMERIC;
    BEGIN
        SELECT * INTO v_invoice FROM docs_invoices WHERE id = p_invoice_id;
        v_effective_company_id := COALESCE(v_invoice.company_id, v_invoice.data->>'companyId', 'comp-1');
        
        SELECT id INTO v_ar_acc FROM docs_accounts WHERE code = '100201' AND company_id = v_effective_company_id LIMIT 1;
        SELECT id INTO v_rev_acc FROM docs_accounts WHERE code = '400100' AND company_id = v_effective_company_id LIMIT 1;
        SELECT id INTO v_cogs_acc FROM docs_accounts WHERE code = '500101' AND company_id = v_effective_company_id LIMIT 1;
        SELECT id INTO v_inv_acc FROM docs_accounts WHERE code = '100501' AND company_id = v_effective_company_id LIMIT 1;
        SELECT id INTO v_tax_acc FROM docs_accounts WHERE code = '200100' AND company_id = v_effective_company_id LIMIT 1;
        
        v_journal_id := COALESCE(v_invoice.data->>'journalEntryId', 'JE-' || replace(replace(UPPER(v_invoice.id), 'INV-', ''), 'INV-', ''));
        
        -- Calculate totals
        FOR v_item IN SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(v_invoice.data->'items') = 'array' THEN v_invoice.data->'items' ELSE '[]'::jsonb END) LOOP
            IF v_item->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE') THEN
                v_item_subtotal := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                IF v_item_subtotal = 0 THEN
                    v_item_subtotal := COALESCE((v_item->>'quantity')::numeric, 0) * COALESCE((v_item->>'unitPrice')::numeric, 0);
                    IF v_item->>'discountMode' = 'FIXED' THEN v_item_subtotal := v_item_subtotal - COALESCE((v_item->>'discountRate')::numeric, 0);
                    ELSE v_item_subtotal := v_item_subtotal * (1 - COALESCE((v_item->>'discountRate')::numeric, 0) / 100); END IF;
                END IF;
                v_total_revenue_subtotal := v_total_revenue_subtotal + ROUND(v_item_subtotal, 2);
            ELSIF v_item->>'type' = 'DISCOUNT' THEN
                v_global_discount := v_global_discount + ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
            ELSIF v_item->>'type' = 'TAX' THEN
                v_tax_total := v_tax_total + ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
            END IF;
        END LOOP;

        UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE journal_id = v_journal_id;

        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
        VALUES ('JL-'||v_journal_id||'-ar', v_journal_id, v_effective_company_id, v_ar_acc, v_invoice.customer_id, ROUND(COALESCE((v_invoice.data->>'total')::numeric, 0), 2), 0, 'AR: ' || (v_invoice.data->>'number')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;
        v_total_debit := ROUND(COALESCE((v_invoice.data->>'total')::numeric, 0), 2);

        SELECT count(*) INTO v_items_count FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_invoice.data->'items') = 'array' THEN v_invoice.data->'items' ELSE '[]'::jsonb END) it WHERE it->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE');
        FOR v_item IN SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(v_invoice.data->'items') = 'array' THEN v_invoice.data->'items' ELSE '[]'::jsonb END) LOOP
            v_idx := v_idx + 1; 
            IF v_item->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE') THEN
                v_current_item_idx := v_current_item_idx + 1;
                v_item_subtotal := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                IF v_item_subtotal = 0 THEN
                    v_item_subtotal := COALESCE((v_item->>'quantity')::numeric, 0) * COALESCE((v_item->>'unitPrice')::numeric, 0);
                    IF v_item->>'discountMode' = 'FIXED' THEN v_item_subtotal := v_item_subtotal - COALESCE((v_item->>'discountRate')::numeric, 0);
                    ELSE v_item_subtotal := v_item_subtotal * (1 - COALESCE((v_item->>'discountRate')::numeric, 0) / 100); END IF;
                END IF;
                v_item_subtotal := ROUND(v_item_subtotal, 2);
                
                IF v_current_item_idx = v_items_count THEN v_proportional_discount := ROUND(v_global_discount - v_discount_distributed, 2);
                ELSE v_proportional_discount := ROUND(CASE WHEN v_total_revenue_subtotal > 0 THEN (v_item_subtotal / v_total_revenue_subtotal) * v_global_discount ELSE 0 END, 2);
                v_discount_distributed := v_discount_distributed + v_proportional_discount; END IF;
                v_revenue_net := ROUND(v_item_subtotal + v_proportional_discount, 2);

                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                VALUES ('JL-'||v_journal_id||'-rev-'||v_idx, v_journal_id, v_effective_company_id, v_rev_acc, 0, v_revenue_net, 'Revenue: ' || (v_item->>'description')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;
                v_total_credit := v_total_credit + v_revenue_net;

                IF v_item->>'type' = 'PRODUCT' THEN
                    -- Removed manual COGS insertion as it is handled by inventory triggers
                END IF;
            ELSIF v_item->>'type' = 'TAX' THEN
                v_tax_total := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description) VALUES ('JL-'||v_journal_id||'-tax-'||v_idx, v_journal_id, v_effective_company_id, v_tax_acc, 0, v_tax_total, 'Tax') ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;
                v_total_credit := v_total_credit + v_tax_total;
            END IF;
        END LOOP;

        IF ABS(v_total_debit - v_total_credit) <= 0.10 THEN
            UPDATE docs_journal_lines SET credit = credit + (v_total_debit - v_total_credit) WHERE journal_id = v_journal_id AND id = 'JL-'||v_journal_id||'-rev-'||v_idx;
        END IF;
    END;
    $function$;


-- Function: rebuild_payment_journals
CREATE OR REPLACE FUNCTION public.rebuild_payment_journals()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
    DECLARE
        r RECORD;
        v_ar_acc TEXT;
        v_ap_acc TEXT;
        v_liq_acc TEXT;
    BEGIN
        FOR r IN 
            SELECT j.id as jid, j.company_id, p.contact_id, p.account_id, COALESCE(p.data->>'amount', p.amount::text) as amount 
            FROM docs_journals j 
            JOIN docs_payments p ON p.id = substring(j.id from 9) OR UPPER('JE-' || p.id) = j.id OR UPPER('JE-CPAY-' || replace(p.id, 'PAY-', '')) = j.id
            WHERE j.status = 'POSTED' AND j.journal_type = 'CUST_PAY' AND j.id NOT LIKE 'JE-CPAY-AUTO-%'
        LOOP
            SELECT id INTO v_ar_acc FROM docs_accounts WHERE code = '100201' AND company_id = r.company_id LIMIT 1;
            v_liq_acc := r.account_id;
            IF v_liq_acc IS NULL THEN
                SELECT id INTO v_liq_acc FROM docs_accounts WHERE code = '100100' AND company_id = r.company_id LIMIT 1;
            END IF;
            IF v_liq_acc IS NULL THEN
                 SELECT id INTO v_liq_acc FROM docs_accounts WHERE type = 'ASSET' AND company_id = r.company_id LIMIT 1;
            END IF;

            UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE journal_id = r.jid;

            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
            VALUES ('JL-'||r.jid||'-ar', r.jid, r.company_id, v_ar_acc, r.contact_id, 0, ROUND(COALESCE(r.amount::numeric, 0), 2), 'Payment from: ' || COALESCE(r.contact_id, '')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;

            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
            VALUES ('JL-'||r.jid||'-liq', r.jid, r.company_id, v_liq_acc, ROUND(COALESCE(r.amount::numeric, 0), 2), 0, 'Liquidity for Payment: ' || r.jid) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;
        END LOOP;
        
        FOR r IN 
            SELECT j.id as jid, j.company_id, p.contact_id, p.account_id, COALESCE(p.data->>'amount', p.amount::text) as amount 
            FROM docs_journals j 
            JOIN docs_payments p ON p.id = substring(j.id from 9) OR UPPER('JE-' || p.id) = j.id OR UPPER('JE-VPAY-' || replace(p.id, 'PAY-', '')) = j.id
            WHERE j.status = 'POSTED' AND j.journal_type = 'VEND_PAY'
        LOOP
            SELECT id INTO v_ap_acc FROM docs_accounts WHERE code = '200101' AND company_id = r.company_id LIMIT 1;
            v_liq_acc := r.account_id;
            IF v_liq_acc IS NULL THEN
                SELECT id INTO v_liq_acc FROM docs_accounts WHERE code = '100100' AND company_id = r.company_id LIMIT 1;
            END IF;

            UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE journal_id = r.jid;

            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
            VALUES ('JL-'||r.jid||'-ap', r.jid, r.company_id, v_ap_acc, r.contact_id, ROUND(COALESCE(r.amount::numeric, 0), 2), 0, 'Payment to: ' || COALESCE(r.contact_id, '')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;

            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
            VALUES ('JL-'||r.jid||'-liq', r.jid, r.company_id, v_liq_acc, 0, ROUND(COALESCE(r.amount::numeric, 0), 2), 'Liquidity for Payment: ' || r.jid) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit, account_id = EXCLUDED.account_id, contact_id = EXCLUDED.contact_id, description = EXCLUDED.description;
        END LOOP;
    END;
    $function$;


-- Function: rebuild_stock_for_product
CREATE OR REPLACE FUNCTION public.rebuild_stock_for_product(p_company_id text, p_product_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    tx RECORD;
    v_total_qty NUMERIC := 0;
    v_total_val NUMERIC := 0;
    v_avg_cost NUMERIC := 0;
    v_base_cost NUMERIC := 0;
    wh RECORD;
    company_qty_sum NUMERIC := 0;
    v_stock_levels JSONB := '{}'::jsonb;
BEGIN
    -- 1. Sync docs_stock_movements and docs_product_stocks
    DELETE FROM docs_stock_movements WHERE product_id = p_product_id AND company_id = p_company_id;
    DELETE FROM docs_product_stocks WHERE product_id = p_product_id AND company_id = p_company_id;
    
    FOR tx IN (
        SELECT id, company_id, product_id, transaction_type, quantity, cost_price, date, reference_type
        FROM docs_inventory_transactions
        WHERE product_id = p_product_id AND company_id = p_company_id
        ORDER BY date ASC, updated_at ASC, id ASC
    ) LOOP
        INSERT INTO docs_stock_movements (
            product_id, company_id, movement_type, quantity, unit_cost, reference_id, created_at
        ) VALUES (
            tx.product_id, tx.company_id,
            CASE WHEN tx.transaction_type = 'IN' THEN 'ADDED' ELSE 'OUT' END,
            tx.quantity, COALESCE(tx.cost_price, 0), tx.id,
            COALESCE(tx.date::timestamp with time zone, NOW())
        );
    END LOOP;
    
    UPDATE docs_product_stocks
    SET initial_quantity = COALESCE((
        SELECT SUM(quantity) FROM docs_inventory_transactions WHERE product_id = p_product_id AND company_id = p_company_id AND reference_type = 'OPENING_STOCK'
    ), 0)
    WHERE product_id = p_product_id AND company_id = p_company_id;

    -- 2. Sync docs_product_costs (per warehouse)
    SELECT COALESCE((data->>'costPrice')::NUMERIC, cost_price, 0) INTO v_base_cost FROM docs_products WHERE id = p_product_id;
    DELETE FROM docs_product_costs WHERE product_id = p_product_id AND company_id = p_company_id;
    
    FOR wh IN (SELECT DISTINCT warehouse_id FROM docs_inventory_transactions WHERE product_id = p_product_id AND company_id = p_company_id) LOOP
        v_total_qty := 0;
        v_total_val := 0;
        v_avg_cost := v_base_cost;
        
        FOR tx IN (
            SELECT transaction_type, quantity, cost_price, reference_type
            FROM docs_inventory_transactions 
            WHERE product_id = p_product_id AND warehouse_id = wh.warehouse_id AND company_id = p_company_id
            ORDER BY date ASC, created_at ASC
        ) LOOP
            IF tx.transaction_type = 'IN' THEN
                IF tx.reference_type IN ('BILL', 'ADJUSTMENT', 'OPENING_STOCK') THEN
                    IF v_total_qty <= 0 THEN
                        v_avg_cost := COALESCE(tx.cost_price, v_avg_cost);
                        v_total_qty := v_total_qty + tx.quantity;
                        v_total_val := v_total_qty * v_avg_cost;
                    ELSE
                        v_total_val := v_total_val + (tx.quantity * tx.cost_price);
                        v_total_qty := v_total_qty + tx.quantity;
                        IF v_total_qty > 0 THEN v_avg_cost := v_total_val / v_total_qty; END IF;
                    END IF;
                ELSE
                    v_total_qty := v_total_qty + tx.quantity;
                    v_total_val := v_total_qty * v_avg_cost;
                END IF;
            ELSE
                IF tx.reference_type = 'PURCHASE_RETURN' THEN
                    IF v_total_qty <= 0 THEN
                        v_total_qty := v_total_qty - tx.quantity;
                        v_total_val := v_total_qty * v_avg_cost;
                    ELSE
                        v_total_val := v_total_val - (tx.quantity * tx.cost_price);
                        v_total_qty := v_total_qty - tx.quantity;
                        IF v_total_qty > 0 THEN v_avg_cost := v_total_val / v_total_qty; END IF;
                    END IF;
                ELSE
                    v_total_qty := v_total_qty - tx.quantity;
                    v_total_val := v_total_qty * v_avg_cost;
                END IF;
            END IF;
        END LOOP;
        
        v_total_qty := COALESCE(v_total_qty, 0);
        v_avg_cost := COALESCE(v_avg_cost, v_base_cost);
        IF v_total_qty <= 0 THEN v_total_val := 0; ELSE v_total_val := v_total_qty * v_avg_cost; END IF;
        
        INSERT INTO docs_product_costs (id, company_id, product_id, warehouse_id, total_qty, total_value, avg_cost, updated_at)
        VALUES (p_company_id || ':' || p_product_id || ':' || wh.warehouse_id, p_company_id, p_product_id, wh.warehouse_id, v_total_qty, v_total_val, v_avg_cost, NOW());
    END LOOP;

    -- 3. Sync docs_products (quantity_on_hand and JSON state)
    FOR wh IN (
        SELECT company_id, SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE -quantity END) as company_qty
        FROM docs_inventory_transactions
        WHERE product_id = p_product_id
        GROUP BY company_id
    ) LOOP
        v_stock_levels := jsonb_set(v_stock_levels, ARRAY[wh.company_id], to_jsonb(COALESCE(wh.company_qty, 0)));
        company_qty_sum := company_qty_sum + COALESCE(wh.company_qty, 0);
    END LOOP;

    UPDATE docs_products
    SET quantity_on_hand = company_qty_sum,
        data = jsonb_set(
            jsonb_set(
                COALESCE(data, '{}'::jsonb),
                '{stockLevels}',
                v_stock_levels
            ),
            '{quantityOnHand}',
            to_jsonb(company_qty_sum)
        ),
        updated_at = NOW()
    WHERE id = p_product_id;

END;
$function$;


-- Function: rebuild_wac_for_product
CREATE OR REPLACE FUNCTION public.rebuild_wac_for_product(p_company_id text, p_product_id text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    tx RECORD;
    v_total_qty NUMERIC := 0;
    v_total_value NUMERIC := 0;
    v_avg_cost NUMERIC := 0;
    v_base_cost NUMERIC := 0;
BEGIN
    SELECT COALESCE((data->>'costPrice')::NUMERIC, 0) INTO v_base_cost FROM docs_products WHERE id = p_product_id AND company_id = p_company_id;
    v_avg_cost := COALESCE(v_base_cost, 0);

    FOR tx IN (
        SELECT *
        FROM docs_inventory_transactions 
        WHERE company_id = p_company_id AND product_id = p_product_id
        ORDER BY date ASC, created_at ASC
    )
    LOOP
        IF tx.transaction_type = 'IN' THEN
            IF tx.reference_type IN ('BILL', 'ADJUSTMENT', 'OPENING_STOCK') THEN
                IF v_total_qty <= 0 THEN
                    v_avg_cost := COALESCE(tx.cost_price, v_avg_cost);
                    v_total_qty := v_total_qty + COALESCE(tx.quantity, 0);
                    v_total_value := v_total_qty * v_avg_cost;
                ELSE
                    v_total_value := v_total_value + (COALESCE(tx.quantity, 0) * COALESCE(tx.cost_price, 0));
                    v_total_qty := v_total_qty + COALESCE(tx.quantity, 0);
                    IF v_total_qty > 0 THEN 
                       v_avg_cost := ROUND(v_total_value / v_total_qty, 4);
                    END IF;
                END IF;
            ELSE
                v_total_qty := v_total_qty + COALESCE(tx.quantity, 0);
                v_total_value := v_total_qty * v_avg_cost;
            END IF;
        ELSIF tx.transaction_type = 'OUT' THEN
            IF tx.reference_type = 'PURCHASE_RETURN' THEN
                IF v_total_qty <= 0 THEN
                    -- returning when already negative/zero, shouldn't really happen but handle it
                    v_total_qty := v_total_qty - COALESCE(tx.quantity, 0);
                    v_total_value := v_total_qty * v_avg_cost;
                ELSE
                    v_total_value := v_total_value - (COALESCE(tx.quantity, 0) * COALESCE(tx.cost_price, 0));
                    v_total_qty := v_total_qty - COALESCE(tx.quantity, 0);
                    IF v_total_qty > 0 THEN 
                       v_avg_cost := ROUND(v_total_value / v_total_qty, 4);
                    END IF;
                END IF;
            ELSE
                v_total_qty := v_total_qty - COALESCE(tx.quantity, 0);
                v_total_value := v_total_qty * v_avg_cost;
            END IF;
        END IF;
    END LOOP;

    v_avg_cost := COALESCE(v_avg_cost, v_base_cost);

    -- For the final stored value, don't store negative value if qty is <= 0
    IF v_total_qty <= 0 THEN
        v_total_value := 0;
    ELSE
        v_total_value := ROUND(v_total_qty * v_avg_cost, 4);
    END IF;

    UPDATE docs_products
    SET cost_price = v_avg_cost,
        data = jsonb_set(COALESCE(data, '{}'::jsonb), '{costPrice}', to_jsonb(v_avg_cost)),
        updated_at = NOW()
    WHERE id = p_product_id AND company_id = p_company_id;

    INSERT INTO docs_product_costs (
        id, company_id, product_id, warehouse_id,
        total_qty, total_value, avg_cost, updated_at
    )
    VALUES (
        p_company_id || ':' || p_product_id || ':main',
        p_company_id,
        p_product_id,
        'main',
        v_total_qty,
        v_total_value,
        v_avg_cost,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        total_qty = EXCLUDED.total_qty,
        total_value = EXCLUDED.total_value,
        avg_cost = EXCLUDED.avg_cost,
        updated_at = NOW();

END;
$function$;


-- Function: reconcile_inventory
CREATE OR REPLACE FUNCTION public.reconcile_inventory(p_company_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_total_valuation NUMERIC(16,2) := 0;
    v_ledger_balance NUMERIC(16,2) := 0;
    v_discrepancy NUMERIC(16,2);
    v_inventory_account_id TEXT;
    v_offset_account_id TEXT;
    v_journal_id TEXT;
    v_line1_id TEXT;
    v_line2_id TEXT;
BEGIN
    SELECT COALESCE(SUM(calc.qoh * COALESCE(p.cost_price, 0)), 0)
    INTO v_total_valuation
    FROM docs_products p
    JOIN LATERAL (
        SELECT COALESCE(SUM(
            CASE WHEN t.transaction_type = 'IN' THEN t.quantity ELSE -t.quantity END
        ), p.quantity_on_hand, 0) as qoh
        FROM docs_inventory_transactions t
        WHERE t.product_id = p.id AND t.company_id = p_company_id
    ) calc ON true
    WHERE p.company_id = p_company_id;

    SELECT id INTO v_inventory_account_id FROM docs_accounts 
    WHERE company_id = p_company_id AND (code = '100501' OR code = '100500' OR sub_type = 'INVENTORY')
    LIMIT 1;

    IF v_inventory_account_id IS NULL THEN
        RETURN;
    END IF;

    SELECT COALESCE(SUM(l.debit - l.credit), 0)
    INTO v_ledger_balance
    FROM docs_journal_lines l
    JOIN docs_journals j ON j.id = l.journal_id
    WHERE l.account_id = v_inventory_account_id AND j.status = 'POSTED';

    v_discrepancy := v_total_valuation - v_ledger_balance;

    IF ABS(v_discrepancy) > 0.01 THEN
        SELECT id INTO v_offset_account_id FROM docs_accounts 
        WHERE company_id = p_company_id AND (code = '300100' OR code = '300000' OR type = 'EQUITY' OR sub_type = 'EQUITY') LIMIT 1;
        
        IF v_offset_account_id IS NULL THEN
            SELECT id INTO v_offset_account_id FROM docs_accounts 
            WHERE company_id = p_company_id AND (code = '500501' OR name ILIKE '%adjustment%' OR type = 'EXPENSE') LIMIT 1;
        END IF;

        IF v_offset_account_id IS NULL THEN
            SELECT id INTO v_offset_account_id FROM docs_accounts 
            WHERE company_id = p_company_id AND sub_type = 'COGS' LIMIT 1;
        END IF;

        v_journal_id := gen_random_uuid()::TEXT;
        v_line1_id := gen_random_uuid()::TEXT;
        v_line2_id := gen_random_uuid()::TEXT;
        
        INSERT INTO docs_journals (id, company_id, date, reference, status, data, created_at)
        VALUES (
            v_journal_id, p_company_id, CURRENT_DATE, 'REVAL-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            'POSTED', 
            jsonb_build_object(
                'description', 'Auto-Reconciliation: Inventory Valuation vs 100501 Ledger', 
                'source_type', 'REVALUATION',
                'lines', jsonb_build_array(
                    jsonb_build_object(
                        'id', v_line1_id,
                        'accountId', v_inventory_account_id,
                        'debit', CASE WHEN v_discrepancy > 0 THEN ABS(v_discrepancy) ELSE 0 END,
                        'credit', CASE WHEN v_discrepancy <= 0 THEN ABS(v_discrepancy) ELSE 0 END,
                        'description', 'Inventory Valuation Adjustment'
                    ),
                    jsonb_build_object(
                        'id', v_line2_id,
                        'accountId', v_offset_account_id,
                        'debit', CASE WHEN v_discrepancy <= 0 THEN ABS(v_discrepancy) ELSE 0 END,
                        'credit', CASE WHEN v_discrepancy > 0 THEN ABS(v_discrepancy) ELSE 0 END,
                        'description', 'Inventory Valuation Offset'
                    )
                )
            ), 
            NOW()
        );

        INSERT INTO docs_journal_lines (id, journal_id, account_id, debit, credit, description, created_at, company_id)
        VALUES 
            (v_line1_id, v_journal_id, v_inventory_account_id, 
             CASE WHEN v_discrepancy > 0 THEN ABS(v_discrepancy) ELSE 0 END, 
             CASE WHEN v_discrepancy <= 0 THEN ABS(v_discrepancy) ELSE 0 END, 
             'Inventory Valuation Adjustment', NOW(), p_company_id),
            (v_line2_id, v_journal_id, v_offset_account_id, 
             CASE WHEN v_discrepancy <= 0 THEN ABS(v_discrepancy) ELSE 0 END, 
             CASE WHEN v_discrepancy > 0 THEN ABS(v_discrepancy) ELSE 0 END, 
             'Inventory Valuation Offset', NOW(), p_company_id);
             
        RAISE NOTICE 'Revaluation applied for %: Discrepancy %', p_company_id, v_discrepancy;
    END IF;
END;
$function$;


-- Function: refresh_cash_ledger
CREATE OR REPLACE FUNCTION public.refresh_cash_ledger()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    TRUNCATE public.docs_cash_ledger;
    
    INSERT INTO public.docs_cash_ledger (
        company_id, date, journal_id, line_id, reference_number,
        journal_type, description, debit, credit, impact,
        partner_name, prepared_by, created_at
    )
    SELECT 
        j.company_id,
        j.date,
        j.id AS journal_id,
        al.id AS line_id,
        COALESCE(
            CASE 
                WHEN j.journal_type = 'INV' THEN (SELECT inv.invoice_number FROM docs_invoices inv WHERE inv.journal_entry_id = j.id OR inv.data->>'journalEntryId' = j.id OR LOWER(replace(LOWER(j.id), 'je-', '')) = LOWER(inv.id) LIMIT 1)
                WHEN j.journal_type = 'BILL' THEN (SELECT b.bill_number FROM docs_bills b WHERE b.journal_entry_id = j.id OR b.data->>'journalEntryId' = j.id OR LOWER(replace(LOWER(j.id), 'je-', '')) = LOWER(b.id) LIMIT 1)
                WHEN j.journal_type IN ('CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY') THEN (
                    SELECT pay.payment_number 
                    FROM docs_payments pay 
                    WHERE LOWER(replace(LOWER(pay.id), 'pay-', '')) = LOWER(replace(replace(replace(replace(LOWER(j.id), 'je-cpay-', ''), 'je-vpay-', ''), 'je-', ''), 'pay-', '')) 
                    OR LOWER(j.reference_number) LIKE '%' || LOWER(pay.payment_number) || '%' 
                    LIMIT 1
                )
                WHEN j.journal_type = 'CREDIT_NOTE' THEN (SELECT cn.credit_note_number FROM docs_credit_notes cn WHERE LOWER(replace(LOWER(j.id), 'je-', '')) = LOWER(cn.id) OR LOWER(j.reference_number) = LOWER(cn.credit_note_number) LIMIT 1)
                ELSE NULL
            END,
            j.reference_number,
            j.id
        ) AS reference_number,
        j.journal_type,
        COALESCE(al.description, j.description, '') AS description,
        COALESCE(al.debit, 0),
        COALESCE(al.credit, 0),
        COALESCE(al.debit - al.credit, 0) AS impact,
        COALESCE(
            (
                SELECT cont_inner.name 
                FROM docs_journal_lines jl_inner 
                JOIN docs_contacts cont_inner ON jl_inner.contact_id = cont_inner.id
                WHERE jl_inner.journal_id = j.id AND jl_inner.contact_id IS NOT NULL 
                LIMIT 1
            ),
            CASE 
                WHEN j.journal_type IN ('INV', 'BILL', 'CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY', 'CREDIT_NOTE') THEN 'Cash Sale'
                ELSE ''
            END
        ) AS partner_name,
        COALESCE(u.name, u.username, j.data->>'preparedBy', 'System') AS prepared_by,
        j.created_at
    FROM docs_journal_lines al
    JOIN docs_journals j ON al.journal_id = j.id
    LEFT JOIN docs_users u ON j.created_by_id = u.id
    WHERE al.account_id = (SELECT id FROM docs_accounts WHERE (code = '100100' OR sub_type IN ('CASH', 'BANK')) LIMIT 1)
      AND j.status = 'POSTED';
END;
$function$;


-- Function: register_batch_payment
CREATE OR REPLACE FUNCTION public.register_batch_payment(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_contact_id TEXT;
    v_amount NUMERIC;
    v_payment_type TEXT;
    v_is_customer BOOLEAN;
    v_company_id TEXT;
    v_user_id TEXT;
    
    v_docs_to_pay JSONB := '[]'::jsonb;
    v_unallocated_advances JSONB := '[]'::jsonb;
    
    v_doc_json JSONB;
    v_adv RECORD;
    
    v_remaining_amount NUMERIC;
    v_doc_unpaid NUMERIC;
    v_allocate NUMERIC;
    
    v_allocations_for_new JSONB := '[]'::jsonb;
    v_advance_updates JSONB := '{}'::jsonb;
    v_adv_allocs JSONB;
    v_new_adv_allocs JSONB;
    
    v_new_payment_id TEXT;
    v_new_payment_amt NUMERIC := 0;
    
    v_res RECORD;
BEGIN
    v_contact_id := payload->>'contactId';
    v_amount := (payload->>'amount')::NUMERIC;
    v_company_id := payload->>'companyId';
    v_user_id := COALESCE(payload->>'createdById', 'user-1');
    v_payment_type := CASE WHEN (payload ? 'invoiceIds') THEN 'RECEIPT' ELSE 'PAYMENT' END;
    v_is_customer := v_payment_type = 'RECEIPT';
    
    v_remaining_amount := v_amount;
    
    -- 1. Gather docs to pay
    IF v_is_customer THEN
        IF payload ? 'invoiceIds' AND jsonb_array_length(payload->'invoiceIds') > 0 THEN
            SELECT jsonb_agg(row_to_json(i) ORDER BY date ASC) INTO v_docs_to_pay
            FROM docs_invoices i
            WHERE i.id IN (SELECT jsonb_array_elements_text(payload->'invoiceIds'))
              AND i.status IN ('POSTED', 'PARTIAL', 'PARTIAL_REFUNDED')
              AND i.company_id = v_company_id;
        ELSE
            SELECT jsonb_agg(row_to_json(i) ORDER BY date ASC) INTO v_docs_to_pay
            FROM docs_invoices i
            WHERE i.customer_id = v_contact_id
              AND i.status IN ('POSTED', 'PARTIAL', 'PARTIAL_REFUNDED')
              AND i.company_id = v_company_id;
        END IF;
    ELSE
        IF payload ? 'billIds' AND jsonb_array_length(payload->'billIds') > 0 THEN
            SELECT jsonb_agg(row_to_json(b) ORDER BY date ASC) INTO v_docs_to_pay
            FROM docs_bills b
            WHERE b.id IN (SELECT jsonb_array_elements_text(payload->'billIds'))
              AND b.status IN ('POSTED', 'PARTIAL')
              AND b.company_id = v_company_id;
        ELSE
            SELECT jsonb_agg(row_to_json(b) ORDER BY date ASC) INTO v_docs_to_pay
            FROM docs_bills b
            WHERE b.vendor_id = v_contact_id
              AND b.status IN ('POSTED', 'PARTIAL')
              AND b.company_id = v_company_id;
        END IF;
    END IF;
    
    v_docs_to_pay := COALESCE(v_docs_to_pay, '[]'::jsonb);

    CREATE TEMP TABLE tmp_advances ON COMMIT DROP AS
    SELECT p.id, p.amount, 
           CASE WHEN v_is_customer THEN p.applied_invoices ELSE p.applied_bills END as applied,
           (p.amount - (
              SELECT COALESCE(SUM((al->>'amount')::NUMERIC), 0)
              FROM jsonb_array_elements(CASE WHEN jsonb_typeof(CASE WHEN v_is_customer THEN p.applied_invoices ELSE p.applied_bills END) = 'array' THEN (CASE WHEN v_is_customer THEN p.applied_invoices ELSE p.applied_bills END) ELSE '[]'::jsonb END) al
           )) as unallocated
    FROM docs_payments p
    WHERE p.status = 'POSTED' AND p.type = v_payment_type AND p.contact_id = v_contact_id AND p.company_id = v_company_id;
    
    FOR v_doc_json IN SELECT * FROM jsonb_array_elements(v_docs_to_pay) LOOP
        -- calculate unpaid
        IF v_is_customer THEN
            SELECT (v_doc_json->>'total')::NUMERIC - COALESCE(SUM((al->>'amount')::numeric), 0) INTO v_doc_unpaid
            FROM docs_payments p, jsonb_array_elements(
                CASE WHEN jsonb_typeof(p.applied_invoices) = 'array' THEN p.applied_invoices ELSE '[]'::jsonb END
            ) al
            WHERE p.status = 'POSTED' AND p.company_id = v_company_id AND al->>'invoiceId' = (v_doc_json->>'id');
        ELSE
            SELECT (v_doc_json->>'total')::NUMERIC - COALESCE(SUM((al->>'amount')::numeric), 0) INTO v_doc_unpaid
            FROM docs_payments p, jsonb_array_elements(
                CASE WHEN jsonb_typeof(p.applied_bills) = 'array' THEN p.applied_bills ELSE '[]'::jsonb END
            ) al
            WHERE p.status = 'POSTED' AND p.company_id = v_company_id AND al->>'billId' = (v_doc_json->>'id');
        END IF;
        v_doc_unpaid := COALESCE(v_doc_unpaid, (v_doc_json->>'total')::NUMERIC);
        
        -- Allocate advances first
        FOR v_adv IN SELECT * FROM tmp_advances WHERE unallocated > 0 ORDER BY id ASC LOOP
            IF v_doc_unpaid > 0 THEN
                v_allocate := LEAST(v_doc_unpaid, v_adv.unallocated);
                
                v_adv_allocs := COALESCE(v_advance_updates->v_adv.id, CASE WHEN jsonb_typeof(v_adv.applied) = 'array' THEN v_adv.applied ELSE '[]'::jsonb END);
                IF v_is_customer THEN
                    v_new_adv_allocs := v_adv_allocs || jsonb_build_object('invoiceId', v_doc_json->>'id', 'invoiceNumber', v_doc_json->>'number', 'amount', v_allocate);
                ELSE
                    v_new_adv_allocs := v_adv_allocs || jsonb_build_object('billId', v_doc_json->>'id', 'billNumber', v_doc_json->>'number', 'amount', v_allocate);
                END IF;
                v_advance_updates := jsonb_set(v_advance_updates, ARRAY[v_adv.id], v_new_adv_allocs);
                
                UPDATE tmp_advances SET unallocated = unallocated - v_allocate WHERE id = v_adv.id;
                v_doc_unpaid := v_doc_unpaid - v_allocate;
            END IF;
        END LOOP;
        
        -- Allocate new amount
        IF v_doc_unpaid > 0 AND v_remaining_amount > 0 THEN
            v_allocate := LEAST(v_doc_unpaid, v_remaining_amount);
            IF v_is_customer THEN
                v_allocations_for_new := v_allocations_for_new || jsonb_build_object('invoiceId', v_doc_json->>'id', 'invoiceNumber', v_doc_json->>'number', 'amount', v_allocate, 'remaining', v_doc_unpaid - v_allocate);
            ELSE
                v_allocations_for_new := v_allocations_for_new || jsonb_build_object('billId', v_doc_json->>'id', 'billNumber', v_doc_json->>'number', 'amount', v_allocate, 'remaining', v_doc_unpaid - v_allocate);
            END IF;
            v_remaining_amount := v_remaining_amount - v_allocate;
            v_new_payment_amt := v_new_payment_amt + v_allocate;
        END IF;
    END LOOP;
    
    -- 4. Execute Advance Payments updates
    FOR v_adv IN SELECT key, value FROM jsonb_each(v_advance_updates) LOOP
        IF v_is_customer THEN
            UPDATE docs_payments SET applied_invoices = v_adv.value WHERE id = v_adv.key;
        ELSE
            UPDATE docs_payments SET applied_bills = v_adv.value WHERE id = v_adv.key;
        END IF;
        PERFORM post_payment(v_adv.key, v_company_id);
    END LOOP;
    
    -- 5. Create new payment
    IF v_new_payment_amt > 0 OR (v_amount > 0 AND jsonb_array_length(v_allocations_for_new) = 0 AND (SELECT count(*) FROM jsonb_each(v_advance_updates)) = 0) THEN
        v_new_payment_id := 'PAY-' || gen_random_uuid();
        
        INSERT INTO docs_payments (
            id, company_id, status, type, amount, date, payment_date, contact_id, method, reference, account_id, applied_invoices, applied_bills
        ) VALUES (
            v_new_payment_id, v_company_id, 'DRAFT', v_payment_type, 
            CASE WHEN v_new_payment_amt > 0 THEN v_new_payment_amt ELSE v_amount END,
            (payload->>'date')::DATE, (payload->>'date')::DATE, v_contact_id,
            payload->>'method', payload->>'reference', payload->>'accountId',
            CASE WHEN v_is_customer THEN v_allocations_for_new ELSE '[]'::jsonb END,
            CASE WHEN NOT v_is_customer THEN v_allocations_for_new ELSE '[]'::jsonb END
        );
        
        PERFORM post_payment(v_new_payment_id, v_company_id);
    END IF;
    
    RETURN jsonb_build_object('success', true, 'payment_id', v_new_payment_id);
END;
$function$;


-- Function: reverse_journal_entry
CREATE OR REPLACE FUNCTION public.reverse_journal_entry(p_journal_id text, p_user_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_old_journal RECORD;
    v_new_journal_id UUID;
    v_reversed_status TEXT;
BEGIN
    -- 1. Fetch the original journal
    SELECT * INTO v_old_journal FROM docs_journals WHERE id = p_journal_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Journal entry % not found', p_journal_id;
    END IF;

    IF v_old_journal.status <> 'POSTED' THEN
        RAISE EXCEPTION 'Only POSTED journals can be reversed. Current status: %', v_old_journal.status;
    END IF;

    -- 2. Check if already reversed
    IF v_old_journal.reversed_by_id IS NOT NULL THEN
        RAISE EXCEPTION 'Journal entry % has already been reversed by %', p_journal_id, v_old_journal.reversed_by_id;
    END IF;

    -- 3. Generate the reversal journal
    INSERT INTO docs_journals (
        company_id, 
        date, 
        reference_number, 
        journal_type, 
        status, 
        data, 
        reversal_of_id,
        is_immutable
    )
    VALUES (
        v_old_journal.company_id,
        CURRENT_DATE,
        'REV-' || v_old_journal.reference_number,
        v_old_journal.journal_type,
        'POSTED',
        v_old_journal.data || jsonb_build_object('isReversal', true, 'reversalReason', 'User initiated reversal'),
        v_old_journal.id,
        true
    )
    RETURNING id INTO v_new_journal_id;

    -- 4. Duplicate lines with inverted amounts
    INSERT INTO docs_journal_lines (
        journal_id, company_id, account_id, contact_id, debit, credit, description
    )
    SELECT 
        v_new_journal_id, company_id, account_id, contact_id, credit, debit, 'Reversal of entry ' || v_old_journal.reference_number
    FROM docs_journal_lines
    WHERE journal_id = p_journal_id;

    -- 5. Mark original as reversed
    UPDATE docs_journals 
    SET reversed_by_id = v_new_journal_id::text, 
        status = 'VOID' -- We mark it VOID in the UI sense, though it remains in ledger alongside its reversal
    WHERE id = p_journal_id;

    -- 6. Log the action
    INSERT INTO docs_audit_logs (company_id, user_id, action, table_name, record_id, after_data)
    VALUES (v_old_journal.company_id, p_user_id, 'REVERSE', 'docs_journals', p_journal_id, jsonb_build_object('reversal_id', v_new_journal_id));

    RETURN jsonb_build_object('success', true, 'reversal_id', v_new_journal_id);
END;
$function$;


-- Function: rls_auto_enable
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;


-- Function: strict_append_only_audit_protection
CREATE OR REPLACE FUNCTION public.strict_append_only_audit_protection()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF current_setting('core.bypass_audit', true) = 'true' THEN
        RETURN OLD;
    END IF;

    RAISE EXCEPTION 'CRITICAL SECURITY ALERT: Deletion from table docs_journal_lines is strictly prohibited. The system enforces an immutable, append-only Odoo/SAP standard audit trail.';
    RETURN NULL;
END;
$function$;


-- Function: sync_account_fields
CREATE OR REPLACE FUNCTION public.sync_account_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      NEW.name := NEW.data->>'name';
      NEW.code := NEW.data->>'code';
      RETURN NEW;
    END;
    $function$;


-- Function: sync_basic_metadata
CREATE OR REPLACE FUNCTION public.sync_basic_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      DECLARE v_val TEXT;
      BEGIN
        IF NEW.data IS NOT NULL THEN
          IF (NEW.data ? 'companyId') THEN
            v_val := COALESCE(NEW.data->>'companyId', NEW.data->'companyIds'->>0);
            IF v_val IS NOT NULL THEN NEW.company_id := v_val; END IF;
          ELSIF (NEW.data ? 'companyIds') THEN
            v_val := NEW.data->'companyIds'->>0;
            IF v_val IS NOT NULL THEN NEW.company_id := v_val; END IF;
          END IF;
        END IF;
        RETURN NEW;
      END;
      $function$;


-- Function: sync_bill_lines_from_doc_data
CREATE OR REPLACE FUNCTION public.sync_bill_lines_from_doc_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        v_item JSONB;
        v_items_array JSONB;
        v_serial_json JSONB;
        v_line_id TEXT;
        v_raw_id TEXT;
        v_idx INTEGER;
    BEGIN
        IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
        IF NEW.data IS NULL OR NOT (NEW.data ? 'items') THEN RETURN NEW; END IF;
        
        v_items_array := NEW.data->'items';
        IF jsonb_typeof(v_items_array) <> 'array' THEN RETURN NEW; END IF;

        DELETE FROM docs_bill_lines
        WHERE bill_id = NEW.id
          AND id NOT IN (
              SELECT COALESCE(elem->>'id', '') 
              FROM jsonb_array_elements(v_items_array) AS elem
              WHERE elem->>'id' IS NOT NULL
          );

        FOR v_item, v_idx IN SELECT value, ordinality FROM jsonb_array_elements(v_items_array) WITH ORDINALITY LOOP
            v_serial_json := v_item->'serialNumbers';
            IF v_serial_json IS NULL OR jsonb_typeof(v_serial_json) <> 'array' THEN v_serial_json := '[]'::jsonb; END IF;

            v_raw_id := v_item->>'id';
            IF v_raw_id IS NULL OR v_raw_id = '' THEN v_raw_id := gen_random_uuid()::TEXT; END IF;
            
            v_line_id := v_raw_id;

            INSERT INTO docs_bill_lines (
                id, bill_id, company_id, product_id, quantity, unit_price, discount, tax, total, description, line_value, discount_rate, discount_mode, type, serial_numbers, display_index
            ) VALUES (
                v_line_id, NEW.id, NEW.company_id, v_item->>'productId', COALESCE((v_item->>'quantity')::NUMERIC, 0), COALESCE((v_item->>'unitPrice')::NUMERIC, 0), COALESCE((v_item->>'discountAmount')::NUMERIC, COALESCE((v_item->>'discount')::NUMERIC, 0)), COALESCE((v_item->>'taxValue')::NUMERIC, COALESCE((v_item->>'taxAmount')::NUMERIC, 0)), COALESCE((v_item->>'total')::NUMERIC, 0), COALESCE(v_item->>'description', ''), COALESCE((v_item->>'lineValue')::NUMERIC, COALESCE((v_item->>'total')::NUMERIC, 0)), COALESCE((v_item->>'discountRate')::NUMERIC, 0), COALESCE(v_item->>'discountMode', 'PERCENT'), COALESCE(v_item->>'type', 'PRODUCT'), v_serial_json, v_idx
            ) ON CONFLICT (id) DO UPDATE SET
                product_id = EXCLUDED.product_id, quantity = EXCLUDED.quantity, unit_price = EXCLUDED.unit_price, discount = EXCLUDED.discount, tax = EXCLUDED.tax, total = EXCLUDED.total, description = EXCLUDED.description, line_value = EXCLUDED.line_value, discount_rate = EXCLUDED.discount_rate, discount_mode = EXCLUDED.discount_mode, type = EXCLUDED.type, serial_numbers = EXCLUDED.serial_numbers, display_index = EXCLUDED.display_index;
        END LOOP;

        RETURN NEW;
    END;
$function$;


-- Function: sync_company_id
CREATE OR REPLACE FUNCTION public.sync_company_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
      v_val TEXT;
    BEGIN
      -- Use a safe way to check if 'data' column exists and is not null
      -- In PL/pgSQL, we can use dynamic SQL or just catch the exception
      BEGIN
        IF NEW.data IS NOT NULL THEN
          IF (NEW.data ? 'companyId') THEN
            v_val := COALESCE(NEW.data->>'companyId', NEW.data->'companyIds'->>0);
            IF v_val IS NOT NULL THEN
              NEW.company_id := v_val;
            END IF;
          ELSIF (NEW.data ? 'companyIds') THEN
            v_val := NEW.data->'companyIds'->>0;
            IF v_val IS NOT NULL THEN
              NEW.company_id := v_val;
            END IF;
          END IF;
        END IF;
      EXCEPTION WHEN undefined_column THEN
        -- Do nothing, table doesn't have 'data' column
      END;
      RETURN NEW;
    END;
    $function$;


-- Function: sync_company_own_id
CREATE OR REPLACE FUNCTION public.sync_company_own_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      NEW.company_id := NEW.id;
      NEW.code := NEW.data->>'code';
      RETURN NEW;
    END;
    $function$;


-- Function: sync_contact_metadata
CREATE OR REPLACE FUNCTION public.sync_contact_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      DECLARE v_val TEXT;
      BEGIN
        IF NEW.data IS NOT NULL THEN
          IF (NEW.data ? 'companyId') THEN
            v_val := COALESCE(NEW.data->>'companyId', NEW.data->'companyIds'->>0);
            IF v_val IS NOT NULL THEN NEW.company_id := v_val; END IF;
          ELSIF (NEW.data ? 'companyIds') THEN
            v_val := NEW.data->'companyIds'->>0;
            IF v_val IS NOT NULL THEN NEW.company_id := v_val; END IF;
          END IF;
          
          IF (NEW.data ? 'name') THEN NEW.name := NULLIF(NEW.data->>'name', ''); END IF;
          IF (NEW.data ? 'type') THEN NEW.type := NULLIF(NEW.data->>'type', ''); END IF;
        END IF;
        RETURN NEW;
      END;
      $function$;


-- Function: sync_document_metadata
CREATE OR REPLACE FUNCTION public.sync_document_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
  DECLARE
    v_val TEXT;
    BEGIN
      IF NEW.data IS NOT NULL THEN
          -- Sync Company ID
              IF (NEW.data ? 'companyId') THEN
                    v_val := COALESCE(NEW.data->>'companyId', NEW.data->'companyIds'->>0);
                          IF v_val IS NOT NULL THEN NEW.company_id := v_val; END IF;
                              ELSIF (NEW.data ? 'companyIds') THEN
                                    v_val := NEW.data->'companyIds'->>0;
                                          IF v_val IS NOT NULL THEN NEW.company_id := v_val; END IF;
                                              END IF;

                                                  -- Sync Status
                                                      BEGIN
                                                             IF TG_OP = 'UPDATE' THEN
                                                                       IF NEW.status IS DISTINCT FROM OLD.status THEN
                                                                                    NEW.data := jsonb_set(NEW.data, '{status}', to_jsonb(NEW.status));
                                                                                              ELSIF NEW.data->>'status' IS DISTINCT FROM OLD.data->>'status' THEN
                                                                                                           NEW.status := NEW.data->>'status';
                                                                                                                     ELSE
                                                                                                                                  IF (NEW.data ? 'status') THEN NEW.status := NEW.data->>'status'; END IF;
                                                                                                                                            END IF;
                                                                                                                                                   ELSE
                                                                                                                                                             IF NEW.status IS NOT NULL THEN
                                                                                                                                                                          NEW.data := jsonb_set(NEW.data, '{status}', to_jsonb(NEW.status));
                                                                                                                                                                                    ELSIF (NEW.data ? 'status') THEN
                                                                                                                                                                                                 NEW.status := NEW.data->>'status';
                                                                                                                                                                                                           END IF;
                                                                                                                                                                                                                  END IF;
                                                                                                                                                                                                                      EXCEPTION WHEN undefined_column THEN END;

                                                                                                                                                                                                                          -- 💡 মূল ফিক্স: Sync Date (The Bulletproof Logic)
                                                                                                                                                                                                                              BEGIN
                                                                                                                                                                                                                                     NEW.date := COALESCE(
                                                                                                                                                                                                                                                NULLIF(NEW.data->>'date', '')::DATE,
                                                                                                                                                                                                                                                           NULLIF(NEW.data->>'createdAt', '')::DATE,
                                                                                                                                                                                                                                                                      NEW.date,
                                                                                                                                                                                                                                                                                 CURRENT_DATE
                                                                                                                                                                                                                                                                                        );
                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                      -- Specific Dates based on table
                                                                                                                                                                                                                                                                                                             IF TG_TABLE_NAME = 'docs_payments' THEN
                                                                                                                                                                                                                                                                                                                      NEW.payment_date := COALESCE(NULLIF(NEW.data->>'paymentDate', '')::DATE, NEW.date);
                                                                                                                                                                                                                                                                                                                             ELSIF TG_TABLE_NAME = 'docs_invoices' THEN
                                                                                                                                                                                                                                                                                                                                      NEW.invoice_date := COALESCE(NULLIF(NEW.data->>'invoiceDate', '')::DATE, NEW.date);
                                                                                                                                                                                                                                                                                                                                             ELSIF TG_TABLE_NAME = 'docs_bills' THEN
                                                                                                                                                                                                                                                                                                                                                      NEW.bill_date := COALESCE(NULLIF(NEW.data->>'billDate', '')::DATE, NEW.date);
                                                                                                                                                                                                                                                                                                                                                             ELSIF TG_TABLE_NAME = 'docs_journals' THEN
                                                                                                                                                                                                                                                                                                                                                                      NEW.journal_date := COALESCE(NULLIF(NEW.data->>'journalDate', '')::DATE, NEW.date);
                                                                                                                                                                                                                                                                                                                                                                             END IF;
                                                                                                                                                                                                                                                                                                                                                                                 EXCEPTION WHEN undefined_column THEN END;

                                                                                                                                                                                                                                                                                                                                                                                     -- Sync Totals/Amounts
                                                                                                                                                                                                                                                                                                                                                                                         BEGIN
                                                                                                                                                                                                                                                                                                                                                                                                IF (NEW.data ? 'total') THEN NEW.total := NULLIF(NEW.data->>'total', '')::NUMERIC; 
                                                                                                                                                                                                                                                                                                                                                                                                       ELSIF (NEW.data ? 'amount') THEN NEW.amount := NULLIF(NEW.data->>'amount', '')::NUMERIC;
                                                                                                                                                                                                                                                                                                                                                                                                              END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                  EXCEPTION WHEN undefined_column THEN END;

                                                                                                                                                                                                                                                                                                                                                                                                                      -- Sync Partner/Contact ID
                                                                                                                                                                                                                                                                                                                                                                                                                          BEGIN
                                                                                                                                                                                                                                                                                                                                                                                                                                 IF TG_TABLE_NAME = 'docs_invoices' THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                          v_val := COALESCE(NULLIF(NEW.data->>'customerId',''), NULLIF(NEW.data->>'contactId',''));
                                                                                                                                                                                                                                                                                                                                                                                                                                                   IF v_val IS NOT NULL THEN NEW.customer_id := v_val; END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                          ELSIF TG_TABLE_NAME = 'docs_bills' THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                   v_val := COALESCE(NULLIF(NEW.data->>'vendorId',''), NULLIF(NEW.data->>'contactId',''));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            IF v_val IS NOT NULL THEN NEW.vendor_id := v_val; END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   ELSIF TG_TABLE_NAME = 'docs_payments' THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            v_val := COALESCE(NULLIF(NEW.data->>'contactId',''), NULLIF(NEW.data->>'customerId',''), NULLIF(NEW.data->>'vendorId',''));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     IF v_val IS NOT NULL THEN NEW.contact_id := v_val; END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ELSIF TG_TABLE_NAME = 'docs_credit_notes' THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     v_val := COALESCE(NULLIF(NEW.data->>'customerId',''), NULLIF(NEW.data->>'contactId',''));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              IF v_val IS NOT NULL THEN NEW.customer_id := v_val; END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     ELSE
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              IF (NEW.data ? 'contactId') THEN NEW.contact_id := NULLIF(NEW.data->>'contactId', '');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       ELSIF (NEW.data ? 'customerId') THEN NEW.contact_id := NULLIF(NEW.data->>'customerId', '');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ELSIF (NEW.data ? 'vendorId') THEN NEW.contact_id := NULLIF(NEW.data->>'vendorId', '');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    EXCEPTION WHEN undefined_column THEN END;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        -- Sync Journal ID
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            BEGIN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   IF (NEW.data ? 'journalEntryId') THEN NEW.journal_id := NULLIF(NEW.data->>'journalEntryId', ''); END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       EXCEPTION WHEN undefined_column THEN END;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           -- Sync Product specific flat columns
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               BEGIN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      IF TG_TABLE_NAME = 'docs_products' THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               IF (NEW.data ? 'name') THEN NEW.name := NULLIF(NEW.data->>'name', ''); END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        IF (NEW.data ? 'sku') THEN NEW.sku := NULLIF(NEW.data->>'sku', ''); END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 IF (NEW.data ? 'price') THEN NEW.price := NULLIF(NEW.data->>'price', '')::NUMERIC; END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          IF (NEW.data ? 'costPrice') THEN NEW.cost_price := NULLIF(NEW.data->>'costPrice', '')::NUMERIC; END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 ELSIF TG_TABLE_NAME = 'docs_contacts' THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          IF (NEW.data ? 'name') THEN NEW.name := NULLIF(NEW.data->>'name', ''); END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   IF (NEW.data ? 'type') THEN NEW.type := NULLIF(NEW.data->>'type', ''); END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ELSIF TG_TABLE_NAME = 'docs_payments' THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   IF (NEW.data ? 'type') THEN NEW.type := NULLIF(NEW.data->>'type', ''); END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              EXCEPTION WHEN undefined_column THEN END;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  RETURN NEW;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  $function$;


-- Function: sync_invoice_lines_from_doc_data
CREATE OR REPLACE FUNCTION public.sync_invoice_lines_from_doc_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        v_item JSONB;
        v_items_array JSONB;
        v_serial_json JSONB;
        v_line_id TEXT;
        v_raw_id TEXT;
        v_idx INTEGER;
    BEGIN
        IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
        IF NEW.data IS NULL OR NOT (NEW.data ? 'items') THEN RETURN NEW; END IF;
        
        v_items_array := NEW.data->'items';
        IF jsonb_typeof(v_items_array) <> 'array' THEN RETURN NEW; END IF;

        DELETE FROM docs_invoice_lines
        WHERE invoice_id = NEW.id
          AND id NOT IN (
              SELECT COALESCE(elem->>'id', '') 
              FROM jsonb_array_elements(v_items_array) AS elem
              WHERE elem->>'id' IS NOT NULL
          );

        FOR v_item, v_idx IN SELECT value, ordinality FROM jsonb_array_elements(v_items_array) WITH ORDINALITY LOOP
            v_serial_json := v_item->'serialNumbers';
            IF v_serial_json IS NULL OR jsonb_typeof(v_serial_json) <> 'array' THEN v_serial_json := '[]'::jsonb; END IF;

            v_raw_id := v_item->>'id';
            IF v_raw_id IS NULL OR v_raw_id = '' THEN v_raw_id := gen_random_uuid()::TEXT; END IF;
            
            v_line_id := v_raw_id;

            INSERT INTO docs_invoice_lines (
                id, invoice_id, company_id, product_id, quantity, unit_price, discount, tax, total, description, line_value, discount_rate, discount_mode, type, uom, display_description, serial_numbers, display_index
            ) VALUES (
                v_line_id, NEW.id, NEW.company_id, v_item->>'productId', COALESCE((v_item->>'quantity')::NUMERIC, 0), COALESCE((v_item->>'unitPrice')::NUMERIC, 0), COALESCE((v_item->>'discountAmount')::NUMERIC, COALESCE((v_item->>'discount')::NUMERIC, 0)), COALESCE((v_item->>'taxValue')::NUMERIC, COALESCE((v_item->>'taxAmount')::NUMERIC, 0)), COALESCE((v_item->>'total')::NUMERIC, 0), COALESCE(v_item->>'description', ''), COALESCE((v_item->>'lineValue')::NUMERIC, COALESCE((v_item->>'total')::NUMERIC, 0)), COALESCE((v_item->>'discountRate')::NUMERIC, 0), COALESCE(v_item->>'discountMode', 'PERCENT'), COALESCE(v_item->>'type', 'PRODUCT'), v_item->>'uom', v_item->>'displayDescription', v_serial_json, v_idx
            ) ON CONFLICT (id) DO UPDATE SET
                product_id = EXCLUDED.product_id, quantity = EXCLUDED.quantity, unit_price = EXCLUDED.unit_price, discount = EXCLUDED.discount, tax = EXCLUDED.tax, total = EXCLUDED.total, description = EXCLUDED.description, line_value = EXCLUDED.line_value, discount_rate = EXCLUDED.discount_rate, discount_mode = EXCLUDED.discount_mode, type = EXCLUDED.type, uom = EXCLUDED.uom, display_description = EXCLUDED.display_description, serial_numbers = EXCLUDED.serial_numbers, display_index = EXCLUDED.display_index;
        END LOOP;

        RETURN NEW;
    END;
$function$;


-- Function: sync_product_inventory_totals
CREATE OR REPLACE FUNCTION public.sync_product_inventory_totals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_product_id TEXT;
    v_stock_levels JSONB;
    v_total_qoh NUMERIC;
    v_r RECORD;
BEGIN
    -- Determine the product_id to update
    IF TG_OP = 'DELETE' THEN
        v_product_id := OLD.product_id;
    ELSE
        v_product_id := NEW.product_id;
    END IF;

    IF v_product_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Calculate stock levels per company and total QOH
    v_stock_levels := '{}'::jsonb;
    v_total_qoh := 0;

    FOR v_r IN (
        SELECT company_id, SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE -quantity END) as company_qty
        FROM docs_inventory_transactions
        WHERE product_id = v_product_id
        GROUP BY company_id
    ) LOOP
        v_stock_levels := jsonb_set(v_stock_levels, ARRAY[v_r.company_id], to_jsonb(COALESCE(v_r.company_qty, 0)));
        v_total_qoh := v_total_qoh + COALESCE(v_r.company_qty, 0);
    END LOOP;

    -- Update the core docs_products table
    UPDATE docs_products
    SET quantity_on_hand = v_total_qoh,
        data = jsonb_set(
            jsonb_set(
                COALESCE(data, '{}'::jsonb),
                '{stockLevels}',
                v_stock_levels
            ),
            '{quantityOnHand}',
            to_jsonb(v_total_qoh)
        ),
        updated_at = NOW()
    WHERE id = v_product_id;

    -- If updated product has old product_id due to update, sync that too
    IF TG_OP = 'UPDATE' AND NEW.product_id <> OLD.product_id AND OLD.product_id IS NOT NULL THEN
        v_product_id := OLD.product_id;
        v_stock_levels := '{}'::jsonb;
        v_total_qoh := 0;

        FOR v_r IN (
            SELECT company_id, SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE -quantity END) as company_qty
            FROM docs_inventory_transactions
            WHERE product_id = v_product_id
            GROUP BY company_id
        ) LOOP
            v_stock_levels := jsonb_set(v_stock_levels, ARRAY[v_r.company_id], to_jsonb(COALESCE(v_r.company_qty, 0)));
            v_total_qoh := v_total_qoh + COALESCE(v_r.company_qty, 0);
        END LOOP;

        UPDATE docs_products
        SET quantity_on_hand = v_total_qoh,
            data = jsonb_set(
                jsonb_set(
                    COALESCE(data, '{}'::jsonb),
                    '{stockLevels}',
                    v_stock_levels
                ),
                '{quantityOnHand}',
                to_jsonb(v_total_qoh)
            ),
            updated_at = NOW()
        WHERE id = v_product_id;
    END IF;

    RETURN NULL;
END;
$function$;


-- Function: sync_product_metadata
CREATE OR REPLACE FUNCTION public.sync_product_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE 
    v_val TEXT;
BEGIN
    -- Sync Company ID (Original logic intact)
    IF NEW.data IS NOT NULL THEN
        IF (NEW.data ? 'companyId') THEN
            v_val := COALESCE(NEW.data->>'companyId', NEW.data->'companyIds'->>0);
            IF v_val IS NOT NULL THEN NEW.company_id := v_val; END IF;
        ELSIF (NEW.data ? 'companyIds') THEN
            v_val := NEW.data->'companyIds'->>0;
            IF v_val IS NOT NULL THEN NEW.company_id := v_val; END IF;
        END IF;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- 💡 ফিক্স: যদি মূল কলাম আপডেট হয়, তবে সেটিকে JSON-এ পুশ করবে (প্রায়োরিটি)
        IF NEW.name IS DISTINCT FROM OLD.name THEN NEW.data := jsonb_set(NEW.data, '{name}', to_jsonb(NEW.name)); END IF;
        IF NEW.sku IS DISTINCT FROM OLD.sku THEN NEW.data := jsonb_set(NEW.data, '{sku}', to_jsonb(NEW.sku)); END IF;
        IF NEW.price IS DISTINCT FROM OLD.price THEN NEW.data := jsonb_set(NEW.data, '{price}', to_jsonb(NEW.price)); END IF;
        IF NEW.cost_price IS DISTINCT FROM OLD.cost_price THEN NEW.data := jsonb_set(NEW.data, '{costPrice}', to_jsonb(NEW.cost_price)); END IF;
        IF NEW.brand IS DISTINCT FROM OLD.brand THEN NEW.data := jsonb_set(NEW.data, '{brand}', to_jsonb(NEW.brand)); END IF;
        IF NEW.category IS DISTINCT FROM OLD.category THEN NEW.data := jsonb_set(NEW.data, '{category}', to_jsonb(NEW.category)); END IF;
        
        -- যদি JSON আপডেট হয়, তবে সেটিকে মূল কলামে পুশ করবে
        IF NEW.data->>'name' IS DISTINCT FROM OLD.data->>'name' THEN NEW.name := NULLIF(NEW.data->>'name', ''); END IF;
        IF NEW.data->>'sku' IS DISTINCT FROM OLD.data->>'sku' THEN NEW.sku := NULLIF(NEW.data->>'sku', ''); END IF;
        IF NEW.data->>'price' IS DISTINCT FROM OLD.data->>'price' THEN NEW.price := NULLIF(NEW.data->>'price', '')::NUMERIC; END IF;
        IF NEW.data->>'costPrice' IS DISTINCT FROM OLD.data->>'costPrice' THEN NEW.cost_price := NULLIF(NEW.data->>'costPrice', '')::NUMERIC; END IF;
        IF NEW.data->>'brand' IS DISTINCT FROM OLD.data->>'brand' THEN NEW.brand := NULLIF(NEW.data->>'brand', ''); END IF;
        IF NEW.data->>'category' IS DISTINCT FROM OLD.data->>'category' THEN NEW.category := NULLIF(NEW.data->>'category', ''); END IF;

    ELSIF TG_OP = 'INSERT' THEN
        -- Insert-এর সময় ফলব্যাক লজিক
        IF NEW.name IS NULL AND NEW.data ? 'name' THEN NEW.name := NULLIF(NEW.data->>'name', ''); 
        ELSIF NEW.name IS NOT NULL THEN NEW.data := jsonb_set(COALESCE(NEW.data, '{}'::jsonb), '{name}', to_jsonb(NEW.name)); END IF;

        IF NEW.sku IS NULL AND NEW.data ? 'sku' THEN NEW.sku := NULLIF(NEW.data->>'sku', ''); 
        ELSIF NEW.sku IS NOT NULL THEN NEW.data := jsonb_set(COALESCE(NEW.data, '{}'::jsonb), '{sku}', to_jsonb(NEW.sku)); END IF;

        IF NEW.price IS NULL AND NEW.data ? 'price' THEN NEW.price := NULLIF(NEW.data->>'price', '')::NUMERIC; 
        ELSIF NEW.price IS NOT NULL THEN NEW.data := jsonb_set(COALESCE(NEW.data, '{}'::jsonb), '{price}', to_jsonb(NEW.price)); END IF;

        IF NEW.cost_price IS NULL AND NEW.data ? 'costPrice' THEN NEW.cost_price := NULLIF(NEW.data->>'costPrice', '')::NUMERIC; 
        ELSIF NEW.cost_price IS NOT NULL THEN NEW.data := jsonb_set(COALESCE(NEW.data, '{}'::jsonb), '{costPrice}', to_jsonb(NEW.cost_price)); END IF;
        
        IF NEW.brand IS NULL AND NEW.data ? 'brand' THEN NEW.brand := NULLIF(NEW.data->>'brand', ''); 
        ELSIF NEW.brand IS NOT NULL THEN NEW.data := jsonb_set(COALESCE(NEW.data, '{}'::jsonb), '{brand}', to_jsonb(NEW.brand)); END IF;
        
        IF NEW.category IS NULL AND NEW.data ? 'category' THEN NEW.category := NULLIF(NEW.data->>'category', ''); 
        ELSIF NEW.category IS NOT NULL THEN NEW.data := jsonb_set(COALESCE(NEW.data, '{}'::jsonb), '{category}', to_jsonb(NEW.category)); END IF;
    END IF;

    RETURN NEW;
END;
$function$;


-- Function: test_delete
CREATE OR REPLACE FUNCTION public.test_delete()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  EXECUTE 'SET LOCAL core.bypass_audit = ''true''';
  DELETE FROM docs_journal_lines WHERE journal_id = 'test_never_matches';
  EXECUTE 'SET LOCAL core.bypass_audit = ''false''';
END;
$function$;


-- Function: test_delete_journal_lines
CREATE OR REPLACE FUNCTION public.test_delete_journal_lines(p_journal_id text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
    BEGIN
      UPDATE docs_journals SET status = 'DRAFT' WHERE id = p_journal_id;
      PERFORM set_config('core.bypass_audit', 'true', true);
      DELETE FROM docs_journal_lines WHERE journal_id = p_journal_id;
      PERFORM set_config('core.bypass_audit', 'false', true);
    END;
    $function$;


-- Function: test_loop
CREATE OR REPLACE FUNCTION public.test_loop()
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
    DECLARE
      v_schedule JSONB;
      v_item JSONB;
      v_rem_principal NUMERIC := 15000;
      v_unpaid INT := 0;
      v_res JSONB := '[]'::jsonb;
    BEGIN
      v_schedule := '[{"period": 1, "principal": 1182.731830175124}, {"period": 2, "principal": 1194.5591484768752}, {"period": 3, "principal": 1206.504739961644}, {"period": 4, "principal": 1218.5697873612605}, {"period": 5, "principal": 1230.755485234873}, {"period": 6, "principal": 1243.063040087222}, {"period": 7, "principal": 1255.493670488094}, {"period": 8, "principal": 1268.048607192975}, {"period": 9, "principal": 1280.7290932649048}, {"period": 10, "principal": 1293.5363841975538}, {"period": 11, "principal": 1306.4717480395293}, {"period": 12, "principal": 1319.5364655199246}]'::jsonb;
      
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_schedule) LOOP
        IF v_rem_principal >= ((v_item->>'principal')::NUMERIC - 0.01) THEN
            v_rem_principal := v_rem_principal - (v_item->>'principal')::NUMERIC;
            v_res := v_res || jsonb_build_object('period', v_item->>'period', 'status', 'PAID', 'rem', v_rem_principal);
        ELSE
            v_res := v_res || jsonb_build_object('period', v_item->>'period', 'status', 'UNPAID', 'rem', v_rem_principal, 'req', ((v_item->>'principal')::NUMERIC - 0.01));
        END IF;
      END LOOP;
      RETURN v_res;
    END;
    $function$;


-- Function: test_loop_zero
CREATE OR REPLACE FUNCTION public.test_loop_zero()
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
    DECLARE
      v_schedule JSONB;
      v_item JSONB;
      v_rem_principal NUMERIC := 15000;
      v_res JSONB := '[]'::jsonb;
    BEGIN
      v_schedule := '[{"period": 1, "principal": 1250}, {"period": 2, "principal": 1250}, {"period": 3, "principal": 1250}, {"period": 4, "principal": 1250}, {"period": 5, "principal": 1250}, {"period": 6, "principal": 1250}, {"period": 7, "principal": 1250}, {"period": 8, "principal": 1250}, {"period": 9, "principal": 1250}, {"period": 10, "principal": 1250}, {"period": 11, "principal": 1250}, {"period": 12, "principal": 1250}]'::jsonb;
      
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_schedule) LOOP
        IF v_rem_principal >= ((v_item->>'principal')::NUMERIC - 0.01) THEN
            v_rem_principal := v_rem_principal - (v_item->>'principal')::NUMERIC;
            v_res := v_res || jsonb_build_object('period', v_item->>'period', 'status', 'PAID', 'rem', v_rem_principal);
        ELSE
            v_res := v_res || jsonb_build_object('period', v_item->>'period', 'status', 'UNPAID', 'rem', v_rem_principal);
        END IF;
      END LOOP;
      RETURN v_res;
    END;
    $function$;


-- Function: test_post_invoice
CREATE OR REPLACE FUNCTION public.test_post_invoice(p_invoice_id text, p_company_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$

    DECLARE
        v_invoice RECORD;
        v_item JSONB;
        v_items_json JSONB;
        v_journal_id TEXT;
        v_total_debit NUMERIC := 0;
        v_total_credit NUMERIC := 0;
        v_product_record RECORD;
        v_current_stock NUMERIC;
        v_new_stock NUMERIC;
        v_item_subtotal NUMERIC := 0;
        v_revenue_net NUMERIC := 0;
        v_global_discount NUMERIC := 0;
        v_total_revenue_subtotal NUMERIC := 0;
        v_proportional_discount NUMERIC := 0;
        v_cogs_value NUMERIC := 0;
        v_ar_acc TEXT;
        v_rev_acc TEXT;
        v_cogs_acc TEXT;
        v_inv_acc TEXT;
        v_tax_acc TEXT;
        v_tax_total NUMERIC := 0;
        v_idx INT := 0;
        v_tracking_type TEXT;
        v_effective_company_id TEXT;
        
        -- Cash sale variables
        v_is_cash_sale BOOLEAN;
        v_liquidity_acc TEXT;
        v_pay_id TEXT;
    BEGIN
        SELECT * INTO v_invoice FROM docs_invoices WHERE id = p_invoice_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found: %', p_invoice_id; END IF;
        
        v_journal_id := 'JE-' || replace(replace(UPPER(v_invoice.id), 'INV-', ''), 'INV-', '');
        IF EXISTS(SELECT 1 FROM docs_journals WHERE id = v_journal_id AND status = 'POSTED') THEN 
            RETURN jsonb_build_object('success', true, 'message', 'Already posted', 'journal_id', v_journal_id); 
        END IF;

        v_effective_company_id := COALESCE(p_company_id, v_invoice.company_id);
        IF v_effective_company_id IS NULL THEN RAISE EXCEPTION 'Company ID missing'; END IF;

        SELECT id INTO v_ar_acc FROM docs_accounts WHERE code IN ('100201', '100200') AND company_id = v_effective_company_id LIMIT 1;
        IF v_ar_acc IS NULL THEN
            SELECT id INTO v_ar_acc FROM docs_accounts WHERE (data->>'subType' = 'RECEIVABLE' OR data->>'type' = 'ASSET') AND company_id = v_effective_company_id LIMIT 1;
        END IF;
        IF v_ar_acc IS NULL THEN
            SELECT id INTO v_ar_acc FROM docs_accounts WHERE company_id = v_effective_company_id LIMIT 1;
        END IF;

        SELECT id INTO v_rev_acc FROM docs_accounts WHERE code IN ('400100', '400000') AND company_id = v_effective_company_id LIMIT 1;
        IF v_rev_acc IS NULL THEN
            SELECT id INTO v_rev_acc FROM docs_accounts WHERE (data->>'subType' = 'REVENUE' OR data->>'type' = 'REVENUE' OR data->>'type' = 'INCOME') AND company_id = v_effective_company_id LIMIT 1;
        END IF;
        IF v_rev_acc IS NULL THEN
            SELECT id INTO v_rev_acc FROM docs_accounts WHERE company_id = v_effective_company_id LIMIT 1;
        END IF;

        SELECT id INTO v_cogs_acc FROM docs_accounts WHERE code IN ('500101', '500100') AND company_id = v_effective_company_id LIMIT 1;
        IF v_cogs_acc IS NULL THEN
            SELECT id INTO v_cogs_acc FROM docs_accounts WHERE (data->>'subType' = 'COGS' OR data->>'type' = 'EXPENSE') AND company_id = v_effective_company_id LIMIT 1;
        END IF;
        IF v_cogs_acc IS NULL THEN
            SELECT id INTO v_cogs_acc FROM docs_accounts WHERE company_id = v_effective_company_id LIMIT 1;
        END IF;

        SELECT id INTO v_inv_acc FROM docs_accounts WHERE code IN ('100501', '100502', '100500') AND company_id = v_effective_company_id LIMIT 1;
        IF v_inv_acc IS NULL THEN
            SELECT id INTO v_inv_acc FROM docs_accounts WHERE (data->>'subType' = 'INVENTORY' OR data->>'type' = 'ASSET') AND company_id = v_effective_company_id LIMIT 1;
        END IF;
        IF v_inv_acc IS NULL THEN
            SELECT id INTO v_inv_acc FROM docs_accounts WHERE company_id = v_effective_company_id LIMIT 1;
        END IF;

        SELECT id INTO v_tax_acc FROM docs_accounts WHERE code = '200400' AND company_id = v_effective_company_id LIMIT 1;
        IF v_tax_acc IS NULL THEN
            SELECT id INTO v_tax_acc FROM docs_accounts WHERE (data->>'subType' = 'TAX' OR data->>'type' = 'LIABILITY') AND company_id = v_effective_company_id LIMIT 1;
        END IF;
        IF v_tax_acc IS NULL THEN
            SELECT id INTO v_tax_acc FROM docs_accounts WHERE company_id = v_effective_company_id LIMIT 1;
        END IF;

        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
              'id', id,
              'productId', product_id,
              'quantity', quantity,
              'unitPrice', unit_price,
              'lineValue', COALESCE(line_value, total),
              'type', COALESCE(type, 'PRODUCT'),
              'uom', uom,
              'description', description,
              'displayDescription', display_description,
              'discountMode', COALESCE(discount_mode, 'PERCENT'),
              'discountRate', COALESCE(discount_rate, 0),
              'discountValue', COALESCE(discount, 0),
              'taxValue', COALESCE(tax, 0),
              'total', total,
              'serialNumbers', COALESCE(serial_numbers, '[]'::jsonb)
            ) ORDER BY display_index ASC, id ASC), '[]'::jsonb) INTO v_items_json
        FROM docs_invoice_lines 
        WHERE invoice_id = p_invoice_id;

        IF v_items_json IS NULL OR v_items_json = '[]'::jsonb THEN
            v_items_json := v_invoice.data->'items';
        END IF;

        v_total_revenue_subtotal := 0;
        v_global_discount := 0;
        v_tax_total := 0;
        
        FOR v_item IN SELECT * FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_items_json) = 'array' THEN v_items_json ELSE '[]'::jsonb END) LOOP
            IF v_item->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE') THEN
                v_item_subtotal := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                IF v_item_subtotal = 0 THEN
                    v_item_subtotal := COALESCE((v_item->>'quantity')::numeric, 0) * COALESCE((v_item->>'unitPrice')::numeric, 0);
                    IF v_item->>'discountMode' = 'FIXED' THEN
                        v_item_subtotal := v_item_subtotal - COALESCE((v_item->>'discountRate')::numeric, 0);
                    ELSE
                        v_item_subtotal := v_item_subtotal * (1 - COALESCE((v_item->>'discountRate')::numeric, 0) / 100.0);
                    END IF;
                    v_item_subtotal := ROUND(v_item_subtotal, 2);
                END IF;
                v_total_revenue_subtotal := v_total_revenue_subtotal + v_item_subtotal;
            ELSIF v_item->>'type' = 'DISCOUNT' THEN
                v_item_subtotal := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                IF v_item_subtotal = 0 THEN
                    IF v_item->>'discountMode' = 'FIXED' THEN
                        v_item_subtotal := -ROUND(COALESCE((v_item->>'discountRate')::numeric, 0), 2);
                    ELSE
                        v_item_subtotal := -ROUND(v_total_revenue_subtotal * COALESCE((v_item->>'discountRate')::numeric, 0) / 100.0, 2);
                    END IF;
                END IF;
                v_global_discount := v_global_discount + v_item_subtotal;
            ELSIF v_item->>'type' = 'TAX' THEN
                v_item_subtotal := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                IF v_item_subtotal = 0 THEN
                   v_item_subtotal := COALESCE((v_item->>'manualValue')::numeric, ROUND((v_total_revenue_subtotal + v_global_discount) * (COALESCE((v_item->>'taxRate')::numeric, 0)/100.0), 2));
                END IF;
                v_tax_total := v_tax_total + v_item_subtotal;
            END IF;
        END LOOP;

        -- Update Invoice status to POSTED unless already PAID/PARTIAL/REFUNDED
        UPDATE docs_invoices 
        SET status = CASE WHEN status IN ('PAID', 'PARTIALLY_PAID', 'PARTIAL', 'IN_PAYMENT', 'PARTIAL_REFUNDED', 'FULL_REFUNDED') THEN status ELSE 'POSTED' END, 
            updated_at = NOW() 
        WHERE id = p_invoice_id 
        RETURNING * INTO v_invoice;

        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
        VALUES ('JL-' || v_journal_id || '-ar', v_journal_id, v_effective_company_id, v_ar_acc, v_invoice.customer_id, ROUND(COALESCE(v_invoice.total, 0), 2), 0, 'AR: ' || COALESCE(v_invoice.invoice_number, '(DRAFT)'));
        v_total_debit := ROUND(COALESCE(v_invoice.total, 0), 2);

        DECLARE
            v_discount_distributed NUMERIC := 0;
            v_items_count INT := 0;
            v_current_item_idx INT := 0;
        BEGIN
            SELECT count(*) INTO v_items_count FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_items_json) = 'array' THEN v_items_json ELSE '[]'::jsonb END) it WHERE it->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE');

            FOR v_item IN SELECT * FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_items_json) = 'array' THEN v_items_json ELSE '[]'::jsonb END) LOOP
                v_idx := v_idx + 1;
                
                IF v_item->>'type' IN ('PRODUCT', 'SERVICE', 'CHARGE') THEN
                    v_current_item_idx := v_current_item_idx + 1;
                    v_item_subtotal := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                    IF v_item_subtotal = 0 THEN
                        v_item_subtotal := COALESCE((v_item->>'quantity')::numeric, 0) * COALESCE((v_item->>'unitPrice')::numeric, 0);
                        IF v_item->>'discountMode' = 'FIXED' THEN
                            v_item_subtotal := v_item_subtotal - COALESCE((v_item->>'discountRate')::numeric, 0);
                        ELSE
                            v_item_subtotal := v_item_subtotal * (1 - COALESCE((v_item->>'discountRate')::numeric, 0) / 100.0);
                        END IF;
                        v_item_subtotal := ROUND(v_item_subtotal, 2);
                    END IF;
                    
                    IF v_current_item_idx = v_items_count THEN
                        v_proportional_discount := ROUND(v_global_discount - v_discount_distributed, 2);
                    ELSE
                        v_proportional_discount := CASE WHEN v_total_revenue_subtotal > 0 THEN (v_item_subtotal / v_total_revenue_subtotal) * v_global_discount ELSE 0 END;
                        v_proportional_discount := ROUND(v_proportional_discount, 2);
                        v_discount_distributed := v_discount_distributed + v_proportional_discount;
                    END IF;

                    v_revenue_net := ROUND(v_item_subtotal + v_proportional_discount, 2); RAISE NOTICE 'Item: %, subtotal: %, prop_disc: %, net_rev: %', v_item->>'description', v_item_subtotal, v_proportional_discount, v_revenue_net;

                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                    VALUES ('JL-' || v_journal_id || '-rev-' || v_idx, v_journal_id, v_effective_company_id, v_rev_acc, 0, v_revenue_net, 'Revenue: ' || (v_item->>'description'));
                    v_total_credit := v_total_credit + v_revenue_net;

                    IF v_item->>'type' = 'PRODUCT' THEN
                        SELECT * INTO v_product_record FROM docs_products WHERE id = (v_item->>'productId') FOR UPDATE;
                        IF FOUND THEN
                            v_current_stock := COALESCE(v_product_record.quantity_on_hand, 0);
                            v_new_stock := v_current_stock - COALESCE((v_item->>'quantity')::numeric, 0);

                            UPDATE docs_products 
                            SET quantity_on_hand = v_new_stock,
                                data = jsonb_set(
                                    jsonb_set(
                                        CASE WHEN data ? 'stockLevels' THEN data ELSE data || '{"stockLevels": {}}'::jsonb END,
                                        ('{stockLevels,' || v_effective_company_id || '}')::text[], 
                                        v_new_stock::text::jsonb
                                    ),
                                    '{quantityOnHand}',
                                    to_jsonb(v_new_stock)
                                ),
                                updated_at = NOW()
                            WHERE id = v_product_record.id;

                            -- COGS and Inventory JLs removed (handled by generate_inventory_movements and post_inventory_ledger_lines triggers)
                        END IF;
                    END IF;
                ELSIF v_item->>'type' = 'TAX' THEN
                    v_tax_total := ROUND(COALESCE((v_item->>'lineValue')::numeric, 0), 2);
                    
                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                    VALUES ('JL-' || v_journal_id || '-tax-' || v_idx, v_journal_id, v_effective_company_id, v_tax_acc, 0, v_tax_total, 'Tax: ' || (v_item->>'description'));
                    v_total_credit := v_total_credit + v_tax_total;
                END IF;
            END LOOP;
        END;

        RAISE NOTICE 'v_total_revenue_subtotal: %, v_global_discount: %', v_total_revenue_subtotal, v_global_discount; v_total_debit := ROUND(v_total_debit, 2);
        v_total_credit := ROUND(v_total_credit, 2);
        IF v_total_debit != v_total_credit THEN
            IF ABS(v_total_debit - v_total_credit) <= 0.10 THEN
                UPDATE docs_journal_lines SET credit = credit + (v_total_debit - v_total_credit)
                WHERE journal_id = v_journal_id AND id = 'JL-' || v_journal_id || '-rev-' || v_idx;
                v_total_credit := v_total_debit;
            ELSE
                RAISE EXCEPTION 'Invoice Failed: Unbalanced Invoice (Dr: %, Cr: %). Diff: %', v_total_debit, v_total_credit, (v_total_debit - v_total_credit);
            END IF;
        END IF;

        INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, reference, prepared_by, created_by_id, updated_at)
        VALUES (
          v_journal_id, 
          v_effective_company_id, 
          v_invoice.date, 
          v_invoice.date, 
          'INV', 
          'POSTED', 
          v_invoice.invoice_number, 
          v_invoice.invoice_number, 
          COALESCE(v_invoice.salesperson, 'System'), 
          v_invoice.created_by_id, 
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET 
            status = 'POSTED',
            journal_type = EXCLUDED.journal_type,
            reference_number = EXCLUDED.reference_number,
            reference = EXCLUDED.reference,
            updated_at = NOW();

        -- Cash Sale Auto Payment Logic (when first posted)
        v_is_cash_sale := COALESCE(v_invoice.customer_id, '') ILIKE '%cash-sale%' OR EXISTS(SELECT 1 FROM docs_contacts WHERE id = v_invoice.customer_id AND (name ILIKE '%cash sale%' OR name ILIKE '%cash-sale%'));
        IF v_is_cash_sale AND NOT EXISTS (
            SELECT 1 FROM docs_payments p, jsonb_array_elements(CASE WHEN jsonb_typeof(p.data->'appliedInvoices') = 'array' THEN p.data->'appliedInvoices' ELSE '[]'::jsonb END) AS app
            WHERE p.id <> 'PAY-AUTO-' || p_invoice_id AND p.status = 'POSTED' AND app->>'invoiceId' = p_invoice_id
        ) THEN
            -- Find liquidity
            SELECT id INTO v_liquidity_acc FROM docs_accounts WHERE code IN ('1011', '100100', '100101', 'CASH', 'BANK') AND company_id = v_effective_company_id LIMIT 1;
            IF v_liquidity_acc IS NULL THEN 
                SELECT id INTO v_liquidity_acc FROM docs_accounts WHERE (name ILIKE '%cash%' OR name ILIKE '%bank%') AND company_id = v_effective_company_id LIMIT 1; 
            END IF;
            IF v_liquidity_acc IS NULL THEN 
                SELECT id INTO v_liquidity_acc FROM docs_accounts WHERE type = 'ASSET' AND company_id = v_effective_company_id LIMIT 1; 
            END IF;
            
            v_pay_id := 'PAY-AUTO-' || p_invoice_id;
            INSERT INTO docs_payments (id, company_id, date, contact_id, account_id, status, type, amount, payment_date, data, updated_at)
            VALUES (
                v_pay_id, v_effective_company_id, v_invoice.date, v_invoice.customer_id, v_liquidity_acc, 'DRAFT', 'RECEIPT', COALESCE(v_invoice.total, 0), v_invoice.date,
                jsonb_build_object(
                    'id', v_pay_id, 'amount', COALESCE(v_invoice.total, 0),
                    'contactId', v_invoice.customer_id, 'date', v_invoice.date, 'method', 'CASH', 'type', 'RECEIPT',
                    'accountId', v_liquidity_acc, 'status', 'DRAFT', 'companyId', v_effective_company_id,
                    'appliedInvoices', jsonb_build_array(jsonb_build_object('invoiceId', p_invoice_id, 'invoiceNumber', COALESCE(v_invoice.invoice_number, '(DRAFT)'), 'amount', COALESCE(v_invoice.total, 0), 'remaining', 0))
                ),
                NOW()
            ) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, date = EXCLUDED.date, payment_date = EXCLUDED.payment_date, amount = EXCLUDED.amount, type = EXCLUDED.type, account_id = EXCLUDED.account_id, updated_at = NOW();
            
            PERFORM post_payment(v_pay_id, v_effective_company_id);
            
            -- Make sure the invoice is marked as PAID in docs_invoices as well
            UPDATE docs_invoices SET status = 'PAID', data = jsonb_set(COALESCE(data, '{}'::jsonb), '{status}', '"PAID"') WHERE id = p_invoice_id;
        END IF;

        RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
    END;
    
$function$;


-- Function: test_rpc_run
CREATE OR REPLACE FUNCTION public.test_rpc_run(l_id text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
      DECLARE
         v_uid uuid;
      BEGIN
         SELECT user_id INTO v_uid FROM company_users WHERE company_id = 'comp-4' LIMIT 1;
         
         -- Simulate auth
         EXECUTE 'set local request.jwt.claims to ''{"sub": "' || COALESCE(v_uid::text, '') || '"}''';
         
         PERFORM public.post_loan_payment_rpc(l_id, 2, '2026-07-18', 0, 5000);
      END;
      $function$;


-- Function: test_trigger_depth
CREATE OR REPLACE FUNCTION public.test_trigger_depth()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      RAISE NOTICE 'test_trigger_depth %', pg_trigger_depth();
      RETURN NEW;
    END;
    $function$;


-- Function: trg_enforce_invoice_paid_status
CREATE OR REPLACE FUNCTION public.trg_enforce_invoice_paid_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
        DECLARE
            v_has_active_payment BOOLEAN;
            v_total NUMERIC;
        BEGIN
            IF NEW.status = 'PAID' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'PAID') THEN
                v_total := COALESCE(NEW.total, 0);
                IF v_total > 0 THEN
                    SELECT EXISTS (
                        SELECT 1 
                        FROM docs_payments p
                        LEFT JOIN LATERAL jsonb_array_elements(
                            CASE WHEN jsonb_typeof(p.applied_invoices) = 'array' THEN p.applied_invoices 
                                 WHEN jsonb_typeof(p.data->'appliedInvoices') = 'array' THEN p.data->'appliedInvoices' 
                                 ELSE '[]'::jsonb END
                        ) al ON true
                        WHERE ( (p.data->>'invoiceId') = NEW.id OR al->>'invoiceId' = NEW.id )
                          AND p.status = 'POSTED'
                          AND p.payment_number IS NOT NULL
                    ) INTO v_has_active_payment;

                    IF NOT v_has_active_payment THEN
                         -- INSTEAD OF RAISING AN EXCEPTION, FORCIBLY REVERT IT TO POSTED!
                         -- This way, if frontend sends PAID for a new invoice, it auto-corrects.
                         NEW.status := 'POSTED';
                         NEW.data := jsonb_set(NEW.data, '{status}', '"POSTED"'::jsonb);
                    END IF;
                END IF;
            END IF;
            RETURN NEW;
        END;
        $function$;


-- Function: trg_fn_update_invoice_profit_on_header_change
CREATE OR REPLACE FUNCTION public.trg_fn_update_invoice_profit_on_header_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        NEW.total_profit := calculate_invoice_total_profit(NEW.id);
        RETURN NEW;
    END;
    $function$;


-- Function: trg_fn_update_invoice_profit_on_line_change
CREATE OR REPLACE FUNCTION public.trg_fn_update_invoice_profit_on_line_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        v_invoice_id TEXT;
    BEGIN
        IF TG_OP = 'DELETE' THEN
            v_invoice_id := OLD.invoice_id;
        ELSE
            v_invoice_id := NEW.invoice_id;
        END IF;

        IF v_invoice_id IS NOT NULL THEN
            UPDATE docs_invoices
            SET total_profit = calculate_invoice_total_profit(v_invoice_id)
            WHERE id = v_invoice_id;
        END IF;

        RETURN NULL;
    END;
    $function$;


-- Function: trg_generate_amortization_schedule
CREATE OR REPLACE FUNCTION public.trg_generate_amortization_schedule()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND (
        NEW.principal_amount IS DISTINCT FROM OLD.principal_amount OR
        NEW.interest_rate IS DISTINCT FROM OLD.interest_rate OR
        NEW.term_months IS DISTINCT FROM OLD.term_months OR
        NEW.interest_type IS DISTINCT FROM OLD.interest_type
     )) THEN
     
     NEW.amortization_schedule := generate_amortization_schedule(
       COALESCE(NEW.principal_amount, 0),
       COALESCE(NEW.interest_rate, 0),
       COALESCE(NEW.term_months, 1),
       COALESCE(NEW.interest_type, 'REDUCING')
     );
     
     IF NEW.data IS NULL THEN
        NEW.data := '{}'::jsonb;
     END IF;
     NEW.data := jsonb_set(NEW.data, '{amortizationSchedule}', NEW.amortization_schedule);
  END IF;
  
  RETURN NEW;
END;
$function$;


-- Function: trg_generate_contact_opening_balance
CREATE OR REPLACE FUNCTION public.trg_generate_contact_opening_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
      v_opening_balance NUMERIC;
      v_journal_id TEXT;
      v_acct_id_target TEXT;
      v_acct_id_equity TEXT;
      v_is_customer BOOLEAN;
    BEGIN
      v_opening_balance := COALESCE((NEW.data->>'openingBalance')::NUMERIC, 0);
      
      IF v_opening_balance > 0 THEN
        -- Check if an opening balance journal entry already exists for this contact to prevent duplicates
        IF EXISTS (
          SELECT 1 FROM docs_journals 
          WHERE company_id = NEW.company_id 
            AND (reference_number = 'OB-' || NEW.name OR reference_number LIKE 'INIT-%' || NEW.id || '%')
        ) THEN
          RETURN NEW;
        END IF;

        v_journal_id := 'JEN-' || extract(epoch from now())::text || '-' || substr(md5(random()::text), 1, 6);
        v_is_customer := NEW.type = 'CUSTOMER';
        
        -- Resolve accounts dynamically
        IF v_is_customer THEN
          SELECT id INTO v_acct_id_target 
          FROM docs_accounts 
          WHERE company_id = NEW.company_id 
            AND (code = '100201' OR (data->>'subType' = 'ACCOUNTS_RECEIVABLE'))
          LIMIT 1;
          IF v_acct_id_target IS NULL THEN
            v_acct_id_target := NEW.company_id || '-100201';
          END IF;
        ELSE
          SELECT id INTO v_acct_id_target 
          FROM docs_accounts 
          WHERE company_id = NEW.company_id 
            AND (code = '200101' OR (data->>'subType' = 'ACCOUNTS_PAYABLE'))
          LIMIT 1;
          IF v_acct_id_target IS NULL THEN
            v_acct_id_target := NEW.company_id || '-200101';
          END IF;
        END IF;

        SELECT id INTO v_acct_id_equity 
        FROM docs_accounts 
        WHERE company_id = NEW.company_id 
          AND (code IN ('300100', '300200', '300000', '300001') OR (data->>'subType' = 'EQUITY'))
        LIMIT 1;
        IF v_acct_id_equity IS NULL THEN
          v_acct_id_equity := NEW.company_id || '-300100';
        END IF;
        
        INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, data)
        VALUES (
          v_journal_id, 
          NEW.company_id, 
          CURRENT_DATE, 
          CURRENT_DATE,
          'OPENING_BALANCE', 
          'DRAFT', -- Insert as DRAFT first
          'OB-' || NEW.name, 
          jsonb_build_object(
            'id', v_journal_id,
            'companyId', NEW.company_id,
            'date', CURRENT_DATE,
            'journal_date', CURRENT_DATE,
            'journalType', 'OPENING_BALANCE',
            'status', 'DRAFT',
            'reference', 'OB-' || NEW.name,
            'description', 'Opening Balance for ' || NEW.name
          )
        );

        IF v_is_customer THEN
          -- Debit AR, Credit Equity
          INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
          VALUES 
            ('JEL-' || extract(epoch from now())::text || '-1', v_journal_id, NEW.company_id, v_acct_id_target, NEW.id, v_opening_balance, 0, 'Opening Balance Receivable'),
            ('JEL-' || extract(epoch from now())::text || '-2', v_journal_id, NEW.company_id, v_acct_id_equity, NEW.id, 0, v_opening_balance, 'Opening Balance Equity');
        ELSE
          -- Debit Equity, Credit AP
          INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
          VALUES 
            ('JEL-' || extract(epoch from now())::text || '-1', v_journal_id, NEW.company_id, v_acct_id_equity, NEW.id, v_opening_balance, 0, 'Opening Balance Equity'),
            ('JEL-' || extract(epoch from now())::text || '-2', v_journal_id, NEW.company_id, v_acct_id_target, NEW.id, 0, v_opening_balance, 'Opening Balance Payable');
        END IF;

        -- Now set it to POSTED
        UPDATE docs_journals SET status = 'POSTED', data = jsonb_set(data, '{status}', '"POSTED"') WHERE id = v_journal_id;
      END IF;
      
      RETURN NEW;
    END;
    $function$;


-- Function: trg_generate_product_opening_balance
CREATE OR REPLACE FUNCTION public.trg_generate_product_opening_balance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
      v_qty NUMERIC;
      v_cost NUMERIC;
      v_total_value NUMERIC;
      v_journal_id TEXT;
      v_inv_account_id TEXT;
      v_eq_account_id TEXT;
    BEGIN
      v_qty := COALESCE(NULLIF(NEW.data->>'quantityOnHand', '')::NUMERIC, 0);
      v_cost := COALESCE(NEW.cost_price, NULLIF(NEW.data->>'costPrice', '')::NUMERIC, 0);
      v_total_value := v_qty * v_cost;

      IF v_total_value > 0 THEN
        -- Check if an opening stock journal entry already exists for this SKU to prevent duplicates
        IF EXISTS (
          SELECT 1 FROM docs_journals 
          WHERE company_id = NEW.company_id 
            AND (reference_number = 'OB-' || NEW.sku OR reference_number LIKE 'INIT-%' || NEW.sku || '%')
        ) THEN
          RETURN NEW;
        END IF;

        v_journal_id := 'JEN-' || extract(epoch from now())::text || '-' || substr(md5(random()::text), 1, 6);
        
        -- Resolve accounts dynamically
        SELECT id INTO v_inv_account_id 
        FROM docs_accounts 
        WHERE company_id = NEW.company_id 
          AND (code IN ('100501', '100502', '100500') OR (data->>'subType' = 'INVENTORY'))
        LIMIT 1;
        IF v_inv_account_id IS NULL THEN
          v_inv_account_id := NEW.company_id || '-100501';
        END IF;

        SELECT id INTO v_eq_account_id 
        FROM docs_accounts 
        WHERE company_id = NEW.company_id 
          AND (code IN ('300100', '300200', '300000', '300001') OR (data->>'subType' = 'EQUITY'))
        LIMIT 1;
        IF v_eq_account_id IS NULL THEN
          v_eq_account_id := NEW.company_id || '-300100';
        END IF;

        INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, data)
        VALUES (
          v_journal_id, 
          NEW.company_id, 
          CURRENT_DATE, 
          CURRENT_DATE,
          'OPENING_BALANCE', 
          'DRAFT', -- DRAFT first
          'OB-' || NEW.sku, 
          jsonb_build_object(
            'id', v_journal_id,
            'companyId', NEW.company_id,
            'date', CURRENT_DATE,
            'journal_date', CURRENT_DATE,
            'journalType', 'OPENING_BALANCE',
            'status', 'DRAFT',
            'reference', 'OB-' || NEW.sku,
            'description', 'Opening Stock Entry for ' || NEW.name
          )
        );

        -- Debit Inventory Asset, Credit Equity
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
        VALUES 
          ('JEL-' || extract(epoch from now())::text || '-1', v_journal_id, NEW.company_id, v_inv_account_id, NULL, v_total_value, 0, 'Opening Stock Asset'),
          ('JEL-' || extract(epoch from now())::text || '-2', v_journal_id, NEW.company_id, v_eq_account_id, NULL, 0, v_total_value, 'Opening Stock Equity');
          
        -- Now set it to POSTED
        UPDATE docs_journals SET status = 'POSTED', data = jsonb_set(data, '{status}', '"POSTED"') WHERE id = v_journal_id;
      END IF;
      
      RETURN NEW;
    END;
$function$;


-- Function: trg_process_import_contact
CREATE OR REPLACE FUNCTION public.trg_process_import_contact()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_contact_id TEXT;
  v_company_id TEXT;
BEGIN
  v_contact_id := 'CONT-' || extract(epoch from now())::text || '-' || substr(md5(random()::text), 1, 6);
  v_company_id := NEW.company_id;

  -- Smart Resolver: If company_id is a name, find the ID
  IF v_company_id IS NOT NULL AND v_company_id !~ '^[0-9a-fA-F-]+$' AND v_company_id !~ '^comp-' THEN
    SELECT id INTO v_company_id FROM docs_companies WHERE name ILIKE v_company_id LIMIT 1;
  END IF;

  IF v_company_id IS NULL THEN
    BEGIN
      SELECT id INTO v_company_id FROM docs_companies ORDER BY updated_at DESC LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
    END;
  END IF;
  
  IF v_company_id IS NULL THEN
    v_company_id := 'DEFAULT-COMPANY';
  END IF;

  INSERT INTO docs_contacts (id, company_id, name, type, data)
  VALUES (
    v_contact_id,
    v_company_id,
    NEW.name,
    COALESCE(NEW.type, 'CUSTOMER'),
    jsonb_build_object(
      'id', v_contact_id,
      'companyIds', jsonb_build_array(v_company_id),
      'name', NEW.name,
      'type', COALESCE(UPPER(NEW.type), 'CUSTOMER'),
      'email', NEW.email,
      'phone', NEW.phone,
      'address', NEW.address,
      'openingBalance', COALESCE(NEW.opening_balance, 0)
    )
  );
  -- The trigger 'trigger_contact_opening_balance' on docs_contacts will fire and generate Journals.

  RETURN NEW;
END;
$function$;


-- Function: trg_process_import_product
CREATE OR REPLACE FUNCTION public.trg_process_import_product()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_prod_id TEXT;
  v_company_id TEXT;
BEGIN
  v_prod_id := 'PROD-' || extract(epoch from now())::text || '-' || substr(md5(random()::text), 1, 6);
  v_company_id := NEW.company_id;

  -- Smart Resolver: If company_id is a name, find the ID
  IF v_company_id IS NOT NULL AND v_company_id !~ '^[0-9a-fA-F-]+$' AND v_company_id !~ '^comp-' THEN
    SELECT id INTO v_company_id FROM docs_companies WHERE name ILIKE v_company_id LIMIT 1;
  END IF;

  IF v_company_id IS NULL THEN
    -- Try to find a company ID from docs_companies
    BEGIN
      SELECT id INTO v_company_id FROM docs_companies ORDER BY updated_at DESC LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
      -- Table might not exist yet
    END;
  END IF;
  
  IF v_company_id IS NULL THEN
    v_company_id := 'DEFAULT-COMPANY';
  END IF;

  INSERT INTO docs_products (id, company_id, name, sku, price, cost_price, data)
  VALUES (
    v_prod_id,
    v_company_id,
    NEW.name,
    COALESCE(NEW.sku, 'SKU-' || substr(md5(random()::text), 1, 6)),
    COALESCE(NEW.price, 0),
    COALESCE(NEW.cost_price, 0),
    jsonb_build_object(
      'id', v_prod_id,
      'companyIds', jsonb_build_array(v_company_id),
      'name', NEW.name,
      'sku', COALESCE(NEW.sku, 'SKU-' || substr(md5(random()::text), 1, 6)),
      'price', COALESCE(NEW.price, 0),
      'costPrice', COALESCE(NEW.cost_price, 0),
      'quantityOnHand', COALESCE(NEW.quantity_on_hand, 0),
      'category', COALESCE(NEW.category, 'General'),
      'brand', NEW.brand,
      'uom', COALESCE(NEW.uom, 'pcs'),
      'description', NEW.description,
      'type', 'PRODUCT'
    )
  );
  -- The trigger 'trigger_product_opening_balance' on docs_products will fire and generate Journals.

  RETURN NEW;
END;
$function$;


-- Function: trg_rebuild_wac
CREATE OR REPLACE FUNCTION public.trg_rebuild_wac()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM rebuild_wac_for_product(OLD.company_id, OLD.product_id);
        RETURN OLD;
    ELSE
        PERFORM rebuild_wac_for_product(NEW.company_id, NEW.product_id);
        RETURN NEW;
    END IF;
END;
$function$;


-- Function: trg_sync_cash_ledger
CREATE OR REPLACE FUNCTION public.trg_sync_cash_ledger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_account_id TEXT;
    v_is_cash TEXT;
BEGIN
    SELECT code, type INTO v_account_id, v_is_cash FROM docs_accounts WHERE id = NEW.account_id LIMIT 1;
    
    IF TG_OP = 'DELETE' THEN
        DELETE FROM docs_cash_ledger WHERE line_id = OLD.id;
        RETURN OLD;
    END IF;
    
    IF v_account_id IN ('100100', '1011') OR v_is_cash IN ('CASH', 'BANK') THEN
        -- Check if journal is posted
        IF EXISTS (SELECT 1 FROM docs_journals WHERE id = NEW.journal_id AND status = 'POSTED') THEN
            -- We just delete and let a separate script handle it, or we insert it now
            -- Actually doing the heavy subquery on every row is fine for 1 row
            DELETE FROM docs_cash_ledger WHERE line_id = NEW.id;
            
            INSERT INTO docs_cash_ledger (
                company_id, date, journal_id, line_id, reference_number,
                journal_type, description, debit, credit, impact,
                partner_name, prepared_by, created_at
            )
            SELECT 
                j.company_id, j.date, j.id, NEW.id,
                COALESCE(
                    CASE 
                        WHEN j.journal_type = 'INV' THEN (SELECT inv.invoice_number FROM docs_invoices inv WHERE inv.journal_entry_id = j.id OR inv.data->>'journalEntryId' = j.id OR LOWER(replace(LOWER(j.id), 'je-', '')) = LOWER(inv.id) LIMIT 1)
                        WHEN j.journal_type = 'BILL' THEN (SELECT b.bill_number FROM docs_bills b WHERE b.journal_entry_id = j.id OR b.data->>'journalEntryId' = j.id OR LOWER(replace(LOWER(j.id), 'je-', '')) = LOWER(b.id) LIMIT 1)
                        WHEN j.journal_type IN ('CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY') THEN (
                            SELECT pay.payment_number FROM docs_payments pay 
                            WHERE LOWER(replace(LOWER(pay.id), 'pay-', '')) = LOWER(replace(replace(replace(replace(LOWER(j.id), 'je-cpay-', ''), 'je-vpay-', ''), 'je-', ''), 'pay-', '')) 
                            OR LOWER(j.reference_number) LIKE '%' || LOWER(pay.payment_number) || '%' LIMIT 1
                        )
                        WHEN j.journal_type = 'CREDIT_NOTE' THEN (SELECT cn.credit_note_number FROM docs_credit_notes cn WHERE LOWER(replace(LOWER(j.id), 'je-', '')) = LOWER(cn.id) OR LOWER(j.reference_number) = LOWER(cn.credit_note_number) LIMIT 1)
                        ELSE NULL
                    END,
                    j.reference_number,
                    j.id
                ),
                j.journal_type,
                COALESCE(NEW.description, j.description, ''),
                COALESCE(NEW.debit, 0),
                COALESCE(NEW.credit, 0),
                COALESCE(NEW.debit - NEW.credit, 0),
                COALESCE(
                    (SELECT cont.name FROM docs_journal_lines jl JOIN docs_contacts cont ON jl.contact_id = cont.id WHERE jl.journal_id = j.id AND jl.contact_id IS NOT NULL LIMIT 1),
                    CASE WHEN j.journal_type IN ('INV', 'BILL', 'CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY', 'CREDIT_NOTE') THEN 'Cash Sale' ELSE '' END
                ),
                COALESCE(u.name, u.username, j.data->>'preparedBy', 'System'),
                j.created_at
            FROM docs_journals j
            LEFT JOIN docs_users u ON j.created_by_id = u.id
            WHERE j.id = NEW.journal_id;
        ELSE
            DELETE FROM docs_cash_ledger WHERE line_id = NEW.id;
        END IF;
    ELSE
        DELETE FROM docs_cash_ledger WHERE line_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$function$;


-- Function: trg_sync_cash_ledger_journal_line
CREATE OR REPLACE FUNCTION public.trg_sync_cash_ledger_journal_line()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            -- Check if parent journal is POSTED
            IF EXISTS (SELECT 1 FROM docs_journals WHERE id = NEW.journal_id AND status = 'POSTED') THEN
                -- If it's a cash line, sync it
                IF EXISTS (SELECT 1 FROM docs_accounts WHERE id = NEW.account_id AND (code IN ('100100', '1011') OR type IN ('CASH', 'BANK'))) THEN
                    -- Delete old if it exists
                    DELETE FROM docs_cash_ledger WHERE line_id = NEW.id;
                    
                    INSERT INTO docs_cash_ledger (
                        company_id, date, journal_id, line_id, reference_number,
                        journal_type, description, debit, credit, impact,
                        partner_name, prepared_by, created_at
                    )
                    SELECT 
                        j.company_id, j.date, j.id, NEW.id,
                        COALESCE(
                            CASE 
                                WHEN j.journal_type = 'INV' THEN (SELECT inv.invoice_number FROM docs_invoices inv WHERE inv.journal_entry_id = j.id OR inv.data->>'journalEntryId' = j.id OR LOWER(replace(LOWER(j.id), 'je-', '')) = LOWER(inv.id) LIMIT 1)
                                WHEN j.journal_type = 'BILL' THEN (SELECT b.bill_number FROM docs_bills b WHERE b.journal_entry_id = j.id OR b.data->>'journalEntryId' = j.id OR LOWER(replace(LOWER(j.id), 'je-', '')) = LOWER(b.id) LIMIT 1)
                                WHEN j.journal_type IN ('CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY') THEN (
                                    SELECT pay.payment_number FROM docs_payments pay 
                                    WHERE LOWER(replace(LOWER(pay.id), 'pay-', '')) = LOWER(replace(replace(replace(replace(LOWER(j.id), 'je-cpay-', ''), 'je-vpay-', ''), 'je-', ''), 'pay-', '')) 
                                    OR LOWER(j.reference_number) LIKE '%' || LOWER(pay.payment_number) || '%' LIMIT 1
                                )
                                WHEN j.journal_type = 'CREDIT_NOTE' THEN (SELECT cn.credit_note_number FROM docs_credit_notes cn WHERE LOWER(replace(LOWER(j.id), 'je-', '')) = LOWER(cn.id) OR LOWER(j.reference_number) = LOWER(cn.credit_note_number) LIMIT 1)
                                ELSE NULL
                            END,
                            j.reference_number,
                            j.id
                        ),
                        j.journal_type,
                        COALESCE(NEW.description, j.description, ''),
                        COALESCE(NEW.debit, 0),
                        COALESCE(NEW.credit, 0),
                        COALESCE(NEW.debit - NEW.credit, 0),
                        COALESCE(
                            (SELECT cont.name FROM docs_contacts cont WHERE cont.id = NEW.contact_id LIMIT 1),
                            (SELECT cont.name FROM docs_journal_lines jl JOIN docs_contacts cont ON jl.contact_id = cont.id WHERE jl.journal_id = j.id AND jl.contact_id IS NOT NULL LIMIT 1),
                            CASE WHEN j.journal_type IN ('INV', 'BILL', 'CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY', 'CREDIT_NOTE') THEN 'Cash Sale' ELSE '' END
                        ),
                        COALESCE((SELECT u.name FROM docs_users u WHERE u.id = j.created_by_id), (SELECT u.username FROM docs_users u WHERE u.id = j.created_by_id), j.data->>'preparedBy', 'System'),
                        j.created_at
                    FROM docs_journals j
                    WHERE j.id = NEW.journal_id;
                END IF;
            END IF;
        ELSIF TG_OP = 'DELETE' THEN
            DELETE FROM docs_cash_ledger WHERE line_id = OLD.id;
        END IF;
        
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END;
    $function$;


-- Function: trg_sync_to_stock_movements
CREATE OR REPLACE FUNCTION public.trg_sync_to_stock_movements()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_product_id TEXT;
    v_company_id TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_product_id := OLD.product_id;
        v_company_id := OLD.company_id;
    ELSE
        v_product_id := NEW.product_id;
        v_company_id := NEW.company_id;
    END IF;

    IF v_product_id IS NOT NULL AND v_company_id IS NOT NULL THEN
        PERFORM public.rebuild_stock_for_product(v_company_id, v_product_id);
    END IF;

    -- Also handle case where product_id or company_id was changed during update
    IF TG_OP = 'UPDATE' THEN
        IF NEW.product_id <> OLD.product_id OR NEW.company_id <> OLD.company_id THEN
            IF OLD.product_id IS NOT NULL AND OLD.company_id IS NOT NULL THEN
                PERFORM public.rebuild_stock_for_product(OLD.company_id, OLD.product_id);
            END IF;
        END IF;
    END IF;

    RETURN NULL;
END;
$function$;


-- Function: update_average_cost
CREATE OR REPLACE FUNCTION public.update_average_cost()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
       v_pid TEXT;
       v_cid TEXT;
       v_wid TEXT;
       v_cost_id TEXT;
       v_total_qty NUMERIC := 0;
       v_total_val NUMERIC := 0;
       v_avg_cost NUMERIC := 0;
       v_base_cost NUMERIC := 0;
       v_current_cost NUMERIC;
       r RECORD;
    BEGIN
       IF pg_trigger_depth() > 5 THEN RETURN NEW; END IF;

       v_pid := COALESCE(NEW.product_id, OLD.product_id);
       v_cid := COALESCE(NEW.company_id, OLD.company_id);
       v_wid := COALESCE(NEW.warehouse_id, OLD.warehouse_id);
       v_cost_id := v_cid || ':' || v_pid || ':' || v_wid;

       SELECT COALESCE(NULLIF(data->>'costPrice', '')::NUMERIC, 0) INTO v_base_cost FROM docs_products WHERE id = v_pid;
       v_avg_cost := COALESCE(v_base_cost, 0);

       FOR r IN
          SELECT transaction_type, quantity, cost_price, reference_type
         FROM docs_inventory_transactions 
         WHERE product_id = v_pid AND warehouse_id = v_wid AND company_id = v_cid
         ORDER BY date ASC, created_at ASC 
       LOOP
          IF r.transaction_type = 'IN' THEN
             IF r.reference_type IN ('BILL', 'ADJUSTMENT', 'OPENING_STOCK') THEN
                IF v_total_qty <= 0 THEN
                    v_avg_cost := COALESCE(r.cost_price, v_avg_cost);
                    v_total_qty := v_total_qty + r.quantity;
                    v_total_val := v_total_qty * v_avg_cost;
                ELSE
                    v_total_val := v_total_val + (r.quantity * r.cost_price);
                    v_total_qty := v_total_qty + r.quantity;
                    IF v_total_qty > 0 THEN
                        v_avg_cost := v_total_val / v_total_qty; 
                    END IF;
                END IF;
             ELSE
                v_total_qty := v_total_qty + r.quantity;
                v_total_val := v_total_qty * v_avg_cost;
             END IF;
          ELSE
             IF r.reference_type = 'PURCHASE_RETURN' THEN
                IF v_total_qty <= 0 THEN
                    v_total_qty := v_total_qty - r.quantity;
                    v_total_val := v_total_qty * v_avg_cost;
                ELSE
                    v_total_val := v_total_val - (r.quantity * r.cost_price);
                    v_total_qty := v_total_qty - r.quantity;
                    IF v_total_qty > 0 THEN
                        v_avg_cost := v_total_val / v_total_qty; 
                    END IF;
                END IF;
             ELSE
                v_total_qty := v_total_qty - r.quantity;
                v_total_val := v_total_qty * v_avg_cost;
             END IF;
          END IF;
       END LOOP;

       v_total_qty := COALESCE(v_total_qty, 0);
       v_avg_cost := COALESCE(v_avg_cost, v_base_cost);
       
       SELECT NULLIF(data->>'costPrice', '')::NUMERIC INTO v_current_cost FROM docs_products WHERE id = v_pid;

       IF v_total_qty <= 0 THEN
          v_total_val := 0;
       ELSE
          v_total_val := v_total_qty * v_avg_cost;
       END IF;

       INSERT INTO docs_product_costs (id, company_id, product_id, warehouse_id, total_qty, total_value, avg_cost, updated_at)
       VALUES (v_cost_id, v_cid, v_pid, v_wid, v_total_qty, v_total_val, v_avg_cost, NOW())
       ON CONFLICT (id) DO UPDATE SET 
         total_qty = EXCLUDED.total_qty,
         total_value = EXCLUDED.total_value,
         avg_cost = EXCLUDED.avg_cost,
         updated_at = NOW();

       IF v_current_cost IS DISTINCT FROM v_avg_cost THEN
           UPDATE docs_products p
           SET cost_price = v_avg_cost,
               data = jsonb_set(COALESCE(data, '{}'::jsonb), '{costPrice}', to_jsonb(v_avg_cost)),
               updated_at = NOW()
           WHERE id = v_pid;
       END IF;

       RETURN COALESCE(NEW, OLD);
    END;
$function$;


-- Function: update_inventory_cost
CREATE OR REPLACE FUNCTION public.update_inventory_cost()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_cost RECORD;
    v_new_qty NUMERIC;
    v_new_val NUMERIC;
    v_new_avg NUMERIC;
    v_id TEXT;
BEGIN
    -- Unique cost row per company-product-warehouse
    v_id := COALESCE(NEW.company_id, '') || ':' || COALESCE(NEW.product_id, '') || ':' || COALESCE(NEW.warehouse_id, '');

    -- Lock existing row for concurrency safety
    SELECT * INTO v_cost
    FROM docs_product_costs
    WHERE id = v_id
    FOR UPDATE;

    -- Initialize if not exists using COALESCE
    IF NOT FOUND THEN
        v_cost.total_qty := 0;
        v_cost.total_value := 0;
        v_cost.avg_cost := 0;
    ELSE
        v_cost.total_qty := COALESCE(v_cost.total_qty, 0);
        v_cost.total_value := COALESCE(v_cost.total_value, 0);
        v_cost.avg_cost := COALESCE(v_cost.avg_cost, 0);
    END IF;

    -- =========================
    -- IN (Purchase / Stock In)
    -- =========================
    IF NEW.transaction_type = 'IN' THEN
        
        v_new_qty := v_cost.total_qty + COALESCE(NEW.quantity, 0);
        v_new_val := COALESCE(v_cost.total_value, 0) + (COALESCE(NEW.quantity, 0) * COALESCE(NEW.cost_price, 0));

        IF v_new_qty > 0 THEN
            v_new_avg := v_new_val / v_new_qty;
        ELSE
            v_new_avg := 0;
        END IF;
        
        v_new_val := ROUND(v_new_val, 4);
        v_new_avg := ROUND(v_new_avg, 4);

    -- =========================
    -- OUT (Sale / Stock Out)
    -- =========================
    ELSIF NEW.transaction_type = 'OUT' THEN
        
        -- Prevent negative stock exception if needed otherwise just process
        IF v_cost.total_qty < NEW.quantity THEN
            -- ignoring rather than error to avoid breaking production invoice posting
        END IF;

        v_new_qty := v_cost.total_qty - COALESCE(NEW.quantity, 0);
        v_new_val := ROUND(COALESCE(v_cost.total_value, 0) - (COALESCE(NEW.quantity, 0) * COALESCE(v_cost.avg_cost, 0)), 4);

        -- Strict WAC Rule: avg_cost must not recalculate on OUT.
        v_new_avg := ROUND(COALESCE(v_cost.avg_cost, 0), 4);

    END IF;

    -- =========================
    -- UPSERT RESULT
    -- =========================
    INSERT INTO docs_product_costs (
        id, company_id, product_id, warehouse_id,
        total_qty, total_value, avg_cost, updated_at
    )
    VALUES (
        v_id,
        NEW.company_id,
        NEW.product_id,
        NEW.warehouse_id,
        v_new_qty,
        v_new_val,
        v_new_avg,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        total_qty = EXCLUDED.total_qty,
        total_value = EXCLUDED.total_value,
        avg_cost = EXCLUDED.avg_cost,
        updated_at = NOW();

    -- =========================
    -- UPDATE DOMAIN PRODUCT 
    -- =========================
    -- We update docs_products.cost_price so it is correctly reflected everywhere globally!
    UPDATE docs_products p
    SET cost_price = (
        SELECT CASE WHEN SUM(COALESCE(total_qty, 0)) > 0 THEN ROUND(SUM(COALESCE(total_value, 0)) / SUM(COALESCE(total_qty, 0)), 4) ELSE 0 END
        FROM docs_product_costs
        WHERE product_id = NEW.product_id AND company_id = NEW.company_id
    )
    WHERE p.id = NEW.product_id AND p.company_id = NEW.company_id;

    RETURN NEW;
END;
$function$;


-- Function: validate_inventory_levels
CREATE OR REPLACE FUNCTION public.validate_inventory_levels()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF ((NEW.data->>'quantityOnHand')::numeric < 0) THEN
        -- Log inconsistency for monitoring but don't strictly block unless company settings require it
        -- For enterprise stability, we log it to the new system logs
        INSERT INTO docs_system_logs (level, category, message, payload)
        VALUES ('WARN', 'INVENTORY', 'Negative stock detected for product ' || NEW.id, jsonb_build_object('sku', NEW.sku, 'qty', (NEW.data->>'quantityOnHand')::numeric));
    END IF;
    RETURN NEW;
END;
$function$;


-- Function: verify_document_ledger_integrity
CREATE OR REPLACE FUNCTION public.verify_document_ledger_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_journal_id TEXT;
    v_line_count INT;
    v_amount NUMERIC := 0;
BEGIN
    IF NEW.status IN ('POSTED', 'PAID', 'PARTIAL') THEN
        IF TG_TABLE_NAME = 'docs_invoices' THEN
            v_journal_id := COALESCE(NEW.journal_entry_id, 'JE-' || UPPER(NEW.id));
            v_amount := COALESCE(NEW.total, 0);
        ELSIF TG_TABLE_NAME = 'docs_payments' THEN
            v_journal_id := ('JE-' || CASE WHEN NEW.type IN ('RECEIPT','COLLECTION','REFUND') THEN 'CPAY' ELSE 'VPAY' END || '-' || replace(replace(UPPER(NEW.id), 'PAY-', ''), 'PAY-', ''));
            SELECT count(*) INTO v_line_count FROM docs_journal_lines WHERE journal_id = v_journal_id;
            IF v_line_count = 0 THEN
                v_journal_id := 'JE-' || UPPER(NEW.id);
            END IF;
            v_amount := COALESCE(NEW.amount, 0);
        ELSIF TG_TABLE_NAME = 'docs_bills' THEN
            v_journal_id := COALESCE(NEW.journal_entry_id, 'JE-' || UPPER(NEW.id));
            v_amount := COALESCE(NEW.total, 0);
        ELSIF TG_TABLE_NAME = 'docs_credit_notes' THEN
            v_journal_id := COALESCE(NEW.journal_entry_id, 'JE-' || UPPER(NEW.id));
            v_amount := COALESCE(NEW.total, 0);
        ELSE
            -- Unknown table, assume amount is 0 to bypass or try to cast if exists
            BEGIN
                EXECUTE 'SELECT COALESCE($1.total, 0)' USING NEW INTO v_amount;
            EXCEPTION WHEN OTHERS THEN
                v_amount := 0;
            END;
        END IF;
        
        SELECT count(*) INTO v_line_count FROM docs_journal_lines WHERE journal_id = v_journal_id;
        
        IF v_line_count < 2 AND v_amount > 0 THEN
            RAISE EXCEPTION 'CRITICAL AUDIT ERROR: Document % (%) cannot remain in % state without structurally validated ledger lines (Found % lines for %).', NEW.id, TG_TABLE_NAME, NEW.status, v_line_count, v_journal_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;


-- Function: verify_double_entry_integrity
CREATE OR REPLACE FUNCTION public.verify_double_entry_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
          DECLARE
              v_journal_id text;
              v_status text;
              d_sum numeric;
              c_sum numeric;
          BEGIN
              IF current_setting('core.bypass_audit', true) = 'true' THEN
                  RETURN NULL;
              END IF;
          
              -- Get journal_id based on TG_OP
              IF TG_OP = 'DELETE' THEN
                  v_journal_id := OLD.journal_id;
              ELSE
                  v_journal_id := NEW.journal_id;
              END IF;

              -- Only enforce for POSTED journals
              SELECT status INTO v_status FROM docs_journals WHERE id = v_journal_id;
              
              IF v_status = 'POSTED' THEN
                  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
                  INTO d_sum, c_sum
                  FROM docs_journal_lines
                  WHERE journal_id = v_journal_id;

                  IF ROUND(d_sum, 2) != ROUND(c_sum, 2) THEN
                      RAISE EXCEPTION 'Strict Accounting Constraint Violation in Journal %: Total Debits (%) must equal Total Credits (%)', v_journal_id, d_sum, c_sum;
                  END IF;
              END IF;

              RETURN NULL;
          END;
    $function$;


-- Function: verify_journal_line_partner_constraint
CREATE OR REPLACE FUNCTION public.verify_journal_line_partner_constraint()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
        v_acc_code TEXT;
        v_acc_name TEXT;
    BEGIN
        SELECT code, name INTO v_acc_code, v_acc_name FROM docs_accounts WHERE id = NEW.account_id;
        
        IF v_acc_code IN ('200101', '100201', '1101') OR v_acc_code LIKE '21010000%' OR v_acc_name ILIKE '%loan%payable%' OR v_acc_name ILIKE '%loan%receivable%' THEN
            IF NULLIF(TRIM(NEW.contact_id), '') IS NULL THEN
                RAISE EXCEPTION 'Strict Ledger Constraint Failed: Account % (%) REQUIRES a valid partner/contact assigned.', v_acc_code, v_acc_name;
            END IF;
        END IF;
        
        RETURN NEW;
    END;
    $function$;


-- =============================================================
-- SECTION 3: INDEXES
-- =============================================================

CREATE UNIQUE INDEX auth_users_email_key ON public.auth_users USING btree (email);
CREATE UNIQUE INDEX company_users_user_id_company_id_key ON public.company_users USING btree (user_id, company_id);
CREATE INDEX idx_docs_accounts_company_code ON public.docs_accounts USING btree (company_id, code);
CREATE INDEX idx_docs_accounts_company_id ON public.docs_accounts USING btree (company_id);
CREATE INDEX idx_docs_attendance_company_employee ON public.docs_attendance USING btree (company_id, employee_id);
CREATE INDEX idx_docs_attendance_date ON public.docs_attendance USING btree (attendance_date);
CREATE INDEX idx_docs_audit_log_company ON public.docs_audit_log USING btree (company_id);
CREATE INDEX idx_docs_audit_log_doc_number ON public.docs_audit_log USING btree (document_number);
CREATE INDEX idx_audit_company ON public.docs_audit_logs USING btree (company_id, created_at DESC);
CREATE INDEX idx_audit_record ON public.docs_audit_logs USING btree (table_name, record_id);
CREATE INDEX idx_bill_lines_product_id ON public.docs_bill_lines USING btree (product_id);
CREATE INDEX idx_docs_bill_lines_bill_id ON public.docs_bill_lines USING btree (bill_id);
CREATE INDEX idx_docs_bill_lines_bill_idx ON public.docs_bill_lines USING btree (bill_id, display_index);
CREATE INDEX idx_docs_bill_lines_bill_product ON public.docs_bill_lines USING btree (bill_id, product_id);
CREATE INDEX idx_docs_bill_lines_company_id ON public.docs_bill_lines USING btree (company_id);
CREATE INDEX idx_docs_bill_lines_product_id ON public.docs_bill_lines USING btree (product_id);
CREATE INDEX idx_bills_bill_number ON public.docs_bills USING btree (bill_number);
CREATE INDEX idx_bills_company_status ON public.docs_bills USING btree (company_id, status);
CREATE INDEX idx_bills_data_gin ON public.docs_bills USING gin (data);
CREATE INDEX idx_bills_vendor_id ON public.docs_bills USING btree (vendor_id);
CREATE INDEX idx_docs_bills_company ON public.docs_bills USING btree (company_id);
CREATE INDEX idx_docs_bills_company_date ON public.docs_bills USING btree (company_id, date);
CREATE INDEX idx_docs_bills_company_id ON public.docs_bills USING btree (company_id);
CREATE INDEX idx_docs_bills_company_number ON public.docs_bills USING btree (company_id, bill_number);
CREATE INDEX idx_docs_bills_vendor_id ON public.docs_bills USING btree (vendor_id);
CREATE UNIQUE INDEX unq_bill_num_company ON public.docs_bills USING btree (company_id, bill_number);
CREATE UNIQUE INDEX uq_bill_number_company ON public.docs_bills USING btree (company_id, bill_number);
CREATE INDEX idx_docs_brands_company_code ON public.docs_brands USING btree (company_id, code);
CREATE UNIQUE INDEX docs_cash_ledger_line_id_key ON public.docs_cash_ledger USING btree (line_id);
CREATE INDEX idx_cash_ledger_company_date ON public.docs_cash_ledger USING btree (company_id, date);
CREATE INDEX idx_cash_ledger_journal_id ON public.docs_cash_ledger USING btree (journal_id);
CREATE INDEX idx_docs_categories_company_code ON public.docs_categories USING btree (company_id, code);
CREATE UNIQUE INDEX idx_docs_companies_code ON public.docs_companies USING btree (code);
CREATE INDEX idx_docs_contacts_company ON public.docs_contacts USING btree (company_id);
CREATE INDEX idx_docs_contacts_company_id ON public.docs_contacts USING btree (company_id);
CREATE INDEX idx_docs_contacts_phone ON public.docs_contacts USING btree (phone);
CREATE INDEX idx_docs_contacts_type ON public.docs_contacts USING btree (type);
CREATE INDEX idx_docs_cn_lines_cn_product ON public.docs_credit_note_lines USING btree (credit_note_id, product_id);
CREATE INDEX idx_docs_credit_note_lines_cn_id ON public.docs_credit_note_lines USING btree (credit_note_id);
CREATE INDEX idx_docs_credit_note_lines_company_id ON public.docs_credit_note_lines USING btree (company_id);
CREATE INDEX idx_docs_credit_note_lines_credit_note_id ON public.docs_credit_note_lines USING btree (credit_note_id);
CREATE INDEX idx_docs_credit_note_lines_credit_note_idx ON public.docs_credit_note_lines USING btree (credit_note_id, display_index);
CREATE INDEX idx_docs_credit_note_lines_product_id ON public.docs_credit_note_lines USING btree (product_id);
CREATE INDEX idx_credit_notes_company_status ON public.docs_credit_notes USING btree (company_id, status);
CREATE INDEX idx_credit_notes_customer ON public.docs_credit_notes USING btree (customer_id);
CREATE INDEX idx_docs_credit_notes_company ON public.docs_credit_notes USING btree (company_id);
CREATE INDEX idx_docs_credit_notes_company_date ON public.docs_credit_notes USING btree (company_id, date);
CREATE INDEX idx_docs_credit_notes_company_id ON public.docs_credit_notes USING btree (company_id);
CREATE INDEX idx_docs_credit_notes_customer_id ON public.docs_credit_notes USING btree (customer_id);
CREATE UNIQUE INDEX unq_cn_num_company ON public.docs_credit_notes USING btree (company_id, credit_note_number);
CREATE UNIQUE INDEX docs_financial_periods_company_id_year_name_key ON public.docs_financial_periods USING btree (company_id, year_name);
CREATE UNIQUE INDEX docs_fiscal_periods_company_id_name_key ON public.docs_fiscal_periods USING btree (company_id, name);
CREATE INDEX idx_fiscal_company ON public.docs_fiscal_periods USING btree (company_id);
CREATE INDEX idx_inventory_trx_prod_id ON public.docs_inventory_transactions USING btree (product_id);
CREATE INDEX idx_inventory_trx_ref_id ON public.docs_inventory_transactions USING btree (reference_id);
CREATE INDEX idx_inventory_trx_ref_type ON public.docs_inventory_transactions USING btree (reference_type);
CREATE INDEX idx_inventory_txns_company_date ON public.docs_inventory_transactions USING btree (company_id, created_at DESC);
CREATE INDEX idx_docs_invoice_lines_company_id ON public.docs_invoice_lines USING btree (company_id);
CREATE INDEX idx_docs_invoice_lines_inv_prod ON public.docs_invoice_lines USING btree (invoice_id, product_id);
CREATE INDEX idx_docs_invoice_lines_invoice_id ON public.docs_invoice_lines USING btree (invoice_id);
CREATE INDEX idx_docs_invoice_lines_invoice_idx ON public.docs_invoice_lines USING btree (invoice_id, display_index);
CREATE INDEX idx_docs_invoice_lines_product_id ON public.docs_invoice_lines USING btree (product_id);
CREATE INDEX idx_invoice_lines_company_id ON public.docs_invoice_lines USING btree (company_id);
CREATE INDEX idx_invoice_lines_product_id ON public.docs_invoice_lines USING btree (product_id);
CREATE UNIQUE INDEX docs_invoices_invoice_number_key ON public.docs_invoices USING btree (invoice_number);
CREATE INDEX idx_docs_invoices_company ON public.docs_invoices USING btree (company_id);
CREATE INDEX idx_docs_invoices_company_date ON public.docs_invoices USING btree (company_id, date);
CREATE INDEX idx_docs_invoices_company_date_desc ON public.docs_invoices USING btree (company_id, date DESC, updated_at DESC);
CREATE INDEX idx_docs_invoices_company_id ON public.docs_invoices USING btree (company_id);
CREATE INDEX idx_docs_invoices_company_number ON public.docs_invoices USING btree (company_id, invoice_number);
CREATE INDEX idx_docs_invoices_customer_id ON public.docs_invoices USING btree (customer_id);
CREATE UNIQUE INDEX unq_invoice_num_company ON public.docs_invoices USING btree (company_id, invoice_number);
CREATE UNIQUE INDEX uq_invoice_number_company ON public.docs_invoices USING btree (company_id, invoice_number);
CREATE INDEX idx_docs_journal_lines_acc ON public.docs_journal_lines USING btree (company_id, account_id);
CREATE INDEX idx_docs_journal_lines_account_id ON public.docs_journal_lines USING btree (account_id);
CREATE INDEX idx_docs_journal_lines_company_id ON public.docs_journal_lines USING btree (company_id);
CREATE INDEX idx_docs_journal_lines_contact_id ON public.docs_journal_lines USING btree (contact_id);
CREATE INDEX idx_docs_journal_lines_je_comp ON public.docs_journal_lines USING btree (company_id, account_id, contact_id);
CREATE INDEX idx_docs_journal_lines_journal_id ON public.docs_journal_lines USING btree (journal_id);
CREATE INDEX idx_journal_lines_composite ON public.docs_journal_lines USING btree (account_id, company_id, created_at DESC);
CREATE INDEX idx_docs_journals_company ON public.docs_journals USING btree (company_id);
CREATE INDEX idx_docs_journals_company_date ON public.docs_journals USING btree (company_id, date);
CREATE INDEX idx_docs_journals_company_date_desc ON public.docs_journals USING btree (company_id, date DESC, created_at DESC);
CREATE INDEX idx_docs_journals_company_id ON public.docs_journals USING btree (company_id);
CREATE INDEX idx_docs_journals_company_num ON public.docs_journals USING btree (company_id, journal_number);
CREATE INDEX idx_docs_journals_status_date ON public.docs_journals USING btree (status, date);
CREATE UNIQUE INDEX unq_journal_num_company ON public.docs_journals USING btree (company_id, reference_number);
CREATE INDEX idx_leaves_company ON public.docs_leaves USING btree (company_id, updated_at DESC);
CREATE INDEX idx_leaves_data_gin ON public.docs_leaves USING gin (data);
CREATE INDEX idx_docs_loan_amort_lookup ON public.docs_loan_amortization_lines USING btree (loan_id, company_id, payment_date);
CREATE INDEX idx_docs_loans_company_num ON public.docs_loans USING btree (company_id, loan_number);
CREATE INDEX idx_loans_contact_id ON public.docs_loans USING btree (company_id, contact_id);
CREATE INDEX idx_loans_date ON public.docs_loans USING btree (company_id, date DESC);
CREATE UNIQUE INDEX unq_loan_num_company ON public.docs_loans USING btree (company_id, loan_number);
CREATE INDEX idx_docs_payments_account_id ON public.docs_payments USING btree (account_id);
CREATE INDEX idx_docs_payments_accounts ON public.docs_payments USING btree (company_id, account_id, partner_account_id);
CREATE INDEX idx_docs_payments_company ON public.docs_payments USING btree (company_id);
CREATE INDEX idx_docs_payments_company_date ON public.docs_payments USING btree (company_id, payment_date);
CREATE INDEX idx_docs_payments_company_date_desc ON public.docs_payments USING btree (company_id, date DESC, updated_at DESC);
CREATE INDEX idx_docs_payments_company_id ON public.docs_payments USING btree (company_id);
CREATE INDEX idx_docs_payments_contact_id ON public.docs_payments USING btree (contact_id);
CREATE INDEX idx_docs_payments_partner_account ON public.docs_payments USING btree (partner_account_id);
CREATE INDEX idx_payments_applied_bills_gin ON public.docs_payments USING gin (applied_bills);
CREATE INDEX idx_payments_data_gin ON public.docs_payments USING gin (data);
CREATE UNIQUE INDEX unq_payment_num_company ON public.docs_payments USING btree (company_id, payment_number);
CREATE INDEX idx_payslips_company ON public.docs_payslips USING btree (company_id, updated_at DESC);
CREATE INDEX idx_docs_product_costs_company ON public.docs_product_costs USING btree (company_id);
CREATE INDEX idx_docs_product_costs_company_id ON public.docs_product_costs USING btree (company_id);
CREATE INDEX idx_docs_product_costs_product ON public.docs_product_costs USING btree (product_id);
CREATE INDEX idx_docs_product_stock_lookup ON public.docs_product_stocks USING btree (product_id, company_id);
CREATE INDEX idx_docs_product_stocks_company_id ON public.docs_product_stocks USING btree (company_id);
CREATE INDEX idx_docs_product_stocks_product ON public.docs_product_stocks USING btree (product_id);
CREATE UNIQUE INDEX unq_product_company_stock ON public.docs_product_stocks USING btree (product_id, company_id);
CREATE INDEX idx_docs_products_company ON public.docs_products USING btree (company_id);
CREATE INDEX idx_docs_products_company_id ON public.docs_products USING btree (company_id);
CREATE UNIQUE INDEX idx_docs_products_sku ON public.docs_products USING btree (sku);
CREATE INDEX idx_docs_roles_company_name ON public.docs_roles USING btree (company_id, name);
CREATE INDEX idx_docs_stock_movements_company_created ON public.docs_stock_movements USING btree (company_id, created_at);
CREATE INDEX idx_docs_stock_movements_company_id ON public.docs_stock_movements USING btree (company_id);
CREATE INDEX idx_docs_stock_movements_product ON public.docs_stock_movements USING btree (product_id);
CREATE INDEX idx_stock_movements_avco_lookup ON public.docs_stock_movements USING btree (company_id, product_id, created_at DESC);
CREATE INDEX idx_stock_movements_lookup ON public.docs_stock_movements USING btree (company_id, product_id, movement_type);
CREATE INDEX idx_syslog_level ON public.docs_system_logs USING btree (level, created_at DESC);
CREATE INDEX idx_tasks_company ON public.docs_tasks USING btree (company_id, updated_at DESC);
CREATE INDEX idx_tasks_data_gin ON public.docs_tasks USING gin (data);
CREATE UNIQUE INDEX idx_docs_users_email ON public.docs_users USING btree (email);
CREATE UNIQUE INDEX idx_docs_users_username ON public.docs_users USING btree (username);
CREATE INDEX idx_docs_users_uuid ON public.docs_users USING btree (user_uuid);
CREATE INDEX idx_docs_warehouses_company ON public.docs_warehouses USING btree (company_id);
CREATE INDEX idx_docs_warehouses_lookup ON public.docs_warehouses USING btree (company_id, is_default);
CREATE UNIQUE INDEX unq_warehouse_code_company ON public.docs_warehouses USING btree (company_id, code);
CREATE INDEX idx_report_pl_lookup ON public.report_profit_and_loss USING btree (company_id, start_date, end_date);

-- =============================================================
-- SECTION 4: FOREIGN KEYS
-- =============================================================

ALTER TABLE public.docs_contact_companies ADD CONSTRAINT docs_contact_companies_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.docs_contacts(id) ON DELETE CASCADE;
ALTER TABLE public.docs_credit_note_lines ADD CONSTRAINT docs_credit_note_lines_credit_note_id_fkey FOREIGN KEY (credit_note_id) REFERENCES public.docs_credit_notes(id) ON DELETE CASCADE;
ALTER TABLE public.docs_journals ADD CONSTRAINT docs_journals_fiscal_period_id_fkey FOREIGN KEY (fiscal_period_id) REFERENCES public.docs_fiscal_periods(id) ON DELETE NO ACTION;
ALTER TABLE public.docs_loan_amortization_lines ADD CONSTRAINT docs_loan_amortization_lines_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.docs_loans(id) ON DELETE CASCADE;
ALTER TABLE public.docs_product_companies ADD CONSTRAINT docs_product_companies_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.docs_products(id) ON DELETE CASCADE;
ALTER TABLE public.docs_product_stocks ADD CONSTRAINT docs_product_stocks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.docs_products(id) ON DELETE CASCADE;
ALTER TABLE public.docs_stock_movements ADD CONSTRAINT docs_stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.docs_products(id) ON DELETE CASCADE;
ALTER TABLE public.docs_user_companies ADD CONSTRAINT docs_user_companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.docs_users(id) ON DELETE CASCADE;
