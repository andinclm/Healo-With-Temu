/**
 * HEALO – penerima data skrining untuk SATU sekolah.
 * Pasang skrip ini di Google Sheet milik guru BK masing-masing sekolah
 * (satu Sheet untuk SMAN 1, satu Sheet lain untuk SMAN 3).
 *
 * Cara pasang (ringkas, lihat README):
 * 1. Buka Google Sheet sekolah > Ekstensi > Apps Script > hapus isi, tempel file ini.
 * 2. Ganti SECRET di bawah dengan kode rahasia yang SAMA dengan SHEET_SECRET di Netlify.
 * 3. (Opsional) isi NOTIFY_EMAIL dengan email guru BK agar dapat notifikasi
 *    saat ada siswa yang "Perlu tindak lanjut" atau tanda krisis.
 * 4. Terapkan > Deployment baru > Jenis: Aplikasi web
 *    - Jalankan sebagai: Saya
 *    - Yang memiliki akses: Siapa saja
 *    Salin URL yang berakhiran /exec ke Netlify (SHEET_URL_SMAN1 atau SHEET_URL_SMAN3).
 */
const SECRET = 'GANTI_DENGAN_KODE_RAHASIA';
const NOTIFY_EMAIL = '';          // contoh: 'gurubk@sekolah.sch.id'
const SHEET_NAME = 'Skrining HEALO';

const HEADERS = ['Waktu', 'Sekolah', 'Nama', 'Kelas', 'Kejadian', 'Status', 'Skor total (0-80)',
  'B Ingatan (0-20)', 'C Menghindar (0-8)', 'D Pikiran & suasana hati (0-28)', 'E Waspada & reaksi (0-24)',
  'Pola DSM-5', 'Krisis (item 16 >= 3)', 'Jawaban item 1-20', 'Tindak lanjut BK', 'Catatan'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return out({ ok: false, error: 'unauthorized' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#15484C').setFontColor('#FFF8EE');
      sh.setFrozenRows(1);
    }
    const row = [new Date(), d.sekolah, d.nama, d.kelas, d.kejadian, d.status, d.total,
      d.B, d.C, d.D, d.E, d.pola_dsm5, d.krisis_item16, d.jawaban, '', ''].map(safe);
    sh.appendRow(row);

    const r = sh.getLastRow();
    if (String(d.krisis_item16).indexOf('YA') === 0) sh.getRange(r, 1, 1, HEADERS.length).setBackground('#FFC9D5');
    else if (d.status === 'Perlu tindak lanjut') sh.getRange(r, 1, 1, HEADERS.length).setBackground('#FFE7B8');

    if (NOTIFY_EMAIL && (d.status === 'Perlu tindak lanjut' || String(d.krisis_item16).indexOf('YA') === 0)) {
      MailApp.sendEmail(NOTIFY_EMAIL, '[HEALO] Siswa perlu tindak lanjut: ' + d.nama + ' (' + d.kelas + ')',
        'Ada hasil skrining HEALO baru yang perlu ditindaklanjuti.\n\n' +
        'Nama: ' + d.nama + '\nKelas: ' + d.kelas + '\nStatus: ' + d.status +
        '\nSkor total: ' + d.total + '\nTanda krisis: ' + d.krisis_item16 +
        '\n\nLihat detail di Google Sheet: ' + ss.getUrl() +
        '\n\nIngat: hasil PCL-5 bukan diagnosis. Rujuk ke psikolog/Puskesmas mitra bila perlu.');
    }
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

// Stops text like "=..." from being run as a spreadsheet formula.
function safe(v) {
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v === undefined ? '' : v;
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
