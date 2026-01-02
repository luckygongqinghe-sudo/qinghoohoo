
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, Case, ScoringConfig, SiteConfig, UserRole, AppState, ThemeMode } from './types.ts';
import { DEFAULT_CONFIG, DEFAULT_SITE_CONFIG } from './constants.ts';

const SUPABASE_URL = 'https://mmwikcigbeesrmvoeswi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1td2lrY2lnYmVlc3Jtdm9lc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNjkyMTgsImV4cCI6MjA4Mjg0NTIxOH0.KtAZoY-d7_2vl3bZTgGVc2pobJN2en4Sjei02_aFld8';

const supabase = (SUPABASE_URL.startsWith('http')) ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

interface StoreContextType extends AppState {
  isLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  setTheme: (theme: ThemeMode) => void;
  addUser: (username: string, role: UserRole, password?: string, approved?: boolean) => Promise<User>;
  toggleUserStatus: (id: string) => Promise<void>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  updateUserPassword: (id: string, newPassword: string) => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addCase: (newCase: Case) => Promise<void>;
  updateCase: (id: string, updatedCase: Case) => Promise<void>;
  deleteCases: (ids: string[]) => Promise<void>;
  mergeCases: (incoming: Case[]) => Promise<number>;
  updateConfig: (newConfig: ScoringConfig) => Promise<void>;
  updateSiteConfig: (newConfig: SiteConfig) => Promise<void>;
  logout: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setThemeState] = useState<ThemeMode>(() => (localStorage.getItem('tb_theme') as ThemeMode) || 'light');
  const [users, setUsers] = useState<User[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_CONFIG);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);

  const fetchData = async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [configRes, userRes, caseRes] = await Promise.all([
        supabase.from('configs').select('*').eq('id', 'current').maybeSingle(),
        supabase.from('users').select('*'),
        supabase.from('cases').select('*').order('created_at', { ascending: false })
      ]);

      if (configRes.data) {
        if (configRes.data.scoring_config) setConfig(configRes.data.scoring_config);
        if (configRes.data.site_config) setSiteConfig(configRes.data.site_config);
      }

      if (userRes.data) setUsers(userRes.data as User[]);
      if (caseRes.data) setCases(caseRes.data.map((c: any) => c.data) as Case[]);
    } catch (error) {
      console.error('Initial fetch failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!supabase) return;

    const channel = supabase
      .channel('realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, (payload) => {
        fetchData(); 
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configs' }, (payload) => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('tb_theme', mode);
  };

  const addUser = async (username: string, role: UserRole, password?: string, approved: boolean = false) => {
    const newUser: User = { 
      id: Date.now().toString(), 
      username, 
      password: password || '123456', 
      role, 
      active: true, 
      approved: approved 
    };
    if (supabase) {
      await supabase.from('users').upsert(newUser, { onConflict: 'username' });
    }
    setUsers(prev => [...prev.filter(u => u.username !== username), newUser]);
    return newUser;
  };

  const toggleUserStatus = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const nextStatus = !user.active;
    if (supabase) await supabase.from('users').update({ active: nextStatus }).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: nextStatus } : u));
  };

  const updateUserRole = async (id: string, role: UserRole) => {
    if (supabase) await supabase.from('users').update({ role }).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  };

  const updateUserPassword = async (id: string, newPassword: string) => {
    if (supabase) await supabase.from('users').update({ password: newPassword }).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, password: newPassword } : u));
  };

  const approveUser = async (id: string) => {
    if (supabase) await supabase.from('users').update({ approved: true }).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, approved: true } : u));
  };

  const deleteUser = async (id: string) => {
    if (supabase) await supabase.from('users').delete().eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addCase = async (newCase: Case) => {
    if (supabase) {
      await supabase.from('cases').insert({ id: newCase.id, data: newCase, creator_id: newCase.creatorId });
    }
    setCases(prev => [newCase, ...prev.filter(c => c.id !== newCase.id)]);
  };

  const updateCase = async (id: string, updatedCase: Case) => {
    if (supabase) {
      await supabase.from('cases').update({ data: updatedCase }).eq('id', id);
    }
    setCases(prev => prev.map(c => c.id === id ? updatedCase : c));
  };

  const deleteCases = async (ids: string[]) => {
    if (supabase) await supabase.from('cases').delete().in('id', ids);
    setCases(prev => prev.filter(c => !ids.includes(c.id)));
  };

  const mergeCases = async (incoming: Case[]) => {
    const newOnes = incoming.filter(ic => !cases.some(p => p.id === ic.id));
    if (newOnes.length > 0 && supabase) {
      const payloads = newOnes.map(c => ({ id: c.id, data: c, creator_id: c.creatorId }));
      await supabase.from('cases').insert(payloads);
    }
    setCases(prev => [...newOnes, ...prev]);
    return newOnes.length;
  };

  const updateConfig = async (newConfig: ScoringConfig) => {
    if (supabase) await supabase.from('configs').update({ scoring_config: newConfig, updated_at: new Date() }).eq('id', 'current');
    setConfig(newConfig);
  };

  const updateSiteConfig = async (newConfig: SiteConfig) => {
    if (supabase) await supabase.from('configs').update({ site_config: newConfig, updated_at: new Date() }).eq('id', 'current');
    setSiteConfig(newConfig);
  };

  const logout = () => setCurrentUser(null);

  return (
    <StoreContext.Provider value={{
      currentUser, users, cases, config, siteConfig, theme, isLoading,
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
