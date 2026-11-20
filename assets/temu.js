// TEMU "hidup" (2.5D): melayang, miring mengikuti kursor, dan berganti pose sesuai keadaan.
// Struktur: .temu-3d > .temu-tilt > (.temu-glow, .temu-float > img, .temu-bubble)
(function () {
  const POSES = {
    greet: 'img/temu-wink.webp',
    idle: 'img/temu-stand.webp',
    thinking: 'img/temu-sit.webp',
    happy: 'img/temu-jump.webp',
    calm: 'img/temu-sit.webp',
    walk: 'img/temu-walk.webp'
  };
  // Preload so pose changes are instant.
  Object.values(POSES).forEach((src) => { const i = new Image(); i.src = src; });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---- tilt toward the pointer (desktop only) ----
  if (!reduce && finePointer) {
    let raf = 0, mx = 0, my = 0;
    const update = () => {
      raf = 0;
      document.querySelectorAll('.temu-3d').forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const dx = Math.max(-1, Math.min(1, (mx - (r.left + r.width / 2)) / (window.innerWidth / 2)));
        const dy = Math.max(-1, Math.min(1, (my - (r.top + r.height / 2)) / (window.innerHeight / 2)));
        s.style.setProperty('--ry', (dx * 18).toFixed(2) + 'deg');
        s.style.setProperty('--rx', (-dy * 10).toFixed(2) + 'deg');
      });
    };
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
  }

  // ---- pose / state changes ----
  window.temuSet = function (stage, state, label) {
    if (!stage) return;
    const img = stage.querySelector('img');
    const src = POSES[state];
    if (img && src && img.getAttribute('src') !== src) {
      img.classList.remove('pop');
      void img.offsetWidth; // restart the pop animation
      img.setAttribute('src', src);
      img.classList.add('pop');
    }
    stage.dataset.state = state;
    const status = stage.id && document.querySelector('[data-temu-status="' + stage.id + '"]');
    if (status && label) status.textContent = label;
  };

  // Tap/click TEMU: a small happy hop.
  document.addEventListener('click', (e) => {
    const s = e.target.closest('.temu-3d');
    if (!s || s.dataset.state === 'thinking') return;
    const img = s.querySelector('img');
    img.classList.remove('hop'); void img.offsetWidth; img.classList.add('hop');
  });
})();
