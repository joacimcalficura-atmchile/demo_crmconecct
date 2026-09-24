/** Datos enteramente ficticios para la demo de Aceros Temuco. */
const createdAt = '2026-09-24T12:00:00-03:00';

export const demoLeads = [
  { id: 'demo-lead-001', phone: '56900000001', name: 'Paula Ejemplo', company: 'Obras Araucanía Demo', need: 'Oxicorte de plancha A36 de 12 mm; solicita 8 piezas.', score: 92, stage: 'proposal', urgency: 'high', created_at: createdAt },
  { id: 'demo-lead-002', phone: '56900000002', name: 'Matías Prueba', company: 'Montajes del Sur Ficticio', need: 'Plegado de planchas de 3 mm, largo aproximado 2 m.', score: 81, stage: 'qualified', urgency: 'medium', created_at: createdAt },
  { id: 'demo-lead-003', phone: '56900000003', name: 'Camila Demo', company: 'Taller Cordillera Demo', need: 'Cilindrado de acero A36; falta confirmar diámetro y espesor.', score: 64, stage: 'contacted', urgency: 'medium', created_at: createdAt },
  { id: 'demo-lead-004', phone: '56900000004', name: 'Diego Muestra', company: 'Constructora Ejemplo', need: 'Consulta por corte plasma CNC de diseño personalizado.', score: 48, stage: 'new', urgency: 'low', created_at: createdAt },
  { id: 'demo-lead-005', phone: '56900000005', name: 'Valentina Ficticia', company: 'Maestranza del Valle Demo', need: 'Fabricación de estructura metálica para una ampliación.', score: 76, stage: 'closed_won', urgency: 'low', created_at: createdAt },
];

export const demoConversations = demoLeads.slice(0, 4).map((lead, index) => ({
  id: lead.id,
  phone: lead.phone,
  status: index === 0 ? 'active' : 'open',
  channel: 'whatsapp',
  last_intent: index === 0 ? 'quote_request' : 'service_inquiry',
  confidence: 0.91 - index * 0.07,
  contact_name: lead.name,
  summary: lead.need,
  client_profile: lead.company + ' · registro ficticio para demostración',
  message_count: 4 + index,
  is_supplier: false,
  qualification: lead.stage,
  created_at: createdAt,
  updated_at: createdAt,
}));

export const demoMessages = [
  { id: 'demo-msg-001', conversation_id: 'demo-lead-001', role: 'user', content: 'Hola, necesito cotizar oxicorte de plancha A36 de 12 mm. Serían 8 piezas.', intent: 'quote_request', created_at: createdAt },
  { id: 'demo-msg-002', conversation_id: 'demo-lead-001', role: 'assistant', content: '¡Hola, Paula! Para preparar una cotización referencial necesito las medidas de cada pieza y confirmar si el material lo aporta su empresa.', intent: 'qualification', created_at: createdAt },
  { id: 'demo-msg-003', conversation_id: 'demo-lead-001', role: 'user', content: 'Cada pieza mide 400 por 250 milímetros. Nosotros llevamos la plancha.', intent: 'quote_details', created_at: createdAt },
  { id: 'demo-msg-004', conversation_id: 'demo-lead-001', role: 'assistant', content: 'Gracias. Dejé la solicitud lista para revisión del equipo comercial. El valor final se confirma al validar material, medidas y disponibilidad.', intent: 'quote_draft', created_at: createdAt },
  { id: 'demo-msg-005', conversation_id: 'demo-lead-002', role: 'user', content: '¿Pueden plegar plancha de acero de 3 mm y dos metros de largo?', intent: 'service_inquiry', created_at: createdAt },
  { id: 'demo-msg-006', conversation_id: 'demo-lead-002', role: 'assistant', content: 'Sí, podemos revisar el trabajo. ¿Cuántos dobleces necesita y qué ángulo requiere?', intent: 'qualification', created_at: createdAt },
  { id: 'demo-msg-007', conversation_id: 'demo-lead-003', role: 'user', content: 'Busco cilindrar una pieza, pero todavía estoy confirmando el diámetro.', intent: 'service_inquiry', created_at: createdAt },
  { id: 'demo-msg-008', conversation_id: 'demo-lead-003', role: 'assistant', content: 'De acuerdo. Cuando tenga el diámetro y el espesor, podemos preparar una cotización referencial para revisión.', intent: 'qualification', created_at: createdAt },
  { id: 'demo-msg-009', conversation_id: 'demo-lead-004', role: 'user', content: '¿Pueden cortar una forma especial en plasma CNC?', intent: 'service_inquiry', created_at: createdAt },
  { id: 'demo-msg-010', conversation_id: 'demo-lead-004', role: 'assistant', content: 'Sí. Para evaluar el diseño necesitamos el archivo y el espesor de la plancha. Esta conversación es una muestra ficticia.', intent: 'qualification', created_at: createdAt },
];

