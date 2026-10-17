# Pedagang Handal

Aplikasi kalkulator HPP & analisis keuntungan UMKM.

## Status

Versi terbaru: **v1.5.1 — Login Fix** (17 Oktober 2026).

- Kalkulasi HPP Professional: biaya bahan, tenaga kerja, kemasan, overhead, susut produksi, biaya marketplace, simulasi laba, histori harga bahan.
- Formulir Sign In / Sign Up / Reset Password terhubung ke Supabase Auth.
- Sinkronisasi cloud memakai snapshot revision + RLS (memerlukan penerapan migrasi SQL pada proyek Supabase).

> **Penting:** Preview HTML dapat diuji di browser; pengujian Supabase nyata dan build APK/AAB belum dinyatakan lulus.

## Menjalankan preview

Buka [preview/index.html](preview/index.html) melalui HTTP/HTTPS (contoh `python -m http.server 8000` dari root repo). Daftar/Login membutuhkan proyek Supabase yang dikonfigurasi pada build.

## Keamanan

Jangan pernah commit `.env`, secret key, service_role key, database password, atau access token. Gunakan hanya Supabase publishable key pada frontend dan aktifkan RLS pada setiap tabel.

## Proyek Android

Paket sumber mobile v1.5.1 tersedia dari arsip rilis aplikasi yang disiapkan terpisah. Repository dapat digunakan untuk melacak revisi dan menerima source code Android secara bertahap. Saat berkas Android lengkap diunggah, jalankan `npm install` dan `npx expo start` dari direktori `mobile`.
