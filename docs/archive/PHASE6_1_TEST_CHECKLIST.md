# Fase 6.1 — Demo Checklist

## Automated smoke tests
- [ ] Jalankan `npm test`; seluruh 6 tes bawaan Node harus lulus.

## Opening regression
- [ ] Cinematic opening tampil saat pertama membuka aplikasi.
- [ ] Tombol Skip baru aktif setelah 10 detik.
- [ ] Skip hanya melewati cinematic; storyboard tetap harus dituntaskan.
- [ ] Previous / Next storyboard berfungsi.
- [ ] Landing page tampil setelah slide terakhir.
- [ ] Start / Play masuk ke Stage 1.

## Guided exploration
- [ ] Saat mulai di pantai, panel `THE SHORE` muncul.
- [ ] Berjalan ke hutan memunculkan `THE WILDERNESS`.
- [ ] Mendekati sungai memunculkan `THE RIVERBANK`.
- [ ] Setelah menyeberang, panel `THE FAR SIDE` muncul.
- [ ] Petunjuk hanya memberi konteks; tidak ada waypoint atau urutan wajib.

## Environmental observations
- [ ] `Jejak di pasir` dapat diamati satu kali.
- [ ] `Dahan patah` dapat diamati satu kali.
- [ ] `Batu bertanda` dapat diamati satu kali.
- [ ] `Rumpun gelagah` dapat diamati satu kali.
- [ ] Setiap observasi menampilkan dialog yang sesuai.
- [ ] Observasi tidak mengubah inventori atau mengunci jalur sungai.
- [ ] Event `discovery_made` tercatat untuk setiap observasi.

## Fase 4 regression
- [ ] Mencari puing kapal tetap memberi tali dan kapak kecil.
- [ ] Rakit tetap membutuhkan 1 tali + 2 kayu apung.
- [ ] Jembatan tetap membutuhkan 1 batang kayu dari pohon kelapa.
- [ ] Jalur hulu tetap dapat ditemukan dari jejak di tepi sungai.
- [ ] Berenang tetap gagal, memunculkan Game Over, dan Try Again.
- [ ] Try Again mengulang stage tetapi mempertahankan log percobaan sebelumnya.
- [ ] Tidak ada energi atau timer gameplay.
