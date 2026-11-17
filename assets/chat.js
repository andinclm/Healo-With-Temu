// Tanya TEMU: chat with the AI companion through the server function /api/temu.
// The API key never reaches the browser.
(function () {
  const log = document.getElementById('log');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('input');
  const send = document.getElementById('send');
  const history = []; // {role: 'user' | 'model', text}

  const CRISIS_REPLY =
    'Terima kasih sudah mau cerita. Kedengarannya kamu sedang sangat berat sekarang, dan keselamatanmu yang paling penting.\n\n' +
    'Tolong hubungi bantuan sekarang juga:\n' +
    '• Darurat: 112\n' +
    '• Healing119 Kemenkes: 119 ekstensi 8 (healing119.id)\n' +
    '• Atau temui guru BK, orang tua, atau orang dewasa yang kamu percaya, dan jangan sendirian dulu.\n\n' +
    'Kamu tidak harus menghadapinya sendirian. Aku tetap di sini kalau kamu mau lanjut ngobrol.';

  function add(role, text, extra) {
    const div = document.createElement('div');
    div.className = 'msg ' + (role === 'user' ? 'user' : 'bot') + (extra ? ' ' + extra : '');
    div.textContent = text; // plain text only (no HTML injection)
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  add('model', 'Hai, aku TEMU! 🦔\nAku bisa menemanimu ngobrol soal perasaan, stres, trauma, atau cara mencari bantuan. Aku bukan psikolog dan tidak bisa mendiagnosis, tapi aku siap mendengarkan. Mau cerita apa hari ini?');

  async function ask(text) {
    add('user', text);
    history.push({ role: 'user', text });

    if (window.healoIsCrisis(text)) {
      add('model', CRISIS_REPLY, 'crisis');
      history.push({ role: 'model', text: CRISIS_REPLY });
      return;
    }

    send.disabled = true;
    const typing = add('model', 'TEMU sedang mengetik...', 'typing');
    try {
      const res = await fetch('/api/temu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-10) })
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();
      const reply = data.reply || 'Maaf, TEMU belum bisa menjawab sekarang. Coba lagi sebentar lagi, ya.';
      add('model', reply, data.crisis ? 'crisis' : '');
      history.push({ role: 'model', text: reply });
    } catch (e) {
      typing.remove();
      add('model', 'Maaf, TEMU tidak bisa terhubung. Fitur AI hanya aktif setelah HEALO dipasang di Netlify (lihat README). Sambil menunggu, kamu bisa membaca materi Edukasi atau membuka Pusat Bantuan.');
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
