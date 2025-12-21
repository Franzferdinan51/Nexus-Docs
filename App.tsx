
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Upload, LayoutDashboard, Search, Users, BarChart3,
  Loader2, ChevronRight, AlertCircle, FolderOpen, Settings, MessageSquare,
  Trash2, RefreshCw, Star, Share2, ExternalLink, X,
  Database, ShieldCheck, BrainCircuit, RotateCcw, CheckCircle2, Zap, Key, Link2, HelpCircle, Info, Layers, ToggleLeft, ToggleRight, Cpu, MapPin, Building2, Eye, List, Grid, Calendar, ArrowUpDown, Landmark, Download, ArrowRight
} from 'lucide-react';
import { ProcessedDocument, AppState, POI, ChatMessage, Entity, DocumentAnalysis } from './types';
import { processPdf } from './services/pdfProcessor';
import { analyzeDocument, ragChat } from './services/geminiService';
import { analyzeWithLMStudio, testLMStudioConnection } from './services/lmStudioService';
import { analyzeWithOpenRouter } from './services/openRouterService';
import { saveDocument, getDocuments, clearDocuments } from './db';

declare const JSZip: any;

const STORAGE_KEY = 'epstein_nexus_v17_state';
const MAX_CONCURRENT_AGENTS = 2;

