export function getAuth() {
  try {
    const token = localStorage.getItem('token') || '';
    const role = localStorage.getItem('role') || '';
    const userType = localStorage.getItem('userType') || '';
    return { token, role, userType };
  } catch { return { token: '', role: '', userType: '' }; }
}

export function setAuth({ token, role, userType }) {
  if (token) localStorage.setItem('token', token);
  if (role) localStorage.setItem('role', role);
  if (userType) localStorage.setItem('userType', userType);
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userType');
}

export const isAdmin = () => {
  const { role, userType } = getAuth();
  const r = (role || userType || '').toLowerCase();
  return r.includes('admin');
};

export const isTrans = () => {
  const { role, userType } = getAuth();
  const r = (role || userType || '').toLowerCase();
  return r.startsWith('trans');
};

export const isClient = () => !isAdmin() && !isTrans();

export function redirectByRole() {
  try {
    const { role, userType } = getAuth();
    const r = (role || userType || '').toLowerCase();
    if (r.includes('admin')) {
      window.location.hash = '#/dashboard-admin';
    } else if (r.startsWith('trans')) {
      window.location.hash = '#/dashboard-transitaire';
    } else {
      window.location.hash = '#/dashboard-client';
    }
  } catch {
    window.location.hash = '#/dashboard-client';
  }
}
