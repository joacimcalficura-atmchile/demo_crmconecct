// ============================================================
// @atm/shared-types — Tipos TypeScript compartidos
// ============================================================

// --- Canales y Estados ---
export type ChannelType = 'PUBLIC' | 'ADMIN';
export type ConversationStatus = 'active' | 'paused' | 'human' | 'closed';
export type AgentIntent =
  | 'FINANCE_QUERY'
  | 'SCHEDULE_MEETING'
  | 'QUALIFY_LEAD'
  | 'REQUEST_QUOTE'
  | 'GENERAL_CHAT'
  | 'RECRUITMENT_CHAT'
  | 'UNKNOWN';

// --- Mensajes ---
export interface InboundMessage {
  id: string;
  from: string;          // número WA (e.g. 56912345678@s.whatsapp.net)
  body: string;
  hasMedia: boolean;
  mediaBase64?: string;
  mediaMimeType?: string;
  /** Todos los adjuntos del lote debounced (mediaBase64/mediaMimeType = primer ítem, por compatibilidad). */
  mediaItems?: Array<{ base64: string; mimeType: string }>;
  timestamp: number;
  channel: ChannelType;
  pushName?: string;
  /** true si el entrante es una REACCIÓN emoji del cliente (no un mensaje nuevo). */
  isReaction?: boolean;
  /** Emoji con el que reaccionó el cliente (cuando isReaction=true). '' = quitó la reacción. */
  reactionEmoji?: string;
  /** wa_message_id del mensaje al que reaccionó, para recuperar su contexto. */
  reactedToWaId?: string;
}

export interface OutboundMessage {
  to: string;
  body: string;
  mediaPath?: string;
}

// --- Conversaciones ---
export interface Conversation {
  id: string;
  phone: string;
  status: ConversationStatus;
  channel: ChannelType;
  lastIntent?: AgentIntent;
  confidenceScore?: number;
  admin_guidance_tip?: string;
  contact_name?: string;
  summary?: string;
  client_profile?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: AgentIntent;
  createdAt: string;
}

// --- Sub-Agente Financiero ---
export type DocumentType = 'Factura' | 'Boleta' | 'Nota_Credito';

export interface FinanceExtraction {
  tipo_documento: DocumentType;
  monto_total: number;
  monto_neto?: number;
  iva?: number;
  proveedor: string;
  concepto_o_categoria: string;
  fecha_emision?: string;
  folio?: string;
  confianza_extraccion: number;
  sheets_row_id?: string;
  cost_type?: 'fijo' | 'variable';
  cost_center?: 'operacional' | 'gastos_generales';
}

// --- Sub-Agente Agenda ---
export type CalendarAction = 'CREATE' | 'MODIFY' | 'DELETE' | 'QUERY';

export interface CalendarEvent {
  id?: string;
  action: CalendarAction;
  event_title: string;
  start_datetime: string;
  end_datetime: string;
  attendees: string[];
  meet_link?: string;
  confirmed_by_user: boolean;
}

// --- Sub-Agente Leads ---
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed_won' | 'closed_lost';

export interface Lead {
  id: string;
  phone: string;
  name?: string;
  company?: string;
  need?: string;
  estimated_budget?: number;
  urgency?: 'low' | 'medium' | 'high';
  score: number;
  stage: LeadStage;
  createdAt: string;
  updatedAt: string;
}

// --- Sub-Agente Cotizaciones ---
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Quote {
  id: string;
  leadId?: string;
  phone: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: QuoteStatus;
  pdf_url?: string;
  createdAt: string;
}

// --- Configuración de Empresa ---
export interface CompanyConfig {
  name: string;
  rut: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
  tax_rate: number;        // e.g. 0.19 para IVA Chile
  wa_public_number: string;
  wa_admin_number: string;
  slack_webhook_url?: string;
  smtp_host?: string;
  smtp_user?: string;
  pdf_primary_color?: string;
  pdf_secondary_color?: string;
  pdf_accent_color?: string;
  vapi_public_key?: string;
  vapi_assistant_id?: string;
}

// --- Guardrails ---
export interface GuardrailResult {
  passed: boolean;
  confidence: number;
  reason?: string;
  should_pause: boolean;
  opt_out?: boolean;
}

// --- Orquestador ---
export interface OrchestratorContext {
  message: InboundMessage;
  conversation: Conversation;
  history: Message[];        // últimos N mensajes (sliding window)
  intent: AgentIntent;
  confidence: number;
  derivation_rules?: any[];
}
