
import React from 'react';
import { useStore } from '../store';

const Footer: React.FC = () => {
  const { siteConfig } = useStore();

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-white font-bold text-lg mb-4">{siteConfig.footerBrandName}</h3>
          <p className="text-sm leading-relaxed max-w-sm">
            {siteConfig.footerDescription}
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">快速链接</h4>
          <ul className="space-y-2 text-sm">
            {siteConfig.footerLinks && siteConfig.footerLinks.map(link => (
              <li key={link.id}>
                <a href={link.url} className="hover:text-emerald-400 transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
            {(!siteConfig.footerLinks || siteConfig.footerLinks.length === 0) && (
              <li className="text-slate-600 italic">暂无链接</li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">联系我们</h4>
          <p className="text-sm">系统支持：{siteConfig.footerContactEmail}</p>
          <p className="text-sm mt-2">紧急求助：{siteConfig.footerContactPhone}</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center text-xs">
        <p>© {new Date().getFullYear()} {siteConfig.footerBrandName}. All Rights Reserved. 京ICP备XXXXXXXX号</p>
      </div>
    </footer>
  );
};

export default Footer;
