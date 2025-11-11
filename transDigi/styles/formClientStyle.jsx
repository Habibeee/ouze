export const formClientStyles = {
  section: { paddingTop: 96 },
  card: { background: 'var(--bs-body-bg)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }
};

export const formClientCss = `
  .form-control { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.5rem; font-size: 1rem; }
  .form-control:focus { outline: none; border-color: #0d6efd; box-shadow: 0 0 0 0.2rem rgba(13,110,253,.25); }
  .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 500; }
  .btn-primary { background-color: #0d6efd; color: white; }
  .btn-primary:hover { background-color: #0b5ed7; }
  .btn-outline-secondary { background-color: white; border: 1px solid #6c757d; color: #6c757d; }
  .btn-outline-secondary:hover { background-color: #6c757d; color: white; }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  .min-h-screen { min-height: 100vh; }
  .max-w-4xl { max-width: 56rem; }
  .max-w-7xl { max-width: 80rem; }
  .max-w-lg { max-width: 32rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
  .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
  .p-8 { padding: 2rem; }
  .p-10 { padding: 2.5rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-3 { margin-bottom: 0.75rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mb-6 { margin-bottom: 1.5rem; }
  .mb-8 { margin-bottom: 2rem; }
  .mb-12 { margin-bottom: 3rem; }
  .mr-2 { margin-right: 0.5rem; }
  .mr-3 { margin-right: 0.75rem; }
  .mr-4 { margin-right: 1rem; }
  .ml-6 { margin-left: 1.5rem; }
  .mt-1 { margin-top: 0.25rem; }
  .mt-6 { margin-top: 1.5rem; }
  .flex { display: flex; }
  .grid { display: grid; }
  .hidden { display: none; }
  .block { display: block; }
  .items-center { align-items: center; }
  .items-start { align-items: flex-start; }
  .justify-between { justify-content: space-between; }
  .justify-center { justify-content: center; }
  .justify-end { justify-content: flex-end; }
  .gap-2 { gap: 0.5rem; }
  .gap-3 { gap: 0.75rem; }
  .gap-4 { gap: 1rem; }
  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
  .text-5xl { font-size: 3rem; line-height: 1; }
  .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
  .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
  .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
  .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
  .text-gray-900 { color: #111827; }
  .text-gray-600 { color: #4b5563; }
  .text-gray-400 { color: #9ca3af; }
  .text-blue-600 { color: #2563eb; }
  .bg-white { background-color: white; }
  .bg-gray-50 { background-color: #f9fafb; }
  .bg-gray-100 { background-color: #f3f4f6; }
  .bg-blue-50 { background-color: #eff6ff; }
  .bg-blue-600 { background-color: #2563eb; }
  .rounded { border-radius: 0.25rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .rounded-xl { border-radius: 0.75rem; }
  .rounded-3xl { border-radius: 1.5rem; }
  .rounded-full { border-radius: 9999px; }
  .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
  .shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
  .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
  .border { border-width: 1px; }
  .border-blue-200 { border-color: #bfdbfe; }
  .w-full { width: 100%; }
  .relative { position: relative; }
  .absolute { position: absolute; }
  .right-3 { right: 0.75rem; }
  .top-1\/2 { top: 50%; }
  .-translate-y-1\/2 { transform: translateY(-50%); }
  .-right-16 { right: -4rem; }
  .bottom-0 { bottom: 0; }
  .leading-tight { line-height: 1.25; }
  .flex-shrink-0 { flex-shrink: 0; }
  .no-underline { text-decoration: none; }
  .cursor-pointer { cursor: pointer; }
  .bg-transparent { background-color: transparent; }
  .border-0 { border: 0; }
  .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  @media (min-width: 768px) {
    .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .lg\\:p-12 { padding: 3rem; }
  }
  @media (min-width: 1024px) {
    .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .lg\\:block { display: block; }
  }
`;

