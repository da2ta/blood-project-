import PDFDocument from 'pdfkit';

export const generateInventoryPDF = (
  hospitalName: string,
  units: any[]
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // 1. Header
      doc.fillColor('#0284c7').fontSize(24).text('HEMOEXCHANGE AI', { align: 'left' });
      doc.fillColor('#64748b').fontSize(10).text('Inter-Hospital Blood Management Network', { align: 'left' });
      doc.moveDown(1);

      // Hospital Title & Date
      doc.fillColor('#1e293b').fontSize(16).text(`Blood Inventory Report: ${hospitalName}`);
      doc.fillColor('#64748b').fontSize(9).text(`Generated: ${new Date().toLocaleString()}`);
      doc.moveDown(1.5);

      // 2. Summary Card Grid
      const totalBags = units.length;
      const availableBags = units.filter(u => u.status === 'AVAILABLE').length;
      const expiredBags = units.filter(u => u.status === 'EXPIRED').length;

      doc.rect(50, 140, 500, 50).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#0f172a').fontSize(10);
      doc.text(`Total Blood Bags: ${totalBags}`, 70, 160);
      doc.text(`Active Available: ${availableBags}`, 220, 160);
      doc.text(`Expired / Discarded: ${expiredBags}`, 370, 160);
      doc.moveDown(3);

      // 3. Inventory Table Header
      let y = 220;
      doc.fillColor('#1e293b').fontSize(12).text('Detailed Inventory Log', 50, y);
      doc.moveDown(0.5);
      
      y += 20;
      doc.rect(50, y, 500, 20).fill('#0284c7');
      doc.fillColor('#ffffff').fontSize(10);
      doc.text('Bag ID', 60, y + 5);
      doc.text('Group', 180, y + 5);
      doc.text('Temperature', 260, y + 5);
      doc.text('Expiry Date', 360, y + 5);
      doc.text('Status', 460, y + 5);
      
      // 4. Inventory Table Rows
      doc.fillColor('#334155');
      units.forEach((unit, index) => {
        if (y > 750) {
          doc.addPage();
          y = 50; // reset y on new page
        }
        y += 20;
        // Zebra striping
        if (index % 2 === 0) {
          doc.rect(50, y, 500, 20).fill('#f1f5f9');
          doc.fillColor('#334155');
        }
        
        doc.text(unit.bloodUnitId, 60, y + 5);
        doc.text(unit.bloodGroup, 180, y + 5);
        doc.text(`${unit.storageTemperature}°C`, 260, y + 5);
        doc.text(new Date(unit.expiryDate).toLocaleDateString(), 360, y + 5);
        doc.text(unit.status, 460, y + 5);
      });

      // Footer signature
      y += 40;
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
      doc.strokeColor('#e2e8f0').moveTo(50, y).lineTo(550, y).stroke();
      doc.fillColor('#94a3b8').fontSize(8).text('HemoExchange AI Secure Report Token. Authorized Medical Staff use only.', 50, y + 10, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
