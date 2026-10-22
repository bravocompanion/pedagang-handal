# Ikon Oyen dari Library proyek

Saya menemukan 8 gambar maskot Oyen pada Library proyek Pedagang Handal. Gambar asli **belum** berada di repository karena ekspor berkas mentah dari Library ditolak, walaupun preview visualnya dapat dibaca.

Setelah mengunduh file original dari Library, masukkan 8 file PNG ke folder ini dengan nama `welcome.png`, `tutorial.png`, `warning.png`, `success.png`, `error.png`, `thinking.png`, `offline.png`, `celebrate.png` sesuai `manifest.json`.

Jalankan `python -m pip install pillow` lalu `python scripts/bundle_library_icons.py` dari root repository. Script membuat WebP 512px yang ringan dan menyematkannya ke `preview/index.html` dan `mobile/src/appHtml.ts` secara permanen. Alternatif: gunakan Pengaturan → Impor gambar Oyen asli di UI (per perangkat).

Selama 8 PNG original belum tersedia, ikon SVG Oyen fallback akan terlihat. Jangan mengklaim ikon original telah dibundel atau bahwa APK sudah diuji.
