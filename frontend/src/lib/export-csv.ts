export function exportToCsv(filename: string, data: any[]): boolean {
  if (!data || data.length === 0) return false;

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Convert objects to CSV rows
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(fieldName => {
        let value = row[fieldName];
        
        // Handle nested objects or arrays simply by stringifying them
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'object') {
          value = JSON.stringify(value).replace(/"/g, '""');
        } else {
          // Escape quotes in strings
          value = String(value).replace(/"/g, '""');
        }
        
        // Enclose in quotes if there are commas, quotes, or newlines
        if (value.search(/("|,|\n)/g) >= 0) {
          value = `"${value}"`;
        }
        
        return value;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  // Create a link and trigger download
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
  return false;
}
