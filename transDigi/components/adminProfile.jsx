import React, { useEffect, useState } from 'react';
import { getAdminProfile, updateAdminProfile, updateAdminEmail } from '../services/apiClient.js';
import SideBare from './sideBare.jsx';
import { LayoutGrid, Shield, Users, Truck, User } from 'lucide-react';

function AdminProfile() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    email: '',
    emailNotifications: true,
    pushNotifications: false,
    topics: {
      inscriptions: true,
      devis: true,
      systeme: true,
    },
  });
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErr('');
        const data = await getAdminProfile();
        const p = data?.profile || data || {};
        setForm({
          email: p?.email || '',
          emailNotifications: !!p.emailNotifications,
          pushNotifications: !!p.pushNotifications,
          topics: {
            inscriptions: p?.topics?.inscriptions ?? true,
            devis: p?.topics?.devis ?? true,
            systeme: p?.topics?.systeme ?? true,
          },
        });
      } catch (e) {
        if (e?.status === 429) {
          setErr("Trop de requêtes. Veuillez réessayer dans quelques secondes.");
        } else {
          setErr(e?.message || 'Erreur de chargement du profil');
        }
      } finally { setLoading(false); }
    };
    run();
  }, []);

  const onToggle = (key) => setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  const onTopic = (key) => setForm((prev) => ({ ...prev, topics: { ...prev.topics, [key]: !prev.topics[key] } }));
  const onEmailChange = (e) => setForm((prev) => ({ ...prev, email: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    try {
      setSaving(true);
      await updateAdminProfile(form);
      setMsg('Préférences mises à jour');
    } catch (e) {
      setErr(e?.message || 'Erreur lors de la mise à jour');
    } finally { setSaving(false); }
  };

  const onEmailSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    try {
      if (!form.email || !/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(form.email)) {
        setErr('Adresse e‑mail invalide');
        return;
      }
      setSavingEmail(true);
      await updateAdminEmail(form.email.trim().toLowerCase());
      setMsg('Email mis à jour');
    } catch (e) {
      setErr(e?.message || "Erreur lors de la mise à jour de l'email");
    } finally { setSavingEmail(false); }
  };

  return (
    <div className="d-flex bg-body" style={{ minHeight: '100vh' }}>
      <SideBare
        topOffset={96}
        activeId={'profil'}
        defaultOpen={true}
        closeOnNavigate={false}
        items={[
          { id: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid },
          { id: 'validation', label: 'Validation des comptes', icon: Shield },
          { id: 'clients', label: 'Clients', icon: Users },
          { id: 'transitaires', label: 'Transitaires', icon: Truck },
          { id: 'profil', label: 'Mon profil', icon: User },
        ]}
        onNavigate={(id) => {
          switch(id){
            case 'dashboard': window.location.hash = '#/dashboard-admin'; break;
            case 'validation': window.location.hash = '#/gestion-utilisateurs'; break; // adapter si besoin
            case 'clients': window.location.hash = '#/gestion-utilisateurs'; break;
            case 'transitaires': window.location.hash = '#/transitaires'; break; // adapter si une route existe
            case 'profil': window.location.hash = '#/modifier-profil'; break;
            default: break;
          }
        }}
      />
      <div className="container py-4 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h1 className="h4 fw-bold mb-3">Profil administrateur</h1>
                <p className="text-muted mb-4">Configurez vos préférences de notifications.</p>
                {loading && <div className="alert alert-light">Chargement...</div>}
                {err && <div className="alert alert-danger">{err}</div>}
                {msg && <div className="alert alert-success">{msg}</div>}
                {!loading && (
                  <form className="d-grid gap-3" onSubmit={onSubmit}>
                    <div>
                      <label className="form-label">Adresse e‑mail</label>
                      <div className="input-group">
                        <input type="email" className="form-control" value={form.email} onChange={onEmailChange} placeholder="admin@exemple.com" />
                        <button className="btn btn-outline-primary" onClick={onEmailSubmit} disabled={savingEmail}>{savingEmail ? 'Mise à jour...' : 'Mettre à jour l\'email'}</button>
                      </div>
                    </div>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="emailNotifications" checked={form.emailNotifications} onChange={() => onToggle('emailNotifications')} />
                      <label className="form-check-label" htmlFor="emailNotifications">Recevoir les notifications par e-mail</label>
                    </div>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="pushNotifications" checked={form.pushNotifications} onChange={() => onToggle('pushNotifications')} />
                      <label className="form-check-label" htmlFor="pushNotifications">Activer les notifications push</label>
                    </div>
                    <div className="border rounded p-3">
                      <div className="fw-semibold mb-2">Types de notifications</div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="topicInscriptions" checked={form.topics.inscriptions} onChange={() => onTopic('inscriptions')} />
                        <label className="form-check-label" htmlFor="topicInscriptions">Inscriptions à valider</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="topicDevis" checked={form.topics.devis} onChange={() => onTopic('devis')} />
                        <label className="form-check-label" htmlFor="topicDevis">Devis et demandes</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="topicSysteme" checked={form.topics.systeme} onChange={() => onTopic('systeme')} />
                        <label className="form-check-label" htmlFor="topicSysteme">Alertes système</label>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
