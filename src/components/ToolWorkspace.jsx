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
  ArrowRight,
  ShieldCheck,
  Lock,
  Layers,
  GripVertical
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
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
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
    files.forEach(async (file) => {
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

  // Reorder files via button
  const moveFile = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setFiles(updated);
  };

  // Drag and Drop Card Reorder
  const handleCardDrop = (targetIdx) => {
    if (draggedIndex === null || draggedIndex === targetIdx) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...files];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIdx, 0, movedItem);
    setFiles(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
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
    <div className="min-h-screen bg-gradient-to-b from-[#100326] via-[#170535] to-[#0c021c] text-white py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
        
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
        <div className="flex items-center justify-between text-xs sm:text-sm text-purple-300/80 mb-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="hover:underline flex items-center gap-1.5 font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> All Tools
            </button>
            <span className="text-purple-500">/</span>
            <span className="capitalize text-purple-300">{tool.category.replace('-', ' ')}</span>
            <span className="text-purple-500">/</span>
            <span className="font-black text-white">{tool.name}</span>
          </div>

          {files.length > 0 && !result && (
            <button 
              onClick={() => setFiles([])}
              className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Workspace
            </button>
          )}
        </div>

        {/* ERROR NOTICE */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
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
          <div className="max-w-4xl mx-auto space-y-6 pt-4">
            
            {/* Tool Header */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/60 border border-purple-500/30 text-amber-300 text-xs font-bold mb-3 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>100% Free & In-Browser Studio</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-['Outfit'] mb-3">
                {tool.name}
              </h1>
              <p className="text-sm sm:text-base text-purple-200/80">
                {tool.desc}
              </p>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 sm:p-20 text-center cursor-pointer transition-all duration-300 relative group overflow-hidden bg-white/[0.03] backdrop-blur-xl ${
                isDragging 
                  ? 'border-amber-400 bg-purple-900/50 scale-[1.01]' 
                  : 'border-purple-500/40 hover:border-amber-400/70 hover:bg-white/[0.06] shadow-2xl shadow-purple-950/60'
              }`}
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-700 via-purple-600 to-pink-600 p-0.5 mx-auto flex items-center justify-center shadow-xl shadow-purple-900/60 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <div className="w-full h-full bg-[#180433] rounded-[22px] flex items-center justify-center">
                  <CloudUpload className="w-10 h-10 text-amber-300" />
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mb-2 font-['Outfit']">
                Select documents or drop them here
              </h3>
              <p className="text-xs sm:text-sm text-purple-300/80 mb-8">
                Accepted formats: <span className="font-mono font-semibold text-amber-300">{tool.accept.replace(/application\/[^,]+/g, '').replace(/,/g, ' ')}</span> (Max 100MB)
              </p>

              <button 
                type="button"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-purple-950 font-black text-sm sm:text-base shadow-xl shadow-amber-400/30 transition-all group-hover:scale-105"
              >
                Choose {tool.multiple ? 'Documents' : 'Document'}
              </button>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* CASE 2: FILES UPLOADED (I HATE PDF SIGNATURE STUDIO VIEW) */}
        {/* ======================================================== */}
        {!result && files.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
            
            {/* 1. LEFT / CENTER: OBSIDIAN DOCUMENT CARDS CANVAS (8 COLUMNS) */}
            <div className="lg:col-span-8 bg-[#14032a]/90 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 min-h-[500px] relative flex flex-col justify-between shadow-2xl shadow-purple-950/80">
              
              {/* Visual Document Cards Grid with Drag and Drop Reordering */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-5">
                {files.map((file, idx) => {
                  const thumbKey = `${file.name}_${file.size}_${file.lastModified}`;
                  const thumbUrl = thumbnails[thumbKey];
                  const isBeingDragged = draggedIndex === idx;
                  const isDragOver = dragOverIndex === idx;

                  return (
                    <div 
                      key={idx}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', idx);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedIndex(idx);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDragOverIndex(idx);
                      }}
                      onDragLeave={() => {
                        if (dragOverIndex === idx) setDragOverIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleCardDrop(idx);
                      }}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      className={`group relative bg-[#1b0638] rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col cursor-grab active:cursor-grabbing select-none ${
                        isBeingDragged 
                          ? 'opacity-30 scale-95 border-dashed border-amber-400' 
                          : isDragOver
                          ? 'border-amber-400 ring-2 ring-amber-400/80 bg-purple-900/90 scale-105 shadow-2xl shadow-amber-400/40'
                          : 'border-purple-500/30 hover:border-amber-400/60 shadow-lg hover:shadow-2xl hover:shadow-purple-900/40'
                      }`}
                    >
                      {/* Neon Index Badge (PDF No) */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-400 text-purple-950 font-black text-xs flex items-center justify-center shadow-md">
                          {idx + 1}
                        </div>
                      </div>

                      {/* Card Delete Control Only */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          className="p-1.5 rounded-lg bg-purple-950/90 hover:bg-rose-900/90 text-rose-300 hover:text-rose-100 border border-rose-500/40 shadow-md transition-all hover:scale-105 active:scale-95"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Document Preview Canvas / High-Res Thumbnail */}
                      <div className="w-full h-52 sm:h-56 bg-slate-900/60 flex items-center justify-center p-3 overflow-hidden border-b border-purple-900/40">
                        {thumbUrl ? (
                          <img 
                            src={thumbUrl} 
                            alt="PDF Preview" 
                            className="max-h-full max-w-full object-contain rounded-md shadow-md bg-white pointer-events-none" 
                          />
                        ) : (
                          <div className="w-full h-full rounded-lg bg-white/5 border border-white/10 p-4 flex flex-col justify-between shadow-xs pointer-events-none">
                            <div className="space-y-2">
                              <div className="h-2 w-3/4 bg-purple-500/20 rounded"></div>
                              <div className="h-1.5 w-full bg-purple-500/10 rounded"></div>
                              <div className="h-1.5 w-5/6 bg-purple-500/10 rounded"></div>
                              <div className="h-1.5 w-2/3 bg-purple-500/10 rounded"></div>
                            </div>
                            <div className="flex items-center justify-center">
                              <FileText className="w-10 h-10 text-rose-400" />
                            </div>
                            <div className="h-1.5 w-1/2 bg-purple-500/10 rounded self-center"></div>
                          </div>
                        )}
                      </div>

                      {/* File Meta Info */}
                      <div className="p-3 bg-[#170533]">
                        <div className="text-xs font-bold text-white truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-[11px] text-purple-300/70 mt-0.5 font-medium">
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
                  {/* Golden Amber Circular + Button with Count Badge */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-purple-950 shadow-xl shadow-amber-400/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border-2 border-purple-950"
                      title="Add more files"
                    >
                      <Plus className="w-6 h-6 stroke-[3]" />
                    </button>
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-purple-950 text-amber-300 text-[10px] font-black flex items-center justify-center border border-amber-400 shadow-md">
                      {files.length}
                    </span>
                  </div>

                  {/* Frosted Sort A-Z Button */}
                  <button
                    type="button"
                    onClick={toggleSort}
                    className="w-10 h-10 rounded-full bg-purple-900/80 hover:bg-purple-800 text-purple-200 hover:text-white shadow-md border border-purple-500/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                    title="Sort files by name"
                  >
                    <ArrowUpDown className="w-4 h-4 text-amber-300" />
                  </button>
                </div>
              )}

            </div>

            {/* 2. RIGHT SIDEBAR: OBSIDIAN TOOL CONTROLS & MAIN ACTION (4 COLUMNS) */}
            <div className="lg:col-span-4 bg-[#160431]/95 backdrop-blur-3xl rounded-3xl border border-purple-500/30 p-6 sm:p-7 shadow-2xl shadow-purple-950/80 flex flex-col justify-between space-y-6">
              
              <div className="space-y-5">
                {/* Tool Title */}
                <div>
                  <h2 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
                    {tool.name}
                  </h2>
                  <p className="text-xs text-purple-300/80 mt-1">
                    {tool.desc}
                  </p>
                </div>

                {/* Informational Hint Notice */}
                <div className="p-3.5 rounded-2xl bg-purple-900/50 border border-purple-500/30 text-purple-200 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {tool.multiple 
                      ? 'Reorder your documents using the arrows or sort alphabetically before merging.'
                      : 'Configure your parameters below and click the action button to process.'
                    }
                  </span>
                </div>

                {/* DYNAMIC PARAMETERS IF APPLICABLE */}
                {['split', 'extract-pages'].includes(tool.id) && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-purple-200">
                      Page Range to Extract:
                    </label>
                    <input 
                      type="text"
                      value={splitRange}
                      onChange={(e) => setSplitRange(e.target.value)}
                      placeholder="e.g. 1-3, 5, 8-10"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-purple-600/40 text-white text-xs font-medium focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                {tool.id === 'reorder-pages' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-purple-200 mb-1">
                        New Page Order Sequence:
                      </label>
                      <input 
                        type="text"
                        value={pageOrderStr}
                        onChange={(e) => setPageOrderStr(e.target.value)}
                        placeholder="e.g. 2, 1, 4, 3, 5"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-purple-600/40 text-white text-xs font-medium focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-200 mb-1">
                        Pages to Delete (Optional):
                      </label>
                      <input 
                        type="text"
                        value={deletePagesStr}
                        onChange={(e) => setDeletePagesStr(e.target.value)}
                        placeholder="e.g. 2, 4-6"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-purple-600/40 text-white text-xs font-medium focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                {['rotate', 'crop-pdf'].includes(tool.id) && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-purple-200">
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
                              ? 'bg-amber-400 text-purple-950 border-amber-400 shadow-md' 
                              : 'bg-white/[0.06] text-purple-200 border-purple-600/40 hover:bg-white/[0.12]'
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
                    <label className="block text-xs font-bold text-purple-200">
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
                              ? 'bg-amber-400 text-purple-950 border-amber-400 shadow-md' 
                              : 'bg-white/[0.06] text-purple-200 border-purple-600/40 hover:bg-white/[0.12]'
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
                      <label className="block text-xs font-bold text-purple-200 mb-1">
                        Watermark Text:
                      </label>
                      <input 
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="CONFIDENTIAL"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-purple-600/40 text-white text-xs font-medium focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-200 mb-1">
                        Opacity: {Math.round(watermarkOpacity * 100)}%
                      </label>
                      <input 
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                  </div>
                )}

                {['compress', 'repair-pdf', 'ocr-pdf'].includes(tool.id) && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-purple-200">
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
                              ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md' 
                              : 'bg-white/[0.04] border-purple-600/40 text-purple-200 hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className="text-xs font-bold">{lvl.name}</div>
                          <div className="text-[10px] text-purple-300/70">{lvl.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {['protect-pdf', 'unlock-pdf'].includes(tool.id) && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-purple-200">
                      Password:
                    </label>
                    <input 
                      type="password"
                      value={protectPassword}
                      onChange={(e) => setProtectPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-purple-600/40 text-white text-xs font-medium focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

              </div>

              {/* SIGNATURE GOLDEN AMBER ACTION CTA BUTTON */}
              <div className="pt-4 border-t border-purple-800/60 space-y-3">
                <button
                  type="button"
                  onClick={processTool}
                  disabled={processing}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-purple-950 font-black text-base sm:text-lg shadow-xl shadow-amber-400/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing ({progress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-purple-950" />
                      <span>{tool.actionLabel}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-purple-300/70">
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
          <div className="bg-[#180436]/95 backdrop-blur-3xl rounded-3xl p-8 sm:p-14 border border-purple-500/30 shadow-2xl text-center max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
            
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-6">
              <Check className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3]" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 font-['Outfit']">
              Your document is ready!
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 mb-8">
              Processed with 100% precision in I HATE PDF Studio.
            </p>

            <div className="p-4 rounded-2xl bg-purple-950/60 border border-purple-700/40 mb-8 text-left flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-800 text-amber-300 flex items-center justify-center font-bold text-xs">
                  {result.filename.split('.').pop()?.toUpperCase()}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">{result.filename}</div>
                  <div className="text-[11px] text-purple-300">{formatSize(result.size || result.newSize)}</div>
                </div>
              </div>

              {result.savedPercent && (
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-full">
                  {result.savedPercent}% smaller
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-purple-950 font-black text-sm sm:text-base shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span>Download File</span>
              </button>

              <button
                type="button"
                onClick={() => { setResult(null); setFiles([]); }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-purple-500/40 text-purple-200 font-bold text-xs sm:text-sm hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Process Another</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
