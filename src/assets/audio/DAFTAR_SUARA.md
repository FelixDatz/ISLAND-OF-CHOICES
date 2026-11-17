# Daftar Suara Island of Choices

Taruh file suara di folder ini dengan **nama persis** seperti di tabel. Game otomatis memakai file yang ada; yang belum ada diganti suara sintetis bawaan. Tidak perlu mengubah kode.

```
src/assets/audio/
├── music/      musik latar (loop)
├── ambience/   suara suasana (loop)
└── sfx/        efek suara pendek
```

**Format:** `.mp3` (disarankan, 128–192 kbps). `.ogg`, `.wav`, dan `.m4a` juga bisa. Jika ada dua format untuk nama yang sama, yang dipakai: mp3 → ogg → m4a → wav.
**Nama file:** huruf kecil, tanpa spasi, persis seperti di bawah.
**Setelah menambah file:** saat `npm run dev`, cukup refresh browser. Untuk versi build, jalankan `npm run build` lagi.

## 1. Musik (`music/`) — loop mulus, normalisasi sekitar −14 LUFS

| Nama file | Dipakai di | Durasi | Suasana |
|---|---|---|---|
| `menu.mp3` | Menu utama | 1–3 mnt, loop | Tenang, misterius, rasa petualangan |
| `opening.mp3` | Sinematik pembuka | ±20 dtk, tidak loop | Laut tenang → badai → sunyi |
| `cerita.mp3` | Slide cerita (prolog) | 1–2 mnt, loop | Lembut, naratif |
| `stage1_pantai.mp3` | Stage 1 · Pantai Terdampar | 1–3 mnt, loop | Ringan, cerah, perkusi kayu |
| `stage2_hutan.mp3` | Stage 2 · Reruntuhan Hutan | 1–3 mnt, loop | Misterius, kuno, perkusi lembut |
| `stage3_mercusuar.mp3` | Stage 3 · Tanjung Mercusuar | 1–3 mnt, loop | Senja, haru, membangun harapan |
| `ending.mp3` | Penutup & layar hasil | 1–2 mnt, loop | Hangat, lega |

## 2. Suasana (`ambience/`) — loop mulus, lebih pelan dari musik

| Nama file | Dipakai di | Isi |
|---|---|---|
| `pantai.mp3` | Stage 1 | Debur ombak, angin pantai, camar sesekali |
| `hutan.mp3` | Stage 2 | Burung, serangga, gemericik air di kejauhan |
| `angin.mp3` | Stage 3 | Angin kencang di tebing, ombak di bawah |

## 3. Efek suara (`sfx/`) — pendek (di bawah 1 dtk kecuali disebut), tanpa jeda hening di awal

| Nama file | Kapan berbunyi |
|---|---|
| `ambil.mp3` | Mengambil barang |
| `temuan.mp3` | Penemuan dicatat di jurnal |
| `berhasil.mp3` | Tantangan terpecahkan (boleh 1–2 dtk) |
| `gagal.mp3` | Aksi gagal / terkunci |
| `cebur.mp3` | Tercebur / terseret air |
| `jatuh.mp3` | Terjatuh dari dinding |
| `ui_pilih.mp3` | Pindah pilihan di menu |
| `ui_buka.mp3` | Membuka panel / menu |
| `ui_tutup.mp3` | Menutup panel / menu |
| `simbol.mp3` | Menekan simbol teka-teki |
| `salah.mp3` | Jawaban teka-teki salah |
| `gemuruh.mp3` | Pintu batu bergeser (1–2 dtk) |
| `desir.mp3` | Melompat / jalan terbuka (whoosh) |
| `klakson_kapal.mp3` | Kapal penyelamat datang (2–3 dtk) |
| `langkah.mp3` | Satu langkah kaki (sangat pelan, diputar berulang) |
| `api.mp3` | Api sinyal menyala (1–2 dtk) |

**Total: 7 musik + 3 suasana + 16 efek = 26 file.** Semuanya opsional, bisa diisi bertahap.

Tips: gunakan aset bebas lisensi (mis. CC0) dan catat sumbernya di bagian *Tentang* atau laporan. Volume tiap file bisa diatur di `src/audio/manifest.js` (kolom `volume`).
