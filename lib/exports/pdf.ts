// @ts-nocheck
import puppeteer from 'puppeteer';
import { prisma } from '@/lib/db/prisma';

export async function generateQuotePDF(quoteId: string, language: 'el' | 'en' = 'el'): Promise<Buffer> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      company: true,
      contact: true,
      items: {
        include: {
          product: true,
          unit: true,
          vatRate: true,
        },
      },
    },
  });

  if (!quote) {
    throw new Error('Quote not found');
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    const html = `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quote ${quote.quoteNo || quote.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .quote-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .quote-details {
            width: 48%;
          }
          .company-details {
            width: 48%;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .totals {
            width: 100%;
            max-width: 300px;
            margin-left: auto;
          }
          .totals td {
            padding: 5px 10px;
          }
          .totals .total-row {
            font-weight: bold;
            border-top: 2px solid #2563eb;
          }
          .footer {
            margin-top: 40px;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">AIC CRM</div>
          <h1>${language === 'el' ? 'ΠΡΟΣΦΟΡΑ' : 'QUOTE'}</h1>
        </div>

        <div class="quote-info">
          <div class="quote-details">
            <h3>${language === 'el' ? 'Στοιχεία Προσφοράς' : 'Quote Details'}</h3>
            <p><strong>${language === 'el' ? 'Αριθμός:' : 'Number:'}</strong> ${quote.quoteNo || quote.id}</p>
            <p><strong>${language === 'el' ? 'Ημερομηνία:' : 'Date:'}</strong> ${new Date(quote.createdAt).toLocaleDateString(language === 'el' ? 'el-GR' : 'en-US')}</p>
            <p><strong>${language === 'el' ? 'Ισχύει έως:' : 'Valid Until:'}</strong> ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString(language === 'el' ? 'el-GR' : 'en-US') : 'N/A'}</p>
          </div>
          
          <div class="company-details">
            <h3>${language === 'el' ? 'Στοιχεία Εταιρείας' : 'Company Details'}</h3>
            ${quote.company ? `
              <p><strong>${quote.company.name}</strong></p>
              ${quote.company.vatId ? `<p>${language === 'el' ? 'ΑΦΜ:' : 'VAT:'} ${quote.company.vatId}</p>` : ''}
              ${quote.company.email ? `<p>${language === 'el' ? 'Email:' : 'Email:'} ${quote.company.email}</p>` : ''}
              ${quote.company.phone ? `<p>${language === 'el' ? 'Τηλέφωνο:' : 'Phone:'} ${quote.company.phone}</p>` : ''}
            ` : ''}
            ${quote.contact ? `
              <p><strong>${language === 'el' ? 'Επαφή:' : 'Contact:'}</strong> ${quote.contact.firstName} ${quote.contact.lastName}</p>
              ${quote.contact.email ? `<p>Email: ${quote.contact.email}</p>` : ''}
            ` : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>${language === 'el' ? 'Περιγραφή' : 'Description'}</th>
              <th>${language === 'el' ? 'Ποσότητα' : 'Quantity'}</th>
              <th>${language === 'el' ? 'Μονάδα' : 'Unit'}</th>
              <th>${language === 'el' ? 'Τιμή' : 'Price'}</th>
              <th>${language === 'el' ? 'ΦΠΑ' : 'VAT'}</th>
              <th>${language === 'el' ? 'Σύνολο' : 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items.map(item => `
              <tr>
                <td>
                  <strong>${item.name}</strong>
                  ${item.description ? `<br><small>${item.description}</small>` : ''}
                </td>
                <td>${item.qty}</td>
                <td>${item.unit?.name || ''}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${item.vatRate?.rate || 0}%</td>
                <td>${item.lineTotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table class="totals">
          ${quote.subtotal ? `
            <tr>
              <td>${language === 'el' ? 'Υποσύνολο:' : 'Subtotal:'}</td>
              <td>${quote.subtotal.toFixed(2)} ${quote.currency}</td>
            </tr>
          ` : ''}
          ${quote.vatTotal ? `
            <tr>
              <td>${language === 'el' ? 'ΦΠΑ:' : 'VAT:'}</td>
              <td>${quote.vatTotal.toFixed(2)} ${quote.currency}</td>
            </tr>
          ` : ''}
          ${quote.total ? `
            <tr class="total-row">
              <td>${language === 'el' ? 'ΣΥΝΟΛΟ:' : 'TOTAL:'}</td>
              <td>${quote.total.toFixed(2)} ${quote.currency}</td>
            </tr>
          ` : ''}
        </table>

        <div class="footer">
          <p>${language === 'el' ? 'Αυτή η προσφορά ισχύει για 30 ημέρες από την ημερομηνία έκδοσης.' : 'This quote is valid for 30 days from the date of issue.'}</p>
          <p>${language === 'el' ? 'Για περισσότερες πληροφορίες, επικοινωνήστε μαζί μας.' : 'For more information, please contact us.'}</p>
        </div>
      </body>
      </html>
    `;

    await page.setContent(html);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

export async function generateOrderPDF(orderId: string, language: 'el' | 'en' = 'el'): Promise<Buffer> {
  // Similar implementation for orders
  // TODO: Implement order PDF generation
  throw new Error('Order PDF generation not implemented yet');
}

export async function generateTicketPDF(ticketId: string, language: 'el' | 'en' = 'el'): Promise<Buffer> {
  // Similar implementation for tickets
  // TODO: Implement ticket PDF generation
  throw new Error('Ticket PDF generation not implemented yet');
}
