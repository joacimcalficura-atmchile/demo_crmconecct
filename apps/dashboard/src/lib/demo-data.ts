/** Datos enteramente ficticios para la demo de Aceros Temuco. */
const today = '2026-09-24T12:00:00-03:00';

const siteUrl = 'https://democrm.atmchile.com';
const pdfUrl = (quoteId: string) => `${siteUrl}/api/quotes/${quoteId}/document.pdf`;
const payUrl = (quoteId: string) => `${siteUrl}/pago/${quoteId}`;

// qualification usada por ConversationsClient: unqualified | lead | cold | warm | hot
function qualificationFor(score: number): 'hot' | 'warm' | 'cold' | 'unqualified' {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'warm';
  if (score >= 40) return 'cold';
  return 'unqualified';
}

export const demoLeads = [
  { id: 'demo-lead-001', phone: '56900000001', name: 'Paula Ejemplo', company: 'Obras Araucanía Demo', need: 'Oxicorte de plancha A36 de 12 mm; solicita 8 piezas.', score: 92, stage: 'proposal', urgency: 'high', created_at: '2026-09-24T09:10:00-03:00' },
  { id: 'demo-lead-002', phone: '56900000002', name: 'Matías Prueba', company: 'Montajes del Sur Ficticio', need: 'Plegado de planchas de 3 mm, 6 dobleces a 90°.', score: 81, stage: 'qualified', urgency: 'medium', created_at: '2026-09-24T10:05:00-03:00' },
  { id: 'demo-lead-003', phone: '56900000003', name: 'Camila Demo', company: 'Taller Cordillera Demo', need: 'Cilindrado de acero A36 de ~8 mm; falta confirmar diámetro.', score: 64, stage: 'contacted', urgency: 'medium', created_at: '2026-09-24T11:20:00-03:00' },
  { id: 'demo-lead-004', phone: '56900000004', name: 'Diego Muestra', company: 'Constructora Ejemplo', need: 'Corte plasma CNC de diseño personalizado (logo), plancha 5 mm.', score: 48, stage: 'new', urgency: 'low', created_at: '2026-09-24T14:40:00-03:00' },
  { id: 'demo-lead-005', phone: '56900000005', name: 'Valentina Ficticia', company: 'Maestranza del Valle Demo', need: 'Fabricación de estructura metálica para ampliación de bodega (8x6x4 m).', score: 76, stage: 'closed_won', urgency: 'low', created_at: '2026-09-20T08:30:00-03:00' },
  { id: 'demo-lead-006', phone: '56900000006', name: 'Rodrigo Herrera', company: 'Ferretería Sur Demo', need: 'Guillotinado de planchas de 5 mm; 20 cortes.', score: 55, stage: 'new', urgency: 'low', created_at: '2026-09-24T16:00:00-03:00' },
  { id: 'demo-lead-007', phone: '56900000007', name: 'Francisca Ríos', company: 'Estructuras Bío Bío Demo', need: 'Estructura industrial (galpón 20x15 m) + 8 refuerzos plegados en plancha de 8 mm.', score: 88, stage: 'proposal', urgency: 'high', created_at: '2026-09-23T09:00:00-03:00' },
  { id: 'demo-lead-008', phone: '56900000008', name: 'Sergio Lagos', company: 'Talleres Ñielol Demo', need: 'Cilindrado de eje de 10 mm con urgencia de 3 días.', score: 35, stage: 'closed_lost', urgency: 'low', created_at: '2026-09-18T10:00:00-03:00' },
];

function conversation(opts: {
  id: string; phone: string; status: 'active' | 'human' | 'closed'; last_intent: string; confidence: number;
  name: string; summary: string; profile: string; messageCount: number; score: number; isSupplier?: boolean; updated_at: string;
}) {
  return {
    id: opts.id,
    phone: opts.phone,
    status: opts.status,
    channel: 'whatsapp',
    last_intent: opts.last_intent,
    confidence: opts.confidence,
    contact_name: opts.name,
    summary: opts.summary,
    client_profile: opts.profile,
    message_count: opts.messageCount,
    is_supplier: !!opts.isSupplier,
    qualification: opts.isSupplier ? 'lead' : qualificationFor(opts.score),
    created_at: opts.updated_at,
    updated_at: opts.updated_at,
  };
}

