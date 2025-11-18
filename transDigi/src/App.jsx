 import React, { useEffect, useState, useLayoutEffect } from 'react';
import './App.css'
import Header from '../layout/header.jsx';
import Footer from '../layout/footer.jsx';
import HomeHero from '../components/index.jsx';
import SideBare from '../components/sideBare.jsx';
import { LayoutGrid, Search, FileText, Clock, Truck, User } from 'lucide-react';
import Contact from '../components/contact.jsx';
import Connexion from '../components/connexion.jsx';
import Signup from '../components/signup.jsx';
import FormClient from '../components/formClient.jsx';
import FormulaireTransitaire from '../components/formulaireTransitaire.jsx';
import RechercheTransitaire from '../components/rechercheTransitaire.jsx';
import TransitaireDashboard from '../components/tableauBoardTransitare.jsx';
import ClientDashboard from '../components/tableauBordClient.jsx';
import AdminDashboard from '../components/tableauBordAdmin.jsx';
import GestionUtilisateurs from '../components/gestionUtilisateur.jsx';
import HistoriqueDevis from '../components/historiqueDevis.jsx';
import HistoriqueDevisTransitaire from '../components/historiqueDevisTransitaire.jsx';
import ProfilTransitaire from '../components/profilTransitaire.jsx';
import ModofierProfClient from '../components/modofierProfClient.jsx';
import DetailDevis from '../components/detailDevis.jsx';
import DetailDevisClient from '../components/detailDevisClient.jsx';
import NouveauDevis from '../components/nouveauDevis.jsx';
import { themeCss } from '../styles/themeStyle.jsx';
import Apropos from '../components/apropos.jsx';
import ModifierModpss from '../components/modifierModpss.jsx';
import VerifyEmail from '../components/verifyEmail.jsx';
import ForgotPassword from '../components/forgotPassword.jsx';
import ResetPassword from '../components/resetPassword.jsx';
import ChangePassword from '../components/changePassword.jsx';
import AdminProfile from '../components/adminProfile.jsx';
import OAuthCallback from '../components/oauthCallback.jsx';
import { ToastProvider } from '../components/ui/ToastProvider.jsx';
import { clientCss } from '../styles/tableauBordClientStyle.jsx';
import BackToTop from '../components/BackToTop.jsx';

