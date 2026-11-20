// Tanya TEMU: chat with the AI companion through the server function /api/temu.
// The API key never reaches the browser.
(function () {
  const log = document.getElementById('log');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('input');
  const send = document.getElementById('send');
  const history = []; // {role: 'user' | 'model', text}

  const CRISIS_REPLY =
    'Terima kasih sudah mau bercerita. Tampaknya kamu sedang menghadapi masa yang sangat berat, dan keselamatanmu yang paling penting.\n\n' +
    'Tolong hubungi bantuan sekarang juga:\n' +
    '• Darurat: 112\n' +
    '• Healing119 Kemenkes: 119 ekstensi 8 (healing119.id)\n' +
    '• Atau temui guru BK, orang tua, atau orang dewasa yang kamu percaya, dan usahakan tidak sendirian untuk sementara.\n\n' +
    'Kamu tidak harus menghadapinya sendirian. Aku tetap di sini jika kamu ingin melanjutkan percakapan.';

  function add(role, text, extra) {
    const div = document.createElement('div');
    div.className = 'msg ' + (role === 'user' ? 'user' : 'bot') + (extra ? ' ' + extra : '');
    div.textContent = text; // plain text only (no HTML injection)
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  add('model', 'Halo, aku TEMU! 🦔\nAku dapat menemanimu berbincang tentang perasaan, stres, trauma, atau cara mencari bantuan. Aku bukan psikolog dan tidak dapat mendiagnosis, tetapi aku siap mendengarkan. Apa yang ingin kamu ceritakan hari ini?');

  const avatar = document.getElementById('temu-avatar');
  const mood = (state, label) => window.temuSet && window.temuSet(avatar, state, label);
  let idleTimer = 0;
  const backToIdle = (ms) => { clearTimeout(idleTimer); idleTimer = setTimeout(() => mood('idle', 'TEMU siap mendengarkan.'), ms); };
  backToIdle(2600);

  async function ask(text) {
    clearTimeout(idleTimer);
    add('user', text);
    history.push({ role: 'user', text });

    if (window.healoIsCrisis(text)) {
      add('model', CRISIS_REPLY, 'crisis');
      history.push({ role: 'model', text: CRISIS_REPLY });
      mood('calm', 'Keselamatanmu yang utama. TEMU tetap di sini.');
      return;
    }

    send.disabled = true;
    const typing = add('model', 'TEMU sedang berpikir...', 'typing');
    mood('thinking', 'TEMU sedang berpikir...');
    try {
      const res = await fetch('/api/temu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-10) })
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();
      const reply = data.reply || 'Maaf, TEMU belum dapat menjawab saat ini. Silakan coba beberapa saat lagi.';
      add('model', reply, data.crisis ? 'crisis' : '');
      history.push({ role: 'model', text: reply });
      if (data.crisis) mood('calm', 'Keselamatanmu yang utama. TEMU tetap di sini.');
      else if (res.ok) { mood('happy', 'TEMU sudah menjawab!'); backToIdle(2400); }
      else { mood('calm', 'Maaf, TEMU sedang mengalami gangguan.'); backToIdle(4000); }
    } catch (e) {
      typing.remove();
      mood('calm', 'TEMU belum dapat terhubung.');
      backToIdle(4000);
      add('model', 'Maaf, TEMU tidak dapat terhubung. Fitur AI hanya aktif setelah HEALO dipasang di Netlify (lihat README). Sambil menunggu, kamu bisa membaca materi Edukasi atau membuka Pusat Bantuan.');
    } finally {
      send.disabled = false;
      input.focus();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || send.disabled) return;
    input.value = '';
    input.style.height = '';
    ask(text.slice(0, 800));
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
  });
  document.querySelectorAll('#suggest button').forEach((b) =>
    b.addEventListener('click', () => { if (!send.disabled) ask(b.textContent); }));
})();
