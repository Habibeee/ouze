export const connexionStyles = {
  section: {
    paddingTop: 96,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

export const connexionCss = `
  /* Base reset for this card */
  .login-section { display: flex; align-items: center; justify-content: center; padding: 20px; }
  .login-card {
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    max-width: 480px; width: 100%;
    padding: 50px 40px;
    margin: 0 auto;
  }
  [data-theme="dark"] .login-card { background: #1f2937; color: #e5e7eb; }
  .header { text-align: center; margin-bottom: 32px; }
  .header h1 { font-size: 32px; color: #2d3748; margin-bottom: 10px; font-weight: 600; }
  .header p { font-size: 16px; color: #718096; }
  [data-theme="dark"] .header h1 { color: #f3f4f6; }
  [data-theme="dark"] .header p { color: #9ca3af; }

  .form-group { margin-bottom: 22px; }
  .form-group label { display: block; font-size: 15px; color: #4a5568; margin-bottom: 10px; font-weight: 500; }
  [data-theme="dark"] .form-group label { color: #e5e7eb; }
  .input-wrapper { position: relative; }
  .input-wrapper input { width: 100%; padding: 14px 44px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; transition: all .3s ease; outline: none; background: #fff; color: #111827; }
  .input-wrapper input:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12); }
  [data-theme="dark"] .input-wrapper input { background: #111827; color: #e5e7eb; border-color: #374151; }
  .icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #a0aec0; font-size: 18px; }
  .toggle-password { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #a0aec0; font-size: 18px; }
  .toggle-password:hover { color: #667eea; }
  .password-hint { font-size: 13px; color: #a0aec0; margin-top: 8px; padding-left: 4px; }

  .form-options { display: flex; justify-content: space-between; align-items: center; margin: 18px 0 24px; }
  .remember-me { display: flex; align-items: center; gap: 8px; cursor: pointer; }
  .forgot-password { color: #667eea; text-decoration: none; font-size: 14px; font-weight: 500; }
  .forgot-password:hover { text-decoration: underline; }

  .submit-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all .3s ease; margin-bottom: 18px; }
  .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(102, 126, 234, 0.35); }
  .submit-btn:active { transform: translateY(0); }

  .signup-link { text-align: center; font-size: 14px; color: #718096; }
  .signup-link a { color: #667eea; text-decoration: none; font-weight: 600; }
  .signup-link a:hover { text-decoration: underline; }

  /* Extra Small Screens (<360px) */
  @media (max-width: 359.98px) {
    .login-card { padding: 32px 20px; border-radius: 14px; }
    .header h1 { font-size: 22px; }
    .header p { font-size: 14px; }
    .input-wrapper input { padding: 12px 40px; font-size: 14px; }
    .icon, .toggle-password { font-size: 16px; }
    .submit-btn { padding: 14px; font-size: 15px; }
  }

  /* Mobile (<576px) */
  @media (max-width: 575.98px) {
    .login-section { padding: 20px 12px; }
    .login-card { padding: 40px 28px; }
    .header h1 { font-size: 26px; }
    .header p { font-size: 15px; }
  }

  /* Tablette (576px - 767px) */
  @media (min-width: 576px) and (max-width: 767.98px) {
    .login-card { padding: 48px 36px; }
    .header h1 { font-size: 30px; }
  }

  /* Desktop Small (768px - 991px) */
  @media (min-width: 768px) and (max-width: 991.98px) {
    .login-card { padding: 50px 40px; }
  }

  /* Prevent text overflow */
  @media (max-width: 991.98px) {
    .header h1 { word-break: break-word; hyphens: auto; }
  }
`;

