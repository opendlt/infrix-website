// Canonical scroll-reveal wiring (owned by runbook 03). Adds `.is-in` to every
// `.ifx-reveal` element the first time it enters the viewport, then stops watching it.
//
// Safe under SSR (guards `window`), respects prefers-reduced-motion (the CSS in
// utilities.css already renders `.ifx-reveal` fully visible in that mode, so we
// simply reveal everything immediately and skip the observer), and degrades to an
// instant reveal where IntersectionObserver is missing.
//
// Designed to be called once per route (VitePress re-renders the DOM on navigation),
// so it re-scans on `router.onAfterRouteChange`.

const REVEALED = 'is-in';

function revealAll(): void {
  document.querySelectorAll('.ifx-reveal').forEach((el) => el.classList.add(REVEALED));
}

let observer: IntersectionObserver | null = null;

function scan(): void {
  if (typeof window === 'undefined') return;

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof IntersectionObserver === 'undefined') {
    revealAll();
    return;
  }

  observer ??= new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add(REVEALED);
          obs.unobserve(entry.target);   // one-shot
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
  );

  document.querySelectorAll('.ifx-reveal:not(.is-in)').forEach((el) => observer!.observe(el));
}

/** Wire the reveal observer; call from enhanceApp. Re-scans after each route change. */
export function installReveal(onAfterRouteChange: (cb: () => void) => void): void {
  if (typeof window === 'undefined') return;
  const run = () => requestAnimationFrame(scan);   // wait for the new DOM to paint
  run();
  onAfterRouteChange(() => run());
}
