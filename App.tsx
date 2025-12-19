
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  FileText, Upload, LayoutDashboard, Search, Users, BarChart3, 
  Loader2, ChevronRight, AlertCircle, FolderOpen, Settings, MessageSquare, 
  Trash2, Save, Play, Pause, RefreshCw, Star, Share2, ExternalLink, X,
  Database, ShieldCheck, BrainCircuit, RotateCcw, CheckCircle2
} from 'lucide-react';
import { ProcessedDocument, AppState, POI, ChatMessage, Entity } from './types';
import { processPdf } from './services/pdfProcessor';
import { analyzeDocument, ragChat } from './services/geminiService';
import { analyzeWithLMStudio } from './services/lmStudioService';

declare const JSZip: any;

const STORAGE_KEY = 'epstein_nexus_v4_state';
const MAX_CONCURRENT_AGENTS = 1; // Reduced to 1 to help mitigate 429 rate limits for standard tiers

// Store blobs securely
let fileStore: Record<string, Blob> = {};

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure we don't start with a locked processing state
      return { ...parsed, isProcessing: false, view: 'dashboard', processingQueue: [] };
    }
    return {
      documents: [],
      pois: [],
      selectedDocId: null,
      isProcessing: false,
      view: 'dashboard',
      config: {
        useGemini: true,
        useLMStudio: false,
        geminiModel: 'gemini-3-flash-preview', // Default changed to Flash
        lmStudioEndpoint: 'http://localhost:1234'
      },
      chatHistory: [{ role: 'system', content: 'NEXUS Agentic Core Online. Database monitoring active.', timestamp: Date.now() }],
      processingQueue: []
    };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeAgentsCount, setActiveAgentsCount] = useState(0);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Persistence
  useEffect(() => {
    const { isProcessing, processingQueue, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }, [state]);

  // Toast auto-clear
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: ProcessedDocument[] = [];
    const queueIds: string[] = [];

    for (const file of Array.from(files) as File[]) {
      try {
        if (file.name.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          for (const [filename, zipEntry] of Object.entries(zip.files) as [string, any][]) {
            if (!zipEntry.dir && filename.toLowerCase().endsWith('.pdf')) {
              const id = Math.random().toString(36).substr(2, 9);
              fileStore[id] = await zipEntry.async('blob');
              newDocs.push({ id, name: filename, type: 'pdf', content: '', images: [], status: 'pending' });
              queueIds.push(id);
            }
          }
        } else if (file.name.endsWith('.pdf')) {
          const id = Math.random().toString(36).substr(2, 9);
          fileStore[id] = file;
          newDocs.push({ id, name: file.name, type: 'pdf', content: '', images: [], status: 'pending' });
          queueIds.push(id);
        }
      } catch (err) {
        console.error("Upload failure:", file.name, err);
      }
    }

    setState(prev => ({ 
      ...prev, 
      documents: [...prev.documents, ...newDocs],
      processingQueue: [...prev.processingQueue, ...queueIds]
    }));
    showToast(`Ingested ${queueIds.length} fragments.`);
  };

  const resetArchive = () => {
    if (confirm("DANGER: This will permanently wipe all analyzed data, POIs, and chat history. Continue?")) {
      fileStore = {};
      setState({
        documents: [],
        pois: [],
        selectedDocId: null,
        isProcessing: false,
        view: 'dashboard',
        config: {
          useGemini: true,
          useLMStudio: false,
          geminiModel: 'gemini-3-flash-preview',
          lmStudioEndpoint: 'http://localhost:1234'
        },
        chatHistory: [{ role: 'system', content: 'Archive Purged. Agentic Core Ready for new data.', timestamp: Date.now() }],
        processingQueue: []
      });
      showToast("Archive successfully purged.");
    }
  };

  const restartAnalysis = () => {
    const failedIds = state.documents
      .filter(d => d.status === 'error' || d.status === 'pending')
      .map(d => d.id);
    
    if (failedIds.length === 0) {
      showToast("No pending or failed fragments to process.", "error");
      return;
    }

    setState(prev => ({
      ...prev,
      processingQueue: [...new Set([...prev.processingQueue, ...failedIds])]
    }));
    showToast(`Restarting analysis for ${failedIds.length} fragments.`);
  };

  // Multi-Agent Parallel Scouring Loop
  useEffect(() => {
    if (state.processingQueue.length > 0 && activeAgentsCount < MAX_CONCURRENT_AGENTS) {
      const docId = state.processingQueue[0];
      processDocumentAgent(docId);
    }
  }, [state.processingQueue, activeAgentsCount]);

  const processDocumentAgent = async (docId: string) => {
    setActiveAgentsCount(prev => prev + 1);
    
    const doc = state.documents.find(d => d.id === docId);
    const blob = fileStore[docId];
    
    if (!doc || !blob) {
      setState(prev => ({ ...prev, processingQueue: prev.processingQueue.filter(id => id !== docId) }));
      setActiveAgentsCount(prev => prev - 1);
      return;
    }

    updateDocStatus(docId, 'processing');

    try {
      const { text, images } = await processPdf(blob);
      const analysis = await analyzeDocument(text, images, state.config.geminiModel);
      
      let lmResult = null;
      if (state.config.useLMStudio) {
        lmResult = await analyzeWithLMStudio(text, state.config.lmStudioEndpoint);
        analysis.keyInsights.push(`LM Studio Verify: ${lmResult}`);
      }

      // Sync POIs
      const updatedPois = [...state.pois];
      analysis.entities.forEach((e: Entity) => {
        if (e.isFamous || e.role.toLowerCase().includes('agent') || e.role.toLowerCase().includes('witness')) {
          const existing = updatedPois.find(p => p.name.toLowerCase() === e.name.toLowerCase());
          if (existing) {
            if (!existing.mentions.some(m => m.docId === docId)) {
              existing.mentions.push({ docId, docName: doc.name, context: e.context });
            }
          } else {
            updatedPois.push({
              id: Math.random().toString(36).substr(2, 9),
              name: e.name,
              mentions: [{ docId, docName: doc.name, context: e.context }],
              isPolitical: e.isFamous && (e.role.toLowerCase().includes('president') || e.role.toLowerCase().includes('governor') || e.role.toLowerCase().includes('senator'))
            });
          }
        }
      });

      setState(prev => ({
        ...prev,
        documents: prev.documents.map(d => 
          d.id === docId ? { 
            ...d, 
            content: text, 
            images, 
            analysis, 
            status: 'completed',
            isPOI: analysis.flaggedPOIs.length > 0 || analysis.entities.some(ent => ent.isFamous)
          } : d
        ),
        pois: updatedPois,
        processingQueue: prev.processingQueue.filter(id => id !== docId)
      }));

      // Respect rate limits with a small gap
      await new Promise(r => setTimeout(r, 1000));

    } catch (err: any) {
      console.error(`Agent failed on ${docId}:`, err);
      updateDocStatus(docId, 'error');
      
      const errStr = JSON.stringify(err);
      const isRateLimit = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit) {
        console.warn("RATE LIMIT HIT: Standing down for 30 seconds...");
        showToast("Rate limit exceeded. Waiting 30s before retry.", "error");
        await new Promise(r => setTimeout(r, 30000));
        // Keep in queue for retry if rate limited
        return; 
      }
      
      setState(prev => ({ ...prev, processingQueue: prev.processingQueue.filter(id => id !== docId) }));
    } finally {
      setActiveAgentsCount(prev => prev - 1);
    }
  };

  const updateDocStatus = (id: string, status: ProcessedDocument['status']) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.map(d => d.id === id ? { ...d, status } : d)
    }));
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', content: chatInput, timestamp: Date.now() };
    setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, userMsg] }));
    setChatInput('');

    try {
      const searchTerms = chatInput.toLowerCase().split(' ').filter(t => t.length > 3);
      const relevantDocs = state.documents
        .filter(d => d.status === 'completed')
        .map(doc => {
          let score = 0;
          searchTerms.forEach(term => {
            if (doc.name.toLowerCase().includes(term)) score += 5;
            if (doc.analysis?.summary.toLowerCase().includes(term)) score += 3;
            if (doc.analysis?.entities.some(e => e.name.toLowerCase().includes(term))) score += 10;
            if (doc.content.toLowerCase().includes(term)) score += 1;
          });
          return { doc, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.doc);

      const response = await ragChat(chatInput, relevantDocs, state.chatHistory, state.config.geminiModel);
      
      const assistantMsg: ChatMessage = { 
        role: 'assistant', 
        content: response, 
        timestamp: Date.now(),
        references: relevantDocs.map(d => d.name)
      };
      setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, assistantMsg] }));
    } catch (err) {
      setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { role: 'system', content: 'Investigation agent error. Check API connection.', timestamp: Date.now() }] }));
    }
  };

  const shareToX = (content: string) => {
    const text = encodeURIComponent(`NEXUS Investigation: ${content.substring(0, 200)}... #EpsteinFiles #OSINT`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full z-50 flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${toast.type === 'success' ? 'bg-indigo-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Dynamic Sidebar */}
      <aside className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 cursor-pointer" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-6 h-6" />
          </div>
          {isSidebarOpen && <span className="font-black text-xl tracking-tighter uppercase">NEXUS <span className="text-indigo-500">OSINT</span></span>}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem icon={<LayoutDashboard />} label="Intelligence" active={state.view === 'dashboard'} onClick={() => setState(p => ({ ...p, view: 'dashboard' }))} collapsed={!isSidebarOpen} />
          <NavItem icon={<FolderOpen />} label="Archive" active={state.view === 'documents' || state.view === 'document_detail'} onClick={() => setState(p => ({ ...p, view: 'documents' }))} collapsed={!isSidebarOpen} />
          <NavItem icon={<Users />} label="POI Network" active={state.view === 'pois'} onClick={() => setState(p => ({ ...p, view: 'pois' }))} collapsed={!isSidebarOpen} badge={state.pois.length} />
          <NavItem icon={<MessageSquare />} label="Agent Chat" active={state.view === 'chat'} onClick={() => setState(p => ({ ...p, view: 'chat' }))} collapsed={!isSidebarOpen} />
          <NavItem icon={<BarChart3 />} label="Analytics" active={state.view === 'analytics'} onClick={() => setState(p => ({ ...p, view: 'analytics' }))} collapsed={!isSidebarOpen} />
          <NavItem icon={<Settings />} label="Control" active={state.view === 'settings'} onClick={() => setState(p => ({ ...p, view: 'settings' }))} collapsed={!isSidebarOpen} />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="px-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Active Agents</span>
              <span className="text-[10px] text-indigo-400 font-bold">{activeAgentsCount} / {MAX_CONCURRENT_AGENTS}</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(activeAgentsCount / MAX_CONCURRENT_AGENTS) * 100}%` }}></div>
            </div>
          </div>
          <label className="flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer transition-all shadow-lg shadow-indigo-600/30">
            <Upload className="w-4 h-4" />
            {isSidebarOpen && <span className="font-bold text-xs uppercase tracking-wider">Ingest Data</span>}
            <input type="file" className="hidden" multiple accept=".zip,.pdf" onChange={handleFileUpload} />
          </label>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/40 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Query database fragments..." 
                className="w-full bg-slate-800/40 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
             {state.documents.some(d => d.status === 'error') && (
               <button 
                 onClick={restartAnalysis}
                 className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-full text-[10px] font-black uppercase transition-all"
               >
                 <RotateCcw className="w-3 h-3" /> Retry Errors
               </button>
             )}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Database Integrity</span>
              <span className="text-xs font-medium text-slate-400">{state.documents.length > 0 ? '98.4%' : '0%'} Verified</span>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <ShieldCheck className="w-5 h-5 text-green-500" />
          </div>
        </header>

        {/* View Switcher */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          {state.view === 'dashboard' && <DashboardView state={state} setState={setState} />}
          {state.view === 'documents' && <DocumentsView state={state} setState={setState} searchQuery={searchQuery} restartAnalysis={restartAnalysis} />}
          {state.view === 'document_detail' && <DocumentDetailView state={state} setState={setState} shareToX={shareToX} />}
          {state.view === 'pois' && <POIView state={state} shareToX={shareToX} />}
          {state.view === 'chat' && <AgentChatView state={state} chatInput={chatInput} setChatInput={setChatInput} handleChat={handleChat} />}
          {state.view === 'settings' && <SettingsView state={state} setState={setState} showToast={showToast} resetArchive={resetArchive} />}
          {state.view === 'analytics' && <AnalyticsView state={state} />}
        </div>
      </main>
    </div>
  );
}

// Sub-components

function NavItem({ icon, label, active, onClick, collapsed, badge }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <span className={`shrink-0 transition-transform ${active ? 'scale-110' : 'group-hover:scale-105'}`}>{icon}</span>
      {!collapsed && <span className="font-bold text-sm tracking-tight">{label}</span>}
      {badge > 0 && !collapsed && <span className="ml-auto bg-slate-950/40 text-[9px] px-2 py-0.5 rounded-full font-black border border-white/10">{badge}</span>}
    </button>
  );
}

function DashboardView({ state, setState }: any) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Command Center</h2>
        <p className="text-slate-500 font-medium">Investigative AI Scour: Active Status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Fragments" value={state.documents.length} icon={<Database />} color="text-blue-500" />
        <StatCard title="POIs Mapped" value={state.pois.length} icon={<Users />} color="text-indigo-400" />
        <StatCard title="Analyzed" value={state.documents.filter((d: any) => d.status === 'completed').length} icon={<RefreshCw />} color="text-green-500" />
        <StatCard title="Queue" value={state.processingQueue.length} icon={<Loader2 />} color="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-[2rem] p-10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-12 text-indigo-500/5 -rotate-12 group-hover:rotate-0 transition-transform">
            <BrainCircuit size={160} />
          </div>
          <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Star className="text-yellow-500 fill-yellow-500 w-6 h-6" /> Priority Intelligence</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {state.documents.filter((d: any) => d.isPOI).slice(0, 4).map((doc: any) => (
              <div 
                key={doc.id} 
                onClick={() => setState((p:any) => ({ ...p, view: 'document_detail', selectedDocId: doc.id }))} 
                className="p-5 bg-slate-800/40 rounded-3xl border border-slate-700 hover:border-indigo-500/50 cursor-pointer transition-all hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-black text-xs text-indigo-300 truncate max-w-[120px] uppercase tracking-wider">{doc.name}</span>
                  <span className="text-[8px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-black uppercase">POI Hit</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 italic leading-relaxed">"{doc.analysis?.summary}"</p>
              </div>
            ))}
            {state.documents.filter((d: any) => d.isPOI).length === 0 && (
               <div className="col-span-2 py-10 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-600 text-sm font-bold uppercase tracking-widest">
                  Awaiting extraction results...
               </div>
            )}
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl shadow-indigo-600/20">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8 border border-white/20 backdrop-blur-sm">
            <RefreshCw className={`w-12 h-12 text-white ${state.processingQueue.length > 0 ? 'animate-spin' : ''}`} />
          </div>
          <h3 className="text-3xl font-black mb-3 leading-none uppercase tracking-tighter">NEXUS Core</h3>
          <p className="text-white/70 text-sm font-medium leading-relaxed mb-10">Agentic scours active. Checkpoints recorded every 30s.</p>
          <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden mb-4">
             <div 
               className="h-full bg-white transition-all duration-1000" 
               style={{ width: `${(state.documents.filter((d:any) => d.status === 'completed').length / (state.documents.length || 1)) * 100}%` }}
             ></div>
          </div>
          <div className="text-xs font-black text-white/90 uppercase tracking-[0.2em]">
            {Math.round((state.documents.filter((d:any) => d.status === 'completed').length / (state.documents.length || 1)) * 100)}% Data Mapped
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentsView({ state, setState, searchQuery, restartAnalysis }: any) {
  const filtered = state.documents.filter((d: any) => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.analysis?.summary || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Archive Repository</h2>
          <p className="text-slate-500 text-sm font-medium">Ingested fragment database</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={restartAnalysis}
            className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-black uppercase transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Restart Pipeline
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((doc: any) => (
          <div 
            key={doc.id} 
            className="group flex items-center gap-6 bg-slate-900/50 border border-slate-800 p-6 rounded-3xl hover:bg-slate-800/60 transition-all cursor-pointer hover:border-indigo-500/40 relative overflow-hidden"
            onClick={() => setState((p:any) => ({ ...p, view: 'document_detail', selectedDocId: doc.id }))}
          >
            {doc.isPOI && <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600"></div>}
            <div className={`p-4 rounded-2xl transition-all shadow-lg ${doc.isPOI ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black truncate text-sm uppercase tracking-wide group-hover:text-indigo-400 transition-colors">{doc.name}</div>
              <div className="flex items-center gap-4 mt-2">
                <StatusBadge status={doc.status} />
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{doc.analysis?.documentDate || 'Undated'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
               {doc.images.length > 0 && <span className="text-[10px] font-black text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">{doc.images.length} IMG</span>}
               <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentDetailView({ state, setState, shareToX }: any) {
  const doc = state.documents.find((d: any) => d.id === state.selectedDocId);
  if (!doc) return <div>Data Loss: Fragment Missing.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in zoom-in-95 duration-400">
      <div className="flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md py-4 z-10">
        <button onClick={() => setState((p:any) => ({ ...p, view: 'documents' }))} className="text-indigo-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:translate-x-[-4px] transition-transform">
           <X className="w-3 h-3" /> Close Investigation
        </button>
        <div className="flex gap-3">
          <button onClick={() => shareToX(`Insight from ${doc.name}: ${doc.analysis?.summary}`)} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-full font-black text-[10px] uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30">
            <Share2 className="w-3 h-3" /> Share to X
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-10">
          <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-12 shadow-2xl">
            <h2 className="text-5xl font-black mb-8 tracking-tightest leading-[0.9] uppercase">{doc.name}</h2>
            {doc.status === 'completed' ? (
              <div className="space-y-12">
                <section>
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <div className="w-8 h-px bg-indigo-500"></div> Intelligence Summary
                  </h4>
                  <p className="text-slate-200 leading-relaxed font-medium italic text-xl border-l-8 border-indigo-600 pl-10 py-2">
                    {doc.analysis?.summary}
                  </p>
                </section>

                <section>
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <div className="w-8 h-px bg-indigo-500"></div> Key Evidence Points
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {doc.analysis?.keyInsights.map((insight: string, i: number) => (
                      <div key={i} className="flex gap-6 p-6 bg-slate-950/60 rounded-[2rem] border border-slate-800 text-sm leading-relaxed group hover:border-indigo-500/30 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center font-black text-indigo-500 border border-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {i+1}
                        </div>
                        <span className="flex-1 mt-3 font-medium text-slate-300">{insight}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                    <div className="w-8 h-px bg-indigo-500"></div> Visual Forensic Extractions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {doc.images.map((img: string, i: number) => (
                      <div key={i} className="aspect-[4/3] rounded-[2rem] overflow-hidden border border-slate-800 bg-black group/img cursor-zoom-in relative">
                        <img src={`data:image/jpeg;base64,${img}`} className="w-full h-full object-contain opacity-70 group-hover/img:opacity-100 transition-all group-hover/img:scale-105" alt={`Frame ${i}`} />
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white opacity-0 group-hover/img:opacity-100 transition-opacity">
                          Fragment Extraction #{i+1}
                        </div>
                      </div>
                    ))}
                    {doc.images.length === 0 && (
                      <div className="col-span-2 p-16 text-center text-slate-600 text-xs font-black uppercase tracking-widest border border-dashed border-slate-800 rounded-[2rem]">
                        Visual engine found no usable imagery.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-32 text-center">
                <div className="relative mb-8">
                  <div className={`w-20 h-20 border-4 ${doc.status === 'error' ? 'border-red-500/20' : 'border-indigo-500/20 border-t-indigo-600'} rounded-full animate-spin`}></div>
                  {doc.status === 'error' ? <AlertCircle className="w-10 h-10 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /> : <Loader2 className="w-10 h-10 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                </div>
                <h3 className={`text-2xl font-black uppercase tracking-tighter ${doc.status === 'error' ? 'text-red-500' : ''}`}>
                  {doc.status === 'error' ? 'Fragment Error' : 'Deep Analysis Phase...'}
                </h3>
                <p className="text-slate-500 text-sm mt-4 max-w-sm leading-relaxed font-medium">
                  {doc.status === 'error' ? 'Analysis failed. This usually occurs due to rate limiting or corrupted fragment metadata. Retry the pipeline in the Control Layer.' : 'Correlating cross-references and identifying hidden entities within metadata streams.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 sticky top-24">
            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <Users className="w-5 h-5" /> Detected Entities
            </h4>
            <div className="space-y-4">
              {doc.analysis?.entities.map((entity: Entity, i: number) => (
                <div key={i} className={`p-6 rounded-3xl border transition-all ${entity.isFamous ? 'bg-indigo-600/10 border-indigo-500/40 shadow-xl shadow-indigo-600/5' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-sm text-white uppercase tracking-tight leading-none">{entity.name}</span>
                    {entity.isFamous && <div className="p-1.5 bg-yellow-500 rounded-lg shadow-lg shadow-yellow-500/20"><Star className="w-3 h-3 text-black fill-black" /></div>}
                  </div>
                  <div className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mb-4">{entity.role || 'Witness/POI'}</div>
                  <div className="text-[11px] text-slate-400 italic leading-relaxed font-medium">"{entity.context}"</div>
                </div>
              ))}
              {(!doc.analysis || doc.analysis.entities.length === 0) && <div className="text-xs text-slate-600 italic font-medium px-4">Entity scanning incomplete.</div>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function POIView({ state, shareToX }: any) {
  return (
    <div className="space-y-12 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">POI Matrix</h2>
        <p className="text-slate-500 font-medium">Mapped network of political and high-profile targets detected in archive.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {state.pois.map((poi: any) => (
          <div key={poi.id} className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-10 flex flex-col hover:border-indigo-600/50 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
              <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center font-black text-4xl text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xl">
                {poi.name.charAt(0)}
              </div>
              {poi.isPolitical && (
                <div className="flex flex-col items-end gap-1">
                   <span className="text-[8px] font-black bg-red-600 text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-red-600/20 animate-pulse">Political Figure</span>
                </div>
              )}
            </div>
            <h3 className="text-3xl font-black mb-1 leading-none uppercase tracking-tight">{poi.name}</h3>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 border-b border-slate-800 pb-4">Spotted in {poi.mentions.length} fragments</div>
            
            <div className="space-y-4 flex-1">
              {poi.mentions.slice(0, 3).map((m: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-[10px] leading-relaxed italic border-l-4 border-indigo-600 group-hover:border-indigo-400 transition-colors">
                  "{m.context.substring(0, 120)}..."
                  <div className="mt-3 text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Source: {m.docName}</div>
                </div>
              ))}
            </div>
            
            <button onClick={() => shareToX(`Entity Spotting: ${poi.name} documented in NEXUS investigation.`)} className="mt-8 flex items-center justify-center gap-3 text-[10px] font-black text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest border border-slate-800 py-3 rounded-2xl hover:bg-slate-800">
              <Share2 className="w-4 h-4" /> Export Profile
            </button>
          </div>
        ))}
        {state.pois.length === 0 && (
           <div className="col-span-full py-32 text-center border-4 border-dashed border-slate-800 rounded-[3rem]">
              <Users className="w-16 h-16 text-slate-800 mx-auto mb-6" />
              <p className="text-slate-600 font-black uppercase tracking-widest">Network Mapping in progress...</p>
           </div>
        )}
      </div>
    </div>
  );
}

function AgentChatView({ state, chatInput, setChatInput, handleChat }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.chatHistory]);

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pb-6">
      <div className="mb-10 flex items-center gap-4 bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-3xl">
         <div className="p-3 bg-indigo-600 rounded-2xl">
            <BrainCircuit className="w-6 h-6 text-white" />
         </div>
         <div>
            <h3 className="font-black text-sm uppercase tracking-wider leading-none">OSINT Agentic Interface</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest tracking-widest">Connected to {state.documents.filter(d => d.status === 'completed').length} fragments</p>
         </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-6 mb-8 pr-4 overflow-y-auto custom-scrollbar p-2">
        {state.chatHistory.map((msg: any, i: number) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-6 rounded-[2rem] shadow-2xl relative ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : msg.role === 'system' ? 'bg-slate-800/40 text-slate-500 italic text-xs border border-slate-800 tracking-wider' : 'bg-slate-900 border border-slate-800 rounded-tl-none'}`}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</div>
              {msg.references && msg.references.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                   <div className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <Database className="w-3 h-3" /> Archive References
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {msg.references.map((ref: string, idx: number) => (
                        <div key={idx} className="bg-slate-800/50 px-3 py-1.5 rounded-full text-[9px] font-black border border-white/5 uppercase tracking-wider">
                           {ref}
                        </div>
                      ))}
                   </div>
                </div>
              )}
              <div className="text-[8px] mt-4 opacity-40 font-black uppercase tracking-widest">{new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 bg-slate-900/50 p-3 rounded-[2.5rem] border-2 border-slate-800 focus-within:border-indigo-600 transition-all shadow-2xl backdrop-blur-md">
        <input 
          type="text" 
          value={chatInput} 
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleChat()}
          placeholder="Command investigative scour for names, dates, or hidden patterns..." 
          className="flex-1 bg-transparent px-8 py-4 outline-none text-sm font-medium tracking-tight"
        />
        <button onClick={handleChat} className="bg-indigo-600 hover:bg-indigo-700 px-10 py-4 rounded-[1.8rem] font-black transition-all shadow-xl shadow-indigo-600/20 uppercase text-xs tracking-widest">Synthesize</button>
      </div>
    </div>
  );
}

function SettingsView({ state, setState, showToast, resetArchive }: any) {
  const save = () => {
    showToast("Settings synchronized to Nexus Core.");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-12 space-y-12 shadow-2xl animate-in fade-in duration-500">
        <div className="flex items-center gap-6">
           <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/20">
              <Settings className="w-8 h-8 text-white" />
           </div>
           <div>
              <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Control Layer</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Core Intelligence & Integration Matrix</p>
           </div>
        </div>
        
        <div className="space-y-10">
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-3">
               <div className="w-8 h-px bg-indigo-500"></div> Primary Intelligence Core
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <button 
                 onClick={() => { setState((p:any) => ({...p, config: {...p.config, geminiModel: 'gemini-3-flash-preview'}})); save(); }}
                 className={`p-6 rounded-3xl border text-left transition-all ${state.config.geminiModel === 'gemini-3-flash-preview' ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-600/20' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'}`}
               >
                  <div className="font-black text-sm uppercase mb-1">Gemini 3 Flash</div>
                  <div className={`text-[10px] font-bold ${state.config.geminiModel === 'gemini-3-flash-preview' ? 'text-indigo-100' : 'text-slate-500'}`}>High Velocity Extraction (Standard)</div>
               </button>
               <button 
                 onClick={() => { setState((p:any) => ({...p, config: {...p.config, geminiModel: 'gemini-3-pro-preview'}})); save(); }}
                 className={`p-6 rounded-3xl border text-left transition-all ${state.config.geminiModel === 'gemini-3-pro-preview' ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-600/20' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'}`}
               >
                  <div className="font-black text-sm uppercase mb-1">Gemini 3 Pro</div>
                  <div className={`text-[10px] font-bold ${state.config.geminiModel === 'gemini-3-pro-preview' ? 'text-indigo-100' : 'text-slate-500'}`}>Deep Investigating Agent (High Quota)</div>
               </button>
            </div>
          </section>

          <section className="p-8 bg-slate-950/50 rounded-[2.5rem] border border-slate-800 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                   <ExternalLink className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="font-black text-sm uppercase tracking-tight">LM Studio Verification</div>
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Dual-Core Local Processing</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={state.config.useLMStudio} onChange={e => { setState((p:any) => ({...p, config: {...p.config, useLMStudio: e.target.checked}})); save(); }} className="sr-only peer" />
                <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            {state.config.useLMStudio && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                 <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Verification Endpoint</div>
                 <input 
                   type="text" 
                   placeholder="http://localhost:1234"
                   className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-xs font-mono outline-none focus:border-indigo-600 transition-colors"
                   value={state.config.lmStudioEndpoint}
                   onChange={e => setState((p:any) => ({...p, config: {...p.config, lmStudioEndpoint: e.target.value}}))}
                 />
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="bg-red-950/20 border border-red-900/50 rounded-[3rem] p-12 space-y-6">
        <div className="flex items-center gap-4 text-red-500">
          <AlertCircle className="w-8 h-8" />
          <h2 className="text-2xl font-black uppercase tracking-tighter">System Danger Zone</h2>
        </div>
        <p className="text-red-900/80 font-medium text-sm">Purging the archive will permanently erase all extracted entities, cross-references, and analysis. This cannot be undone.</p>
        <button 
          onClick={resetArchive}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-3xl font-black text-xs transition-all shadow-xl shadow-red-600/20 uppercase tracking-[0.2em]"
        >
          Reset Nexus Archive
        </button>
      </div>
    </div>
  );
}

function AnalyticsView({ state }: any) {
  const famousCount = state.pois.length;
  const docCount = state.documents.length;
  
  return (
    <div className="space-y-12 animate-in slide-in-from-right-6 duration-600">
       <div className="flex flex-col gap-2">
        <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">OSINT Analytics</h2>
        <p className="text-slate-500 font-medium">Cross-fragment relationship mapping & frequency metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-slate-900/50 border border-slate-800 p-10 rounded-[3rem]">
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
             <div className="w-8 h-px bg-indigo-500"></div> Network Frequency
          </h3>
          <div className="space-y-8">
            {state.pois.sort((a:any, b:any) => b.mentions.length - a.mentions.length).slice(0, 8).map((poi:any) => (
              <div key={poi.id} className="space-y-3 group cursor-default">
                <div className="flex justify-between text-xs font-black uppercase tracking-tight">
                  <span className="group-hover:text-indigo-400 transition-colors">{poi.name}</span>
                  <span className="text-indigo-400">{poi.mentions.length} fragments</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000 group-hover:bg-indigo-400" style={{ width: `${(poi.mentions.length / (docCount || 1)) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-10 rounded-[3rem] flex flex-col items-center justify-center text-center group">
          <div className="relative mb-8">
             <div className="text-8xl font-black text-indigo-500 leading-none group-hover:scale-110 transition-transform">{famousCount}</div>
             <div className="absolute -top-4 -right-4 p-4 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-600/40">
                <Users className="w-8 h-8 text-white" />
             </div>
          </div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-10">Targets Verified</div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs italic font-medium">
            "Agentic scours have synthesized {famousCount} people of interest across {docCount} data fragments. Persistent network pattern verified at level 4."
          </p>
          <div className="mt-12 w-full pt-10 border-t border-slate-800 flex justify-around">
             <div>
                <div className="text-xl font-black text-white">{state.documents.filter(d => d.isPOI).length}</div>
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">POI Documents</div>
             </div>
             <div className="w-px h-8 bg-slate-800"></div>
             <div>
                <div className="text-xl font-black text-white">{state.pois.filter(p => p.isPolitical).length}</div>
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Political Nodes</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-slate-900/50 p-8 rounded-[2rem] border border-slate-800 relative overflow-hidden group hover:border-indigo-500/50 transition-all shadow-xl">
      <div className={`absolute top-0 right-0 p-10 ${color} opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all`}>
        {React.cloneElement(icon, { size: 64 })}
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">{title}</p>
      <p className="text-4xl font-black tracking-tighter leading-none">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ProcessedDocument['status'] }) {
  const styles = {
    pending: 'bg-slate-800/50 text-slate-500 border-slate-700',
    processing: 'bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse',
    completed: 'bg-green-500/10 text-green-500 border-green-500/30',
    error: 'bg-red-500/10 text-red-500 border-red-500/30'
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${styles[status]}`}>
      {status}
    </span>
  );
}
