import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UploadCloud, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export default function DocumentUpload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, complete, error
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const validateAndSetFile = (selectedFile) => {
    setErrorMsg('');
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setErrorMsg('Unsupported file type. Please upload a PDF, DOC, or DOCX.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('File too large. Maximum size is 10MB.');
      return;
    }
    setFile(selectedFile);
  };

  const processDocument = async () => {
    if (!file) return;
    setStatus('uploading');
    setProgress(10);
    
    try {
      const formData = new FormData();
      formData.append('document', file);

      // We use raw fetch here because we need to send FormData, not JSON
      const token = localStorage.getItem('token');
      
      setProgress(40);
      setStatus('processing');
      
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process document');
      }

      setProgress(100);
      setStatus('complete');
      
      // Navigate to review screen with the extracted data in state
      setTimeout(() => {
        navigate('/documents/review', { state: { document: data.document, decisionInput: data.decisionInput } });
      }, 500);
      
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(typeof err.message === 'string' ? err.message : JSON.stringify(err.message));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-[hsl(var(--text-primary))] tracking-tight font-heading">Intelligent <span className="text-blue-500">Ingestion</span></h2>
      </div>

      <div className="glass-panel rounded-2xl p-10 relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700"></div>
        
        <div className="text-center mb-8 relative z-10">
          <h3 className="text-xl font-bold text-[hsl(var(--text-primary))] mb-2 font-heading">Upload Policy Document</h3>
          <p className="text-[hsl(var(--text-secondary))] text-sm">Upload a PDF, DOC, or DOCX to automatically extract policy parameters and create a decision simulation.</p>
        </div>

        <div 
          className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer mb-6 relative z-10
            ${file ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/30 hover:bg-white/5'}
            ${status !== 'idle' && status !== 'error' ? 'pointer-events-none opacity-50' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => status === 'idle' || status === 'error' ? fileInputRef.current?.click() : null}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])} 
            className="hidden" 
            accept=".pdf,.doc,.docx"
          />
          
          {file ? (
            <div className="flex flex-col items-center">
              <FileText size={48} className="text-blue-400 mb-4" />
              <p className="text-[hsl(var(--text-primary))] font-medium">{file.name}</p>
              <p className="text-[hsl(var(--text-secondary))] text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud size={48} className="text-[hsl(var(--text-secondary))] mb-4" />
              <p className="text-[hsl(var(--text-secondary))] mb-2">Drag and drop your file here, or click to browse</p>
              <p className="text-[hsl(var(--text-muted))] text-xs uppercase tracking-wider font-bold">Supports PDF, DOC, DOCX up to 10MB</p>
            </div>
          )}
        </div>

        {errorMsg && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3 relative z-10 text-sm">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p>{errorMsg}</p>
          </motion.div>
        )}

        {(status === 'uploading' || status === 'processing' || status === 'complete') && (
          <div className="mb-6 relative z-10">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-secondary))] mb-2">
              <span>{status === 'uploading' ? 'Uploading...' : status === 'processing' ? 'Extracting & Analyzing...' : 'Complete!'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${progress}%` }} 
                transition={{ duration: 0.5 }}
                className="h-full bg-blue-500 rounded-full"
              ></motion.div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 relative z-10">
          <button 
            onClick={() => setFile(null)}
            disabled={!file || (status !== 'idle' && status !== 'error')}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-[hsl(var(--text-secondary))] hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Clear
          </button>
          <button 
            onClick={processDocument}
            disabled={!file || (status !== 'idle' && status !== 'error')}
            className="btn-primary px-8 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2"
          >
            {(status === 'uploading' || status === 'processing') && <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>}
            Extract Decision
          </button>
        </div>
      </div>
    </motion.div>
  );
}