export const demoConversations = [
  conversation({
    id: 'demo-lead-001', phone: '56900000001', status: 'active', last_intent: 'REQUEST_QUOTE', confidence: 0.91, score: 92,
    name: 'Paula Ejemplo', summary: 'Oxicorte A36 12 mm · 8 piezas · cotización aprobada y enviada.',
    profile: 'Obras Araucanía Demo · constructora · registro ficticio para demostración.',
    messageCount: 6, updated_at: '2026-09-24T09:32:00-03:00',
  }),
  conversation({
    id: 'demo-lead-002', phone: '56900000002', status: 'active', last_intent: 'REQUEST_QUOTE', confidence: 0.84, score: 81,
    name: 'Matías Prueba', summary: 'Plegado 3 mm · 6 dobleces · cotización en borrador, pendiente de aprobación.',
    profile: 'Montajes del Sur Ficticio · taller de montajes · registro ficticio.',
    messageCount: 4, updated_at: '2026-09-24T10:18:00-03:00',
  }),
  conversation({
    id: 'demo-lead-003', phone: '56900000003', status: 'active', last_intent: 'REQUEST_QUOTE', confidence: 0.85, score: 64,
    name: 'Camila Demo', summary: 'Cilindrado A36 · 200 mm diámetro, 8 mm espesor · confirmado por nota de voz.',
    profile: 'Taller Cordillera Demo · maestranza pequeña · registro ficticio.',
    messageCount: 6, updated_at: '2026-09-24T13:12:00-03:00',
  }),
  conversation({
    id: 'demo-lead-004', phone: '56900000004', status: 'active', last_intent: 'QUALIFY_LEAD', confidence: 0.7, score: 48,
    name: 'Diego Muestra', summary: 'Corte plasma CNC · diseño personalizado 5 mm · primer contacto.',
    profile: 'Constructora Ejemplo · registro ficticio para demostración.',
    messageCount: 4, updated_at: '2026-09-24T14:55:00-03:00',
  }),
  conversation({
    id: 'demo-lead-005', phone: '56900000005', status: 'closed', last_intent: 'REQUEST_QUOTE', confidence: 0.95, score: 76,
    name: 'Valentina Ficticia', summary: 'Estructura metálica mediana · cotización aceptada · anticipo pagado y comprobante validado.',
    profile: 'Maestranza del Valle Demo · industria metalmecánica · registro ficticio.',
    messageCount: 9, updated_at: '2026-09-20T09:50:00-03:00',
  }),
  conversation({
    id: 'demo-lead-007', phone: '56900000007', status: 'active', last_intent: 'SCHEDULE_MEETING', confidence: 0.88, score: 88,
    name: 'Francisca Ríos', summary: 'Estructura industrial + refuerzos plegados · cotización enviada · coordinando visita a terreno.',
    profile: 'Estructuras Bío Bío Demo · proyecto industrial de gran escala · registro ficticio.',
    messageCount: 7, updated_at: '2026-09-23T09:45:00-03:00',
  }),
  conversation({
    id: 'demo-lead-008', phone: '56900000008', status: 'closed', last_intent: 'REQUEST_QUOTE', confidence: 0.6, score: 35,
    name: 'Sergio Lagos', summary: 'Cilindrado eje 10 mm · cotización rechazada por plazo de entrega.',
    profile: 'Talleres Ñielol Demo · registro ficticio.',
    messageCount: 6, updated_at: '2026-09-18T10:20:00-03:00',
  }),
  conversation({
    id: 'demo-conv-supplier-001', phone: '56900000012', status: 'human', last_intent: 'FINANCE_QUERY', confidence: 0.82, score: 0, isSupplier: true,
    name: 'Insumos Cordillera Demo', summary: 'Consulta de proveedor por estado de pago de factura · derivada a un humano.',
    profile: 'Proveedor de consumibles de corte y soldadura · registro ficticio.',
    messageCount: 4, updated_at: '2026-09-20T16:10:00-03:00',
  }),
];

function msg(id: string, conversation_id: string, role: 'user' | 'assistant', content: string, intent: string, created_at: string) {
  return { id, conversation_id, role, content, intent, created_at };
}

