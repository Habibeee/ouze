import React, { useEffect, useState } from 'react';
import { COLORS } from '../styles/indexStyle.jsx';

const Publicite = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      // title: 'Livraison rapide et fiable',
      description: 'Des solutions de transport adaptées à tous vos besoins',
      image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&h=400&fit=crop',
      color: COLORS.green
    },
    {
      // title: 'Des transitaires partout',
      description: 'Un réseau étendu de partenaires de confiance',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=400&fit=crop',
      color: COLORS.blue
    },
    {
      // title: 'Suivi en temps réel',
      description: 'Suivez vos expéditions où que vous soyez',
      image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1200&h=400&fit=crop',
      color: COLORS.yellow
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index) => setCurrentSlide(index);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="position-relative rounded-4 overflow-hidden" style={{ height: '400px' }}>
      {slides.map((slide, index) => (
        <div
          key={index}
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            opacity: currentSlide === index ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
            pointerEvents: currentSlide === index ? 'auto' : 'none'
          }}
        >
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.7)'
            }}
          />
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.7) 100%)'
            }}
          />
          <div className="position-absolute bottom-0 start-0 text-white p-4 p-md-5">
            <h2 className="display-6 fw-bold mb-2" style={{ color: '#fff' }}>{slide.title}</h2>
            <p className="lead mb-3" style={{ color: '#fff' }}>{slide.description}</p>
            <a href="#/apropos" className="btn btn-light px-4 py-2" style={{ borderRadius: '8px' }}>
              En savoir plus →
            </a>
          </div>
        </div>
      ))}

      <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="border-0 rounded-pill"
            style={{
              width: currentSlide === index ? '30px' : '10px',
              height: '10px',
              backgroundColor: currentSlide === index ? 'white' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Publicite;
