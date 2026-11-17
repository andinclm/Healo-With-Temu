# HEALO with TEMU

Aplikasi web untuk edukasi PTSD, skrining awal PCL-5, teman ngobrol AI (TEMU), dan pusat bantuan.
*Temukan Perasaanmu – Find Your Feelings.*

## Isi folder

| File / folder | Fungsi |
| --- | --- |
| `index.html` | Beranda |
| `edukasi.html` | Materi stres vs trauma vs PTSD, 4 kelompok gejala, mitos & fakta |
| `skrining.html` + `assets/screening.js` | Skrining PCL-5 (persetujuan → kejadian → 20 butir → hasil). Dihitung di browser, tidak disimpan. |
| `temu.html` + `assets/chat.js` | Chat dengan TEMU (AI Gemini) |
| `bantuan.html` | Pusat Bantuan (kontak krisis, guru BK, Puskesmas, psikolog) |
| `netlify/functions/temu.mjs` | Fungsi server kecil yang menyimpan API key dan memanggil Gemini |
| `assets/style.css` | Tampilan (palet HEALO) |
| `manifest.webmanifest`, `sw.js`, `img/icon-*.png` | Supaya bisa dipasang di layar utama HP (PWA) |
| `netlify.toml` | Pengaturan Netlify |

## Aturan skrining (sama dengan paper)

- Pilih "tidak pernah mengalami" → PCL-5 tidak ditampilkan, muncul pesan panduan.
- 20 butir wajib diisi, skala 0–4, total 0–80.
- **Perlu tindak lanjut** jika total ≥ 31 **atau** pola DSM-5 terpenuhi (butir bernilai ≥ 2: minimal 1 di B, 1 di C, 2 di D, 2 di E).
- Butir 16 bernilai ≥ 3 → kotak bantuan krisis muncul.
- Setiap hasil menyatakan "bukan diagnosis" dan mengarah ke Pusat Bantuan.

## Cara mempublikasikan (gratis)

### 1. Ambil API key Gemini
1. Buka **aistudio.google.com** dan login dengan akun Google.
2. Pilih **Get API key** → **Create API key**.
3. Salin kuncinya dan simpan baik-baik. **Jangan pernah** menempelkannya di file HTML/JS atau membagikannya.

### 2. Upload kode ke GitHub
1. Buat akun di **github.com** (gratis).
2. Klik **New repository**, beri nama `healo`, lalu **Create repository**.
3. Pilih **uploading an existing file**, lalu seret **semua isi folder ini** (termasuk folder `assets`, `img`, dan `netlify`) ke halaman itu. Klik **Commit changes**.

### 3. Pasang di Netlify
1. Daftar di **netlify.com** memakai akun GitHub (paket Free).
2. Pilih **Add new project → Import an existing project → GitHub**, lalu pilih repository `healo`.
3. Pengaturan build biarkan kosong (sudah diatur oleh `netlify.toml`). Klik **Deploy**.
4. Buka **Project configuration → Environment variables → Add a variable**:
   - Key: `GEMINI_API_KEY`
   - Value: API key dari langkah 1
5. Buka menu **Deploys → Trigger deploy → Deploy project** supaya kunci terbaca.
6. Selesai. HEALO punya link seperti `https://nama-proyek.netlify.app`. Nama proyek bisa diganti di pengaturan.

### 4. Cek
- Buka **Tanya TEMU** dan kirim pesan. Kalau TEMU membalas, AI sudah aktif.
- Kalau muncul pesan gangguan, model AI default (`gemini-3.5-flash-lite`) mungkin sudah tidak tersedia. Tambahkan variabel `GEMINI_MODEL` berisi nama model gratis yang tercantum di Google AI Studio, lalu deploy ulang.

### 5. Pasang seperti aplikasi
Buka link HEALO di HP → menu browser → **Tambahkan ke Layar Utama**. Ikon TEMU akan muncul seperti aplikasi.

## Mengubah isi
Edit file di GitHub (klik file → ikon pensil → Commit). Netlify otomatis memperbarui web dalam 1–2 menit.

## Wajib dicek sebelum dibagikan
- [ ] Isi kontak guru BK, Puskesmas, dan psikolog di `bantuan.html` (bagian bertanda `[Isi ...]`).
- [ ] Pastikan nomor krisis masih aktif (112, Healing119 119 ekstensi 8, Halo Kemenkes 1500-567).
- [ ] Minta psikolog memeriksa terjemahan 20 butir PCL-5 di `assets/screening.js`.
- [ ] Uji kata-kata krisis di chat (misalnya "aku pengen mati") dan pastikan kotak bantuan muncul.

## Catatan penting
- **Kuota gratis Gemini terbatas** dan bisa berubah. Kalau banyak yang memakai bersamaan, TEMU akan meminta pengguna menunggu sebentar.
- **Privasi:** pesan chat dikirim ke Google Gemini, dan pada paket gratis Google dapat memakai data untuk meningkatkan produknya. Karena itu halaman TEMU meminta pengguna tidak menulis data pribadi. Hasil skrining tidak pernah dikirim ke mana pun.
- Kata-kata krisis dicek dulu oleh kode (di browser dan di server). Kalau terdeteksi, TEMU langsung memberi kontak bantuan tanpa menunggu AI.
- HEALO adalah media edukasi dan skrining awal, **bukan alat diagnosis**.
