import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useApi } from '../hooks/useApi';
import { Upload, FileText, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ImportSystem: React.FC = () => {
  const { setActiveView } = useApp();
  const api = useApi();
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [extractedData, setExtractedData] = useState<any>(null);

  const steps = [
    { label: "Ingested", desc: "Binary upload completed, raw streams stored" },
    { label: "Parsed", desc: "Text structural normalization and chat alignments mapping" },
    { label: "Indexed", desc: "Chunked documents indexed in Chroma vector database" },
    { label: "Visualized", desc: "Decision graphs and timeline entities updated" }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const runUploadPipeline = async () => {
    if (!file) return;
    setUploadState('uploading');
    setCurrentStep(0);
    setErrorMsg('');

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentStep(2);
      // Upload globally (id=0 → backend auto-assigns or global bucket)
      const result = await api.uploadDocument(0, file);
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 600));
      setExtractedData(result);
      setUploadState('done');
    } catch (e: any) {
      setErrorMsg(e.message || 'An error occurred while extracting knowledge.');
      setUploadState('error');
    }
  };

  const resetUploader = () => {
    setFile(null);
    setUploadState('idle');
    setCurrentStep(0);
    setExtractedData(null);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen bg-[#070a10]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Knowledge Ingestion System
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload JSON chat exports, markdown guides, PDF documentation, or text notes to Chronicle's extraction pipeline.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
          <AnimatePresence mode="wait">
            {uploadState === 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Drag zone */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 relative ${
                    dragActive 
                      ? 'border-primary-500 bg-primary-600/5 shadow-glow' 
                      : 'border-darkBorder bg-slate-950/20 hover:border-slate-700'
                  }`}
                >
                  <input 
                    type="file" 
                    id="file-input" 
                    onChange={handleFileChange}
                    accept=".json,.txt,.md,.pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="p-4 bg-primary-600/10 text-primary-400 rounded-2xl">
                      <Upload size={32} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">
                        Drag and drop your file here, or <span className="text-primary-400 hover:underline">browse</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports Chat exports (ChatGPT, Claude, Gemini), TXT, Markdown, and PDF
                      </p>
                    </div>
                  </div>
                </div>

                {file && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-4 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-800 text-slate-300 rounded-lg">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{file.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={runUploadPipeline}
                      className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-lg hover:shadow-glow transition"
                    >
                      Process Chronicle
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Ingestion Steps Progress */}
            {(uploadState === 'uploading' || uploadState === 'processing') && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-panel p-8 rounded-2xl space-y-8"
              >
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mx-auto mb-4" />
                  <h3 className="text-base font-bold text-white">Extracting Project DNA</h3>
                  <p className="text-xs text-slate-400 mt-1">Analyzing chat streams and mapping connection networks...</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                  {steps.map((step, idx) => {
                    const isPassed = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={idx} className={`p-4 rounded-xl border text-center transition-all ${
                        isPassed 
                          ? 'border-primary-500/30 bg-primary-600/5' 
                          : isCurrent
                            ? 'border-primary-500 bg-primary-600/10 shadow-glow'
                            : 'border-darkBorder bg-slate-950/20'
                      }`}>
                        <div className={`w-6 h-6 rounded-full mx-auto mb-3 flex items-center justify-center text-[10px] font-bold ${
                          isPassed 
                            ? 'bg-primary-500 text-white' 
                            : isCurrent
                              ? 'bg-primary-600 text-white animate-pulse'
                              : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isPassed ? <CheckCircle2 size={14} /> : idx + 1}
                        </div>
                        <h4 className={`text-xs font-bold ${isCurrent || isPassed ? 'text-white' : 'text-slate-500'}`}>
                          {step.label}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          {step.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Ingestion Complete screen */}
            {uploadState === 'done' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="glass-panel p-8 rounded-2xl text-center space-y-6"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 size={24} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">Extraction Successful!</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ingested '{file?.name}'. The AI Engine reconstructed:
                  </p>
                </div>

                {extractedData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto py-2">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-darkBorder">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ideas</span>
                      <p className="text-xl font-bold text-white mt-1">{extractedData.ideas?.length || 0}</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-darkBorder">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Decisions</span>
                      <p className="text-xl font-bold text-white mt-1">{extractedData.decisions?.length || 0}</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-darkBorder">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Milestones</span>
                      <p className="text-xl font-bold text-white mt-1">{extractedData.events?.length || 0}</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-darkBorder">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Open Questions</span>
                      <p className="text-xl font-bold text-white mt-1">{extractedData.open_questions?.length || 0}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-darkBorder">
                  <button
                    onClick={resetUploader}
                    className="px-4 py-2 border border-darkBorder hover:border-slate-700 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                  >
                    Ingest Another File
                  </button>
                  <button
                    onClick={() => setActiveView('timeline')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-xs font-semibold text-white transition hover:shadow-glow"
                  >
                    Explore Timeline <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Error view */}
            {uploadState === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-8 rounded-2xl text-center space-y-6"
              >
                <div className="w-12 h-12 rounded-full bg-accent-rose/10 border border-accent-rose/25 text-accent-rose flex items-center justify-center mx-auto">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ingestion Failed</h3>
                  <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                    {errorMsg || "An error occurred while compiling knowledge. Verify the structure of the chat export log."}
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={resetUploader}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 rounded-lg transition"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </div>
  );
};
