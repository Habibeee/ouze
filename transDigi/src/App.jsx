import React, { useEffect, useState, useLayoutEffect } from 'react';
import './App.css';
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
import TransitaireDashboard from '../components/tableauBoardTransitare.jsx';
import ClientDashboard from '../components/tableauBordClient.jsx';
import AdminDashboard from '../components/tableauBordAdmin.jsx';
import GestionUtilisateurs from '../components/gestionUtilisateur.jsx';
import HistoriqueDevisTransitaire from '../components/historiqueDevisTransitaire.jsx';
import ProfilTransitaire from '../components/profilTransitaire.jsx';
import DetailDevis from '../components/detailDevis.jsx';
import DetailDevisClient from '../components/detailDevisClient.jsx';
import MesFichiersRecusTransitaire from '../components/mesFichiersRecusTransitaire.jsx';
import MesFichiersRecus from '../components/mesFichiersRecus.jsx';
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
import { I18nProvider } from './i18n.jsx';
import { clientCss } from '../styles/tableauBordClientStyle.jsx';
import BackToTop from '../components/BackToTop.jsx';
import CartePage from './pages/CartePage.jsx';

function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  // Global sidebar open state for client-like layouts
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useLayoutEffect(() => {
    try {
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
    const isProtected = [
      // Anciennes routes maintenues pour la rétrocompatibilité
      '#/dashboard-client',
      '#/dashboard-transitaire',
      '#/dashboard-admin',
      '#/profil-client',
      '#/profile',
      '#/historique',
      '#/historique-transitaire',
      '#/nouveau-devis',
      '#/nouveau-devis-admin',
      '#/recherche-transitaire',
      '#/envois',
      '#/fichiers-recus',
      '#/fichiers-recus-transitaire',
      // Nouvelles routes du menu latéral
      '#/dashboard',
      '#/trouver-transitaire',
      '#/historique-devis',
      '#/suivi-envois',
      '#/profil'
    ].includes(baseRoute);
    
    const isAuthPages = ['#/connexion','#/signup','#/client','#/transitaire','#/oauth-callback'].includes(baseRoute) || 
                       route.startsWith('#/reinitialiser/') || 
                       route.startsWith('#/verifier/');

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
      const currentBaseRoute = (window.location.hash || '#/').split('?')[0];
      const isLogin = currentBaseRoute === '#/connexion';
      document.body.classList.toggle('login-page', isLogin);
    } catch {}
  }, [theme]);

  const baseRoute = (route || '').split('?')[0];
  const isClientRoute = [
    '#/dashboard',
    '#/trouver-transitaire',
    '#/nouveau-devis',
    '#/historique-devis',
    '#/historique',
    '#/suivi-envois',
    '#/profil',
    '#/dashboard-client',
    '#/recherche-transitaire',
    '#/profil-client',
    '#/envois'
  ].includes(baseRoute);

  const clientActiveId = (() => {
    switch(baseRoute) {
      case '#/dashboard':
      case '#/dashboard-client': 
        return 'dashboard';
      case '#/trouver-transitaire':
      case '#/recherche-transitaire': 
        return 'recherche';
      case '#/nouveau-devis':
        return 'devis';
      case '#/historique-devis':
        return 'historique-devis';
      case '#/historique':
        return 'historique';
      case '#/suivi-envois':
      case '#/envois': 
        return 'envois';
      case '#/profil':
      case '#/profil-client': 
        return 'profil';
      default:
        return 'dashboard';
    }
  })();

  const renderRoute = () => {
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
      case '#/dashboard':
      case '#/dashboard-client': 
        return <ClientDashboard section="dashboard" />;
      case '#/trouver-transitaire':
      case '#/recherche-transitaire': 
        return <ClientDashboard section="recherche" />;
      case '#/nouveau-devis':
        return <ClientDashboard section="devis" />;
      case '#/historique-devis':
        return <ClientDashboard section="historique-devis" />;
      case '#/historique':
        return <ClientDashboard section="historique" />;
      case '#/suivi-envois':
      case '#/envois': 
        return <ClientDashboard section="envois" />;
      case '#/profil':
      case '#/profil-client': 
        return <ClientDashboard section="profil" />;
      case '#/dashboard-transitaire':
        return <TransitaireDashboard />;
      case '#/historique-transitaire':
        return <HistoriqueDevisTransitaire />;
      case '#/dashboard-admin':
        return <AdminDashboard />;
      case '#/gestion-utilisateurs':
        return <GestionUtilisateurs />;
      case '#/mes-fichiers-recus':
        return <MesFichiersRecus />;
      case '#/fichiers-recus':
        return <ClientDashboard />;
      case '#/fichiers-recus-transitaire':
        return <MesFichiersRecusTransitaire />;
      case '#/detail-devis':
        return <DetailDevis />;
      case '#/detail-devis-client':
        return <DetailDevisClient />;
      case '#/carte':
        return <CartePage />;
      case '#/nouveau-devis-admin':
        return <ClientDashboard section="devis" />;
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
      case '#/apropos':
        return <Apropos />;
      case '#/':
      default:
        return <HomeHero />;
    }
  };

  if (isClientRoute) {
    const hasGlobalSidebar = baseRoute !== '#/client' && 
                           baseRoute !== '#/transitaire' && 
                           baseRoute !== '#/dashboard-client' && 
                           baseRoute !== '#/detail-devis-client' &&
                           baseRoute !== '#/recherche-transitaire' && 
                           baseRoute !== '#/nouveau-devis' && 
                           baseRoute !== '#/nouveau-devis-admin' &&
                           baseRoute !== '#/historique' && 
                           baseRoute !== '#/envois' && 
                           baseRoute !== '#/fichiers-recus' && 
                           baseRoute !== '#/profil-client';
    
    return (
      <I18nProvider>
        <ToastProvider>
          <div className="d-flex" style={{ minHeight: '100vh' }}>
            <style>{themeCss}</style>
            <style>{clientCss}</style>
            {hasGlobalSidebar && (
              <SideBare
                topOffset={96}
                activeId={clientActiveId}
                defaultOpen={true}
                closeOnNavigate={false}
                open={sidebarOpen}
                onOpenChange={(o) => setSidebarOpen(!!o)}
                items={[
                  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid },
                  { id: 'recherche', label: 'Trouver un transitaire', icon: Search },
                  { id: 'devis', label: 'Nouveau devis', icon: FileText },
                  { id: 'historique-devis', label: 'Historique des devis', icon: FileText },
                  { id: 'historique', label: 'Historique', icon: Clock },
                  { id: 'envois', label: 'Suivi des envois', icon: Truck },
                  { id: 'profil', label: 'Mon profil', icon: User }
                ]}
              />
            )}
            <main className="flex-grow-1">
              {renderRoute()}
            </main>
            <BackToTop />
            <Footer />
          </div>
        </ToastProvider>
      </I18nProvider>
    );
  }

  // Default layout for non-client routes
  return (
    <I18nProvider>
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
    </I18nProvider>
  );
}

export default App;