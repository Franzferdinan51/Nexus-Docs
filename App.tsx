
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Upload, LayoutDashboard, Search, Users, BarChart3,
  Loader2, ChevronRight, AlertCircle, FolderOpen, Settings, MessageSquare,
  Trash2, RefreshCw, Star, Share2, ExternalLink, X,
  Database, ShieldCheck, BrainCircuit, RotateCcw, CheckCircle2, Zap, Key, Link2, HelpCircle, Info, Layers, ToggleLeft, ToggleRight, Cpu
} from 'lucide-react';
import { ProcessedDocument, AppState, POI, ChatMessage, Entity, DocumentAnalysis } from './types';
import { processPdf } from './services/pdfProcessor';
import { analyzeDocument, ragChat } from './services/geminiService';
import { analyzeWithLMStudio, testLMStudioConnection } from './services/lmStudioService';
import { analyzeWithOpenRouter } from './services/openRouterService';
import { saveDocument, getDocuments, clearDocuments } from './db';

declare const JSZip: any;

const STORAGE_KEY = 'epstein_nexus_v17_state';
const MAX_CONCURRENT_AGENTS = 1;

// Global file store to keep blobs out of state (prevents serialization issues)
let fileStore: Record<string, Blob> = {};

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Documents loaded from IDB later
      return {
        ...parsed,
        documents: [],
        isProcessing: false,
        view: parsed.view || 'dashboard',
        processingQueue: []
      };
    }
    return {
      documents: [],
      pois: [],
      selectedDocId: null,
      isProcessing: false,
      view: 'dashboard',
      config: {
        priority: ['gemini', 'openrouter', 'lmstudio'],
        enabled: {
          gemini: true,
          openrouter: true,
          lmstudio: false
        },
        geminiModel: 'gemini-3-flash-preview',
        openRouterModel: 'google/gemini-2.0-flash-001',
        openRouterKey: '',
        lmStudioEndpoint: 'http://127.0.0.1:1234',
        dualCheckMode: false,
        parallelAnalysis: false
      },
      chatHistory: [{ role: 'system', content: 'NEXUS Resilience Protocol Active.', timestamp: Date.now() }],
      processingQueue: []
    };
  });

  // Load documents from IndexedDB on mount
  useEffect(() => {
    const loadDocs = async () => {
      try {
        const docs = await getDocuments();
        if (docs.length > 0) {
          setState(prev => ({
            ...prev,
            documents: docs
          }));
          // Restore blobs to fileStore so reprocessing works
          docs.forEach(d => {
            if (d.contentBlob) fileStore[d.id] = d.contentBlob;
          });
        }
      } catch (e) {
        console.error("Failed to load IDB documents:", e);
      }
    };
    loadDocs();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeAgentsCount, setActiveAgentsCount] = useState(0);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);

  // Persistence - save settings/POIs to LocalStorage, Documents are handled by IDB
  useEffect(() => {
    const { isProcessing, processingQueue, documents, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }, [state]);

  // Toast auto-clear
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
  }, []);

  // Keep a ref to the latest state to avoid stale closures in callbacks
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateDocStatus = useCallback((id: string, status: ProcessedDocument['status']) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.map(d => d.id === id ? { ...d, status } : d)
    }));
  }, []);

  const processDocumentAgent = useCallback(async (docId: string) => {
    setActiveAgentsCount(prev => prev + 1);

    // Read from ref to get latest state (avoids stale closure)
    const currentState = stateRef.current;
    const doc = currentState.documents.find(d => d.id === docId);
    const blob = fileStore[docId];

    if (!doc || !blob) {
      setState(prev => ({
        ...prev,
        processingQueue: prev.processingQueue.filter(id => id !== docId)
      }));
      setActiveAgentsCount(prev => prev - 1);
      return;
    }

    updateDocStatus(docId, 'processing');

    try {
      console.log(`Analyzing Fragment: ${doc.name}...`);
      const { text, images } = await processPdf(blob);
      let analysis: DocumentAnalysis | null = null;
      let lineage: string[] = [];
      let finalProvider = '';

      // Read config from ref to get latest values
      const config = stateRef.current.config;
      const activeChain = config.priority.filter(p => config.enabled[p]);
      if (activeChain.length === 0) throw new Error("No intelligence nodes enabled.");

      const runProvider = async (provider: string, t: string, i: string[]) => {
        const cfg = stateRef.current.config;
        if (provider === 'gemini') return analyzeDocument(t, i, cfg.geminiModel);
        if (provider === 'openrouter') return analyzeWithOpenRouter(t, i, cfg.openRouterKey, cfg.openRouterModel);
        if (provider === 'lmstudio') return analyzeWithLMStudio(t, i, cfg.lmStudioEndpoint);
        throw new Error(`Unknown provider ${provider}`);
      };

      if (config.parallelAnalysis && activeChain.length > 1) {
        showToast(`Running Parallel Swarm (${activeChain.length} nodes) on ${doc.name}...`);

        const results = await Promise.allSettled(activeChain.map(p =>
          runProvider(p, text, images).then(res => ({ provider: p, data: res }))
        ));

        const successes = results
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<any>).value);

        if (successes.length === 0) {
          const errors = results.filter(r => r.status === 'rejected').map((r: any) => r.reason.message).join('; ');
          throw new Error(`All parallel agents failed: ${errors}`);
        }

        // Merge Results
        const primary = successes[0]; // Use first successful result as template
        const allEntities = successes.flatMap(s => s.data.entities);
        // Dedup entities by name
        const uniqueEntities = Array.from(new Map(allEntities.map(item => [item.name.toLowerCase(), item])).values());

        const allInsights = [...new Set(successes.flatMap(s => s.data.keyInsights))];
        const allFlags = [...new Set(successes.flatMap(s => s.data.flaggedPOIs))];

        analysis = {
          ...primary.data,
          summary: successes.map(s => `[${s.provider.toUpperCase()}]: ${s.data.summary}`).join('\n\n'),
          entities: uniqueEntities,
          keyInsights: allInsights,
          flaggedPOIs: allFlags,
          processedBy: 'NEXUS SWARM (Parallel)'
        };

        lineage = successes.map(s => s.provider);
        finalProvider = 'Parallel Swarm';

      } else {
        // Sequential / Failover Logic
        for (const provider of activeChain) {
          try {
            lineage.push(provider);
            analysis = await runProvider(provider, text, images);

            if (analysis && analysis.summary) {
              finalProvider = provider;
              break;
            }
          } catch (err: any) {
            console.warn(`Provider [${provider}] failed for ${doc.name}:`, err.message);
          }
        }

        if (!analysis) throw new Error("All active intelligence providers failed to return analysis.");

        // Dual-Check Logic (Only runs if parallel mode is OFF)
        if (config.dualCheckMode && analysis.entities.some(e => e.isFamous)) {
          const remainingEnabled = activeChain.filter(p => p !== finalProvider);
          if (remainingEnabled.length > 0) {
            const secondProvider = remainingEnabled[0];
            try {
              showToast(`Verifying targets with ${secondProvider}...`);
              const verification = await runProvider(secondProvider, text, images);

              if (verification) {
                analysis.keyInsights = [...new Set([...analysis.keyInsights, ...verification.keyInsights])];
                // Only add new entities found
                const existingNames = new Set(analysis.entities.map(e => e.name.toLowerCase()));
                const newEntities = verification.entities.filter(ve => !existingNames.has(ve.name.toLowerCase()));
                analysis.entities = [...analysis.entities, ...newEntities];

                lineage.push(`Verified by ${secondProvider}`);
              }
            } catch (verifErr) {
              console.warn("Verification pass failed:", verifErr);
            }
          }
        }
        analysis.processedBy = finalProvider;
      }


      // Ensure analysis uses undefined instead of null for compatibility with ProcessedDocument type
      const finalAnalysis = analysis || undefined;
      const finalLineage = lineage;

      console.log(`Final Analysis for ${doc.name}:`, finalAnalysis);

      setState(prev => {
        const updatedPois = [...prev.pois];
        if (finalAnalysis && finalAnalysis.entities) {
          finalAnalysis.entities.forEach((e: Entity) => {
            // Include if famous, matches role keywords, or already in POI list
            // Log if we're filtering out something for debug
            const isRelevant = e.isFamous ||
              /agent|witness|pilot|recruiter|victim/i.test(e.role) ||
              updatedPois.some((p: any) => p.name.toLowerCase() === e.name.toLowerCase());

            if (isRelevant) {
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
                  isPolitical: e.isFamous && /president|governor|senator|clerk/i.test(e.role)
                });
              }
            } else {
              // console.log("Dropped entity:", e.name, e.role);
            }
          });
        }

        const updatedDoc = {
          ...doc,
          content: text,
          images,
          analysis: finalAnalysis,
          status: 'completed' as const,
          isPOI: finalAnalysis?.entities?.some(ent => ent.isFamous) || false,
          lineage: finalLineage,
          contentBlob: blob // Store blob for IDB
        };

        // Save to IndexedDB (fire and forget)
        saveDocument(updatedDoc).catch(e => console.error("IDB Save Fail:", e));

        return {
          ...prev,
          documents: prev.documents.map(d => d.id === docId ? updatedDoc : d),
          pois: updatedPois,
          processingQueue: prev.processingQueue.filter(id => id !== docId)
        };
      });

    } catch (err: any) {
      console.error(`Analysis failed for ${docId}:`, err);
      updateDocStatus(docId, 'error');
      showToast(`Error analyzing ${doc.name}: ${err.message.substring(0, 40)}`, "error");
      setState(prev => ({ ...prev, processingQueue: prev.processingQueue.filter(id => id !== docId) }));
    } finally {
      setActiveAgentsCount(prev => prev - 1);
    }
  }, [updateDocStatus]);

  // Main processing effect - ensures the agent starts when the queue or active count changes
  useEffect(() => {
    if (state.processingQueue.length > 0 && activeAgentsCount < MAX_CONCURRENT_AGENTS) {
      const nextId = state.processingQueue[0];
      processDocumentAgent(nextId);
    }
  }, [state.processingQueue, activeAgentsCount, processDocumentAgent]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: ProcessedDocument[] = [];
    const queueIds: string[] = [];

    showToast(`Initializing ingestion for ${files.length} fragments...`);

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
        console.error("Upload Error:", err);
        showToast("Error reading file shard.", "error");
      }
    }

    if (queueIds.length > 0) {
      setState(prev => ({
        ...prev,
        documents: [...prev.documents, ...newDocs],
        processingQueue: [...prev.processingQueue, ...queueIds]
      }));
      showToast(`Shards queued: ${queueIds.length}`, "success");
    }
  };

  const resetArchive = () => {
    if (confirm("Permanently wipe local archive and all metadata?")) {
      fileStore = {};
      setState(prev => ({
        ...prev,
        documents: [],
        pois: [],
        processingQueue: [],
        chatHistory: [{ role: 'system', content: 'Database Cleared.', timestamp: Date.now() }]
      }));
      showToast("Archive Wiped.");
    }
  };

  const restartAnalysis = () => {
    const targetIds = state.documents.filter(d => d.status === 'error' || d.status === 'pending').map(d => d.id);
    if (targetIds.length > 0) {
      setState(prev => ({ ...prev, processingQueue: [...new Set([...prev.processingQueue, ...targetIds])] }));
      showToast(`Retrying ${targetIds.length} shards.`);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput, timestamp: Date.now() };
    setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, userMsg] }));
    setChatInput('');
    try {
      const searchTerms = chatInput.toLowerCase().split(' ').filter(t => t.length > 3);
      const relevantDocs = state.documents.filter(d => d.status === 'completed').map(doc => {
        let score = 0;
        searchTerms.forEach(term => {
          if (doc.name.toLowerCase().includes(term)) score += 10;
          if (doc.analysis?.summary.toLowerCase().includes(term)) score += 5;
          if (doc.content.toLowerCase().includes(term)) score += 1;
        });
        return { doc, score };
      }).filter(i => i.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(i => i.doc);

      const chatModel = state.config.enabled.gemini ? state.config.geminiModel : 'gemini-3-flash-preview';
      const response = await ragChat(chatInput, relevantDocs, state.chatHistory, chatModel);
      setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { role: 'assistant', content: response, timestamp: Date.now(), references: relevantDocs.map(d => d.name) }] }));
    } catch {
      setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { role: 'system', content: 'Agent disconnect. Intelligence loop failed.', timestamp: Date.now() }] }));
    }
  };

  const shareToX = useCallback((text: string) => {
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`, '_blank');
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/30 text-sm">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg z-50 flex items-center gap-3 shadow-2xl border transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-indigo-600 border-indigo-400' : toast.type === 'error' ? 'bg-red-600 border-red-400' : 'bg-amber-600 border-amber-400'}`}>
          <Zap className="w-3 h-3" /><span className="font-bold text-[10px] uppercase tracking-wider">{toast.message}</span>
        </div>
      )}

      <aside className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-56' : 'w-16'}`}>
        <div className="p-4 flex items-center gap-2 border-b border-slate-800 cursor-pointer hover:bg-slate-800/40" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <div className="bg-indigo-600 p-1.5 rounded-md shadow-lg shadow-indigo-600/20 shrink-0"><BrainCircuit className="w-4 h-4 text-white" /></div>
          {isSidebarOpen && <span className="font-black text-sm tracking-tighter uppercase truncate">NEXUS CORE</span>}
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
          <NavItem icon={<LayoutDashboard className="w-4 h-4" />} label="Intelligence" active={state.view === 'dashboard'} onClick={() => setState(p => ({ ...p, view: 'dashboard' }))} collapsed={!isSidebarOpen} />
          <NavItem icon={<FolderOpen className="w-4 h-4" />} label="Archive" active={state.view === 'documents'} onClick={() => setState(p => ({ ...p, view: 'documents' }))} collapsed={!isSidebarOpen} />
          <NavItem icon={<Users className="w-4 h-4" />} label="Network" active={state.view === 'pois'} onClick={() => setState(p => ({ ...p, view: 'pois' }))} collapsed={!isSidebarOpen} badge={state.pois.length} />
          <NavItem icon={<MessageSquare className="w-4 h-4" />} label="Agent" active={state.view === 'chat'} onClick={() => setState(p => ({ ...p, view: 'chat' }))} collapsed={!isSidebarOpen} />
          <NavItem icon={<BarChart3 className="w-4 h-4" />} label="Analytics" active={state.view === 'analytics'} onClick={() => setState(p => ({ ...p, view: 'analytics' }))} collapsed={!isSidebarOpen} />
          <NavItem icon={<Settings className="w-4 h-4" />} label="Control" active={state.view === 'settings'} onClick={() => setState(p => ({ ...p, view: 'settings' }))} collapsed={!isSidebarOpen} />
        </nav>
        <div className="p-2 border-t border-slate-800 space-y-2">
          <label className="flex items-center justify-center gap-2 p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition-all shadow-md active:scale-95 group">
            <Upload className="w-4 h-4" />
            {isSidebarOpen && <span className="font-bold text-[9px] uppercase tracking-widest">Ingest</span>}
            <input type="file" className="hidden" multiple accept=".zip,.pdf" onChange={handleFileUpload} />
          </label>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 border-b border-slate-800/60 flex items-center justify-between px-6 bg-slate-900/20 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <input type="text" placeholder="Scour archive..." className="w-full bg-slate-800/30 border border-slate-700/50 rounded py-1.5 pl-8 pr-4 text-[10px] font-medium focus:border-indigo-500/50 outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[7px] font-black uppercase tracking-widest text-indigo-400">Database</span>
              <span className="text-[10px] font-bold">{state.documents.length} shards</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <ShieldCheck className="w-4 h-4 text-green-500" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
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

