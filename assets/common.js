// Shared helpers for every HEALO page.

// Words that suggest a risk of self-harm. Used by the chat (and mirrored on the server)
// to show crisis contacts right away, without waiting for the AI.
window.HEALO_CRISIS_WORDS = [
  'bunuh diri', 'bundir', 'ingin mati', 'pengen mati', 'pingin mati', 'pengin mati', 'mau mati',
  'mengakhiri hidup', 'akhiri hidup', 'akhirin hidup', 'menyakiti diri', 'nyakitin diri', 'melukai diri',
  'self harm', 'selfharm', 'self-harm', 'menyayat', 'nyayat', 'sayat tangan', 'gores tangan',
  'tidak ingin hidup', 'gak mau hidup', 'ga mau hidup', 'nggak mau hidup', 'tidak mau hidup',
  'lebih baik mati', 'mending mati', 'gantung diri', 'loncat dari gedung', 'minum racun', 'overdosis',
  'kill myself', 'suicide', 'want to die', 'end my life'
];

window.healoIsCrisis = function (text) {
  const t = (text || '').toLowerCase().replace(/\s+/g, ' ');
  return window.HEALO_CRISIS_WORDS.some((w) => t.includes(w));
};

// Offline support / "Add to Home Screen" (works once the site is online over https).
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
