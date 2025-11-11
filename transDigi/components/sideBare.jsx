import React, { useState, useEffect } from 'react';
import { LayoutGrid, Search, FileText, Truck, Clock, Settings, Menu, ArrowLeft } from 'lucide-react';
import { sideBareStyles, sideBareCss } from '../styles/sideBareStyle.jsx';

const menuItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid },
  { id: 'recherche', label: 'Trouver un transitaire', icon: Search },
  { id: 'devis', label: 'Mes devis', icon: FileText },
  { id: 'envois', label: "Suivi des envois", icon: Truck },
  { id: 'historique', label: 'Historique', icon: Clock },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
];

export default function SideBare({ activeId = 'dashboard', onNavigate, onOpenChange, className = '', topOffset = 96, items, closeOnNavigate = false, defaultOpen = true, collapsible = true, open: controlledOpen, showFloatingToggle = true, showHeaderToggle = true }) {
  const isControlled = typeof controlledOpen === 'boolean';
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isControlled ? controlledOpen : internalOpen;

  // Responsive: detect >=992px
  const [isLgUp, setIsLgUp] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 992 : true));
  useEffect(() => {
    const onResize = () => setIsLgUp(window.innerWidth >= 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Synchroniser vers le parent si nécessaire
  useEffect(() => { if (typeof onOpenChange === 'function') onOpenChange(open); }, [open]);

  const setOpenState = (next) => {
    if (!collapsible) return;
    if (typeof onOpenChange === 'function') onOpenChange(next);
    if (!isControlled) setInternalOpen(next);
  };
  const toggleOpen = () => setOpenState(!open);

  const handleNavigate = (id) => {
    if (onNavigate) onNavigate(id);
    if (closeOnNavigate) {
      setOpenState(false);
    }
  };

  // Body scroll lock on mobile overlay when open
  useEffect(() => {
    if (!isLgUp && open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isLgUp, open]);

  return (
    <>
      <style>{sideBareCss}</style>
      {/* Floating toggle removed to avoid duplicate icons */}

      <div
        className={`sidebare-shadow ${className}`}
        style={{
          ...sideBareStyles.sidebar,
          backgroundColor: 'var(--card)',
          color: 'var(--text)',
          width: isLgUp ? (collapsible ? (open ? sideBareStyles.sidebar.width : '56px') : sideBareStyles.sidebar.width) : sideBareStyles.sidebar.width,
          top: topOffset,
          height: `calc(100vh - ${topOffset}px)`,
          zIndex: 1050,
          transform: isLgUp ? 'none' : (open ? 'translateX(0)' : 'translateX(-100%)'),
          transition: 'transform .25s ease, width .25s ease'
        }}
      >
          <div className="p-3">
            {(items || menuItems).map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeId;
              if (item.id === 'dashboard' && collapsible) {
                return (
                  <div key={item.id} className="d-flex align-items-center gap-2 mb-2">
                    <button
                      className="btn btn-link p-1"
                      onClick={toggleOpen}
                      aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
                    >
                      {open ? <ArrowLeft size={18} /> : <Menu size={18} />}
                    </button>
                    {open && (
                      <button
                        className={`btn text-start d-flex align-items-center gap-3 flex-grow-1 sidebare-btn ${isActive ? 'text-white' : 'text-dark'}`}
                        style={{ ...(isActive ? sideBareStyles.activeMenuBtn : sideBareStyles.inactiveMenuBtn), ...sideBareStyles.menuBtnBase }}
                        onClick={() => handleNavigate(item.id)}
                      >
                        <Icon size={20} />
                        <span className="sidebare-label">{item.label}</span>
                      </button>
                    )}
                  </div>
                );
              }
              return (
                <button
                  key={item.id}
                  className={`btn w-100 text-start d-flex align-items-center gap-3 mb-2 sidebare-btn ${isActive ? 'text-white' : 'text-dark'}`}
                  style={{ ...(isActive ? sideBareStyles.activeMenuBtn : sideBareStyles.inactiveMenuBtn), ...sideBareStyles.menuBtnBase }}
                  onClick={() => handleNavigate(item.id)}
                >
                  <Icon size={20} />
                  {(!collapsible || open) && <span className="sidebare-label">{item.label}</span>}
                </button>
              );
            })}
          </div>
      </div>
      {!isLgUp && open && (
        <div
          onClick={() => toggleOpen()}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1040 }}
          aria-label="Fermer l'overlay"
        />
      )}
    </>
  );
}

