import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, CheckCircle2, AlertCircle, Clock, 
  Layers, Activity, Shield, DollarSign, Sun, Moon, 
  RefreshCw, Zap, Server, ChevronRight, Terminal, BarChart2
} from 'lucide-react';
import { api, DocumentTask, BackendVersionInfo } from './api';
import { UserProfile, getMockEnterpriseProfile } from './keycloak';

export function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile>(getMockEnterpriseProfile('TENANT_ADMIN'));
  const [backendVersion, setBackendVersion] = useState<BackendVersionInfo>({ service: 'docuprocess-backend', version: 'Detectando...', status: 'UP' });
  const [documents, setDocuments] = useState<DocumentTask[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('INVOICE');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedDoc, setSelectedDoc] = useState<DocumentTask | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationLog, setSimulationLog] = useState<string | null>(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial load and periodic refresh
  const refreshData = async () => {
    const [ver, docs] = await Promise.all([
      api.getVersion(),
      api.listDocuments(user.tenantId)
    ]);
    setBackendVersion(ver);
    setDocuments(docs);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 4000);
    return () => clearInterval(interval);
  }, [user.tenantId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(20);

      const task = await api.uploadDocument(selectedFile, documentType, user.tenantId);
      setUploadProgress(60);

      // Poll until task completes
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const current = await api.getStatus(task.id);
        if (current.status === 'SUCCESS' || current.status === 'FAILED' || attempts > 15) {
          clearInterval(poll);
          setUploadProgress(100);
          setIsUploading(false);
          setSelectedFile(null);
          refreshData();
        } else {
          setUploadProgress(Math.min(95, 60 + attempts * 5));
        }
      }, 500);

    } catch (err: any) {
      setIsUploading(false);
      alert('Error en subida: ' + err.message);
    }
  };

  const handleSimulateBatch = async () => {
    setSimulating(true);
    setSimulationLog('Inyectando lote de 12 documentos asíncronos para saturar colas...');
    try {
      const res = await api.simulateWorkload(12, 450, user.tenantId);
      setSimulationLog(`Lote generado con éxito (${res.injectedCount} docs). Monitoreando escalado HPA.`);
      await refreshData();
    } catch (e: any) {
      setSimulationLog('Fallo de simulación: ' + e.message);
    } finally {
      setTimeout(() => setSimulating(false), 3000);
    }
  };

  const handleSimulateCpu = async () => {
    setSimulating(true);
    setSimulationLog('Disparando carga de CPU transitoria (1800ms) para probar trigger de HPA...');
    try {
      await api.simulateCpuSpike(1800);
      setSimulationLog('Carga de cómputo completada. Verifique métricas USE en Grafana.');
    } catch (e: any) {
      setSimulationLog('Fallo: ' + e.message);
    } finally {
      setTimeout(() => setSimulating(false), 3000);
    }
  };

  const completedCount = documents.filter(d => d.status === 'SUCCESS').length;
  const successRate = documents.length > 0 ? ((completedCount / documents.length) * 100).toFixed(1) : '100.0';
  const avgDuration = documents.length > 0 && completedCount > 0
    ? (documents.filter(d => d.processingDurationMs).reduce((acc, cur) => acc + (cur.processingDurationMs || 0), 0) / completedCount).toFixed(0)
    : '380';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Layers className="w-5 h-5 animate-pulse-slow" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                DocuProcess Cloud
              </span>
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                SaaS Enterprise
              </span>
            </div>
          </div>

          {/* Canary Backend Version Indicator */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <Server className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-500 dark:text-slate-400">Backend Pod:</span>
            <span className={`font-mono font-semibold ${backendVersion.version.includes('2.') ? 'text-amber-500' : 'text-emerald-500'}`}>
              {backendVersion.version}
            </span>
            {backendVersion.version.includes('2.') ? (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold">CANARY</span>
            ) : (
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">STABLE</span>
            )}
          </div>

          {/* User Controls & External Portals */}
          <div className="flex items-center space-x-3">
            
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition"
              title="Alternar Modo Oscuro"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Role Switcher Demo */}
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <select 
                value={user.roles[0]} 
                onChange={(e) => setUser(getMockEnterpriseProfile(e.target.value as any))}
                className="bg-transparent border-none text-xs font-medium focus:ring-0 cursor-pointer text-slate-700 dark:text-slate-200"
              >
                <option value="TENANT_ADMIN">Admin (TENANT_ADMIN)</option>
                <option value="DOCUMENT_OPERATOR">Operador (OPERATOR)</option>
                <option value="AUDITOR">Auditor (AUDITOR)</option>
              </select>
            </div>

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {user.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        
        {/* Executive KPI Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Documentos Ingeridos</span>
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold font-mono">{documents.length}</div>
            <div className="mt-1 flex items-center text-xs text-emerald-500">
              <span className="font-semibold">+100%</span>
              <span className="ml-1 text-slate-400">flujo asíncrono</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Tasa de Éxito RED</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono">{successRate}%</div>
            <div className="mt-1 flex items-center text-xs text-slate-400">
              <span>{completedCount} procesados exitosamente</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Latencia Media (P50)</span>
              <Clock className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-bold font-mono">{avgDuration} <span className="text-sm font-normal text-slate-400">ms</span></div>
            <div className="mt-1 flex items-center text-xs text-slate-400">
              <span>Modelo RED Duration</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Tenant Enterprise</span>
              <Shield className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-lg font-bold truncate text-indigo-500">{user.tenantId}</div>
            <div className="mt-1 flex items-center text-xs text-slate-400">
              <span>Rol Activo: {user.roles[0]}</span>
            </div>
          </div>
        </section>

        {/* Action Panel: Upload & Workload Testing */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Upload Card */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Cargar Documento para Procesamiento Asíncrono</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ingesta segura con análisis OCR, extracción de metadatos e indexación distribuida.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium">
                HTTP 202 Accepted
              </span>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Tipo de Documento
                  </label>
                  <select 
                    value={documentType} 
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="INVOICE">Factura Electrónica (INVOICE)</option>
                    <option value="CONTRACT">Contrato Legal (CONTRACT)</option>
                    <option value="IDENTITY_CARD">Documento de Identidad (ID_CARD)</option>
                    <option value="TECHNICAL_REPORT">Informe Técnico (REPORT)</option>
                    <option value="IMAGE_ANALYSIS">Análisis de Imagen (IMAGE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Archivo Fuente (.pdf, .png, .jpg)
                  </label>
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-xs cursor-pointer"
                  />
                </div>
              </div>

              {isUploading && (
                <div className="space-y-1.5 animate-slide-up">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Procesando asíncronamente en backend...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm flex items-center space-x-2 shadow-lg shadow-indigo-500/25 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Encolando...' : 'Iniciar Procesamiento'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* DevOps Simulation & HPA Triggers */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-semibold flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Pruebas de Carga & HPA</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inyecta carga sintética para verificar autoescalado y correlación de métricas.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSimulateBatch}
                disabled={simulating}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold flex items-center justify-between border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Inyectar Lote Asíncrono (12 docs)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={handleSimulateCpu}
                disabled={simulating}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold flex items-center justify-between border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <span>Simular Pico CPU (HPA Trigger)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {simulationLog && (
              <div className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] border border-slate-800 flex items-start space-x-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span className="break-all">{simulationLog}</span>
              </div>
            )}
          </div>
        </section>

        {/* Live Documents Table */}
        <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Registro de Documentos Procesados</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historial persistente en PostgreSQL con trazas en OpenTelemetry y logs estructurados en ELK.
              </p>
            </div>
            <button 
              onClick={refreshData}
              className="p-2 text-slate-400 hover:text-indigo-500 transition"
              title="Refrescar Lista"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-3">Tracking ID</th>
                  <th className="py-3 px-3">Archivo</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3">Duración</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3 text-right">Metadatos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No hay documentos cargados aún. Suba un documento o inyecte un lote de prueba.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 text-indigo-500 font-semibold">{doc.id.substring(0, 8)}...</td>
                      <td className="py-3 px-3 font-sans text-slate-700 dark:text-slate-300">{doc.filename}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {doc.documentType}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {doc.status === 'SUCCESS' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                            SUCCESS
                          </span>
                        )}
                        {doc.status === 'PROCESSING' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold animate-pulse">
                            PROCESSING
                          </span>
                        )}
                        {doc.status === 'QUEUED' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            QUEUED
                          </span>
                        )}
                        {doc.status === 'FAILED' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold">
                            FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">{doc.processingDurationMs ? `${doc.processingDurationMs}ms` : '-'}</td>
                      <td className="py-3 px-3 text-slate-400">{new Date(doc.createdAt).toLocaleTimeString()}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 text-[11px] font-sans font-medium transition cursor-pointer"
                        >
                          Ver JSON
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal for JSON Metadata Inspection */}
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Metadatos OCR & Extracción Inteligente</h3>
                <button 
                  onClick={() => setSelectedDoc(null)} 
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-mono">
                  TaskId: <span className="text-indigo-400">{selectedDoc.id}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Resumen OCR: <span className="text-slate-200">{selectedDoc.ocrSummary || 'Sin resumen'}</span>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto max-h-60 border border-slate-800">
                  {selectedDoc.extractedMetadata ? JSON.stringify(JSON.parse(selectedDoc.extractedMetadata), null, 2) : '// No metadata'}
                </pre>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* External Dashboards & Observability Links */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a
            href="http://grafana.docuprocess.local"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition flex items-center space-x-3 group"
          >
            <BarChart2 className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition" />
            <div>
              <div className="font-semibold text-xs">Grafana Unified</div>
              <div className="text-[11px] text-slate-400">Métricas RED/USE</div>
            </div>
          </a>

          <a
            href="http://kibana.docuprocess.local"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-pink-500 transition flex items-center space-x-3 group"
          >
            <Terminal className="w-5 h-5 text-pink-500 group-hover:scale-110 transition" />
            <div>
              <div className="font-semibold text-xs">Kibana (ELK)</div>
              <div className="text-[11px] text-slate-400">Logs asíncronos</div>
            </div>
          </a>

          <a
            href="http://jaeger.docuprocess.local"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 transition flex items-center space-x-3 group"
          >
            <Activity className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition" />
            <div>
              <div className="font-semibold text-xs">Jaeger Tracing</div>
              <div className="text-[11px] text-slate-400">Trazas OpenTelemetry</div>
            </div>
          </a>

          <a
            href="http://kubecost.docuprocess.local"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition flex items-center space-x-3 group"
          >
            <DollarSign className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition" />
            <div>
              <div className="font-semibold text-xs">Kubecost FinOps</div>
              <div className="text-[11px] text-slate-400">Control de costes K8s</div>
            </div>
          </a>
        </section>

      </main>
    </div>
  );
}