// Global file store to keep blobs out of state (prevents serialization issues)
let fileStore: Record<string, Blob> = {};

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Documents loaded from IDB later
      // Migration for Multi-Local Node Support
      const safeConfig = parsed.config || {};
      if (safeConfig.enabled?.lmstudio2 === undefined) {
        safeConfig.enabled = { ...(safeConfig.enabled || {}), lmstudio2: false, lmstudio: safeConfig.enabled?.lmstudio ?? false };
        safeConfig.priority = [...new Set([...(safeConfig.priority || ['gemini', 'openrouter', 'lmstudio']), 'lmstudio2'])];
        safeConfig.lmStudioModel = safeConfig.lmStudioModel || '';
        safeConfig.lmStudioModel2 = safeConfig.lmStudioModel2 || '';
        safeConfig.lmStudioEndpoint2 = safeConfig.lmStudioEndpoint2 || 'http://127.0.0.1:1234';
        safeConfig.preferredVerifier = safeConfig.preferredVerifier || 'auto';
      }
      // Ongoing safeguard: Deduplicate priority list on every load to fix existing corrupted states
      if (safeConfig.priority) safeConfig.priority = [...new Set(safeConfig.priority)];

      return {
        ...parsed,
        documents: [],
        isProcessing: false,
        view: parsed.view || 'dashboard',
        config: safeConfig,
        processingQueue: parsed.processingQueue || [] // Restore queue
      };
    }
    return {
      documents: [],
      pois: [],
      selectedDocId: null,
      isProcessing: false,
      view: 'dashboard',
      config: {
        priority: ['gemini', 'openrouter', 'lmstudio', 'lmstudio2'] as string[],
        enabled: { gemini: true, openrouter: false, lmstudio: false, lmstudio2: false },
        geminiKey: '',
        openRouterKey: '',
        lmStudioEndpoint: 'http://127.0.0.1:1234',
        lmStudioModel: '',
        lmStudioEndpoint2: 'http://127.0.0.1:1234',
        lmStudioModel2: '',
        preferredVerifier: 'auto' as const,
        geminiModel: 'gemini-1.5-flash',
        openRouterModel: 'google/gemini-2.0-flash-001',
        parallelAnalysis: false,
        dualCheckMode: false
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

  // Hoisted Provider Runner (Accessible by both Agents)
  const runProvider = useCallback(async (provider: string, t: string, i: string[], verificationTarget?: string, useSearch: boolean = false) => {
    const cfg = stateRef.current.config;
    let modelIdLog = '';
    if (provider === 'gemini') modelIdLog = cfg.geminiModel;
    else if (provider === 'openrouter') modelIdLog = cfg.openRouterModel;
    else if (provider === 'lmstudio') modelIdLog = cfg.lmStudioModel || 'Auto-Detect';
    else if (provider === 'lmstudio2') modelIdLog = cfg.lmStudioModel2 || 'Auto-Detect';

    console.log(`[Invoking ${provider}] Model: ${modelIdLog}`);
    if (provider === 'gemini') return analyzeDocument(t, i, cfg.geminiKey, cfg.geminiModel, verificationTarget, useSearch);
    if (provider === 'openrouter') return analyzeWithOpenRouter(t, i, cfg.openRouterKey, cfg.openRouterModel, verificationTarget);
    if (provider === 'lmstudio') return analyzeWithLMStudio(t, i, cfg.lmStudioEndpoint, verificationTarget, cfg.lmStudioModel, useSearch);
    if (provider === 'lmstudio2') return analyzeWithLMStudio(t, i, cfg.lmStudioEndpoint2, verificationTarget, cfg.lmStudioModel2, useSearch);
    throw new Error(`Unknown provider ${provider}`);
  }, []);

  const processDocumentAgent = useCallback(async (docId: string) => {
    // Remove from queue IMMEDIATELY to prevent double-processing and allow next item to start
    setState(prev => ({ ...prev, processingQueue: prev.processingQueue.filter(id => id !== docId) }));
    setActiveAgentsCount(prev => prev + 1);

    // Read from ref to get latest state (avoids stale closure)
    const currentState = stateRef.current;
    const doc = currentState.documents.find(d => d.id === docId);
    const blob = fileStore[docId];

    if (!doc || !blob) {
      // Already removed from queue
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

      // runProvider is now hoisted and available via closure or callback
      // ...

      if (config.parallelAnalysis && activeChain.length > 1) {
        showToast(`Running Parallel Swarm (${activeChain.length} nodes) on ${doc.name}...`);

        const results = await Promise.allSettled(activeChain.map(p =>
          runProvider(p, text, images).then(res => ({ provider: p, data: res }))
        ));

        // Log failures for debugging
        results.forEach((r, index) => {
          if (r.status === 'rejected') {
            console.error(`Parallel Agent [${activeChain[index]}] FAILED:`, r.reason);
          }
        });

        const successes = results
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<any>).value);

        if (successes.length === 0) {
          const errors = results.filter(r => r.status === 'rejected').map((r: any) => r.reason.message).join('; ');
          throw new Error(`All parallel agents failed: ${errors}`);
        }

        // Swarm Consensus Logic
        const primary = successes[0];
        const allEntities = successes.flatMap(s => s.data.entities.map((e: any) => ({ ...e, source: s.provider })));

        // Group by Normalized Name
        const entityMap = new Map();
        allEntities.forEach(e => {
          const key = e.name.toLowerCase();
          if (!entityMap.has(key)) entityMap.set(key, { ...e, sources: new Set([e.source]) });
          else entityMap.get(key).sources.add(e.source);
        });

        const consolidatedEntities = Array.from(entityMap.values()).map((e: any) => ({
          ...e,
          // Mark as 'Swarm Verified' if multiple agents found it
          context: e.sources.size > 1 ? `[SWARM CONFIRMED]: ${e.context}` : e.context,
          isFamous: e.isFamous || e.sources.size > 1 // Increase fame confidence if agreed upon
        }));

        analysis = {
          ...primary.data,
          summary: successes.map(s => `[${s.provider.toUpperCase()}]: ${s.data.summary}`).join('\n\n'),
          entities: consolidatedEntities,
          keyInsights: [...new Set(successes.flatMap(s => s.data.keyInsights))],
          flaggedPOIs: [...new Set(successes.flatMap(s => s.data.flaggedPOIs))],
          locations: [...new Set(successes.flatMap(s => s.data.locations || []))],
          organizations: [...new Set(successes.flatMap(s => s.data.organizations || []))],
          processedBy: `Swarm (${successes.map(s => s.provider).join('+')})`
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
      }

      if (!analysis) throw new Error("All active intelligence providers failed to return analysis.");

      analysis.processedBy = finalProvider;
      // Enhanced Double-Take Logic (Async Queue)
      // Check if we need verification, if so, mark as 'verifying' and exit. Main loop continues.
      let nextStatus: ProcessedDocument['status'] = 'completed';
      if (config.dualCheckMode && analysis) {
        const highValueTarget = analysis.entities.find(e => e.isFamous || /senator|president|governor|ambassador|prince/i.test(e.role));
        if (highValueTarget) {
          nextStatus = 'verifying'; // Hand off to Verification Agent
        }
      }




      // Ensure analysis uses undefined instead of null for compatibility with ProcessedDocument type
      const finalAnalysis = analysis || undefined;
      const finalLineage = lineage;

      console.log(`Final Analysis for ${doc.name}:`, finalAnalysis);

      setState(prev => {
        const updatedPois = [...prev.pois];
        if (finalAnalysis && finalAnalysis.entities) {
          finalAnalysis.entities.forEach((e: Entity) => {
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
            }
          });
        }

        const updatedDoc = {
          ...doc,
          content: text,
          images,
          analysis: finalAnalysis,
          status: nextStatus,
          isPOI: finalAnalysis?.entities?.some(ent => ent.isFamous) || false,
          lineage: finalLineage,
          contentBlob: blob
        };

        saveDocument(updatedDoc).catch(e => console.error("IDB Save Fail:", e));

        return {
          ...prev,
          documents: prev.documents.map(d => d.id === docId ? updatedDoc : d),
          pois: updatedPois
        };
      });

    } catch (err: any) {
      console.error(`Analysis failed for ${docId}:`, err);
      updateDocStatus(docId, 'error');
      showToast(`Error analyzing ${doc.name}: ${err.message.substring(0, 40)}`, "error");
      setState(prev => ({ ...prev }));
    } finally {
      setActiveAgentsCount(prev => prev - 1);
    }
  }, [updateDocStatus, runProvider]);

  // Verification Agent (Runs in background)
  const processVerificationAgent = useCallback(async (docId: string) => {
    const currentState = stateRef.current;
    const doc = currentState.documents.find(d => d.id === docId);
    const blob = fileStore[docId]; // Re-read blob (fast/local)
    if (!doc || !blob || !doc.analysis) return;

    try {
      const { text, images } = await processPdf(blob);
      const config = currentState.config;
      let analysis = { ...doc.analysis };
      let lineage = [...(doc.lineage || [])];

      const highValueTarget = analysis.entities.find((e: Entity) => e.isFamous || /senator|president|governor|ambassador|prince/i.test(e.role));

      if (config.dualCheckMode && highValueTarget) {
        let verifier = '';
        if (config.preferredVerifier && config.preferredVerifier !== 'auto' && config.enabled[config.preferredVerifier]) {
          verifier = config.preferredVerifier;
        } else {
          const activeChain = config.priority.filter(p => config.enabled[p]);
          verifier = activeChain[0] || 'gemini';
        }

        if (verifier) {
          showToast(`[BG] Verifying "${highValueTarget.name}" with ${verifier}...`);
          const verification = await runProvider(verifier, text, images, highValueTarget.name, verifier === 'gemini');
          if (verification && verification.entities.length > 0) {
            analysis.summary += `\n\n[VERIFICATION]: ${verifier} confirms presence of ${highValueTarget.name} (Web Grounding: ${verifier === 'gemini' ? 'Enabled' : 'N/A'}).`;
            lineage.push(`Verified by ${verifier}`);
          } else {
            analysis.summary += `\n\n[VERIFICATION]: ${verifier} could NOT verify ${highValueTarget.name}.`;
          }
        }
      }

      // Verify Complete -> Save as Completed
      const updatedDoc = {
        ...doc,
        analysis,
        lineage,
        status: 'completed' as const
      };
      saveDocument(updatedDoc);
      setState(prev => ({ ...prev, documents: prev.documents.map(d => d.id === docId ? updatedDoc : d) }));

    } catch (err) {
      console.error("Verification error:", err);
      updateDocStatus(docId, 'completed'); // Just complete it if verification fails
    }
  }, [runProvider, updateDocStatus]);

  // Secondary Loop: Watch for 'verifying' items
  const [verifyingIds, setVerifyingIds] = useState<string[]>([]);

  useEffect(() => {
    const candidates = state.documents.filter(d => d.status === 'verifying' && !verifyingIds.includes(d.id));
    if (candidates.length > 0 && verifyingIds.length < 2) {
      const target = candidates[0];
      setVerifyingIds(prev => [...prev, target.id]);
      processVerificationAgent(target.id).then(() => {
        setVerifyingIds(prev => prev.filter(id => id !== target.id));
      });
    }
  }, [state.documents, verifyingIds, processVerificationAgent]);

  // Main processing effect - ensures the agent starts when the queue or active count changes
  useEffect(() => {
    // Wait for documents to load from IDB before starting queue
    if (state.documents.length === 0 && state.processingQueue.length > 0) return;

    if (state.processingQueue.length > 0 && activeAgentsCount < MAX_CONCURRENT_AGENTS) {
      const nextId = state.processingQueue[0];
      // Break the synchronous render cycle
      const t = setTimeout(() => {
        processDocumentAgent(nextId);
      }, 50);
      return () => clearTimeout(t);
    }
  }, [state.processingQueue, activeAgentsCount, processDocumentAgent, state.documents.length]);

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
          const entries = Object.entries(zip.files)
            .filter(([filename, entry]) => !entry.dir && filename.toLowerCase().endsWith('.pdf'))
            .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' }));

          for (const [filename, zipEntry] of entries as [string, any][]) {
            const id = Math.random().toString(36).substr(2, 9);
            fileStore[id] = await (zipEntry as any).async('blob');
            newDocs.push({ id, name: filename, type: 'pdf', content: '', images: [], status: 'pending' });
            queueIds.push(id);
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

  const resetArchive = async () => {
    if (confirm("Permanently wipe local archive and all metadata?")) {
      fileStore = {};
      await clearDocuments();
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
          {state.view === 'pois' && <POIView state={state} setState={setState} shareToX={shareToX} />}
          {state.view === 'chat' && <AgentChatView state={state} chatInput={chatInput} setChatInput={setChatInput} handleChat={handleChat} />}
          {state.view === 'settings' && <SettingsView state={state} setState={setState} showToast={showToast} resetArchive={resetArchive} />}
          {state.view === 'analytics' && <AnalyticsView state={state} setState={setState} />}
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
  // Aggregate Insights
  const locations: Record<string, number> = {};
  const orgs: Record<string, number> = {};
  const evidence: Record<string, number> = {};
  const recentInsights: { text: string, docName: string, docId: string }[] = [];

  state.documents.forEach((d: any) => {
    if (d.status === 'completed' && d.analysis) {
      d.analysis.locations?.forEach((l: string) => locations[l] = (locations[l] || 0) + 1);
      d.analysis.organizations?.forEach((o: string) => orgs[o] = (orgs[o] || 0) + 1);
      if (d.analysis.evidenceType) evidence[d.analysis.evidenceType] = (evidence[d.analysis.evidenceType] || 0) + 1;

      // Capture insights reverse chronological (assuming doc processing order)
      d.analysis.keyInsights?.forEach((i: string) => recentInsights.push({
        text: i,
        docName: d.name,
        docId: d.id
      }));
    }
  });

  const topLocations = Object.entries(locations).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topOrgs = Object.entries(orgs).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const detectedTypes = Object.entries(evidence).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const latestSignals = recentInsights.slice(-6).reverse();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-baseline gap-3 border-b border-slate-800 pb-2">
        <h2 className="text-xl font-black tracking-tighter uppercase text-white">System Monitor</h2>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Shards" value={state.documents.length} icon={<Database />} />
        <StatCard title="Targets" value={state.pois.length} icon={<Users />} />
        <StatCard title="Analyzed" value={state.documents.filter((d: any) => d.status === 'completed').length} icon={<RefreshCw />} />
        <StatCard title="Queued" value={state.processingQueue.length} icon={<Loader2 />} />
      </div>

      {/* Primary Ops Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-4 shadow-xl">
          <h3 className="text-[10px] font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-slate-400"><Star className="text-yellow-500 w-3 h-3" /> Priority Intel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {state.documents.filter((d: any) => d.isPOI).slice(0, 4).map((doc: any) => (
              <div key={doc.id} onClick={() => setState((p: any) => ({ ...p, view: 'document_detail', selectedDocId: doc.id }))} className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/50 hover:border-indigo-500/50 cursor-pointer transition-all group">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[8px] text-indigo-300 truncate max-w-[150px] uppercase">{doc.name}</span>
                  <Zap className="w-2.5 h-2.5 text-indigo-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight italic">"{doc.analysis?.summary}"</p>
              </div>
            ))}
            {state.documents.filter((d: any) => d.isPOI).length === 0 && <div className="text-[10px] text-slate-600 italic col-span-2 text-center py-4">No high-priority targets identified yet.</div>}
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

      {/* Intelligence Aggregation Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Geographic Intel */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <h3 className="text-[9px] font-black mb-3 flex items-center gap-2 uppercase tracking-widest text-indigo-400"><MapPin className="w-3 h-3" /> Global Nexus</h3>
          <div className="space-y-2">
            {topLocations.map(([loc, count], i) => (
              <div key={i} className="flex justify-between items-center text-[9px] font-bold text-slate-300 border-b border-slate-800/50 pb-1 last:border-0">
                <span className="truncate uppercase">{loc}</span>
                <span className="bg-slate-800 text-slate-400 px-1.5 rounded-full">{count}</span>
              </div>
            ))}
            {topLocations.length === 0 && <div className="text-[9px] text-slate-600 italic">No location data derived.</div>}
          </div>
        </div>

        {/* Organization Network */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <h3 className="text-[9px] font-black mb-3 flex items-center gap-2 uppercase tracking-widest text-indigo-400"><Building2 className="w-3 h-3" /> Corporate Network</h3>
          <div className="space-y-2">
            {topOrgs.map(([org, count], i) => (
              <div key={i} className="flex justify-between items-center text-[9px] font-bold text-slate-300 border-b border-slate-800/50 pb-1 last:border-0">
                <span className="truncate uppercase">{org}</span>
                <span className="bg-slate-800 text-slate-400 px-1.5 rounded-full">{count}</span>
              </div>
            ))}
            {topOrgs.length === 0 && <div className="text-[9px] text-slate-600 italic">No entity groups identified.</div>}
          </div>
        </div>

        {/* Evidence Composition */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <h3 className="text-[9px] font-black mb-3 flex items-center gap-2 uppercase tracking-widest text-indigo-400"><Layers className="w-3 h-3" /> Archive Profile</h3>
          <div className="space-y-2">
            {detectedTypes.map(([type, count], i) => (
              <div key={i} className="flex justify-between items-center text-[9px] font-bold text-slate-300 border-b border-slate-800/50 pb-1 last:border-0">
                <span className="truncate uppercase">{type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${(count / (state.documents.length || 1)) * 100}%` }}></div>
                  </div>
                  <span className="text-slate-500 w-4">{count}</span>
                </div>
              </div>
            ))}
            {detectedTypes.length === 0 && <div className="text-[9px] text-slate-600 italic">No classification data.</div>}
          </div>
        </div>
      </div>

      {/* Live Signal Feed */}
      <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-4">
        <h3 className="text-[9px] font-black mb-3 flex items-center gap-2 uppercase tracking-widest text-indigo-400"><Zap className="w-3 h-3" /> Live Signal Feed</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {latestSignals.map((sig, i) => (
            <div key={i} onClick={() => setState((p: any) => ({ ...p, view: 'document_detail', selectedDocId: sig.docId }))} className="p-3 bg-slate-950 border border-slate-800 rounded hover:border-indigo-500/30 cursor-pointer group transition-all">
              <div className="text-[8px] font-bold text-indigo-500 mb-1 uppercase tracking-wider flex items-center gap-1 group-hover:text-indigo-400">
                <FileText className="w-2 h-2" /> {sig.docName}
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">"{sig.text}"</p>
            </div>
          ))}
          {latestSignals.length === 0 && <div className="text-[10px] text-slate-600 italic p-2">Awaiting incoming signals...</div>}
        </div>
      </div>

    </div>
  );
}

function DocumentsView({ state, setState, searchQuery, restartAnalysis }: any) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type' | 'status'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortDocs = (a: any, b: any) => {
    let valA, valB;
    switch (sortBy) {
      case 'name': valA = a.name; valB = b.name; break;
      case 'type': valA = a.analysis?.evidenceType || 'Unknown'; valB = b.analysis?.evidenceType || 'Unknown'; break;
      case 'status': valA = a.status; valB = b.status; break;
      case 'date':
        valA = a.analysis?.documentDate || '0000';
        valB = b.analysis?.documentDate || '0000';
        break;
      default: valA = a.name; valB = b.name;
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  };

  const filtered = state.documents
    .filter((d: any) => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.analysis?.summary || "").toLowerCase().includes(searchQuery.toLowerCase()))
    .sort(sortDocs);

  const toggleSort = (field: any) => {
    if (sortBy === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-end border-b border-slate-800 pb-2 gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tighter text-white flex items-center gap-2"><FolderOpen className="w-5 h-5 text-indigo-500" /> Fragment Repository</h2>
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex gap-4 mt-1">
            <span>{filtered.length} visible</span>
            <span className="text-indigo-400">Sorted by {sortBy}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button onClick={() => toggleSort('name')} className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${sortBy === 'name' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Name</button>
            <button onClick={() => toggleSort('date')} className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${sortBy === 'date' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Date</button>
            <button onClick={() => toggleSort('type')} className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${sortBy === 'type' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Type</button>
            <button onClick={() => toggleSort('status')} className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${sortBy === 'status' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Status</button>
            <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="px-1 ml-1 text-slate-400 hover:text-white"><ArrowUpDown className="w-3 h-3" /></button>
          </div>

          <div className="h-6 w-px bg-slate-800"></div>

          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}><Grid className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}><List className="w-3.5 h-3.5" /></button>
          </div>

          <button onClick={restartAnalysis} className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-[9px] font-black uppercase tracking-widest transition-all"><RotateCcw className="w-3 h-3" /> Retry All</button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filtered.map((doc: any) => (
            <div key={doc.id} className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-lg hover:bg-slate-800/60 transition-all cursor-pointer relative group" onClick={() => setState((p: any) => ({ ...p, view: 'document_detail', selectedDocId: doc.id }))}>
              {doc.isPOI && <div className="absolute top-0 right-0 w-1 h-full bg-indigo-600"></div>}
              <div className="flex justify-between items-start mb-2">
                <div className={`p-1.5 rounded ${doc.isPOI ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-50'}`}><FileText className="w-3.5 h-3.5" /></div>
                <StatusBadge status={doc.status} />
              </div>
              <div className="font-bold text-[9px] uppercase truncate mb-1 text-slate-200">{doc.name}</div>
              <div className="flex items-center gap-2 mb-2">
                {doc.analysis?.evidenceType && <span className="px-1.5 py-0.5 bg-indigo-900/30 border border-indigo-500/20 rounded text-[7px] font-bold uppercase text-indigo-300 truncate max-w-[80px]">{doc.analysis.evidenceType}</span>}
                {doc.analysis?.documentDate && <span className="flex items-center gap-1 text-[8px] text-slate-500 font-bold"><Calendar className="w-2.5 h-2.5" /> {doc.analysis.documentDate}</span>}
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2 italic leading-tight">{doc.analysis?.summary || "Awaiting deconstruction..."}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-950 border-b border-slate-800 text-[8px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="p-3">Document</th>
                <th className="p-3">Class</th>
                <th className="p-3">Date Info</th>
                <th className="p-3">Findings</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((doc: any) => (
                <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded shrink-0 ${doc.isPOI ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}><FileText className="w-3.5 h-3.5" /></div>
                      <div>
                        <div className="font-bold text-[10px] text-white uppercase truncate max-w-[200px]">{doc.name}</div>
                        <div className="text-[8px] text-slate-500 font-mono">{doc.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    {doc.analysis?.evidenceType ? (
                      <span className="px-2 py-0.5 bg-indigo-900/30 border border-indigo-500/30 rounded text-[8px] font-bold uppercase text-indigo-300">{doc.analysis.evidenceType}</span>
                    ) : <span className="text-[8px] text-slate-600 italic">Unclassified</span>}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      {doc.analysis?.documentDate || "Unknown"}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      {doc.analysis?.locations?.length > 0 && <div className="flex items-center gap-1 text-[8px] text-slate-400"><MapPin className="w-2.5 h-2.5" /> {doc.analysis.locations.length} Locations</div>}
                      {doc.analysis?.organizations?.length > 0 && <div className="flex items-center gap-1 text-[8px] text-slate-400"><Building2 className="w-2.5 h-2.5" /> {doc.analysis.organizations.length} Groups</div>}
                    </div>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => setState((p: any) => ({ ...p, view: 'document_detail', selectedDocId: doc.id }))} className="px-3 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white border border-slate-700 rounded text-[8px] font-black uppercase tracking-widest transition-all">Inspect</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
                <div className="grid grid-cols-2 gap-4">
                  <section>
                    <h4 className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin className="w-3 h-3" /> Geographic Intel</h4>
                    <div className="flex flex-wrap gap-2">
                      {doc.analysis?.locations?.map((loc: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[9px] text-slate-300 font-bold uppercase">{loc}</span>
                      ))}
                      {(!doc.analysis?.locations || doc.analysis.locations.length === 0) && <span className="text-[9px] text-slate-600 italic">No locations extracted</span>}
                    </div>
                  </section>
                  <section>
                    <h4 className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Building2 className="w-3 h-3" /> Entity Groups</h4>
                    <div className="flex flex-wrap gap-2">
                      {doc.analysis?.organizations?.map((org: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[9px] text-slate-300 font-bold uppercase">{org}</span>
                      ))}
                      {(!doc.analysis?.organizations || doc.analysis.organizations.length === 0) && <span className="text-[9px] text-slate-600 italic">No organizations extracted</span>}
                    </div>
                  </section>
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
                  {doc.analysis?.visualObjects && doc.analysis.visualObjects.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {doc.analysis.visualObjects.map((obj: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-indigo-900/40 border border-indigo-500/30 rounded text-[9px] text-indigo-200 font-bold uppercase flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> {obj}</span>
                      ))}
                    </div>
                  )}
                  {doc.analysis?.evidenceType && (
                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Document Classification</span>
                      <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/50 rounded-full text-[9px] font-black uppercase text-indigo-300 tracking-widest">{doc.analysis.evidenceType}</span>
                    </div>
                  )}
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

function POIView({ state, setState, shareToX }: any) {
  const [sortBy, setSortBy] = useState<'mentions' | 'name'>('mentions');
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<{ name: string, type: 'person' } | null>(null);

  const filtered = state.pois
    .filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => {
      if (sortBy === 'mentions') return b.mentions.length - a.mentions.length;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-xs pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-end border-b border-slate-800 pb-2 gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tighter uppercase text-white flex items-center gap-3"><Users className="w-5 h-5 text-indigo-600" /> Target Network</h2>
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex gap-4 mt-1">
            <span>{filtered.length} Targets Verified</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1.5 text-slate-500" />
            <input type="text" placeholder="Filter targets..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-900 border border-slate-800 rounded pl-7 pr-2 py-1 text-[9px] font-bold uppercase text-white outline-none focus:border-indigo-500 w-32 md:w-48" />
          </div>
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button onClick={() => setSortBy('mentions')} className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all ${sortBy === 'mentions' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Significance</button>
            <button onClick={() => setSortBy('name')} className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all ${sortBy === 'name' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Alpha</button>
          </div>
        </div>
      </div>

      {selectedEntity && <DossierModal state={state} setState={setState} entity={selectedEntity} onClose={() => setSelectedEntity(null)} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filtered.map((poi: any) => (
          <div key={poi.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col hover:border-indigo-600/40 transition-all group relative overflow-hidden">
            <div
              onClick={() => setSelectedEntity({ name: poi.name, type: 'person' })}
              className={`absolute top-0 right-0 p-1.5 bg-slate-950/50 rounded-bl-lg border-l border-b border-slate-800/50 text-[8px] font-black cursor-pointer hover:text-white transition-colors ${poi.mentions.length > 5 ? 'text-indigo-400' : 'text-slate-600'}`}>
              REF: {poi.mentions.length}
            </div>
            <h3
              onClick={() => setSelectedEntity({ name: poi.name, type: 'person' })}
              className="text-sm font-black mb-1 leading-none uppercase text-white truncate pr-8 cursor-pointer hover:text-indigo-400 transition-colors"
              title={poi.name}>
              {poi.name}
            </h3>
            <div className="w-8 h-1 bg-indigo-600 rounded-full mb-4"></div>

            <div className="space-y-2 flex-1">
              {poi.mentions.slice(0, 3).map((m: any, idx: number) => (
                <div key={idx}
                  onClick={(e) => { e.stopPropagation(); setState((p: any) => ({ ...p, view: 'document_detail', selectedDocId: m.docId })); }}
                  className="p-2 bg-slate-950/60 rounded border border-slate-800 text-[9px] group/item hover:border-indigo-500/50 cursor-pointer transition-all">
                  <div className="flex items-center gap-1.5 mb-1.5 text-indigo-400 font-bold uppercase tracking-wide border-b border-white/5 pb-1">
                    <FileText className="w-2.5 h-2.5" />
                    <span className="truncate flex-1">{m.docName}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-slate-400 italic leading-tight line-clamp-2">"{m.context}"</div>
                </div>
              ))}
            </div>

            {poi.mentions.length > 3 && (
              <button
                onClick={() => setSelectedEntity({ name: poi.name, type: 'person' })}
                className="mt-3 w-full py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded text-[9px] font-black uppercase tracking-widest transition-all">
                View All {poi.mentions.length} References
              </button>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-20 text-slate-600 font-black uppercase tracking-widest text-xs">No targets match filter protocol.</div>}
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
  const GEMINI_PRESETS = ['gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'];
  const OPENROUTER_PRESETS = ['meta-llama/llama-3-8b-instruct:free', 'anthropic/claude-3-haiku', 'openai/gpt-4o-mini', 'google/gemini-2.0-flash-001'];

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
                    {p === 'lmstudio' ? 'Local Model A' : p === 'lmstudio2' ? 'Local Model B' : p}
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
            <div className={`p-4 bg-indigo-600/5 border border-indigo-500/20 rounded-xl flex flex-col gap-3 ${localConfig.dualCheckMode ? 'opacity-100' : 'opacity-80'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-indigo-500" /><div><div className="font-black text-[10px] uppercase text-white">Dual Check Mode</div><div className="text-[7px] text-slate-500 uppercase tracking-widest">Verify high-profile targets</div></div></div>
                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={localConfig.dualCheckMode} onChange={e => setLocalConfig({ ...localConfig, dualCheckMode: e.target.checked })} className="sr-only peer" /><div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div></label>
              </div>
              {localConfig.dualCheckMode && (
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[7px] font-black uppercase text-slate-500">Verifier Agent:</span>
                  <select
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[8px] font-black uppercase text-indigo-400 outline-none focus:border-indigo-500"
                    value={localConfig.preferredVerifier || 'auto'}
                    onChange={e => setLocalConfig({ ...localConfig, preferredVerifier: e.target.value as any })}
                  >
                    <option value="auto">Auto (Best Available)</option>
                    <option value="gemini">Gemini (Web Search)</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="lmstudio">Model A</option>
                    <option value="lmstudio2">Model B</option>
                  </select>
                </div>
              )}
            </div>

            {/* Parallel Mode */}
            <div className="p-4 bg-indigo-600/5 border border-indigo-500/20 rounded-xl flex justify-between items-center">
              <div className="flex items-center gap-3"><Cpu className="w-5 h-5 text-indigo-500" /><div><div className="font-black text-[10px] uppercase text-white">Parallel Swarm</div><div className="text-[7px] text-slate-500 uppercase tracking-widest">Simultaneous execution</div></div></div>
              <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={localConfig.parallelAnalysis} onChange={e => setLocalConfig({ ...localConfig, parallelAnalysis: e.target.checked })} className="sr-only peer" /><div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div></label>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gemini Config */}
            <div className={`p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4 transition-all ${localConfig.enabled.gemini ? 'border-indigo-500/20' : 'grayscale opacity-30 pointer-events-none'}`}>
              <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[10px] font-black uppercase text-white">Gemini Settings</span></div>
              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-slate-500">API Key (Overrides Env)</label>
                <input type="password" placeholder="AIza..." className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[9px] outline-none focus:border-indigo-500" value={localConfig.geminiKey || ''} onChange={e => setLocalConfig({ ...localConfig, geminiKey: e.target.value })} />
              </div>
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
                      value={localConfig.geminiModel}
                      onChange={e => setLocalConfig({ ...localConfig, geminiModel: e.target.value })}
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
                      value={localConfig.openRouterModel}
                      onChange={e => setLocalConfig({ ...localConfig, openRouterModel: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4 transition-all ${localConfig.enabled.lmstudio ? 'border-indigo-500/20' : 'grayscale opacity-30 pointer-events-none'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-[10px] font-black uppercase text-white">Local Model A (Port 1234)</span></div>
              <button onClick={handleTestConnection} className="text-[7px] font-black text-slate-500 hover:text-white uppercase transition-all">Test Sync</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-slate-500">Endpoint</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[9px] font-mono outline-none focus:border-indigo-500" value={localConfig.lmStudioEndpoint} onChange={e => setLocalConfig({ ...localConfig, lmStudioEndpoint: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-slate-500">Model ID (Optional)</label>
                <input type="text" placeholder="Auto-Load" className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[9px] font-mono outline-none focus:border-indigo-500" value={localConfig.lmStudioModel} onChange={e => setLocalConfig({ ...localConfig, lmStudioModel: e.target.value })} />
              </div>
            </div>
            {testStatus !== 'idle' && <div className={`text-[8px] font-black uppercase ${testStatus === 'success' ? 'text-green-500' : 'text-red-500'}`}>{testStatus === 'success' ? 'Node Verified' : `Node Unreachable: ${testError}`}</div>}
          </div>

          <div className={`p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4 transition-all ${localConfig.enabled.lmstudio2 ? 'border-indigo-500/20' : 'grayscale opacity-30 pointer-events-none'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black uppercase text-white">Local Model B (Port 1234)</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-slate-500">Endpoint</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[9px] font-mono outline-none focus:border-indigo-500" value={localConfig.lmStudioEndpoint2 || 'http://127.0.0.1:1234'} onChange={e => setLocalConfig({ ...localConfig, lmStudioEndpoint2: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-slate-500">Model ID (Optional)</label>
                <input type="text" placeholder="Auto-Load" className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[9px] font-mono outline-none focus:border-indigo-500" value={localConfig.lmStudioModel2 || ''} onChange={e => setLocalConfig({ ...localConfig, lmStudioModel2: e.target.value })} />
              </div>
            </div>
          </div>

          <button onClick={save} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-black text-[9px] transition-all shadow-md uppercase tracking-[0.2em] active:scale-95">Synchronize Nexus Protocol</button>
        </div>
      </div >

      <div className="bg-red-950/10 border border-red-900/40 rounded-xl p-4 flex justify-between items-center">
        <h2 className="text-[9px] font-black uppercase text-red-500">Purge Protocol</h2>
        <button onClick={resetArchive} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md font-black text-[8px] transition-all uppercase tracking-widest">Wipe Local Archive</button>
      </div>
    </div >
  );
}

function AnalyticsView({ state, setState }: any) {
  const [selectedEntity, setSelectedEntity] = useState<{ name: string, type: 'person' | 'location' | 'org' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);

  // Compute aggregations
  const evidence: Record<string, number> = {};
  const locations: Record<string, number> = {};
  const orgs: Record<string, number> = {};
  const politicalFigures: Map<string, { count: number, roles: Set<string> }> = new Map();
  const keywords = ['senat', 'gov', 'president', 'minister', 'ambassador', 'judge', 'general', 'mayor', 'rep', 'sec', 'official', 'prosecutor', 'politician', 'congress', 'prince', 'duke', 'royal', 'chief'];

  state.documents.forEach((d: any) => {
    if (d.status === 'completed' && d.analysis) {
      if (d.analysis.evidenceType) evidence[d.analysis.evidenceType] = (evidence[d.analysis.evidenceType] || 0) + 1;
      d.analysis.locations?.forEach((l: string) => locations[l] = (locations[l] || 0) + 1);
      d.analysis.organizations?.forEach((o: string) => orgs[o] = (orgs[o] || 0) + 1);

      // Political Filter
      d.analysis.entities?.forEach((e: Entity) => {
        const role = (e.role || '').toLowerCase();
        const name = e.name.toLowerCase();
        const isPolitical = e.isFamous || keywords.some(k => role.includes(k) || name.includes(k));

        if (isPolitical) {
          const entry = politicalFigures.get(e.name) || { count: 0, roles: new Set() };
          entry.count++;
          if (e.role) entry.roles.add(e.role);
          politicalFigures.set(e.name, entry);
        }
      });
    }
  });

  const sortedEvidence = Object.entries(evidence).sort((a, b) => b[1] - a[1]);
  const sortedLocations = Object.entries(locations).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const sortedOrgs = Object.entries(orgs).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const sortedPolitical = Array.from(politicalFigures.entries())
    .map(([name, data]) => ({ name, count: data.count, role: Array.from(data.roles)[0] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50); // Extended limit from 8 to 50
  const maxCount = Math.max(...sortedEvidence.map(e => e[1]), 1);

  const exportReport = () => {
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>NEXUS INTELLIGENCE | CASE FILE</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;900&display=swap');
          :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --accent: #6366f1; --accent-dim: #4338ca; --muted: #94a3b8; }
          body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); padding: 40px; }
          .container { max-width: 1000px; margin: 0 auto; }
          .header { border-bottom: 2px solid var(--accent); padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: end; }
          h1 { font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 900; letter-spacing: -1px; margin: 0; color: var(--accent); text-transform: uppercase; }
          .case-id { font-family: 'JetBrains Mono', monospace; color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: 2px; }
          
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
          .stat-card { background: var(--card); padding: 20px; border-radius: 8px; border: 1px solid #334155; }
          .stat-val { font-size: 32px; font-weight: 900; line-height: 1; margin-bottom: 5px; }
          .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); font-weight: 700; }

          h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-top: 50px; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
          
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { text-align: left; color: var(--muted); text-transform: uppercase; font-size: 10px; letter-spacing: 1px; padding: 12px; border-bottom: 1px solid #334155; }
          td { padding: 12px; border-bottom: 1px solid #334155; color: #cbd5e1; }
          tr:last-child td { border-bottom: none; }
          .tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
          .tag-high { background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.4); }
          .tag-std { background: #334155; color: #94a3b8; }
          
          @media print {
            body { background: white; color: black; }
            .stat-card { border: 1px solid #ccc; background: white; color: black; }
            h1, h2, .stat-val { color: black; }
            th { color: #666; }
            td { color: black; border-bottom: 1px solid #eee; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="case-id">CONFIDENTIAL // INTELLIGENCE DOSSIER // EYES ONLY</div>
              <h1>Nexus Intelligence Report</h1>
            </div>
            <div class="case-id">
              DATE: ${new Date().toLocaleString().toUpperCase()}<br>
              CASE ID: ${Math.random().toString(36).substr(2, 6).toUpperCase()}
            </div>
          </div>

          <div class="grid">
            <div class="stat-card"><div class="stat-val">${state.documents.length}</div><div class="stat-label">Documents Analyzed</div></div>
            <div class="stat-card"><div class="stat-val">${state.pois.length}</div><div class="stat-label">Verified Individuals</div></div>
            <div class="stat-card"><div class="stat-val">${Object.keys(orgs).length}</div><div class="stat-label">Unique Entities</div></div>
          </div>

          <h2><span style="color: #6366f1">///</span> Verified Individuals Ledger</h2>
          <table>
            <thead><tr><th>Subject Name</th><th>Classification</th><th>Reference Count</th><th>Primary Role</th></tr></thead>
            <tbody>
              ${[...state.pois].sort((a: any, b: any) => b.mentions.length - a.mentions.length).map((p: any) => `
                <tr>
                  <td style="font-weight: 800">${p.name.toUpperCase()}</td>
                  <td><span class="tag ${p.isPolitical ? 'tag-high' : 'tag-std'}">${p.isPolitical ? 'HIGH PRIORITY' : 'STANDARD'}</span></td>
                  <td style="font-family: 'JetBrains Mono'; font-weight: 700">${p.mentions.length}</td>
                  <td>${state.documents.find((d: any) => d.analysis?.entities?.find((e: any) => e.name === p.name))?.analysis?.entities?.find((e: any) => e.name === p.name)?.role || 'Unknown'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2><span style="color: #6366f1">///</span> Political & Government Matrix</h2>
          <table>
            <thead><tr><th>Subject Name</th><th>Role</th><th>Ref Count</th></tr></thead>
            <tbody>
              ${sortedPolitical.map(p => `<tr><td style="font-weight:700">${p.name}</td><td>${p.role || 'Unknown'}</td><td>${p.count}</td></tr>`).join('')}
            </tbody>
          </table>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div>
              <h2><span style="color: #6366f1">///</span> Geographic Nodes</h2>
               <table>
                <thead><tr><th>Location</th><th>Freq</th></tr></thead>
                <tbody>
                  ${sortedLocations.map(l => `<tr><td style="font-weight:600">${l[0]}</td><td>${l[1]}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
            <div>
              <h2><span style="color: #6366f1">///</span> Key Organizations</h2>
               <table>
                <thead><tr><th>Organization</th><th>Freq</th></tr></thead>
                <tbody>
                  ${sortedOrgs.map(o => `<tr><td style="font-weight:600">${o[0]}</td><td>${o[1]}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </body>
    </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-intel-report-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-xs pb-20">
      <div className="flex justify-between items-end border-b border-slate-800 pb-2">
        <h2 className="text-lg font-black tracking-tighter uppercase text-white flex items-center gap-3"><BarChart3 className="w-5 h-5 text-indigo-600" /> Deep Analytics</h2>
        <button onClick={exportReport} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all shadow-lg active:scale-95">
          <Download className="w-3.5 h-3.5" /> Export Report
        </button>
      </div>

      {selectedEntity && <DossierModal state={state} setState={setState} entity={selectedEntity} onClose={() => setSelectedEntity(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-xl">
          <div className="text-5xl font-black text-indigo-500 drop-shadow-2xl">{state.pois.length}</div>
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mt-4">Verified Individuals</div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-xl">
          <div className="text-5xl font-black text-slate-200 drop-shadow-2xl">{Object.keys(locations).length}</div>
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mt-4">Global Nodes</div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-xl">
          <div className="text-5xl font-black text-slate-200 drop-shadow-2xl">{Object.keys(orgs).length}</div>
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mt-4">Entities</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Political Matrix (Primary, col-span-2) */}
        <div className="lg:col-span-2 bg-indigo-950/20 border border-indigo-500/20 p-5 rounded-xl h-fit">
          <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Landmark className="w-3 h-3" /> Political & Government Ties</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
            {sortedPolitical.map((p, i) => (
              <div key={i} onClick={() => setSelectedEntity({ name: p.name, type: 'person' })} className="bg-slate-950/60 p-3 rounded border border-indigo-500/10 hover:border-indigo-500/50 hover:bg-indigo-900/10 cursor-pointer transition-all group h-fit">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-1.5 bg-indigo-500/20 rounded text-indigo-400"><Star className="w-3 h-3" /></div>
                  <div className="text-[9px] font-black text-slate-500 uppercase group-hover:text-indigo-400">REF: {p.count}</div>
                </div>
                <div className="font-bold text-white text-[10px] uppercase truncate mb-1 group-hover:text-indigo-200">{p.name}</div>
                <div className="text-[8px] text-slate-400 uppercase tracking-wider truncate">{p.role || 'High Profile'}</div>
              </div>
            ))}
            {sortedPolitical.length === 0 && <div className="col-span-4 text-center py-6 text-slate-600 italic">No government or political ties detected in current dataset.</div>}
          </div>
        </div>

        {/* Archive Composition (Secondary, col-span-1, Collapsible) */}
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl shadow-xl h-fit">
          <div className="flex justify-between items-center mb-6 cursor-pointer" onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}>
            <h3 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2"><Layers className="w-3 h-3" /> Archive Composition</h3>
            <button className="text-slate-500 hover:text-white transition-colors">
              {isArchiveExpanded ? <ChevronRight className="w-4 h-4 rotate-90 transition-transform" /> : <ChevronRight className="w-4 h-4 transition-transform" />}
            </button>
          </div>

          {isArchiveExpanded ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              {sortedEvidence.map(([type, count], i) => (
                <div key={i} className="group">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                    <span>{type}</span>
                    <span className="text-white">{count} ({Math.round((count / (state.documents.length || 1)) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out group-hover:bg-indigo-500" style={{ width: `${(count / maxCount) * 100}%` }}></div>
                  </div>
                </div>
              ))}
              {sortedEvidence.length === 0 && <div className="text-center py-10 text-slate-600 italic">No classified evidence found.</div>}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortedEvidence.slice(0, 4).map(([type, count], i) => (
                <span key={i} className="bg-slate-950 border border-slate-800 px-2 py-1 rounded text-[9px] font-bold text-slate-400 uppercase">{type}: <span className="text-indigo-400">{count}</span></span>
              ))}
              <span className="text-[9px] text-slate-600 italic self-center ml-1">...</span>
            </div>
          )}
        </div>
      </div>

      {/* Verified Individuals Ledger */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><Users className="w-3 h-3" /> Verified Individuals Ledger</h3>
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1.5" />
            <input
              type="text"
              placeholder="FILTER SUBJECTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded text-[9px] font-bold text-white pl-7 pr-3 py-1 uppercase tracking-wider focus:outline-none focus:border-indigo-500 w-48 placeholder-slate-700 transition-all focus:w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[8px] uppercase tracking-widest text-slate-500">
                <th className="p-2 font-black">Subject Name</th>
                <th className="p-2 font-black">Classification</th>
                <th className="p-2 font-black text-right">Reference Count</th>
                <th className="p-2 font-black text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {[...state.pois]
                .filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.role && p.role.toLowerCase().includes(searchTerm.toLowerCase())))
                .sort((a: any, b: any) => b.mentions.length - a.mentions.length)
                .map((p: any, i: number) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                    <td className="p-2 font-bold text-slate-200 text-[10px]">{p.name}</td>
                    <td className="p-2 text-[9px] text-slate-400 font-mono">{p.isPolitical ? 'HIGH PRIORITY' : 'Standard Subject'}</td>
                    <td className="p-2 text-[10px] font-mono text-indigo-400 text-right font-bold">{p.mentions.length}</td>
                    <td className="p-2 text-right">
                      <button onClick={() => setSelectedEntity({ name: p.name, type: 'person' })} className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors">
                        View Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              {state.pois.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-600 italic">No verified individuals recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Locations */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl">
          <h3 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin className="w-3 h-3" /> Geographic Hotspots</h3>
          <div className="space-y-1">
            {sortedLocations.map(([loc, count], i) => (
              <div key={i} onClick={() => setSelectedEntity({ name: loc, type: 'location' })} className="flex justify-between items-center p-2 rounded hover:bg-slate-800/80 transition-colors cursor-pointer group">
                <span className="text-[10px] font-bold text-slate-300 uppercase truncate group-hover:text-white">{i + 1}. {loc}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-slate-900 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full" style={{ width: `${(count / (sortedLocations[0]?.[1] || 1)) * 100}%` }}></div></div>
                  <span className="text-[9px] font-mono text-slate-500 w-4 text-right group-hover:text-indigo-400">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Orgs */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl">
          <h3 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Building2 className="w-3 h-3" /> Corporate Structures</h3>
          <div className="space-y-1">
            {sortedOrgs.map(([org, count], i) => (
              <div key={i} onClick={() => setSelectedEntity({ name: org, type: 'org' })} className="flex justify-between items-center p-2 rounded hover:bg-slate-800/80 transition-colors cursor-pointer group">
                <span className="text-[10px] font-bold text-slate-300 uppercase truncate group-hover:text-white">{i + 1}. {org}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-slate-900 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full" style={{ width: `${(count / (sortedOrgs[0]?.[1] || 1)) * 100}%` }}></div></div>
                  <span className="text-[9px] font-mono text-slate-500 w-4 text-right group-hover:text-indigo-400">{count}</span>
                </div>
              </div>
            ))}
          </div>
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
    verifying: 'bg-indigo-500/10 text-indigo-500 animate-pulse',
    completed: 'bg-green-500/10 text-green-500',
    error: 'bg-red-500/10 text-red-500'
  };
  return <span className={`px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-widest ${styles[status]}`}>{status}</span>;
}

function DossierModal({ state, entity, onClose, setState }: any) {
  const [mentions, setMentions] = useState<any[]>([]);

  useEffect(() => {
    const hits: any[] = [];
    const term = entity.name.toLowerCase();

    state.documents.forEach((d: any) => {
      if (d.status !== 'completed' || !d.content) return;

      let context = '';
      let confidence = 'low';

      // 1. Check strict entities list first
      const entParams = d.analysis?.entities?.find((e: any) => e.name.toLowerCase().includes(term));
      if (entParams) {
        context = entParams.context || entParams.role;
        confidence = 'high';
      }
      // 2. Check content (regex search) for Locs/Orgs/Direct mentions
      else {
        const idx = d.content.toLowerCase().indexOf(term);
        if (idx !== -1) {
          const start = Math.max(0, idx - 50);
          const end = Math.min(d.content.length, idx + term.length + 50);
          context = "..." + d.content.substring(start, end).replace(/\n/g, ' ') + "...";
          confidence = 'medium';
        }
      }

      if (context) {
        hits.push({
          docId: d.id,
          docName: d.name,
          date: d.analysis?.documentDate || 'Unknown Date',
          context,
          confidence
        });
      }
    });
    setMentions(hits);
  }, [entity, state.documents]);

  const openDoc = (id: string) => {
    setState((prev: any) => ({ ...prev, selectedDocId: id, view: 'document_detail' }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Intelligence Dossier</div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">{entity.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-3">
          <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-500 mb-2">
            <span>Verified Mentions ({mentions.length})</span>
            <span>Signal Strength</span>
          </div>

          {mentions.map((hit, i) => (
            <div key={i} className="bg-slate-950/50 border border-slate-800/50 p-4 rounded-lg hover:border-indigo-500/30 transition-all group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">{hit.docName}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${hit.confidence === 'high' ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'}`}>{hit.confidence} Conf</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-mono bg-slate-900/50 p-2 rounded border border-white/5">"{hit.context}"</p>
              <div className="mt-2 flex justify-end">
                <button onClick={() => openDoc(hit.docId)} className="text-[8px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Inspect Source <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
          {mentions.length === 0 && <div className="text-center py-10 text-slate-500 italic">Accessing archive index...</div>}
        </div>
      </div>
    </div>
  );
}
