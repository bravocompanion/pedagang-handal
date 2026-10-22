# Pedagang Handal

Aplikasi mobile untuk menghitung **Harga Pokok Produksi (HPP)**, harga jual, dan keuntungan UMKM.

**Versi aplikasi:** v1.5.5 — Login Fix (Batch 1 Foundation & Stability + Batch 2 HPP Professional).

## Fitur utama

- Produk, bahan, kemasan, tenaga kerja, overhead, biaya tetap dan variabel.
- Susut, gagal produksi, biaya marketplace, transaksi, diskon, dan subsidi ongkir.
- Harga jual dengan target margin/markup, harga impas, simulasi laba dan kenaikan biaya.
- Histori harga bahan dan perbandingan kanal penjualan.
- Daftar, masuk, keluar, lupa password melalui Supabase Auth.
- Snapshot cloud per akun dengan revision dan RLS (SQL harus diterapkan di proyek Supabase).
- Preview HTML responsif dan pembungkus Android/iOS melalui Expo React Native.

## Pratinjau HTML

Jalankan dari root repository:

```bash
python -m http.server 8000
```

Buka **http://localhost:8000/preview/**. Preview ini berisi konfigurasi **publishable** Supabase Pedagang Handal yang aman untuk aplikasi publik apabila RLS dikonfigurasi dengan benar. Jangan gunakan kunci secret/service_role di frontend.

## Jalankan Android/iOS (Expo)

```bash
cd mobile
cp .env.example .env
# Edit .env dan isi EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY proyek Pedagang Handal
npm install
npx expo start --clear
```

Untuk membangun APK atau AAB, siapkan akun Expo EAS dan ganti Android package / iOS bundle identifier **com.example.pedaganghandal** sebelum merilis. Jalankan `npx eas-cli build --platform android --profile preview` untuk APK uji dan `--profile production` untuk AAB produksi setelah validasi.

## Supabase

1. Buka proyek **Pedagang Handal**, bukan proyek BravoTax.
2. Jalankan `supabase/01_create_product_snapshots.sql` dari SQL Editor bila tabel belum ada.
3. Jalankan `supabase/02_batch1_revision_rls.sql` untuk kolom revision dan kebijakan akses per pengguna.
4. Aktifkan Email Auth; konfigurasi URL redirect HTTPS untuk pemulihan password.
5. Uji dua akun berbeda, sinkronisasi lintas perangkat, dan kebijakan RLS di database nyata.

## Struktur repository

- `preview/index.html` — pratinjau HTML interaktif v1.5.1.
- `mobile/App.tsx` — WebView + bridge native untuk sesi, simpan data, PDF, dan backup.
- `mobile/src/appHtml.ts` — UI aplikasi yang dibundel ke mobile.
- `mobile/app.json`, `mobile/eas.json` — konfigurasi Expo dan build.
- `supabase/*.sql` — skema dan kebijakan keamanan database.

## Status pengujian

Pembaruan ini telah diunggah ke GitHub, **belum merupakan bukti bahwa login nyata, RLS produksi, atau build APK/AAB lulus**. Pengujian browser dan respons server tiruan dilakukan pada paket lokal sebelum publikasi repository. Lakukan pengujian build ulang dari isi repository sebelum distribusi.

## Keamanan

- Jangan commit file `.env`, private key, service_role, database password, atau kredensial toko aplikasi.
- Gunakan Supabase publishable key **hanya bersama RLS**.
- Backup data sebelum mengganti skema atau menguji migrasi.

## Deployment web otomatis — Cloudflare Pages

Proyek web statis ini siap dihubungkan melalui Cloudflare Pages **Git integration**. Setelah akun Cloudflare mengotorisasi repository GitHub, setiap push ke `main` akan memicu deployment otomatis.

- Panduan lengkap: [CLOUDFLARE_DEPLOY.md](CLOUDFLARE_DEPLOY.md)
- Folder output Pages: `preview`
- Branch produksi: `main`
- Build command: kosong (HTML statis)
- Pemeriksaan GitHub Actions: `.github/workflows/verify-web.yml`

