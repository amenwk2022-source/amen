
export const authService = {
  login: (email: string, password: string): boolean => {
    // Mock authentication
    if (email === 'admin@lawyer.com' && password === '123456') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', email);
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    window.location.href = '#/login';
    window.location.reload();
  },

  isAuthenticated: (): boolean => {
    return localStorage.getItem('isAuthenticated') === 'true';
  },

  getUser: () => {
    return {
      email: localStorage.getItem('userEmail') || '',
      name: 'المحامي الرئيسي'
    };
  }
};
