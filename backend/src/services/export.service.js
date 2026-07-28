const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Streams `rows` as an .xlsx workbook. `columns` is the same shape ExcelJS
 * expects: [{ header, key, width }]. Shared by both the search-results
 * export and every analytics report export so all Phase 8 exports look and
 * behave consistently.
 */
async function streamExcel(res, { fileName, sheetName = 'Sheet1', columns, rows }) {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'University System';
  workbook.created = new Date();

  // Excel sheet names are capped at 31 characters.
  const sheet = workbook.addWorksheet(String(sheetName).slice(0, 31));
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 20 }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EEFB' } };

  rows.forEach((row) => sheet.addRow(row));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  await workbook.xlsx.write(res);
  res.end();
}

/**
 * Streams `rows` as a simple landscape PDF table. Intentionally lightweight
 * (no external template) — good enough for the "Export to PDF" deliverable
 * without pulling in a heavier PDF-templating dependency.
 */
function streamPdfTable(res, { fileName, title, columns, rows }) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  doc.pipe(res);

  doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.fontSize(9).font('Helvetica').fillColor('#666666').text(
    `Generated ${new Date().toLocaleString()}`,
    { align: 'center' }
  );
  doc.fillColor('#000000');
  doc.moveDown();

  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = usableWidth / columns.length;
  let y = doc.y;

  const drawHeader = () => {
    doc.font('Helvetica-Bold').fontSize(9);
    columns.forEach((col, i) => {
      doc.text(col.header, startX + i * colWidth, y, { width: colWidth - 4, ellipsis: true });
    });
    y += 16;
    doc
      .moveTo(startX, y - 4)
      .lineTo(startX + usableWidth, y - 4)
      .strokeColor('#cccccc')
      .stroke();
    doc.font('Helvetica').fontSize(8);
  };

  drawHeader();

  rows.forEach((row) => {
    if (y > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }
    columns.forEach((col, i) => {
      const value = row[col.key];
      doc.text(value === null || value === undefined ? '' : String(value), startX + i * colWidth, y, {
        width: colWidth - 4,
        ellipsis: true,
      });
    });
    y += 16;
  });

  if (rows.length === 0) {
    doc.fillColor('#666666').text('No matching records.', startX, y);
  }

  doc.end();
}

module.exports = { streamExcel, streamPdfTable };
