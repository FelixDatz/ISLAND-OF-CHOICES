# Island of Choices

Game browser interaktif bertema **Computational Thinking**. Pemain terdampar di pulau dan harus mengelola energi serta waktu untuk mengaktifkan sinyal darurat.

## Menjalankan proyek

1. Buka file `index.html` menggunakan browser modern.
2. Pilih **Mulai Perjalanan**.
3. Selesaikan tantangan untuk membuka lokasi baru hingga Menara Sinyal aktif.

Progres permainan tersimpan otomatis di `localStorage` browser. Bila ingin memulai ulang, gunakan **Hapus save permainan** dari menu.

## Konsep yang dipraktikkan

- **Dekomposisi** — mengurai risiko dan sumber daya ketika menyeberangi sungai.
- **Pengenalan pola** — membaca indikator pada stasiun penelitian.
- **Algoritma** — memasukkan urutan sinyal yang benar pada panel pemancar.

## Struktur proyek

```text
index.html       halaman aplikasi
style.css        tampilan responsif
js/state.js      state dan penyimpanan permainan
js/locations.js  data lokasi pulau
js/problems.js   logika tantangan
js/ui.js         renderer setiap screen
js/analysis.js   skor dan refleksi akhir
js/main.js       event aplikasi
```
