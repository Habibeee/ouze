import React, { useState, useEffect } from 'react';
import { LayoutGrid, Search, FileText, Truck, Clock, Settings, Menu, ArrowLeft, User } from 'lucide-react';
import { sideBareStyles, sideBareCss } from '../styles/sideBareStyle.jsx';

const menuItems = [
  { 
    id: 'dashboard', 
    label: 'Tableau de bord', 
    icon: LayoutGrid,
    component: 'tableauBordClient.jsx',
    path: '/tableau-bord-client'
  },
  { 
    id: 'recherche', 
    label: 'Trouver un transitaire', 
    icon: Search,
    component: 'profileTransitaire.jsx',
    path: '/profile-transitaire'
  },
  { 
    id: 'devis', 
    label: 'Nouveau devis', 
    icon: FileText,
    component: 'nouveauDevis.jsx',
    path: '/nouveau-devis'
  },
  { 
    id: 'historique-devis', 
    label: 'Historique des devis', 
    icon: FileText,
    component: 'historiqueDevis.jsx',
    path: '/historique-des-devis'
  },
  { 
    id: 'historique', 
    label: 'Historique', 
    icon: Clock,
    component: 'historique.jsx',
    path: '/historique'
  },
  { 
    id: 'envois', 
    label: 'Suivi des envois', 
    icon: Truck,
    component: 'suiviEnvoi.jsx',
    path: '/suivi-envois'
  },
  { 
    id: 'profil', 
    label: 'Mon profil', 
    icon: User,
    component: 'monProfil.jsx',
    path: '/mon-profil'
  }
];

export default function SideBare({ activeId = 'dashboard', onNavigate, onOpenChange, className = '', topOffset = 96, items, closeOnNavigate = false, defaultOpen = true, collapsible = true, open: controlledOpen, showFloatingToggle = true, showHeaderToggle = true, hideItemsWhenCollapsed = false, disableMobileOverlay = false }) {
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

  const handleNavigate = (item) => {
    // Si onNavigate est fourni, on l'appelle avec l'ID
    if (onNavigate) onNavigate(item.id);
    
    // Navigation via window.location pour forcer le rechargement de la page si nécessaire
    if (item.path) {
      // Ajout du # pour la navigation avec hash
      window.location.hash = item.path.startsWith('#') ? item.path : `#${item.path}`;
    }
    
    // Fermer le menu si nécessaire
    if (closeOnNavigate) {
      setOpenState(false);
    }
  };

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
          width: isLgUp ? (collapsible ? (open ? '240px' : '56px') : '240px') : '240px',
          top: topOffset,
          height: `calc(100vh - ${topOffset}px)`,
          zIndex: 1050,
          transform: isLgUp ? 'none' : (open ? 'translateX(0)' : 'translateX(-100%)'),
          transition: 'transform 0.3s ease, width 0.3s ease',
          overflowX: 'hidden',
          overflowY: 'auto'
        }}
      >
          <div className="p-3">
            {/* Afficher d'abord le bouton de basculement du menu */}
            {collapsible && (
              <div className="d-flex align-items-center gap-2 mb-3">
                <button
                  className="btn btn-link p-1"
                  onClick={toggleOpen}
                  aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
                >
                  {open ? <ArrowLeft size={18} /> : <Menu size={18} />}
                </button>
                {open && <div style={{width: '20px'}}></div>}
              </div>
            )}
            
            {/* Afficher tous les éléments du menu, y compris le Tableau de bord */}
            {(items || menuItems).map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeId;
              
              // Si on est en mode "masquer les items" et que la sidebar est repliée sur grand écran,
              // ne pas afficher les autres entrées de menu (seule la colonne étroite avec le toggle reste visible)
              if (collapsible && !open && hideItemsWhenCollapsed && isLgUp) {
                return null;
              }
              
              // Rendu spécial pour le tableau de bord
              if (item.id === 'dashboard') {
                return (
                  <div key={item.id} className="mb-2">
                    <button
                      className={`btn w-100 text-start d-flex align-items-center gap-3 sidebare-btn ${isActive ? 'text-white' : 'text-dark'}`}
                      style={{ 
                        ...(isActive ? sideBareStyles.activeMenuBtn : sideBareStyles.inactiveMenuBtn), 
                        ...sideBareStyles.menuBtnBase,
                        ...(!open && collapsible ? { justifyContent: 'center' } : {})
                      }}
                      onClick={() => handleNavigate(item)}
                      title={!open && collapsible ? item.label : ''}
                    >
                      <Icon size={20} />
                      {(!collapsible || open) && <span className="sidebare-label">{item.label}</span>}
                    </button>
                  </div>
                );
              }
              return (
                <button
                  key={item.id}
                  className={`btn w-100 text-start d-flex align-items-center gap-3 mb-2 sidebare-btn ${isActive ? 'text-white' : 'text-dark'}`}
                  style={{ ...(isActive ? sideBareStyles.activeMenuBtn : sideBareStyles.inactiveMenuBtn), ...sideBareStyles.menuBtnBase }}
                  onClick={() => handleNavigate(item)}
                >
                  <Icon size={20} />
                  {(!collapsible || open) && <span className="sidebare-label">{item.label}</span>}
                </button>
              );
            })}
          </div>
      </div>
      {!isLgUp && open && !disableMobileOverlay && (
        <div
          onClick={toggleOpen}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            top: topOffset,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1040,
            backdropFilter: 'blur(2px)',
            transition: 'opacity 0.3s ease',
            animation: 'fadeIn 0.3s ease'
          }}
          aria-label="Fermer l'overlay"
        />
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 991.98px) {
            .sidebare-sm { 
              font-size: 0.9rem; 
            }

            .sidebare-shadow {
              transform: translateX(-100%);
              transition: transform 0.3s ease;
            }

            .sidebare-shadow[style*="translateX(0)"] {
              transform: translateX(0) !important;
              box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
            }
          }
        `
      }} />
    </>
  );
}
