import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useApi } from '../hooks/useApi';
import { Upload, FileText, CheckCircle2, ChevronRight, AlertTriangle, Zap } from 'lucide-react';
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
    { label: "Ingested",   desc: "Binary upload completed, raw streams stored" },
    { label: "Parsed",     desc: "Text structural normalization and chat alignment" },
    { label: "Indexed",    desc: "Chunked documents indexed in vector database" },
    { label: "Visualized", desc: "Decision graphs and timeline entities updated" },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const runUploadPipeline = async () => {
    if (!file) return;
    setUploadState('uploading'); setCurrentStep(0); setErrorMsg('');
    try {
      await new Promise(r => setTimeout(r, 600)); setCurrentStep(1);
      await new Promise(r => setTimeout(r, 800)); setCurrentStep(2);
      const result = await api.uploadDocument(0, file);
      setCurrentStep(3);
      await new Promise(r => setTimeout(r, 600));
      setExtractedData(result);
      setUploadState('done');
    } catch (e: any) {
      setErrorMsg(e.message || 'An error occurred while extracting knowledge.');
      setUploadState('error');
    }
  };

  const resetUploader = () => { setFile(null); setUploadState('idle'); setCurrentStep(0); setExtractedData(null); };

  return (
    <div className="flex-1 w-full h-full p-6 pb-32 overflow-y-auto custom-scrollbar">
      <div className="max-w-[1600px] mx-auto min-h-full flex flex-col gap-6 pb-12">

        {/* Header */}
        <div className="bento-card p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4" style={{ color: 'var(--accent)' }}>
              Knowledge Ingestion
            </h1>
            <p className="text-sm md:text-base max-w-xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Upload JSON chat exports, markdown guides, PDF documentation, or text notes to Chronicle's extraction pipeline.
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col pt-12">
          <AnimatePresence mode="wait">

            {/* Idle / Drop Zone */}
            {uploadState === 'idle' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6 w-full">
                <div
                  onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                  className="bento-card border-2 border-dashed p-16 text-center transition-all duration-300 relative flex flex-col items-center justify-center min-h-[300px]"
                  style={{
                    borderColor: dragActive ? 'var(--accent)' : 'var(--border)',
                    background: dragActive ? 'var(--accent-dim)' : 'var(--bg-surface)',
                  }}
                >
                  <input type="file" id="file-input" onChange={handleFileChange} accept=".json,.txt,.md,.pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="flex flex-col items-center justify-center gap-6 relative z-0">
                    <div className="p-5 rounded-2xl transition-all duration-300"
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                      <Upload size={40} className={dragActive ? 'animate-bounce' : ''} />
                    </div>
                    <div>
                      <p className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Drop intelligence files here, or{' '}
                        <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>browse</span>
                      </p>
                      <p className="text-xs uppercase tracking-widest mt-3 font-semibold" style={{ color: 'var(--text-muted)' }}>
                        Supports ChatGPT, Claude, Gemini, TXT, MD, PDF
                      </p>
                    </div>
                  </div>
                </div>

                {file && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bento-card p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                        <p className="text-[10px] terminal-text mt-1" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={runUploadPipeline}
                      className="px-6 py-2.5 text-[11px] font-bold tracking-widest uppercase rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                      style={{ background: 'var(--accent)', color: 'var(--bg-void)' }}>
                      <Zap size={14} /> Process
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Processing */}
            {(uploadState === 'uploading' || uploadState === 'processing') && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                className="bento-card p-12 space-y-12">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-6"
                    style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                  <h3 className="text-xl font-black tracking-tight">Extracting Neural Patterns</h3>
                  <p className="text-xs uppercase tracking-widest mt-2" style={{ color: 'var(--accent)' }}>Compiling structural graph...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-3xl mx-auto w-full relative">
                  <div className="absolute top-6 left-0 right-0 h-px hidden md:block" style={{ background: 'var(--border)' }} />
                  {steps.map((step, idx) => {
                    const isPassed = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={idx} className="bento-card p-5 text-center transition-all"
                        style={isCurrent ? { borderColor: 'var(--accent)', background: 'var(--accent-dim)' } :
                               isPassed ? { borderColor: 'var(--border)' } : { opacity: 0.4 }}>
                        <div className="w-8 h-8 rounded-full mx-auto mb-4 flex items-center justify-center text-xs terminal-text"
                          style={{
                            background: isPassed ? 'var(--accent)' : isCurrent ? 'var(--accent-dim)' : 'transparent',
                            color: isPassed ? 'var(--bg-void)' : 'var(--accent)',
                            border: `1px solid var(--border)`,
                          }}>
                          {isPassed ? <CheckCircle2 size={16} /> : idx + 1}
                        </div>
                        <h4 className="text-[11px] font-bold uppercase tracking-widest"
                          style={{ color: isCurrent || isPassed ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {step.label}
                        </h4>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Done */}
            {uploadState === 'done' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="bento-card p-12 text-center space-y-8"
                style={{ borderColor: 'var(--accent)', background: 'var(--accent-dim)' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter">Extraction Successful</h3>
                  <p className="text-xs uppercase tracking-widest mt-2 font-semibold" style={{ color: 'var(--accent)' }}>
                    Ingested {file?.name}
                  </p>
                </div>
                {extractedData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto py-2">
                    {[
                      { label: 'Ideas',     count: extractedData.ideas?.length || 0 },
                      { label: 'Decisions', count: extractedData.decisions?.length || 0 },
                      { label: 'Milestones', count: extractedData.events?.length || 0 },
                      { label: 'Questions', count: extractedData.open_questions?.length || 0 },
                    ].map(({ label, count }) => (
                      <div key={label} className="bento-card p-4">
                        <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</span>
                        <p className="text-3xl font-bold mt-2 terminal-text" style={{ color: 'var(--accent)' }}>{count}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-center gap-4 mt-8 pt-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <button onClick={resetUploader}
                    className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    Ingest Another
                  </button>
                  <button onClick={() => setActiveView('timeline')}
                    className="flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-105"
                    style={{ background: 'var(--accent)', color: 'var(--bg-void)' }}>
                    Explore Timeline <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {uploadState === 'error' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className="bento-card p-12 text-center space-y-6"
                style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Ingestion Failed</h3>
                  <p className="text-xs uppercase tracking-widest mt-3 max-w-md mx-auto leading-relaxed" style={{ color: '#f87171' }}>
                    {errorMsg || 'An error occurred while compiling knowledge. Verify the structure of the chat export log.'}
                  </p>
                </div>
                <button onClick={resetUploader}
                  className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-105"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  Initialize Retry
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
