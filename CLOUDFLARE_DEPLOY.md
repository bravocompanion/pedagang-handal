# Cloudflare Pages — Deployment Otomatis Pedagang Handal

Repository: https://github.com/bravocompanion/pedagang-handal
Branch produksi: `main`
Produk yang dipublikasikan: **aplikasi web / preview HTML**. APK/AAB Android tidak dibuat oleh Cloudflare Pages.

## Aktivasi di dashboard Cloudflare (sekali saja)

1. Login ke https://dash.cloudflare.com/.
2. Buka **Workers & Pages → Create application → Pages → Connect to Git**.
3. Hubungkan akun GitHub yang memiliki repository **bravocompanion/pedagang-handal**.
4. Pilih repository dan isi pengaturan berikut:

| Pengaturan | Nilai |
| --- | --- |
| Project name | pedagang-handal (jika belum digunakan) |
| Production branch | main |
| Framework preset | None |
| Root directory | / (akar repository) |
| Build command | kosong |
| Build output directory | preview |

5. Klik **Save and Deploy**. Jika berhasil, Cloudflare menampilkan URL HTTPS pages.dev yang sebenarnya.
6. Setiap push berikutnya ke `main` akan menjalankan **deployment produksi otomatis**. Branch lain dan pull request dapat menghasilkan preview deployment.

> Gunakan Git integration, bukan Direct Upload, agar tidak memerlukan Cloudflare API token dalam GitHub Actions. Cloudflare tidak mengizinkan mengubah jenis proyek langsung dari Direct Upload menjadi Git integration.

## Koneksi Supabase setelah situs publik

Proyek Supabase Pedagang Handal: `cncwhersxduslivnwbft` (bukan BravoTax).

- Buka Supabase Dashboard → Authentication → URL Configuration.
- Isi **Site URL** dengan alamat HTTPS Pages produksi yang Cloudflare berikan.
- Masukkan alamat callback yang benar ke **Redirect URLs** jika dibutuhkan untuk konfirmasi email atau pemulihan password.
- Konfirmasi email, login, reset password dan pembatasan RLS perlu diuji di website setelah deploy. Khusus **reset password**, versi web v1.5.1 saat ini belum memiliki halaman penggantian kata sandi end-to-end yang teruji.
- Sebelum memakai data pelanggan, jalankan dan verifikasi SQL RLS pada folder `supabase/` di akun Supabase Pedagang Handal.

## Alur kerja

```text
push GitHub main ------> Cloudflare Pages Git integration ------> website produksi HTTPS
push branch/PR --------> Cloudflare Pages Git integration ------> preview deployment
push/PR ---------------> GitHub Actions -----------------------> validasi HTML/JavaScript
```

Workflow GitHub Actions validasi tersedia di `.github/workflows/verify-web.yml`, menjalankan `node scripts/check-web.mjs`. Ini **tes terpisah**, bukan penghalang otomatis untuk deployment Cloudflare jika gagal. Untuk gate produksi, atur branch protection dan deployment controls setelah lingkungan stabil.

## Langkah verifikasi

1. Buka URL `*.pages.dev` yang ditampilkan Cloudflare; halaman awal harus memuat **Pedagang Handal**.
2. Buka DevTools browser; pastikan tidak ada JavaScript error.
3. Periksa tampilan layar sempit 320px, 393px, serta tablet.
4. Jalankan Sign Up, verifikasi email, Sign In, logout, dan pemeriksaan data antar-akun di Supabase nyata.
5. Buat branch uji dengan perubahan aman pada `preview/index.html`, lalu lihat URL preview di Cloudflare / Pull Request.
6. Merge ke `main`, verifikasi deployment produksi menampilkan revisi baru.

## Rollback dan keamanan

- Rollback dapat dilakukan melalui deployment sebelumnya di Cloudflare atau `git revert` lalu push ke `main`.
- Jangan commit `.env`, `service_role`, Cloudflare API token, dan password database. Publishable key frontend hanya aman bila RLS benar.
- `preview/_headers` menambahkan perlindungan header browser dasar, tetapi tidak menggantikan audit keamanan.
- Build Android/iOS tetap melalui Expo EAS dan perlu pipeline terpisah.

Dokumentasi resmi: https://developers.cloudflare.com/pages/get-started/git-integration/
