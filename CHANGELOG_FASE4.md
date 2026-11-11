# Perubahan Fase 4 — River Crossing

## Yang ditambahkan
- Empat pendekatan penyeberangan: rakit, jalur hulu, batang kayu, dan berenang.
- Koridor sungai placeholder yang tertutup sampai solusi valid dipilih.
- Area tujuan stage yang terdeteksi ketika pemain benar-benar mencapai sisi seberang.
- Validasi ulang persyaratan sebelum konsumsi item, agar aksi gagal tidak mengubah inventori.
- Event `action_attempted`, `action_failed`, `action_resolved`, `challenge_resolved`, dan `stage_complete`.
- Aksi alternatif untuk tantangan yang sama disembunyikan setelah satu rute berhasil dipilih. Opsi rakit dan jembatan tetap terlihat saat bahan belum cukup, disertai petunjuk persyaratan.
- Tidak ada sistem energi atau timer gameplay.

## Catatan demo
- Rakit membutuhkan 1 tali dan 2 kayu apung.
- Jembatan batang kayu membutuhkan 1 batang kayu; batang kayu bisa diperoleh dengan menebang pohon memakai kapak kecil.
- Jalur hulu dapat ditemukan dengan memeriksa jejak di tepi sungai.
- Berenang bukan lagi solusi sukses: pemain bergerak ke tengah sungai, tenggelam, lalu mendapat layar game over dengan tombol Try Again untuk memulai ulang stage. Tidak ada energi atau timer.
- Setelah satu rute valid dipilih, koridor terbuka. Pemain harus bergerak secara fisik ke area tujuan di sisi timur untuk menyelesaikan stage.

## Verifikasi yang dilakukan
- Pemeriksaan sintaks JavaScript pada file yang diubah.
- Uji logika interaksi: aksi tanpa persyaratan yang cukup tidak mengubah inventori/state; rute rakit mengonsumsi item yang benar; rute lain ditutup setelah tantangan terselesaikan.
- Build Vite belum dapat diverifikasi di lingkungan pembuatan ZIP karena pemasangan dependensi `npm ci` mengalami timeout. Jalankan `npm install` di komputer lokal sebelum demo jika diperlukan.

## Perbaikan demo lanjutan
- Percobaan berenang dicatat sebagai kegagalan fatal (`action_failed`, `player_drowned`) dan tidak membuka gate sungai.
- Tombol Try Again mengulang dunia/inventori dari awal sambil mempertahankan event log dan nomor percobaan untuk analisis.
- Opsi crafting menampilkan petunjuk jika bahan belum cukup.
