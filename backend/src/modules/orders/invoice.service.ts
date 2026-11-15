import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class InvoiceService {
  generateInvoice(order: any, res: Response) {
    const doc = new PDFDocument({ margin: 50 });

    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Order Number: ${order.orderNumber}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    doc.text('Bill To:');
    doc.text(order.customerName);
    doc.text(order.addressLine1);
    if (order.addressLine2) doc.text(order.addressLine2);
    doc.text(`${order.city}, ${order.state} - ${order.zipCode}`);
    doc.moveDown();

    // Table Header
    const tableTop = 250;
    doc.font('Helvetica-Bold');
    doc.text('Product', 50, tableTop);
    doc.text('Qty', 300, tableTop);
    doc.text('Price', 400, tableTop);
    doc.text('Total', 500, tableTop);
    doc.moveDown();

    // Table Rows
    let position = tableTop + 25;
    doc.font('Helvetica');
    order.items.forEach(item => {
      doc.text(item.product.name, 50, position);
      doc.text(item.quantity.toString(), 300, position);
      doc.text(`₹${item.price}`, 400, position);
      doc.text(`₹${item.price * item.quantity}`, 500, position);
      position += 20;
    });

    doc.moveDown();
    doc.text(`Subtotal: ₹${order.totalAmount}`, { align: 'right' });
    doc.text(`GST (18%): ₹${order.gstAmount}`, { align: 'right' });
    doc.fontSize(16).text(`Grand Total: ₹${Number(order.totalAmount) + Number(order.gstAmount)}`, { align: 'right' });

    doc.end();
    doc.pipe(res);
  }

  generateLabel(order: any, res: Response) {
    const doc = new PDFDocument({ size: [288, 432], margin: 20 }); // 4x6 inches

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('Fulfillment Center OS', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Shipping Label', { align: 'center' });
    doc.moveDown();
    doc.rect(20, 50, 248, 1).fill('#000000');
    doc.moveDown();

    // From
    doc.fontSize(8).font('Helvetica-Bold').text('FROM:');
    doc.font('Helvetica').text('FCOS Central Warehouse');
    doc.text('Industrial Area, Sector 5');
    doc.text('New Delhi, 110001');
    doc.moveDown();

    // To
    doc.fontSize(10).font('Helvetica-Bold').text('SHIP TO:');
    doc.fontSize(12).text(order.customerName);
    doc.fontSize(10).font('Helvetica').text(order.addressLine1);
    if (order.addressLine2) doc.text(order.addressLine2);
    doc.text(`${order.city}, ${order.state} - ${order.zipCode}`);
    doc.moveDown();

    // Tracking & Barcode Mock
    doc.rect(20, 220, 248, 100).stroke();
    doc.fontSize(8).text('TRACKING NUMBER:', 30, 230);
    doc.fontSize(14).font('Helvetica-Bold').text(order.shipment?.trackingNumber || 'PENDING', 30, 245);
    
    // Simple mock barcode lines
    let x = 40;
    for (let i = 0; i < 40; i++) {
      const width = Math.random() > 0.5 ? 2 : 4;
      doc.rect(x, 270, width, 40).fill('#000000');
      x += width + 2;
    }

    // Footer
    doc.fontSize(10).font('Helvetica-Bold').text(`ORDER: #${order.orderNumber}`, 20, 390);
    doc.fontSize(8).font('Helvetica').text(`Weight: ${order.weight || '0.5'} kg`, 20, 405);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });

    doc.end();
    doc.pipe(res);
  }
}
