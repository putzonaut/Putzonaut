const deviceTabs = [...document.querySelectorAll('[role="tab"]')];
function selectDevice(tab, focus = false) {
  for (const item of deviceTabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  }
  if (focus) tab.focus();
}
for (const tab of deviceTabs) {
  tab.addEventListener('click', () => selectDevice(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = deviceTabs.indexOf(tab);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? deviceTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + deviceTabs.length) % deviceTabs.length;
    selectDevice(deviceTabs[next], true);
  });
}

// Each decorative app scene plays once, as it enters the viewport.
// Static final states remain visible without JS or with reduced motion.
const featureCards = [...document.querySelectorAll('.feature-card')];
const sceneMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (featureCards.length && 'IntersectionObserver' in window && !sceneMotion.matches) {
  const sceneObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('scene-visible');
      sceneObserver.unobserve(entry.target);
    }
  }, { threshold: 0.35 });
  for (const card of featureCards) sceneObserver.observe(card);
  sceneMotion.addEventListener('change', event => {
    if (event.matches) sceneObserver.disconnect();
  });
}

// The flame and scrubber move only while the scene is visible.
// The decorative scene starts automatically; reduced-motion stays still.
const mascotScene = document.querySelector('.hero-mascot');
if (mascotScene) {
  const heroCopy = mascotScene.closest('.hero-copy');
  const quietMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let mascotReady = false;
  let inView = false;
  function syncRocket() {
    const canAnimate = mascotReady && !quietMotion.matches;
    heroCopy.classList.toggle('rocket-active', canAnimate && inView && !document.hidden);
  }
  quietMotion.addEventListener('change', syncRocket);
  document.addEventListener('visibilitychange', syncRocket);
  const mascotAsset = new Image();
  mascotAsset.src = '/website-assets/putzonaut-rocket.webp';
  Promise.all([mascotAsset.decode(), document.fonts.ready]).then(() => {
    mascotReady = true;
    heroCopy.classList.add('rocket-ready');
    if ('IntersectionObserver' in window) {
      const mascotObserver = new IntersectionObserver(entries => {
        inView = entries.some(entry => entry.isIntersecting);
        syncRocket();
      }, { threshold: .2 });
      mascotObserver.observe(mascotScene);
    } else {
      inView = true;
    }
    syncRocket();
  }).catch(() => { mascotScene.hidden = true; });
}
