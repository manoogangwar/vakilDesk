export type VariableGroup = {
  label: string;
  color: string;
  vars: { key: string; label: string; autoFill?: boolean }[];
};

export const VARIABLE_GROUPS: VariableGroup[] = [
  {
    label: 'Date',
    color: '#1a2744',
    vars: [
      { key: 'date_today', label: 'Today (DD/MM/YYYY)', autoFill: true },
      { key: 'date_today_formal', label: 'Today (Formal)', autoFill: true },
      { key: 'year', label: 'Year', autoFill: true },
    ],
  },
  {
    label: 'Lawyer',
    color: '#856d12',
    vars: [
      { key: 'lawyer_name', label: 'Lawyer Name', autoFill: true },
      { key: 'lawyer_phone', label: 'Lawyer Phone', autoFill: true },
      { key: 'lawyer_email', label: 'Lawyer Email', autoFill: true },
      { key: 'lawyer_bar_number', label: 'Bar Council No.' },
    ],
  },
  {
    label: 'Client',
    color: '#059669',
    vars: [
      { key: 'client_name', label: 'Client Name', autoFill: true },
      { key: 'client_father_name', label: "Father's Name" },
      { key: 'client_phone', label: 'Client Phone', autoFill: true },
      { key: 'client_email', label: 'Client Email', autoFill: true },
      { key: 'client_address', label: 'Client Address', autoFill: true },
      { key: 'client_age', label: 'Client Age' },
    ],
  },
  {
    label: 'Case',
    color: '#0369a1',
    vars: [
      { key: 'case_name', label: 'Case Name', autoFill: true },
      { key: 'case_number', label: 'Case Number', autoFill: true },
      { key: 'court_name', label: 'Court Name', autoFill: true },
      { key: 'court_type', label: 'Court Type', autoFill: true },
      { key: 'judge_name', label: 'Judge Name', autoFill: true },
      { key: 'under_section', label: 'Under Section', autoFill: true },
      { key: 'police_station', label: 'Police Station', autoFill: true },
      { key: 'next_date', label: 'Next Hearing Date', autoFill: true },
    ],
  },
  {
    label: 'Document',
    color: '#7c3aed',
    vars: [
      { key: 'place', label: 'Place / City' },
      { key: 'subject', label: 'Subject' },
      { key: 'amount', label: 'Amount' },
      { key: 'property_description', label: 'Property Description' },
      { key: 'reason', label: 'Reason' },
      { key: 'duration', label: 'Duration / Period' },
      { key: 'custom_1', label: 'Custom Field 1' },
      { key: 'custom_2', label: 'Custom Field 2' },
      { key: 'custom_3', label: 'Custom Field 3' },
    ],
  },
];

// All variables flattened
export const ALL_VARIABLES = VARIABLE_GROUPS.flatMap(g =>
  g.vars.map(v => ({ ...v, group: g.label, groupColor: g.color }))
);

export function getVariableLabel(key: string): string {
  return ALL_VARIABLES.find(v => v.key === key)?.label ?? key.replace(/_/g, ' ');
}

// Build auto-fill values from profile + case + client data
type Profile = {
  first_name: string; last_name: string; phone: string; email: string; username: string;
};
type CaseData = {
  case_name: string; case_number: string; court_name: string; court_type: string;
  judge_name: string; under_section: string; police_station: string; next_date: string | null;
};
type ClientData = {
  first_name: string; last_name: string; phone: string; email: string; address: string;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateFormal(iso: string): string {
  const d = new Date(iso);
  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${ordinal(d.getDate())} day of ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

export function buildAutoFillValues(
  profile: Profile | null,
  caseData: CaseData | null,
  clientData: ClientData | null,
): Record<string, string> {
  const today = new Date().toISOString().split('T')[0];
  const vals: Record<string, string> = {
    date_today: fmtDate(today),
    date_today_formal: fmtDateFormal(today),
    year: String(new Date().getFullYear()),
  };

  if (profile) {
    vals.lawyer_name = `${profile.first_name} ${profile.last_name}`.trim() || profile.username;
    vals.lawyer_phone = profile.phone ?? '';
    vals.lawyer_email = profile.email ?? '';
  }

  if (caseData) {
    vals.case_name = caseData.case_name ?? '';
    vals.case_number = caseData.case_number ?? '';
    vals.court_name = caseData.court_name ?? '';
    vals.court_type = (caseData.court_type ?? '').replace('_', ' ');
    vals.judge_name = caseData.judge_name ?? '';
    vals.under_section = caseData.under_section ?? '';
    vals.police_station = caseData.police_station ?? '';
    vals.next_date = caseData.next_date ? fmtDate(caseData.next_date) : '';
  }

  if (clientData) {
    vals.client_name = `${clientData.first_name} ${clientData.last_name}`.trim();
    vals.client_phone = clientData.phone ?? '';
    vals.client_email = clientData.email ?? '';
    vals.client_address = clientData.address ?? '';
  }

  return vals;
}

// Render template by replacing all {{variable}} with values
export function renderTemplate(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? `[${key}]`);
}

// Content string → HTML for PDF
export function contentToHTML(content: string, title: string, category: string): string {
  const lines = content.split('\n');
  let html = '';
  let inParagraph = false;

  for (const line of lines) {
    if (line.trim() === '') {
      if (inParagraph) { html += '</p>'; inParagraph = false; }
      html += '<br>';
    } else {
      if (!inParagraph) { html += '<p>'; inParagraph = true; }
      else html += '<br>';
      html += line;
    }
  }
  if (inParagraph) html += '</p>';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 2.5cm 2cm; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.9;
      color: #000;
    }
    .doc-title {
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 6px;
    }
    .doc-category {
      text-align: center;
      font-size: 11pt;
      color: #444;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .content {
      text-align: justify;
    }
    .content p {
      margin-bottom: 12px;
      text-indent: 30px;
    }
  </style>
</head>
<body>
  <div class="doc-title">${title}</div>
  <div class="doc-category">${category}</div>
  <div class="content">${html}</div>
</body>
</html>`;
}
