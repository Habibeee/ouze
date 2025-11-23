import React, { useState } from 'react';
import { formClientCss } from '../styles/formClientStyle.jsx';
import { post } from '../services/apiClient.js';

const FreightForwardPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitOk, setSubmitOk] = useState('');

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v) => /^\+?\d[\d\s.-]{7,}$/.test(v);
  const minLen = (v, n) => (v || '').trim().length >= n;
  const validateField = (name, value, all) => {
    switch (name) {
      case 'prenom':
        if (!value.trim()) return 'Ce champ est obligatoire';
        if (!minLen(value, 2)) return 'Minimum 2 caractères';
        return '';
      case 'nom':
        if (!value.trim()) return 'Ce champ est obligatoire';
        if (!minLen(value, 2)) return 'Minimum 2 caractères';
        return '';
      case 'adresse':
        if (!value.trim()) return 'Ce champ est obligatoire';
        return '';
      case 'telephone':
        if (!value.trim()) return 'Ce champ est obligatoire';
        if (!isPhone(value)) return 'Numéro invalide';
        return '';
      case 'email':
        if (!value.trim()) return 'Ce champ est obligatoire';
        if (!isEmail(value)) return 'E‑mail invalide';
        return '';
      case 'password':
        if (!value) return 'Ce champ est obligatoire';
        if (value.length < 8) return 'Au moins 8 caractères';
        if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Incluez 1 lettre et 1 chiffre';
        return '';
      case 'confirmPassword':
        if (!value) return 'Veuillez confirmer le mot de passe';
        if (value !== (all?.password || '')) return 'Les mots de passe ne correspondent pas';
        return '';
      case 'acceptTerms':
        if (!value) return "Vous devez accepter les conditions";
        return '';
      default:
        return '';
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // validation à la volée
    const err = validateField(name, type === 'checkbox' ? checked : value, { ...formData, [name]: type === 'checkbox' ? checked : value });
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // valider tous les champs
    const names = Object.keys(formData);
    const newErrors = names.reduce((acc, n) => {
      acc[n] = validateField(n, formData[n], formData);
      return acc;
    }, {});
    setErrors(newErrors);
    const hasError = Object.values(newErrors).some((v) => v);
    if (hasError) {
      // faire défiler vers le premier champ en erreur
      const first = names.find((n) => newErrors[n]);
      if (first) {
        const el = document.querySelector(`[name="${first}"]`);
        el && el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    // Appel API
    try {
      setSubmitting(true);
      setSubmitError('');
      setSubmitOk('');
      const payload = {
        prenom: formData.prenom.trim(),
        nom: formData.nom.trim(),
        email: formData.email.trim().toLowerCase(),
        telephone: formData.telephone.trim(),
        motDePasse: formData.password,
      };
      const res = await post('/auth/register/client', payload);
      setSubmitOk("Inscription réussie, vous pouvez connecter avec votre email ou numéro de téléphone.");
      // stocker l'avatar en attente pour upload après premier login
      try { if (photoPreview) localStorage.setItem('pendingPhoto:user', photoPreview); } catch {}
      // Redirection vers la page de connexion après 2 secondes
      setTimeout(() => { window.location.hash = '#/connexion'; }, 2000);
    } catch (err) {
      // Log technique pour le développeur
      console.error('Erreur inscription client', err);
      const raw = (err && err.message) ? String(err.message) : '';
      const status = err && typeof err.status === 'number' ? err.status : undefined;

      // Cas fonctionnels connus (messages plus précis pour l'utilisateur)
      const lower = raw.toLowerCase();
      let friendly = '';
      if (/(email|e-mail)/i.test(raw) && /(existe|déjà|already)/i.test(raw)) {
        friendly = "Cet email est déjà utilisé. Veuillez en choisir un autre ou vous connecter.";
      } else if (/(téléphone|telephone|phone)/i.test(raw) && /(existe|déjà|already)/i.test(raw)) {
        friendly = "Ce numéro de téléphone est déjà utilisé. Veuillez en choisir un autre ou vous connecter.";
      } else if (/(mot de passe|password)/i.test(raw) && /(faible|weak|court|short|complexité)/i.test(raw)) {
        friendly = "Votre mot de passe ne respecte pas les critères de sécurité. Utilisez au moins 8 caractères avec des lettres et des chiffres.";
      } else if (/(champ|field)/i.test(raw) && /(obligatoire|required|manquant|missing)/i.test(raw)) {
        friendly = "Certains champs obligatoires sont manquants ou invalides. Veuillez vérifier le formulaire.";
      } else {
        const looksTechnical = /http\s*\d+|internal server error|typeerror|syntaxerror|validationerror/i.test(raw);
        const isServer = status && status >= 500;
        friendly = (isServer || looksTechnical)
          ? 'Une erreur est survenue. Veuillez réessayer plus tard.'
          : (raw || 'Une erreur est survenue. Veuillez réessayer plus tard.');
      }
      setSubmitError(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <style>{formClientCss}</style>
      

      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Créez votre compte client</h1>
          <p className="text-gray-600">Obtenez des devis de transport instantanés et gérez facilement vos expéditions.</p>
        </div>

        <div className="rounded-lg shadow-md p-8" style={{ backgroundColor: 'var(--card)' }}>
          <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-2">Prénom</label>
              <input
                type="text"
                className="form-control"
                placeholder="Entrez votre prénom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
              />
              {errors.prenom && <div className="text-danger small mt-1">{errors.prenom}</div>}
            </div>
            <div>
              <label className="block font-semibold mb-2">Nom</label>
              <input
                type="text"
                className="form-control"
                placeholder="Entrez votre nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
              />
              {errors.nom && <div className="text-danger small mt-1">{errors.nom}</div>}
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-2">Adresse</label>
            <div className="input-group">
              <span className="input-group-text">
                <svg width="20" height="20" fill="currentColor" className="text-gray-400" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="10" cy="10" r="3" fill="currentColor"/>
                </svg>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Entrez votre adresse"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
              />
            </div>
            {errors.adresse && <div className="text-danger small mt-1">{errors.adresse}</div>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-2">Téléphone</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Votre numéro de téléphone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
              />
              {errors.telephone && <div className="text-danger small mt-1">{errors.telephone}</div>}
            </div>
            <div>
              <label className="block font-semibold mb-2">Adresse e-mail</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g., jean.dupont@example.com"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-2">Mot de passe</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Entrez votre mot de passe"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
            </div>
            <div>
              <label className="block font-semibold mb-2">Confirmer le mot de passe</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Confirmez votre mot de passe"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Masquer le mot de passe confirmé' : 'Afficher le mot de passe confirmé'}
                >
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.confirmPassword && <div className="text-danger small mt-1">{errors.confirmPassword}</div>}
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-semibold mb-2">Photo de profil</label>
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 rounded-full overflow-hidden flex items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                ) : (
                  <svg width="60" height="60" fill="currentColor" className="text-gray-400">
                    <circle cx="30" cy="25" r="10" fill="currentColor"/>
                    <path d="M15 45 Q30 35, 45 45" stroke="currentColor" strokeWidth="3" fill="none"/>
                  </svg>
                )}
              </div>
              <label className="btn btn-outline-secondary mb-0">
                Changer
                <input type="file" accept="image/*" className="d-none" onChange={handlePhotoChange} />
              </label>
            </div>
          </div>

          {submitError && <div className="alert alert-danger py-2 mb-3">{submitError}</div>}
          {submitOk && <div className="alert alert-success py-2 mb-3">{submitOk}</div>}

          <div className="flex items-start gap-2 mb-6">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              id="acceptTerms"
              className="mt-1"
            />
            <label htmlFor="acceptTerms" className="text-sm">
              J'accepte les <a href="#" className="text-blue-600">Conditions d'utilisation</a> et la <a href="#" className="text-blue-600">Politique de confidentialité</a>
            </label>
          </div>
          {errors.acceptTerms && <div className="text-danger small mt-1 mb-2">{errors.acceptTerms}</div>}

          <button type="submit" className="btn btn-primary w-full text-lg" disabled={submitting || Object.values(errors).some(Boolean)}>
            {submitting ? 'Création...' : 'Créer un compte'}
          </button>
          </form>
        </div>

        
      </div>
    </div>
  );
};

export default FreightForwardPage;
