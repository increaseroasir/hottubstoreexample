/* deals-carousel.js — hot tub carousel */
(function() {
  const track = document.getElementById('mgcDealsTrack') || document.querySelector('.ps-deals__track');
  if (!track) return;
  const cards = Array.from(track.children);
  let current = 0;
  const visible = () => window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;

  function goTo(n) {
    const max = Math.max(0, cards.length - visible());
    current = Math.min(Math.max(n, 0), max);
    const w = cards[0] ? cards[0].offsetWidth + 24 : 0;
    track.style.transform = `translateX(-${current * w}px)`;
  }

  document.querySelectorAll('.ps-deals__arrow--prev, [data-deals-prev]').forEach(btn => btn.addEventListener('click', () => goTo(current - 1)));
  document.querySelectorAll('.ps-deals__arrow--next, [data-deals-next]').forEach(btn => btn.addEventListener('click', () => goTo(current + 1)));
  window.addEventListener('resize', () => goTo(current));
})();
