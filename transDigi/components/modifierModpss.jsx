import React, { useState } from 'react';
import { modifierMdpStyles, modifierMdpCss } from '../styles/modifierModpssStyle.jsx';

function ModifierModpss() {
  const [identifier, setIdentifier] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v) => /^\+?\d[\d\s.-]{7,}$/.test(v);
  const validate = (v) => {
    if (!v.trim()) return 'Ce champ est obligatoire';
    if (!(isEmail(v) || isPhone(v))) return "Saisissez un e‑mail ou un numéro valide";
    return '';
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const err = validate(identifier);
    setError(err);
    if (err) return;
    // Simule l'envoi des instructions
    setTimeout(() => setSent(true), 400);
  };

  return (
    <section className="bg-body" style={modifierMdpStyles.section}>
      <style>{modifierMdpCss}</style>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-7 col-xl-6">
            <div className="card border-0 shadow-sm p-3 p-md-4" style={modifierMdpStyles.card}>
              <div className="text-center mb-3">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={modifierMdpStyles.iconWrap}>
                  <span role="img" aria-label="key" style={{ fontSize: 24 }}>🔐</span>
                </div>
                <h1 className="fw-bold mb-2" style={modifierMdpStyles.title}>Mot de passe oublié ?</h1>
                <p className="text-muted mb-0">Veuillez saisir votre adresse e‑mail ou votre numéro de téléphone associé à votre compte pour recevoir les instructions de réinitialisation.</p>
              </div>

              {!sent ? (
                <form onSubmit={onSubmit} className="d-grid gap-3">
                  <div>
                    <label className="form-label fw-semibold small">Adresse e‑mail ou numéro de téléphone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Saisissez votre e‑mail ou votre numéro de téléphone"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      onBlur={() => setError(validate(identifier))}
                      aria-invalid={!!error}
                      aria-describedby="identifierHelp"
                      required
                    />
                    {error && (
                      <div id="identifierHelp" className="text-danger small mt-1">{error}</div>
                    )}
                  </div>

                  <button type="submit" className="btn  fw-semibold py-2" style={modifierMdpStyles.submitBtn} disabled={!!error || !identifier.trim()}>
                    Envoyer les instructions
                  </button>
                  

                  <div className="text-center">
                    <a href="#/connexion" className="small" style={modifierMdpStyles.link}>Se connecter</a>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4">
                  <div className="mb-3">✅</div>
                  <div className="fw-semibold mb-1">Instructions envoyées</div>
                  <div className="text-muted mb-3">Si un compte est associé à cet identifiant, un message a été envoyé avec la marche à suivre.</div>
                  <a href="#/connexion" className="btn fw-semibold" style={modifierMdpStyles.backBtn}>Retour à la connexion</a>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ModifierModpss;
