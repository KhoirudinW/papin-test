# PAPin Test

Platform multi-test PAPin (Next.js App Router) dengan:

- Main menu test + route terpisah (`/tests/[slug]`)
- Login page sendiri (`/login`) pakai akun Supabase existing
- Admin dashboard sederhana (`/admin`) untuk mengatur katalog test
- Hybrid monetization:
  - subscription pair unlock semua test premium
  - pembelian test satuan unlock untuk akun pembeli
- Promo global gratis semua test selama 1 bulan bisa diatur via env server
- API payment/subscription di app ini, tetapi database dan kredensial Midtrans/Supabase tetap shared.

## Route utama

- `/` main menu test
- `/tests/attachment-lite` dan `/tests/attachment-pro`
- `/tests/love-language-lite` dan `/tests/love-language-pro`
- `/tests/[slug lain]` placeholder route test
- `/pricing` checkout subscription/test
- `/login` login akun existing PAPin
- `/admin` dashboard admin katalog test

## Setup env

Gunakan env yang sama dengan `papin-dashboard`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MIDTRANS_SERVER_KEY`
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION`
- `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION`
- `TEST_FREE_ALL_START_AT`
- `TEST_FREE_ALL_END_AT`
- `TEST_ADMIN_EMAILS`

## Database

Jalankan migration shared:

- `papin-dashboard/supabase/migrations/20260312_add_tests_catalog_and_test_purchases.sql`

## Menjalankan lokal

```bash
npm install
npm run dev
```

## Menjalankan production

```bash
npm run build
npm run start
```
