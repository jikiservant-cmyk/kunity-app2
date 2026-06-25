-- supabase/migrations/04_insert_rls_policies.sql
-- Fix permission denied errors by adding INSERT, UPDATE, SELECT policies

-- ==============================================================================
-- 1. Organizations policies (needed to create default org)
-- ==============================================================================
ALTER TABLE kuntiy.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view organizations"
ON kuntiy.organizations FOR SELECT
USING (true);

CREATE POLICY "Allow inserting organizations"
ON kuntiy.organizations FOR INSERT
WITH CHECK (true);

-- ==============================================================================
-- 2. Profiles policies (needed for user sign up)
-- ==============================================================================
CREATE POLICY "Allow inserting profiles"
ON kuntiy.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- ==============================================================================
-- 3. Members policies
-- ==============================================================================
ALTER TABLE kuntiy.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members in their organization"
ON kuntiy.members FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM kuntiy.profiles WHERE id = auth.uid()
));

CREATE POLICY "Allow inserting members"
ON kuntiy.members FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own member record"
ON kuntiy.members FOR UPDATE
USING (id = auth.uid());

-- ==============================================================================
-- 4. Saving products policies
-- ==============================================================================
CREATE POLICY "Anyone can view saving products"
ON kuntiy.saving_products FOR SELECT
USING (true);

CREATE POLICY "Allow inserting saving products"
ON kuntiy.saving_products FOR INSERT
WITH CHECK (true);

-- ==============================================================================
-- 5. Member savings policies
-- ==============================================================================
ALTER TABLE kuntiy.member_savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own member savings"
ON kuntiy.member_savings FOR SELECT
USING (member_id = auth.uid());

CREATE POLICY "Allow inserting member savings"
ON kuntiy.member_savings FOR INSERT
WITH CHECK (member_id = auth.uid());

-- ==============================================================================
-- 6. Payment requests policies
-- ==============================================================================
ALTER TABLE kuntiy.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment requests"
ON kuntiy.payment_requests FOR SELECT
USING (member_id = auth.uid());

CREATE POLICY "Allow inserting payment requests"
ON kuntiy.payment_requests FOR INSERT
WITH CHECK (member_id = auth.uid());

CREATE POLICY "Allow updating payment requests"
ON kuntiy.payment_requests FOR UPDATE
USING (true);

-- ==============================================================================
-- 7. Sacco wallets policies
-- ==============================================================================
ALTER TABLE kuntiy.sacco_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sacco wallets in their organization"
ON kuntiy.sacco_wallets FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM kuntiy.profiles WHERE id = auth.uid()
));
