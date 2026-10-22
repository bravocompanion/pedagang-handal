# Pedagang Handal v1.5.3 — Integrasi ikon Library

## Yang sudah dikerjakan

- Ditemukan delapan gambar maskot original pada Library dari chat proyek lainnya (dibuat 16 Oktober 2026).
- Seluruh ikon navigasi/tombol UI serta 16 konteks ekspresi memakai fungsi `oyen()` terpusat. Jika delapan original tersedia, seluruh aplikasi dapat menggunakan gaya gambar yang sama.
- Pengaturan → **Ikon kucing Oyen dari Library**: tombol **Impor gambar Oyen asli**, dapat memilih 8 file PNG sekaligus. Sistem mengenali berkas `image-gen-1` hingga `image-gen-8`, mengompres ke WebP, dan menyimpan lokal jika storage diizinkan browser.
- Termasuk script bundling untuk **mengubah file PNG lokal menjadi aset bawaan** dalam HTML dan Expo WebView sehingga semua pengguna mendapat ikon original otomatis tanpa impor manual.

## Keterbatasan yang harus diketahui

File original **belum dibundel** dalam ZIP, sebab Library dapat menampilkan gambar namun tidak mengizinkan export byte gambar ke container. Selama delapan file belum diunduh dan ditempatkan dalam folder `assets/icons/original`, aplikasi menampilkan SVG fallback Oyen. Jangan menyebut rilis ini sudah memuat original.

## Daftar file original dari Library

| Urutan | Nama Library | Simpan sebagai | Peran aplikasi |
| --- | --- | --- | --- |
| 1 | `image-gen-1(20261016-170027).png` | `welcome.png` | Selamat datang, beranda, produk |
| 2 | `image-gen-2(20261016-170032).png` | `tutorial.png` | Tutorial, ide, laporan |
| 3 | `image-gen-3(20261016-170037).png` | `warning.png` | Peringatan dan notifikasi |
| 4 | `image-gen-4(20261016-170043).png` | `success.png` | Berhasil, simpan, sinkronisasi |
| 5 | `image-gen-5(20261016-170048).png` | `error.png` | Kesalahan, hapus, validasi |
| 6 | `image-gen-6(20261016-170053).png` | `thinking.png` | HPP, pencarian, analisis |
| 7 | `image-gen-7(10).png` | `offline.png` | Offline atau loading |
| 8 | `image-gen-8(10).png` | `celebrate.png` | Keuntungan, berhasil jual, daftar |

## Cara mengaktifkan permanen pada GitHub / Cloudflare / Android

1. Di ChatGPT Library, download delapan gambar PNG di atas. Semua berasal dari Library percakapan project Pedagang Handal.
2. Simpan di `assets/icons/original/` dengan nama yang sesuai pada tabel.
3. Dari root proyek jalankan `python -m pip install pillow` kemudian `python scripts/bundle_library_icons.py`.
4. Script memperkecil semua gambar menjadi WebP transparan 512 px, menyematkan hasil ke `preview/index.html`, dan membangun ulang `mobile/src/appHtml.ts`.
5. Commit hasilnya ke GitHub `bravocompanion/pedagang-handal`. Cloudflare Pages akan deploy otomatis jika Git integration sudah diaktifkan.
6. Untuk pemakaian hanya pada satu browser/HP tanpa mengubah build, gunakan **Pengaturan → Impor gambar Oyen asli**. Ini bergantung ketersediaan penyimpanan browser dan tidak memperbarui APK pengguna lain.

## Uji yang telah dilakukan

- Chromium viewport 320, 393, 768 px, impor delapan gambar contoh, 33 ikon ter-render tanpa overflow. Gambar contoh hanya dipakai untuk tes, **tidak termasuk aplikasi yang diserahkan**.
- Regresi kalkulator/CRUD dan HPP Pro: lulus.
- Belum ada validasi APK/AAB fisik, storage WebView, maupun login Supabase produksi.

## v1.5.4: Impor pack ZIP sekaligus

Preview dan aplikasi sekarang memiliki pilihan **Pengaturan → Pasang pack Oyen (ZIP / 8 gambar)**. Anda dapat memilih ZIP yang diekspor dari percakapan pembuat ikon, tanpa mengekstrak file. Jika browser tidak mendukung dekompresi ZIP, ekstrak dahulu dan pilih delapan PNG bersamaan. Penyimpanan hasil impor adalah **perangkat lokal**, bukan otomatis untuk seluruh pengguna.

Agar pack original menjadi bawaan website Cloudflare dan semua instalasi Android, letakkan ZIP di komputer pengembang, kemudian jalankan:

```bash
python -m pip install pillow
python scripts/bundle_library_icons.py --zip /lokasi/pack-oyen.zip
```

Script memerlukan **8 gambar asli**, mengecek formatnya, mengompres untuk HTML dan Expo, serta membuat launcher dari gambar Oyen asli. Selanjutnya push perubahan ke GitHub. **Pack asli belum berada di paket rilis ini**, karena Library tidak menyediakan akses file mentah dari chat sebelah. Preview akan menampilkan angka `0/8` hingga diimpor.