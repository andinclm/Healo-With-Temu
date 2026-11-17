// PCL-5 screening for HEALO.
// Rules follow the HEALO paper:
//  - "Never experienced" a traumatic event -> guidance only, no PCL-5.
//  - All 20 items are required (0-4 each, total 0-80).
//  - "Needs follow-up" when total >= 31 (Bovin et al., 2016) OR the DSM-5 pattern is met:
//    items rated >= 2 count as symptoms; >=1 in B (1-5), >=1 in C (6-7), >=2 in D (8-14), >=2 in E (15-20).
//  - Item 16 rated >= 3 -> crisis help box.
// Everything is computed in the browser; nothing is sent or stored.
// NOTE: the Indonesian wording below is a working translation; have it reviewed by the psychologists.

(function () {
  const ITEMS = [
    'Ingatan yang berulang, mengganggu, dan tidak diinginkan tentang kejadian tersebut?',
    'Mimpi buruk yang berulang tentang kejadian tersebut?',
    'Tiba-tiba merasa atau bertindak seolah-olah kejadian itu benar-benar terjadi lagi (seperti kembali ke saat itu dan mengalaminya lagi)?',
    'Merasa sangat terganggu atau sedih ketika ada sesuatu yang mengingatkanmu pada kejadian tersebut?',
    'Mengalami reaksi fisik yang kuat ketika ada sesuatu yang mengingatkanmu pada kejadian tersebut (misalnya jantung berdebar, sulit bernapas, berkeringat)?',
    'Menghindari ingatan, pikiran, atau perasaan yang berhubungan dengan kejadian tersebut?',
    'Menghindari hal-hal di sekitarmu yang mengingatkan pada kejadian tersebut (misalnya orang, tempat, percakapan, kegiatan, benda, atau situasi)?',
    'Sulit mengingat bagian-bagian penting dari kejadian tersebut?',
    'Memiliki keyakinan negatif yang kuat tentang dirimu, orang lain, atau dunia (misalnya berpikir: "Aku orang jahat", "Ada yang sangat salah denganku", "Tidak ada yang bisa dipercaya", "Dunia ini sepenuhnya berbahaya")?',
    'Menyalahkan diri sendiri atau orang lain atas kejadian tersebut atau hal yang terjadi setelahnya?',
    'Memiliki perasaan negatif yang kuat seperti takut, ngeri, marah, bersalah, atau malu?',
    'Kehilangan minat pada kegiatan yang dulu kamu sukai?',
    'Merasa jauh atau terputus dari orang lain?',
    'Sulit merasakan perasaan positif (misalnya tidak bisa merasa bahagia atau merasa sayang kepada orang-orang terdekat)?',
    'Mudah tersinggung, meledak-ledak karena marah, atau bertindak agresif?',
    'Terlalu banyak mengambil risiko atau melakukan hal-hal yang bisa membahayakan dirimu?',
    'Merasa sangat siaga, selalu waspada, atau berjaga-jaga?',
    'Mudah terkejut atau kaget?',
    'Sulit berkonsentrasi?',
    'Sulit tidur atau sering terbangun di malam hari?'
  ];
  const SCALE = ['Tidak sama sekali', 'Sedikit', 'Sedang', 'Cukup berat', 'Sangat berat'];
  const CLUSTERS = [
    { key: 'B', name: 'Ingatan mengganggu', items: [1, 2, 3, 4, 5], need: 1 },
    { key: 'C', name: 'Menghindar', items: [6, 7], need: 1 },
    { key: 'D', name: 'Pikiran & suasana hati', items: [8, 9, 10, 11, 12, 13, 14], need: 2 },
    { key: 'E', name: 'Waspada & reaksi', items: [15, 16, 17, 18, 19, 20], need: 2 }
  ];
  const CUTOFF = 31;

  // ---- pure scoring (exported for testing) ----
  function score(answers) {
    // answers: array of 20 integers 0-4
    const total = answers.reduce((s, v) => s + v, 0);
    const clusters = CLUSTERS.map((c) => {
      const vals = c.items.map((i) => answers[i - 1]);
      return {
        key: c.key, name: c.name,
        sum: vals.reduce((s, v) => s + v, 0),
        max: vals.length * 4,
        symptoms: vals.filter((v) => v >= 2).length,
        met: vals.filter((v) => v >= 2).length >= c.need
      };
    });
    const pattern = clusters.every((c) => c.met);
    return {
      total,
      clusters,
      pattern,
      followUp: total >= CUTOFF || pattern,
      crisis: answers[15] >= 3
    };
  }
  window.healoScorePCL5 = score;
  if (typeof document === 'undefined' || !document.getElementById('pcl')) return;

  // ---- UI ----
  const $ = (id) => document.getElementById(id);
  const panels = ['p-consent', 'p-event', 'p-items', 'p-result', 'p-guidance'];
  const stepIndex = { 'p-consent': 0, 'p-event': 1, 'p-guidance': 1, 'p-items': 2, 'p-result': 3 };
  function show(id) {
    panels.forEach((p) => { $(p).hidden = p !== id; });
    const idx = stepIndex[id];
    [...$('steps').children].forEach((li, i) => {
      li.className = i < idx ? 'done' : i === idx ? 'active' : '';
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // build items
  const form = $('pcl');
  ITEMS.forEach((text, i) => {
    const n = i + 1;
    const div = document.createElement('fieldset');
    div.className = 'item';
    div.id = 'item-' + n;
    const legend = document.createElement('legend');
    legend.textContent = n + '. ' + text;
    legend.style.fontWeight = '700';
    div.appendChild(legend);
    const scale = document.createElement('div');
    scale.className = 'scale';
    SCALE.forEach((label, v) => {
      const l = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'q' + n; input.value = String(v);
      const span = document.createElement('span');
      span.innerHTML = '<strong>' + v + '</strong><br>' + label;
      l.appendChild(input); l.appendChild(span);
      scale.appendChild(l);
    });
    div.appendChild(scale);
    form.appendChild(div);
  });

  function readAnswers() {
    return ITEMS.map((_, i) => {
      const c = form.querySelector('input[name="q' + (i + 1) + '"]:checked');
      return c ? Number(c.value) : null;
    });
  }
  form.addEventListener('change', (e) => {
    const a = readAnswers();
    const done = a.filter((v) => v !== null).length;
    $('bar').style.width = (done / 20 * 100) + '%';
    $('count').textContent = done + ' dari 20 terjawab';
    const item = e.target.closest('.item');
    if (item) item.classList.remove('missing');
  });

  $('consent').addEventListener('change', (e) => { $('to-event').disabled = !e.target.checked; });
  $('to-event').addEventListener('click', () => show('p-event'));
  document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => show(b.dataset.back)));

  $('to-items').addEventListener('click', () => {
    const ev = document.querySelector('input[name="event"]:checked');
    if (!ev) { $('event-error').textContent = 'Pilih salah satu jawaban dulu, ya.'; return; }
    $('event-error').textContent = '';
    if (ev.value === 'tidak_pernah') show('p-guidance'); else show('p-items');
  });

  $('submit').addEventListener('click', () => {
    const a = readAnswers();
    const missing = a.map((v, i) => (v === null ? i + 1 : null)).filter(Boolean);
    if (missing.length) {
      missing.forEach((n) => $('item-' + n).classList.add('missing'));
      $('items-error').hidden = false;
      $('items-error').textContent = 'Masih ada ' + missing.length + ' pertanyaan yang belum dijawab (nomor ' + missing.join(', ') + '). Semua pertanyaan wajib diisi.';
      $('item-' + missing[0]).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    $('items-error').hidden = true;
    renderResult(score(a));
    show('p-result');
  });

  $('restart').addEventListener('click', () => {
    form.reset(); $('consent').checked = false; $('to-event').disabled = true;
    document.querySelectorAll('input[name="event"]').forEach((r) => { r.checked = false; });
    $('bar').style.width = '0'; $('count').textContent = '0 dari 20 terjawab';
    show('p-consent');
  });

  function renderResult(r) {
    const crisis = r.crisis ? `
      <div class="crisis-box" role="alert">
        <h3>Keselamatanmu yang utama</h3>
        <p>Jawabanmu menunjukkan kamu mungkin sering melakukan hal yang berisiko atau bisa membahayakan dirimu. Tolong bicarakan ini dengan seseorang sekarang.</p>
        <p><strong>Darurat: <a href="tel:112">112</a></strong> · Healing119 Kemenkes: <a href="tel:119">119 ekstensi 8</a> (<a href="https://healing119.id" target="_blank" rel="noopener">healing119.id</a>) · atau temui guru BK.</p>
      </div>` : '';
    const label = r.followUp ? 'Perlu tindak lanjut' : 'Di bawah ambang batas';
    const color = r.followUp ? 'pink' : 'lagoon';
    const why = r.followUp
      ? (r.total >= CUTOFF
          ? `Skor totalmu ${r.total} berada di atas ambang batas ${CUTOFF}.`
          : `Skor totalmu ${r.total}, tetapi pola jawabanmu cocok dengan pola gejala DSM-5.`)
        + ' Ini artinya ada gejala yang sebaiknya kamu bicarakan dengan guru BK, psikolog, atau psikiater.'
      : `Skor totalmu ${r.total}, di bawah ambang batas ${CUTOFF}, dan pola gejala DSM-5 tidak terpenuhi. Kalau kamu tetap merasa terganggu, bercerita kepada orang yang dipercaya atau guru BK tetap sangat dianjurkan.`;
    const bars = r.clusters.map((c) => `
      <div class="row"><span>${c.key} · ${c.name}</span><div class="track"><div class="fill" style="width:${(c.sum / c.max * 100).toFixed(0)}%"></div></div><span>${c.sum}/${c.max}</span></div>`).join('');
    $('result').innerHTML = `
      ${crisis}
      <div class="card ${color}">
        <span class="pill">${label}</span>
        <p style="margin-top:1rem" class="small">Skor total PCL-5</p>
        <p class="result-score">${r.total}<span style="font-size:1.2rem"> / 80</span></p>
        <p>${why}</p>
        <div class="cluster-bars">${bars}</div>
        <p class="notice"><strong>Ini bukan diagnosis.</strong> PCL-5 adalah alat skrining. Hanya psikolog atau psikiater yang dapat menegakkan diagnosis PTSD melalui pemeriksaan langsung.</p>
        <button class="btn btn-ghost" type="button" onclick="window.print()">Cetak / simpan hasil</button>
      </div>`;
  }
})();
