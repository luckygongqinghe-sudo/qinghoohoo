
import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import * as LucideIcons from 'lucide-react';
import { 
  Activity, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock
} from 'lucide-react';
import Footer from '../components/Footer';

const LandingPage: React.FC = () => {
  const { siteConfig } = useStore();
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderIcon = (name: string, size = 24) => {
    const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} />;
  };

  return (
    <div className="bg-white scroll-smooth overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full glass z-[100] border-b border-black/5">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-2xl shadow-lg shadow-emerald-200">
              <Activity className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">TB-Screen</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center gap-8 text-[13px] font-semibold text-slate-500 uppercase tracking-wider">
              <button onClick={() => scrollToSection('features')} className="hover:text-emerald-600 apple-transition">核心技术</button>
              <button onClick={() => scrollToSection('about')} className="hover:text-emerald-600 apple-transition">安全性</button>
            </div>
            <Link to="/login" className="px-6 py-2.5 bg-black text-white text-[13px] font-bold rounded-full hover:bg-slate-800 apple-transition shadow-xl">
              工作台登录
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Reduced padding from pt-48 pb-32 to pt-32 pb-20 */}
      <section className="mesh-gradient pt-32 pb-20 px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/50 backdrop-blur-md border border-black/5 rounded-full text-[12px] font-bold text-emerald-700 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles size={14} className="animate-pulse" /> {siteConfig.heroBadge}
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-6 whitespace-pre-line animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            {siteConfig.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 leading-relaxed max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {siteConfig.heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-5 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link to="/login" className="px-10 py-5 bg-emerald-600 text-white rounded-[20px] font-bold shadow-2xl shadow-emerald-300 hover:scale-105 active:scale-95 apple-transition flex items-center gap-3">
              {siteConfig.ctaText} <ArrowRight size={20} />
            </Link>
            <button onClick={() => scrollToSection('features')} className="px-10 py-5 bg-white text-slate-900 border border-black/5 rounded-[20px] font-bold shadow-xl hover:bg-slate-50 apple-transition">
              了解技术方案
            </button>
          </div>
        </div>
      </section>

      {/* Dynamic Features Grid - Reduced padding from py-40 to py-24 */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">{siteConfig.featuresTitle}</h2>
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
              {siteConfig.featuresSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {siteConfig.features.map((f) => (
              <div key={f.id} className="group flex flex-col items-start apple-transition hover:-translate-y-2">
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center mb-6 shadow-xl transition-all duration-500 group-hover:scale-110 bg-emerald-50 text-emerald-600`}>
                  {renderIcon(f.iconName, 28)}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed text-base">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section - Reduced padding from py-40 to py-24 */}
      <section id="about" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="bg-white rounded-[3.5rem] p-10 md:p-20 premium-shadow flex flex-col lg:flex-row gap-16 items-center border border-black/5">
            <div className="lg:w-1/2">
              <span className="text-emerald-600 font-bold tracking-widest text-[11px] uppercase block mb-4">Security First</span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight">{siteConfig.aboutTitle}</h2>
              <div className="space-y-8">
                {siteConfig.aboutItems.map((item) => (
                  <div key={item.id} className="flex gap-5">
                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h4>
                      <p className="text-slate-500 text-base leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
               <div className="w-full aspect-square bg-slate-900 rounded-[3rem] p-8 flex flex-col justify-between text-white overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 apple-transition"></div>
                  <div className="flex justify-between items-start relative z-10">
                     <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                        <Lock className="text-emerald-400" size={28} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">Encrypted</span>
                  </div>
                  <div className="relative z-10">
                     <div className="text-5xl font-black mb-2">99.99%</div>
                     <p className="text-slate-400 text-xs leading-relaxed max-w-xs font-medium">
                        {siteConfig.aboutSubtitle}
                     </p>
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
