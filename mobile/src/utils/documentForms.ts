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

export type DocLang = 'en' | 'hi';

export type DocFormDef = {
  key: string;            // matches DocumentTemplate.category
  label: string;          // short menu label
  title: string;          // formal heading printed on the document (English)
  title_hi: string;       // formal heading (Hindi)
  icon: string;
  description: string;
  fields: DocField[];
  content: string;        // document body template (English)
  content_hi: string;     // document body template (Hindi)
};

// ── Standard documents ────────────────────────────────────────────────────

export const DOC_FORMS: DocFormDef[] = [
  {
    key: 'income_certificate',
    label: 'Income Certificate',
    title: 'Income Certificate Application',
    title_hi: 'आय प्रमाण पत्र आवेदन',
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
    content_hi: `सेवा में,
{{authority}},
{{place}}

विषय: आय प्रमाण पत्र हेतु आवेदन

महोदय/महोदया,

मैं, {{applicant_name}}, पुत्र/पुत्री श्री {{father_name}}, निवासी {{address}}, आय प्रमाण पत्र जारी किए जाने हेतु यह आवेदन सादर प्रस्तुत करता/करती हूँ।

विवरण निम्नानुसार है:

1. आवेदक का नाम: {{applicant_name}}
2. पिता/पति का नाम: {{father_name}}
3. स्थायी पता: {{address}}
4. वार्षिक पारिवारिक आय (समस्त स्रोतों से): रु. {{annual_income}}/-
5. प्रमाण पत्र का प्रयोजन: {{purpose}}

मैं घोषणा करता/करती हूँ कि उपर्युक्त दी गई जानकारी मेरी जानकारी एवं विश्वास के अनुसार सत्य एवं सही है, तथा आवश्यकता पड़ने पर मैं संबंधित दस्तावेज़ प्रस्तुत करने का वचन देता/देती हूँ।

अतः आपसे निवेदन है कि शीघ्र-अतिशीघ्र मेरे पक्ष में आय प्रमाण पत्र जारी करने की कृपा करें।

भवदीय,

{{applicant_name}}
संपर्क: {{phone}}
दिनांक: {{date_today}}
स्थान: {{place}}`,
  },

  {
    key: 'domicile_certificate',
    label: 'Domicile Certificate',
    title: 'Domicile Certificate Application',
    title_hi: 'मूल निवास प्रमाण पत्र आवेदन',
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
    content_hi: `सेवा में,
{{authority}},
{{place}}

विषय: मूल निवास (अधिवास) प्रमाण पत्र हेतु आवेदन

महोदय/महोदया,

मैं, {{applicant_name}}, पुत्र/पुत्री श्री {{father_name}}, सादर निवेदन करता/करती हूँ कि मैं {{residing_since}} से {{address}} का स्थायी एवं वास्तविक निवासी हूँ।

निवास प्रमाण हेतु निम्नलिखित दस्तावेज़ संलग्न हैं:
1. आधार कार्ड / मतदाता पहचान पत्र की प्रति
2. निवास प्रमाण (बिजली/पानी बिल अथवा राशन कार्ड)
3. नवीनतम पासपोर्ट आकार के फोटोग्राफ

मैं घोषणा करता/करती हूँ कि उपर्युक्त जानकारी मेरी जानकारी एवं विश्वास के अनुसार सत्य एवं सही है।

अतः {{purpose}} के प्रयोजन हेतु मेरे पक्ष में मूल निवास प्रमाण पत्र जारी करने की कृपा करें।

भवदीय,

{{applicant_name}}
दिनांक: {{date_today}}
स्थान: {{place}}`,
  },

  {
    key: 'caste_certificate',
    label: 'Caste Certificate',
    title: 'Caste Certificate Application',
    title_hi: 'जाति प्रमाण पत्र आवेदन',
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
    content_hi: `सेवा में,
{{authority}},
{{place}}

विषय: जाति प्रमाण पत्र हेतु आवेदन

महोदय/महोदया,

मैं, {{applicant_name}}, पुत्र/पुत्री श्री {{father_name}}, निवासी {{address}}, जाति प्रमाण पत्र जारी किए जाने हेतु आवेदन करता/करती हूँ।

मैं {{caste_name}} जाति से संबंध रखता/रखती हूँ, जो प्रचलित सरकारी अधिसूचना के अनुसार {{category}} श्रेणी में अधिसूचित है।

संलग्न दस्तावेज़:
1. आधार कार्ड / मतदाता पहचान पत्र की प्रति
2. पिता के जाति प्रमाण पत्र की प्रति (यदि उपलब्ध हो)
3. जाति अंकित विद्यालय प्रमाण पत्र की प्रति
4. नवीनतम पासपोर्ट आकार के फोटोग्राफ

मैं घोषणा करता/करती हूँ कि उपर्युक्त जानकारी मेरी जानकारी के अनुसार सत्य है।

प्रयोजन: {{purpose}}

भवदीय,

{{applicant_name}}
दिनांक: {{date_today}}
स्थान: {{place}}`,
  },

  {
    key: 'affidavit',
    label: 'Affidavit',
    title: 'Affidavit',
    title_hi: 'शपथ पत्र',
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
    content_hi: `मैं, {{deponent_name}}, पुत्र/पुत्री/पत्नी श्री {{father_name}}, आयु लगभग {{age}} वर्ष, निवासी {{address}}, सत्यनिष्ठा से शपथपूर्वक घोषणा करता/करती हूँ कि:

{{statements}}

मैं आगे यह कथन करता/करती हूँ कि इस शपथ पत्र की विषय-वस्तु मेरी जानकारी एवं विश्वास के अनुसार सत्य एवं सही है तथा इसमें कोई भी तथ्य छिपाया नहीं गया है।

शपथकर्ता

सत्यापन

सत्यापित किया जाता है कि उपर्युक्त शपथ पत्र की विषय-वस्तु मेरी जानकारी एवं विश्वास के अनुसार सत्य एवं सही है तथा इसमें कुछ भी छिपाया नहीं गया है। यह दिनांक {{date_today}} को {{place}} पर सत्यापित किया गया।

शपथकर्ता

प्रारूपकर्ता: {{lawyer_name}}, अधिवक्ता
बार काउंसिल क्रमांक: {{bar_number}}`,
  },

  {
    key: 'noc',
    label: 'NOC',
    title: 'No Objection Certificate',
    title_hi: 'अनापत्ति प्रमाण पत्र',
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
    content_hi: `दिनांक: {{date_today}}
स्थान: {{place}}

जिससे भी संबंधित हो

यह प्रमाणित किया जाता है कि हमें, {{issuer_name}} को, {{beneficiary_name}}, पुत्र/पुत्री श्री {{father_name}}, निवासी {{beneficiary_address}} के {{purpose}} के प्रयोजन हेतु कोई आपत्ति नहीं है।

यह प्रमाण पत्र {{beneficiary_name}} के अनुरोध पर उपर्युक्त प्रयोजन हेतु जारी किया जा रहा है तथा जारी होने की तिथि से {{validity}} की अवधि तक वैध रहेगा।

यह प्रमाण पत्र सद्भावपूर्वक एवं हमें उपलब्ध जानकारी के आधार पर जारी किया गया है। इस प्रमाण पत्र के किसी भी दुरुपयोग के लिए हम उत्तरदायी नहीं हैं।

जारीकर्ता:

नाम: {{issuer_name}}
पद / हैसियत: {{issuer_designation}}
पता: {{issuer_address}}
दिनांक: {{date_today}}
स्थान: {{place}}

(हस्ताक्षर एवं मुहर सहित)`,
  },

  {
    key: 'rti',
    label: 'RTI Application',
    title: 'RTI Application',
    title_hi: 'सूचना का अधिकार अधिनियम, 2005 के अंतर्गत आवेदन',
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
    content_hi: `सेवा में,
जन सूचना अधिकारी,
{{public_authority}}
{{authority_address}}

विषय: सूचना का अधिकार अधिनियम, 2005 के अंतर्गत सूचना हेतु आवेदन

महोदय/महोदया,

मैं, {{applicant_name}}, पुत्र/पुत्री श्री {{father_name}}, निवासी {{address}}, सूचना का अधिकार अधिनियम, 2005 के अंतर्गत निम्नलिखित सूचना प्राप्त करना चाहता/चाहती हूँ:

{{info_sought}}

सूचना की अवधि / समयावधि: {{period}}

मैं निर्धारित आवेदन शुल्क के रूप में रु. 10/- (दस रुपये मात्र) का भारतीय पोस्टल ऑर्डर / डिमांड ड्राफ्ट / न्यायालय शुल्क टिकट संलग्न कर रहा/रही हूँ।

यदि वांछित सूचना आपके कार्यालय से संबंधित नहीं है, तो कृपया इस आवेदन को सूचना का अधिकार अधिनियम, 2005 की धारा 6(3) के अंतर्गत संबंधित जन सूचना अधिकारी को अंतरित करें तथा मुझे सूचित करें।

भवदीय,

{{applicant_name}}
पता: {{address}}
संपर्क: {{phone}}
दिनांक: {{date_today}}
स्थान: {{place}}`,
  },

  {
    key: 'rent_agreement',
    label: 'Rent Agreement',
    title: 'Rent / Leave & Licence Agreement',
    title_hi: 'किराया / लीव एंड लाइसेंस अनुबंध',
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
    content_hi: `यह अनुबंध {{place}} पर दिनांक {{date_today}} को निष्पादित किया गया।

के बीच

{{landlord_name}}, निवासी {{landlord_address}} (जिन्हें इसके पश्चात "मकान मालिक / अनुज्ञापक" कहा जाएगा), प्रथम पक्ष;

तथा

{{tenant_name}}, पुत्र/पुत्री श्री {{tenant_father_name}}, निवासी {{tenant_address}} (जिन्हें इसके पश्चात "किरायेदार / अनुज्ञप्तिधारी" कहा जाएगा), द्वितीय पक्ष।

जबकि मकान मालिक {{property_address}} स्थित परिसर का पूर्ण स्वामी है;

तथा जबकि किरायेदार उक्त परिसर को {{usage}} प्रयोजन हेतु किराये/लाइसेंस पर लेना चाहता है;

अब यह अनुबंध निम्नानुसार साक्ष्य देता है:

1. अवधि: यह अनुबंध {{start_date}} से प्रारंभ होकर {{lease_duration}} की अवधि के लिए होगा।

2. किराया / लाइसेंस शुल्क: किरायेदार प्रति माह रु. {{monthly_rent}}/- का मासिक किराया/लाइसेंस शुल्क अदा करेगा।

3. प्रतिभूति राशि: किरायेदार ने रु. {{security_deposit}}/- की वापसी योग्य, ब्याजरहित प्रतिभूति राशि जमा की है।

4. उपयोग: परिसर का उपयोग केवल {{usage}} प्रयोजन हेतु किया जाएगा।

5. किरायेदार मकान मालिक की पूर्व लिखित सहमति के बिना उक्त परिसर को उपकिराये पर नहीं देगा, हस्तांतरित नहीं करेगा अथवा कब्ज़ा नहीं सौंपेगा।

6. किरायेदार परिसर को अच्छी एवं उपयोग योग्य स्थिति में रखेगा तथा मकान मालिक की सहमति के बिना कोई संरचनात्मक परिवर्तन नहीं करेगा।

7. कोई भी पक्ष दूसरे पक्ष को एक माह का पूर्व लिखित नोटिस देकर इस अनुबंध को समाप्त कर सकता है।

इसके साक्ष्यस्वरूप, पक्षों ने ऊपर उल्लिखित दिन, माह एवं वर्ष को इस अनुबंध पर हस्ताक्षर किए हैं।

मकान मालिक / अनुज्ञापक                किरायेदार / अनुज्ञप्तिधारी

_____________________                  _____________________
{{landlord_name}}                      {{tenant_name}}

गवाह:
1. _____________________
2. _____________________`,
  },

  {
    key: 'legal_notice',
    label: 'Legal Notice',
    title: 'Legal Notice',
    title_hi: 'कानूनी नोटिस',
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
    content_hi: `सेवा में,
{{recipient_name}}
{{recipient_address}}

(रजिस्टर्ड डाक / स्पीड पोस्ट ए.डी. सहित प्रेषित)

सूचित किया जाता है कि मैं, {{lawyer_name}}, अधिवक्ता, अपने मुवक्किल {{client_name}}, निवासी {{client_address}} (जिन्हें इसके पश्चात "मेरा मुवक्किल" कहा जाएगा) के विधिवत निर्देश एवं अधिकार पर आपको यह कानूनी नोटिस प्रेषित करता हूँ:

1. कि मेरा मुवक्किल आपके यहाँ वर्णित कृत्यों एवं चूकों से व्यथित है तथा उसने मुझे यह नोटिस जारी करने का निर्देश दिया है।

2. कि {{grievance}}।

3. कि बार-बार अनुरोध एवं स्मरण कराने के बावजूद, आपने मेरे मुवक्किल की शिकायत का निवारण करने में विफलता एवं उपेक्षा की है, जो मेरे मुवक्किल के विधिक अधिकारों का स्पष्ट उल्लंघन है।

4. कि आपके उपर्युक्त कृत्यों/चूकों के कारण मेरे मुवक्किल को हानि, क्षति एवं उत्पीड़न सहना पड़ा है।

आपको एतद्द्वारा निर्देशित किया जाता है कि इस नोटिस की प्राप्ति से {{compliance_days}} दिनों के भीतर {{demand}}, अन्यथा मेरा मुवक्किल आपके विरुद्ध सक्षम न्यायालय में उपयुक्त विधिक कार्यवाही आरंभ करने हेतु बाध्य होगा, जिसका समस्त जोखिम, व्यय एवं परिणाम आपके होंगे।

कृपया तदनुसार ध्यान दें।

दिनांक: {{date_today}}
स्थान: {{place}}

भवदीय,

{{lawyer_name}}
अधिवक्ता
दूरभाष: {{lawyer_phone}}`,
  },
];

export const DOC_FORM_MAP: Record<string, DocFormDef> = Object.fromEntries(
  DOC_FORMS.map(d => [d.key, d]),
);
