
import React from 'react';
import { useStore } from '../store';

const Footer: React.FC = () => {
  const { siteConfig } = useStore();

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
        <div>
          <h3 className="text-white font-bold text-lg mb-4">{siteConfig.footerBrandName}</h3>
          <p className="text-sm leading-relaxed max-w-sm opacity-80">
            {siteConfig.footerDescription}
          </p>
        </div>
        
        <div className="flex flex-col md:items-end">
          <h4 className="text-white font-semibold mb-4">联系我们</h4>
          <div className="space-y-3 text-sm md:text-right">
            {siteConfig.footerSupportItems?.map(item => (
              <p key={item.id}>
                <span className="font-semibold text-slate-300">{item.label}</span>：{item.value}
              </p>
            ))}
            {(!siteConfig.footerSupportItems || siteConfig.footerSupportItems.length === 0) && (
              <p className="italic text-slate-600">暂未配置联系方式</p>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center">
        <p className="text-xs font-medium tracking-wide opacity-50">{siteConfig.footerCopyright}</p>
        {siteConfig.footerIcp && <p className="mt-1 text-[10px] opacity-30">{siteConfig.footerIcp}</p>}
      </div>
    </footer>
  );
};

export default Footer;
