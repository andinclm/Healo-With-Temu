// HEALO: forwards a finished screening to the chosen school's Google Sheet (guru BK).
// Each school has its own sheet, so SMAN 1 never sees SMAN 3 data and vice versa.
//
// Netlify environment variables:
//   SHEET_URL_SMAN1  Apps Script web-app URL of SMAN 1's sheet (ends in /exec)
//   SHEET_URL_SMAN3  Apps Script web-app URL of SMAN 3's sheet
//   SHEET_SECRET     the same secret code written in both Apps Scripts
//
// The score is recalculated here, so the sheet does not depend on what the browser claims.

const SCHOOLS = {
  sman1: { name: 'SMA Negeri 1 Surakarta', env: 'SHEET_URL_SMAN1' },
  sman3: { name: 'SMA Negeri 3 Surakarta', env: 'SHEET_URL_SMAN3' }
};
const EVENTS = {
  bencana: 'Bencana alam',
  kecelakaan: 'Kecelakaan serius',
  kekerasan_fisik: 'Kekerasan fisik / ancaman',
  kekerasan_seksual: 'Kekerasan / pelecehan seksual',
  sakit: 'Penyakit / cedera mengancam nyawa',
  kehilangan: 'Kematian mendadak orang tercinta',
  lainnya: 'Kejadian sangat menekan lainnya',
  tidak_pernah: 'Tidak pernah mengalami peristiwa traumatis',
  tidak_mau: 'Tidak ingin menyebutkan'
};
const CLUSTERS = [
  { key: 'B', items: [1, 2, 3, 4, 5], need: 1 },
  { key: 'C', items: [6, 7], need: 1 },
  { key: 'D', items: [8, 9, 10, 11, 12, 13, 14], need: 2 },
  { key: 'E', items: [15, 16, 17, 18, 19, 20], need: 2 }
];
const CUTOFF = 31;

export function scorePCL5(a) {
  const total = a.reduce((s, v) => s + v, 0);
  const clusters = CLUSTERS.map((c) => {
    const vals = c.items.map((i) => a[i - 1]);
    return { key: c.key, sum: vals.reduce((s, v) => s + v, 0), met: vals.filter((v) => v >= 2).length >= c.need };
  });
  const pattern = clusters.every((c) => c.met);
  return { total, clusters, pattern, followUp: total >= CUTOFF || pattern, crisis: a[15] >= 3 };
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'bad json' }, 400); }

  const school = SCHOOLS[body?.school];
  if (!school) return json({ ok: false, error: 'sekolah tidak dikenal' }, 400);
  const nama = clean(body.nama, 60);
  const kelas = clean(body.kelas, 20);
  if (nama.length < 2 || !kelas) return json({ ok: false, error: 'nama/kelas kosong' }, 400);
  const event = EVENTS[body.event] ? body.event : '';
  if (!event) return json({ ok: false, error: 'kejadian tidak valid' }, 400);

  const row = {
    sekolah: school.name, nama, kelas, kejadian: EVENTS[event],
    status: '', total: '', B: '', C: '', D: '', E: '', pola_dsm5: '', krisis_item16: '', jawaban: ''
  };
  if (event === 'tidak_pernah') {
    row.status = 'Tidak mengisi PCL-5 (tidak ada peristiwa traumatis)';
  } else {
    const a = body.answers;
    if (!Array.isArray(a) || a.length !== 20 || !a.every((v) => Number.isInteger(v) && v >= 0 && v <= 4)) {
      return json({ ok: false, error: 'jawaban tidak lengkap' }, 400);
    }
    const r = scorePCL5(a);
    row.status = r.followUp ? 'Perlu tindak lanjut' : 'Di bawah ambang batas';
    row.total = r.total;
    r.clusters.forEach((c) => { row[c.key] = c.sum; });
    row.pola_dsm5 = r.pattern ? 'Ya' : 'Tidak';
    row.krisis_item16 = r.crisis ? 'YA - segera hubungi siswa' : 'Tidak';
    row.jawaban = a.join(',');
  }

  const env = (k) => (globalThis.Netlify?.env?.get?.(k)) ?? process.env[k];
  const url = env(school.env);
  const secret = env('SHEET_SECRET');
  if (!url || !secret) {
    console.error('Missing', school.env, 'or SHEET_SECRET');
    return json({ ok: false, error: 'penyimpanan sekolah belum diatur' }, 500);
  }

  try {
    // Apps Script answers with a redirect; fetch follows it and returns the script's JSON.
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret, ...row })
    });
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch { /* not JSON */ }
    if (!res.ok || !data.ok) {
      console.error('Sheet error', res.status, text.slice(0, 300));
      return json({ ok: false, error: 'sheet ' + res.status + ' ' + (data.error || '') }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'tidak bisa menghubungi sheet' }, 502);
  }
};

export const config = { path: '/api/submit' };
