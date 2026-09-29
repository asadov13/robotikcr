(() => {
  if (!['/', '/index.html'].includes(location.pathname)) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('#hero');
  const stage = hero?.querySelector('.hero-logo-stage');
  if (!hero || !stage) return;
  const start = async () => {
    try {
      const module = await import('/intro-scene.js?v=landing3d2');
      await module.createIntro(hero, () => {}, () => hero.classList.add('logo-ready'));
    } catch (err) {
      hero.classList.add('logo-fallback');
    }
  };
  if (reduced.matches) hero.classList.add('reduced-motion');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