export const demoMessages = [
  // Paula — oxicorte, cotización aprobada y enviada
  msg('demo-msg-001', 'demo-lead-001', 'user', 'Hola, necesito cotizar oxicorte de plancha A36 de 12 mm. Serían 8 piezas.', 'GENERAL_CHAT', '2026-09-24T09:10:00-03:00'),
  msg('demo-msg-002', 'demo-lead-001', 'assistant', '¡Hola, Paula! Para preparar una cotización referencial necesito las medidas de cada pieza y confirmar si el material lo aporta su empresa.', 'QUALIFY_LEAD', '2026-09-24T09:12:00-03:00'),
  msg('demo-msg-003', 'demo-lead-001', 'user', 'Cada pieza mide 400 por 250 milímetros. Nosotros llevamos la plancha.', 'GENERAL_CHAT', '2026-09-24T09:15:00-03:00'),
  msg('demo-msg-004', 'demo-lead-001', 'assistant', 'Gracias. Dejé la solicitud lista para revisión del equipo comercial. El valor final se confirma al validar material, medidas y disponibilidad.', 'REQUEST_QUOTE', '2026-09-24T09:16:00-03:00'),
  msg('demo-msg-005', 'demo-lead-001', 'assistant', 'Tu cotización ya fue revisada y aprobada por el equipo: 8 piezas de oxicorte A36 (7–12 mm), total $176.120 IVA incluido.', 'REQUEST_QUOTE', '2026-09-24T09:30:00-03:00'),
  msg('demo-msg-045', 'demo-lead-001', 'assistant', `Aquí tienes el documento formal en PDF: ${pdfUrl('DEMO-2401')}`, 'REQUEST_QUOTE', '2026-09-24T09:31:00-03:00'),
  msg('demo-msg-006', 'demo-lead-001', 'user', 'Genial, gracias. Lo revisamos internamente y les confirmamos.', 'GENERAL_CHAT', '2026-09-24T09:32:00-03:00'),

  // Matías — plegado, cotización en borrador (para demo en vivo de "Aprobar y Enviar")
  msg('demo-msg-007', 'demo-lead-002', 'user', '¿Pueden plegar plancha de acero de 3 mm y dos metros de largo?', 'GENERAL_CHAT', '2026-09-24T10:05:00-03:00'),
  msg('demo-msg-008', 'demo-lead-002', 'assistant', 'Sí, podemos revisar el trabajo. ¿Cuántos dobleces necesita y qué ángulo requiere?', 'QUALIFY_LEAD', '2026-09-24T10:07:00-03:00'),
  msg('demo-msg-009', 'demo-lead-002', 'user', 'Son 6 dobleces a 90°, en plancha de 3 mm.', 'GENERAL_CHAT', '2026-09-24T10:12:00-03:00'),
  msg('demo-msg-010', 'demo-lead-002', 'assistant', 'Gracias. Dejé lista la solicitud para revisión del equipo comercial: plegado de 6 dobleces en plancha de 3 mm. Te confirmamos el valor apenas se apruebe internamente.', 'REQUEST_QUOTE', '2026-09-24T10:18:00-03:00'),

  // Camila — cilindrado, aún calificando
  msg('demo-msg-011', 'demo-lead-003', 'user', 'Busco cilindrar una pieza, pero todavía estoy confirmando el diámetro.', 'GENERAL_CHAT', '2026-09-24T11:20:00-03:00'),
  msg('demo-msg-012', 'demo-lead-003', 'assistant', 'De acuerdo. El valor de cilindrado depende del diámetro y el espesor de la plancha — apenas los tengas, preparamos una cotización referencial para revisión.', 'QUALIFY_LEAD', '2026-09-24T11:22:00-03:00'),
  msg('demo-msg-013', 'demo-lead-003', 'user', 'Es acero A36, calculo unos 8 mm de espesor, pero el diámetro lo confirmo con el jefe de taller.', 'GENERAL_CHAT', '2026-09-24T11:33:00-03:00'),
  msg('demo-msg-014', 'demo-lead-003', 'assistant', 'Perfecto, con 8 mm entra en nuestro rango de 6–10 mm. Cuando tengas el diámetro exacto avísame para dejar la solicitud lista para el equipo comercial.', 'QUALIFY_LEAD', '2026-09-24T11:35:00-03:00'),
  msg('demo-msg-050', 'demo-lead-003', 'user', `[audio adjunto: ${siteUrl}/demo-media/nota-voz-camila.ogg]`, 'GENERAL_CHAT', '2026-09-24T13:10:00-03:00'),
  msg('demo-msg-051', 'demo-lead-003', 'assistant', 'Perfecto, con 200 mm de diámetro y 8 mm de espesor ya tenemos todo lo necesario. Dejé la solicitud lista para que el equipo prepare la cotización.', 'REQUEST_QUOTE', '2026-09-24T13:12:00-03:00'),

  // Diego — corte plasma CNC, primer contacto
  msg('demo-msg-015', 'demo-lead-004', 'user', '¿Pueden cortar una forma especial en plasma CNC?', 'GENERAL_CHAT', '2026-09-24T14:40:00-03:00'),
  msg('demo-msg-016', 'demo-lead-004', 'assistant', 'Sí. Para evaluar el diseño necesitamos el archivo (DXF o similar) y el espesor de la plancha. Esta conversación es una muestra ficticia.', 'QUALIFY_LEAD', '2026-09-24T14:42:00-03:00'),
  msg('demo-msg-017', 'demo-lead-004', 'user', 'Es un logo personalizado, la plancha es de 5 mm.', 'GENERAL_CHAT', '2026-09-24T14:50:00-03:00'),
  msg('demo-msg-018', 'demo-lead-004', 'assistant', 'Gracias. Con diseño simple hasta 6 mm el valor referencial parte en $35.000; si tiene múltiples piezas o mayor detalle, el equipo confirma el valor exacto al revisar el archivo.', 'QUALIFY_LEAD', '2026-09-24T14:55:00-03:00'),

  // Valentina — estructura metálica: cotización, aprobación, link de pago y comprobante
  msg('demo-msg-019', 'demo-lead-005', 'user', 'Hola, necesitamos fabricar una estructura metálica para ampliar una bodega.', 'GENERAL_CHAT', '2026-09-20T08:30:00-03:00'),
  msg('demo-msg-020', 'demo-lead-005', 'assistant', '¡Hola, Valentina! Para dimensionar el proyecto necesito el largo, ancho y altura aproximada de la ampliación, y si ya tienen un plano o boceto.', 'QUALIFY_LEAD', '2026-09-20T08:32:00-03:00'),
  msg('demo-msg-021', 'demo-lead-005', 'user', 'Es una ampliación mediana, unos 8x6 metros, altura 4 metros. Tenemos un boceto que les puedo enviar.', 'GENERAL_CHAT', '2026-09-20T08:40:00-03:00'),
  msg('demo-msg-022', 'demo-lead-005', 'assistant', 'Perfecto, con esos datos dejé la solicitud lista para que el equipo prepare una cotización referencial de estructura mediana.', 'REQUEST_QUOTE', '2026-09-20T08:42:00-03:00'),
  msg('demo-msg-023', 'demo-lead-005', 'assistant', 'Tu cotización fue aprobada por el equipo: estructura metálica mediana, total $499.800 IVA incluido.', 'REQUEST_QUOTE', '2026-09-20T09:15:00-03:00'),
  msg('demo-msg-046', 'demo-lead-005', 'assistant', `Aquí tienes el documento formal en PDF: ${pdfUrl('DEMO-2403')}`, 'REQUEST_QUOTE', '2026-09-20T09:16:00-03:00'),
  msg('demo-msg-024', 'demo-lead-005', 'user', 'Se ve bien, aceptamos. ¿Cómo seguimos con el pago?', 'GENERAL_CHAT', '2026-09-20T09:20:00-03:00'),
  msg('demo-msg-025', 'demo-lead-005', 'assistant', `¡Excelente! Para reservar el cupo de producción puedes abonar el anticipo aquí: ${payUrl('DEMO-2403')} (página de demostración, no procesa pagos reales).`, 'REQUEST_QUOTE', '2026-09-20T09:22:00-03:00'),
  msg('demo-msg-026', 'demo-lead-005', 'user', 'Listo, ya transferí el anticipo. Les adjunto el comprobante.', 'GENERAL_CHAT', '2026-09-20T09:45:00-03:00'),
  msg('demo-msg-027', 'demo-lead-005', 'assistant', '¡Recibido! Registramos tu comprobante y quedó validado por el equipo financiero. Tu proyecto de estructura metálica queda confirmado en producción. 🎉', 'FINANCE_QUERY', '2026-09-20T09:50:00-03:00'),

  // Francisca — proyecto industrial grande: cotización enviada + agenda de visita
  msg('demo-msg-028', 'demo-lead-007', 'user', 'Hola, tenemos un proyecto grande: una estructura industrial con refuerzos plegados. ¿Trabajan proyectos de esa escala?', 'GENERAL_CHAT', '2026-09-23T09:00:00-03:00'),
  msg('demo-msg-029', 'demo-lead-007', 'assistant', '¡Hola, Francisca! Sí, hacemos proyectos industriales. Cuéntame las dimensiones generales de la estructura y cuántos refuerzos plegados necesitas.', 'QUALIFY_LEAD', '2026-09-23T09:03:00-03:00'),
  msg('demo-msg-030', 'demo-lead-007', 'user', 'Es un galpón de 20x15 metros, y unos 8 refuerzos plegados en plancha de 8 mm.', 'GENERAL_CHAT', '2026-09-23T09:10:00-03:00'),
  msg('demo-msg-031', 'demo-lead-007', 'assistant', 'Gracias, dejé la solicitud lista para que el equipo prepare la cotización de este proyecto industrial.', 'REQUEST_QUOTE', '2026-09-23T09:12:00-03:00'),
  msg('demo-msg-032', 'demo-lead-007', 'assistant', 'Tu cotización fue aprobada y enviada: estructura industrial + 8 refuerzos plegados, total $1.363.740 IVA incluido. Quedamos atentos a tu confirmación.', 'REQUEST_QUOTE', '2026-09-23T09:40:00-03:00'),
  msg('demo-msg-047', 'demo-lead-007', 'assistant', `Aquí tienes el documento formal en PDF: ${pdfUrl('DEMO-2405')}`, 'REQUEST_QUOTE', '2026-09-23T09:41:00-03:00'),
  msg('demo-msg-033', 'demo-lead-007', 'assistant', 'Para afinar detalles técnicos, ¿te acomoda una visita a terreno? Tenemos disponibilidad la próxima semana.', 'SCHEDULE_MEETING', '2026-09-23T09:42:00-03:00'),
  msg('demo-msg-034', 'demo-lead-007', 'user', 'Sí, coordinemos la visita para revisar el terreno antes de confirmar.', 'GENERAL_CHAT', '2026-09-23T09:45:00-03:00'),

  // Sergio — cilindrado urgente: cotización rechazada por plazo
  msg('demo-msg-035', 'demo-lead-008', 'user', 'Necesito cilindrar un eje de 10 mm, ¿cuánto se demoran?', 'GENERAL_CHAT', '2026-09-18T10:00:00-03:00'),
  msg('demo-msg-036', 'demo-lead-008', 'assistant', 'Hola, con 10 mm de espesor el trabajo entra en nuestro rango de 6–10 mm. ¿Para cuándo lo necesitas?', 'QUALIFY_LEAD', '2026-09-18T10:02:00-03:00'),
  msg('demo-msg-037', 'demo-lead-008', 'user', 'Lo necesito con urgencia, en 3 días máximo.', 'GENERAL_CHAT', '2026-09-18T10:05:00-03:00'),
  msg('demo-msg-038', 'demo-lead-008', 'assistant', 'Entendido, dejé la solicitud lista para revisión. El equipo evaluará si el plazo de 3 días es posible con la carga de trabajo actual.', 'REQUEST_QUOTE', '2026-09-18T10:07:00-03:00'),
  msg('demo-msg-039', 'demo-lead-008', 'assistant', 'Tu cotización fue aprobada y enviada: cilindrado de eje de 10 mm, total $207.060 IVA incluido. El plazo estimado de entrega es de 6 días hábiles.', 'REQUEST_QUOTE', '2026-09-18T10:30:00-03:00'),
  msg('demo-msg-048', 'demo-lead-008', 'assistant', `Aquí tienes el documento formal en PDF: ${pdfUrl('DEMO-2404')}`, 'REQUEST_QUOTE', '2026-09-18T10:31:00-03:00'),
  msg('demo-msg-040', 'demo-lead-008', 'user', '6 días no nos sirve, necesitamos el eje en 3 días máximo. Vamos a cotizar con otro proveedor, gracias de todas formas.', 'GENERAL_CHAT', '2026-09-18T10:35:00-03:00'),

  // Proveedor — consulta financiera derivada a un humano (HITL)
  msg('demo-msg-041', 'demo-conv-supplier-001', 'user', 'Hola, quería confirmar cuándo se paga la factura de los consumibles de corte que enviamos.', 'GENERAL_CHAT', '2026-09-20T16:00:00-03:00'),
  msg('demo-msg-042', 'demo-conv-supplier-001', 'assistant', 'Hola, reviso el estado en Finanzas: tu factura por $84.600 está en revisión por el equipo; los pagos a proveedores se procesan los días viernes.', 'FINANCE_QUERY', '2026-09-20T16:02:00-03:00'),
  msg('demo-msg-043', 'demo-conv-supplier-001', 'user', 'Perfecto. Una consulta más específica sobre condiciones de pago a 30 días para el próximo pedido, ¿puede confirmarme alguien del equipo?', 'GENERAL_CHAT', '2026-09-20T16:08:00-03:00'),
  msg('demo-msg-044', 'demo-conv-supplier-001', 'assistant', 'Para esa consulta te voy a derivar con el equipo de finanzas; en un momento te responden por este medio.', 'FINANCE_QUERY', '2026-09-20T16:10:00-03:00'),
];

