// Netlify Function: /api/temu
// Sends the chat to Google Gemini. The API key stays on the server
// (set GEMINI_API_KEY in Netlify > Site configuration > Environment variables).

const MODEL_DEFAULT = 'gemini-3.5-flash-lite';

const SYSTEM = `Kamu adalah TEMU, maskot landak dan teman ngobrol AI di aplikasi HEALO ("Temukan Perasaanmu – Find Your Feelings").
HEALO dibuat oleh siswa SMA Negeri 3 Surakarta untuk edukasi PTSD, skrining awal PCL-5, dan menghubungkan siswa dengan bantuan profesional. Penggunanya siswa SMA berusia 18 tahun ke atas.

Cara kamu menjawab:
- Bahasa Indonesia yang hangat, sederhana, dan sopan; panggil pengguna "kamu". Boleh santai, jangan menggurui.
- Singkat: maksimal sekitar 120 kata. Teks biasa saja, tanpa markdown, tanpa tanda bintang.
- Dengarkan dulu dan validasi perasaan pengguna sebelum memberi saran.
- Topikmu: perasaan, stres, trauma, PTSD, cara menenangkan diri yang sehat (napas pelan, grounding, tidur cukup, bercerita ke orang yang dipercaya), cara mencari bantuan, dan fitur HEALO (Edukasi, Skrining PCL-5, Pusat Bantuan).
- Jelaskan bedanya stres sehari-hari, peristiwa traumatis, dan PTSD bila relevan. Gagal ujian bukan peristiwa traumatis menurut DSM-5.

Batasan yang WAJIB:
- Kamu BUKAN psikolog atau dokter. Jangan pernah mendiagnosis ("kamu kena PTSD"), jangan menyebut nama atau dosis obat, dan jangan menggantikan terapi.
- Kalau pengguna bertanya apakah dirinya PTSD, jelaskan bahwa hanya psikolog/psikiater yang bisa menentukan, lalu sarankan skrining PCL-5 di HEALO sebagai langkah awal dan bicara dengan guru BK atau psikolog.
- Jangan meminta data pribadi (nama lengkap, alamat, nomor HP, sekolah).
- Jika ada tanda bahaya, seperti keinginan mati, menyakiti diri, atau disakiti orang lain: utamakan keselamatan, tunjukkan empati, dan berikan kontak: Darurat 112; Healing119 Kemenkes 119 ekstensi 8 (healing119.id); serta sarankan segera menemui guru BK atau orang dewasa yang dipercaya.
- Jika pertanyaan di luar topik kesehatan mental, jawab sangat singkat lalu arahkan kembali dengan ramah.
- Jangan mengaku manusia.`;

const CRISIS_WORDS = [
  'bunuh diri', 'bundir', 'ingin mati', 'pengen mati', 'pingin mati', 'pengin mati', 'mau mati',
  'mengakhiri hidup', 'akhiri hidup', 'akhirin hidup', 'menyakiti diri', 'nyakitin diri', 'melukai diri',
  'self harm', 'selfharm', 'self-harm', 'menyayat', 'nyayat', 'sayat tangan', 'gores tangan',
  'tidak ingin hidup', 'gak mau hidup', 'ga mau hidup', 'nggak mau hidup', 'tidak mau hidup',
  'lebih baik mati', 'mending mati', 'gantung diri', 'loncat dari gedung', 'minum racun', 'overdosis',
  'kill myself', 'suicide', 'want to die', 'end my life'
];

const CRISIS_REPLY =
  'Terima kasih sudah mau cerita. Kedengarannya kamu sedang sangat berat sekarang, dan keselamatanmu yang paling penting.\n\n' +
  'Tolong hubungi bantuan sekarang juga:\n• Darurat: 112\n• Healing119 Kemenkes: 119 ekstensi 8 (healing119.id)\n' +
  '• Atau temui guru BK, orang tua, atau orang dewasa yang kamu percaya, dan jangan sendirian dulu.\n\n' +
  'Kamu tidak harus menghadapinya sendirian.';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

export function isCrisis(text) {
  const t = String(text || '').toLowerCase().replace(/\s+/g, ' ');
  return CRISIS_WORDS.some((w) => t.includes(w));
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ reply: 'Pesan tidak terbaca. Coba lagi, ya.' }, 400); }

  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .slice(-10)
    .map((m) => ({ role: m.role === 'model' ? 'model' : 'user', text: m.text.slice(0, 800) }));
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') return json({ reply: 'Tulis pesanmu dulu, ya.' }, 400);

  // Safety first: crisis words get fixed, checked contacts without calling the AI.
  if (isCrisis(last.text)) return json({ reply: CRISIS_REPLY, crisis: true });

  const env = (k) => (globalThis.Netlify?.env?.get?.(k)) ?? process.env[k];
  const key = env('GEMINI_API_KEY');
  const model = env('GEMINI_MODEL') || MODEL_DEFAULT;
  if (!key) {
    return json({ reply: 'TEMU belum disambungkan ke AI. Admin perlu mengisi GEMINI_API_KEY di pengaturan Netlify.' }, 500);
  }

  // Gemini needs the conversation to start with a user turn.
  while (messages.length && messages[0].role !== 'user') messages.shift();

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        generationConfig: { temperature: 0.6, maxOutputTokens: 400 }
      })
    });
    if (res.status === 429) {
      return json({ reply: 'TEMU lagi banyak yang ajak ngobrol nih. Tunggu sekitar satu menit, lalu coba lagi, ya. Kalau butuh bantuan segera, buka Pusat Bantuan.' }, 429);
    }
    if (!res.ok) {
      const detail = await res.text();
      console.error('Gemini error', res.status, detail);
      return json({ reply: 'Maaf, TEMU sedang mengalami gangguan. (Kode ' + res.status + ': ' + detail.slice(0, 300) + ')' }, 502);
    }
    const data = await res.json();
    const reply = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    return json({
      reply: reply || 'Maaf, aku belum bisa menjawab itu. Kamu bisa coba tanyakan dengan kalimat lain, ya.'
    });
  } catch (err) {
    console.error(err);
    return json({ reply: 'Maaf, TEMU tidak bisa terhubung ke AI saat ini. Coba lagi sebentar lagi, ya.' }, 502);
  }
};

export const config = { path: '/api/temu' };
