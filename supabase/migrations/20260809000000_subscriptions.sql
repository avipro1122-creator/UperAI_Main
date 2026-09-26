-- Subscriptions table to track Razorpay customer and subscription reference IDs
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  google_sub TEXT,
  email TEXT,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  billing_frequency TEXT NOT NULL DEFAULT 'monthly',
  price_inr NUMERIC NOT NULL DEFAULT 199,
  currency TEXT NOT NULL DEFAULT 'INR',
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT,
  razorpay_plan_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_cycle_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning fast lookups by google_sub or user_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_google_sub ON public.subscriptions(google_sub);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_sub_id ON public.subscriptions(razorpay_subscription_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own subscription records
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (
    auth.uid()::text = user_id OR
    current_setting('request.jwt.claims', true)::json->>'sub' = google_sub
  );
