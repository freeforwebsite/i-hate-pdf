import React from 'react';
import { Shield, Zap, Lock, Smartphone, RefreshCw, Award } from 'lucide-react';

export default function TrustSection() {
  const features = [
    {
      icon: Shield,
      color: '#e11d48',
      title: 'Zero Document Logging',
      desc: 'Your files are processed in-memory. We never read, index, or store your private document content.'
    },
    {
      icon: Lock,
      color: '#7c3aed',
      title: 'Auto-Deleted in 2 Hours',
      desc: 'All temporary conversion artifacts are permanently purged by automated cron scripts after 120 minutes.'
    },
    {
      icon: Zap,
      color: '#f59e0b',
      title: 'Lightning Client Engine',
      desc: 'Operations like Merge, Split, Rotate, and Numbering happen directly on your CPU with zero upload lag.'
    },
    {
      icon: Smartphone,
      color: '#059669',
      title: 'Mobile-First Responsive',
      desc: 'Optimized touch targets, bottom bar shortcuts, and native file manager picker for Android and iPhone Chrome.'
    },
    {
      icon: RefreshCw,
      color: '#0284c7',
      title: 'High-Fidelity Vector Preserved',
      desc: 'Text remains crystal sharp vector typography. Fonts, formatting, and tables are preserved 1:1.'
    },
    {
      icon: Award,
      color: '#9333ea',
      title: 'ISO PDF/A Compliant',
      desc: 'Exports meet worldwide government, legal, and financial document archiving specifications.'
    }
  ];

  return (
    <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Outfit'] mb-3">
          Engineered for Speed, Privacy & Precision
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Everything built with bank-grade security standards and modern web technologies.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div 
              key={idx}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-5 shadow-md"
                style={{ backgroundColor: feat.color }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 font-['Outfit']">
                {feat.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
