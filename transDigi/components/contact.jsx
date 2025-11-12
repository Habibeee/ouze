import React, { useState } from 'react';
import { useToast } from '../src/toast.jsx';
import { contactStyles } from '../styles/contactStyle.jsx';
import { useI18n } from '../src/i18n.jsx';

function Contact() {
  const { success } = useToast();
  const { t } = useI18n();
  const [values, setValues] = useState({ fullName: '', email: '', phone: '', subject: '', message: '' });
  const [touched, setTouched] = useState({});

  const validate = (v) => {
    const errs = {};
    const nameOk = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}$/.test(v.fullName.trim());
    if (!v.fullName.trim()) errs.fullName = t('contact.validation.fullName.required'); else if (!nameOk) errs.fullName = t('contact.validation.fullName.format');
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim());
    if (!v.email.trim()) errs.email = t("contact.validation.email.required"); else if (!emailOk) errs.email = t('contact.validation.email.format');
    const raw = v.phone.replace(/\s|-/g, '');
    if (!v.phone.trim()) errs.phone = t('contact.validation.phone.required'); else if (raw.startsWith('+')) {
      const phoneOk = /^\+\d{1,3}\d{4,14}$/.test(raw);
      if (!phoneOk) errs.phone = t('contact.validation.phone.intl');
    } else {
      const snOk = /^\d{9}$/.test(raw);
      if (!snOk) errs.phone = t('contact.validation.phone.local');
    }
    if (!v.subject.trim()) errs.subject = t('contact.validation.subject.required');
    if (!v.message.trim()) errs.message = t('contact.validation.message.required');
    return errs;
  };

  const errors = validate(values);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((s) => ({ ...s, [name]: value }));
  };
  const onBlur = (e) => {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
  };
  const onSubmit = (e) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, phone: true, subject: true, message: true });
    const eNow = validate(values);
    if (Object.keys(eNow).length === 0) {
      // Envoi/API ici si nécessaire
      success(t('contact.toast.sent'));
      setValues({ fullName: '', email: '', phone: '', subject: '', message: '' });
      setTouched({});
    }
  };
  return (
    <section className="py-5 bg-body" style={contactStyles.section}>
      <div className="container">
        <div className="text-center mb-4">
          <h1 className="fw-bold mb-1">{t('contact.title')}</h1>
          <p className="text-muted mb-0">{t('contact.subtitle')}</p>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="p-4 border rounded-4" style={contactStyles.card}>
              <h5 className="fw-bold mb-3">{t('contact.form.title')}</h5>
              <form className="d-grid gap-3" onSubmit={onSubmit} noValidate>
                <div>
                  <label className="form-label mb-1">{t('contact.form.fullName')}</label>
                  <input
                    type="text"
                    name="fullName"
                    value={values.fullName}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={`form-control ${touched.fullName && errors.fullName ? 'is-invalid' : ''}`}
                    placeholder={t('contact.form.placeholder.fullName')}
                  />
                  {touched.fullName && errors.fullName && (
                    <div className="invalid-feedback">{errors.fullName}</div>
                  )}
                </div>
                <div>
                  <label className="form-label mb-1">{t('contact.form.email')}</label>
                  <input
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={`form-control ${touched.email && errors.email ? 'is-invalid' : ''}`}
                    placeholder={t('contact.form.placeholder.email')}
                  />
                  {touched.email && errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>
                <div>
                  <label className="form-label mb-1">{t('contact.form.phone')}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={values.phone}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={`form-control ${touched.phone && errors.phone ? 'is-invalid' : ''}`}
                    placeholder={t('contact.form.placeholder.phone')}
                  />
                  {touched.phone && errors.phone && (
                    <div className="invalid-feedback">{errors.phone}</div>
                  )}
                </div>
                
                <div>
                  <label className="form-label mb-1">{t('contact.form.message')}</label>
                  <textarea
                    name="message"
                    value={values.message}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={`form-control ${touched.message && errors.message ? 'is-invalid' : ''}`}
                    rows="5"
                    placeholder={t('contact.form.placeholder.message')}
                  />
                  {touched.message && errors.message && (
                    <div className="invalid-feedback">{errors.message}</div>
                  )}
                </div>
                <div className="text-end">
                  <button type="submit" className="btn fw-semibold" style={contactStyles.sendButton}>
                    {t('contact.form.send')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="col-12 col-lg-5 d-grid gap-4">
            <div className="p-4 border rounded-4" style={contactStyles.card}>
              <h5 className="fw-bold mb-3">{t('contact.info.title')}</h5>
              <div className="d-grid gap-2">
                <div className="d-flex align-items-start gap-2">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ ...contactStyles.iconBase, ...contactStyles.iconPhone }}>
                    <i className="bi bi-telephone-fill"></i>
                  </div>
                  <div>
                    <div className="small text-muted">{t('contact.info.phone')}</div>
                    <div className="fw-semibold">+221 77 595 83 40</div>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-2">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ ...contactStyles.iconBase, ...contactStyles.iconMail }}>
                    <i className="bi bi-envelope-fill"></i>
                  </div>
                  <div>
                    <div className="small text-muted">{t('contact.info.email')}</div>
                    <div className="fw-semibold">contact@transdigisn.com</div>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-2">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ ...contactStyles.iconBase, ...contactStyles.iconPin }}>
                    <i className="bi bi-geo-alt" style={{color: "#fff"}}></i>
                  </div>
                  <div>
                    <div className="small text-muted">{t('contact.info.address')}</div>
                    <div className="fw-semibold">{t('contact.info.address.value')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-4" style={contactStyles.card}>
              <h5 className="fw-bold mb-3">{t('contact.hours.title')}</h5>
              <div className="row small">
                <div className="col-7 text-muted">{t('contact.hours.monfri')}</div>
                <div className="col-5 text-end fw-semibold">9:00 ‑ 18:00</div>
                <div className="col-7 text-muted">{t('contact.hours.sat')}</div>
                <div className="col-5 text-end fw-semibold">10:00 ‑ 14:00</div>
                <div className="col-7 text-muted">{t('contact.hours.sun')}</div>
                <div className="col-5 text-end fw-semibold">{t('contact.hours.closed')}</div>
              </div>
            </div>

            <div className="p-4 border rounded-4" style={contactStyles.card}>
              <h5 className="fw-bold mb-3">{t('contact.follow.title')}</h5>
              <div className="d-flex align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-2">
                  <a href="#" className="btn btn-light rounded-circle" style={contactStyles.socialBtn}>in</a>
                  <a href="#" className="btn btn-light rounded-circle" style={contactStyles.socialBtn}>𝕏</a>
                  <a href="#" className="btn btn-light rounded-circle" style={contactStyles.socialBtn}>f</a>
                </div>
                <div className="ms-auto flex-grow-1 d-flex justify-content-end">
                  <img src={'/logo2.jpg'} alt="TransDigiSN" className="img-fluid" style={{ maxHeight: 56, width: 'auto' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="p-3 p-md-4 border rounded-4" style={contactStyles.card}>
            <h6 className="fw-bold mb-3">{t('contact.map.title')}</h6>
            <div style={contactStyles.mapBox}>
              <iframe
                title={t('contact.map.iframe.title')}
                src="https://www.google.com/maps?q=Dakar%2C%20S%C3%A9n%C3%A9gal&output=embed"
                style={contactStyles.mapIframe}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
