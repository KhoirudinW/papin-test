-- ============================================================
-- PAPin Test — Supabase Database Migration
-- Jalankan file ini sekali di Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────────────────────
-- 2. TABEL: user_profiles
--    Profil user, linked ke Supabase Auth (auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pair_id      UUID,                          -- FK ke pair (future feature)
  email        TEXT,
  full_name    TEXT,
  name         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON public.user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_pair_id ON public.user_profiles(pair_id) WHERE pair_id IS NOT NULL;

-- RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Service role can do anything (for server-side ops via supabaseAdmin)
CREATE POLICY "Service role full access to user_profiles"
  ON public.user_profiles
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- 3. TRIGGER: auto-create user_profiles on signup
--    Dipanggil setelah INSERT ke auth.users
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (auth_user_id, email, full_name, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (auth_user_id) DO NOTHING;  -- idempotent: skip jika sudah ada
  RETURN NEW;
END;
$$;

-- Drop dulu jika sudah ada, lalu buat ulang
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 4. TABEL: tests_catalog
--    Daftar test yang tersedia
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tests_catalog (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price       INTEGER NOT NULL DEFAULT 0,   -- dalam IDR, 0 = gratis
  is_free     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tests_catalog_slug ON public.tests_catalog(slug);
CREATE INDEX IF NOT EXISTS idx_tests_catalog_is_active ON public.tests_catalog(is_active);

-- RLS: semua user bisa baca (katalog adalah publik)
ALTER TABLE public.tests_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active tests"
  ON public.tests_catalog FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Service role full access to tests_catalog"
  ON public.tests_catalog
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- 5. TABEL: plans
--    Paket subscription (Simple, Pro, dll)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,     -- 'simple', 'pro', dll
  description TEXT NOT NULL DEFAULT '',
  price       INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans"
  ON public.plans FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Service role full access to plans"
  ON public.plans
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- 6. TABEL: subscriptions
--    Status subscription aktif per pair
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id     UUID NOT NULL,
  plan_id     UUID REFERENCES public.plans(id),
  status      TEXT NOT NULL DEFAULT 'active',   -- 'active' | 'expired' | 'canceled'
  start_date  TIMESTAMPTZ,
  end_date    TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_pair_id ON public.subscriptions(pair_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pair subscription"
  ON public.subscriptions FOR SELECT
  USING (
    pair_id IN (
      SELECT pair_id FROM public.user_profiles
      WHERE auth_user_id = auth.uid() AND pair_id IS NOT NULL
    )
  );

CREATE POLICY "Service role full access to subscriptions"
  ON public.subscriptions
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- 7. TABEL: test_purchases
--    Pembelian tes satuan per user
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.test_purchases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            TEXT UNIQUE NOT NULL,
  test_id             UUID REFERENCES public.tests_catalog(id),
  profile_id          UUID REFERENCES public.user_profiles(id),
  pair_id             UUID,
  amount              INTEGER NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'IDR',
  transaction_status  TEXT NOT NULL DEFAULT 'pending',
  paid_at             TIMESTAMPTZ,
  raw_request         JSONB,
  raw_response        JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_purchases_profile_id ON public.test_purchases(profile_id);
CREATE INDEX IF NOT EXISTS idx_test_purchases_order_id ON public.test_purchases(order_id);
CREATE INDEX IF NOT EXISTS idx_test_purchases_test_id ON public.test_purchases(test_id);
CREATE INDEX IF NOT EXISTS idx_test_purchases_status ON public.test_purchases(transaction_status);

-- RLS
ALTER TABLE public.test_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases"
  ON public.test_purchases FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to test_purchases"
  ON public.test_purchases
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- 8. TABEL: payment_transactions
--    Transaksi pembayaran untuk subscription
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                  TEXT UNIQUE NOT NULL,
  pair_id                   UUID NOT NULL,
  plan_id                   UUID REFERENCES public.plans(id),
  amount                    INTEGER NOT NULL DEFAULT 0,
  currency                  TEXT NOT NULL DEFAULT 'IDR',
  transaction_status        TEXT NOT NULL DEFAULT 'pending',
  status_code               TEXT,
  fraud_status              TEXT,
  payment_type              TEXT,
  midtrans_transaction_id   TEXT,
  gross_amount              TEXT,
  snap_token                TEXT,
  snap_redirect_url         TEXT,
  transaction_time          TIMESTAMPTZ,
  expires_at                TIMESTAMPTZ,
  paid_at                   TIMESTAMPTZ,
  raw_request               JSONB,
  raw_response              JSONB,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_pair_id ON public.payment_transactions(pair_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(transaction_status);

-- RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pair transactions"
  ON public.payment_transactions FOR SELECT
  USING (
    pair_id IN (
      SELECT pair_id FROM public.user_profiles
      WHERE auth_user_id = auth.uid() AND pair_id IS NOT NULL
    )
  );

CREATE POLICY "Service role full access to payment_transactions"
  ON public.payment_transactions
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- 9. TABEL: test_results
--    Hasil test yang diselesaikan oleh user
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.test_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  test_slug   TEXT NOT NULL,
  variant     TEXT,                   -- 'lite' | 'pro' | NULL
  score_data  JSONB NOT NULL,         -- hasil analisis (primary, label, scores, dll)
  answers     JSONB NOT NULL DEFAULT '{}',  -- snapshot jawaban user
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_results_profile_id ON public.test_results(profile_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_slug ON public.test_results(test_slug);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON public.test_results(created_at DESC);

-- RLS
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own results"
  ON public.test_results FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own results"
  ON public.test_results FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to test_results"
  ON public.test_results
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- 10. SEED DATA: tests_catalog
--     Data awal sesuai fallbackCatalog di kode
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.tests_catalog (id, slug, title, description, price, is_free, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'attachment-lite',
    'Attachment Reflection Lite',
    'Versi free dengan 8 soal untuk self-awareness cepat berbasis attachment anxiety dan avoidance.',
    0, TRUE, TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'attachment-pro',
    'Attachment Reflection Pro',
    'Versi lebih mendalam dengan 24 soal, dua dimensi inti, dan reverse scoring untuk hasil refleksi yang lebih kaya.',
    25000, FALSE, TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'love-language-lite',
    'Love Language Mapping Lite',
    'Versi cepat 10 soal untuk membaca bahasa cinta utama dengan UX ringan dan mobile-friendly.',
    0, TRUE, TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'love-language-pro',
    'Love Language Mapping Pro',
    'Versi lebih mendalam 20 soal untuk membaca primary dan secondary love language dengan profil yang lebih stabil.',
    25000, FALSE, TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'conflict-style',
    'Conflict Style Check',
    'Melihat gaya respons saat konflik agar diskusi pasangan lebih sehat. Coming soon.',
    25000, FALSE, FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'emotional-needs',
    'Emotional Needs Check',
    'Memetakan kebutuhan emosional inti untuk relasi yang lebih aman. Coming soon.',
    25000, FALSE, FALSE
  )
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 11. SEED DATA: plans
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.plans (name, description, price, is_active)
VALUES
  ('Simple', 'Akses Love Language Advanced + semua tes basic.', 49000, TRUE),
  ('Pro', 'Akses semua tes termasuk Advanced Test baru yang akan datang.', 99000, TRUE)
ON CONFLICT (name) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- SELESAI
-- ─────────────────────────────────────────────────────────────
