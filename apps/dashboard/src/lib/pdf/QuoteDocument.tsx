import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface QuoteDocumentItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface QuoteDocumentProps {
  quoteId: string;
  subject: string | null;
  contactName: string | null;
  contactCompany: string | null;
  contactEmail: string | null;
  phone: string;
  items: QuoteDocumentItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  status: string;
}

const clp = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1e293b' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  logoBadge: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  logoText: { color: '#f97316', fontSize: 16, fontFamily: 'Helvetica-Bold' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  companyName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  companyTag: { fontSize: 8, color: '#64748b', marginTop: 2 },
  docTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0f172a', textAlign: 'right' },
  docMeta: { fontSize: 9, color: '#64748b', textAlign: 'right', marginTop: 2 },
  divider: { height: 2, backgroundColor: '#f97316', marginBottom: 20 },
  section: { marginBottom: 18 },
  sectionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  clientName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  clientLine: { fontSize: 9, color: '#475569', marginTop: 1 },
  table: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0f172a', paddingVertical: 6, paddingHorizontal: 8 },
  tableHeaderCell: { color: '#ffffff', fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  cellDesc: { flex: 5 },
  cellQty: { flex: 1, textAlign: 'center' },
  cellUnit: { flex: 1.6, textAlign: 'right' },
  cellTotal: { flex: 1.6, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  totals: { marginTop: 14, alignSelf: 'flex-end', width: 220 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { color: '#64748b' },
  totalValue: { fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0f172a', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 4, marginTop: 6 },
  grandTotalLabel: { color: '#f1f5f9', fontFamily: 'Helvetica-Bold', fontSize: 11 },
  grandTotalValue: { color: '#f97316', fontFamily: 'Helvetica-Bold', fontSize: 13 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8, marginTop: 16 },
  statusText: { color: '#047857', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 },
  footerText: { fontSize: 7.5, color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 },
});

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
};

export function QuoteDocument(props: QuoteDocumentProps) {
  const { quoteId, subject, contactName, contactCompany, contactEmail, phone, items, subtotal, tax, total, createdAt, status } = props;
  const dateStr = new Date(createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Document title={`Cotización ${quoteId} · Aceros Temuco`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}><Text style={styles.logoText}>AT</Text></View>
            <View>
              <Text style={styles.companyName}>Aceros Temuco</Text>
              <Text style={styles.companyTag}>Oxicorte · Cilindrado · Guillotinado · Corte plasma CNC · Plegado · Estructuras metálicas</Text>
              <Text style={styles.companyTag}>acerostemuco.cl · Temuco, Chile — documento de demostración</Text>
            </View>
          </View>
          <View>
            <Text style={styles.docTitle}>COTIZACIÓN</Text>
            <Text style={styles.docMeta}>N° {quoteId}</Text>
            <Text style={styles.docMeta}>{dateStr}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cliente</Text>
          <Text style={styles.clientName}>{contactName || 'Sin nombre'}</Text>
          {contactCompany && <Text style={styles.clientLine}>{contactCompany}</Text>}
          <Text style={styles.clientLine}>{phone}</Text>
          {contactEmail && <Text style={styles.clientLine}>{contactEmail}</Text>}
        </View>

        {subject && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Asunto</Text>
            <Text style={styles.clientLine}>{subject}</Text>
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.cellDesc]}>Descripción</Text>
            <Text style={[styles.tableHeaderCell, styles.cellQty]}>Cant.</Text>
            <Text style={[styles.tableHeaderCell, styles.cellUnit]}>Precio unit.</Text>
            <Text style={[styles.tableHeaderCell, styles.cellTotal]}>Total</Text>
          </View>
          {items.map((it, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.cellDesc}>{it.description}</Text>
              <Text style={styles.cellQty}>{it.quantity}</Text>
              <Text style={styles.cellUnit}>{clp(it.unit_price)}</Text>
              <Text style={styles.cellTotal}>{clp(it.unit_price * it.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Neto</Text>
            <Text style={styles.totalValue}>{clp(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA (19%)</Text>
            <Text style={styles.totalValue}>{clp(tax)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{clp(total)}</Text>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Estado: {STATUS_LABEL[status] ?? status}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Cotización referencial, válida por 15 días. Generada automáticamente por el asistente de IA de ATM Agent y aprobada por el equipo comercial antes del envío.
          </Text>
          <Text style={styles.footerText}>
            Documento de demostración — datos y logo ficticios, no representa una transacción real.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
