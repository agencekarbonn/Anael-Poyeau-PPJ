(() => {
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const carousels = [...document.querySelectorAll('.carousel')];
  const reviews = document.querySelector('.reviews-carousel');
  const centerCarousel = (carousel) => {
    const cards = carousel.querySelectorAll('.carousel-track > *');
    if (!cards.length) return;
    const middle = cards[Math.floor(cards.length / 2)];
    carousel.scrollLeft = middle.offsetLeft + middle.offsetWidth / 2 - carousel.clientWidth / 2;
  };
  const initCarousels = () => carousels.forEach((carousel) => {
    if (carousel === reviews) centerCarousel(carousel);
    else carousel.scrollLeft = 0;
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
  const mobileNavClose = document.querySelector('.mobile-nav-close');
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
    mobileNavClose?.addEventListener('click', closeMenu);
    mobileNav.querySelectorAll('nav a').forEach((link) => link.addEventListener('click', closeMenu));
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

  const form = document.querySelector('.quote-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    form.querySelector('.form-status').textContent = 'Merci ! Votre demande a bien été envoyée, nous vous recontactons sous 48h.';
    form.reset();
  });
})();