export const demoQuotes = [
  { id: 'DEMO-2401', phone: '56900000001', contact_name: 'Paula Ejemplo', contact_company: 'Obras Araucanía Demo', contact_email: 'paula@example.com', subject: 'Oxicorte A36 · 8 piezas · 12 mm', items_json: JSON.stringify([{ description: 'Servicio de oxicorte · plancha A36 · espesor 12 mm · 8 piezas', quantity: 8, unit_price: 18500 }]), subtotal: 148000, tax: 28120, total: 176120, status: 'sent', pdf_url: null, created_at: createdAt },
  { id: 'DEMO-2402', phone: '56900000002', contact_name: 'Matías Prueba', contact_company: 'Montajes del Sur Ficticio', contact_email: 'matias@example.com', subject: 'Plegado de plancha · 3 mm', items_json: JSON.stringify([{ description: 'Plegado de plancha de acero · 3 mm · 6 dobleces', quantity: 1, unit_price: 67500 }]), subtotal: 67500, tax: 12825, total: 80325, status: 'draft', pdf_url: null, created_at: createdAt },
  { id: 'DEMO-2403', phone: '56900000005', contact_name: 'Valentina Ficticia', contact_company: 'Maestranza del Valle Demo', contact_email: 'valentina@example.com', subject: 'Fabricación de estructura metálica', items_json: JSON.stringify([{ description: 'Fabricación de estructura metálica · presupuesto referencial', quantity: 1, unit_price: 420000 }]), subtotal: 420000, tax: 79800, total: 499800, status: 'accepted', pdf_url: null, created_at: createdAt },
];

export const demoCampaigns = [
  { id: 'demo-campaign-001', name: 'Seguimiento a cotizaciones de oxicorte', message_template: 'Hola {{nombre}}, ¿te ayudamos a completar tu cotización?', segment_filter: { stage: ['proposal'] }, status: 'draft', created_at: createdAt, sent_at: null },
  { id: 'demo-campaign-002', name: 'Aviso de nuevos servicios de plegado · muestra', message_template: 'Conoce nuestros servicios de plegado. Esta campaña es solo una muestra.', segment_filter: { tags: ['interes-plegado'] }, status: 'draft', created_at: createdAt, sent_at: null },
];

export const demoSuppliers = [
  { id: 'demo-supplier-001', name: 'Aceros del Ejemplo', contact_name: 'Contacto Ficticio', phone: '56900000011', email: 'ventas@example.com', category: 'Acero al carbono', address: 'Temuco · dirección ficticia', products_services: 'Planchas A36, perfiles y barras', notes: 'Proveedor de muestra para la demo.', created_at: createdAt },
  { id: 'demo-supplier-002', name: 'Insumos Cordillera Demo', contact_name: 'Equipo de Prueba', phone: '56900000012', email: 'contacto@example.com', category: 'Insumos', address: 'Región de La Araucanía · dirección ficticia', products_services: 'Consumibles de corte y soldadura', notes: 'Registro ficticio.', created_at: createdAt },
];

export const demoCashFlow = [
  { id: 'demo-cash-001', direction: 'ingreso', amount: 499800, currency: 'CLP', entry_date: '2026-09-22', folio: 'DEMO-ING-001', tax_amount: 79800, counterparty: 'Maestranza del Valle Demo', category: 'Servicios de acero', cost_type: null, cost_center: null, status: 'confirmed', recorded_by: 'Demo', items_json: [{ description: 'Estructura metálica ficticia', quantity: 1, unit_price: 420000, total: 420000 }], receipt_url: null, document_type: 'cotización demo', created_at: createdAt },
  { id: 'demo-cash-002', direction: 'egreso', amount: 84600, currency: 'CLP', entry_date: '2026-09-20', folio: 'DEMO-EGR-001', tax_amount: 13500, counterparty: 'Insumos Cordillera Demo', category: 'Materiales', cost_type: 'variable', cost_center: 'operacional', status: 'pending_review', recorded_by: 'Demo', items_json: [{ description: 'Consumibles de corte ficticios', quantity: 1, unit_price: 71100, total: 71100 }], receipt_url: null, document_type: 'documento demo', created_at: createdAt },
];

