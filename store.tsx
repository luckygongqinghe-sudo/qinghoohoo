
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Case, ScoringConfig, SiteConfig, UserRole, AppState, ThemeMode } from './types.ts';
import { DEFAULT_CONFIG, DEFAULT_SITE_CONFIG } from './constants.ts';

interface StoreContextType extends AppState {
  setCurrentUser: (user: User | null) => void;
  setTheme: (theme: ThemeMode) => void;
  addUser: (username: string, role: UserRole, password?: string, approved?: boolean) => User;
  toggleUserStatus: (id: string) => void;
  updateUserRole: (id: string, role: UserRole) => void;
  updateUserPassword: (id: string, newPassword: string) => void;
  approveUser: (id: string) => void;
  deleteUser: (id: string) => void;
  addCase: (newCase: Case) => void;
  updateCase: (id: string, updatedCase: Case) => void;
  deleteCases: (ids: string[]) => void;
  mergeCases: (incoming: Case[]) => number;
  updateConfig: (newConfig: ScoringConfig) => void;
  updateSiteConfig: (newConfig: SiteConfig) => void;
  logout: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const safeMergeConfig = <T extends object>(saved: string | null, defaultValue: T): T => {
  if (!saved) return defaultValue;
  try {
    const parsed = JSON.parse(saved);
    return { ...defaultValue, ...parsed };
  } catch (e) {
    return defaultValue;
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setThemeState] = useState<ThemeMode>(() => (localStorage.getItem('tb_theme') as ThemeMode) || 'light');
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('tb_users');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'admin_primary', username: 'qinghoohoo', password: 'tj981113', role: UserRole.ADMIN, active: true, approved: true },
      { id: 'default_user', username: 'user', password: '123', role: UserRole.USER, active: true, approved: true }
    ];
  });

  const [cases, setCases] = useState<Case[]>(() => {
    const saved = localStorage.getItem('tb_cases');
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<ScoringConfig>(() => 
    safeMergeConfig(localStorage.getItem('tb_config'), DEFAULT_CONFIG)
  );

  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => 
    safeMergeConfig(localStorage.getItem('tb_site_config'), DEFAULT_SITE_CONFIG)
  );

  useEffect(() => { localStorage.setItem('tb_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('tb_cases', JSON.stringify(cases)); }, [cases]);
  useEffect(() => { localStorage.setItem('tb_config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('tb_site_config', JSON.stringify(siteConfig)); }, [siteConfig]);
  
  useEffect(() => {
    localStorage.setItem('tb_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setTheme = (mode: ThemeMode) => setThemeState(mode);

  const addUser = (username: string, role: UserRole, password?: string, approved: boolean = true) => {
    const newUser: User = { 
      id: Date.now().toString(), 
      username, 
      password: password || '123456', 
      role, 
      active: true, 
      approved: true // 强制注册即激活
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const toggleUserStatus = (id: string) => setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  const updateUserRole = (id: string, role: UserRole) => setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  const updateUserPassword = (id: string, newPassword: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, password: newPassword } : u));
    setCurrentUser(prev => (prev && prev.id === id) ? { ...prev, password: newPassword } : prev);
  };
  const approveUser = (id: string) => setUsers(prev => prev.map(u => u.id === id ? { ...u, approved: true } : u));
  const deleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  const addCase = (newCase: Case) => setCases(prev => [newCase, ...prev]);
  const updateCase = (id: string, updatedCase: Case) => setCases(prev => prev.map(c => c.id === id ? updatedCase : c));
  const deleteCases = (ids: string[]) => setCases(prev => prev.filter(c => !ids.includes(c.id)));

  const mergeCases = (incoming: Case[]) => {
    let addedCount = 0;
    setCases(prev => {
      const newOnes = incoming.filter(ic => !prev.some(p => p.id === ic.id));
      addedCount = newOnes.length;
      return [...newOnes, ...prev];
    });
    return addedCount;
  };

  const updateConfig = (newConfig: ScoringConfig) => setConfig(newConfig);
  const updateSiteConfig = (newConfig: SiteConfig) => setSiteConfig(newConfig);
  const logout = () => setCurrentUser(null);

  return (
    <StoreContext.Provider value={{
      currentUser, users, cases, config, siteConfig, theme,
      setCurrentUser, setTheme, addUser, toggleUserStatus, updateUserRole, updateUserPassword, approveUser, deleteUser, 
      addCase, updateCase, deleteCases, mergeCases, updateConfig, updateSiteConfig, logout
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
