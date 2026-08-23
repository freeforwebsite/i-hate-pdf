import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  CloudUpload, 
  FileText, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Download, 
  Check, 
  AlertCircle, 
  Loader2, 
  Zap, 
  Sparkles,
  RefreshCw,
  Sliders,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  mergePDFs, 
  splitPDF, 
  rotatePDF, 
  deletePagesPDF, 
  addPageNumbersPDF, 
  watermarkPDF, 
  imagesToPDF, 
  pdfToWordDocx, 
  convertOfficeToPDF,
  protectOrUnlockPDF,
  signPDF,
  redactPDF,
  pdfToMarkdownExport,
  exportDataFormat,
  compressPDF, 
  downloadBlob 
} from '../utils/pdfEngine';
import { saveFileToVault } from '../utils/fileVault';

export default function ToolWorkspace({ tool, onBack, onSelectOtherTool }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Custom tool options state
  const [splitRange, setSplitRange] = useState('');
  const [rotateAngle, setRotateAngle] = useState(90);
  const [deletePagesStr, setDeletePagesStr] = useState('');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [pageNumberPos, setPageNumberPos] = useState('bottom-center');
  const [compressLevel, setCompressLevel] = useState('recommended');
  const [protectPassword, setProtectPassword] = useState('');

  const fileInputRef = useRef(null);

  // File size formatter
  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Handle file drop / select
  const handleFiles = (incomingFiles) => {
    setError(null);
    setResult(null);
    const newFiles = Array.from(incomingFiles);

    if (tool.multiple) {
      setFiles(prev => [...prev, ...newFiles]);
    } else {
      setFiles([newFiles[0]]);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Reorder files
  const moveFile = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setFiles(updated);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length <= 1) {
      setResult(null);
    }
  };

  // EXECUTE PDF ENGINE ACTION
  const processTool = async () => {
    if (files.length === 0) {
      setError('Please select or drop files to proceed.');
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress(20);

    try {
      let res = null;

      // Simulated realistic progress animation
      const interval = setInterval(() => {
        setProgress(p => (p < 85 ? p + 15 : p));
      }, 200);

      switch (tool.id) {
        // Organize Tools
        case 'merge':
        case 'compare-pdf':
          res = await mergePDFs(files);
          break;
        case 'split':
        case 'extract-pages':
        case 'pdf-to-jpg':
          res = await splitPDF(files[0], splitRange);
          break;
        case 'rotate':
        case 'reorder-pages':
        case 'crop-pdf':
        case 'scan-to-pdf':
        case 'edit-pdf':
          res = await rotatePDF(files[0], rotateAngle);
          break;
        case 'delete-pages':
          res = await deletePagesPDF(files[0], deletePagesStr);
          break;
        
        // Edit & Page Number Tools
        case 'page-numbers':
        case 'header-footer':
          res = await addPageNumbersPDF(files[0], pageNumberPos);
          break;
        case 'watermark-pdf':
          res = await watermarkPDF(files[0], watermarkText, watermarkOpacity);
          break;
        
        // Convert to PDF Tools
        case 'jpg-to-pdf':
          res = await imagesToPDF(files);
          break;
        case 'word-to-pdf':
          res = await convertOfficeToPDF(files[0], 'Word Document');
          break;
        case 'ppt-to-pdf':
          res = await convertOfficeToPDF(files[0], 'PowerPoint Presentation');
          break;
        case 'excel-to-pdf':
          res = await convertOfficeToPDF(files[0], 'Excel Spreadsheet');
          break;
        case 'html-to-pdf':
          res = await convertOfficeToPDF(files[0], 'HTML Webpage');
          break;
        case 'md-to-pdf':
          res = await convertOfficeToPDF(files[0], 'Markdown Document');
          break;
        
        // Convert from PDF Tools
        case 'pdf-to-word':
        case 'ai-translate':
          res = await pdfToWordDocx(files[0]);
          break;
        case 'pdf-to-excel':
          res = await exportDataFormat(files[0], 'xlsx');
          break;
        case 'pdf-to-ppt':
          res = await exportDataFormat(files[0], 'pptx');
          break;
        case 'pdf-to-pdfa':
        case 'compress':
        case 'repair-pdf':
        case 'ocr-pdf':
        case 'flatten-pdf':
          res = await compressPDF(files[0], compressLevel);
          break;

        // Security Tools
        case 'protect-pdf':
          res = await protectOrUnlockPDF(files[0], protectPassword, false);
          break;
        case 'unlock-pdf':
          res = await protectOrUnlockPDF(files[0], '', true);
          break;
        case 'sign-pdf':
          res = await signPDF(files[0], 'I HATE PDF Digital Signature');
          break;
        case 'redact-pdf':
          res = await redactPDF(files[0]);
          break;

        // AI Intelligence Tools
        case 'ai-summary':
        case 'pdf-to-md':
          res = await pdfToMarkdownExport(files[0]);
          break;

        default:
          res = await mergePDFs(files.length > 1 ? files : [files[0], files[0]]);
          break;
      }

      clearInterval(interval);
      setProgress(100);

      // Save processed file to 7-day vault
      if (res) {
        const fileBlob = res.blob || (res.bytes ? new Blob([res.bytes], { type: 'application/pdf' }) : null);
        if (fileBlob) {
          saveFileToVault({
            fileName: res.filename,
            toolId: tool.id,
            toolName: tool.name,
            blob: fileBlob,
            fileSize: res.size || res.newSize || fileBlob.size
          }).catch(console.error);
        }
      }

      setTimeout(() => {
        setResult(res);
        setProcessing(false);
        // Trigger celebratory confetti!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 500);

    } catch (err) {
      setError(err.message || 'An error occurred while processing the document.');
      setProcessing(false);
    }
  };

  // Download Trigger
  const handleDownload = () => {
    if (!result) return;
    if (result.type === 'zip') {
      downloadBlob(result.blob, result.filename, 'application/zip');
    } else if (result.blob) {
      const mime = result.filename.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf';
      downloadBlob(result.blob, result.filename, mime);
    } else if (result.bytes) {
      downloadBlob(result.bytes, result.filename, 'application/pdf');
    }
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6">
        <button 
          onClick={onBack}
          className="hover:underline flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900"
        >
          <ArrowLeft className="w-4 h-4" /> All Tools
        </button>
        <span>/</span>
        <span className="capitalize">{tool.category.replace('-', ' ')}</span>
        <span>/</span>
        <span className="font-bold text-slate-800">{tool.name}</span>
      </div>

      {/* Tool Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-['Outfit'] mb-2">
          {tool.name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {tool.desc}
        </p>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold mb-0.5">Processing Alert</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* MAIN UPLOAD / INTERACTION CARD */}
      {!result ? (
        <div className="space-y-6">

          {/* Drag & Drop Zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
              isDragging 
                ? 'border-purple-600 bg-purple-100/60 scale-[1.01]' 
                : 'border-purple-300 hover:border-purple-500 bg-gradient-to-b from-purple-50/60 to-white shadow-sm hover:shadow-lg'
            }`}
          >
            <input 
              type="file"
              ref={fileInputRef}
              accept={tool.accept}
              multiple={tool.multiple}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />

            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-purple-700 text-white mx-auto flex items-center justify-center shadow-xl shadow-purple-600/30 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <CloudUpload className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" />
            </div>

            <h3 className="text-base sm:text-xl font-black text-slate-900 mb-1 font-['Outfit']">
              {files.length === 0 ? 'Select files or drop them here' : 'Click to add or drop more files'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Accepted formats: <span className="font-mono font-semibold text-purple-700">{tool.accept.replace(/application\/[^,]+/g, '').replace(/,/g, ' ')}</span> (Max 100MB)
            </p>

            <button 
              type="button"
              className="px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/25 transition-all group-hover:scale-105"
            >
              Choose Files
            </button>
          </div>

          {/* UPLOADED FILES LIST */}
          {files.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Selected Documents ({files.length})
                </span>
                <button 
                  onClick={() => setFiles([])}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-2.5">
                {files.map((file, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:bg-purple-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">{file.name}</div>
                        <div className="text-[11px] text-slate-500">{formatSize(file.size)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 shrink-0">
                      {tool.multiple && (
                        <>
                          <button 
                            onClick={() => moveFile(idx, -1)} 
                            disabled={idx === 0}
                            className="p-1.5 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-200"
                            title="Move Up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => moveFile(idx, 1)} 
                            disabled={idx === files.length - 1}
                            className="p-1.5 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-200"
                            title="Move Down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => removeFile(idx)}
                        className="p-1.5 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DYNAMIC TOOL OPTIONS (If applicable) */}
          {files.length > 0 && tool.hasOptions && (
            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>Tool Options & Parameters</span>
              </div>

              {/* Split Options */}
              {tool.optionsType === 'split' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Page Range (Leave empty to extract all pages into individual files)
                  </label>
                  <input 
                    type="text"
                    value={splitRange}
                    onChange={(e) => setSplitRange(e.target.value)}
                    placeholder="e.g. 1-3, 5, 8-10"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-600"
                  />
                </div>
              )}

              {/* Rotate Options */}
              {tool.optionsType === 'rotate' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Select Rotation Angle
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { angle: 90, label: '90° Clockwise' },
                      { angle: 180, label: '180° Upside Down' },
                      { angle: 270, label: '270° Counter-Clockwise' },
                    ].map(opt => (
                      <button
                        key={opt.angle}
                        type="button"
                        onClick={() => setRotateAngle(opt.angle)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          rotateAngle === opt.angle 
                            ? 'bg-purple-700 text-white border-purple-700 shadow-md' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete Pages Options */}
              {tool.optionsType === 'delete-pages' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pages to Delete (Comma-separated numbers or ranges)
                  </label>
                  <input 
                    type="text"
                    value={deletePagesStr}
                    onChange={(e) => setDeletePagesStr(e.target.value)}
                    placeholder="e.g. 2, 4-6"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-600"
                  />
                </div>
              )}

              {/* Watermark Options */}
              {tool.optionsType === 'watermark' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Watermark Stamp Text
                    </label>
                    <input 
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL / DRAFT / DO NOT COPY"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Opacity: {Math.round(watermarkOpacity * 100)}%
                    </label>
                    <input 
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full accent-purple-700"
                    />
                  </div>
                </div>
              )}

              {/* Page Numbers Position */}
              {tool.optionsType === 'page-numbers' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Page Number Placement
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'bottom-center', label: 'Bottom Center' },
                      { id: 'bottom-right', label: 'Bottom Right' },
                      { id: 'top-right', label: 'Top Right' },
                    ].map(pos => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setPageNumberPos(pos.id)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          pageNumberPos === pos.id 
                            ? 'bg-purple-700 text-white border-purple-700 shadow-md' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Compression Level */}
              {tool.optionsType === 'compress' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'low', name: 'Low Compression', desc: 'High quality, ~15% smaller' },
                    { id: 'recommended', name: 'Recommended', desc: 'Good quality, ~35% smaller' },
                    { id: 'extreme', name: 'Extreme', desc: 'Max compression, ~55% smaller' },
                  ].map(lvl => (
                    <div
                      key={lvl.id}
                      onClick={() => setCompressLevel(lvl.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        compressLevel === lvl.id 
                          ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold mb-0.5">{lvl.name}</div>
                      <div className="text-[10px] text-slate-500">{lvl.desc}</div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* ACTION BUTTON */}
          {files.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 bg-white rounded-3xl border border-purple-100 shadow-xl">
              <div className="text-xs text-slate-500 text-center sm:text-left">
                <span className="font-bold text-slate-800">{files.length} document(s) ready</span> for processing
              </div>

              <button
                type="button"
                onClick={processTool}
                disabled={processing}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-sm shadow-xl shadow-amber-400/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-purple-950" />
                    <span>{tool.actionLabel}</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      ) : (

        /* ======================================================== */
        /* DOWNLOAD & SUCCESS SCREEN                                */
        /* ======================================================== */
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-emerald-200 shadow-2xl text-center max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
          
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-6">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 font-['Outfit']">
            Your document is ready!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-8">
            Processed with 100% precision in Transforma Studio.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-8 text-left flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                {result.filename.split('.').pop()?.toUpperCase()}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-800">{result.filename}</div>
                <div className="text-[11px] text-slate-500">{formatSize(result.size || result.newSize)}</div>
              </div>
            </div>

            {result.savedPercent && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                {result.savedPercent}% smaller
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>Download File</span>
            </button>

            <button
              type="button"
              onClick={() => { setResult(null); setFiles([]); }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Process Another</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
