import React, { useEffect, useRef, useState } from 'react';
import { aproposStyles } from '../styles/aproposStyle.jsx';
import { useI18n } from '../src/i18n.jsx';


function Apropos() {
  const { t, lang } = useI18n();
  const [started, setStarted] = useState(false);
  const [expeditions, setExpeditions] = useState(5000);
  const [pays, setPays] = useState(15);
  const [satisfaction, setSatisfaction] = useState(98);
  const [targets, setTargets] = useState({ expeditions: 5000, pays: 15, satisfaction: 98 });
  const [displayTargets, setDisplayTargets] = useState({ expeditions: 5000, pays: 15, satisfaction: 98 });
  const statsRef = useRef(null);
  const [hoverMember, setHoverMember] = useState(null);


  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      });
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [started]);


  const animateOne = (key, nextValue, delay = 0, duration = 900) => {
    const startVal = { expeditions, pays, satisfaction }[key];
    let rafId;
    const startAt = performance.now() + delay;
    const step = (now) => {
      if (now < startAt) {
        rafId = requestAnimationFrame(step);
        return;
      }
      const t = Math.min(1, (now - startAt) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const val = Math.floor(startVal + ease * (nextValue - startVal));
      if (key === 'expeditions') setExpeditions(val);
      if (key === 'pays') setPays(val);
      if (key === 'satisfaction') setSatisfaction(val);
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  };


  useEffect(() => {
    if (!started) return;
    setDisplayTargets(targets);
  }, [started, targets]);


  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      setTargets((prev) => {
        const next = {
          expeditions: prev.expeditions + 50,
          pays: prev.pays + 1,
          satisfaction: Math.min(100, prev.satisfaction + 1),
        };
        setTimeout(() => {
          setDisplayTargets((d) => ({ ...d, expeditions: next.expeditions }));
          animateOne('expeditions', next.expeditions, 0, 900);
        }, 0);
        setTimeout(() => {
          setDisplayTargets((d) => ({ ...d, pays: next.pays }));
          animateOne('pays', next.pays, 0, 700);
        }, 500);
        setTimeout(() => {
          setDisplayTargets((d) => ({ ...d, satisfaction: next.satisfaction }));
          animateOne('satisfaction', next.satisfaction, 0, 700);
        }, 1000);
        return next;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [started]);


  const rotateFor = (value, max) => ({
    display: 'inline-block',
    transform: `rotate(${(value / max) * 360}deg)`,
    transition: 'transform 60ms linear'
  });


  return (
    <section className="py-5 bg-body" style={aproposStyles.section}>
      <style>{`.apropos-hero h2, .apropos-hero p { color: #fff !important; }`}</style>
      <div className="container d-grid gap-4 gap-md-5">
        <div className="p-4 p-md-5 apropos-hero" style={aproposStyles.hero}>
          <div className="row g-4 align-items-center justify-content-center">
            <div className="col-12 col-lg-8 text-center mx-auto">
              <h2 className="fw-bold mb-2" style={{ whiteSpace: 'pre-line' }}>{t('about.hero.title')}</h2>
              <p className="mb-3 mb-md-4">{t('about.hero.subtitle')}</p>
              <a href="#/connexion" className="btn fw-semibold px-4" style={aproposStyles.heroBtn}>{t('about.hero.cta')}</a>
            </div>
          </div>
        </div>


        <div className="row g-4 align-items-center justify-content-center">
          <div className="col-12 col-lg-10">
            <div className="p-4 p-md-5 border rounded-4" style={aproposStyles.card}>
              <div className="row g-4 align-items-center">
                <div className="col-12 col-lg-7">
                  <h3 className="fw-bold mb-3">{t('about.story.title')}</h3>
                  <p className="mb-0 text-muted">{t('about.story.text')}</p>
                </div>
                <div className="col-12 col-lg-5">
                  <img src={'/histoir1.jpg'} alt="Notre Histoire" className="img-fluid" style={{ borderRadius: 12, objectFit: 'cover', width: '100%', height: '100%', maxHeight: 360, boxShadow: '0 12px 28px rgba(0,0,0,0.12)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="row g-3 g-md-4">
          <div className="col-12 col-md-4">
            <div className="p-4 border rounded-4 h-100" style={aproposStyles.card}>
              <div className="mb-2">⭕</div>
              <h6 className="fw-bold mb-2">{t('about.mission.title')}</h6>
              <p className="text-muted mb-0">{t('about.mission.text')}</p>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-4 border rounded-4 h-100" style={aproposStyles.card}>
              <div className="mb-2">🔭</div>
              <h6 className="fw-bold mb-2">{t('about.vision.title')}</h6>
              <p className="text-muted mb-0">{t('about.vision.text')}</p>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-4 border rounded-4 h-100" style={aproposStyles.card}>
              <div className="mb-2">⚖️</div>
              <h6 className="fw-bold mb-2">{t('about.values.title')}</h6>
              <p className="text-muted mb-0">{t('about.values.text')}</p>
            </div>
          </div>
        </div>


        <div className="text-center mt-2" ref={statsRef}>
          <h4 className="fw-bold mb-3">{t('about.stats.title')}</h4>
        </div>
        <div className="row g-3 g-md-4">
          <div className="col-12 col-md-4">
            <div className="p-4 border rounded-4 text-center" style={aproposStyles.statCard}>
              <div className="display-6 fw-bold" style={rotateFor(expeditions, displayTargets.expeditions)}>{expeditions.toLocaleString('fr-FR')}+</div>
              <div className="text-muted">{t('about.stats.shipments')}</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-4 border rounded-4 text-center" style={aproposStyles.statCard}>
              <div className="display-6 fw-bold" style={rotateFor(pays, displayTargets.pays)}>{pays}+</div>
              <div className="text-muted">{t('about.stats.countries')}</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-4 border rounded-4 text-center" style={aproposStyles.statCard}>
              <div className="display-6 fw-bold" style={rotateFor(satisfaction, displayTargets.satisfaction)}>{satisfaction}%</div>
              <div className="text-muted">{t('about.stats.satisfaction')}</div>
            </div>
          </div>
        </div>


        <div className="text-center mt-2">
          <h4 className="fw-bold mb-3">{t('about.team.title')}</h4>
        </div>
        <div className="row g-4 g-md-5 justify-content-center">
          {[
            { name: 'Habib Diallo', roleKey: 'about.team.role.ceo', img: '/fondateurP.jpg' },
            { name: 'Khadim Mbaye', roleKey: 'about.team.role.cto', img: '/technologie.jpg' },
            { name: "Fatou N'Diaye", roleKey: 'about.team.role.ops', img: '/pdg.jpg' },
            { name: 'Ousmane Faye', roleKey: 'about.team.role.leadlog', img: '/fondation.jpg' },
          ].map((m, i) => (
            <div
              className="col-6 col-md-3 text-center"
              key={i}
              onMouseEnter={() => setHoverMember(i)}
              onMouseLeave={() => setHoverMember(null)}
              onTouchStart={() => setHoverMember(i)}
              onTouchEnd={() => setHoverMember(null)}
            >
              {m.img ? (
                <img
                  src={m.img}
                  alt={m.name}
                  style={{
                    ...aproposStyles.avatar,
                    transition: 'transform 220ms ease, box-shadow 220ms ease, filter 220ms ease',
                    transform: hoverMember === i ? 'scale(1.06) rotate(-2deg)' : 'none',
                    boxShadow: hoverMember === i ? '0 16px 36px rgba(0,0,0,0.2)' : '0 6px 16px rgba(0,0,0,0.12)',
                    filter: hoverMember === i ? 'saturate(1.1) contrast(1.05)' : 'none',
                    cursor: 'pointer'
                  }}
                />
              ) : (
                <div
                  style={{
                    ...aproposStyles.avatarFallback,
                    transition: 'transform 220ms ease, box-shadow 220ms ease',
                    transform: hoverMember === i ? 'scale(1.06) rotate(-2deg)' : 'none',
                    boxShadow: hoverMember === i ? '0 16px 36px rgba(0,0,0,0.2)' : '0 6px 16px rgba(0,0,0,0.12)',
                    cursor: 'pointer'
                  }}
                >
                  {m.name.split(' ')[0][0]}
                </div>
              )}
              <div className="mt-2 fw-semibold">{m.name}</div>
              <div className="text-muted small">{t(m.roleKey)}</div>
            </div>
          ))}
        </div>


        <div className="p-4 p-md-5 text-center" style={aproposStyles.cta}>
          <h5 className="fw-bold mb-2">{t('about.cta.title')}</h5>
          <p className="mb-3">{t('about.cta.subtitle')}</p>
          <a href="#/connexion" className="btn fw-semibold px-4" style={aproposStyles.ctaBtn}>{t('about.cta.button')}</a>
        </div>
      </div>
    </section>
  );
}


export default Apropos;
