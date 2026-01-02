
import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store.tsx';
import * as LucideIcons from 'lucide-react';
import { 
  Activity, 
  ArrowRight,
  CheckCircle2,
  Lock,
  BrainCircuit,
  Zap,
  Globe
} from 'lucide-react';
import Footer from '../components/Footer.tsx';

const LandingPage: React.FC = () => {
  const { siteConfig } = useStore();
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderIcon = (name: string, size = 24) => {
    const IconComponent = (LucideIcons as any)[name] || LucideIcons.Activity;
    return <IconComponent size={size} />;
  };

  // 深度安全回退
  const heroTitle = siteConfig?.heroTitle || "TB-Scan\n精准筛查管理系统";
  const titleParts = heroTitle.split('\n');
  const features = siteConfig?.features || [];
  const aboutItems = siteConfig?.aboutItems || [];

  return (
    <div className="bg-[#fbfbfd] scroll-smooth overflow-x-hidden selection:bg-emerald-100 dark:bg-slate-950">
      <nav className="fixed top-0 w-full glass z-[100] border-b border-black/5 dark:bg-slate-900/70 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg group-hover:scale-105 transition-all duration-500">
              <Activity className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-black text-slate-950 dark:text-white tracking-tighter uppercase">{siteConfig?.footerBrandName || 'TB-Scan'}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="px-6 py-2 bg-slate-900 text-white dark:bg-emerald-600 text-[10px] font-black rounded-full hover:scale-105 transition-all uppercase tracking-widest shadow-xl">
              进入工作台
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-16 px-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[40%] h-[60%] bg-emerald-50/50 dark:bg-emerald-900/10 -z-10 blur-[100px] rounded-full translate-x-1/4 -translate-y-1/4"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[9px] font-black text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm tracking-widest uppercase">
              <Zap size={10} className="fill-emerald-600" /> {siteConfig?.heroBadge || 'Cloud Status: Online'}
            </div>
            
            <h1 className="font-black text-slate-900 dark:text-white leading-[1.05] tracking-tighter mb-6">
               {titleParts.map((line, idx) => (
                  <span key={idx} className={`block ${idx === 0 ? 'text-5xl sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 pb-2' : 'text-4xl sm:text-5xl text-slate-950 dark:text-white'}`}>
                    {line}
                  </span>
               ))}
            </h1>

            <p className="text-base md:text-lg text-slate-900 dark:text-slate-300 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0 font-bold">
              {siteConfig?.heroDescription}
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Link to="/login" className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 hover:bg-emerald-500 transition-all flex items-center justify-center gap-3">
                {siteConfig?.ctaText || '立即开始'} <ArrowRight size={16} />
              </Link>
              <button onClick={() => scrollToSection('features')} className="px-10 py-4 bg-white dark:bg-slate-800 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                <Globe size={16} className="text-slate-900 dark:text-slate-600" /> 了解核心特性
              </button>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg relative animate-in zoom-in duration-1000">
            <div className="relative aspect-[4/5] bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
                <img src={siteConfig?.heroImageUrl} className="w-full h-full object-cover opacity-60" alt="Medical Hero" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg"><BrainCircuit size={20} className="text-white" /></div>
                    <div><h4 className="text-white font-black text-sm">云端分布式同步</h4><p className="text-white text-[8px] font-black tracking-widest mt-0.5 uppercase opacity-80">Distributed via WebSocket</p></div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-10">
          <div className="mb-16 text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-950 dark:text-white mb-2 tracking-tighter uppercase">{siteConfig?.featuresTitle || '核心特性'}</h2>
            <p className="text-base text-slate-900 dark:text-slate-300 font-bold">{siteConfig?.featuresSubtitle}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.id} className="group p-10 bg-[#fbfbfd] dark:bg-slate-800 rounded-[2.5rem] hover:bg-white dark:hover:bg-slate-700 transition-all hover:-translate-y-2 hover:shadow-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-emerald-600 text-white shadow-xl">
                  {renderIcon(f.iconName, 22)}
                </div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white mb-3 tracking-tight">{f.title}</h3>
                <p className="text-slate-950 dark:text-slate-300 text-xs leading-relaxed font-bold">{f.description}</p>
              </div>
            ))}
            {features.length === 0 && <div className="col-span-3 text-center py-20 text-slate-950 italic font-black">正在从云端加载特性板块...</div>}
          </div>
        </div>
      </section>

      <section id="about" className="py-24 bg-[#fbfbfd] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-10">
          <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 md:p-14 shadow-xl flex flex-col lg:flex-row gap-12 items-center border border-slate-200 dark:border-slate-800">
            <div className="lg:w-1/2">
              <span className="text-emerald-600 font-black tracking-widest text-[9px] uppercase block mb-4 tracking-[0.3em]">Security Standards</span>
              <h2 className="text-3xl font-black text-slate-950 dark:text-white mb-10 tracking-tighter leading-tight">{siteConfig?.aboutTitle || '数据安全准则'}</h2>
              <div className="space-y-6">
                {aboutItems.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 transition-all group-hover:bg-emerald-600">
                       <CheckCircle2 className="text-emerald-600 group-hover:text-white" size={16} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-950 dark:text-white mb-0.5">{item.title}</h4>
                      <p className="text-slate-950 dark:text-slate-300 text-xs font-bold leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 w-full">
               <div className="w-full aspect-video bg-slate-950 rounded-[2.5rem] p-8 flex flex-col justify-between text-white overflow-hidden shadow-2xl relative group">
                  <div className="flex justify-between items-start">
                     <div className="bg-white/10 backdrop-blur-xl p-3 rounded-xl border border-white/10 group-hover:scale-110 transition-all shadow-lg"><Lock className="text-emerald-400" size={20} /></div>
                     <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-400/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-400/20">Active Protection</span>
                  </div>
                  <div>
                     <div className="text-5xl font-black mb-2 tracking-tighter">CLOUD-TLS</div>
                     <p className="text-white text-[9px] font-black uppercase tracking-widest opacity-80">End-to-End Encrypted Data Stream</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
