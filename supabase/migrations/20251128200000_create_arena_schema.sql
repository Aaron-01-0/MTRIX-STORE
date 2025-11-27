-- Create Voting Periods Table
CREATE TABLE IF NOT EXISTS public.voting_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Arena Designs Table
CREATE TABLE IF NOT EXISTS public.arena_designs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    mockup_url TEXT, -- Optional secondary image
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'voting', 'paused')),
    voting_period_id UUID REFERENCES public.voting_periods(id) ON DELETE SET NULL,
    votes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    category TEXT,
    tags TEXT[],
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Arena Votes Table
CREATE TABLE IF NOT EXISTS public.arena_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    design_id UUID REFERENCES public.arena_designs(id) ON DELETE CASCADE NOT NULL,
    voting_period_id UUID REFERENCES public.voting_periods(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure one vote per user per design per period
    UNIQUE(user_id, design_id, voting_period_id)
);

-- Update Coupons Table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'promo' CHECK (type IN ('promo', 'designer', 'voter')),
ADD COLUMN IF NOT EXISTS user_limit INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS issued_to_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Create User Coupons Table (Wallet)
CREATE TABLE IF NOT EXISTS public.user_coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    UNIQUE(user_id, coupon_id) -- Prevent duplicate assignment of same coupon to same user
);

-- Enable RLS
ALTER TABLE public.voting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Voting Periods: Public Read, Admin Write
CREATE POLICY "Public can view voting periods" ON public.voting_periods
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage voting periods" ON public.voting_periods
    FOR ALL USING (public.is_admin());

-- Arena Designs: Public Read (Approved/Voting), User Manage Own (Draft), Admin Manage All
CREATE POLICY "Public can view approved designs" ON public.arena_designs
    FOR SELECT USING (status IN ('approved', 'voting', 'ended'));

CREATE POLICY "Users can view own designs" ON public.arena_designs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own designs" ON public.arena_designs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft designs" ON public.arena_designs
    FOR UPDATE USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Admins can manage all designs" ON public.arena_designs
    FOR ALL USING (public.is_admin());

-- Arena Votes: Public Read (Aggregates), User Insert (Vote), No Update/Delete (Immutable)
CREATE POLICY "Public can view votes" ON public.arena_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote" ON public.arena_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Coupons: User Read Own, Admin Manage All
CREATE POLICY "Users can view own coupons" ON public.user_coupons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user coupons" ON public.user_coupons
    FOR ALL USING (public.is_admin());

-- Function to auto-increment vote count
CREATE OR REPLACE FUNCTION public.increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.arena_designs
    SET votes_count = votes_count + 1
    WHERE id = NEW.design_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for vote count
CREATE TRIGGER on_vote_cast
    AFTER INSERT ON public.arena_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_vote_count();
