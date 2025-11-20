import React, { useState } from 'react';
import { formulaireTransitaireStyles } from '../styles/formulaireTransitaireStyle.jsx';
import { post } from '../services/apiClient.js';

function TransdigiRegister() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    ninea: '',
    phone: '',
    email: '',
    sectors: [],
    password: '',
    confirmPassword: '',
    photo: null
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitOk, setSubmitOk] = useState('');

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v) => /^\+?\d[\d\s.-]{7,}$/.test(v);
  const minLen = (v, n) => (v || '').trim().length >= n;
  const validateField = (name, value, all) => {
    switch (name) {
      case 'companyName':
        if (!value.trim()) return "Ce champ est obligatoire";
        if (!minLen(value, 2)) return 'Minimum 2 caractères';
        return '';
      case 'ninea':
        if (!value.trim()) return "Ce champ est obligatoire";
        if (!/^\w{8,15}$/i.test(value)) return 'NINEA invalide (8-15 caractères)';
        return '';
      case 'phone':
        if (!value.trim()) return "Ce champ est obligatoire";
        if (!isPhone(value)) return 'Numéro invalide';
        return '';
      case 'email':
        if (!value.trim()) return "Ce champ est obligatoire";
        if (!isEmail(value)) return 'E‑mail invalide';
        return '';
      case 'sectors':
        if (!Array.isArray(value) || value.length === 0) return 'Sélectionnez au moins un secteur';
        return '';
      case 'password':
        if (!value) return "Ce champ est obligatoire";
        if (value.length < 8) return 'Au moins 8 caractères';
        if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Incluez 1 lettre et 1 chiffre';
        return '';
      case 'confirmPassword':
        if (!value) return 'Veuillez confirmer le mot de passe';
        if (value !== (all?.password || formData.password)) return 'Les mots de passe ne correspondent pas';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newForm = { ...formData, [name]: value };
    setFormData(newForm);
    const err = validateField(name, value, newForm);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const SECTOR_OPTIONS = [
    { id: 'transport-maritime', label: 'Transport maritime', serviceCode: 'maritime' },
    { id: 'fret-aerien', label: 'Fret aérien', serviceCode: 'aerien' },
    { id: 'logistique-entreposage', label: "Logistique d’entreposage", serviceCode: null },
    { id: 'dedouanement', label: 'Dédouanement', serviceCode: null },
    { id: 'transport-aerien', label: 'Transport aérien', serviceCode: 'aerien' },
    { id: 'transport-routier', label: 'Transport routier', serviceCode: 'routier' },
    { id: 'transit', label: 'Transit', serviceCode: null },
  ];

  const toggleSector = (id) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.sectors) ? prev.sectors : [];
      const exists = current.includes(id);
      const next = exists ? current.filter((s) => s !== id) : [...current, id];
      const nextForm = { ...prev, sectors: next };
      const err = validateField('sectors', next, nextForm);
      setErrors((prevErr) => ({ ...prevErr, sectors: err }));
      return nextForm;
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = String(reader.result || '');
        setPhotoPreview(dataUrl);
        try { if (dataUrl) localStorage.setItem('pendingPhoto:translataire', dataUrl); } catch {}
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fields = ['companyName','ninea','phone','email','sectors','password','confirmPassword'];
    const newErrors = fields.reduce((acc, n) => {
      acc[n] = validateField(n, formData[n], formData);
      return acc;
    }, {});
    setErrors(newErrors);
    const hasError = Object.values(newErrors).some(Boolean);
    if (hasError) {
      const first = fields.find((n) => newErrors[n]);
      if (first) {
        const el = document.querySelector(`[name="${first}"]`);
        el && el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    const selectedIds = Array.isArray(formData.sectors) ? formData.sectors : [];
    const selectedOptions = SECTOR_OPTIONS.filter((opt) => selectedIds.includes(opt.id));
    const servicesLabels = selectedOptions.map((o) => o.label);
    const typeServices = Array.from(new Set(selectedOptions.map((o) => o.serviceCode).filter(Boolean)));
    const secteurActivite = servicesLabels.length ? servicesLabels.join(', ') : 'Aucun secteur renseigné';
    const payload = {
      nomEntreprise: formData.companyName.trim(),
      ninea: formData.ninea.trim(),
      telephoneEntreprise: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      motDePasse: formData.password,
      secteurActivite,
      typeServices,
      services: servicesLabels
    };
    try {
      setSubmitting(true);
      setSubmitError('');
      setSubmitOk('');
      const res = await post('/auth/register/translataire', payload);
      setSubmitOk('Inscription réussie, vous pouvez connecter avec votre email ou numéro de téléphone.');
      // Redirection vers la page de connexion après 2 secondes
      setTimeout(() => { window.location.hash = '#/connexion'; }, 2000);
    } catch (err) {
      setSubmitError(err?.message || 'Erreur lors de l\'inscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-5 bg-body" style={formulaireTransitaireStyles.section}>
      
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8 col-xl-6">
            <div className="text-center mb-4">
              <h1 className="display-6 fw-bold mb-2">Devenez partenaire transitaire</h1>
              <p className="text-muted mb-0">
                Rejoignez notre réseau de transitaires de confiance. Enregistrez votre entreprise pour commencer à recevoir des demandes de devis.
              </p>
            </div>

            <div className="p-4 p-md-5 border rounded-4 shadow-sm" style={formulaireTransitaireStyles.card}>
              {/* Photo Upload */}
              <div className="text-center mb-4">
                <div className="position-relative d-inline-block">
                  <div
                    className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center"
                    style={{ width: 120, height: 120, backgroundColor: photoPreview ? 'transparent' : '#28A745', border: '4px solid #e9ecef' }}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                    ) : (
                      <i className="bi bi-person text-white" style={{ fontSize: 48 }}></i>
                    )}
                  </div>
                  <label htmlFor="photoUpload" className="position-absolute bottom-0 end-0 btn btn-sm rounded-circle p-2" style={{ backgroundColor: '#28A745', cursor: 'pointer' }}>
                    <i className="bi bi-upload text-white"></i>
                  </label>
                  <input type="file" id="photoUpload" className="d-none" accept="image/*" onChange={handlePhotoChange} />
                </div>
                <p className="text-muted small mt-2 mb-0">Cliquez pour ajouter une photo</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="d-grid gap-3">
                <div>
                  <label className="form-label fw-semibold">Nom de l'entreprise</label>
                  <input type="text" className="form-control form-control-lg" placeholder="Nom de votre entreprise" name="companyName" value={formData.companyName} onChange={handleInputChange} />
                  {errors.companyName && <div className="text-danger small mt-1">{errors.companyName}</div>}
                </div>
                <div>
                  <label className="form-label fw-semibold">NINEA</label>
                  <input type="text" className="form-control form-control-lg" placeholder="Votre numéro d'identification national" name="ninea" value={formData.ninea} onChange={handleInputChange} />
                  {errors.ninea && <div className="text-danger small mt-1">{errors.ninea}</div>}
                </div>
                <div>
                  <label className="form-label fw-semibold">Téléphone</label>
                  <input type="tel" className="form-control form-control-lg" placeholder="+221 77 123 45 67" name="phone" value={formData.phone} onChange={handleInputChange} />
                  {errors.phone && <div className="text-danger small mt-1">{errors.phone}</div>}
                </div>
                <div>
                  <label className="form-label fw-semibold">E-mail</label>
                  <input type="email" className="form-control form-control-lg" placeholder="vous@exemple.com" name="email" value={formData.email} onChange={handleInputChange} />
                  {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
                </div>
                <div>
                  <label className="form-label fw-semibold">Secteurs d'activité</label>
                  <div className="border rounded-3 p-3">
                    {SECTOR_OPTIONS.map((opt) => (
                      <div key={opt.id} className="form-check">
                        <input
                          className="form-check-input sector-checkbox"
                          type="checkbox"
                          id={opt.id}
                          checked={Array.isArray(formData.sectors) && formData.sectors.includes(opt.id)}
                          onChange={() => toggleSector(opt.id)}
                        />
                        <label className="form-check-label" htmlFor={opt.id}>
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.sectors && <div className="text-danger small mt-1">{errors.sectors}</div>}
                </div>
                <div className="mb-2">
                  <label className="form-label fw-semibold">Mot de passe</label>
                  <div className="position-relative">
                    <input type={showPassword ? 'text' : 'password'} className="form-control form-control-lg pe-5" placeholder="Créez un mot de passe sécurisé" name="password" value={formData.password} onChange={handleInputChange} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent" style={{ paddingRight: 12 }} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
                    </button>
                  </div>
                  {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
                </div>

                <div className="mb-2">
                  <label className="form-label fw-semibold">Confirmer le mot de passe</label>
                  <div className="position-relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} className="form-control form-control-lg pe-5" placeholder="Confirmez votre mot de passe" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirmPassword(s => !s)} className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent" style={{ paddingRight: 12 }} aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
                    </button>
                  </div>
                  {errors.confirmPassword && <div className="text-danger small mt-1">{errors.confirmPassword}</div>}
                </div>

                <div className="alert alert-light border d-flex align-items-start gap-3" role="alert">
                  <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 24, height: 24, backgroundColor: '#28A745' }}>
                    <span className="text-white fw-bold" style={{ fontSize: 14 }}></span>
                  </div>
                  <small className="text-muted mb-0">Votre compte sera activé après vérification par notre administrateur. Vous recevrez une notification par e-mail une fois votre compte approuvé.</small>
                </div>

                <button type="submit" className="btn btn-success btn-lg w-100 fw-semibold" disabled={Object.values(errors).some(Boolean)}>
                  {submitting ? 'Création...' : 'Créer un compte'}
                </button>
                {submitError && <div className="alert alert-danger py-2">{submitError}</div>}
                {submitOk && <div className="alert alert-success py-2">{submitOk}</div>}

                <p className="text-center text-muted small mb-0">
                  En créant un compte, vous acceptez nos <a className="text-decoration-none" href="#" style={{ color: '#28A745' }}>Conditions d'utilisation</a> et notre <a className="text-decoration-none" href="#" style={{ color: '#28A745' }}>Politique de confidentialité</a>.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .form-control:focus, .form-select:focus { border-color: #28A745; box-shadow: 0 0 0 0.2rem rgba(40,167,69,.25); }
        .btn:hover { opacity: 0.95; }
        .sector-checkbox {
          width: 1.25rem;
          height: 1.25rem;
          border-width: 2px;
          cursor: pointer;
        }
        .sector-checkbox:checked {
          background-color: #28A745;
          border-color: #28A745;
          box-shadow: 0 0 0 0.15rem rgba(40,167,69,.4);
        }
        .sector-checkbox:focus {
          box-shadow: 0 0 0 0.2rem rgba(40,167,69,.45);
        }
      `}</style>
    </section>
  );
}

export default TransdigiRegister;