export const demoQuotes = [
  { id: 'DEMO-2401', phone: '56900000001', contact_name: 'Paula Ejemplo', contact_company: 'Obras Araucanía Demo', contact_email: 'paula@example.com', subject: 'Oxicorte A36 · 8 piezas · 7-12 mm', items_json: JSON.stringify([{ description: 'Servicio de oxicorte · plancha A36 · espesor 7-12 mm · 8 piezas', quantity: 8, unit_price: 18500 }]), subtotal: 148000, tax: 28120, total: 176120, status: 'sent', pdf_url: pdfUrl('DEMO-2401'), created_at: '2026-09-24T09:16:00-03:00' },
  { id: 'DEMO-2402', phone: '56900000002', contact_name: 'Matías Prueba', contact_company: 'Montajes del Sur Ficticio', contact_email: 'matias@example.com', subject: 'Plegado de plancha · 3 mm', items_json: JSON.stringify([{ description: 'Plegado de plancha de acero · 1-3 mm · 6 dobleces a 90°', quantity: 6, unit_price: 11250 }]), subtotal: 67500, tax: 12825, total: 80325, status: 'draft', pdf_url: null, created_at: '2026-09-24T10:18:00-03:00' },
  { id: 'DEMO-2403', phone: '56900000005', contact_name: 'Valentina Ficticia', contact_company: 'Maestranza del Valle Demo', contact_email: 'valentina@example.com', subject: 'Fabricación de estructura metálica · ampliación mediana', items_json: JSON.stringify([{ description: 'Fabricación de estructura metálica mediana (8x6x4 m)', quantity: 1, unit_price: 420000 }]), subtotal: 420000, tax: 79800, total: 499800, status: 'accepted', pdf_url: pdfUrl('DEMO-2403'), created_at: '2026-09-20T08:42:00-03:00' },
  { id: 'DEMO-2404', phone: '56900000008', contact_name: 'Sergio Lagos', contact_company: 'Talleres Ñielol Demo', contact_email: 'sergio@example.com', subject: 'Cilindrado de eje · 10 mm', items_json: JSON.stringify([{ description: 'Cilindrado · eje 10 mm · 3 horas de máquina estimadas', quantity: 3, unit_price: 58000 }]), subtotal: 174000, tax: 33060, total: 207060, status: 'rejected', pdf_url: pdfUrl('DEMO-2404'), created_at: '2026-09-18T10:07:00-03:00' },
  { id: 'DEMO-2405', phone: '56900000007', contact_name: 'Francisca Ríos', contact_company: 'Estructuras Bío Bío Demo', contact_email: 'francisca@example.com', subject: 'Estructura industrial + refuerzos plegados', items_json: JSON.stringify([{ description: 'Fabricación de estructura industrial (galpón 20x15 m)', quantity: 1, unit_price: 950000 }, { description: 'Plegado de refuerzos · 7-10 mm · 8 dobleces', quantity: 8, unit_price: 24500 }]), subtotal: 1146000, tax: 217740, total: 1363740, status: 'sent', pdf_url: pdfUrl('DEMO-2405'), created_at: '2026-09-23T09:12:00-03:00' },
];

