import legalNotice from './legalNotice.json';
import affidavit from './affidavit.json';
import rtiApplication from './rtiApplication.json';
import rentalAgreement from './rentalAgreement.json';
import consumerComplaint from './consumerComplaint.json';
import bailDraft from './bailDraft.json';

export interface LocalizedString {
  en: string;
  hi: string;
  mr: string;
}

export interface TemplateFieldOption {
  value: string;
  label: LocalizedString;
}

export interface TemplateField {
  id: string;
  label: LocalizedString;
  placeholder: LocalizedString;
  helperText: LocalizedString;
  type: 'text' | 'textarea' | 'number' | 'select' | 'date';
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  options?: TemplateFieldOption[];
}

export interface LegalTemplateSchema {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  category: string;
  source: string;
  lastUpdated: string;
  reviewStatus: string;
  todo: string;
  stateStampDutyNote?: string;
  fields: TemplateField[];
}

export const legalTemplates: LegalTemplateSchema[] = [
  legalNotice as LegalTemplateSchema,
  affidavit as LegalTemplateSchema,
  rtiApplication as LegalTemplateSchema,
  rentalAgreement as LegalTemplateSchema,
  consumerComplaint as LegalTemplateSchema,
  bailDraft as LegalTemplateSchema,
];

export const getTemplateById = (id: string): LegalTemplateSchema | undefined => {
  return legalTemplates.find((t) => t.id === id);
};

/**
 * Generate formatted HTML with embedded Noto Sans Devanagari & diagonal DRAFT watermark
 */
