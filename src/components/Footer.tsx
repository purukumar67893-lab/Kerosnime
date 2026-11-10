import React from 'react';
import { ArrowUp, Tv } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-20 border-t border-slate-900 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-600 text-white font-bold text-xs">
                K
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                Kuro<span className="text-rose-500">Anime</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 max-w-md">
              Unlimited anime streaming client connected to GogoAnime (gogoanime.or.at). High-definition multi-server video playback and comprehensive episode directory.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <span className="text-slate-500">Source: gogoanime.or.at</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900/80 text-center text-[11px] text-slate-600">
          Disclaimer: This application does not store any video files on its servers. All contents are provided by non-affiliated third party providers.
        </div>
      </div>
    </footer>
  );
};
