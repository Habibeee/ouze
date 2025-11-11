import React, { useEffect, useRef, useState } from 'react';
import { aproposStyles } from '../styles/aproposStyle.jsx';


function Apropos() {
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
              <h2 className="fw-bold mb-2">Connecter le Sénégal au Monde :<br/> L'Histoire de TransDigiSN.</h2>
              <p className="mb-3 mb-md-4">Découvrez notre parcours, notre mission et l'équipe qui rend tout cela possible.</p>
              <a href="#/connexion" className="btn fw-semibold px-4" style={aproposStyles.heroBtn}>Obtenir un Devis</a>
            </div>
          </div>
        </div>


        <div className="row g-4 align-items-center justify-content-center">
          <div className="col-12 col-lg-10">
            <div className="p-4 p-md-5 border rounded-4" style={aproposStyles.card}>
              <div className="row g-4 align-items-center">
                <div className="col-12 col-lg-7">
                  <h3 className="fw-bold mb-3">Notre Histoire</h3>
                  <p className="mb-0 text-muted">
                    Née de la volonté de connecter efficacement les entreprises sénégalaises au monde, TransDigiSN simplifie la logistique grâce au numérique. Notre histoire est celle d'une équipe engagée qui place la transparence, la fiabilité et la performance au cœur de chaque expédition.
                  </p>
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
              <h6 className="fw-bold mb-2">Notre Mission</h6>
              <p className="text-muted mb-0">Simplifier la logistique pour les entreprises au Sénégal grâce à une plateforme numérique transparente et efficace.</p>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-4 border rounded-4 h-100" style={aproposStyles.card}>
              <div className="mb-2">🔭</div>
              <h6 className="fw-bold mb-2">Notre Vision</h6>
              <p className="text-muted mb-0">Être le principal transitaire digital en Afrique de l’Ouest, reconnu pour notre fiabilité et notre innovation.</p>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-4 border rounded-4 h-100" style={aproposStyles.card}>
              <div className="mb-2">⚖️</div>
              <h6 className="fw-bold mb-2">Nos Valeurs</h6>
              <p className="text-muted mb-0">Nous nous engageons à la transparence, la satisfaction du client et à l’amélioration continue.</p>
            </div>
          </div>
        </div>


        <div className="text-center mt-2" ref={statsRef}>
          <h4 className="fw-bold mb-3">Nos Réalisations Clés</h4>
        </div>
        <div className="row g-3 g-md-4">
          <div className="col-12 col-md-4">
            <div className="p-4 border rounded-4 text-center" style={aproposStyles.statCard}>
              <div className="display-6 fw-bold" style={rotateFor(expeditions, displayTargets.expeditions)}>{expeditions.toLocaleString('fr-FR')}+</div>
              <div className="text-muted">Expéditions Gérées</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-4 border rounded-4 text-center" style={aproposStyles.statCard}>
              <div className="display-6 fw-bold" style={rotateFor(pays, displayTargets.pays)}>{pays}+</div>
              <div className="text-muted">Pays Desservis</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-4 border rounded-4 text-center" style={aproposStyles.statCard}>
              <div className="display-6 fw-bold" style={rotateFor(satisfaction, displayTargets.satisfaction)}>{satisfaction}%</div>
              <div className="text-muted">Satisfaction Client</div>
            </div>
          </div>
        </div>


        <div className="text-center mt-2">
          <h4 className="fw-bold mb-3">Notre Équipe</h4>
        </div>
        <div className="row g-4 g-md-5 justify-content-center">
          {[
            { name: 'Habib Diallo', role: 'PDG et fondateur', img: '/fondateurP.jpg' },
            { name: 'Khadim Mbaye', role: 'Directeur de la Technologie', img: '/technologie.jpg' },
            { name: "Fatou N'Diaye", role: 'Responsable des Opérations', img: '/pdg.jpg' },
            { name: 'Ousmane Gueye', role: 'Coordinateur Logistique Principal', img: '/fondation.jpg' },
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
              <div className="text-muted small">{m.role}</div>
            </div>
          ))}
        </div>


        <div className="p-4 p-md-5 text-center" style={aproposStyles.cta}>
          <h5 className="fw-bold mb-2">Prêt à simplifier votre logistique ?</h5>
          <p className="mb-3">Laissez‑nous gérer les complexités de l’expédition pour que vous puissiez vous concentrer sur la croissance de votre entreprise. Obtenez un devis gratuit et sans engagement dès aujourd’hui.</p>
          <a href="#/connexion" className="btn fw-semibold px-4" style={aproposStyles.ctaBtn}>Obtenir un Devis Aujourd'hui</a>
        </div>
      </div>
    </section>
  );
}


export default Apropos;
