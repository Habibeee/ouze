import React, { useEffect, useState } from 'react';
import { useToast } from '../src/toast.jsx';
import { 
  Upload,
  X,
  FileText,
  Calendar,
  LayoutGrid,
  Search,
  Clock,
  Truck,
  User
} from 'lucide-react';
import { nouveauDevisCss } from '../styles/nouveauDeviStyle.jsx';
import { createDevis, searchTranslatairesClient } from '../services/apiClient.js';

const NouveauDevis = () => {
  const { success, error: toastError } = useToast();
  const [translataires, setTranslataires] = useState([]);
  const [loadingTranslataires, setLoadingTranslataires] = useState(false);
  const [translatairesError, setTranslatairesError] = useState('');
  const [formData, setFormData] = useState({
    translataireId: '',
    translataireName: '',
    transportType: 'maritime',
    description: '',
    weight: '',
    packageType: '',
    length: '',
    width: '',
    height: '',
    pickupAddress: '',
    pickupDate: '',
    deliveryAddress: '',
    deliveryDate: '',
    specialRequirements: {
      dangerous: false,
      temperature: false,
      fragile: false
    },
    notes: '',
    uploadedFiles: []
  });

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try {
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const parts = hash.split('?');
      if (parts.length > 1) {
        const params = new URLSearchParams(parts[1]);
        const tId = params.get('translataireId');
        const tName = params.get('translataireName');
        setFormData(prev => ({ ...prev, translataireId: tId || prev.translataireId, translataireName: tName || prev.translataireName }));
      }
      // Fallback: lire depuis localStorage si le hash n'a pas de paramètres
      if (typeof window !== 'undefined') {
        if (!formData.translataireId) {
          try {
            const lsId = localStorage.getItem('pendingTranslataireId');
            if (lsId) setFormData(prev => ({ ...prev, translataireId: lsId }));
          } catch {}
        }
        if (!formData.translataireName) {
          try {
            const lsName = localStorage.getItem('pendingTranslataireName');
            if (lsName) setFormData(prev => ({ ...prev, translataireName: lsName }));
          } catch {}
        }
        // Nettoyage après lecture
        try { localStorage.removeItem('pendingTranslataireId'); } catch {}
        try { localStorage.removeItem('pendingTranslataireName'); } catch {}
      }
    } catch {}
  }, []);

  // Progress computation based on filled fields
  useEffect(() => {
    const baseFields = [
      !!(formData.transportType && String(formData.transportType).trim()),
      !!(formData.description && formData.description.trim()),
      !!(formData.pickupAddress && formData.pickupAddress.trim()),
      !!(formData.deliveryAddress && formData.deliveryAddress.trim()),
    ];
    const optionalFields = [
      !!formData.pickupDate,
      !!formData.deliveryDate,
      !!(formData.uploadedFiles && formData.uploadedFiles.length),
      !!formData.weight,
      !!formData.length,
      !!formData.width,
      !!formData.height,
      !!formData.packageType,
    ];
    const baseScore = baseFields.filter(Boolean).length;
    const optScore = optionalFields.filter(Boolean).length;
    const baseMax = baseFields.length; // 5 -> 70%
    const optMax = optionalFields.length; // 8 -> 30%
    const percent = Math.round((baseScore / baseMax) * 70 + (optScore / Math.max(optMax,1)) * 30);
    setProgress(Math.max(0, Math.min(100, percent)));
  }, [formData]);

  // Charger la liste des transitaires pour alimenter la liste déroulante (optionnelle)
  useEffect(() => {
    (async () => {
      try {
        setLoadingTranslataires(true);
        setTranslatairesError('');
        const result = await searchTranslatairesClient({});
        const list = Array.isArray(result?.translataires)
          ? result.translataires
          : (Array.isArray(result) ? result : []);
        setTranslataires(list);
      } catch (e) {
        setTranslatairesError(e?.message || "Impossible de charger la liste des transitaires.");
      } finally {
        setLoadingTranslataires(false);
      }
    })();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({
      ...prev,
      specialRequirements: {
        ...prev.specialRequirements,
        [field]: !prev.specialRequirements[field]
      }
    }));
  };

  const MAX_CLIENT_FILE_SIZE = Number(import.meta.env.VITE_MAX_UPLOAD_FILE_SIZE) || (50 * 1024 * 1024); // 50 MB default
  const ALLOWED_TYPES = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/jpeg','image/png'];

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const accepted = [];
    const rejected = [];
    files.forEach((f) => {
      if (f.size > MAX_CLIENT_FILE_SIZE) {
        rejected.push({ name: f.name, reason: 'Taille trop volumineuse' });
        return;
      }
      if (ALLOWED_TYPES.length && !ALLOWED_TYPES.includes(f.type)) {
        rejected.push({ name: f.name, reason: 'Format non supporté' });
        return;
      }
      accepted.push(f);
    });
    if (rejected.length) {
      const list = rejected.map(r => `${r.name} (${r.reason})`).join(', ');
      toastError(`Fichiers rejetés: ${list}. Taille max par fichier: ${Math.round(MAX_CLIENT_FILE_SIZE/1024/1024)} MB.`);
    }
    if (accepted.length) {
      setFormData(prev => ({
        ...prev,
        uploadedFiles: [...(prev.uploadedFiles || []), ...accepted]
      }));
    }
    // clear the input to allow re-selecting same file if needed
    try { e.target.value = null; } catch {}
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      uploadedFiles: (prev.uploadedFiles || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    // Construire le payload pour l'API backend
    (async () => {
      try {
        // Champs obligatoires : date d'envoi du devis et fichier (Bill)
        if (!formData.pickupDate) {
          toastError("Veuillez renseigner la date d’envoi du devis.");
          return;
        }
        if (!formData.uploadedFiles || !formData.uploadedFiles.length) {
          toastError('Veuillez importer le Bill of Lading ou un document associé.');
          return;
        }

        let tId = (formData.translataireId || '').trim();
        // isFromSearch sert à personnaliser le message de succès lorsqu'on vient de "Trouver un transitaire"
        const isFromSearch = !!tId && !!(formData.translataireName || '').trim();
        // Nouveau comportement : le choix du transitaire est optionnel.
        // Si aucun transitaire n'est sélectionné, on choisit automatiquement le premier disponible
        // (côté back, l'admin reste le point central grâce à devisOrigin = 'nouveau-devis').
        if (!tId) {
          let list = Array.isArray(translataires) ? translataires : [];
          if (!list.length) {
            try {
              const result = await searchTranslatairesClient({});
              list = Array.isArray(result?.translataires)
                ? result.translataires
                : (Array.isArray(result) ? result : []);
            } catch (e) {
              toastError(e?.message || "Impossible de trouver un transitaire disponible pour le moment.");
              return;
            }
          }
          const pick = list[0];
          if (pick && pick._id) {
            tId = pick._id;
          } else {
            toastError('Aucun transitaire n\'est disponible pour traiter votre demande pour le moment.');
            return;
          }
        }
        if (!formData.description && !(formData.uploadedFiles && formData.uploadedFiles.length)) {
          toastError('Veuillez décrire votre marchandise ou joindre au moins un fichier');
          return;
        }
        const fd = new FormData();
        // Champs attendus par le backend
        const allowed = ['maritime','routier','aerien'];
        const tService = allowed.includes((formData.transportType||'').toLowerCase()) ? (formData.transportType||'').toLowerCase() : 'maritime';
        fd.append('typeService', tService);
        fd.append('description', formData.description || '');
        if (formData.pickupDate) fd.append('dateExpiration', formData.pickupDate);
        if (formData.pickupAddress) fd.append('origin', formData.pickupAddress);
        if (formData.deliveryAddress) fd.append('destination', formData.deliveryAddress);
        // Indiquer au backend l'origine du devis (recherche transitaire vs nouveau devis direct)
        fd.append('devisOrigin', isFromSearch ? 'search' : 'nouveau-devis');
        if (formData.uploadedFiles && formData.uploadedFiles.length) {
          formData.uploadedFiles.forEach((file) => {
            if (file) fd.append('fichier', file);
          });
        }
        if (formData.translataireName) fd.append('translataireName', formData.translataireName);
        await createDevis(tId, fd);
        const cible = (formData.translataireName || '').trim();
        // Message de confirmation :
        // - depuis "Trouver un transitaire" (isFromSearch) -> transitaire choisi + suivi admin
        // - depuis "Nouveau devis" -> envoyé à la plateforme, traité par les transitaires via l'administrateur
        if (isFromSearch && cible) {
          success(`Votre devis a bien été envoyé à ${cible}. L'administrateur en a également été informé pour le suivi.`);
        } else {
          success('Votre devis a été envoyé. Il sera pris en charge par la plateforme et traité par les transitaires via l’administrateur.');
        }
        window.location.hash = '#/historique';
      } catch (e) {
        const errorMsg = e?.message || "Une erreur est survenue lors de l'envoi du devis.";
        toastError(errorMsg.includes('400') ? "Erreur lors de l'upload du fichier. Vérifiez la taille et le format." : errorMsg);
      }
    })();
  };

  return (
    <>
      <style>{nouveauDevisCss}</style>
      <div className="bg-body" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', position: 'relative' }}>
        <div className="container px-2 px-md-3 py-3 py-md-5" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10 col-xl-8">
            {/* Header */}
            <div className="mb-3 mb-md-4">
              <h1 className="h2 h1-md fw-bold mb-2 mb-md-3">Nouvelle Demande de Devis</h1>
              <p className="text-muted">
                Remplissez les détails ci-dessous pour obtenir un devis pour votre expédition.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small fw-semibold">{progress}% Complété</span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className="progress-bar" 
                  role="progressbar" 
                  style={{ width: `${progress}%`, backgroundColor: '#28A745' }}
                ></div>
              </div>
            </div>

            {/* Main Form Card */}
            <div className="card border-0 shadow-sm">
              <div className="card-body p-3 p-md-4 p-lg-5">
                {/* Informations du transitaire */}
                <div className="mb-4 mb-md-5">
                  <h5 className="fw-bold mb-3 mb-md-4 section-title">Informations du transitaire</h5>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Nom du transitaire (optionnel)</label>
                      <select
                        className="form-select form-select-lg"
                        value={formData.translataireId}
                        onChange={(e) => {
                          const val = e.target.value;
                          const selected = (translataires || []).find((t) => t && t._id === val);
                          setFormData(prev => ({
                            ...prev,
                            translataireId: val,
                            translataireName: selected ? (selected.nomEntreprise || selected.name || '') : ''
                          }));
                        }}
                      >
                        <option value="">-- Aucun transitaire spécifique (recommandé) --</option>
                        {(translataires || []).map((t) => (
                          t && t._id ? (
                            <option key={t._id} value={t._id}>
                              {t.nomEntreprise || t.name || 'Transitaire'}
                            </option>
                          ) : null
                        ))}
                      </select>
                      <div className="form-text">
                        Ce choix est optionnel. Votre demande sera de toute façon traitée par la plateforme.
                      </div>
                      {loadingTranslataires && (
                        <div className="form-text text-muted">Chargement de la liste des transitaires...</div>
                      )}
                      {translatairesError && (
                        <div className="form-text text-danger">{translatairesError}</div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Détails de l'expédition */}
                <div className="mb-4 mb-md-5">
                  <h5 className="fw-bold mb-2 mb-md-3 section-title">Détails de l'expédition</h5>
                  <p className="text-muted small mb-4">
                    Vous pouvez renseigner les champs ci-dessous, joindre un ou plusieurs fichiers contenant les détails de votre expédition, ou faire les deux.
                  </p>
                  
                  {/* Type de transport */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Type de service</label>
                    <select
                      className="form-select form-select-lg"
                      value={formData.transportType}
                      onChange={(e) => handleInputChange('transportType', e.target.value)}
                    >
                      <option value="maritime">Maritime</option>
                      <option value="routier">Routier</option>
                      <option value="aerien">Aérien</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Description de la marchandise</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="ex. Électronique, Meubles"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  </div>

                  {/* Dimensions Row */}
                  <div className="row g-2 g-md-3 mb-3 mb-md-4 dimension-row">
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold small">Poids total (kg)</label>
                      <input
                        type="number"
                        className="form-control form-control-lg dim-input"
                        placeholder="1000"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold small">Type d'emballage</label>
                      <select 
                        className="form-select form-select-lg dim-input"
                        value={formData.packageType}
                        onChange={(e) => handleInputChange('packageType', e.target.value)}
                      >
                        <option value="">Palettes</option>
                        <option value="cartons">Cartons</option>
                        <option value="caisses">Caisses</option>
                        <option value="containers">Containers</option>
                      </select>
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold small">Longueur (cm)</label>
                      <input
                        type="number"
                        className="form-control form-control-lg dim-input"
                        placeholder="120"
                        value={formData.length}
                        onChange={(e) => handleInputChange('length', e.target.value)}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold small">Largeur (cm)</label>
                      <input
                        type="number"
                        className="form-control form-control-lg dim-input"
                        placeholder="100"
                        value={formData.width}
                        onChange={(e) => handleInputChange('width', e.target.value)}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold small">Hauteur (cm)</label>
                      <input
                        type="number"
                        className="form-control form-control-lg dim-input"
                        placeholder="150"
                        value={formData.height}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Origine & Destination */}
                <div className="mb-5">
                  <h5 className="fw-bold mb-4 section-title">Origine & Destination</h5>
                  
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Adresse d'enlèvement</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Entrez le lieu d'enlèvement"
                        value={formData.pickupAddress}
                        onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Date d'enlèvement souhaitée</label>
                      <div className="position-relative">
                        <input
                          type="date"
                          className="form-control form-control-lg"
                          value={formData.pickupDate}
                          onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Adresse de livraison</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Entrez le lieu de livraison"
                        value={formData.deliveryAddress}
                        onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Date de livraison souhaitée</label>
                      <input
                        type="date"
                        className="form-control form-control-lg"
                        value={formData.deliveryDate}
                        onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Upload File Section */}
                <div className="mb-5">
                  <h5 className="fw-bold mb-4 section-title">Documents joints</h5>
                  <p className="text-muted small mb-3">
                    Vous pouvez joindre un ou plusieurs documents avec les détails de votre expédition (facture, liste de colisage, etc.).
                  </p>
                  
                  <div className="border-2 border-dashed rounded-3 p-4 text-center" style={{ borderColor: '#DEE2E6' }}>
                    <input
                      type="file"
                      id="fileUpload"
                      className="d-none"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                      multiple
                    />
                    <label htmlFor="fileUpload" className="cursor-pointer">
                      <div 
                        className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                        style={{ width: '60px', height: '60px', backgroundColor: '#E8F5E9' }}
                      >
                        <Upload size={30} style={{ color: '#28A745' }} />
                      </div>
                      <p className="fw-semibold mb-1">Cliquez pour télécharger un ou plusieurs fichiers</p>
                      <p className="text-muted small mb-0">PDF, DOC, XLS, JPG, PNG (Max. 10MB par fichier)</p>
                    </label>
                  </div>

                  {formData.uploadedFiles && formData.uploadedFiles.length > 0 && (
                    <div className="mt-3">
                      {formData.uploadedFiles.map((file, index) => (
                        <div key={index} className="border rounded-3 p-3 d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-3">
                            <div 
                              className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: '40px', height: '40px', backgroundColor: '#E8F5E9' }}
                            >
                              <FileText size={20} style={{ color: '#28A745' }} />
                            </div>
                            <div>
                              <p className="mb-0 fw-semibold">{file.name}</p>
                              <p className="mb-0 text-muted small">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger"
                            onClick={() => removeFile(index)}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exigences supplémentaires */}
                <div className="mb-5">
                  <h5 className="fw-bold mb-4 section-title">Exigences supplémentaires</h5>
                  
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Manutention spéciale</label>
                    <div className="d-flex gap-3 flex-wrap">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="dangerous"
                          checked={formData.specialRequirements.dangerous}
                          onChange={() => handleCheckboxChange('dangerous')}
                        />
                        <label className="form-check-label" htmlFor="dangerous">
                          Matières dangereuses
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="temperature"
                          checked={formData.specialRequirements.temperature}
                          onChange={() => handleCheckboxChange('temperature')}
                        />
                        <label className="form-check-label" htmlFor="temperature">
                          Contrôle de température
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="fragile"
                          checked={formData.specialRequirements.fragile}
                          onChange={() => handleCheckboxChange('fragile')}
                        />
                        <label className="form-check-label" htmlFor="fragile">
                          Fragile
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="form-label fw-semibold">
                      Notes additionnelles 
                      <span className="text-muted fw-normal ms-2">
                        <small>(Optionnel)</small>
                      </span>
                    </label>
                    <textarea
                      className="form-control form-control-lg"
                      rows="4"
                      placeholder="ex. Maçon requise à la livraison, contacter le destinataire avant l'arrivée..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                    ></textarea>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-end">
  
                  <button 
                    className="btn text-white"
                    style={{ backgroundColor: '#28A745' }}
                    onClick={handleSubmit}
                  >
                    Soumettre la demande
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NouveauDevis;
