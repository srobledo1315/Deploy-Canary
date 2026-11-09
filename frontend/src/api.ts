export interface DocumentTask {
  id: string;
  filename: string;
  contentType: string;
  fileSize: number;
  tenantId: string;
  documentType: 'INVOICE' | 'CONTRACT' | 'IDENTITY_CARD' | 'TECHNICAL_REPORT' | 'IMAGE_ANALYSIS';
  status: 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  processingDurationMs: number | null;
  extractedMetadata: string | null;
  ocrSummary: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface BackendVersionInfo {
  service: string;
  version: string;
  status: string;
}

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:8080';
    }
    return 'http://api.docuprocess.local';
  }
  return 'http://api.docuprocess.local';
};

const API_BASE = getApiBaseUrl();

export const api = {
  async getVersion(): Promise<BackendVersionInfo> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/documents/version`);
      if (!res.ok) throw new Error('Failed to fetch version');
      return await res.json();
    } catch {
      return { service: 'docuprocess-backend', version: '1.0.0 (Fallback)', status: 'UP' };
    }
  },

  async listDocuments(tenantId = 'tenant-enterprise-icesi'): Promise<DocumentTask[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/documents`, {
        headers: { 'X-Enterprise-Tenant': tenantId }
      });
      if (!res.ok) throw new Error('Failed to fetch documents');
      return await res.json();
    } catch {
      return [];
    }
  },

  async uploadDocument(file: File, type: string, tenantId = 'tenant-enterprise-icesi'): Promise<DocumentTask> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const res = await fetch(`${API_BASE}/api/v1/documents/process`, {
      method: 'POST',
      headers: {
        'X-Enterprise-Tenant': tenantId
      },
      body: formData
    });

    if (!res.ok) throw new Error('Error al procesar el archivo');
    return await res.json();
  },

  async getStatus(id: string): Promise<DocumentTask> {
    const res = await fetch(`${API_BASE}/api/v1/documents/${id}/status`);
    if (!res.ok) throw new Error('Task not found');
    return await res.json();
  },

  async simulateWorkload(count = 10, durationMs = 350, tenantId = 'tenant-enterprise-icesi'): Promise<any> {
    const res = await fetch(`${API_BASE}/api/v1/simulate/workload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalDocuments: count,
        tenantId,
        documentType: 'INVOICE',
        simulatedDurationMs: durationMs
      })
    });
    if (!res.ok) throw new Error('Workload simulation failed');
    return await res.json();
  },

  async simulateCpuSpike(durationMs = 2000): Promise<any> {
    const res = await fetch(`${API_BASE}/api/v1/simulate/cpu-spike?durationMs=${durationMs}`);
    if (!res.ok) throw new Error('CPU spike failed');
    return await res.json();
  }
};

