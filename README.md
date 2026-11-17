# Island of Choices

Game petualangan edukatif berbasis eksplorasi (Phaser 3 + Vite), sepenuhnya berbahasa Indonesia. Setiap tantangan bisa diselesaikan dengan banyak cara. Di akhir permainan, sistem menganalisis tindakan pemain dan menggambarkan **gaya bermainnya** berdasarkan bukti, bukan skor benar-salah.

Status: **3 stage lengkap & bisa dimainkan dari awal sampai akhir**, lengkap dengan bagian depan (layar pembuka, sinematik, menu utama, cerita, pengaturan), menu jeda, dan simpan/lanjutkan. Art dibuat prosedural (tanpa file gambar). Suara memakai file di `src/assets/audio/` bila ada, selain itu disintesis (lihat [Audio](#audio)).

| Stage | Tantangan utama | Cara menyelesaikan |
|---|---|---|
| 1 · Pantai Terdampar | menyeberangi sungai | jalur hulu · rakit · jembatan kayu · berenang (gagal) |
| 2 · Reruntuhan Hutan | melewati dinding kuil | kode simbol (mural / coba-coba) · tuas bambu · jalan rahasia air terjun · memanjat (aman jika beban ringan) |
| 3 · Tanjung Mercusuar | memanggil pertolongan | radio · kode lampu SOS · api sinyal · berlayar sendiri (aman jika paham arus) |

Inventori terbawa antar stage: kerang Stage 1 membuka altar di Stage 2, kelapa bisa diberikan ke monyet, kain bisa jadi bahan sulut, potongan peta menunjukkan jalur aman berlayar. Pilihan di awal punya konsekuensi di akhir.

## Menjalankan

```bash
npm install
npm run dev:all      # server API (8787) + Vite dev (5173) sekaligus
                     # game:      http://localhost:5173/?dev          (?dev = lewati opening)
                     # dashboard: http://localhost:5173/dashboard.html
npm test             # 44 tes (aturan, 3 stage, sesi, analisis, server)
npm run simulate     # 5 contoh pemain memainkan ketiga stage, lihat profilnya di terminal
npm run seed         # kirim 5 sesi contoh ke server (dashboard langsung terisi)
npm run build && npm start   # satu proses: game + dashboard + API di http://localhost:8787
```

Alur normal (`http://localhost:5173/`): layar pembuka → sinematik (bisa dilewati) → menu utama → isi nama (opsional) → cerita (bisa dilewati) → Stage 1. Progres tersimpan otomatis di awal setiap stage; menu utama menampilkan **Lanjutkan** bila ada progres.

## Kontrol

| Tombol | Fungsi |
|---|---|
| WASD / panah | bergerak |
| E / Enter / Space | interaksi, konfirmasi, coba lagi setelah gagal |
| Esc | batal / tutup panel / **menu jeda** (lanjutkan, kontrol, suara, kembali ke menu) |
| I | inventori |
| J | Explorer Journal (penemuan & riwayat keputusan) |
| 1–9 / Backspace | memasukkan / menghapus simbol di panel teka-teki |
| M / N | minimap (dengan fog of war) / suara |
| P | **dev (`?dev`):** pratinjau analisis gaya bermain secara live |
| ] | **dev (`?dev`):** lompat ke stage berikutnya |
| B / L | debug: collision / cetak event log ke konsol |

Di mode `?dev`, objek `window.__ioc` (`game`, `gameState`) tersedia di konsol.

## Alur demo (±5 menit)

1. `npm run dev:all`, lalu `npm run seed` di terminal lain.
2. Buka `http://localhost:5173/` untuk alur lengkap, atau `?dev` untuk langsung ke Stage 1 (tekan **P** untuk melihat profil yang terbentuk).
3. Mainkan 3 stage (±10–15 menit). Masuk lingkaran emas tujuan → **Selesaikan** atau **Jelajahi dulu** (pilihan ini juga dicatat). Tekan `]` untuk melompati stage saat demo singkat.
4. Layar akhir: profil, bukti per dimensi, tabel per stage, status "Tersimpan di server".
5. Buka dashboard: semua sesi, distribusi profil & cara per stage, rata-rata dimensi, detail bukti per pemain.

## Arsitektur

```
src/data/        stage1–3.js (dunia, tantangan, strategi, tag) · stages.js (registri + validasi)
                 taxonomy.js (dimensi & gaya) · items.js · assets.js (ukuran & hitbox objek)
src/systems/     StageSession.js   aturan stage tanpa Phaser (dipakai game, simulasi, tes)
                 Interaction.js    validasi aksi, konsumsi item, pencatatan keputusan
                 EventLog.js       event berstempel stage + nomor percobaan
                 analysis/metrics.js   event → fakta terukur per stage
                 analysis/profile.js   fakta → profil 5 dimensi + gaya solusi + narasi
                 Evidence.js       laporan lengkap (schema v2)
                 Journal.js        isi Explorer Journal
src/scenes/      StageScene.js     scene generik: input, fisika, efek, minimap, teka-teki, transisi
                 world.js · ambience.js   pembangun dunia, makhluk, partikel, pencahayaan
src/art/         textures.js       art prosedural semua objek, tile, partikel
src/audio/       sound.js · manifest.js   musik/suasana/efek: file bila ada, sintetis bila tidak
src/assets/audio/  tempat file suara tim (lihat DAFTAR_SUARA.md)
src/sim/         playthrough.js + personas.js   pemain skrip untuk tes & demo
                 Telemetry.js      kirim event log ke server (+ beacon bila tab ditutup)
src/ui/          ui.js (HUD, jurnal, teka-teki, jeda, hasil) · intro.js + intro.css (bagian depan)
src/systems/SaveGame.js   simpan otomatis per stage untuk fitur Lanjutkan
src/data/credits.js       nama tim & sumber aset untuk menu Tentang
src/dashboard/   dashboard peneliti (dashboard.html)
server/          app.js (API) · store.js (file JSON per sesi di data/sessions/) · index.js
```

### Backend

| Endpoint | Fungsi |
|---|---|
| `POST /api/sessions` | `{ sessionId, player, final, log }` → server **menghitung ulang** profil dari event mentah, menyimpan, mengembalikan ringkasan |
| `GET /api/sessions` | ringkasan semua sesi |
| `GET /api/sessions/:id` | rekaman lengkap (laporan + event log) |
| `GET /api/stats` | agregat: jumlah sesi, distribusi profil/cara, rata-rata dimensi |
| `GET /api/health` | cek server |

Server tanpa dependensi tambahan (Node bawaan) dan memakai modul analisis yang sama dengan game. Profil dari klien tidak dipercaya. Laporan parsial (tab ditutup sebelum selesai) tidak menimpa laporan final. Data disimpan di `data/sessions/` (diabaikan git; ubah lewat `IOC_DATA_DIR`).

Prinsip: **semua aturan ada di data + systems**, scene hanya menampilkan. Game dan simulator menghasilkan event yang identik.

## Audio

Taruh file suara di `src/assets/audio/{music,ambience,sfx}/` dengan nama sesuai **[DAFTAR_SUARA.md](src/assets/audio/DAFTAR_SUARA.md)** (26 file: 7 musik, 3 suasana, 16 efek; semuanya opsional). Format disarankan `.mp3`. Game otomatis memakai file yang ada; sisanya memakai suara sintetis. Jumlah file yang terdeteksi terlihat di **Pengaturan**. Volume per file diatur di `src/audio/manifest.js`; volume pemain (utama/musik/efek) tersimpan di browser.

## Sistem analisis

Setiap aksi/strategi diberi **tag** (`pathfinding`, `craft`, `tool`, `improvise`, `decode`, `risk`, `observe`, `gather`, `collect`). Mesin analisis hanya membaca tag dan struktur data stage, jadi otomatis berlaku untuk stage baru.

| Dimensi | Kutub (− / +) | Bukti utama |
|---|---|---|
| Eksplorasi | Terfokus / Penjelajah | penemuan, cakupan peta, tantangan opsional, tetap menjelajah setelah tujuan terbuka |
| Informasi | Pencoba langsung / Pengamat | petunjuk yang dibaca **sebelum** keputusan, keputusan yang sejalan dengan petunjuk, kegagalan, tebakan teka-teki |
| Tempo | Cepat bertindak / Penuh pertimbangan | waktu & jumlah interaksi sebelum percobaan pertama |
| Barang | Hemat / Pengumpul | barang diambil vs dipakai, barang koleksi, barang bawaan yang berguna di stage berikutnya |
| Kegagalan | Gigih / Adaptif | setelah gagal: ganti cara atau ulangi cara yang sama |

Setiap dimensi punya skor −1..1, **tingkat keyakinan** (rendah/sedang/tinggi, dari jumlah bukti dan konsistensi antar stage), dan daftar bukti yang bisa dibaca. Judul profil = gaya solusi dominan + dimensi terkuat, misalnya *"Pencari Jalur yang Gemar Menjelajah"*. Laporan terakhir juga disimpan di `localStorage` (`ioc:lastReport`).

Rujukan konsep: Evidence-Centered Design (Mislevy) dan *stealth assessment* (Shute).

## Menambah atau mengubah stage

1. Salin skema `src/data/stage2.js` (`challenges` + `gates` + `strategies` dengan `tags`/`informedBy`, `zones`, `ground`, `water`, `walls`, `objects`, `goal`, `ambience`).
2. Daftarkan di `RAW_STAGES` pada `src/data/stages.js`. `prepareStage` memvalidasi referensi saat start.
3. Mekanik yang tersedia lewat data: `requires.choices` (bahan alternatif), `puzzle`, `risky` (aman bersyarat), `outcome: "fatal"`, `hideIfFlags`, `moveTo`, efek `stash`/`unstash`.
4. Setiap tantangan utama butuh strategi dengan tag berbeda agar dimensi bisa membedakan pemain. Tambahkan persona di `src/sim/personas.js` untuk mengujinya.

Dokumen fase lama ada di `docs/archive/`.
