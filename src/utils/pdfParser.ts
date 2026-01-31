import * as pdfjsLib from 'pdfjs-dist';
import { Regal, Issue } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

const COMPONENT_COLUMNS = [
  'Stütze vorn',
  'Stütze hinten',
  'Horizontale Strebe',
  'Diagonale Strebe 1',
  'Diagonale Strebe 2'
];

export async function parsePDFReport(file: File): Promise<Regal[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const regale: Regal[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const operatorList = await page.getOperatorList();

    const items = textContent.items as TextItem[];
    const textItems = items.map(item => ({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5]
    }));

    const colors = extractColors(operatorList);

    const pageRegale = extractRegaleFromPage(textItems, colors);
    regale.push(...pageRegale);
  }

  return regale;
}

function extractColors(operatorList: any): Map<string, string> {
  const colorMap = new Map<string, string>();
  let currentColor = 'black';

  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const fn = operatorList.fnArray[i];
    const args = operatorList.argsArray[i];

    if (fn === pdfjsLib.OPS.setFillRGBColor || fn === pdfjsLib.OPS.setStrokeRGBColor) {
      const [r, g, b] = args;

      if (r > 0.8 && g < 0.3 && b < 0.3) {
        currentColor = 'Rot';
      } else if (r > 0.8 && g > 0.5 && b < 0.3) {
        currentColor = 'Orange';
      } else if (r < 0.3 && g > 0.6 && b < 0.3) {
        currentColor = 'Grün';
      } else {
        currentColor = 'black';
      }
    }

    if (fn === pdfjsLib.OPS.showText || fn === pdfjsLib.OPS.showSpacedText) {
      const text = Array.isArray(args[0])
        ? args[0].filter((item: any) => typeof item === 'string').join('')
        : args[0];

      if (text && currentColor !== 'black') {
        colorMap.set(text, currentColor);
      }
    }
  }

  return colorMap;
}

function extractRegaleFromPage(textItems: Array<{text: string, x: number, y: number}>, colors: Map<string, string>): Regal[] {
  const regale: Regal[] = [];

  let inKurzberichtSection = false;
  const rows: Array<{text: string, x: number, y: number}[]> = [];
  let currentRow: Array<{text: string, x: number, y: number}> = [];
  let lastY = -1;

  for (const item of textItems) {
    if (item.text.includes('Kurzbericht Regalprüfung')) {
      inKurzberichtSection = true;
      continue;
    }

    if (inKurzberichtSection) {
      if (item.text.trim() === '' || item.text.length < 1) continue;

      if (lastY !== -1 && Math.abs(item.y - lastY) > 5) {
        if (currentRow.length > 0) {
          rows.push([...currentRow]);
          currentRow = [];
        }
      }

      currentRow.push(item);
      lastY = item.y;

      if (item.text.includes('Seite') || item.text.includes('Ende')) {
        break;
      }
    }
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  for (const row of rows) {
    const regal = parseRegalRow(row, colors);
    if (regal) {
      regale.push(regal);
    }
  }

  return regale;
}

function parseRegalRow(row: Array<{text: string, x: number, y: number}>, colors: Map<string, string>): Regal | null {
  const sortedRow = row.sort((a, b) => a.x - b.x);
  const rowText = sortedRow.map(item => item.text).join(' ');

  if (!rowText.match(/[A-Z]{2,}|R\s*\d+/)) {
    return null;
  }

  const labelMatch = rowText.match(/^([A-Z\s]+(?:R\s*\d+)?[A-Z\s\d]*)/);
  if (!labelMatch) return null;

  const label = labelMatch[1].trim();

  const codeMatch = rowText.match(/(\d{3}\.\d{2}\.\d\.\d{2})/);
  const code = codeMatch ? codeMatch[1] : null;

  const issues: Issue[] = [];

  for (let i = 0; i < sortedRow.length; i++) {
    const item = sortedRow[i];
    const text = item.text.trim();

    const numberMatch = text.match(/^(\d+)$/);
    if (numberMatch) {
      const count = parseInt(numberMatch[1]);

      let color: 'Rot' | 'Orange' | 'Grün' | null = null;
      if (colors.has(text)) {
        color = colors.get(text) as 'Rot' | 'Orange' | 'Grün';
      }

      if (!color) {
        const nextItems = sortedRow.slice(i, i + 3);
        for (const nextItem of nextItems) {
          if (colors.has(nextItem.text)) {
            color = colors.get(nextItem.text) as 'Rot' | 'Orange' | 'Grün';
            break;
          }
        }
      }

      if (!color) {
        color = 'Rot';
      }

      const componentIndex = Math.floor((i - 1) / 2);
      if (componentIndex >= 0 && componentIndex < COMPONENT_COLUMNS.length) {
        const component = COMPONENT_COLUMNS[componentIndex];
        issues.push({ component, color, count });
      }
    }
  }

  if (issues.length === 0) {
    return null;
  }

  return { label, code, issues };
}
