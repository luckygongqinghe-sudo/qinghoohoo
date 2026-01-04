
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, Case, ScoringConfig, SiteConfig, UserRole, AppState, ThemeMode, BatchStatus } from './types.ts';
import { DEFAULT_CONFIG, DEFAULT_SITE_CONFIG } from './constants.ts';

const SUPABASE_URL = 'https://mmwikcigbeesrmvoeswi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1td2lrY2lnYmVlc3Jtdm9lc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNjkyMTgsImV4cCI6MjA4Mjg0NTIxOH0.KtAZoY-d7_2vl3bZTgGVc2pobJN2en4Sjei02_aFld8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

interface StoreContextType extends AppState {
  isLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  setTheme: (theme: ThemeMode) => void;
  setBatchStatus: (status: Partial<BatchStatus>) => void;
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
  updateGlobalConfig: (newScoring: ScoringConfig, newSite: SiteConfig) => Promise<void>;
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
  const [batchStatus, setBatchStatusState] = useState<BatchStatus>({ isProcessing: false, current: 0, total: 0 });

  const fetchData = useCallback(async () => {
    try {
      const [configRes, userRes, caseRes] = await Promise.all([
        supabase.from('configs').select('*').eq('id', 'current').maybeSingle(),
        supabase.from('users').select('*'),
        supabase.from('cases').select('*').order('created_at', { ascending: false })
      ]);

      if (configRes.data) {
        if (configRes.data.scoring_config) {
          setConfig({ ...DEFAULT_CONFIG, ...configRes.data.scoring_config });
        }
        if (configRes.data.site_config) {
          setSiteConfig({ ...DEFAULT_SITE_CONFIG, ...configRes.data.site_config });
        }
      }

      if (userRes.data) setUsers(userRes.data as User[]);
      if (caseRes.data) setCases(caseRes.data.map((c: any) => c.data) as Case[]);
    } catch (error) {
      console.error('Data Sync Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('global-realtime-v1')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configs' }, (payload) => {
        const data = payload.new as any;
        if (data) {
          if (data.scoring_config) setConfig(data.scoring_config);
          if (data.site_config) setSiteConfig(data.site_config);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('tb_theme', mode);
  };

  const setBatchStatus = (status: Partial<BatchStatus>) => {
    setBatchStatusState(prev => ({ ...prev, ...status }));
  };

  const addUser = async (username: string, role: UserRole, password?: string, approved: boolean = false) => {
    const newUser: User = { id: Date.now().toString(), username, password: password || '123456', role, active: true, approved };
    await supabase.from('users').upsert(newUser, { onConflict: 'username' });
    return newUser;
  };

  const toggleUserStatus = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (user) await supabase.from('users').update({ active: !user.active }).eq('id', id);
  };

  const updateUserRole = async (id: string, role: UserRole) => {
    await supabase.from('users').update({ role }).eq('id', id);
  };

  const updateUserPassword = async (id: string, newPassword: string) => {
    await supabase.from('users').update({ password: newPassword }).eq('id', id);
  };

  const approveUser = async (id: string) => {
    await supabase.from('users').update({ approved: true }).eq('id', id);
  };

  const deleteUser = async (id: string) => {
    await supabase.from('users').delete().eq('id', id);
  };

  const addCase = async (newCase: Case) => {
    setCases(prev => [newCase, ...prev]); 
    await supabase.from('cases').insert({ id: newCase.id, data: newCase, creator_id: newCase.creatorId });
  };

  const updateCase = async (id: string, updatedCase: Case) => {
    setCases(prev => prev.map(c => c.id === id ? updatedCase : c));
    await supabase.from('cases').update({ data: updatedCase }).eq('id', id);
  };

  const deleteCases = async (ids: string[]) => {
    setCases(prev => prev.filter(c => !ids.includes(c.id)));
    await supabase.from('cases').delete().in('id', ids);
  };

  const mergeCases = async (incoming: Case[]) => {
    const newOnes = incoming.filter(ic => !cases.some(p => p.id === ic.id));
    if (newOnes.length > 0) {
      await supabase.from('cases').insert(newOnes.map(c => ({ id: c.id, data: c, creator_id: c.creatorId })));
    }
    return newOnes.length;
  };

  const updateGlobalConfig = async (newScoring: ScoringConfig, newSite: SiteConfig) => {
    setConfig(newScoring);
    setSiteConfig(newSite);
    await supabase
      .from('configs')
      .upsert({ 
        id: 'current', 
        scoring_config: newScoring, 
        site_config: newSite
      }, { onConflict: 'id' });
  };

  const updateConfig = async (newConfig: ScoringConfig) => {
    await updateGlobalConfig(newConfig, siteConfig);
  };

  const updateSiteConfig = async (newConfig: SiteConfig) => {
    await updateGlobalConfig(config, newConfig);
  };

  const logout = () => setCurrentUser(null);

  return (
    <StoreContext.Provider value={{
      currentUser, users, cases, config, siteConfig, theme, isLoading, batchStatus,
      setCurrentUser, setTheme, addUser, toggleUserStatus, updateUserRole, updateUserPassword, approveUser, deleteUser, 
      addCase, updateCase, deleteCases, mergeCases, updateGlobalConfig, updateConfig, updateSiteConfig, logout, setBatchStatus
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
