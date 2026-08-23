import React from 'react';
import { FileText, Shield, Heart } from 'lucide-react';
import { ALL_TOOLS_LIST } from '../data/toolsData';

export default function Footer({ onSelectTool, onOpenAnalytics }) {
  const popularTools = ALL_TOOLS_LIST.slice(0, 12);

  return (
    <footer className="bg-[#1e0a42] text-purple-200 text-xs border-t border-purple-800/60 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-purple-800/40">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-purple-950 font-black">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black text-white font-['Outfit']">I HATE PDF</span>
            </div>
            <p className="text-purple-300 leading-relaxed text-[11px]">
              Every tool you need to work with PDFs and Word documents in one place without the frustration. 100% web-based and free.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
              <Shield className="w-4 h-4" />
              <span>256-Bit SSL Encrypted Engine</span>
            </div>
          </div>

          {/* Quick Tools Column 1 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Popular PDF Tools</h4>
            <ul className="space-y-2 text-[11px]">
              {['merge', 'split', 'compress', 'rotate', 'delete-pages', 'page-numbers'].map(id => {
                const t = ALL_TOOLS_LIST.find(x => x.id === id);
                return (
                  <li key={id}>
                    <button 
                      onClick={() => onSelectTool(id)}
                      className="hover:text-amber-400 transition-colors"
                    >
                      {t?.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Convert Tools Column 2 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Conversion Suite</h4>
            <ul className="space-y-2 text-[11px]">
              {['pdf-to-word', 'word-to-pdf', 'pdf-to-excel', 'excel-to-pdf', 'pdf-to-ppt', 'jpg-to-pdf'].map(id => {
                const t = ALL_TOOLS_LIST.find(x => x.id === id);
                return (
                  <li key={id}>
                    <button 
                      onClick={() => onSelectTool(id)}
                      className="hover:text-amber-400 transition-colors"
                    >
                      {t?.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Security & Legal Column 3 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Security & Analytics</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button 
                  onClick={onOpenAnalytics}
                  className="text-amber-300 hover:text-amber-200 font-bold transition-colors flex items-center gap-1.5"
                >
                  <span>📊 Live Site Analytics</span>
                </button>
              </li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">GDPR & Data Protection</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Contact Support</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-purple-300">
          <div>
            © {new Date().getFullYear()} I HATE PDF Studio. 100% Free Document Processing.
          </div>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>for seamless mobile & desktop productivity.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
