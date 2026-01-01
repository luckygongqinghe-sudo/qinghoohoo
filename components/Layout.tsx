
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store.tsx';
import { UserRole } from '../types.ts';
import { 
  ClipboardCheck, 
  Table, 
  Settings, 
  LogOut, 
  Activity, 
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, theme, setTheme } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 核心逻辑：管理中心入口仅 qinghoohoo 可见
  const navItems = [
    { path: '/dashboard/cases', label: '评估录入', icon: ClipboardCheck, show: true },
    { path: '/dashboard/summary', label: '数据分析', icon: Table, show: true },
    { path: '/dashboard/admin', label: '管理中心', icon: Settings, show: currentUser.username === 'qinghoohoo' },
  ];

  const currentNavItem = navItems.find(item => item.path === location.pathname);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 apple-transition">
      <div className="p-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-emerald-600 p-2 rounded-2xl shadow-lg shadow-emerald-200 group-hover:scale-105 apple-transition">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 dark:text-white block leading-none">TB-Screen</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 block">System Hub</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-6 space-y-1">
        <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest px-4 mb-4 mt-4">业务工作台</div>
        {navItems.filter(item => item.show).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl apple-transition group ${
              location.pathname === item.path 
              ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-2xl shadow-slate-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800'
            }`}
          >
            <item.icon size={20} className={location.pathname === item.path ? 'text-emerald-400 dark:text-emerald-100' : 'group-hover:text-emerald-500'} />
            <span className="text-[14px] font-bold">{item.label}</span>
            {location.pathname === item.path && <ChevronRight size={14} className="ml-auto opacity-50" />}
          </Link>
        ))}
      </nav>

      <div className="p-8 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/50 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-900 dark:text-white border border-slate-100 dark:border-slate-600 font-black uppercase">
              {currentUser.username.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-[13px] font-black text-slate-900 dark:text-white truncate">{currentUser.username}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {currentUser.username === 'qinghoohoo' ? 'Super Admin' : 'Operator'}
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-3 w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-[20px] apple-transition text-[13px] font-black"
        >
          <LogOut size={18} />
          退出系统
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#fbfbfd] dark:bg-slate-950 apple-transition">
      <aside className="hidden lg:flex w-72 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border-r border-black/5 dark:border-white/5 flex-col fixed inset-y-0 left-0 z-50">
        {sidebarContent}
      </aside>

      <div className={`lg:hidden fixed inset-0 z-[60] transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-6 right-6 lg:hidden">
            <button onClick={() => setIsMobileOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <X size={24} />
            </button>
          </div>
          {sidebarContent}
        </aside>
      </div>

      <main className="flex-1 lg:ml-72 min-w-0">
        <header className="h-20 lg:h-24 glass dark:bg-slate-900/70 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40">
           <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
               <Menu size={24} />
             </button>
             <div>
               <div className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                 Cloud Sync <span className="mx-2 opacity-30">/</span> {currentNavItem?.label}
               </div>
               <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white">{currentNavItem?.label}</h2>
             </div>
           </div>
           <div className="flex items-center gap-3 lg:gap-6">
             <button 
               onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
               className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white apple-transition"
             >
               {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
             </button>
             <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Activity size={18} className="text-emerald-600" />
             </div>
           </div>
        </header>
        <div className="p-6 lg:p-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
