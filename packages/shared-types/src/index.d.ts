export type ChannelType = 'PUBLIC' | 'ADMIN';
export type ConversationStatus = 'active' | 'paused' | 'human' | 'closed';
export type AgentIntent = 'FINANCE_QUERY' | 'SCHEDULE_MEETING' | 'QUALIFY_LEAD' | 'REQUEST_QUOTE' | 'GENERAL_CHAT' | 'UNKNOWN';
export interface InboundMessage {
    id: string;
    from: string;
    body: string;
    hasMedia: boolean;
    mediaBase64?: string;
    mediaMimeType?: string;
    timestamp: number;
    channel: ChannelType;
    pushName?: string;
    isReaction?: boolean;
    reactionEmoji?: string;
    reactedToWaId?: string;
}
export interface OutboundMessage {
    to: string;
    body: string;
    mediaPath?: string;
}
export interface Conversation {
    id: string;
    phone: string;
    status: ConversationStatus;
    channel: ChannelType;
    lastIntent?: AgentIntent;
    confidenceScore?: number;
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
export type DocumentType = 'Factura' | 'Boleta' | 'Nota_Credito';
export interface FinanceExtraction {
    tipo_documento: DocumentType;
    monto_total: number;
    monto_neto?: number;
    iva?: number;
    proveedor: string;
    fecha_emision?: string;
    folio?: string;
    confianza_extraccion: number;
    sheets_row_id?: string;
}
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
export interface CompanyConfig {
    name: string;
    rut: string;
    address: string;
    phone: string;
    email: string;
    logo_url?: string;
    tax_rate: number;
    wa_public_number: string;
    wa_admin_number: string;
    slack_webhook_url?: string;
    smtp_host?: string;
    smtp_user?: string;
}
export interface GuardrailResult {
    passed: boolean;
    confidence: number;
    reason?: string;
    should_pause: boolean;
}
export interface OrchestratorContext {
    message: InboundMessage;
    conversation: Conversation;
    history: Message[];
    intent: AgentIntent;
    confidence: number;
}
//# sourceMappingURL=index.d.ts.map