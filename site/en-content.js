/* SABY — English content. Every string on the page lives here.
 * Sourced from the NEXGEN SABY page (name, tagline, "Who We Are", the six
 * expertise areas, the three "Why" cards, CTA) — lines marked DRAFT are new
 * connective copy written for this prototype and need client approval.
 * *word* marks an accent word (rendered in the brand gradient).
 */
window.SABY_CONTENT = window.SABY_CONTENT || {};
window.SABY_CONTENT.en = {
  lang: 'en',
  dir: 'ltr',
  meta: {
    title: 'SABY — Modern Technology Studio',
    desc: 'SABY is a modern technology studio: software engineering, AI development, digital transformation and enterprise platforms for the region.',
  },
  nav: {
    label: 'Main navigation',
    links: [
      { href: '#manifesto', text: 'Studio' },
      { href: '#expertise', text: 'Expertise' },
      { href: '#why', text: 'Why SABY' },
      { href: '#contact', text: 'Contact' },
    ],
    cta: 'Start a project',
    langLabel: 'العربية',
    langAria: 'Switch to Arabic',
    menu: 'Open menu',
    close: 'Close menu',
    skip: 'Skip to content',
    home: 'SABY — home',
  },
  loader: { word: 'SABY' },
  hero: {
    eyebrow: 'Modern Technology Studio',
    /* DRAFT */ title: 'We build the *digital platforms* the region runs on',
    lead: 'Software engineering, AI development, digital transformation, and enterprise platforms.',
    primary: 'Start a project',
    secondary: 'Our expertise',
    scroll: 'Scroll',
  },
  manifesto: {
    label: 'About SABY',
    /* first sentence: NEXGEN page copy; rest DRAFT */
    text: 'SABY is a *technology studio* delivering modern, scalable *digital solutions* for the region. We combine *AI* with sound software engineering and enterprise-grade execution.',
  },
  band: {
    caption: 'Engineering studio',
  },
  expertise: {
    eyebrow: 'Expertise',
    title: 'What we *build*',
    items: [
      { n: '01', t: 'AI & automation',            d: 'Intelligent systems that take repetitive work off your team.' },
      { n: '02', t: 'Web & mobile apps',          d: 'Fast, polished products for every screen your users own.' },
      { n: '03', t: 'SaaS engineering',           d: 'Multi-tenant platforms designed to scale from day one.' },
      { n: '04', t: 'Cloud & cybersecurity',      d: 'Resilient infrastructure with security built in, not bolted on.' },
      { n: '05', t: 'UX/UI',                      d: 'Interfaces that make complex systems feel simple.' },
      { n: '06', t: 'Enterprise integrations',    d: 'Connecting the systems you already run into one flow.' },
    ],
  },
  ticker: ['AI & automation', 'Web & mobile apps', 'SaaS engineering', 'Cloud & cybersecurity', 'UX/UI', 'Enterprise integrations'],
  why: {
    eyebrow: 'Why SABY',
    title: 'Built to *deliver*',
    cards: [
      { n: '01', t: 'Modern engineering practices', d: 'Clean architecture and current tooling, so what we ship stays maintainable.' },
      { n: '02', t: 'Fast delivery cycles',         d: 'Short iterations that put working software in front of you early.' },
      { n: '03', t: 'Enterprise-grade execution',   d: 'The rigor large organizations expect, from scoping to launch.' },
    ],
  },
  cta: {
    eyebrow: 'Contact',
    title: 'Have something to *build?*',
    text: 'Talk to our engineering studio about AI and digital transformation.',
    button: 'Contact us',
    phoneLabel: 'Phone',
    phone: '+973 3660 0911',
    emailLabel: 'Email',
    email: 'info@nexgen.bh',
  },
  footer: {
    line: 'SABY is part of NEXGEN Holdings.',
    rights: '© 2026 SABY. All rights reserved.',
    top: 'Back to top',
  },
};
