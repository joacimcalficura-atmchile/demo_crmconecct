import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { demoQuotes } from '@/lib/demo-data';
import { QuoteDocument, type QuoteDocumentItem } from '@/lib/pdf/QuoteDocument';

// Necesita el runtime de Node (Buffer, streams) — @react-pdf/renderer no corre en Edge.
export const runtime = 'nodejs';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const quote = demoQuotes.find((q) => q.id === id);
  if (!quote) {
    return NextResponse.json({ error: 'Cotización de demostración no encontrada.' }, { status: 404 });
  }

  const items: QuoteDocumentItem[] = JSON.parse(quote.items_json);
  const buffer = await renderToBuffer(
    QuoteDocument({
      quoteId: quote.id,
      subject: quote.subject,
      contactName: quote.contact_name,
      contactCompany: quote.contact_company,
      contactEmail: quote.contact_email,
      phone: quote.phone,
      items,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      createdAt: quote.created_at,
      status: quote.status,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Cotizacion-${quote.id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
