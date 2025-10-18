export interface User {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

export const authStorage = {
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const user = localStorage.getItem('healthsaas_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  

  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('healthsaas_user', JSON.stringify(user));
      localStorage.setItem('healthsaas_token', 'authenticated');
    }
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('healthsaas_user');
      localStorage.removeItem('healthsaas_token');
    }
  },
};

