// Form-based document generator schema.
//
// Each standard legal document exposes a list of PREDEFINED, human-labelled
// fields — the lawyer never edits raw {{variables}}. Fields can be auto-filled
// from the selected client / lawyer profile and remain editable before
// generation. The `content` string is the document body template; its
// {{placeholders}} are resolved from field values plus injected date values.

export type DocFieldType = 'text' | 'textarea' | 'number';

// Values that can be pre-populated when a client is selected.
export type AutoFillSource =
  | 'client_name'
  | 'client_address'
  | 'client_phone'
  | 'client_email'
  | 'lawyer_name'
  | 'lawyer_phone'
  | 'lawyer_email';

export type DocField = {
  key: string;            // matches a {{placeholder}} in content
  label: string;
  type?: DocFieldType;    // default 'text'
  required?: boolean;
  autoFill?: AutoFillSource;
  placeholder?: string;
  hint?: string;
  default?: string;       // pre-filled value when nothing auto-fills it
};

export type DocFormDef = {
  key: string;            // matches DocumentTemplate.category
  label: string;          // short menu label
  title: string;          // formal heading printed on the document
  icon: string;
  description: string;
  fields: DocField[];
  content: string;
};

// ── Standard documents ────────────────────────────────────────────────────

export const DOC_FORMS: DocFormDef[] = [
  {
    key: 'income_certificate',
    label: 'Income Certificate',
    title: 'Income Certificate Application',
    icon: '💰',
    description: 'Application to the Tehsildar / BDO for an income certificate.',
    fields: [
      { key: 'authority', label: 'Addressed To', required: true, default: 'The Tehsildar / Block Development Officer' },
      { key: 'applicant_name', label: 'Applicant Name', required: true, autoFill: 'client_name' },
      { key: 'father_name', label: "Father's / Husband's Name", required: true },
      { key: 'address', label: 'Permanent Address', type: 'textarea', required: true, autoFill: 'client_address' },
      { key: 'annual_income', label: 'Annual Family Income (₹)', type: 'number', required: true },
      { key: 'purpose', label: 'Purpose of Certificate', type: 'textarea', required: true, placeholder: 'e.g. school admission, scholarship' },
      { key: 'phone', label: 'Contact Number', autoFill: 'client_phone' },
      { key: 'place', label: 'Place', required: true },
    ],
    content: `To,
{{authority}},
{{place}}

Subject: Application for Income Certificate

Respected Sir/Madam,

I, {{applicant_name}}, Son/Daughter of {{father_name}}, permanent resident of {{address}}, respectfully submit this application for the issuance of an Income Certificate.

The particulars are as under:

1. Name of Applicant: {{applicant_name}}
2. Father's / Husband's Name: {{father_name}}
3. Permanent Address: {{address}}
4. Annual Family Income (from all sources): Rs. {{annual_income}}/-
5. Purpose for which the certificate is required: {{purpose}}

I hereby declare that the information furnished above is true and correct to the best of my knowledge and belief, and I undertake to produce supporting documents as and when required.

It is, therefore, requested that an Income Certificate may kindly be issued in my favour at the earliest.

Yours faithfully,

{{applicant_name}}
Contact: {{phone}}
Date: {{date_today}}
Place: {{place}}`,
  },

  {
    key: 'domicile_certificate',
    label: 'Domicile Certificate',
    title: 'Domicile Certificate Application',
    icon: '🏠',
    description: 'Application for a domicile / residence certificate.',
    fields: [
      { key: 'authority', label: 'Addressed To', required: true, default: 'The Tehsildar / Sub-Divisional Magistrate' },
      { key: 'applicant_name', label: 'Applicant Name', required: true, autoFill: 'client_name' },
      { key: 'father_name', label: "Father's / Husband's Name", required: true },
      { key: 'address', label: 'Residential Address', type: 'textarea', required: true, autoFill: 'client_address' },
      { key: 'residing_since', label: 'Resident Since (Year)', required: true, placeholder: 'e.g. 1998 / since birth' },
      { key: 'purpose', label: 'Purpose of Certificate', type: 'textarea', required: true },
      { key: 'place', label: 'Place', required: true },
    ],
    content: `To,
{{authority}},
{{place}}

Subject: Application for Domicile Certificate

Respected Sir/Madam,

I, {{applicant_name}}, Son/Daughter of {{father_name}}, beg to state that I am a permanent and bona fide resident of {{address}} since {{residing_since}}.

The following documents are enclosed as proof of residence:
1. Copy of Aadhaar Card / Voter ID
2. Proof of residence (utility bill / ration card)
3. Recent passport-size photographs

I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.

It is, therefore, requested that a Domicile Certificate may kindly be issued in my favour for the purpose of {{purpose}}.

Yours faithfully,

{{applicant_name}}
Date: {{date_today}}
Place: {{place}}`,
  },

  {
    key: 'caste_certificate',
    label: 'Caste Certificate',
    title: 'Caste Certificate Application',
    icon: '📋',
    description: 'Application for an SC / ST / OBC caste certificate.',
    fields: [
      { key: 'authority', label: 'Addressed To', required: true, default: 'The Tehsildar / Sub-Divisional Magistrate' },
      { key: 'applicant_name', label: 'Applicant Name', required: true, autoFill: 'client_name' },
      { key: 'father_name', label: "Father's / Husband's Name", required: true },
      { key: 'address', label: 'Permanent Address', type: 'textarea', required: true, autoFill: 'client_address' },
      { key: 'caste_name', label: 'Caste / Community', required: true },
      { key: 'category', label: 'Category', required: true, default: 'SC / ST / OBC' },
      { key: 'purpose', label: 'Purpose of Certificate', type: 'textarea', required: true },
      { key: 'place', label: 'Place', required: true },
    ],
    content: `To,
{{authority}},
{{place}}

Subject: Application for Caste Certificate

Respected Sir/Madam,

I, {{applicant_name}}, Son/Daughter of {{father_name}}, permanent resident of {{address}}, hereby apply for the issuance of a Caste Certificate.

I belong to the {{caste_name}} caste, which is notified under the {{category}} category as per the Government notification in force.

Documents enclosed:
1. Copy of Aadhaar Card / Voter ID
2. Copy of Father's Caste Certificate (if available)
3. Copy of school certificate mentioning caste
4. Recent passport-size photographs

I hereby declare that the above information is true to the best of my knowledge and belief.

Purpose: {{purpose}}

Yours faithfully,

{{applicant_name}}
Date: {{date_today}}
Place: {{place}}`,
  },

  {
    key: 'affidavit',
    label: 'Affidavit',
    title: 'Affidavit',
    icon: '📜',
    description: 'General sworn affidavit with verification clause.',
    fields: [
      { key: 'deponent_name', label: 'Deponent Name', required: true, autoFill: 'client_name' },
      { key: 'father_name', label: "Father's / Husband's Name", required: true },
      { key: 'age', label: 'Age (in years)', type: 'number' },
      { key: 'address', label: 'Residential Address', type: 'textarea', required: true, autoFill: 'client_address' },
      { key: 'statements', label: 'Declaration / Statements', type: 'textarea', required: true, hint: 'Write each point on a new line.' },
      { key: 'place', label: 'Place (where sworn)', required: true },
      { key: 'bar_number', label: 'Advocate Bar Council No.' },
    ],
    content: `I, {{deponent_name}}, Son/Daughter/Wife of {{father_name}}, aged about {{age}} years, resident of {{address}}, do hereby solemnly affirm and declare as under:

{{statements}}

I further state that the contents of this affidavit are true and correct to the best of my knowledge and belief and that nothing material has been concealed therefrom.

DEPONENT

VERIFICATION

Verified at {{place}} on this {{date_today_formal}} that the contents of the above affidavit are true and correct to the best of my knowledge and belief and nothing material has been concealed therein.

DEPONENT

Drafted by: {{lawyer_name}}, Advocate
Bar Council No.: {{bar_number}}`,
  },

  {
    key: 'noc',
    label: 'NOC',
    title: 'No Objection Certificate',
    icon: '✅',
    description: 'No Objection Certificate issued in favour of a person.',
    fields: [
      { key: 'issuer_name', label: 'Issued By (Name / Organisation)', required: true },
      { key: 'issuer_designation', label: 'Designation / Capacity' },
      { key: 'issuer_address', label: 'Issuer Address', type: 'textarea' },
      { key: 'beneficiary_name', label: 'In Favour Of', required: true, autoFill: 'client_name' },
      { key: 'father_name', label: "Father's / Husband's Name" },
      { key: 'beneficiary_address', label: 'Address', type: 'textarea', autoFill: 'client_address' },
      { key: 'purpose', label: 'Purpose', type: 'textarea', required: true },
      { key: 'validity', label: 'Valid For', default: '6 months' },
      { key: 'place', label: 'Place', required: true },
    ],
    content: `Date: {{date_today}}
Place: {{place}}

TO WHOMSOEVER IT MAY CONCERN

This is to certify that we, {{issuer_name}}, have no objection whatsoever to {{beneficiary_name}}, Son/Daughter of {{father_name}}, resident of {{beneficiary_address}}, for the purpose of {{purpose}}.

This certificate is being issued at the request of {{beneficiary_name}} for the purpose mentioned above and shall remain valid for a period of {{validity}} from the date of issuance.

This certificate is issued in good faith and based on the information available to us. We bear no responsibility for any misuse of this certificate.

Issued by:

Name: {{issuer_name}}
Designation / Capacity: {{issuer_designation}}
Address: {{issuer_address}}
Date: {{date_today}}
Place: {{place}}

(Signature with Seal)`,
  },

  {
    key: 'rti',
    label: 'RTI Application',
    title: 'RTI Application',
    icon: '🔍',
    description: 'Application for information under the RTI Act, 2005.',
    fields: [
      { key: 'public_authority', label: 'Public Information Officer / Department', required: true },
      { key: 'authority_address', label: 'Department Address', type: 'textarea' },
      { key: 'applicant_name', label: 'Applicant Name', required: true, autoFill: 'client_name' },
      { key: 'father_name', label: "Father's / Husband's Name" },
      { key: 'address', label: 'Address', type: 'textarea', required: true, autoFill: 'client_address' },
      { key: 'phone', label: 'Contact Number', autoFill: 'client_phone' },
      { key: 'info_sought', label: 'Information Requested', type: 'textarea', required: true, hint: 'List each point of information you are seeking.' },
      { key: 'period', label: 'Period / Time Frame', placeholder: 'e.g. 01/2023 to 12/2023' },
      { key: 'place', label: 'Place', required: true },
    ],
    content: `To,
The Public Information Officer,
{{public_authority}}
{{authority_address}}

Subject: Application seeking information under the RTI Act, 2005

Sir/Madam,

I, {{applicant_name}}, Son/Daughter of {{father_name}}, resident of {{address}}, hereby request the following information under the Right to Information Act, 2005:

{{info_sought}}

Period / time frame of the information sought: {{period}}

I am enclosing an Indian Postal Order / Demand Draft / Court Fee Stamp of Rs. 10/- (Rupees Ten Only) as the prescribed application fee.

If the information requested is not held by your office, kindly transfer this application to the concerned Public Information Officer under Section 6(3) of the RTI Act, 2005, and inform me of the same.

Yours faithfully,

{{applicant_name}}
Address: {{address}}
Contact: {{phone}}
Date: {{date_today}}
Place: {{place}}`,
  },

  {
    key: 'rent_agreement',
    label: 'Rent Agreement',
    title: 'Rent / Leave & Licence Agreement',
    icon: '🔑',
    description: 'Leave & licence / rent agreement between landlord and tenant.',
    fields: [
      { key: 'landlord_name', label: 'Landlord / Licensor Name', required: true },
      { key: 'landlord_address', label: 'Landlord Address', type: 'textarea' },
      { key: 'tenant_name', label: 'Tenant / Licensee Name', required: true, autoFill: 'client_name' },
      { key: 'tenant_father_name', label: "Tenant's Father's Name" },
      { key: 'tenant_address', label: 'Tenant Address', type: 'textarea', autoFill: 'client_address' },
      { key: 'property_address', label: 'Property Address', type: 'textarea', required: true },
      { key: 'monthly_rent', label: 'Monthly Rent (₹)', type: 'number', required: true },
      { key: 'security_deposit', label: 'Security Deposit (₹)', type: 'number' },
      { key: 'lease_duration', label: 'Lease Duration', default: '11 months', required: true },
      { key: 'usage', label: 'Use of Premises', default: 'residential' },
      { key: 'start_date', label: 'Commencement Date', placeholder: 'DD/MM/YYYY' },
      { key: 'place', label: 'Place', required: true },
    ],
    content: `This Agreement is made and executed at {{place}} on this {{date_today_formal}}.

BETWEEN

{{landlord_name}}, resident of {{landlord_address}} (hereinafter referred to as the "LANDLORD / LICENSOR"), of the ONE PART;

AND

{{tenant_name}}, Son/Daughter of {{tenant_father_name}}, resident of {{tenant_address}} (hereinafter referred to as the "TENANT / LICENSEE"), of the OTHER PART.

WHEREAS the Landlord is the absolute owner of the premises situated at {{property_address}};

AND WHEREAS the Tenant is desirous of taking the said premises on rent/licence for {{usage}} purpose;

NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:

1. TERM: This agreement shall be for a period of {{lease_duration}} commencing from {{start_date}}.

2. RENT / LICENCE FEE: The Tenant shall pay a monthly rent / licence fee of Rs. {{monthly_rent}}/- per month.

3. SECURITY DEPOSIT: The Tenant has paid a refundable, interest-free security deposit of Rs. {{security_deposit}}/-.

4. USE: The premises shall be used only for {{usage}} purpose.

5. The Tenant shall not sublet, assign or part with possession of the said premises without the prior written consent of the Landlord.

6. The Tenant shall keep the premises in good and tenantable condition and shall not make any structural alterations without the Landlord's consent.

7. Either party may terminate this agreement by giving one month's prior notice in writing to the other party.

IN WITNESS WHEREOF, the parties have signed this agreement on the day, month and year first hereinabove written.

LANDLORD / LICENSOR                    TENANT / LICENSEE

_____________________                  _____________________
{{landlord_name}}                      {{tenant_name}}

WITNESSES:
1. _____________________
2. _____________________`,
  },

  {
    key: 'legal_notice',
    label: 'Legal Notice',
    title: 'Legal Notice',
    icon: '⚖️',
    description: 'Advocate legal notice to an opposite party.',
    fields: [
      { key: 'recipient_name', label: 'Recipient (Opposite Party)', required: true },
      { key: 'recipient_address', label: 'Recipient Address', type: 'textarea' },
      { key: 'client_name', label: 'On Behalf Of (Client)', required: true, autoFill: 'client_name' },
      { key: 'client_address', label: 'Client Address', type: 'textarea', autoFill: 'client_address' },
      { key: 'grievance', label: 'Grievance / Facts', type: 'textarea', required: true, hint: 'State the facts and the cause of grievance.' },
      { key: 'demand', label: 'Demand / Action Required', type: 'textarea', required: true },
      { key: 'compliance_days', label: 'Compliance Period (days)', type: 'number', default: '15' },
      { key: 'place', label: 'Place', required: true },
    ],
    content: `To,
{{recipient_name}}
{{recipient_address}}

(Sent by Registered Post / Speed Post with A.D.)

TAKE NOTICE that I, {{lawyer_name}}, Advocate, have been duly instructed and authorised by my client {{client_name}}, resident of {{client_address}} (hereinafter referred to as "my client"), to serve upon you this Legal Notice as under:

1. That my client is aggrieved by your acts and omissions described herein and has instructed me to issue this notice.

2. That {{grievance}}.

3. That despite repeated requests and reminders, you have failed and neglected to redress the grievance of my client, thereby violating my client's legal rights.

4. That my client has suffered loss, damages and harassment on account of your aforesaid acts/omissions.

You are hereby called upon to {{demand}} within {{compliance_days}} days from the receipt of this notice, failing which my client shall be constrained to initiate appropriate legal proceedings against you in the competent court of law, entirely at your risk, cost and consequences.

Please take note accordingly.

Date: {{date_today}}
Place: {{place}}

Yours truly,

{{lawyer_name}}
Advocate
Phone: {{lawyer_phone}}`,
  },
];

export const DOC_FORM_MAP: Record<string, DocFormDef> = Object.fromEntries(
  DOC_FORMS.map(d => [d.key, d]),
);
