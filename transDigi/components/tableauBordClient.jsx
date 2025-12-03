import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Search, FileText, Truck, Clock, Settings, LogOut,
  CheckCircle, Mail, XCircle, X, User, Bell, MoreVertical, EyeOff, BellOff
} from 'lucide-react';
import { clientStyles, clientCss } from '../styles/tableauBordClientStyle.jsx';
import SideBare from './sideBare.jsx';
import RechercheTransitaire from './rechercheTransitaire.jsx';
import NouveauDevis from './nouveauDevis.jsx';
import NouveauDevisAdmin from './nouveauDevisAdmin.jsx';
import TrackingApp from './suiviEnvoi.jsx';
import ModofierProfClient from './modofierProfClient.jsx';
import HistoriqueDevis from './historiqueDevis.jsx';
import MesFichiersRecus from './mesFichiersRecus.jsx';
import { get, post, logout, listNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationsCount, cancelDevis as cancelDevisApi, listMesDevis as listMesDevisApi, updateMonDevis, getMonDevisById } from '../services/apiClient.js';
import { useToast } from './ui/ToastProvider.jsx';
import { getAuth, isAdmin as isAdminRole, isTrans as isTransRole } from '../services/authStore.js';
import { useI18n } from '../src/i18n.jsx';

const ClientDashboard = () => {
  const toast = useToast();
  const { t } = useI18n();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLgUp, setIsLgUp] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 992 : true));
  const [userName, setUserName] = useState('');

  // États pour les notifications
  const [hiddenNotifs, setHiddenNotifs] = useState({});
  const [disabledNotifTypes, setDisabledNotifTypes] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('recent');
  const [unreadCount, setUnreadCount] = useState(0);

  // Fonction pour charger les notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await listNotifications(100);
      setNotifications(data.items || data || []);
      const unread = (data.items || data || []).filter(n => !n.read).length;
      setUnreadCount(unread);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err);
      setError('Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour trier les notifications
  const sortNotifications = (notifs) => {
    return [...notifs].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date || 0);
      const dateB = new Date(b.createdAt || b.date || 0);
      
      switch(sortBy) {
        case 'recent': return dateB - dateA;
        case 'unread': 
          if (a.read !== b.read) return a.read ? 1 : -1;
          return dateB - dateA;
        case 'type':
          if (a.type === b.type) return dateB - dateA;
          return (a.type || '').localeCompare(b.type || '');
        default: return dateB - dateA;
      }
    });
  };

  // Fonction pour masquer une notification
  const hideNotification = (id) => {
    setHiddenNotifs(prev => {
      const newState = { ...prev, [id]: true };
      localStorage.setItem('hiddenNotifications', JSON.stringify(newState));
      return newState;
    });
  };

  // Fonction pour basculer un type de notification
  const toggleNotificationType = (type) => {
    setDisabledNotifTypes(prev => {
      const newState = { ...prev, [type]: !prev[type] };
      localStorage.setItem('disabledNotificationTypes', JSON.stringify(newState));
      return newState;
    });
  };

  // Fonction pour marquer une notification comme lue
  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => 
        prev.map(n => {
          if (n.id === id && !n.read) {
            setUnreadCount(prev => prev - 1);
            return { ...n, read: true };
          }
          return n;
        })
      );
    } catch (err) {
      console.error('Erreur lors du marquage comme lu:', err);
    }
  };

  // Fonction pour tout marquer comme lu
  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => 
        prev.map(n => {
          if (!n.read) {
            return { ...n, read: true };
          }
          return n;
        })
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Erreur lors du marquage tout comme lu:', err);
    }
  };

  // Fonction pour vérifier si une notification doit être affichée
  const shouldShowNotification = (notification) => {
    if (disabledNotifTypes[notification.type]) return false;
    if (hiddenNotifs[notification.id]) return false;
    return true;
  };

  // Charger les préférences et les notifications au montage
  useEffect(() => {
    // Récupérer le nom d'utilisateur depuis l'authentification
    const auth = getAuth();
    if (auth && auth.user) {
      setUserName(auth.user.name || auth.user.email || 'Utilisateur');
    }

    // Charger les préférences
    try {
      const savedHidden = localStorage.getItem('hiddenNotifications');
      const savedDisabled = localStorage.getItem('disabledNotificationTypes');
      if (savedHidden) setHiddenNotifs(JSON.parse(savedHidden));
      if (savedDisabled) setDisabledNotifTypes(JSON.parse(savedDisabled));
    } catch (e) {
      console.error('Erreur lors du chargement des préférences:', e);
    }

    // Charger les notifications
    loadNotifications();

    // Configurer le clic en dehors du menu des paramètres
    const handleClickOutside = (event) => {
      const settingsMenu = document.getElementById('notification-settings');
      if (settingsMenu && !settingsMenu.contains(event.target) && 
          !event.target.closest('button[title="Paramètres"]')) {
        settingsMenu?.classList.add('hidden');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Autres effets et logique existants...
  const [section, setSection] = useState(() => {
    if (typeof window === 'undefined') return 'dashboard';
    const h = (window.location.hash || '').split('?')[0];
    if (h.startsWith('#/recherche-transitaire')) return 'recherche';
    if (h.startsWith('#/nouveau-devis-admin')) return 'devis-admin';
    if (h.startsWith('#/nouveau-devis')) return 'devis';
    if (h.startsWith('#/historique')) return 'historique';
    if (h.startsWith('#/profil-client')) return 'profil';
    if (h.startsWith('#/envois')) return 'envois';
    if (h.startsWith('#/fichiers-recus')) return 'fichiers';
    if (h.startsWith('#/dashboard-client')) return 'dashboard';
    return 'dashboard';
  });

  // ... (conservez vos autres états et fonctions existants)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <SideBare 
          activeSection={section}
          onSectionChange={setSection}
          isOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isLgUp={isLgUp}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto focus:outline-none">
          {/* Header */}
          <header className="bg-white shadow-sm z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                {section === 'dashboard' && 'Tableau de bord'}
                {section === 'recherche' && 'Rechercher un transitaire'}
                {section === 'devis' && 'Nouveau devis'}
                {section === 'historique' && 'Historique des devis'}
                {section === 'profil' && 'Mon profil'}
                {section === 'envois' && 'Suivi des envois'}
                {section === 'fichiers' && 'Mes fichiers reçus'}
              </h1>
              
              <div className="flex items-center space-x-4">
                {/* Bouton de notification */}
                <div className="relative">
                  <button
                    onClick={() => setSection('notifications')}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
                  >
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                    )}
                  </button>
                </div>

                {/* Menu profil */}
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="hidden md:inline-block text-sm font-medium text-gray-700">
                      {userName || 'Utilisateur'}
                    </span>
                  </button>

                  {profileMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <button
                          onClick={() => {
                            setSection('profil');
                            setProfileMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Mon profil
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await logout();
                              window.location.href = '/#/connexion';
                            } catch (error) {
                              console.error('Erreur lors de la déconnexion:', error);
                            }
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Contenu principal */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {section === 'dashboard' && (
              <>
                {/* Section Notifications */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                    <div className="flex items-center">
                      <h2 className="text-xl font-semibold">Notifications</h2>
                      {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Tri des notifications */}
                      <div className="relative">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="recent">Plus récentes</option>
                          <option value="unread">Non lues d'abord</option>
                          <option value="type">Par type</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-blue-500 hover:text-blue-700 hover:underline whitespace-nowrap"
                          disabled={loading || unreadCount === 0}
                        >
                          Tout marquer comme lu
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById('notification-settings')?.classList.toggle('hidden');
                            }}
                            className="p-1 text-gray-500 hover:text-gray-700"
                            title="Paramètres des notifications"
                          >
                            <Settings size={18} />
                          </button>
                          
                          <div
                            id="notification-settings"
                            className="hidden absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="p-3 border-b border-gray-100">
                              <h3 className="font-medium text-gray-900">Types de notifications</h3>
                            </div>
                            <div className="p-2">
                              {['general', 'devis', 'message', 'alerte'].map(type => (
                                <label key={type} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={!disabledNotifTypes[type]}
                                    onChange={() => toggleNotificationType(type)}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700 capitalize">
                                    {type === 'devis' ? 'Devis' : 
                                     type === 'message' ? 'Messages' : 
                                     type === 'alerte' ? 'Alertes' : 'Générales'}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <XCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                          <button
                            onClick={loadNotifications}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Réessayer
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : notifications.filter(n => shouldShowNotification(n)).length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <BellOff className="mx-auto h-10 w-10 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune notification</h3>
                      <p className="mt-1 text-sm text-gray-500">Vous n'avez pas encore de notifications.</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white shadow overflow-hidden sm:rounded-md mb-4">
                        <ul className="divide-y divide-gray-200">
                          {sortNotifications(notifications)
                            .filter(n => shouldShowNotification(n))
                            .slice(
                              (currentPage - 1) * notificationsPerPage,
                              currentPage * notificationsPerPage
                            )
                            .map(notification => {
                              const isUnread = !notification.read;
                              return (
                                <li 
                                  key={notification.id} 
                                  className={`relative ${isUnread ? 'bg-blue-50' : 'bg-white'}`}
                                  data-unread={isUnread}
                                >
                                  <div className="px-4 py-4 sm:px-6 notification-item">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${
                                          isUnread ? 'text-blue-800' : 'text-gray-900'
                                        } truncate`}>
                                          {notification.title}
                                          {isUnread && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                              Nouveau
                                            </span>
                                          )}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-600">{notification.body}</p>
                                      </div>
                                      <div className="ml-4 flex-shrink-0 flex flex-col items-end">
                                        <span className="text-xs text-gray-500">
                                          {new Date(notification.createdAt || notification.date).toLocaleDateString('fr-FR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                        <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          notification.type === 'devis' ? 'bg-blue-100 text-blue-800' :
                                          notification.type === 'message' ? 'bg-green-100 text-green-800' :
                                          notification.type === 'alerte' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {notification.type === 'devis' ? 'Devis' : 
                                           notification.type === 'message' ? 'Message' : 
                                           notification.type === 'alerte' ? 'Alerte' : 'Général'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="mt-2 flex justify-between items-center">
                                      {notification.data && (
                                        <div className="text-xs text-gray-500 overflow-hidden max-h-20 overflow-y-auto">
                                          <pre className="whitespace-pre-wrap text-xs">
                                            {JSON.stringify(notification.data, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                      <div className="flex space-x-2 ml-2">
                                        {isUnread && (
                                          <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="text-blue-500 hover:text-blue-700"
                                            title="Marquer comme lu"
                                          >
                                            <CheckCircle size={18} />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => hideNotification(notification.id)}
                                          className="text-gray-400 hover:text-red-500"
                                          title="Masquer cette notification"
                                        >
                                          <X size={18} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                      
                      {/* Pagination */}
                      {Math.ceil(notifications.filter(n => shouldShowNotification(n)).length / notificationsPerPage) > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                          <div className="flex flex-1 justify-between sm:hidden">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Précédent
                            </button>
                            <button
                              onClick={() => setCurrentPage(prev => 
                                Math.min(
                                  Math.ceil(notifications.filter(n => shouldShowNotification(n)).length / notificationsPerPage), 
                                  prev + 1
                                )
                              )}
                              disabled={currentPage >= Math.ceil(notifications.filter(n => shouldShowNotification(n)).length / notificationsPerPage)}
                              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Suivant
                            </button>
                          </div>
                          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm text-gray-700">
                                Affichage de <span className="font-medium">{
                                  notifications.filter(n => shouldShowNotification(n)).length === 0 ? 0 : 
                                  (currentPage - 1) * notificationsPerPage + 1
                                }</span> à <span className="font-medium">{
                                  Math.min(
                                    currentPage * notificationsPerPage, 
                                    notifications.filter(n => shouldShowNotification(n)).length
                                  )
                                }</span> sur{' '}
                                <span className="font-medium">{notifications.filter(n => shouldShowNotification(n)).length}</span> résultats
                              </p>
                            </div>
                            <div>
                              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                  disabled={currentPage === 1}
                                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                  <span className="sr-only">Précédent</span>
                                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                
                                {Array.from({ 
                                  length: Math.min(
                                    5, 
                                    Math.ceil(notifications.filter(n => shouldShowNotification(n)).length / notificationsPerPage)
                                  ) 
                                }).map((_, i) => {
                                  let pageNum;
                                  const totalPages = Math.ceil(notifications.filter(n => shouldShowNotification(n)).length / notificationsPerPage);
                                  
                                  if (totalPages <= 5) {
                                    pageNum = i + 1;
                                  } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                  } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                  } else {
                                    pageNum = currentPage - 2 + i;
                                  }
                                  
                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => setCurrentPage(pageNum)}
                                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                        currentPage === pageNum
                                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                })}
                                
                                <button
                                  onClick={() => setCurrentPage(prev => 
                                    Math.min(
                                      Math.ceil(notifications.filter(n => shouldShowNotification(n)).length / notificationsPerPage), 
                                      prev + 1
                                    )
                                  )}
                                  disabled={currentPage >= Math.ceil(notifications.filter(n => shouldShowNotification(n)).length / notificationsPerPage)}
                                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                  <span className="sr-only">Suivant</span>
                                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </nav>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* Autres sections du tableau de bord */}
            {section === 'recherche' && <RechercheTransitaire />}
            {section === 'devis' && <NouveauDevis />}
            {section === 'devis-admin' && <NouveauDevisAdmin />}
            {section === 'historique' && <HistoriqueDevis />}
            {section === 'envois' && <TrackingApp />}
            {section === 'fichiers' && <MesFichiersRecus />}
            {section === 'profil' && <ModofierProfClient />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;