**Status:** Kode dan dokumentasi sudah diunggah. Aktivasi Cloudflare, domain HTTPS, dan deployment pertama masih harus diselesaikan di dashboard akun Cloudflare.


## UI Oyen v1.5.2

- 16 ekspresi maskot fallback Oyen telah digunakan dalam **login/daftar, dashboard, empty state, notifikasi, status cloud, HPP Pro, dan galeri Pengaturan**.
- Icon UI bawaan untuk navigasi, tombol, ekspor, pencarian, dan editor tetap aktif.
- Sumber aset SVG + pemetaan ekspresi: [assets/icons/manifest.json](assets/icons/manifest.json).
- **Pack gambar Oyen asli dari percakapan terdahulu belum tersedia sebagai file** sehingga yang terpasang saat ini adalah fallback vektor. Untuk mengganti desain dengan pack asli, kirim file PNG/SVG dan bundel ulang HTML serta sumber Expo.
- Browser deploy otomatis Cloudflare memakai folder `preview/` pada branch `main`. Web dan Expo WebView menampilkan maskot tanpa memuat CDN.
- **Belum lolos validasi APK/AAB atau akun Supabase nyata.** Jangan menganggap source terbaru siap produksi tanpa pengujian perangkat.


## Oyen Library v1.5.3

- Semua ikon fungsional (navigasi, tombol, laporan, pencarian, dan lainnya) diarahkan ke komponen ikon kucing Oyen yang terpusat.
- Fitur Pengaturan → **Impor gambar Oyen asli** menerima 8 PNG/JPEG/WebP, mengenali nama `image-gen-1` hingga `image-gen-8`, mengubahnya menjadi WebP ringan, lalu mencoba menyimpan di browser masing-masing.
- Pemetaan sumber original: [assets/icons/original/manifest.json](assets/icons/original/manifest.json).
- Bundling permanen ke website dan source mobile: `python scripts/bundle_library_icons.py` setelah PNG asli disalin ke `assets/icons/original/`.
- **Batas penting:** delapan gambar asli ditemukan di Library, tetapi byte gambar belum dapat diekspor sehingga belum disertakan di repo. Sampai itu terjadi, SVG fallback kucing Oyen tetap digunakan. Kode siap, aset original belum terkirim.
- **Belum diverifikasi:** login Supabase produksi, penyimpanan gambar original setelah restart aplikasi di semua perangkat, serta APK/AAB Play Store.


## Oyen Pack ZIP v1.5.4

- Menu Pengaturan menerima satu ZIP berisi 8 gambar Oyen asli atau 8 PNG sekaligus (tanpa CDN).
- Perangkat yang mengimpor langsung menampilkan gambarnya dalam navigasi, tombol dan status.
- Bundling permanen website, Expo WebView dan launcher: `python scripts/bundle_library_icons.py --zip PATH_TO_ORIGINAL_PACK.zip`.
- **Pack original belum ada dalam source repository.** Library chat lama hanya memberi preview, bukan byte PNG; rilis ini masih memakai SVG fallback sampai ZIP original diberikan. Jangan salah menyebut fallback sebagai gambar asli.
- [Panduan lengkap dan keterbatasan](README_ORIGINAL_OYEN.md).
- Native APK/AAB dan Supabase produksi masih membutuhkan pengujian mandiri.


## Oyen Preview v1.5.5

Galeri 8 ekspresi Oyen **cadangan** dan tombol `Pasang 8 gambar Oyen asli (ZIP)` kini langsung muncul pada halaman **login**, tanpa harus masuk ke Pengaturan. Pengguna dapat melihat status `Original 0/8` jika aset original belum tertanam dan memasang ZIP langsung di browser.

**Aset asli dari Library chat sebelah belum dibundel**; file gambar mentah belum dapat diekspor. Untuk distribusi permanent, unggah ZIP original dan jalankan `python scripts/bundle_library_icons.py --zip lokasi/pack-original.zip`, commit hasilnya, kemudian deployment ulang. Source Expo dan preview v1.5.5 telah disinkronkan.

Browser tes 320, 393, 768 px + simulasi ZIP lulus. APK/AAB dan login Supabase nyata belum diverifikasi.