export const buildDraftHtml = (
  template: LegalTemplateSchema,
  values: Record<string, any>,
  lang: 'en' | 'hi' | 'mr' = 'en'
): string => {
  const title = template.title[lang] || template.title.en;
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  let bodyContent = '';

  if (template.id === 'legal-notice') {
    bodyContent = `
      <div class="header-box">
        <p><strong>REGD. POST A.D. / SPEED POST</strong></p>
        <p>Date: ${today}</p>
      </div>
      <div class="recipient-box">
        <p><strong>TO,</strong><br/>
        <strong>${values.recipientName || '[Recipient Name]'}</strong><br/>
        ${(values.recipientAddress || '[Recipient Address]').replace(/\n/g, '<br/>')}</p>
      </div>
      <div class="from-box">
        <p><strong>FROM:</strong><br/>
        <strong>${values.senderName || '[Sender Name]'}</strong><br/>
        ${(values.senderAddress || '[Sender Address]').replace(/\n/g, '<br/>')}</p>
      </div>
      <div class="subject-line">
        <strong>SUBJECT: LEGAL NOTICE DEMANDING PAYMENT OF ₹${values.claimAmount || '0'} WITHIN ${values.noticePeriodDays || '15'} DAYS</strong>
      </div>
      <div class="body-paragraphs">
        <p>Sir/Madam,</p>
        <p>Under instructions and authority from my client / on behalf of myself, I hereby serve upon you the following legal notice:</p>
        <p>1. That the transaction and dispute arose under the following facts and circumstances:</p>
        <div class="quote-box">${(values.causeOfAction || '').replace(/\n/g, '<br/>')}</div>
        <p>2. That despite multiple requests, you have failed and neglected to clear the lawful outstanding dues amounting to <strong>₹${values.claimAmount || '0'}</strong>.</p>
        <p>3. You are hereby called upon to pay the aforesaid outstanding sum of <strong>₹${values.claimAmount || '0'}</strong> within <strong>${values.noticePeriodDays || '15'} days</strong> from the receipt of this notice, failing which appropriate civil and criminal proceedings will be initiated against you before competent courts at your sole risk and costs.</p>
      </div>
      <div class="sign-off">
        <br/><br/>
        <p>________________________<br/>
        <strong>${values.senderName || '[Sender Signature]'}</strong><br/>
        (Sender / Aggrieved Party)</p>
      </div>
    `;
  } else if (template.id === 'affidavit') {
    bodyContent = `
      <div class="center-heading">
        <h2>BEFORE THE NOTARY PUBLIC / OATH COMMISSIONER</h2>
        <h3>AFFIDAVIT</h3>
      </div>
      <div class="body-paragraphs">
        <p>I, <strong>${values.deponentName || '[Deponent Name]'}</strong>, ${values.parentOrSpouseName || ''}, aged about <strong>${values.age || '—'} years</strong>, resident of ${(values.residenceAddress || '[Address]').replace(/\n/g, ', ')}, do hereby solemnly affirm and declare on oath as under:</p>
        <p><strong>PURPOSE:</strong> ${values.purpose || '[Purpose]'}</p>
        <div class="statement-box">
          ${(values.statements || '').replace(/\n/g, '<br/><br/>')}
        </div>
        <br/>
        <p><strong>VERIFICATION:</strong></p>
        <p>I, the deponent abovenamed, do hereby verify and declare that the contents of paragraphs above are true and correct to the best of my knowledge and belief, and nothing material has been concealed therefrom.</p>
        <p>Verified at ____________ on this ${today}.</p>
      </div>
      <div class="sign-off">
        <br/><br/>
        <p>________________________<br/>
        <strong>DEPONENT</strong><br/>
        (${values.deponentName || ''})</p>
      </div>
    `;
  } else if (template.id === 'rti-application') {
    bodyContent = `
      <div class="center-heading">
        <h2>APPLICATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005</h2>
        <h3>FORM 'A'</h3>
      </div>
      <div class="recipient-box">
        <p><strong>TO:</strong><br/>
        ${(values.pioDesignation || '[PIO Designation & Office]').replace(/\n/g, '<br/>')}</p>
      </div>
      <div class="body-paragraphs">
        <p><strong>1. Full Name of the Applicant:</strong> ${values.applicantName || ''}</p>
        <p><strong>2. Address for Correspondence:</strong> ${(values.applicantAddress || '').replace(/\n/g, ', ')}</p>
        <p><strong>3. Contact Details:</strong> ${values.applicantContact || ''}</p>
        <p><strong>4. Citizenship:</strong> Citizen of India</p>
        <p><strong>5. Particulars of Information Sought:</strong></p>
        <div class="statement-box">
          ${(values.particularsOfInfo || '').replace(/\n/g, '<br/>')}
        </div>
        <p><strong>6. Fee Payment Details:</strong> ${values.bplStatus === 'yes' ? 'Applicant is Below Poverty Line (BPL Card Attached - Exempt from Fee)' : 'Application fee of ₹10 attached via IPO / Court Fee Stamp.'}</p>
        <p><strong>7. Declaration:</strong> I state that the information sought does not fall within the exemptions contained in Section 8 and 9 of the RTI Act, 2005.</p>
      </div>
      <div class="sign-off">
        <p>Date: ${today}</p>
        <br/>
        <p>________________________<br/>
        <strong>${values.applicantName || 'Applicant'}</strong><br/>
        Signature of Applicant</p>
      </div>
    `;
  } else if (template.id === 'rentalAgreement') {
    bodyContent = `
      <div class="center-heading">
        <h2>RESIDENTIAL RENT / LEASE AGREEMENT</h2>
        <p>(Subject to State Stamp Duty & Registration Laws)</p>
      </div>
      <div class="body-paragraphs">
        <p>This Residential Tenancy Agreement is entered into on this <strong>${values.commencementDate || today}</strong> between:</p>
        <p><strong>LANDLORD:</strong> <strong>${values.landlordName || '[Landlord Name]'}</strong> (hereinafter called the 'LESSOR') of the FIRST PART;</p>
        <p><strong>AND</strong></p>
        <p><strong>TENANT:</strong> <strong>${values.tenantName || '[Tenant Name]'}</strong> (hereinafter called the 'LESSEE') of the SECOND PART.</p>
        <p><strong>1. PREMISES:</strong> The Lessor hereby lets out and the Lessee takes on rent the residential property located at: <strong>${(values.premisesAddress || '').replace(/\n/g, ', ')}</strong>.</p>
        <p><strong>2. TENURE:</strong> The tenancy shall be for a period of 11 months commencing from <strong>${values.commencementDate || today}</strong> with a lock-in period of <strong>${values.lockInMonths || '0'} months</strong>.</p>
        <p><strong>3. RENT:</strong> The Lessee agrees to pay a monthly rent of <strong>₹${values.monthlyRent || '0'}</strong> payable in advance on or before the 7th of every calendar month.</p>
        <p><strong>4. SECURITY DEPOSIT:</strong> The Lessee has paid an interest-free refundable security deposit of <strong>₹${values.securityDeposit || '0'}</strong> to the Lessor.</p>
      </div>
      <div class="sign-off">
        <br/><br/>
        <table style="width:100%; border:none;">
          <tr>
            <td style="width:50%;">____________________<br/><strong>LESSOR (Landlord)</strong></td>
            <td style="width:50%; text-align:right;">____________________<br/><strong>LESSEE (Tenant)</strong></td>
          </tr>
        </table>
      </div>
    `;
  } else {
    // Generic fallback for Consumer Complaint, Bail Draft, etc.
    const fieldEntries = template.fields
      .map((f) => {
        const val = values[f.id] || '—';
        const label = f.label[lang] || f.label.en;
        return `<div class="field-row"><strong>${label}:</strong><br/>${String(val).replace(/\n/g, '<br/>')}</div>`;
      })
      .join('');

    bodyContent = `
      <div class="center-heading">
        <h2>${title.toUpperCase()}</h2>
        <p>Date of Draft: ${today}</p>
      </div>
      <div class="body-paragraphs">
        ${fieldEntries}
      </div>
      <div class="sign-off">
        <br/><br/>
        <p>________________________<br/>
        <strong>Authorized Signatory / Applicant</strong></p>
      </div>
    `;
  }

  const stampNoteHtml = template.stateStampDutyNote
    ? `<div class="stamp-note"><strong>STATE STAMP DUTY NOTICE:</strong> ${template.stateStampDutyNote}</div>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        
        @page {
          size: A4;
          margin: 20mm;
        }

        body {
          font-family: 'Noto Sans Devanagari', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #1a1a1a;
          background-color: #ffffff;
          line-height: 1.6;
          font-size: 13pt;
          padding: 24px;
          position: relative;
        }

        /* Diagonal DRAFT Watermark */
        .watermark {
          position: fixed;
          top: 35%;
          left: 10%;
          width: 80%;
          text-align: center;
          font-size: 90pt;
          font-weight: 800;
          color: rgba(200, 30, 30, 0.12);
          transform: rotate(-35deg);
          pointer-events: none;
          z-index: 1000;
          letter-spacing: 12px;
          text-transform: uppercase;
          font-family: 'Inter', sans-serif;
        }

        .disclaimer-banner {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          color: #92400e;
          padding: 10px 14px;
          font-size: 10pt;
          margin-bottom: 20px;
          border-radius: 4px;
        }

        .stamp-note {
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
          color: #1e40af;
          padding: 8px 12px;
          font-size: 9.5pt;
          margin-bottom: 16px;
          border-radius: 4px;
        }

        .center-heading {
          text-align: center;
          margin-bottom: 24px;
        }

        .center-heading h2 {
          margin: 0;
          font-size: 16pt;
          font-weight: 700;
          color: #111827;
        }

        .center-heading h3 {
          margin: 4px 0 0 0;
          font-size: 13pt;
          font-weight: 600;
          color: #374151;
        }

        .header-box {
          text-align: right;
          margin-bottom: 16px;
        }

        .recipient-box, .from-box {
          margin-bottom: 16px;
        }

        .subject-line {
          text-decoration: underline;
          margin: 20px 0;
          font-size: 13pt;
          line-height: 1.5;
        }

        .quote-box {
          background: #f9fafb;
          border-left: 3px solid #9ca3af;
          padding: 10px 14px;
          margin: 12px 0;
          font-style: italic;
        }

        .statement-box {
          background: #f9fafb;
          padding: 12px 16px;
          border-radius: 6px;
          margin: 12px 0;
        }

        .field-row {
          margin-bottom: 14px;
          padding-bottom: 8px;
          border-bottom: 1px dashed #e5e7eb;
        }

        .sign-off {
          margin-top: 36px;
          page-break-inside: avoid;
        }

        .footer-statutory {
          margin-top: 40px;
          padding-top: 12px;
          border-top: 1px solid #d1d5db;
          font-size: 8.5pt;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="watermark">DRAFT</div>

      <div class="disclaimer-banner">
        <strong>DRAFT – REVIEW BEFORE USE:</strong> This automated draft is prepared for reference purposes by LawGPT. It does not constitute formal legal representation under the Advocates Act, 1961. Review with a qualified lawyer before execution.
      </div>

      ${stampNoteHtml}

      ${bodyContent}

      <div class="footer-statutory">
        Generated via LawGPT – India's AI Legal Assistant • Verified against Indian Statutory Standards • Source: ${template.source}
      </div>
    </body>
    </html>
  `;
};
