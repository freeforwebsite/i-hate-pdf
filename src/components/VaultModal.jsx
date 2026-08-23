import React, { useState, useEffect } from 'react';
import { 
  History, 
  X, 
  Download, 
  Trash2, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  HardDrive,
  RefreshCw,
  Cloud,
  Settings,
  ExternalLink,
  Check
} from 'lucide-react';
import { getVaultFiles, deleteVaultFile, clearVault, getRemainingTimeString } from '../utils/fileVault';
import { downloadBlob } from '../utils/pdfEngine';
import { isCloudinaryConfigured, setCloudinaryConfig, CLOUDINARY_CONFIG } from '../utils/cloudinary';

export default function VaultModal({ isOpen, onClose, onSelectTool }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCloudSettings, setShowCloudSettings] = useState(false);
  const [cloudName, setCloudName] = useState(CLOUDINARY_CONFIG.cloudName || '');
  const [uploadPreset, setUploadPreset] = useState(CLOUDINARY_CONFIG.uploadPreset || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadFiles = async () => {
    setLoading(true);
    const stored = await getVaultFiles();
    setFiles(stored);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadFiles();
      setCloudName(localStorage.getItem('ihatepdf_cloudinary_name') || '');
      setUploadPreset(localStorage.getItem('ihatepdf_cloudinary_preset') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = (file) => {
    if (file.cloudUrl) {
      window.open(file.cloudUrl, '_blank');
    } else if (file.blob) {
      downloadBlob(file.blob, file.fileName);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await deleteVaultFile(id);
    loadFiles();
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all stored files?')) {
      await clearVault();
      loadFiles();
    }
  };

  const handleSaveCloudinary = (e) => {
    e.preventDefault();
    setCloudinaryConfig(cloudName.trim(), uploadPreset.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowCloudSettings(false);
    }, 1200);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalSize = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);
  const isCloudReady = isCloudinaryConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#180436] border border-purple-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-purple-950 shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black font-['Outfit']">
                  7-Day File Vault
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Auto-Saved 7 Days
                </span>
                {isCloudReady && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Cloud className="w-3 h-3" /> Cloud Active
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-300">
                Documents stay accessible for 7 days even if cache is cleared
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCloudSettings(!showCloudSettings)}
              className="p-2 rounded-xl bg-purple-900/50 hover:bg-purple-800 text-purple-200 hover:text-white transition-colors"
              title="Cloudinary Cloud Storage Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cloudinary Configuration Drawer */}
        {showCloudSettings && (
          <form onSubmit={handleSaveCloudinary} className="my-4 p-4 rounded-2xl bg-purple-900/60 border border-purple-500/40 space-y-3 shrink-0 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Cloud className="w-4 h-4" />
                <span>Cloudinary 7-Day Cloud Persistence</span>
              </div>
              <a 
                href="https://cloudinary.com/users/register_free" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[10px] text-purple-300 hover:underline flex items-center gap-1"
              >
                Get Free Cloudinary API <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-purple-200 font-bold mb-1 uppercase tracking-wider">Cloud Name</label>
                <input 
                  type="text" 
                  value={cloudName}
                  onChange={(e) => setCloudName(e.target.value)}
                  placeholder="e.g. demo" 
                  className="w-full px-3 py-2 rounded-xl bg-purple-950/80 border border-purple-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[10px] text-purple-200 font-bold mb-1 uppercase tracking-wider">Unsigned Upload Preset</label>
                <input 
                  type="text" 
                  value={uploadPreset}
                  onChange={(e) => setUploadPreset(e.target.value)}
                  placeholder="e.g. my_unsigned_preset" 
                  className="w-full px-3 py-2 rounded-xl bg-purple-950/80 border border-purple-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-purple-300">Enables cross-device download links for 7 days.</span>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-purple-950 font-bold text-xs shadow transition-all flex items-center gap-1"
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{savedSuccess ? 'Saved!' : 'Save Credentials'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Stats Bar */}
        <div className="flex items-center justify-between py-3 px-4 my-4 bg-purple-900/40 rounded-2xl border border-purple-700/40 text-xs shrink-0">
          <div className="flex items-center gap-4 text-purple-200">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              {files.length} {files.length === 1 ? 'File' : 'Files'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-bold text-white">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              {formatBytes(totalSize)}
            </span>
          </div>

          {files.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-rose-400 hover:text-rose-300 font-bold transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scroll min-h-[220px]">
          {loading ? (
            <div className="py-16 text-center text-purple-300 text-sm flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>Loading your saved files...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="py-16 text-center text-purple-300 text-sm flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-900/40 flex items-center justify-center text-purple-400 border border-purple-700/40">
                <History className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-white mb-1">No files in your 7-day vault yet</p>
                <p className="text-xs text-purple-400">Any file you edit, merge, split, or convert will be saved here automatically for 7 days.</p>
              </div>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="group p-3.5 rounded-2xl bg-white/[0.04] hover:bg-purple-900/60 border border-purple-500/20 hover:border-purple-400/40 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate max-w-[220px] sm:max-w-[320px]">
                      {file.fileName}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-purple-300 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-purple-900/80 font-bold text-amber-300">{file.toolName}</span>
                      <span>•</span>
                      <span>{formatBytes(file.fileSize)}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {getRemainingTimeString(file.expiresAt)}
                      </span>
                      {file.cloudUrl && (
                        <span className="text-cyan-300 font-bold flex items-center gap-0.5">
                          <Cloud className="w-2.5 h-2.5" /> Cloud
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs shadow-md transition-all flex items-center gap-1"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </button>

                  <button
                    onClick={(e) => handleDelete(file.id, e)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/30 text-purple-300 hover:text-rose-300 transition-colors"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="pt-4 mt-4 border-t border-purple-800/60 flex items-center justify-between text-[11px] text-purple-300 shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Secure • Auto-expiring in 7 days</span>
          </div>
          <span className="text-purple-400">Files automatically clean up after 7 days</span>
        </div>

      </div>
    </div>
  );
}