function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  // Global sidebar open state for client-like layouts (must be top-level for hooks order)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useLayoutEffect(() => {
    try {
      // Keep CSS var in sync if some styles read it; content margin uses state directly
      const val = sidebarOpen ? '240px' : '56px';
      document.documentElement.style.setProperty('--sidebar-width', val);
    } catch {}
  }, [sidebarOpen]);

  // Responsive: track if viewport is large (>= 992px)
  const [isLgUp, setIsLgUp] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 992 : true));
  useEffect(() => {
    const onResize = () => setIsLgUp(window.innerWidth >= 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) {
      window.location.hash = '#/';
    }
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const getUserTypeFromStorage = () => {
    try {
      const t = (localStorage.getItem('userType') || '').toLowerCase();
      const r = (localStorage.getItem('role') || '').toLowerCase();
      return (r || t || '').toLowerCase();
    } catch {
      return '';
    }
  };

  // Auth Guards & redirects
  useEffect(() => {
    const baseRoute = (route || '').split('?')[0];
    const token = (() => { try { return localStorage.getItem('token'); } catch { return null; } })();
    const userType = getUserTypeFromStorage();
    const hasUserType = !!(userType && userType.length);
    const isProtected = ['#/dashboard-client','#/dashboard-transitaire','#/dashboard-admin','#/profil-client','#/profile','#/historique','#/historique-transitaire','#/nouveau-devis','#/recherche-transitaire','#/envois'].includes(baseRoute);
    const isAuthPages = ['#/connexion','#/signup','#/client','#/transitaire','#/oauth-callback'].includes(baseRoute) || route.startsWith('#/reinitialiser/') || route.startsWith('#/verifier/');

    // Si l'utilisateur clique sur "Se connecter", on autorise l'accès en nettoyant l'état auth
    if (route === '#/connexion') {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        localStorage.removeItem('role');
      } catch {}
    }

    if (!token && isProtected) {
      window.location.hash = '#/connexion';
      return;
    }
    // Ne quitter la page de connexion que si on connaît le type (token+userType)
    if (token && hasUserType && (baseRoute === '#/connexion' || baseRoute === '#/signup')) {
      if (userType.includes('admin')) window.location.hash = '#/dashboard-admin';
      else if (userType.startsWith('trans')) window.location.hash = '#/dashboard-transitaire';
      else window.location.hash = '#/dashboard-client';
    }
  }, [route]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    try {
      document.body.classList.toggle('theme-dark', theme === 'dark');
      // Flag de page de connexion pour ajuster le layout (ex: footer en mobile)
      const baseRoute = (window.location.hash || '#/').split('?')[0];
      const isLogin = baseRoute === '#/connexion';
      document.body.classList.toggle('login-page', isLogin);
    } catch {}
  }, [theme]);

  const baseRoute = (route || '').split('?')[0];
  const isClientRoute = ['#/dashboard-client','#/recherche-transitaire','#/nouveau-devis','#/historique','#/profil-client','#/envois','#/detail-devis-client','#/client','#/transitaire'].includes(baseRoute);

  const clientActiveId = (() => {
    switch(baseRoute){
      case '#/dashboard-client': return 'dashboard';
      case '#/recherche-transitaire': return 'recherche';
      case '#/nouveau-devis': return 'devis';
      case '#/historique': return 'historique';
      case '#/envois': return 'envois';
      case '#/profil-client': return 'profile';
      case '#/client': return 'dashboard';
      case '#/transitaire': return 'dashboard';
      default: return 'dashboard';
    }
  })();

  const renderRoute = () => {
    // Routes avec segments dynamiques
    if (route.startsWith('#/verifier/')) return <VerifyEmail />;
    if (route.startsWith('#/reinitialiser/')) return <ResetPassword />;
    if (baseRoute === '#/changer-mot-de-passe') return <ChangePassword />;
    if (baseRoute === '#/oauth-callback') return <OAuthCallback />;
    switch (baseRoute) {
      case '#/signup':
        return <Signup />;
      case '#/client':
        return <FormClient />;
      case '#/transitaire':
        return <FormulaireTransitaire />;
      case '#/recherche-transitaire':
        return <RechercheTransitaire />;
      case '#/dashboard-transitaire':
        return <TransitaireDashboard />;
      case '#/historique-transitaire':
        return <HistoriqueDevisTransitaire />;
      case '#/dashboard-client':
        return <ClientDashboard />;
      case '#/dashboard-admin':
        return <AdminDashboard />;
      case '#/gestion-utilisateurs':
        return <GestionUtilisateurs />;
      case '#/historique':
        return <HistoriqueDevis />;
      case '#/envois':
        return <ClientDashboard />;
      case '#/detail-devis':
        return <DetailDevis />;
      case '#/detail-devis-client':
        return <DetailDevisClient />;
      case '#/nouveau-devis':
        return <NouveauDevis />;
      case '#/connexion':
        return <Connexion />;
      case '#/mot-de-passe-oublie':
        return <ForgotPassword />;
      case '#/modifierModpss':
        return <ModifierModpss />;
      case '#/modifier-profil':
        return <AdminProfile />;
      case '#/contact':
        return <Contact />;
      case '#/profile':
        return <ProfilTransitaire />;
      case '#/profil-client':
        return <ModofierProfClient />;
      case '#/apropos':
        return <Apropos />;
      case '#/':
      default:
        return <HomeHero />;
    }
  };

  if (isClientRoute) {
    return (
      <ToastProvider>
      <div className="d-flex" style={{ minHeight: '100vh' }}>
        <style>{themeCss}</style>
        <style>{clientCss}</style>
        {baseRoute !== '#/client' && baseRoute !== '#/transitaire' && (
        <SideBare
          topOffset={96}
          activeId={clientActiveId}
          defaultOpen={true}
          closeOnNavigate={false}
          open={sidebarOpen}
          onOpenChange={(o)=>setSidebarOpen(!!o)}
          items={[
            { id: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid },
            { id: 'recherche', label: 'Trouver un transitaire', icon: Search },
            { id: 'devis', label: 'Nouveau devis', icon: FileText },
            { id: 'historique', label: 'Historique', icon: Clock },
            { id: 'envois', label: 'Suivi des envois', icon: Truck },
            { id: 'profile', label: 'Mon profil', icon: User },
          ]}
          onNavigate={(id) => {
            switch(id){
              case 'dashboard': window.location.hash = '#/dashboard-client'; break;
              case 'recherche': window.location.hash = '#/recherche-transitaire'; break;
              case 'devis': window.location.hash = '#/nouveau-devis'; break;
              case 'historique': window.location.hash = '#/historique'; break;
              case 'envois': window.location.hash = '#/envois'; break;
              case 'profile': window.location.hash = '#/profil-client'; break;
              default: break;
            }
          }}
        />
        )}
        <div className="flex-grow-1" style={{ marginLeft: (baseRoute !== '#/client' && baseRoute !== '#/transitaire') ? (isLgUp ? (sidebarOpen ? '240px' : '56px') : '0') : '0', transition: 'margin-left .25s ease' }}>
          <Header showSidebarToggle={false} hideNavbarToggler={false} onToggleSidebar={() => setSidebarOpen(o=>!o)} />
          <main className="flex-fill">
            {renderRoute()}
          </main>
          <BackToTop />
          <Footer />
        </div>
      </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
    <div className="d-flex flex-column min-vh-100">
      <style>{themeCss}</style>
      <Header hideNavbarToggler={false} />
      <main className="flex-fill">
        {renderRoute()}
      </main>
      <BackToTop />
      <Footer />
    </div>
    </ToastProvider>
  )
}

export default App
