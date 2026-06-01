import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';

// ── Reusable signature & stamp (stored locally per device) ─────────────────

const SIGNATURE_KEY = 'doc_signature_uri';
const STAMP_KEY = 'doc_stamp_uri';

export async function getSignatureUri(): Promise<string | null> {
  return AsyncStorage.getItem(SIGNATURE_KEY);
}
export async function setSignatureUri(uri: string | null): Promise<void> {
  if (uri) await AsyncStorage.setItem(SIGNATURE_KEY, uri);
  else await AsyncStorage.removeItem(SIGNATURE_KEY);
}
export async function getStampUri(): Promise<string | null> {
  return AsyncStorage.getItem(STAMP_KEY);
}
export async function setStampUri(uri: string | null): Promise<void> {
  if (uri) await AsyncStorage.setItem(STAMP_KEY, uri);
  else await AsyncStorage.removeItem(STAMP_KEY);
}

// Read a local image file and return a base64 data URI for embedding in HTML.
export async function imageToDataUri(uri: string): Promise<string | null> {
  try {
    const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    const ext = uri.split('.').pop()?.toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

// ── Document body rendering ────────────────────────────────────────────────

// Replace {{key}} placeholders. Unlike the raw-template renderer, missing or
// blank values collapse to an empty string (the lawyer fills a clean form, so
// no [placeholder] artefacts should ever surface in a generated document).
export function renderDocument(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => (values[key] ?? '').trim());
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function bodyToHtml(content: string): string {
  const lines = content.split('\n');
  let html = '';
  let inParagraph = false;
  for (const raw of lines) {
    const line = escapeHtml(raw);
    if (raw.trim() === '') {
      if (inParagraph) { html += '</p>'; inParagraph = false; }
    } else {
      if (!inParagraph) { html += '<p>'; inParagraph = true; }
      else html += '<br>';
      html += line;
    }
  }
  if (inParagraph) html += '</p>';
  return html;
}

export type DocumentHtmlOptions = {
  title: string;
  category: string;
  body: string;
  signatureDataUri?: string | null;
  stampDataUri?: string | null;
  signerLabel?: string;   // caption under the signature, e.g. lawyer/deponent name
};

// Build an A4-formatted HTML document for expo-print. Signature and stamp
// images (if provided) are placed in a signing block at the foot of the text.
export function buildDocumentHTML(opts: DocumentHtmlOptions): string {
  const { title, category, body, signatureDataUri, stampDataUri, signerLabel } = opts;

  const hasSign = !!signatureDataUri || !!stampDataUri;
  const signBlock = hasSign
    ? `<div class="sign-block">
        ${stampDataUri ? `<div class="sign-cell"><img class="stamp" src="${stampDataUri}" /><div class="sign-caption">Seal / Stamp</div></div>` : ''}
        ${signatureDataUri ? `<div class="sign-cell"><img class="sign" src="${signatureDataUri}" /><div class="sign-caption">${escapeHtml(signerLabel ?? 'Signature')}</div></div>` : ''}
      </div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page { size: A4; margin: 2.5cm 2cm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.85;
      color: #000;
      margin: 0;
    }
    .doc-head {
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 26px;
    }
    .doc-title {
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .doc-category {
      text-align: center;
      font-size: 10.5pt;
      color: #444;
      margin-top: 4px;
    }
    .content p { margin: 0 0 12px 0; text-align: justify; }
    .sign-block {
      margin-top: 48px;
      display: flex;
      justify-content: flex-end;
      gap: 48px;
      align-items: flex-end;
    }
    .sign-cell { text-align: center; }
    .sign { height: 70px; max-width: 200px; object-fit: contain; }
    .stamp { height: 90px; max-width: 150px; object-fit: contain; opacity: 0.9; }
    .sign-caption {
      border-top: 1px solid #000;
      margin-top: 4px;
      padding-top: 4px;
      font-size: 10.5pt;
    }
  </style>
</head>
<body>
  <div class="doc-head">
    <div class="doc-title">${escapeHtml(title)}</div>
    ${category ? `<div class="doc-category">${escapeHtml(category)}</div>` : ''}
  </div>
  <div class="content">${bodyToHtml(body)}</div>
  ${signBlock}
</body>
</html>`;
}
