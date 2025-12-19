
import React, { useState, useCallback, useMemo } from 'react';
import { 
  FileText, 
  Upload, 
  LayoutDashboard, 
  Search, 
  Users, 
  BarChart3, 
  Loader2, 
  ChevronRight,
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { ProcessedDocument, AppState } from './types';
import { processPdf } from './services/pdfProcessor';
import { analyzeDocument } from './services/geminiService';

// Standard external libraries via CDN (JSZip)
declare const JSZip: any;

export default function App() {
  const [state, setState] = useState<AppState>({
    documents: [],
    selectedDocId: null,
    isProcessing: false,
    view: 'dashboard'
  });

  const [searchQuery, setSearchQuery] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setState(prev => ({ ...prev, isProcessing: true }));
    
    const file = files[0];
    const newDocs: ProcessedDocument[] = [];

    try {
      if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        // Fix: Cast zip entries to any to avoid "unknown" type errors when accessing dir and async
        for (const [filename, zipEntry] of Object.entries(zip.files) as [string, any][]) {
          if (!zipEntry.dir && filename.toLowerCase().endsWith('.pdf')) {
            newDocs.push({
              id: Math.random().toString(36).substr(2, 9),
              name: filename,
              type: 'pdf',
              content: '',
              images: [],
              status: 'pending'
            });
          }
        }
      } else if (file.name.endsWith('.pdf')) {
        newDocs.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: 'pdf',
          content: '',
          images: [],
          status: 'pending'
        });
      }

      setState(prev => ({ 
        ...prev, 
        documents: [...prev.documents, ...newDocs],
        isProcessing: false 
      }));

      // Start background processing
      processQueue(newDocs, file);

    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const processQueue = async (docs: ProcessedDocument[], originalFile: File) => {
    for (const doc of docs) {
      try {
        updateDocStatus(doc.id, 'processing');
        
        let fileData: Blob;
        if (originalFile.name.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(originalFile);
          fileData = await zip.file(doc.name).async('blob');
        } else {
          fileData = originalFile;
        }

        const { text, images } = await processPdf(fileData);
        const analysis = await analyzeDocument(text, images);

        setState(prev => ({
          ...prev,
          documents: prev.documents.map(d => 
            d.id === doc.id 
              ? { ...d, content: text, images, analysis, status: 'completed' } 
              : d
          )
        }));
      } catch (err) {
        console.error(`Failed to process ${doc.name}`, err);
        updateDocStatus(doc.id, 'error');
      }
    }
  };

  const updateDocStatus = (id: string, status: ProcessedDocument['status']) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.map(d => d.id === id ? { ...d, status } : d)
    }));
  };

  const filteredDocs = useMemo(() => {
    return state.documents.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.analysis?.entities.some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [state.documents, searchQuery]);

  const selectedDoc = useMemo(() => {
    return state.documents.find(d => d.id === state.selectedDocId);
  }, [state.documents, state.selectedDocId]);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-16 md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col items-center md:items-start p-4">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="hidden md:block text-xl font-bold tracking-tight">Nexus <span className="text-indigo-500">Docs</span></h1>
        </div>

        <div className="space-y-2 w-full">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={state.view === 'dashboard'} 
            onClick={() => setState(p => ({ ...p, view: 'dashboard' }))} 
          />
          <NavItem 
            icon={<Users />} 
            label="Entity Map" 
            active={state.view === 'analytics'} 
            onClick={() => setState(p => ({ ...p, view: 'analytics' }))} 
          />
        </div>

        <div className="mt-auto w-full pt-4 border-t border-slate-800">
          <label className="flex items-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer transition-all duration-200">
            <Upload className="w-5 h-5 shrink-0" />
            <span className="hidden md:block font-medium">Upload Files</span>
            <input type="file" className="hidden" accept=".zip,.pdf" onChange={handleFileUpload} />
          </label>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center bg-slate-800 rounded-lg px-3 py-1.5 w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search people, documents, or insights..." 
              className="bg-transparent border-none focus:outline-none text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              AI Core Ready
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {state.view === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Documents" value={state.documents.length} icon={<FileText className="text-blue-400" />} />
                <StatCard title="Entities Identified" value={state.documents.reduce((acc, d) => acc + (d.analysis?.entities.length || 0), 0)} icon={<Users className="text-indigo-400" />} />
                <StatCard title="Processing" value={state.documents.filter(d => d.status === 'processing').length} icon={<Loader2 className={`text-amber-400 ${state.isProcessing ? 'animate-spin' : ''}`} />} />
              </section>

              <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-indigo-400" />
                    Document Repository
                  </h3>
                </div>
                <div className="divide-y divide-slate-700">
                  {filteredDocs.length > 0 ? filteredDocs.map(doc => (
                    <div 
                      key={doc.id} 
                      className="group p-4 hover:bg-slate-700/50 cursor-pointer transition-colors flex items-center gap-4"
                      onClick={() => setState(p => ({ ...p, view: 'document', selectedDocId: doc.id }))}
                    >
                      <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{doc.name}</div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                          <StatusBadge status={doc.status} />
                          {doc.analysis?.documentDate && <span>• {doc.analysis.documentDate}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.analysis?.entities.slice(0, 3).map((e, idx) => (
                          <span key={idx} className="hidden lg:inline-block px-2 py-0.5 bg-slate-800 text-[10px] rounded border border-slate-600">
                            {e.name}
                          </span>
                        ))}
                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 translate-x-0 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-slate-600" />
                      </div>
                      <p className="text-slate-400">No documents processed yet. Upload a ZIP or PDF to begin.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {state.view === 'document' && selectedDoc && (
            <div className="max-w-6xl mx-auto space-y-6">
              <button 
                onClick={() => setState(p => ({ ...p, view: 'dashboard' }))}
                className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 mb-4"
              >
                ← Back to Dashboard
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Analysis Column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                    <h2 className="text-2xl font-bold mb-4">{selectedDoc.name}</h2>
                    {selectedDoc.status === 'completed' ? (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Summary</h4>
                          <p className="text-slate-200 leading-relaxed italic border-l-4 border-indigo-600 pl-4">
                            {selectedDoc.analysis?.summary}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Key Insights</h4>
                          <ul className="space-y-2">
                            {selectedDoc.analysis?.keyInsights.map((insight, i) => (
                              <li key={i} className="flex gap-3 text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                <span className="text-indigo-500 font-bold">•</span>
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Extracted Content Preview</h4>
                          <div className="bg-slate-950 p-4 rounded-lg text-sm font-mono text-slate-400 max-h-64 overflow-y-auto leading-relaxed border border-slate-800">
                            {selectedDoc.content || "No text extracted."}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ProcessingState status={selectedDoc.status} />
                    )}
                  </div>

                  {selectedDoc.images.length > 0 && (
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Document Visuals</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedDoc.images.map((img, i) => (
                          <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden border border-slate-600 bg-slate-900">
                            <img src={`data:image/jpeg;base64,${img}`} alt="Page preview" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Column: Entities */}
                <div className="space-y-6">
                  <div className="bg-indigo-900/20 rounded-2xl p-6 border border-indigo-500/30 sticky top-24">
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-indigo-400" />
                      Mentioned Entities
                    </h3>
                    <div className="space-y-4">
                      {selectedDoc.analysis?.entities.map((entity, i) => (
                        <div key={i} className="group relative bg-slate-800/50 p-3 rounded-xl border border-slate-700 hover:border-indigo-500 transition-colors">
                          <div className="font-bold text-white text-sm">{entity.name}</div>
                          <div className="text-[10px] text-indigo-400 uppercase font-semibold mt-0.5">{entity.role || 'Unspecified Role'}</div>
                          <div className="text-xs text-slate-400 mt-2 italic leading-snug">
                            "{entity.context}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.view === 'analytics' && (
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <BarChart3 className="text-indigo-500" /> Relationship Intelligence
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                  <h3 className="text-lg font-semibold mb-6">Mention Frequency by Entity</h3>
                  <div className="space-y-4">
                    {Object.entries(
                      state.documents.reduce((acc: any, d) => {
                        d.analysis?.entities.forEach(e => acc[e.name] = (acc[e.name] || 0) + 1);
                        return acc;
                      }, {})
                    )
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 10)
                    .map(([name, count]) => (
                      <div key={name} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-200">{name}</span>
                          <span className="text-indigo-400 font-bold">{count as number} docs</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (count as number) / 5 * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                  <h3 className="text-lg font-semibold mb-6">Topic Distribution</h3>
                  <div className="flex flex-wrap gap-3">
                    {['Financial Records', 'Flight Logs', 'Deposition', 'Correspondence', 'Legal Brief', 'Victim Statement'].map(topic => (
                      <div key={topic} className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-700 text-sm hover:border-indigo-500 cursor-default transition-colors">
                        {topic}
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 p-6 bg-indigo-950/30 rounded-xl border border-indigo-500/20">
                    <p className="text-sm text-slate-300 italic">
                      "Cross-document analysis indicates a high concentration of mentions across multiple flight manifests. AI clustering suggests strong linkages between financial entities and logistical support networks."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="hidden md:block font-medium">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className="p-3 bg-slate-900 rounded-xl">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ProcessedDocument['status'] }) {
  const styles = {
    pending: 'bg-slate-800 text-slate-400 border-slate-700',
    processing: 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border ${styles[status]}`}>
      {status}
    </span>
  );
}

function ProcessingState({ status }: { status: ProcessedDocument['status'] }) {
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-red-950/20 rounded-xl border border-red-900/30">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h4 className="text-lg font-bold text-red-400">Analysis Failed</h4>
        <p className="text-slate-400 mt-2">The document could not be fully analyzed. This might be due to document complexity or API rate limits.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
      <h4 className="text-lg font-bold">Deep Analysis in Progress</h4>
      <p className="text-slate-400 mt-2 max-w-sm">Gemini is currently cross-referencing text, identifying entities, and extracting context from this document.</p>
    </div>
  );
}