export const demoCampaigns = [
  { id: 'demo-campaign-001', name: 'Seguimiento a cotizaciones de oxicorte', message_template: 'Hola {{nombre}}, ¿te ayudamos a completar tu cotización?', segment_filter: { stage: ['proposal'] }, status: 'draft', created_at: today, sent_at: null },
  { id: 'demo-campaign-002', name: 'Aviso de nuevos servicios de plegado · muestra', message_template: 'Conoce nuestros servicios de plegado. Esta campaña es solo una muestra.', segment_filter: { tags: ['interes-plegado'] }, status: 'draft', created_at: today, sent_at: null },
  { id: 'demo-campaign-003', name: 'Reactivación de leads perdidos · muestra', message_template: 'Hola {{nombre}}, tenemos nueva disponibilidad de producción esta semana — ¿retomamos tu cotización?', segment_filter: { stage: ['closed_lost'] }, status: 'sent', created_at: '2026-09-19T09:00:00-03:00', sent_at: '2026-09-19T10:00:00-03:00' },
];

export const demoSuppliers = [
  { id: 'demo-supplier-001', name: 'Aceros del Ejemplo', contact_name: 'Contacto Ficticio', phone: '56900000011', email: 'ventas@example.com', category: 'Acero al carbono', address: 'Temuco · dirección ficticia', products_services: 'Planchas A36, perfiles y barras', notes: 'Proveedor de muestra para la demo.', created_at: today },
  { id: 'demo-supplier-002', name: 'Insumos Cordillera Demo', contact_name: 'Equipo de Prueba', phone: '56900000012', email: 'contacto@example.com', category: 'Insumos', address: 'Región de La Araucanía · dirección ficticia', products_services: 'Consumibles de corte y soldadura', notes: 'Registro ficticio para la demo.', created_at: today },
];

