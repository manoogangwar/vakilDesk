export type DefaultTemplate = {
  name: string;
  category: string;
  content: string;
};

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'General Affidavit',
    category: 'affidavit',
    content: `AFFIDAVIT

I, {{client_name}}, Son/Daughter of {{client_father_name}}, aged about {{client_age}} years, resident of {{client_address}}, do hereby solemnly affirm and declare as under:

1. That I am the deponent in the above said matter.

2. That the contents of this affidavit are true and correct to the best of my knowledge and belief and nothing material has been concealed therefrom.

3. That this affidavit is being executed by me voluntarily and without any pressure or coercion from anyone.

4. That the statements made hereinabove are true to my knowledge and whatever is stated from information received is believed to be true.

DEPONENT

Verified at {{place}} on this {{date_today_formal}} that the contents of the above affidavit are true and correct to the best of my knowledge and belief and nothing has been concealed therein.

DEPONENT

Advocate: {{lawyer_name}}
Bar Council No.: {{lawyer_bar_number}}`,
  },
  {
    name: 'Income Certificate Application',
    category: 'income_certificate',
    content: `To,
The Tehsildar / Block Development Officer,
{{place}}

Subject: Application for Income Certificate

Respected Sir/Madam,

I, {{client_name}}, Son/Daughter of {{client_father_name}}, permanent resident of {{client_address}}, do hereby apply for an Income Certificate.

My annual family income from all sources is approximately Rs. {{amount}} per annum. The details are as follows:

1. Name of Applicant: {{client_name}}
2. Father's/Husband's Name: {{client_father_name}}
3. Permanent Address: {{client_address}}
4. Purpose for which certificate is required: {{reason}}

I hereby declare that the information furnished above is true and correct to the best of my knowledge and belief. I undertake to produce necessary documents whenever required.

It is, therefore, requested that an income certificate may kindly be issued in my favour at the earliest.

Yours faithfully,

{{client_name}}
{{client_phone}}
Date: {{date_today}}
Place: {{place}}`,
  },
  {
    name: 'Domicile Certificate Application',
    category: 'domicile_certificate',
    content: `To,
The Tehsildar / Sub-Divisional Magistrate,
{{place}}

Subject: Application for Domicile Certificate

Respected Sir/Madam,

I, {{client_name}}, Son/Daughter of {{client_father_name}}, beg to state that I am a permanent resident of {{client_address}} since birth / for the last ___ years.

The following documents are attached as proof of residence:
1. Copy of Aadhaar Card / Voter ID
2. Proof of residence (Utility Bills / Ration Card)
3. Passport size photographs

I hereby declare that the information provided above is true and correct to the best of my knowledge.

It is therefore requested that a Domicile Certificate may kindly be issued in my favour for the purpose of {{reason}}.

Yours faithfully,

{{client_name}}
Date: {{date_today}}
Place: {{place}}`,
  },
  {
    name: 'Caste Certificate Application',
    category: 'caste_certificate',
    content: `To,
The Tehsildar / Sub-Divisional Magistrate,
{{place}}

Subject: Application for Caste Certificate

Respected Sir/Madam,

I, {{client_name}}, Son/Daughter of {{client_father_name}}, permanent resident of {{client_address}}, hereby apply for a Caste Certificate.

I belong to the _____________ caste which is listed under the Scheduled Caste / Scheduled Tribe / Other Backward Class category as per the Government of India/State Government notification.

Documents enclosed:
1. Copy of Aadhaar Card / Voter ID
2. Copy of Father's Caste Certificate (if available)
3. Copy of school certificate mentioning caste
4. Passport size photographs

I hereby declare that the above information is true to the best of my knowledge.

Purpose: {{reason}}

Yours faithfully,

{{client_name}}
Date: {{date_today}}
Place: {{place}}`,
  },
  {
    name: 'Legal Notice',
    category: 'legal_notice',
    content: `LEGAL NOTICE

To,
{{subject}}

Sent by Registered Post / Speed Post

TAKE NOTICE that I, {{lawyer_name}}, Advocate, have been duly instructed and retained by my client {{client_name}}, resident of {{client_address}} (hereinafter referred to as "my client") to serve upon you this Legal Notice as under:

1. That my client is aggrieved by your acts and omissions as described herein, and has instructed me to issue this notice.

2. That {{reason}}.

3. That in spite of repeated requests and reminders, you have failed and neglected to address the grievance of my client, which amounts to a clear violation of my client's legal rights.

4. That my client has suffered loss, damages and harassment on account of your aforesaid acts/omissions.

You are hereby called upon to {{custom_1}} within FIFTEEN DAYS from the receipt of this notice, failing which my client shall be constrained to initiate appropriate legal proceedings against you in the appropriate court of law at your risk, cost and consequences.

Please take note accordingly.

Date: {{date_today}}
Place: {{place}}

Yours truly,

{{lawyer_name}}
Advocate
Phone: {{lawyer_phone}}`,
  },
  {
    name: 'Rent Agreement',
    category: 'rent_agreement',
    content: `RENT AGREEMENT / LEAVE AND LICENCE AGREEMENT

This Agreement is made and executed at {{place}} on this {{date_today_formal}}.

BETWEEN

{{custom_1}} (hereinafter referred to as the "LANDLORD/LICENSOR"), of the one part;

AND

{{client_name}}, Son/Daughter of {{client_father_name}}, resident of {{client_address}} (hereinafter referred to as the "TENANT/LICENSEE"), of the other part.

WHEREAS the Landlord is the absolute owner of the premises situated at {{property_description}};

AND WHEREAS the Tenant is desirous of taking the said premises on rent/licence for residential/commercial purpose;

NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:

1. TERM: This agreement shall be for a period of {{duration}} commencing from {{date_today}}.

2. RENT/LICENCE FEE: The Tenant agrees to pay a monthly rent/licence fee of Rs. {{amount}} per month.

3. SECURITY DEPOSIT: The Tenant has paid a refundable security deposit of Rs. {{custom_2}}.

4. USE: The premises shall be used only for {{reason}} purpose.

5. The Tenant shall not sublet, assign or part with possession of the said premises without prior written consent of the Landlord.

6. The Tenant shall keep the premises in good and tenantable condition and shall not make any structural alterations without the Landlord's consent.

7. Either party may terminate this agreement by giving one month's notice in writing to the other party.

IN WITNESS WHEREOF, the parties have signed this agreement on the day, month and year first hereinabove written.

LANDLORD/LICENSOR                    TENANT/LICENSEE

_____________________                _____________________
{{custom_1}}                         {{client_name}}

WITNESSES:
1. _____________________
2. _____________________

Advocate: {{lawyer_name}} | {{lawyer_phone}}`,
  },
  {
    name: 'No Objection Certificate (NOC)',
    category: 'noc',
    content: `NO OBJECTION CERTIFICATE

Date: {{date_today}}
Place: {{place}}

TO WHOMSOEVER IT MAY CONCERN

This is to certify that we, {{custom_1}}, have no objection whatsoever to {{client_name}}, Son/Daughter of {{client_father_name}}, resident of {{client_address}}, for the purpose of {{reason}}.

This certificate is being issued at the request of {{client_name}} for the purpose mentioned above and is valid for a period of {{duration}} from the date of issuance.

This certificate is issued in good faith and based on the information available to us. We bear no responsibility for any misuse of this certificate.

Issued by:

Name: {{custom_1}}
Designation/Capacity: {{custom_2}}
Address: {{custom_3}}
Date: {{date_today}}
Place: {{place}}

Signature with Seal`,
  },
  {
    name: 'RTI Application',
    category: 'rti',
    content: `APPLICATION UNDER THE RIGHT TO INFORMATION ACT, 2005

To,
The Public Information Officer,
{{custom_1}}
{{place}}

Subject: Application for information under RTI Act, 2005

Sir/Madam,

I, {{client_name}}, Son/Daughter of {{client_father_name}}, resident of {{client_address}}, hereby request the following information under the Right to Information Act, 2005:

1. {{reason}}

2. {{custom_2}}

3. {{custom_3}}

I am enclosing an Indian Postal Order / Demand Draft / Court Fee Stamp of Rs. 10/- (Rupees Ten Only) as application fee.

If the information requested is not available with your office, kindly transfer this application to the concerned Public Information Officer under Section 6(3) of the RTI Act, 2005.

Yours faithfully,

{{client_name}}
Address: {{client_address}}
Phone: {{client_phone}}
Date: {{date_today}}
Place: {{place}}`,
  },
  {
    name: 'General Power of Attorney',
    category: 'power_of_attorney',
    content: `GENERAL POWER OF ATTORNEY

KNOW ALL MEN BY THESE PRESENTS THAT:

I, {{client_name}}, Son/Daughter of {{client_father_name}}, aged about {{client_age}} years, resident of {{client_address}} (hereinafter referred to as the "Principal"), do hereby appoint, nominate and constitute {{custom_1}}, Son/Daughter of {{custom_2}}, resident of {{custom_3}} (hereinafter referred to as the "Attorney"), as my true and lawful Attorney to act on my behalf.

The Attorney is hereby authorized, on my behalf, to:

1. To manage, supervise, administer and deal with all matters related to {{reason}}.

2. To appear before any court, tribunal, authority or body on my behalf in connection with the above-mentioned matters.

3. To sign, execute and deliver all documents, deeds, agreements, applications, petitions, and papers as may be necessary for the purpose mentioned above.

4. To receive, collect and give receipts for any monies, dues, amounts payable to me in connection with the above matters.

5. To do all such acts, deeds, and things as may be necessary and expedient for the purposes mentioned above.

I hereby ratify and confirm all that my said Attorney shall lawfully do or cause to be done by virtue of this Power of Attorney.

IN WITNESS WHEREOF, I have executed this Power of Attorney at {{place}} on this {{date_today_formal}}.

PRINCIPAL: {{client_name}}

WITNESSES:
1. _____________________ (Name & Address)
2. _____________________ (Name & Address)

Prepared by Advocate: {{lawyer_name}}
Bar Council No.: {{lawyer_bar_number}}`,
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  affidavit: 'Affidavit',
  income_certificate: 'Income Certificate',
  domicile_certificate: 'Domicile Certificate',
  caste_certificate: 'Caste Certificate',
  legal_notice: 'Legal Notice',
  rent_agreement: 'Rent Agreement',
  noc: 'NOC',
  rti: 'RTI',
  power_of_attorney: 'Power of Attorney',
  other: 'Other',
};

export const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
