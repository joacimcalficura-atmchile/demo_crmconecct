import { getDemoPayload } from '@/lib/demo-data';

// Este repositorio es exclusivamente una demo: sus componentes de servidor
// reciben fixtures ficticios y nunca se conectan al bot ni a una base de datos.
async function apiFetch<T>(endpoint: string, _options?: RequestInit): Promise<T> {
  return getDemoPayload(endpoint) as T;
}

export interface DashboardMetrics {
  activeConversations: number;
  pausedConversations: number;
  leadsToday: number;
  docsToday: number;
  quotesSent: number;
  botConnected: boolean;
  botActive?: boolean;
  silenceUntil?: string | null;
  businessHours?: any;
  pipelineRevenue?: number;
  hoursSaved?: number;
  timestamp: string;
}

export interface BotStatus {
  connected: boolean;
  qr: string | null;
  uptime: number;
  timestamp: string;
}

export interface Conversation {
  id: string;
  phone: string;
  status: string;
  channel: string;
  last_intent: string | null;
  confidence: number | null;
  contact_name?: string | null;
  summary?: string | null;
  client_profile?: string | null;
  message_count: number;
  is_supplier?: boolean;
  qualification?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  intent: string | null;
  created_at: string;
  audit_trail?: any;
  /** ID del mensaje en WhatsApp — permite enganchar reacciones a la burbuja. */
  wa_message_id?: string | null;
  /** Si esta fila es una reacción, wa_message_id del mensaje al que reaccionó. */
  reacted_to_wa_id?: string | null;
}

export interface FinanceDocument {
  id: string;
  tipo_documento: string | null;
  monto_total: number | null;
  document_type?: string | null;
  total_amount?: number | null;
  proveedor: string | null;
  fecha_emision: string | null;
  confianza_extraccion: number;
  status?: string;
  created_at: string;
}

export interface FinanceMetrics {
  totalDocs: number;
  totalMonto: number;
  byType: Array<{ tipo_documento: string; count: number; total: number }>;
}

export interface Lead {
  id: string;
  phone: string;
  name: string | null;
  company: string | null;
  need: string | null;
  score: number;
  stage: string;
  urgency: string | null;
  created_at: string;
}

export interface Quote {
  id: string;
  phone: string;
  contact_name?: string | null;
  contact_company?: string | null;
  contact_email?: string | null;
  subject?: string | null;
  items_json: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  pdf_url: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  message_template: string;
  segment_filter: { stage?: string | string[]; tags?: string[] };
  status: 'draft' | 'sending' | 'sent' | 'failed' | 'paused';
  created_at: string;
  sent_at: string | null;
}

export interface CampaignSend {
  id: string;
  campaign_id: string;
  lead_id: string | null;
  phone: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped_optout';
  error: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface CashFlow {
  id: string;
  direction: 'ingreso' | 'egreso';
  amount: number;
  currency: string;
  entry_date: string;
  folio: string | null;
  tax_amount: number | null;
  counterparty: string | null;
  category: string | null;
  cost_type: 'fijo' | 'variable' | null;
  cost_center: 'operacional' | 'gastos_generales' | null;
  status: 'pending_review' | 'confirmed';
  recorded_by: string | null;
  items_json: Array<{ description: string; quantity?: number; unit_price?: number; total?: number }> | null;
  receipt_url: string | null;
  document_type: string | null;
  created_at: string;
}

export interface CostBreakdown {
  total_expenses: number;
  by_type: Record<string, number>;
  by_center: Record<string, number>;
}

export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  address: string | null;
  products_services: string | null;
  notes: string | null;
  created_at: string;
}

// API functions
export const api = {
  getDashboardMetrics: () => apiFetch<DashboardMetrics>('/api/dashboard/metrics'),
  getBotStatus: () => apiFetch<BotStatus>('/api/status'),
  getConversations: () => apiFetch<Conversation[]>('/api/conversations'),
  getMessages: (id: string) => apiFetch<Message[]>(`/api/conversations/${id}/messages`),
  updateConversationStatus: (phone: string, status: string) =>
    apiFetch(`/api/conversations/${phone}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getFinanceDocuments: () => apiFetch<FinanceDocument[]>('/api/finance/documents'),
  getFinanceMetrics: () => apiFetch<FinanceMetrics>('/api/finance/metrics'),
  getCashFlow: () => apiFetch<CashFlow[]>('/api/finance/cash-flow'),
  updateCashFlowEntry: (id: string, data: Partial<CashFlow>) => 
    apiFetch<CashFlow>(`/api/finance/cash-flow/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getCostBreakdown: () => apiFetch<CostBreakdown>('/api/finance/cost-breakdown'),
  getLeads: () => apiFetch<Lead[]>('/api/leads'),
  getQuotes: () => apiFetch<Quote[]>('/api/quotes'),
  getCampaigns: () => apiFetch<Campaign[]>('/api/campaigns'),
  getSuppliers: () => apiFetch<Supplier[]>('/api/suppliers'),
  createSupplier: (data: Partial<Supplier>) => apiFetch<Supplier>('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: string, data: Partial<Supplier>) => apiFetch<Supplier>(`/api/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSupplier: (id: string) => apiFetch<{ok: boolean}>(`/api/suppliers/${id}`, { method: 'DELETE' }),
  getConfig: () => apiFetch<Record<string, unknown>>('/api/config'),
  updateConfig: (data: Record<string, unknown>) =>
    apiFetch('/api/config', { method: 'PUT', body: JSON.stringify(data) }),
};