export const demoCashFlow = [
  { id: 'demo-cash-001', direction: 'ingreso', amount: 499800, currency: 'CLP', entry_date: '2026-09-20', folio: 'DEMO-ING-001', tax_amount: 79800, counterparty: 'Maestranza del Valle Demo', category: 'Servicios de acero', cost_type: null, cost_center: null, status: 'confirmed', recorded_by: 'Demo', items_json: [{ description: 'Estructura metálica mediana · anticipo confirmado con comprobante', quantity: 1, unit_price: 420000, total: 420000 }], receipt_url: null, document_type: 'cotización demo', created_at: '2026-09-20T09:50:00-03:00' },
  { id: 'demo-cash-002', direction: 'egreso', amount: 84600, currency: 'CLP', entry_date: '2026-09-20', folio: 'DEMO-EGR-001', tax_amount: 13500, counterparty: 'Insumos Cordillera Demo', category: 'Materiales', cost_type: 'variable', cost_center: 'operacional', status: 'pending_review', recorded_by: 'Demo', items_json: [{ description: 'Consumibles de corte ficticios', quantity: 1, unit_price: 71100, total: 71100 }], receipt_url: null, document_type: 'documento demo', created_at: '2026-09-20T16:00:00-03:00' },
];

const dataByEndpoint: Record<string, unknown> = {
  'dashboard/metrics': { activeConversations: 5, pausedConversations: 1, leadsToday: 5, docsToday: 2, quotesSent: 4, botConnected: true, botActive: true, pipelineRevenue: 2119985, hoursSaved: 16, timestamp: today },
  status: { connected: true, qr: null, uptime: 86400, timestamp: today },
  config: { name: 'Aceros Temuco', company_name: 'Aceros Temuco · Demo', business_name: 'Aceros Temuco', website_url: 'https://acerostemuco.cl', wa_provider: 'baileys', business_hours: { timezone: 'America/Santiago' }, demo_mode: true },
  conversations: demoConversations,
  leads: demoLeads,
  quotes: demoQuotes,
  campaigns: demoCampaigns,
  suppliers: demoSuppliers,
  agents: [
    { id: 'demo-agent-001', name: 'Asistente de ventas', role: 'Atención, calificación y cotización', status: 'active', description: 'Asistente ficticio que califica consultas de servicios de acero y prepara cotizaciones referenciales para revisión humana.' },
    { id: 'demo-agent-002', name: 'Asistente financiero', role: 'Cobranza y validación de comprobantes', status: 'active', description: 'Asistente ficticio que responde consultas de pago y registra comprobantes recibidos para revisión del equipo.' },
  ],
  'finance/documents': [{ id: 'demo-doc-001', tipo_documento: 'Factura demo', monto_total: 84600, total_amount: 84600, proveedor: 'Insumos Cordillera Demo', fecha_emision: '2026-09-20', confianza_extraccion: 0.95, status: 'confirmed', created_at: today }, { id: 'demo-doc-002', tipo_documento: 'Boleta demo', monto_total: 32500, total_amount: 32500, proveedor: 'Ferretería Ejemplo', fecha_emision: '2026-09-19', confianza_extraccion: 0.71, status: 'pending_review', created_at: today }],
  'finance/metrics': { totalDocs: 2, totalMonto: 117100, byType: [{ tipo_documento: 'Factura demo', count: 1, total: 84600 }, { tipo_documento: 'Boleta demo', count: 1, total: 32500 }] },
  'finance/cash-flow': demoCashFlow,
  'finance/cost-breakdown': { total_expenses: 84600, by_type: { variable: 84600 }, by_center: { operacional: 84600 } },
  'quotes/price-catalog': [
    { id: 'demo-price-001', name: 'Oxicorte A36 · 1–3 mm', category: 'Oxicorte', unit: 'pieza', unit_price: 6500, active: true },
    { id: 'demo-price-002', name: 'Oxicorte A36 · 4–6 mm', category: 'Oxicorte', unit: 'pieza', unit_price: 11800, active: true },
    { id: 'demo-price-003', name: 'Oxicorte A36 · 7–12 mm', category: 'Oxicorte', unit: 'pieza', unit_price: 18500, active: true },
    { id: 'demo-price-004', name: 'Oxicorte A36 · 13–20 mm', category: 'Oxicorte', unit: 'pieza', unit_price: 27800, active: true },
    { id: 'demo-price-005', name: 'Plegado · 1–3 mm', category: 'Plegado', unit: 'doblez', unit_price: 11250, active: true },
    { id: 'demo-price-006', name: 'Plegado · 4–6 mm', category: 'Plegado', unit: 'doblez', unit_price: 16800, active: true },
    { id: 'demo-price-007', name: 'Plegado · 7–10 mm', category: 'Plegado', unit: 'doblez', unit_price: 24500, active: true },
    { id: 'demo-price-008', name: 'Cilindrado · hasta 5 mm', category: 'Cilindrado', unit: 'hora', unit_price: 28000, active: true },
    { id: 'demo-price-009', name: 'Cilindrado · 6–10 mm', category: 'Cilindrado', unit: 'hora', unit_price: 42000, active: true },
    { id: 'demo-price-010', name: 'Cilindrado · más de 10 mm', category: 'Cilindrado', unit: 'hora', unit_price: 58000, active: true },
    { id: 'demo-price-011', name: 'Guillotinado · 1–3 mm', category: 'Guillotinado', unit: 'corte', unit_price: 3200, active: true },
    { id: 'demo-price-012', name: 'Guillotinado · 4–6 mm', category: 'Guillotinado', unit: 'corte', unit_price: 5800, active: true },
    { id: 'demo-price-013', name: 'Guillotinado · 7–10 mm', category: 'Guillotinado', unit: 'corte', unit_price: 9200, active: true },
    { id: 'demo-price-014', name: 'Corte plasma CNC · diseño simple (hasta 6 mm)', category: 'Corte plasma CNC', unit: 'diseño', unit_price: 35000, active: true },
    { id: 'demo-price-015', name: 'Corte plasma CNC · diseño complejo / múltiples piezas', category: 'Corte plasma CNC', unit: 'diseño', unit_price: 68000, active: true },
    { id: 'demo-price-016', name: 'Estructura pequeña (portón, baranda, soporte)', category: 'Estructuras metálicas', unit: 'proyecto', unit_price: 180000, active: true },
    { id: 'demo-price-017', name: 'Estructura mediana (ampliación, galpón menor)', category: 'Estructuras metálicas', unit: 'proyecto', unit_price: 420000, active: true },
    { id: 'demo-price-018', name: 'Estructura industrial / gran escala', category: 'Estructuras metálicas', unit: 'proyecto', unit_price: 950000, active: true },
  ],
  'calendar/events': { events: [
    { id: 'demo-event-001', summary: 'Revisión cotización de oxicorte · demo', description: 'Evento ficticio para mostrar seguimiento comercial.', location: 'Temuco · ubicación de muestra', start: { dateTime: '2026-09-25T11:00:00-03:00' }, end: { dateTime: '2026-09-25T11:30:00-03:00' } },
    { id: 'demo-event-002', summary: 'Confirmar medidas para cilindrado · demo', description: 'Evento ficticio para mostrar coordinación de un servicio.', location: 'Reunión remota de muestra', start: { dateTime: '2026-09-26T15:00:00-03:00' }, end: { dateTime: '2026-09-26T15:45:00-03:00' } },
    { id: 'demo-event-003', summary: 'Visita a terreno · proyecto estructura industrial · demo', description: 'Evento ficticio para mostrar coordinación de un proyecto grande.', location: 'Terreno del cliente · ubicación de muestra', start: { dateTime: '2026-09-29T10:00:00-03:00' }, end: { dateTime: '2026-09-29T11:30:00-03:00' } },
  ], email: 'agenda@example.com' },
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
  if (/^quotes\/manual\//.test(path)) return { ok: true, demo: true, quote_id: 'DEMO-2406', message: 'Acción simulada: no se envió ningún mensaje ni correo.' };
  if (/^leads\/[^/]+\/stage$/.test(path)) return { ok: true, demo: true, updated: true, body };
  if (/^conversations\//.test(path)) return { ok: true, demo: true, updated: true };
  return { ok: true, demo: true, message: 'Acción simulada; los datos de demostración no se guardan.' };
}
