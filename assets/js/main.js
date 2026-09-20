(() => {
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Écran de chargement : progression réelle des images, 100% au load complet,
  // réaffiché si la connexion devient mauvaise ou se coupe.
  const preloader = document.getElementById('preloader');
  if (preloader) {
    const bar = preloader.querySelector('.preloader-bar');
    const count = preloader.querySelector('.preloader-count');
    document.body.classList.add('is-loading');
    const setProgress = (value) => {
      bar.style.width = `${value}%`;
      count.textContent = `${value}%`;
    };
    const images = [...document.images];
    const total = Math.max(images.length, 1);
    let loaded = 0;
    let displayed = 0;
    let finished = false;
    const render = () => {
      const target = finished ? 100 : Math.round((loaded / total) * 90);
      if (target > displayed) { displayed = target; setProgress(displayed); }
    };
    images.forEach((img) => {
      if (img.complete) { loaded += 1; return; }
      img.addEventListener('load', () => { loaded += 1; render(); }, { once: true });
      img.addEventListener('error', () => { loaded += 1; render(); }, { once: true });
    });
    render();
    // progression douce pendant le chargement pour éviter un compteur figé
    const creep = setInterval(() => {
      if (!finished && displayed < 90) { displayed += 1; setProgress(displayed); }
    }, 150);
    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(creep);
      setProgress(100);
      setTimeout(() => {
        preloader.classList.add('is-hidden');
        document.body.classList.remove('is-loading');
      }, 400);
    };
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
    const showLoader = (message) => {
      preloader.classList.remove('is-hidden');
      document.body.classList.add('is-loading');
      bar.style.width = '0';
      count.textContent = message;
    };
    const hideLoader = () => {
      preloader.classList.add('is-hidden');
      document.body.classList.remove('is-loading');
      count.textContent = '100%';
      bar.style.width = '100%';
    };
    window.addEventListener('offline', () => showLoader('Connexion perdue…'));
    window.addEventListener('online', hideLoader);
    const conn = navigator.connection;
    if (conn && conn.addEventListener) {
      conn.addEventListener('change', () => {
        if (!navigator.onLine || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') showLoader('Connexion lente…');
        else hideLoader();
      });
    }
  }

  const reviews = document.querySelector('.reviews-carousel');
  const mobileServiceCards = document.querySelector('.services-cards');
  const centerCarousel = (carousel) => {
    const cards = carousel.querySelectorAll('.carousel-track > *');
    if (!cards.length) return;
    const middle = cards[Math.floor(cards.length / 2)];
    carousel.scrollLeft = middle.offsetLeft + middle.offsetWidth / 2 - carousel.clientWidth / 2;
  };
  const scrollables = [
    { el: document.querySelector('.realisations-carousel'), key: 'realisations' },
    { el: reviews, key: 'reviews', center: true },
    { el: mobileServiceCards, key: 'services', mobileOnly: true },
  ].filter((s) => s.el);
  const saveScroll = (s) => {
    try { localStorage.setItem(`ppj-scroll-${s.key}`, String(s.el.scrollLeft)); } catch (e) {}
  };
  const restoreScroll = (s) => {
    let saved = null;
    try { saved = localStorage.getItem(`ppj-scroll-${s.key}`); } catch (e) {}
    if (saved !== null) { s.el.scrollLeft = parseFloat(saved) || 0; return; }
    if (s.center) centerCarousel(s.el); else s.el.scrollLeft = 0;
  };
  const initCarousels = () => {
    scrollables.forEach((s) => {
      if (s.mobileOnly && window.innerWidth > 1024) return;
      restoreScroll(s);
    });
  };
  scrollables.forEach((s) => {
    let t;
    s.el.addEventListener('scroll', () => {
      clearTimeout(t);
      t = setTimeout(() => saveScroll(s), 150);
    }, { passive: true });
  });
  initCarousels();
  window.addEventListener('resize', initCarousels);
  window.addEventListener('load', initCarousels);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(initCarousels);
  document.querySelectorAll('.carousel-nav .nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = reviews.querySelector('.review-card');
      const gap = parseFloat(getComputedStyle(reviews.querySelector('.carousel-track')).gap) || 0;
      reviews.scrollBy({ left: Number(btn.dataset.dir) * (card.offsetWidth + gap), behavior: 'smooth' });
    });
  });

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.nav a')];
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => link.classList.toggle('is-active', link.hash === `#${id}`));
        history.replaceState(null, '', `#${id}`);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((section) => observer.observe(section));
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (menuToggle && mobileNav) {
    const closeMenu = () => {
      menuToggle.classList.remove('is-active');
      mobileNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    };
    const openMenu = () => {
      menuToggle.classList.add('is-active');
      mobileNav.classList.add('is-open');
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
    };
    menuToggle.addEventListener('click', () => {
      if (mobileNav.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
    mobileNav.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => { if (window.innerWidth > 720) closeMenu(); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mobileNav.classList.contains('is-open')) closeMenu();
    });
  }

  // Cartes "services" en éventail : la section reste "épinglée" (scroll natif via position: sticky)
  // pendant que l'on fait défiler les cartes une par une, puis le scroll normal reprend (dans les deux sens).
  const pinSpacer = document.querySelector('[data-pin-spacer]');
  const fanContainer = document.querySelector('[data-fan-cards]');
  const fanCards = fanContainer ? [...fanContainer.querySelectorAll('.service-card')] : [];
  if (pinSpacer && fanContainer && fanCards.length) {
    const FAN_BREAKPOINT = 1024;
    const updateActiveCard = () => {
      if (window.innerWidth <= FAN_BREAKPOINT) {
        fanContainer.classList.remove('has-active');
        fanCards.forEach((card) => card.classList.remove('is-active'));
        return;
      }
      const rect = pinSpacer.getBoundingClientRect();
      const scrollableDistance = pinSpacer.offsetHeight - window.innerHeight;
      // Progression 0 -> 1 sur toute la distance de scroll "épinglée" (rect.top passe de 0 à -scrollableDistance)
      const progress = scrollableDistance > 0
        ? Math.min(Math.max(-rect.top / scrollableDistance, 0), 1)
        : 0;
      const index = Math.min(fanCards.length - 1, Math.floor(progress * fanCards.length));
      fanContainer.classList.add('has-active');
      fanCards.forEach((card, i) => card.classList.toggle('is-active', i === index));
    };
    updateActiveCard();
    window.addEventListener('scroll', updateActiveCard, { passive: true });
    window.addEventListener('resize', updateActiveCard);
  }

  // Réalisations : la section reste "épinglée" (position: sticky) pendant que les photos
  // défilent horizontalement au fil du scroll, puis le scroll normal reprend (dans les deux sens).
  const realisationsPin = document.querySelector('[data-realisations-pin]');
  const realisationsCarousel = document.querySelector('[data-realisations-carousel]');
  const realisationsTrack = realisationsCarousel?.querySelector('.carousel-track');
  const realisationsProgressBar = document.querySelector('.realisations-progress-bar');
  if (realisationsPin && realisationsCarousel && realisationsTrack) {
    const REAL_BREAKPOINT = 1024;
    const getDistance = () => Math.max(0, realisationsTrack.scrollWidth - realisationsCarousel.clientWidth);
    const setProgress = (p) => {
      if (realisationsProgressBar) realisationsProgressBar.style.width = `${p * 100}%`;
    };
    const setPinHeight = () => {
      if (window.innerWidth <= REAL_BREAKPOINT) {
        realisationsPin.style.height = '';
        realisationsTrack.style.transform = '';
        return;
      }
      realisationsPin.style.height = `${getDistance() + window.innerHeight}px`;
    };
    const updateRealisations = () => {
      if (window.innerWidth <= REAL_BREAKPOINT) {
        const max = realisationsCarousel.scrollWidth - realisationsCarousel.clientWidth;
        setProgress(max > 0 ? realisationsCarousel.scrollLeft / max : 0);
        return;
      }
      const distance = getDistance();
      const maxScroll = Math.max(0, realisationsPin.offsetHeight - window.innerHeight);
      const rect = realisationsPin.getBoundingClientRect();
      const progress = maxScroll > 0 ? Math.min(Math.max(-rect.top / maxScroll, 0), 1) : 0;
      realisationsTrack.style.transform = `translateX(${-progress * distance}px)`;
      setProgress(progress);
    };
    realisationsCarousel.addEventListener('scroll', updateRealisations, { passive: true });
    setPinHeight();
    updateRealisations();
    window.addEventListener('scroll', updateRealisations, { passive: true });
    window.addEventListener('resize', () => { setPinHeight(); updateRealisations(); });
    window.addEventListener('load', () => { setPinHeight(); updateRealisations(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { setPinHeight(); updateRealisations(); });
  }

  const form = document.querySelector('.quote-form');
  const proFields = form?.querySelector('.pro-fields');
  const proInputs = proFields ? [...proFields.querySelectorAll('input')] : [];
  const typeRadios = form ? [...form.querySelectorAll('input[name="type_client"]')] : [];

  const updateProFields = () => {
    const isPro = form?.querySelector('input[name="type_client"]:checked')?.value === 'professionnel';
    proFields.hidden = !isPro;
    proInputs.forEach((input) => {
      input.required = isPro;
      if (!isPro) input.value = '';
    });
  };

  if (typeRadios.length) {
    typeRadios.forEach((radio) => radio.addEventListener('change', updateProFields));
    updateProFields();
  }

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const honeypot = form.querySelector('.form-honeypot');
    if (honeypot && honeypot.value.trim() !== '') return;
    if (!form.reportValidity()) return;
    form.querySelector('.form-status').textContent = 'Merci ! Votre demande a bien été envoyée, nous vous recontactons sous 48h.';
    form.reset();
    updateProFields();
  });

  // Modales plein écran (Politique de confidentialité, Mentions légales)
  let openModal = null;
  const closeModal = () => {
    if (!openModal) return;
    openModal.classList.remove('is-open');
    openModal = null;
    document.body.classList.remove('modal-open');
  };
  document.querySelectorAll('[data-modal-open]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const modal = document.getElementById(link.dataset.modalOpen);
      if (!modal) return;
      openModal = modal;
      modal.classList.add('is-open');
      document.body.classList.add('modal-open');
      modal.querySelector('.legal-modal-close')?.focus();
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach((btn) => btn.addEventListener('click', closeModal));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });
})();
