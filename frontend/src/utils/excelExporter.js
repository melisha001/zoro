import * as XLSX from 'xlsx';

/**
 * Utility to export structured data arrays to genuine .xlsx Excel files using SheetJS
 */
export const exportToExcel = (filename, sheetName, headers, rows) => {
  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'Sheet1');
  
  const cleanFilename = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
};