function NavItem({ icon, label, active, onClick, collapsed, badge }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2.5 p-2 rounded transition-all ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-800/80 hover:text-slate-100'}`}>
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="font-bold text-[9px] uppercase tracking-widest truncate">{label}</span>}
      {badge > 0 && !collapsed && <span className="ml-auto bg-slate-950/50 text-[7px] px-1 py-0.5 rounded font-black border border-white/5">{badge}</span>}
    </button>
  );
}

function DashboardView({ state, setState }: any) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-baseline gap-3 border-b border-slate-800 pb-2">
        <h2 className="text-xl font-black tracking-tighter uppercase text-white">System Monitor</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Shards" value={state.documents.length} icon={<Database />} />
        <StatCard title="Targets" value={state.pois.length} icon={<Users />} />
        <StatCard title="Analyzed" value={state.documents.filter((d: any) => d.status === 'completed').length} icon={<RefreshCw />} />
        <StatCard title="Queued" value={state.processingQueue.length} icon={<Loader2 />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-4 shadow-xl">
          <h3 className="text-[10px] font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-slate-400"><Star className="text-yellow-500 w-3 h-3" /> Priority Intel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {state.documents.filter((d: any) => d.isPOI).slice(0, 4).map((doc: any) => (
              <div key={doc.id} onClick={() => setState((p: any) => ({ ...p, view: 'document_detail', selectedDocId: doc.id }))} className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/50 hover:border-indigo-500/50 cursor-pointer transition-all group">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[8px] text-indigo-300 truncate max-w-[100px] uppercase">{doc.name}</span>
                  <Zap className="w-2.5 h-2.5 text-indigo-500" />
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight italic">"{doc.analysis?.summary}"</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-indigo-600 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden group">
          <RefreshCw className={`w-8 h-8 text-white mb-3 ${state.processingQueue.length > 0 ? 'animate-spin' : ''}`} />
          <h3 className="text-sm font-black mb-0.5 uppercase tracking-tight text-white">Neural Sink</h3>
          <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-white transition-all duration-700" style={{ width: `${(state.documents.filter((d: any) => d.status === 'completed').length / (state.documents.length || 1)) * 100}%` }}></div>
          </div>
          <div className="text-[8px] font-black text-white uppercase tracking-widest">
            {Math.round((state.documents.filter((d: any) => d.status === 'completed').length / (state.documents.length || 1)) * 100)}% Synced
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentsView({ state, setState, searchQuery, restartAnalysis }: any) {
  const filtered = state.documents.filter((d: any) => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.analysis?.summary || "").toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800 pb-2">
        <h2 className="text-lg font-black uppercase tracking-tighter text-white">Fragment Repository</h2>
        <button onClick={restartAnalysis} className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[8px] font-black uppercase tracking-widest transition-all"><RotateCcw className="w-3 h-3" /> Retry All</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filtered.map((doc: any) => (
          <div key={doc.id} className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-lg hover:bg-slate-800/60 transition-all cursor-pointer relative" onClick={() => setState((p: any) => ({ ...p, view: 'document_detail', selectedDocId: doc.id }))}>
            {doc.isPOI && <div className="absolute top-0 right-0 w-1 h-full bg-indigo-600"></div>}
            <div className="flex justify-between items-start mb-2">
              <div className={`p-1.5 rounded ${doc.isPOI ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-50'}`}><FileText className="w-3.5 h-3.5" /></div>
              <StatusBadge status={doc.status} />
            </div>
            <div className="font-bold text-[9px] uppercase truncate mb-1 text-slate-200">{doc.name}</div>
            <p className="text-[10px] text-slate-500 line-clamp-2 italic leading-tight mb-2">{doc.analysis?.summary || "Awaiting deconstruction..."}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentDetailView({ state, setState, shareToX }: any) {
  const doc = state.documents.find((d: any) => d.id === state.selectedDocId);
  if (!doc) return <div className="p-10 font-black text-red-500">DATA ERROR</div>;
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in zoom-in-95 duration-400 pb-10">
      <div className="flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-xl py-2 z-30 border-b border-slate-800/50">
        <button onClick={() => setState((p: any) => ({ ...p, view: 'documents' }))} className="text-indigo-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 hover:bg-indigo-500/10 p-1.5 rounded"><X className="w-3 h-3" /> Back</button>
        <button onClick={() => shareToX(`Insight: ${doc.name}`)} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-md font-black text-[9px] uppercase tracking-widest transition-all"><Share2 className="w-3 h-3" /> Export</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-xl relative">
            <h2 className="text-xl font-black mb-6 tracking-tight uppercase leading-none text-white">{doc.name}</h2>
            {doc.status === 'completed' ? (
              <div className="space-y-6">
                <section>
                  <h4 className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2"><div className="w-4 h-px bg-indigo-600"></div> Summary</h4>
                  <p className="text-slate-200 font-medium italic text-sm border-l-2 border-indigo-600 pl-4 py-1 leading-relaxed whitespace-pre-line">{doc.analysis?.summary}</p>
                </section>
                <div className="flex gap-4">
                  <div className="flex-1 p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                    <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Analyzer Node</div>
                    <div className="text-[10px] font-bold text-indigo-400 uppercase">{doc.analysis?.processedBy || 'Unlabeled'}</div>
                  </div>
                  <div className="flex-1 p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                    <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Nexus Lineage</div>
                    <div className="text-[10px] font-bold text-slate-300 uppercase truncate">{(doc.lineage || []).join(' > ')}</div>
                  </div>
                </div>
                <section>
                  <h4 className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-4 h-px bg-indigo-600"></div> Findings</h4>
                  <div className="grid gap-2">
                    {doc.analysis?.keyInsights.map((insight: string, i: number) => (
                      <div key={i} className="flex gap-3 p-3 bg-slate-950/60 rounded border border-slate-800/50 text-xs leading-tight group">
                        <div className="w-6 h-6 shrink-0 rounded bg-slate-900 flex items-center justify-center font-black text-[10px] text-indigo-500 border border-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-all">{i + 1}</div>
                        <span className="flex-1 mt-1 font-bold text-slate-300">{insight}</span>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <h4 className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-4 h-px bg-indigo-600"></div> Visual Forensic Frames</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {doc.images.map((img: string, i: number) => (
                      <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-800 bg-black">
                        <img src={`data:image/jpeg;base64,${img}`} className="w-full h-full object-contain opacity-70 hover:opacity-100 transition-all" alt="Evidence" />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : <div className="py-12 text-center"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" /><h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Processing...</h3></div>}
          </div>
        </div>
        <aside className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 h-fit sticky top-16">
          <h4 className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Users className="w-3 h-3" /> Targets</h4>
          <div className="space-y-2">
            {doc.analysis?.entities.map((entity: Entity, i: number) => (
              <div key={i} className={`p-3 rounded-lg border transition-all ${entity.isFamous ? 'bg-indigo-600/10 border-indigo-500/40' : 'bg-slate-950/40 border-slate-800'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-black text-[9px] text-white uppercase truncate">{entity.name}</span>
                  {entity.isFamous && <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />}
                </div>
                <div className="text-[7px] text-indigo-400 font-bold uppercase tracking-widest">{entity.role || 'Witness'}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function POIView({ state, shareToX }: any) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-xs">
      <h2 className="text-xl font-black tracking-tighter uppercase text-white border-b border-slate-800 pb-2 flex items-center gap-3"><Users className="w-5 h-5 text-indigo-600" /> Target Network</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {state.pois.map((poi: any) => (
          <div key={poi.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col hover:border-indigo-600/40 transition-all group">
            <h3 className="text-sm font-black mb-0.5 leading-none uppercase text-white truncate">{poi.name}</h3>
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800/50 pb-2">{poi.mentions.length} Mentions</div>
            <div className="space-y-2 flex-1">
              {poi.mentions.slice(0, 2).map((m: any, idx: number) => (
                <div key={idx} className="p-2 bg-slate-950/60 rounded border border-slate-800 text-[9px] italic border-l-2 border-indigo-600 text-slate-400 leading-tight">"{m.context.substring(0, 60)}..."</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentChatView({ state, chatInput, setChatInput, handleChat }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [state.chatHistory]);
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto pb-4">
      <div className="mb-4 flex items-center gap-3 bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl">
        <div className="p-2 bg-indigo-600 rounded-md shrink-0"><BrainCircuit className="w-5 h-5 text-white" /></div>
        <div><h3 className="font-black text-sm uppercase tracking-tighter text-white">NEXUS Agent</h3><p className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest">{state.documents.filter(d => d.status === 'completed').length} finalized fragments synced</p></div>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-4 mb-4 pr-2 overflow-y-auto custom-scrollbar">
        {state.chatHistory.map((msg: any, i: number) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-xl shadow-md border relative ${msg.role === 'user' ? 'bg-indigo-600 border-indigo-400 text-white rounded-tr-none' : msg.role === 'system' ? 'bg-slate-900/40 text-slate-500 italic text-[8px] border-slate-800 uppercase tracking-widest' : 'bg-slate-900 border-slate-800 rounded-tl-none'}`}>
              <div className="text-[11px] leading-relaxed whitespace-pre-wrap font-bold uppercase tracking-tight">{msg.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 focus-within:border-indigo-600 transition-all shadow-xl backdrop-blur-3xl">
        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="Command agent..." className="flex-1 bg-transparent px-3 py-2 outline-none text-[10px] font-bold uppercase tracking-tight placeholder:text-slate-600" />
        <button onClick={handleChat} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-black transition-all shadow-md uppercase text-[9px] tracking-widest text-white active:scale-95">Inference</button>
      </div>
    </div>
  );
}

function SettingsView({ state, setState, showToast, resetArchive }: any) {
  const GEMINI_PRESETS = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash-lite-latest'];
  const OPENROUTER_PRESETS = ['google/gemini-2.0-flash-001', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o-mini', 'deepseek/deepseek-chat'];

  // Local UI state for better control over custom model IDs
  const [localConfig, setLocalConfig] = useState(state.config);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  const [isCustomGemini, setIsCustomGemini] = useState(!GEMINI_PRESETS.includes(state.config.geminiModel));
  const [isCustomOpenRouter, setIsCustomOpenRouter] = useState(!OPENROUTER_PRESETS.includes(state.config.openRouterModel));

  const save = () => {
    if (!localConfig.enabled.gemini && !localConfig.enabled.openrouter && !localConfig.enabled.lmstudio) {
      showToast("At least one provider must be enabled.", "error"); return;
    }
    setState(p => ({ ...p, config: localConfig }));
    showToast("Nexus Resilience Applied.");
  };

  const movePriority = (idx: number, dir: number) => {
    const newPriority = [...localConfig.priority];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= newPriority.length) return;
    [newPriority[idx], newPriority[targetIdx]] = [newPriority[targetIdx], newPriority[idx]];
    setLocalConfig({ ...localConfig, priority: newPriority });
  };

  const toggleProvider = (provider: keyof typeof localConfig.enabled) => {
    setLocalConfig({ ...localConfig, enabled: { ...localConfig.enabled, [provider]: !localConfig.enabled[provider] } });
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestError(null);
    const result = await testLMStudioConnection(localConfig.lmStudioEndpoint);
    if (result.success) { setTestStatus('success'); showToast("Connection Successful!"); }
    else { setTestStatus('fail'); setTestError(result.error || "Failed."); showToast("Connection Failed.", "error"); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-8 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-md shadow-lg shadow-indigo-600/20 shrink-0"><Layers className="w-4 h-4 text-white" /></div>
          <h2 className="text-lg font-black tracking-tighter uppercase text-white">Nexus Intelligence Control</h2>
        </div>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Execution Priority & Enablement</h3>
            <div className="space-y-2">
              {localConfig.priority.map((p, i) => (
                <div key={p} className={`flex items-center gap-3 p-3 bg-slate-950/40 border rounded-lg group transition-all ${localConfig.enabled[p] ? 'border-indigo-500/30' : 'border-slate-800 opacity-60'}`}>
                  <button onClick={() => toggleProvider(p)} className={`shrink-0 transition-colors ${localConfig.enabled[p] ? 'text-indigo-500' : 'text-slate-600'}`}>
                    {localConfig.enabled[p] ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <div className="flex-1 font-black text-[10px] uppercase tracking-widest text-white flex items-center gap-2">
                    <span className="text-slate-500">#{i + 1}</span>
                    {p}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => movePriority(i, -1)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronRight className="w-3 h-3 -rotate-90" /></button>
                    <button onClick={() => movePriority(i, 1)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronRight className="w-3 h-3 rotate-90" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dual Check Mode */}
            <div className={`p-4 bg-indigo-600/5 border border-indigo-500/20 rounded-xl flex justify-between items-center ${localConfig.parallelAnalysis ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-indigo-500" /><div><div className="font-black text-[10px] uppercase text-white">Dual Check Mode</div><div className="text-[7px] text-slate-500 uppercase tracking-widest">Verify high-profile targets</div></div></div>
              <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={localConfig.dualCheckMode} onChange={e => setLocalConfig({ ...localConfig, dualCheckMode: e.target.checked })} className="sr-only peer" /><div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div></label>
            </div>

            {/* Parallel Mode */}
            <div className="p-4 bg-indigo-600/5 border border-indigo-500/20 rounded-xl flex justify-between items-center">
              <div className="flex items-center gap-3"><Cpu className="w-5 h-5 text-indigo-500" /><div><div className="font-black text-[10px] uppercase text-white">Parallel Swarm</div><div className="text-[7px] text-slate-500 uppercase tracking-widest">Simultaneous execution</div></div></div>
              <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={localConfig.parallelAnalysis} onChange={e => setLocalConfig({ ...localConfig, parallelAnalysis: e.target.checked, dualCheckMode: e.target.checked ? false : localConfig.dualCheckMode })} className="sr-only peer" /><div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div></label>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gemini Config */}
            <div className={`p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4 transition-all ${localConfig.enabled.gemini ? 'border-indigo-500/20' : 'grayscale opacity-30 pointer-events-none'}`}>
              <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[10px] font-black uppercase text-white">Gemini Settings</span></div>
              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-slate-500">Active Model</label>
                <select
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[9px] uppercase font-bold outline-none focus:border-indigo-500"
                  value={isCustomGemini ? 'custom' : localConfig.geminiModel}
                  onChange={e => {
                    if (e.target.value === 'custom') {
                      setIsCustomGemini(true);
                    } else {
                      setIsCustomGemini(false);
                      setLocalConfig({ ...localConfig, geminiModel: e.target.value });
                    }
                  }}
                >
                  {GEMINI_PRESETS.map(m => <option key={m} value={m}>{m}</option>)}
                  <option value="custom">-- Custom Override --</option>
                </select>
                {isCustomGemini && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[7px] font-black uppercase text-indigo-400">Model ID Override</label>
                    <input
                      type="text"
                      placeholder="Enter model string..."
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[9px] outline-none focus:border-indigo-500"
                      defaultValue={localConfig.geminiModel}
                      onBlur={e => setLocalConfig({ ...localConfig, geminiModel: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* OpenRouter Config */}
            <div className={`p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4 transition-all ${localConfig.enabled.openrouter ? 'border-indigo-500/20' : 'grayscale opacity-30 pointer-events-none'}`}>
              <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[10px] font-black uppercase text-white">OpenRouter Settings</span></div>
              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-slate-500">API Key</label>
                <input type="password" placeholder="sk-or-v1-..." className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[9px] outline-none focus:border-indigo-500" value={localConfig.openRouterKey} onChange={e => setLocalConfig({ ...localConfig, openRouterKey: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-slate-500">Active Model</label>
                <select
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[9px] uppercase font-bold outline-none focus:border-indigo-500"
                  value={isCustomOpenRouter ? 'custom' : localConfig.openRouterModel}
                  onChange={e => {
                    if (e.target.value === 'custom') {
                      setIsCustomOpenRouter(true);
                    } else {
                      setIsCustomOpenRouter(false);
                      setLocalConfig({ ...localConfig, openRouterModel: e.target.value });
                    }
                  }}
                >
                  {OPENROUTER_PRESETS.map(m => <option key={m} value={m}>{m}</option>)}
                  <option value="custom">-- Custom Override --</option>
                </select>
                {isCustomOpenRouter && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[7px] font-black uppercase text-amber-400">Model ID Override</label>
                    <input
                      type="text"
                      placeholder="Enter model string..."
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[9px] outline-none focus:border-indigo-500"
                      defaultValue={localConfig.openRouterModel}
                      onBlur={e => setLocalConfig({ ...localConfig, openRouterModel: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4 transition-all ${localConfig.enabled.lmstudio ? 'border-indigo-500/20' : 'grayscale opacity-30 pointer-events-none'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-[10px] font-black uppercase text-white">LM Studio Local Node</span></div>
              <button onClick={handleTestConnection} className="text-[7px] font-black text-slate-500 hover:text-white uppercase transition-all">Test Sync</button>
            </div>
            <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[9px] font-mono outline-none focus:border-indigo-500" value={localConfig.lmStudioEndpoint} onChange={e => setLocalConfig({ ...localConfig, lmStudioEndpoint: e.target.value })} />
            {testStatus !== 'idle' && <div className={`text-[8px] font-black uppercase ${testStatus === 'success' ? 'text-green-500' : 'text-red-500'}`}>{testStatus === 'success' ? 'Node Verified' : `Node Unreachable: ${testError}`}</div>}
          </div>

          <button onClick={save} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-black text-[9px] transition-all shadow-md uppercase tracking-[0.2em] active:scale-95">Synchronize Nexus Protocol</button>
        </div>
      </div>

      <div className="bg-red-950/10 border border-red-900/40 rounded-xl p-4 flex justify-between items-center">
        <h2 className="text-[9px] font-black uppercase text-red-500">Purge Protocol</h2>
        <button onClick={resetArchive} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md font-black text-[8px] transition-all uppercase tracking-widest">Wipe Local Archive</button>
      </div>
    </div>
  );
}

function AnalyticsView({ state }: any) {
  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-xs">
      <h2 className="text-lg font-black tracking-tighter uppercase text-white border-b border-slate-800 pb-2">Intelligence Saturation</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl shadow-xl">
          <h3 className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-6">Target Mention Density</h3>
          <div className="space-y-4">
            {state.pois.sort((a: any, b: any) => b.mentions.length - a.mentions.length).slice(0, 8).map((poi: any) => (
              <div key={poi.id} className="space-y-1">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500"><span>{poi.name}</span><span className="text-indigo-400">{poi.mentions.length} Mentions</span></div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden"><div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(poi.mentions.length / (state.documents.length || 1)) * 100}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-xl">
          <div className="text-5xl font-black text-indigo-500 drop-shadow-2xl">{state.pois.length}</div>
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mt-4">Verified Personas</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 shadow-lg relative group overflow-hidden">
      <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon as React.ReactElement, { size: 48 })}
      </div>
      <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{title}</p>
      <p className="text-2xl font-black tracking-tighter text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ProcessedDocument['status'] }) {
  const styles = {
    pending: 'bg-slate-800 text-slate-600',
    processing: 'bg-amber-500/10 text-amber-500 animate-pulse',
    completed: 'bg-green-500/10 text-green-500',
    error: 'bg-red-500/10 text-red-500'
  };
  return <span className={`px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-widest ${styles[status]}`}>{status}</span>;
}
