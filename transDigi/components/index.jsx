 import React, { useState, useRef, useEffect } from 'react';
import { indexStyles } from '../styles/indexStyle.jsx';
import Publicite from './publicite.jsx';
import { COLORS } from '../styles/indexStyle.jsx';
import { useI18n } from '../src/i18n.jsx';

 function HomeHero() {
  const { t } = useI18n();
  const Panel = ({ title, subtitle, color, dark, steps, imgSrc, imgAlt }) => {
    const [hover, setHover] = useState(false);
    const imgRef = useRef(null);
    const [angle, setAngle] = useState(0);
    const baseBg = dark ? 'linear-gradient(135deg, #0b2a64, #0f3b92)' : 'var(--bs-body-bg)';
    const baseBorder = dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--bs-border-color-translucent)';
    const wrap = {
      transition: 'transform 260ms ease, box-shadow 260ms ease, background 260ms ease',
      borderRadius: 16,
      padding: '28px 24px',
      height: '100%',
      background: baseBg,
      border: baseBorder,
      boxShadow: hover ? '0 16px 40px rgba(0,0,0,0.18)' : '0 6px 18px rgba(0,0,0,0.08)',
      transform: hover ? 'translateY(-6px)' : 'translateY(0)'
    };
    const overlay = {};
    const titleStyle = { color: dark ? '#ffffff' : '#111827' };
    // Subtitles in brand green as requested
    const subStyle = { color: dark ? 'rgba(255,255,255,0.85)' : '#6c757d' };
    const bulletIcon = (active) => ({
      fontSize: 20,
      color: active ? color : (dark ? 'rgba(255,255,255,0.7)' : '#6c757d'),
      transition: 'transform 260ms ease, color 260ms ease',
      transform: active ? 'translateY(-1px) rotate(-2deg)' : 'none'
    });
    useEffect(() => {
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          const el = imgRef.current;
          if (el) {
            const rect = el.getBoundingClientRect();
            const viewportH = window.innerHeight || document.documentElement.clientHeight;
            const center = rect.top + rect.height / 2;
            const delta = (center - viewportH / 2) / viewportH; // -0.5..0.5 typically
            const maxDeg = 8; // max rotation
            const next = Math.max(-maxDeg, Math.min(maxDeg, -delta * maxDeg * 2));
            setAngle(next);
          }
          ticking = false;
        });
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return (
      <div style={{ ...wrap, ...overlay }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-7">
            <h3 className="fw-bold mb-2" style={titleStyle}>{title}</h3>
            <p className="mb-4" style={subStyle}>{subtitle}</p>
            <div className="d-grid gap-3">
              {steps.map((s, i) => (
                <div key={i} className="d-flex align-items-start gap-3">
                  <span className="flex-shrink-0" style={bulletIcon(hover)}>✓</span>
                  <div>
                    <div className="fw-bold" style={{ color: dark ? '#ffffff' : '#111827' }}>{s.title}</div>
                    <div style={{ color: dark ? 'rgba(255,255,255,0.8)' : '#6c757d' }}>{s.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-12 col-md-5">
            <div className="w-100 h-100 d-flex align-items-center justify-content-center">
              <img
                ref={imgRef}
                src={imgSrc}
                alt={imgAlt || title}
                className="img-fluid panel-img"
                style={{
                  width: '100%',
                  objectFit: 'cover',
                  borderRadius: 14,
                  boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
                  transform: `rotate(${angle}deg)`,
                  transition: 'transform 220ms ease'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };
  const slides = [
    '/slite1t.jpg',
    '/slide2.jpg',
    '/slider3.jpg',
  ];

  const [scrollAngle, setScrollAngle] = useState(0);
  const [hoverService, setHoverService] = useState(null);
  useEffect(() => {
    const onScroll = () => {
      // Continuous spin based on scroll position for clear visual feedback
      setScrollAngle((window.scrollY / 2) % 360);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        @media (max-width: 575.98px) {
          /* Sur mobile, on réduit la hauteur pour éviter le grand espace vide */
          .hero-section, .hero-inner { min-height: 60vh !important; padding-bottom: 0 !important; }
          .hero-section .carousel-inner,
          .hero-section .carousel-item,
          .hero-section .carousel-item img { height: 60vh !important; object-fit: cover; }
          .hero-section .display-4 { font-size: 1.75rem !important; }
          .hero-section .lead { font-size: 1rem !important; }
          .hero-cta { gap: .5rem !important; }
          .hero-cta .btn,
          .hero-section .btn-lg { padding: .5rem 1rem !important; font-size: .95rem !important; border-radius: 10px !important; }
          /* Centrer le contenu dans l'image sur mobile */
          .hero-inner { align-items: center !important; justify-content: center !important; padding-top: 0 !important; }
          .hero-section h1.display-4 { margin-bottom: .5rem !important; }
          .hero-section .lead { margin-bottom: .75rem !important; }
          /* Coller la section suivante (Types de services) à l'image sur mobile */
          .hero-section + section { padding-top: 0 !important; margin-top: 0 !important; }
          /* Indicateurs à l'intérieur de l'image (HomeHero) */
          .hero-section { position: relative; overflow: hidden; }
          .hero-section .carousel-indicators {
            position: absolute;
            bottom: auto;
            top: calc(70vh - 40px);
            z-index: 5;
            margin-bottom: 0 !important;
          }
          .hero-section .carousel-indicators [data-bs-target] { width: 26px; height: 4px; border-radius: 3px; background-color: rgba(255,255,255,0.7); }
          .hero-section .carousel-indicators .active { background-color: #ffffff; width: 28px; }
        }
        @media (max-width: 360px) {
          .hero-section, .hero-inner { min-height: 44vh !important; }
          .hero-section .carousel-inner,
          .hero-section .carousel-item,
          .hero-section .carousel-item img { height: 44vh !important; }
        }
        /* Client button hover: transparent background with colored text/border */
        .btn-client { border: 2px solid transparent !important; transition: background-color .2s ease, color .2s ease, border-color .2s ease; }
        .btn-client:hover { background-color: transparent !important; color: var(--btn-color, var(--bs-success)) !important; border-color: var(--btn-color, var(--bs-success)) !important; }
      `}</style>
      <section
        className="position-relative text-white hero-section"
        style={indexStyles.heroSection}
      >
      <div id="heroCarousel" className="carousel slide position-absolute top-0 start-0 w-100 h-100" data-bs-ride="carousel" data-bs-interval="3000" data-bs-pause="false">
        <div className="carousel-indicators">
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
        </div>
        <div className="carousel-inner h-100">
          <div className="carousel-item active h-100">
            <img src={slides[0]} alt="Slide 1" className="d-block w-100 h-100" style={indexStyles.coverImg} />
          </div>
          <div className="carousel-item h-100">
            <img src={slides[1]} alt="Slide 2" className="d-block w-100 h-100" style={indexStyles.coverImg} />
          </div>
          <div className="carousel-item h-100">
            <img src={slides[2]} alt="Slide 3" className="d-block w-100 h-100" style={indexStyles.coverImg} />
          </div>
        </div>
        <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>

      <div className="position-absolute top-0 start-0 w-100 h-100 bg-transparent" aria-hidden="true" />

      <div className="container-fluid position-relative d-flex align-items-center justify-content-center py-5 px-0 hero-inner" style={indexStyles.heroInner}>
        <div className="row mx-0 w-100 justify-content-center">
          <div className="col-12 col-lg-8 px-4 px-md-5 text-center">
            <h1 className="display-4 fw-bold lh-1 mb-3">
              {t('home.hero.title.line1')}
              <br />
              {t('home.hero.title.line2')}
            </h1>
            <p className="lead mb-4">{t('home.hero.lead')}</p>

            <div className="d-flex gap-3 flex-wrap justify-content-center hero-cta">
              <a href="#how-client" className="btn btn-lg px-5 py-3 fw-semibold btn-client" style={{ '--btn-color': 'var(--bs-success)', backgroundColor: 'var(--bs-success)', color: 'white', border: 'none', borderRadius: '8px' }}>
                {t('home.hero.btn.client')}
              </a>
              <a href="#how-transitaire" className="btn btn-outline-light btn-lg px-5 py-3 fw-semibold" style={{ borderRadius: '8px' }}>
                {t('home.hero.btn.forwarder')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

      <section className="py-5 bg-body">
        <div className="container">
          <h2 className="text-center fw-bold mb-2" style={{ color: '#0b5f8a' }}>{t('home.services.title')}</h2>
          <p className="text-center text-muted mb-5">{t('home.services.subtitle')}</p>

          <div className="row g-4">
            <div className="col-12 col-md-4">
              <div
                className="p-4 border rounded-4 h-100"
                onMouseEnter={() => setHoverService(0)}
                onMouseLeave={() => setHoverService(null)}
                style={{
                  boxShadow: hoverService === 0 ? '0 16px 36px rgba(0,0,0,0.15)' : '0 6px 18px rgba(0,0,0,0.08)',
                  background: hoverService === 0 ? `${indexStyles.colors.blue}1a` : 'var(--bs-body-bg)',
                  borderColor: hoverService === 0 ? indexStyles.colors.blue : 'var(--bs-border-color-translucent)',
                  transition: 'transform 250ms ease, box-shadow 250ms ease, background-color 250ms ease, border-color 250ms ease',
                  transform: hoverService === 0 ? 'translateY(-4px)' : 'none'
                }}
              >
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 56, height: 56, background: indexStyles.colors.blue, willChange: 'transform' }}>
                  <span style={{ fontSize: 28, transform: `rotate(${scrollAngle}deg)`, display: 'inline-block' }}>
                    <i className="bi bi-ship"></i>
                  </span>
                </div>
                <h5 className="fw-bold" style={{ color: '#0b5f8a' }}>{t('home.services.maritime')}</h5>
                <p className="text-muted mb-0">{t('home.services.maritime.desc')}</p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div
                className="p-4 border rounded-4 h-100"
                onMouseEnter={() => setHoverService(1)}
                onMouseLeave={() => setHoverService(null)}
                style={{
                  boxShadow: hoverService === 1 ? '0 16px 36px rgba(0,0,0,0.15)' : '0 6px 18px rgba(0,0,0,0.08)',
                  background: hoverService === 1 ? `${indexStyles.colors.yellow}1a` : 'var(--bs-body-bg)',
                  borderColor: hoverService === 1 ? indexStyles.colors.yellow : 'var(--bs-border-color-translucent)',
                  transition: 'transform 250ms ease, box-shadow 250ms ease, background-color 250ms ease, border-color 250ms ease',
                  transform: hoverService === 1 ? 'translateY(-4px)' : 'none'
                }}
              >
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 56, height: 56, background: indexStyles.colors.yellow, willChange: 'transform' }}>
                  <span style={{ fontSize: 28, transform: `rotate(${scrollAngle}deg)`, display: 'inline-block' }}>
                    <i className="bi bi-airplane"></i>
                  </span>
                </div>
                <h5 className="fw-bold" style={{ color: '#0b5f8a' }}>{t('home.services.air')}</h5>
                <p className="text-muted mb-0">{t('home.services.air.desc')}</p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div
                className="p-4 border rounded-4 h-100"
                onMouseEnter={() => setHoverService(2)}
                onMouseLeave={() => setHoverService(null)}
                style={{
                  boxShadow: hoverService === 2 ? '0 16px 36px rgba(0,0,0,0.15)' : '0 6px 18px rgba(0,0,0,0.08)',
                  background: hoverService === 2 ? `${indexStyles.colors.green}1a` : 'var(--bs-body-bg)',
                  borderColor: hoverService === 2 ? indexStyles.colors.green : 'var(--bs-border-color-translucent)',
                  transition: 'transform 250ms ease, box-shadow 250ms ease, background-color 250ms ease, border-color 250ms ease',
                  transform: hoverService === 2 ? 'translateY(-4px)' : 'none'
                }}
              >
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 56, height: 56, background: indexStyles.colors.green, willChange: 'transform' }}>
                  <span style={{ fontSize: 28, transform: `rotate(${scrollAngle}deg)`, display: 'inline-block' }}>
                    <i className="bi bi-truck"></i>
                  </span>
                </div>
                <h5 className="fw-bold" style={{ color: '#0b5f8a' }}>{t('home.services.road')}</h5>
                <p className="text-muted mb-0">{t('home.services.road.desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-body">
        <div className="container">
          <h2 className="text-center fw-bold mb-4">{t('home.how.title')}</h2>
          <div className="row g-4 align-items-stretch">
            <div className="col-12 col-lg-6" id="how-client">
              <Panel
                title={t('home.how.clients.title')}
                subtitle={t('home.how.clients.subtitle')}
                color={indexStyles.colors.green}
                steps={[
                  { title: t('home.how.clients.step1.title'), text: t('home.how.clients.step1.text') },
                  { title: t('home.how.clients.step2.title'), text: t('home.how.clients.step2.text') },
                  { title: t('home.how.clients.step3.title'), text: t('home.how.clients.step3.text') },
                  { title: t('home.how.clients.step4.title'), text: t('home.how.clients.step4.text') },
                ]}
                imgSrc={'/client1.jpg'}
                imgAlt={'Clients - Expéditions'}
              />
            </div>
            <div className="col-12 col-lg-6" id="how-transitaire">
              <Panel
                title={t('home.how.forwarders.title')}
                subtitle={t('home.how.forwarders.subtitle')}
                color={indexStyles.colors.blue}
                dark
                steps={[
                  { title: t('home.how.forwarders.step1.title'), text: t('home.how.forwarders.step1.text') },
                  { title: t('home.how.forwarders.step2.title'), text: t('home.how.forwarders.step2.text') },
                  { title: t('home.how.forwarders.step3.title'), text: t('home.how.forwarders.step3.text') },
                  { title: t('home.how.forwarders.step4.title'), text: t('home.how.forwarders.step4.text') },
                ]}
                imgSrc={'/transitaire1.jpg'}
                imgAlt={'Transitaires - Opportunités'}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-body">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">{t('home.testimonials.title')}</h2>
          <div className="row g-4">
            <div className="col-12 col-lg-6">
              <div className="p-4 border rounded-4 h-100" style={{ background: 'var(--bs-body-bg)', boxShadow: '0 16px 36px rgba(0,0,0,0.15)', borderColor: 'var(--bs-border-color-translucent)' }}>
                <p className="mb-4">{t('home.testimonials.quote1.text')}</p>
                <div className="d-flex align-items-center gap-3">
                  <img src={'/client2.jpg'} alt="Client" className="rounded-circle" style={{ width: 56, height: 56, objectFit: 'cover', objectPosition: 'center top', boxShadow: '0 6px 16px rgba(0,0,0,0.18)' }} />
                  <div>
                    <div className="fw-bold">{t('home.testimonials.quote1.author')}</div>
                    <div className="text-muted small">{t('home.testimonials.quote1.role')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="p-4 border rounded-4 h-100 bg-white" style={{ boxShadow: '0 16px 36px rgba(0,0,0,0.15)', borderColor: 'rgba(0,0,0,0.08)' }}>
                <p className="mb-4">{t('home.testimonials.quote2.text')}</p>
                <div className="d-flex align-items-center gap-3">
                  <img src={'/transitaire2.jpg'} alt="Transitaire" className="rounded-circle" style={{ width: 48, height: 48, objectFit: 'cover', boxShadow: '0 6px 16px rgba(0,0,0,0.18)' }} />
                  <div>
                    <div className="fw-bold">{t('home.testimonials.quote2.author')}</div>
                    <div className="text-muted small">{t('home.testimonials.quote2.role')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-body">
        <div className="container text-center">
          <h2 className="fw-bold mb-2">{t('home.cta.title')}</h2>
          <p className="text-muted mb-4">{t('home.cta.subtitle')}</p>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <a href="#start-client" className="btn btn-lg px-5 py-3 fw-semibold" style={{ backgroundColor: 'var(--bs-warning)', color: '#000', border: 'none', borderRadius: '8px' }}>{t('home.cta.btn.client')}</a>
            <a href="#start-transitaire" className="btn btn-lg px-5 py-3 fw-semibold" style={{ backgroundColor: 'var(--bs-success)', color: 'white', border: 'none', borderRadius: '8px' }}>{t('home.cta.btn.forwarder')}</a>
          </div>
        </div>
      </section>
    </>
  );
}

function IndexPage() {
  const { t } = useI18n();
  const [scrollAngle, setScrollAngle] = useState(0);
  const [hoverService, setHoverService] = useState(null);

  useEffect(() => {
    const onScroll = () => {
      setScrollAngle((window.scrollY / 2) % 360);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const Panel = ({ title, subtitle, color, dark, steps, imgSrc }) => {
    const [hover, setHover] = useState(false);
    const imgRef = useRef(null);
    const [angle, setAngle] = useState(0);

    useEffect(() => {
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          const el = imgRef.current;
          if (el) {
            const rect = el.getBoundingClientRect();
            const viewportH = window.innerHeight;
            const center = rect.top + rect.height / 2;
            const delta = (center - viewportH / 2) / viewportH;
            const maxDeg = 8;
            const next = Math.max(-maxDeg, Math.min(maxDeg, -delta * maxDeg * 2));
            setAngle(next);
          }
          ticking = false;
        });
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
      <div
        className="h-100 p-4 rounded-4"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: dark ? 'linear-gradient(135deg, #0b2a64, #0f3b92)' : '#fff',
          border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
          boxShadow: hover ? '0 16px 40px rgba(0,0,0,0.18)' : '0 6px 18px rgba(0,0,0,0.08)',
          transform: hover ? 'translateY(-6px)' : 'translateY(0)',
          transition: 'all 0.3s ease'
        }}
      >
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-7">
            <h3 className="fw-bold mb-2" style={{ color: dark ? '#fff' : '#111827' }}>{title}</h3>
            <p className="mb-4" style={{ color: dark ? 'rgba(255,255,255,0.85)' : '#6c757d' }}>{subtitle}</p>
            <div className="d-grid gap-3">
              {steps.map((s, i) => (
                <div key={i} className="d-flex align-items-start gap-3">
                  <span style={{ fontSize: 20, color: hover ? color : (dark ? 'rgba(255,255,255,0.7)' : '#6c757d') }}>✓</span>
                  <div>
                    <div className="fw-bold" style={{ color: dark ? '#fff' : '#111827' }}>{s.title}</div>
                    <div className="small" style={{ color: dark ? 'rgba(255,255,255,0.8)' : '#6c757d' }}>{s.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-12 col-md-5">
            <img
              ref={imgRef}
              src={imgSrc}
              alt={title}
              className="img-fluid rounded-3 panel-img"
              style={{
                width: '100%',
                objectFit: 'cover',
                boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
                transform: `rotate(${angle}deg)`,
                transition: 'transform 220ms ease'
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <style>{`
        @media (max-width: 575.98px) {
          .hero-section { min-height: auto !important; position: relative; overflow: hidden; margin-bottom: 0 !important; }
          /* Revenir à une hauteur de carrousel un peu plus grande mais coller la section suivante */
          #heroCarousel { height: 34vh !important; }
          #heroCarousel .carousel-inner,
          #heroCarousel .carousel-item,
          #heroCarousel .carousel-item img { height: 34vh !important; object-fit: cover; }
          .hero-section .display-3 { font-size: 1.6rem !important; }
          .hero-section .lead { font-size: 0.95rem !important; }
          .hero-section .btn-lg { padding: .5rem 1rem !important; font-size: .95rem !important; border-radius: 10px !important; }
          /* Remonter le contenu dans l'image pour IndexPage hero */
          .hero-section .container.position-relative.d-flex { align-items: flex-start !important; justify-content: flex-start !important; padding-top: 5vh !important; }
          .hero-section h1.display-3 { margin-bottom: .4rem !important; }
          .hero-section .lead { margin-bottom: .4rem !important; }
          /* Réduire l'espace à l'intérieur du hero sur mobile */
          .hero-section .container { min-height: 42vh !important; padding-bottom: 0 !important; }
          /* Coller complètement la section suivante à l'image sur mobile */
          .hero-section + section { padding-top: 0 !important; margin-top: 0 !important; }
          .hero-section + section h2 { margin-top: 0 !important; }
          .hero-section + section p { margin-bottom: 1.25rem !important; }
          /* Indicateurs à l'intérieur de l'image (IndexPage) : collés en bas de la photo */
          .hero-section .carousel-indicators {
            position: absolute;
            bottom: 16px !important;
            top: auto !important;
            z-index: 5;
            margin-bottom: 0 !important;
          }
          .hero-section .carousel-indicators [data-bs-target] { width: 26px; height: 4px; border-radius: 3px; background-color: rgba(255,255,255,0.7); }
          .hero-section .carousel-indicators .active { background-color: #ffffff; width: 28px; }
        }
        @media (max-width: 360px) {
          .hero-section { min-height: 44vh !important; }
          .hero-section .carousel-inner,
          .hero-section .carousel-item,
          .hero-section .carousel-item img { height: 44vh !important; }
        }
        /* Client button hover: transparent background with colored text/border */
        .btn-client { border: 2px solid transparent !important; transition: background-color .2s ease, color .2s ease, border-color .2s ease; }
        .btn-client:hover { background-color: transparent !important; color: var(--btn-color, var(--bs-success)) !important; border-color: var(--btn-color, var(--bs-success)) !important; }
      `}</style>
      <section className="position-relative text-white hero-section" style={{ minHeight: '70vh' }}>
        <div id="heroCarousel" className="carousel slide position-absolute top-0 start-0 w-100 h-100" data-bs-ride="carousel" data-bs-interval="3000" data-bs-pause="false">
          <div className="carousel-indicators">
            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
          </div>
          <div className="carousel-inner h-100">
            <div className="carousel-item active h-100">
              <img src={'/slite1t.jpg'} alt="Slide 1" className="d-block w-100 h-100" style={{ objectFit: 'cover' }} />
            </div>
            <div className="carousel-item h-100">
              <img src={'/slide2.jpg'} alt="Slide 2" className="d-block w-100 h-100" style={{ objectFit: 'cover' }} />
          c  </div>
            <div className="carousel-item h-100">
              <img src={'/slider3.jpg'} alt="Slide 3" className="d-block w-100 h-100" style={{ objectFit: 'cover' }} />
            </div>
          </div>
          <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>

        <div className="container position-relative d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
          <div className="text-center">
            <h1 className="display-3 fw-bold mb-4">
              {t('home.hero.title.line1')}<br />{t('home.hero.title.line2')}
            </h1>
            <p className="lead mb-4">{t('home.hero.lead')}</p>
            <div className="d-flex gap-3 flex-wrap justify-content-center">
              <button
                className="btn btn-lg px-5 py-3 fw-semibold btn-client"
                style={{ '--btn-color': COLORS.green, backgroundColor: COLORS.green, color: 'white', border: 'none' }}
                onClick={() => {
                  const el = document.getElementById('how-client');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {t('home.hero.btn.client')}
              </button>
              <button
                className="btn btn-outline-light btn-lg px-5 py-3 fw-semibold"
                onClick={() => {
                  const el = document.getElementById('how-transitaire');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {t('home.hero.btn.forwarder')}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center fw-bold mb-2">{t('home.services.title')}</h2>
          <p className="text-center text-muted mb-5">{t('home.services.subtitle')}</p>
          <div className="row g-4">
            {[
              { icon: '🚢', title: t('home.services.maritime'), desc: t('home.services.maritime.desc'), color: COLORS.blue },
              { icon: '✈️', title: t('home.services.air'), desc: t('home.services.air.desc'), color: COLORS.yellow },
              { icon: '🚚', title: t('home.services.road'), desc: t('home.services.road.desc'), color: COLORS.green }
            ].map((service, idx) => (
              <div key={idx} className="col-12 col-md-4">
                <div
                  className="p-4 border rounded-4 h-100 bg-white"
                  onMouseEnter={() => setHoverService(idx)}
                  onMouseLeave={() => setHoverService(null)}
                  style={{
                    boxShadow: hoverService === idx ? '0 16px 36px rgba(0,0,0,0.15)' : '0 6px 18px rgba(0,0,0,0.08)',
                    borderColor: hoverService === idx ? service.color : '#e5e7eb',
                    transform: hoverService === idx ? 'translateY(-4px)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: 56, height: 56, backgroundColor: service.color }}
                  >
                    <span style={{ fontSize: 28, transform: `rotate(${scrollAngle}deg)`, display: 'inline-block' }}>
                      {service.icon}
                    </span>
                  </div>
                  <h5 className="fw-bold mb-2">{service.title}</h5>
                  <p className="text-muted mb-0">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5 bg-white">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">{t('home.how.title')}</h2>
          <div className="row g-4">
            <div className="col-12 col-lg-6" id="how-client">
              <Panel
                title={t('home.how.clients.title')}
                subtitle={t('home.how.clients.subtitle')}
                color={COLORS.green}
                steps={[
                  { title: t('home.how.clients.step1.title'), text: t('home.how.clients.step1.text') },
                  { title: t('home.how.clients.step2.title'), text: t('home.how.clients.step2.text') },
                  { title: t('home.how.clients.step3.title'), text: t('home.how.clients.step3.text') },
                  { title: t('home.how.clients.step4.title'), text: t('home.how.clients.step4.text') }
                ]}
                imgSrc={'/client1.jpg'}
              />
            </div>
            <div className="col-12 col-lg-6" id="how-transitaire">
              <Panel
                title={t('home.how.forwarders.title')}
                subtitle={t('home.how.forwarders.subtitle')}
                color={COLORS.blue}
                dark
                steps={[
                  { title: t('home.how.forwarders.step1.title'), text: t('home.how.forwarders.step1.text') },
                  { title: t('home.how.forwarders.step2.title'), text: t('home.how.forwarders.step2.text') },
                  { title: t('home.how.forwarders.step3.title'), text: t('home.how.forwarders.step3.text') },
                  { title: t('home.how.forwarders.step4.title'), text: t('home.how.forwarders.step4.text') }
                ]}
                imgSrc={'/transitaire1.jpg'}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">Ce qu'ils en disent</h2>
          <div className="row g-4">
            <div className="col-12 col-lg-6">
              <div className="p-4 bg-white rounded-4 shadow-sm h-100">
                <p className="mb-4">{t('home.testimonials.quote1.text')}</p>
                <div className="d-flex align-items-center gap-3">
                  <img src={'/client2.jpg'} alt="Client" className="rounded-circle" style={{ width: 56, height: 56, objectFit: 'cover', objectPosition: 'center top' }} />
                  <div>
                    <div className="fw-bold">{t('home.testimonials.quote1.author')}</div>
                    <div className="text-muted small">{t('home.testimonials.quote1.role')}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="p-4 bg-white rounded-4 shadow-sm h-100">
                <p className="mb-4">{t('home.testimonials.quote2.text')}</p>
                <div className="d-flex align-items-center gap-3">
                  <img src={'/transitaire2.jpg'} alt="Transitaire" className="rounded-circle" style={{ width: 48, height: 48, objectFit: 'cover' }} />
                  <div>
                    <div className="fw-bold">{t('home.testimonials.quote2.author')}</div>
                    <div className="text-muted small">{t('home.testimonials.quote2.role')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-white">
        <div className="container">
          <Publicite />
        </div>
      </section>
    </div>
  );
}

export default IndexPage;
