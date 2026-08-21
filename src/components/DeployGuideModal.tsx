import React, { useState } from 'react';
import {
  X,
  Rocket,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Github,
  Globe,
  Layers,
  Terminal
} from 'lucide-react';

interface DeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activePlatform, setActivePlatform] = useState<'vercel' | 'netlify'>('vercel');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const vercelBuildSettings = `Build Command: npm run build
Output Directory: dist
Install Command: npm install`;

  const netlifyRedirectRule = `/*    /index.html   200`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Deploy to Vercel or Netlify
              </h2>
              <p className="text-xs text-slate-400">
                1-Click deployment guide for production PWA hosting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Platform Tabs */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActivePlatform('vercel')}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                activePlatform === 'vercel'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 22.525H0l12-21.05 12 21.05z" />
              </svg>
              <span>Vercel Deployment</span>
            </button>
            <button
              onClick={() => setActivePlatform('netlify')}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                activePlatform === 'netlify'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Netlify Deployment</span>
            </button>
          </div>

          {activePlatform === 'vercel' ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">1</span>
                  <span>Export Code & Push to GitHub</span>
                </div>
                <p className="text-slate-400 pl-7">
                  Click the <strong>Settings / Export</strong> menu in AI Studio or download ZIP, then push your repository to GitHub.
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">2</span>
                  <span>Import Project in Vercel</span>
                </div>
                <p className="text-slate-400 pl-7">
                  Go to <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-semibold">vercel.com/new</a>, connect your GitHub account, and select this repository. Vercel automatically detects Vite!
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between pl-7">
                  <span className="font-bold text-indigo-300">Recommended Vercel Build Settings:</span>
                  <button
                    onClick={() => handleCopy(vercelBuildSettings)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 ml-7">
                  {vercelBuildSettings}
                </pre>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-emerald-200 space-y-1.5">
                <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Custom Firebase Project Setup (Vercel Environment Variables):</span>
                </p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  To connect your own Firebase project on Vercel, add these in <strong>Vercel &gt; Settings &gt; Environment Variables</strong>, then trigger a <strong>Redeploy</strong>:
                </p>
                <pre className="bg-slate-900 p-2 rounded border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto">
{`VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:...`}
                </pre>
                <p className="text-[10px] text-emerald-400">
                  Note: In your Firebase Console, make sure to add <code>finmob-phi.vercel.app</code> under <strong>Authentication &gt; Settings &gt; Authorized domains</strong> of that exact project.
                </p>
              </div>

              <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-indigo-200">
                <p className="font-semibold">⚡ PWA Ready:</p>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Vercel serves over HTTPS by default, enabling instant PWA installation ("Add to Home Screen") on smartphones and desktops.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">1</span>
                  <span>Connect GitHub to Netlify</span>
                </div>
                <p className="text-slate-400 pl-7">
                  Go to <a href="https://app.netlify.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">app.netlify.com</a> and click <strong>Add new site &gt; Import an existing project</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">2</span>
                  <span>Build Command & Publish Directory</span>
                </div>
                <p className="text-slate-400 pl-7">
                  Set <strong>Build Command</strong> to <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300 font-mono">npm run build</code> and <strong>Publish directory</strong> to <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300 font-mono">dist</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between pl-7">
                  <span className="font-bold text-cyan-300">Netlify SPA Redirects (_redirects):</span>
                  <button
                    onClick={() => handleCopy(netlifyRedirectRule)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 ml-7">
                  {netlifyRedirectRule}
                </pre>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-cyan-200">
                <p className="font-semibold">🌐 Real-time Firebase Sync:</p>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  The embedded Firebase config works automatically on Netlify, ensuring seamless real-time data sync across all your devices.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
