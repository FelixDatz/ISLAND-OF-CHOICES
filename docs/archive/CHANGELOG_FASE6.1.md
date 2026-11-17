# Fase 6.1 — Environmental Interaction & Guided Orientation

## Tujuan
Membuat Stage 1 terasa lebih hidup dan mudah dibaca tanpa mengubahnya menjadi level linear. Eksplorasi tambahan bersifat opsional, sedangkan area memberi orientasi yang ringan.

## Perubahan
- Menambahkan empat konteks zona: `THE SHORE`, `THE WILDERNESS`, `THE RIVERBANK`, dan `THE FAR SIDE`.
- Menampilkan panel lokasi ringkas saat pemain memasuki zona.
- Merekam perpindahan zona dengan event `zone_entered`.
- Menambahkan empat objek observasi opsional:
  - `shore_tracks` — jejak di pasir dekat area pantai.
  - `split_branch` — dahan patah di area hutan.
  - `carved_stone` — guratan pada batu di area hutan.
  - `river_reeds` — gelagah yang memberi konteks arah arus.
- Aksi observasi bersifat one-time, tidak memberi/mengonsumsi item, dan tidak menjadi syarat menyeberangi sungai.
- Menambahkan metadata `discoveryId` dan event `discovery_made` agar penemuan bisa dipakai Explorer Journal pada Fase 6.3.
- Menambahkan roadmap teknis Stage 1 di `ROADMAP_STAGE1.md`.

## Mekanik yang dipertahankan
- Rakit: 1 tali + 2 kayu apung.
- Jembatan batang kayu: 1 batang kayu.
- Jalur hulu: ditelusuri dari jejak tepi sungai.
- Berenang tetap menyebabkan kegagalan fatal dan Try Again; log percobaan sebelumnya dipertahankan.
- Tidak ada energi atau timer gameplay.
- Opening Fase 5.1 tidak diubah.

## Verifikasi
- `node --check` berhasil untuk file JavaScript yang diubah.
- `npm test` berhasil: 6 smoke test lulus, mencakup zona, discovery, tiga rute sungai, dan validasi konsumsi bahan.
- `npm run build` belum dapat diverifikasi: executable Vite tidak tersedia pada `node_modules` ZIP sumber. Percobaan `npm ci` juga mengalami timeout di lingkungan ini. ZIP demo disertakan dengan `package-lock.json`; jalankan `npm install` sebelum `npm run dev` pada komputer lokal.
