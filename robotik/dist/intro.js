(() => {
  if (!['/', '/index.html'].includes(location.pathname)) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const quietMotion = () => { try { return reduced.matches; } catch { return reduced.matches; } };
  let active = false;
  async function play(manual = false) {
    if (active) return;
    active = true;
    const previous = document.activeElement;
    const panel = document.createElement('div');
    panel.className = 'intro-screen';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'EGE Robotik Cərrahiyyə açılış animasiyası');
    panel.innerHTML = `<div class="intro-top"><span>EGE HOSPITAL <i> / </i> ROBOTİK CƏRRAHİYYƏ</span><button class="intro-skip">Keç <span aria-hidden="true"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></span></button></div><div class="intro-stage" aria-hidden="true"></div><div class="intro-brand"><img src="/assets/ege-logo-animated.svg" alt="EGE Robotik Cərrahiyyə Mərkəzi"><p>Cərrahiyyədə yeni dövr.</p></div><p class="intro-slogan">Cərrahiyyədə<br><strong>yeni dövr.</strong></p><div class="intro-bottom"><span>CƏRRAHİYYƏDƏ<br><strong>YENİ DÖVR.</strong></span><span class="intro-caption">Hər hərəkətdə dəqiqlik.</span></div>`;
    document.body.append(panel);
    const siblings = [...document.body.children].filter(x => x !== panel && x.tagName !== 'SCRIPT');
    const old = siblings.map(x => x.inert);
    siblings.forEach(x => x.inert = true);
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    let dispose, finished = false, watchdog;
    const end = () => {
      if (finished) return;
      finished = true;
      clearTimeout(watchdog);
      document.removeEventListener('keydown', onKey);
      panel.classList.add('intro-leave');
      dispose?.();
      siblings.forEach((x, i) => x.inert = old[i]);
      document.documentElement.style.overflow = overflow;
      if (previous && previous !== document.body) previous.focus({preventScroll:true});
      else document.querySelector('main')?.focus({preventScroll:true});
      setTimeout(() => { panel.remove(); active = false; }, quietMotion() ? 0 : 260);
    };
    const onKey = e => { if (e.key === 'Escape') end(); if(e.key === 'Tab') {e.preventDefault(); panel.querySelector('button').focus();} };
    const fallback = () => {
      if (finished) return;
      clearTimeout(watchdog);
      dispose?.();
      panel.classList.remove('intro-modelled');
      panel.classList.add('intro-reveal');
      watchdog = setTimeout(end, 2400);
    };
    watchdog = setTimeout(fallback, 8000);
    panel.querySelector('button').onclick = end;
    panel.querySelector('button').focus({preventScroll:true});
    document.addEventListener('keydown', onKey);
    try {
      if(quietMotion()) { fallback(); return; }

      const module = await import('/intro-scene.js?v=13');
      if (!finished) { const cleanup = await module.createIntro(panel, end, () => { if(finished)return; clearTimeout(watchdog); panel.classList.add('intro-modelled'); panel.classList.remove('intro-reveal'); watchdog=setTimeout(end, 12000); }); if(finished) cleanup(); else dispose=cleanup; }
    } catch { fallback(); }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => play(), {once:true});
  else play();
})();
