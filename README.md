# HEALO with TEMU

Aplikasi web untuk edukasi PTSD, skrining awal PCL-5, teman ngobrol AI (TEMU), dan pusat bantuan.
*Temukan Perasaanmu – Find Your Feelings.*

## Isi folder

| File / folder | Fungsi |
| --- | --- |
| `index.html` | Beranda |
| `edukasi.html` | Materi stres vs trauma vs PTSD, 4 kelompok gejala, mitos & fakta |
| `skrining.html` + `assets/screening.js` | Skrining PCL-5 (persetujuan → sekolah → kejadian → 20 butir → hasil). Siswa SMAN 1 / SMAN 3 → hasil dikirim ke guru BK sekolahnya; Umum → tidak dikirim. |
| `temu.html` + `assets/chat.js` | Chat dengan TEMU (AI Gemini) |
| `bantuan.html` | Pusat Bantuan (kontak krisis, guru BK SMAN 1 & 3, psikolog mitra, Puskesmas mitra, Dinkes) |
| `netlify/functions/submit.mjs` | Menerima hasil skrining dan meneruskannya ke Google Sheet sekolah yang dipilih |
| `google-apps-script/Code.gs` | Skrip untuk Google Sheet tiap sekolah (dipasang di Google, bukan di Netlify) |
| `img/logo-*.png` | Logo mitra. `logo-dinkes.png` dan `logo-puskesmas.png` masih gambar contoh: ganti dengan logo asli, nama file sama. |
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

### 5. Sambungkan data skrining ke sekolah (SMAN 1 dan SMAN 3 terpisah)
Lakukan **dua kali**: sekali dengan akun Google guru BK SMAN 1, sekali dengan akun guru BK SMAN 3. Dengan begitu data tiap sekolah hanya masuk ke Sheet sekolah itu sendiri.
1. Buat Google Sheet baru, misalnya `HEALO – SMAN 1 Surakarta`.
2. Menu **Ekstensi → Apps Script**. Hapus isinya, tempel seluruh isi `google-apps-script/Code.gs`.
3. Ganti `GANTI_DENGAN_KODE_RAHASIA` dengan kode rahasia buatanmu (misalnya 20 huruf/angka acak). Pakai kode yang **sama** di kedua sekolah. Simpan.
4. Klik **Terapkan → Deployment baru → ikon roda → Aplikasi web**. Jalankan sebagai: **Saya**. Yang memiliki akses: **Siapa saja**. Klik **Terapkan** dan izinkan akses.
5. Salin **URL aplikasi web** (berakhiran `/exec`).
6. Di Netlify → **Environment variables**, tambahkan:
   - `SHEET_URL_SMAN1` = URL dari Sheet SMAN 1
   - `SHEET_URL_SMAN3` = URL dari Sheet SMAN 3
   - `SHEET_SECRET` = kode rahasia dari langkah 3
7. **Deploys → Trigger deploy**. Coba skrining sebagai siswa SMAN 1, lalu cek baris baru di Sheet SMAN 1.

Baris berwarna merah muda = tanda krisis (butir 16 ≥ 3), kuning = perlu tindak lanjut. Kolom "Tindak lanjut BK" dan "Catatan" untuk diisi guru BK.

### 6. Pasang seperti aplikasi
Buka link HEALO di HP → menu browser → **Tambahkan ke Layar Utama**. Ikon TEMU akan muncul seperti aplikasi.

## Mengubah isi
Edit file di GitHub (klik file → ikon pensil → Commit). Netlify otomatis memperbarui web dalam 1–2 menit.

## Wajib dicek sebelum dibagikan
- [x] Kontak 3 psikolog mitra sudah diisi.
- [ ] Ganti `img/logo-dinkes.png` dan `img/logo-puskesmas.png` dengan logo asli (minta izin pemakaian logo ke instansi).
- [ ] Lengkapi alamat Puskesmas Sibela.
- [ ] Sambungkan Sheet SMAN 1 dan SMAN 3 (langkah 5) dan uji satu kali per sekolah.
- [ ] Pastikan nomor krisis masih aktif (112, Healing119 119 ekstensi 8, Halo Kemenkes 1500-567).
- [ ] Minta psikolog memeriksa terjemahan 20 butir PCL-5 di `assets/screening.js`.
- [ ] Uji kata-kata krisis di chat (misalnya "aku pengen mati") dan pastikan kotak bantuan muncul.

## Catatan penting
- **Kuota gratis Gemini terbatas** dan bisa berubah. Kalau banyak yang memakai bersamaan, TEMU akan meminta pengguna menunggu sebentar.
- **Privasi:** pesan chat dikirim ke Google Gemini, dan pada paket gratis Google dapat memakai data untuk meningkatkan produknya. Karena itu halaman TEMU meminta pengguna tidak menulis data pribadi. Hasil skrining hanya dikirim ke Google Sheet guru BK sekolah yang dipilih siswa (dengan persetujuan siswa); pilihan "Umum" tidak mengirim apa pun. Bagikan Sheet hanya ke guru BK/konselor yang berwenang.
- Kata-kata krisis dicek dulu oleh kode (di browser dan di server). Kalau terdeteksi, TEMU langsung memberi kontak bantuan tanpa menunggu AI.
- HEALO adalah media edukasi dan skrining awal, **bukan alat diagnosis**.
