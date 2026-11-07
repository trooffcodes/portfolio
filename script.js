/* ==========================================================================
   Trooff Design — Independent Web Design Studio
   script.js · Lenis smooth scroll, GSAP/ScrollTrigger motion, menu,
   clipboard, toast — all with graceful degradation.
   ========================================================================== */

(() => {
  'use strict';

  const EMAIL = 'trooffcodes@proton.me';

  const prefersReduced =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hasGsap = typeof window.gsap !== 'undefined';
  const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';
  const animate = hasGsap && hasScrollTrigger && !prefersReduced;

  /* ------------------------------ Icons --------------------------------- */

  if (typeof window.lucide !== 'undefined' && window.lucide.createIcons) {
    window.lucide.createIcons();
  }

  /* ------------------------ Lenis smooth scrolling ----------------------- */

  let lenis = null;

  if (!prefersReduced && hasLenis) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    document.documentElement.classList.add('lenis');

    if (animate) {
      // Drive Lenis through GSAP's ticker so ScrollTrigger stays in sync.
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  }

  /* --------------------------- Header state ------------------------------ */

  const header = document.getElementById('site-header');

  const setHeaderState = (y) => {
    header.classList.toggle('is-scrolled', y > 10);
  };

  if (lenis) {
    lenis.on('scroll', ({ scroll }) => setHeaderState(scroll));
  } else {
    window.addEventListener(
      'scroll',
      () => setHeaderState(window.scrollY),
      { passive: true }
    );
  }

  /* --------------------------- Mobile menu ------------------------------- */

  const menuToggle = document.getElementById('menu-toggle');
  const menuOverlay = document.getElementById('menu-overlay');

  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuOverlay.setAttribute('aria-hidden', String(!open));
    if (lenis) {
      if (open) lenis.stop();
      else lenis.start();
    }
  };

  menuToggle.addEventListener('click', () => {
    setMenu(!document.body.classList.contains('menu-open'));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setMenu(false);
    }
  });

  menuOverlay.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  /* ------------------------- Smooth anchor links ------------------------- */

  const HEADER_OFFSET = -(72 + 20);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    link.addEventListener('click', (e) => {
      const target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();

      if (lenis) {
        lenis.scrollTo(hash === '#top' ? 0 : target, {
          offset: hash === '#top' ? 0 : HEADER_OFFSET,
        });
      } else {
        const top =
          hash === '#top'
            ? 0
            : target.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
      }
    });
  });

  /* ------------------------------ Motion --------------------------------- */

  if (animate) {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    // Gate the CSS initial states only once we know we can animate them.
    document.documentElement.classList.add('js');

    // Hero intro — editorial line-mask reveal, then supporting cast.
    const intro = gsap.timeline({
      defaults: { ease: 'power4.out' },
      delay: 0.2,
    });
    intro
      .to('.hero-title .line-inner', {
        y: 0,
        duration: 1.25,
        stagger: 0.1,
      })
      .to(
        '[data-hero]',
        { autoAlpha: 1, y: 0, duration: 1.05, stagger: 0.12 },
        '-=0.8'
      );

    // Staggered entrances for everything that scrolls into view.
    // (Inline end-states are kept on purpose — the CSS initial states under
    // `.js [data-reveal]` must not re-apply once an element has revealed.)
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 1.05,
          ease: 'power3.out',
          stagger: 0.09,
        }),
    });

    // Delicate parallax on the project visuals (depth, never dizziness).
    document.querySelectorAll('.media-frame img').forEach((img) => {
      gsap.set(img, { scale: 1.16 });
      gsap.fromTo(
        img,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: img.closest('.media-frame'),
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    });

    // Ghost numerals drift a touch slower than the page.
    document.querySelectorAll('[data-drift]').forEach((el) => {
      gsap.fromTo(
        el,
        { yPercent: -12 },
        {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('.project') || el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    });

    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ------------------------------- Toast --------------------------------- */

  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  let toastTimer = null;

  const showToast = (message) => {
    toastText.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2600);
  };

  /* ---------------------------- Copy email -------------------------------- */

  const copyEmail = document.getElementById('copy-email');

  const copyWithFallback = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText =
        'position:fixed;top:-999px;left:-999px;opacity:0;';
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand('copy') ? resolve() : reject();
      } finally {
        area.remove();
      }
    });
  };

  if (copyEmail) {
    copyEmail.addEventListener('click', () => {
      copyWithFallback(EMAIL)
        .then(() => showToast('Email copied to clipboard'))
        .catch(() =>
          showToast('Copy failed — the address is ' + EMAIL)
        );
    });
  }

  /* ------------------------- Live-project links --------------------------- */

  // Placeholder slots: until the live URLs are connected, keep the buttons
  // honest instead of jumping the page back to the top.
  document.querySelectorAll('[data-live-link]').forEach((link) => {
    if (link.getAttribute('href') !== '#') return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(
        'Live link not connected yet — email ' + EMAIL + ' for a walkthrough.'
      );
    });
  });

  /* ----------------------------- Footer year ------------------------------ */

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
