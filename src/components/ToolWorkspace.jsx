import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  CloudUpload, 
  FileText, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  Download, 
  Check, 
  AlertCircle, 
  Loader2, 
  Zap, 
  Sparkles,
  RefreshCw,
  Sliders,
  Plus,
  ArrowUpDown,
  RotateCw,
  Info,
  ArrowRight
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
  organizePDFPages,
  compressPDF, 
  downloadBlob 
} from '../utils/pdfEngine';
import { saveFileToVault } from '../utils/fileVault';
import { trackToolUsage } from '../utils/analytics';
import { generatePdfThumbnail } from '../utils/pdfThumbnail';

export default function ToolWorkspace({ tool, onBack, onSelectOtherTool }) {
  const [files, setFiles] = useState([]);
  const [thumbnails, setThumbnails] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  
  // Custom tool options state
  const [splitRange, setSplitRange] = useState('');
  const [pageOrderStr, setPageOrderStr] = useState('');
  const [rotateAngle, setRotateAngle] = useState(0);
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

  // Generate real PDF first-page thumbnails
  useEffect(() => {
    let isMounted = true;
    files.forEach(async (file, idx) => {
      const key = `${file.name}_${file.size}_${file.lastModified}`;
      if (!thumbnails[key]) {
        try {
          const thumb = await generatePdfThumbnail(file);
          if (thumb && isMounted) {
            setThumbnails(prev => ({ ...prev, [key]: thumb }));
          }
        } catch (e) {}
      }
    });
    return () => { isMounted = false; };
  }, [files]);

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

  // Sort files A-Z or Z-A
  const toggleSort = () => {
    const sorted = [...files].sort((a, b) => {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });
    setSortAsc(!sortAsc);
    setFiles(sorted);
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
        case 'reorder-pages':
          res = await organizePDFPages(files[0], { pageOrderStr, deletePagesStr, rotationAngle: rotateAngle });
          break;
        case 'rotate':
        case 'crop-pdf':
        case 'scan-to-pdf':
        case 'edit-pdf':
          res = await rotatePDF(files[0], rotateAngle || 90);
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
        const finalSize = res.size || res.newSize || fileBlob?.size || 0;

        // Track Analytics
        trackToolUsage(tool.id, tool.name, finalSize);

        if (fileBlob) {
          saveFileToVault({
            fileName: res.filename,
            toolId: tool.id,
            toolName: tool.name,
            blob: fileBlob,
            fileSize: finalSize
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
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Hidden file input */}
      <input 
        type="file"
        ref={fileInputRef}
        accept={tool.accept}
        multiple={tool.multiple}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 mb-6">
        <div className="flex items-center gap-2">
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

        {files.length > 0 && !result && (
          <button 
            onClick={() => setFiles([])}
            className="text-xs text-rose-600 hover:underline font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Workspace
          </button>
        )}
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

      {/* ======================================================== */}
      {/* CASE 1: NO FILES UPLOADED YET (HERO UPLOAD ZONE)         */}
      {/* ======================================================== */}
      {!result && files.length === 0 && (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Tool Header */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-['Outfit'] mb-2">
              {tool.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              {tool.desc}
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 sm:p-20 text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
              isDragging 
                ? 'border-purple-600 bg-purple-100/60 scale-[1.01]' 
                : 'border-purple-300 hover:border-purple-500 bg-gradient-to-b from-purple-50/60 to-white shadow-sm hover:shadow-xl'
            }`}
          >
            <div className="w-20 h-20 rounded-3xl bg-purple-700 text-white mx-auto flex items-center justify-center shadow-xl shadow-purple-600/30 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <CloudUpload className="w-10 h-10 text-amber-300" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 font-['Outfit']">
              Select files or drop them here
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-8">
              Accepted formats: <span className="font-mono font-semibold text-purple-700">{tool.accept.replace(/application\/[^,]+/g, '').replace(/,/g, ' ')}</span> (Max 100MB)
            </p>

            <button 
              type="button"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-purple-950 font-black text-sm sm:text-base shadow-xl shadow-amber-400/30 transition-all group-hover:scale-105"
            >
              Choose {tool.multiple ? 'Files' : 'File'}
            </button>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* CASE 2: FILES UPLOADED (iLovePDF 2-COLUMN STUDIO VIEW)    */}
      {/* ======================================================== */}
      {!result && files.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
          
          {/* 1. LEFT / CENTER: DOCUMENT CARDS CANVAS (8 COLUMNS) */}
          <div className="lg:col-span-8 bg-slate-100/70 border border-slate-200 rounded-3xl p-6 sm:p-8 min-h-[480px] relative flex flex-col justify-between">
            
            {/* Visual Document Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-5">
              {files.map((file, idx) => {
                const thumbKey = `${file.name}_${file.size}_${file.lastModified}`;
                const thumbUrl = thumbnails[thumbKey];

                return (
                  <div 
                    key={idx}
                    className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col"
                  >
                    {/* Index Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-lg bg-purple-900/80 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {idx + 1}
                    </div>

                    {/* Card Hover Action Controls */}
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      {tool.multiple && (
                        <>
                          <button
                            type="button"
                            onClick={() => moveFile(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded-md bg-white/90 hover:bg-slate-100 text-slate-700 shadow-sm disabled:opacity-30"
                            title="Move Left"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFile(idx, 1)}
                            disabled={idx === files.length - 1}
                            className="p-1 rounded-md bg-white/90 hover:bg-slate-100 text-slate-700 shadow-sm disabled:opacity-30"
                            title="Move Right"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1 rounded-md bg-white/90 hover:bg-rose-50 text-rose-600 shadow-sm"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Document Preview Canvas / Thumbnail */}
                    <div className="w-full h-52 sm:h-56 bg-slate-50 flex items-center justify-center p-3 overflow-hidden border-b border-slate-100">
                      {thumbUrl ? (
                        <img 
                          src={thumbUrl} 
                          alt="PDF Preview" 
                          className="max-h-full max-w-full object-contain rounded-md shadow-xs" 
                        />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-white border border-slate-200 p-4 flex flex-col justify-between shadow-xs">
                          <div className="space-y-2">
                            <div className="h-2 w-3/4 bg-slate-200 rounded"></div>
                            <div className="h-1.5 w-full bg-slate-100 rounded"></div>
                            <div className="h-1.5 w-5/6 bg-slate-100 rounded"></div>
                            <div className="h-1.5 w-2/3 bg-slate-100 rounded"></div>
                          </div>
                          <div className="flex items-center justify-center">
                            <FileText className="w-10 h-10 text-rose-500" />
                          </div>
                          <div className="h-1.5 w-1/2 bg-slate-100 rounded self-center"></div>
                        </div>
                      )}
                    </div>

                    {/* File Meta Info */}
                    <div className="p-3 bg-white">
                      <div className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatSize(file.size)}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Floating Action Cluster: Add More (+) & A-Z Sort Buttons */}
            {tool.multiple && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
                {/* Red Circular + Button with Count Badge */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                    title="Add more files"
                  >
                    <Plus className="w-6 h-6 stroke-[3]" />
                  </button>
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center border border-white">
                    {files.length}
                  </span>
                </div>

                {/* Sort A-Z Button */}
                <button
                  type="button"
                  onClick={toggleSort}
                  className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-slate-700 shadow-md border border-slate-200 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                  title="Sort files by name"
                >
                  <ArrowUpDown className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            )}

          </div>

          {/* 2. RIGHT SIDEBAR: TOOL CONTROLS & MAIN ACTION (4 COLUMNS) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-lg flex flex-col justify-between space-y-6">
            
            <div className="space-y-5">
              {/* Tool Title */}
              <div>
                <h2 className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight">
                  {tool.name}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {tool.desc}
                </p>
              </div>

              {/* Informational Hint Notice */}
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {tool.multiple 
                    ? 'To change the order of your documents, use the arrow buttons or sort alphabetically.'
                    : 'Configure parameters below and click the action button to process.'
                  }
                </span>
              </div>

              {/* DYNAMIC PARAMETERS IF APPLICABLE */}
              {['split', 'extract-pages'].includes(tool.id) && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Page Range to Extract:
                  </label>
                  <input 
                    type="text"
                    value={splitRange}
                    onChange={(e) => setSplitRange(e.target.value)}
                    placeholder="e.g. 1-3, 5, 8-10"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-purple-600"
                  />
                </div>
              )}

              {tool.id === 'reorder-pages' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New Page Order Sequence:
                    </label>
                    <input 
                      type="text"
                      value={pageOrderStr}
                      onChange={(e) => setPageOrderStr(e.target.value)}
                      placeholder="e.g. 2, 1, 4, 3, 5"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pages to Delete (Optional):
                    </label>
                    <input 
                      type="text"
                      value={deletePagesStr}
                      onChange={(e) => setDeletePagesStr(e.target.value)}
                      placeholder="e.g. 2, 4-6"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              )}

              {['rotate', 'crop-pdf'].includes(tool.id) && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Rotation Angle:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { angle: 90, label: '90° CW' },
                      { angle: 180, label: '180° Flip' },
                      { angle: 270, label: '270° CCW' },
                    ].map(opt => (
                      <button
                        key={opt.angle}
                        type="button"
                        onClick={() => setRotateAngle(opt.angle)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                          rotateAngle === opt.angle 
                            ? 'bg-purple-700 text-white border-purple-700 shadow-sm' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {['page-numbers', 'header-footer'].includes(tool.id) && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Number Placement:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'bottom-center', label: 'Bottom Center' },
                      { id: 'bottom-right', label: 'Bottom Right' },
                      { id: 'top-right', label: 'Top Right' },
                    ].map(pos => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setPageNumberPos(pos.id)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                          pageNumberPos === pos.id 
                            ? 'bg-purple-700 text-white border-purple-700 shadow-sm' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tool.id === 'watermark-pdf' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Watermark Text:
                    </label>
                    <input 
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="CONFIDENTIAL"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
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

              {['compress', 'repair-pdf', 'ocr-pdf'].includes(tool.id) && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Compression Quality:
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'low', name: 'Low Compression', desc: 'High quality, ~15% smaller' },
                      { id: 'recommended', name: 'Recommended', desc: 'Good quality, ~35% smaller' },
                      { id: 'extreme', name: 'Extreme', desc: 'Max compression, ~55% smaller' },
                    ].map(lvl => (
                      <div
                        key={lvl.id}
                        onClick={() => setCompressLevel(lvl.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          compressLevel === lvl.id 
                            ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-xs' 
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold">{lvl.name}</div>
                        <div className="text-[10px] text-slate-500">{lvl.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {['protect-pdf', 'unlock-pdf'].includes(tool.id) && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Password:
                  </label>
                  <input 
                    type="password"
                    value={protectPassword}
                    onChange={(e) => setProtectPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-purple-600"
                  />
                </div>
              )}

            </div>

            {/* BIG RED / AMBER PRIMARY ACTION CTA BUTTON */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={processTool}
                disabled={processing}
                className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-base sm:text-lg shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <span>{tool.actionLabel}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-400">
                🔒 In-Browser SSL Processing • Encrypted 7-Day Vault
              </p>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* CASE 3: DOWNLOAD & SUCCESS SCREEN                        */}
      {/* ======================================================== */}
      {result && (
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-emerald-200 shadow-2xl text-center max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
          
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-6">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 font-['Outfit']">
            Your document is ready!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-8">
            Processed with 100% precision in I HATE PDF Studio.
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