const dataByEndpoint: Record<string, unknown> = {
  'dashboard/metrics': { activeConversations: 4, pausedConversations: 1, leadsToday: 3, docsToday: 2, quotesSent: 2, botConnected: true, botActive: true, pipelineRevenue: 756245, hoursSaved: 11, timestamp: createdAt },
  status: { connected: true, qr: null, uptime: 86400, timestamp: createdAt },
  config: { name: 'Aceros Temuco', company_name: 'Aceros Temuco · Demo', business_name: 'Aceros Temuco', website_url: 'https://acerostemuco.cl', wa_provider: 'baileys', business_hours: { timezone: 'America/Santiago' }, demo_mode: true },
  conversations: demoConversations,
  leads: demoLeads,
  quotes: demoQuotes,
  campaigns: demoCampaigns,
  suppliers: demoSuppliers,
  agents: [{ id: 'demo-agent-001', name: 'Asistente de ventas', role: 'Atención y calificación', status: 'active', description: 'Asistente ficticio para consultas de servicios de acero.' }],
  'finance/documents': [{ id: 'demo-doc-001', tipo_documento: 'Factura demo', monto_total: 84600, total_amount: 84600, proveedor: 'Insumos Cordillera Demo', fecha_emision: '2026-09-20', confianza_extraccion: 0.95, status: 'confirmed', created_at: createdAt }, { id: 'demo-doc-002', tipo_documento: 'Boleta demo', monto_total: 32500, total_amount: 32500, proveedor: 'Ferretería Ejemplo', fecha_emision: '2026-09-19', confianza_extraccion: 0.71, status: 'pending_review', created_at: createdAt }],
  'finance/metrics': { totalDocs: 2, totalMonto: 117100, byType: [{ tipo_documento: 'Factura demo', count: 1, total: 84600 }, { tipo_documento: 'Boleta demo', count: 1, total: 32500 }] },
  'finance/cash-flow': demoCashFlow,
  'finance/cost-breakdown': { total_expenses: 84600, by_type: { variable: 84600 }, by_center: { operacional: 84600 } },
  'quotes/price-catalog': [
    { id: 'demo-price-001', name: 'Oxicorte A36 · hasta 12 mm', category: 'Oxicorte', unit: 'pieza', unit_price: 18500, active: true },
    { id: 'demo-price-002', name: 'Plegado de plancha · 3 mm', category: 'Plegado', unit: 'trabajo', unit_price: 67500, active: true },
    { id: 'demo-price-003', name: 'Cilindrado · evaluación requerida', category: 'Cilindrado', unit: 'cotización', unit_price: 0, active: true },
    { id: 'demo-price-004', name: 'Guillotinado de plancha · muestra', category: 'Guillotinado', unit: 'corte', unit_price: 9200, active: true },
    { id: 'demo-price-005', name: 'Corte plasma CNC · sujeto a diseño', category: 'Corte plasma CNC', unit: 'cotización', unit_price: 0, active: true },
    { id: 'demo-price-006', name: 'Fabricación de estructura · muestra', category: 'Estructuras metálicas', unit: 'proyecto', unit_price: 310000, active: true },
  ],
  'calendar/events': { events: [{ id: 'demo-event-001', summary: 'Revisión cotización de oxicorte · demo', description: 'Evento ficticio para mostrar seguimiento comercial.', location: 'Temuco · ubicación de muestra', start: { dateTime: '2026-09-25T11:00:00-03:00' }, end: { dateTime: '2026-09-25T11:30:00-03:00' } }, { id: 'demo-event-002', summary: 'Confirmar medidas para cilindrado · demo', description: 'Evento ficticio para mostrar coordinación de un servicio.', location: 'Reunión remota de muestra', start: { dateTime: '2026-09-26T15:00:00-03:00' }, end: { dateTime: '2026-09-26T15:45:00-03:00' } }], email: 'agenda@example.com' },
  'calendar/recipients': { recipients: [{ nombre: 'Jefatura Demo', telefono: '56900000021', tipo: 'gerencia' }], adminFallback: ['56900000022'] },
};

function normalizeEndpoint(endpoint: string): string {
  return decodeURIComponent(endpoint).replace(/^\/?api\/?/, '').split('?')[0].replace(/^\/+|\/+$/g, '');
}

export function getDemoPayload(endpoint: string): unknown {
  const path = normalizeEndpoint(endpoint);
  const messageMatch = path.match(/^conversations\/([^/]+)\/messages$/);
  if (messageMatch) return demoMessages.filter((message) => message.conversation_id === messageMatch[1] || demoConversations.find((conversation) => conversation.phone === messageMatch[1])?.id === message.conversation_id);
  const catalogKey = path === 'price-catalog' ? 'quotes/price-catalog' : path;
  if (Object.prototype.hasOwnProperty.call(dataByEndpoint, catalogKey)) return dataByEndpoint[catalogKey];
  if (path.startsWith('pdf/')) return { ok: true, demo: true, message: 'PDF de muestra desactivado en la demo.' };
  return [];
}

export function getDemoMutation(endpoint: string, method: string, body?: unknown): unknown {
  const path = normalizeEndpoint(endpoint);
  if (method === 'POST' && path === 'campaigns') return { id: 'demo-campaign-new', ok: true, demo: true };
  if (path.startsWith('deploy')) return { ok: false, demo: true, message: 'Los despliegues están desactivados en la demo.' };
  if (/^campaigns\/[^/]+\/send$/.test(path)) return { ok: true, demo: true, sent: 4, message: 'Envío simulado; no se contactó a nadie.' };
  if (path === 'quotes/manual') return { error: 'La generación de PDF no está habilitada en esta demo.', demo: true };
  if (/^quotes\/manual\//.test(path)) return { ok: true, demo: true, quote_id: 'DEMO-2404', message: 'Acción simulada: no se envió ningún mensaje ni correo.' };
  if (/^leads\/[^/]+\/stage$/.test(path)) return { ok: true, demo: true, updated: true, body };
  if (/^conversations\//.test(path)) return { ok: true, demo: true, updated: true };
  return { ok: true, demo: true, message: 'Acción simulada; los datos de demostración no se guardan.' };
}
