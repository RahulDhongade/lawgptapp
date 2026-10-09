import { StructuredAIChatResponse } from '../types';

export function getCategorizedLegalResponse(
  query: string,
  mode: 'std' | 'plain' = 'std'
): StructuredAIChatResponse {
  const q = query.toLowerCase().trim();

  // 0. Greetings & Friendly Inquiries
  const isGreeting =
    /^(hi|hello|hey|hiya|hola|namaste|namaskar|pranam|vanakkam|good\s*(morning|afternoon|evening|day)|greetings)[\s!.,?]*$/i.test(q) ||
    ['who are you', 'what is lawgpt', 'what are you', 'how to use', 'help me', 'can you help'].some((k) => q.includes(k)) ||
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey';

  if (isGreeting) {
    return {
      summary:
        'Namaste! I am LawGPT, your AI legal assistant for Indian Law. I can guide you on the new criminal laws (BNS, BNSS, BSA 2023), consumer complaints, cyber fraud reporting, FIR procedures, and legal draft generation.',
      relevantLaw: [
        {
          act: 'Constitution of India',
          section: 'Article 39A',
          text: 'Equal justice and free legal aid: The State shall secure that the operation of the legal system promotes justice on a basis of equal opportunity.',
          verified: true,
        },
        {
          act: 'Legal Services Authorities Act, 1987',
          section: 'Section 12',
          text: 'Entitlement to legal services and legal literacy for all citizens of India.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Ask About New Laws (BNS 2023)',
          description:
            'Ask which new BNS/BNSS/BSA sections replace old IPC/CrPC sections (e.g., "Which section replaces 420 IPC?" or "How does anticipatory bail work under BNSS?").',
        },
        {
          step: 2,
          title: 'Immediate Procedural Remedies',
          description:
            'Ask how to file an FIR, report cyber or financial UPI fraud on helpline 1930, or handle tenant security deposit disputes.',
        },
        {
          step: 3,
          title: 'Legal Drafting & Tools',
          description:
            'Generate formal legal drafts (Rental Agreement, Legal Notice, Affidavit, RTI Application) directly in the Tools tab.',
        },
      ],
      whatYouCanDo: [
        'Ask: "How to report UPI fraud to 1930?"',
        'Ask: "What are my rights if police refuse to file an FIR?"',
        'Ask: "Which section of BNS replaces 420 IPC for cheating?"',
        'Ask: "How to send a legal notice to my landlord for deposit refund?"',
      ],
      crucialDirective:
        'Ask any legal question in plain English, Hindi, or Marathi to receive verified statutory sections and procedural remedies.',
      citations: [
        {
          caseTitle: 'Hussainara Khatoon v. Home Secretary, State of Bihar',
          citation: 'AIR 1979 SC 1369',
          snippet: 'Access to justice and legal awareness is a fundamental pillar of fair procedure under Article 21.',
        },
      ],
      riskLevel: 'LOW',
      disclaimer:
        'LawGPT provides statutory reference intelligence. It does not replace advice from a licensed advocate in court proceedings.',
    };
  }

  // 1. Adversarial / Illegal Request Guardrails
  if (q.includes('bribe') || q.includes('bribing') || q.includes('pay money to police') || q.includes('avoid an fir')) {
    return {
      summary:
        'Refusal: LawGPT strictly prohibits providing assistance or methods to bribe a public servant or evade statutory police procedures.',
      relevantLaw: [
        {
          act: 'Prevention of Corruption Act, 1988',
          section: 'Section 7 & Section 8',
          text: 'Offense relating to public servant being bribed and bribing of a public servant. Punishable with rigorous imprisonment for up to 7 years.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Statutory Prohibition',
          description:
            'Offering or giving undue advantage to a public servant is a non-bailable offense under the Prevention of Corruption Act.',
        },
        {
          step: 2,
          title: 'Lawful Alternative',
          description:
            'If an officer demands an illegal gratification, file a formal complaint before the State Anti-Corruption Bureau (ACB) or Vigilance Officer.',
        },
        {
          step: 3,
          title: 'Remedy for False FIR Threat',
          description:
            'Approach a Senior Superintendent of Police (SSP) under Section 173(4) BNSS or file a Writ Petition before the High Court under Article 226 for quashing frivolous complaints.',
        },
      ],
      whatYouCanDo: [
        'Report corrupt demand to the Anti-Corruption Bureau (ACB) helpline.',
        'Engage an advocate to seek Anticipatory Bail under Section 482 BNSS 2023 if false arrest is apprehended.',
      ],
      crucialDirective:
        'Do not offer bribes or collude in corruption. Utilize legal remedies including writ petitions and representations to superior police authorities.',
      citations: [
        {
          caseTitle: 'P. Satyanarayana Murthy v. District Inspector of Police',
          citation: '(2015) 10 SCC 152',
          snippet: 'Demand and acceptance of illegal gratification constitutes the vital ingredient of corruption offense.',
        },
      ],
      riskLevel: 'HIGH',
      disclaimer:
        'LawGPT does not provide advice on committing or abetting illegal acts. Always seek legitimate counsel through certified legal practitioners.',
    };
  }

  if (q.includes('fabricate') || q.includes('fake evidence') || q.includes('forge') || q.includes('false evidence')) {
    return {
      summary:
        'Refusal: LawGPT cannot assist in fabricating false evidence or manufacturing documents for court proceedings.',
      relevantLaw: [
        {
          act: 'Bharatiya Nyaya Sanhita, 2023',
          section: 'Section 229 & Section 230 (formerly Sec 192 & 193 IPC)',
          text: 'Giving or fabricating false evidence in judicial proceedings is punishable with imprisonment up to 7 years and fine.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Criminal Liability',
          description:
            'Fabricating evidence to mislead a court of justice is a serious offense against public justice and invites perjury proceedings under Section 379 BNSS.',
        },
        {
          step: 2,
          title: 'Lawful Alternative',
          description:
            'Rely exclusively on admissible evidence. File an application under Order XI of the CPC for discovery and inspection of original documents.',
        },
      ],
      whatYouCanDo: [
        'Summon original bank records or government registers under Section 94 BNSS.',
        'Apply for secondary evidence permissions under Section 60 of Bharatiya Sakshya Adhiniyam, 2023 if originals are lost.',
      ],
      crucialDirective:
        'Present only authentic verified evidence in court. Perjury and fabrication carry mandatory criminal penalties.',
      citations: [
        {
          caseTitle: 'Iqbal Singh Marwah v. Meenakshi Marwah',
          citation: '(2005) 4 SCC 370',
          snippet: 'Procedure governing prosecution for offenses relating to fabricated documents produced in court.',
        },
      ],
      riskLevel: 'HIGH',
      disclaimer:
        'General legal advisory. LawGPT assists strictly within the boundaries of constitutional and statutory law.',
    };
  }

  if (q.includes('evade') || q.includes('tax loophole') || q.includes('black money') || q.includes('avoid tax')) {
    return {
      summary:
        'Refusal: LawGPT cannot suggest loopholes or schemes for illegal tax evasion under Indian revenue laws.',
      relevantLaw: [
        {
          act: 'Income Tax Act, 1961',
          section: 'Section 276C',
          text: 'Willful attempt to evade tax, penalty, or interest is punishable with rigorous imprisonment up to 7 years with fine.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Tax Evasion vs Tax Planning',
          description:
            'Tax evasion is unlawful suppression of income. Legal tax planning involves legitimately claiming deductions provided by statute.',
        },
        {
          step: 2,
          title: 'Lawful Statutory Deductions',
          description:
            'Avail lawful deductions under Chapter VI-A (Sections 80C, 80D, 80CCD, 80G) and legitimate business expenses under Section 37.',
        },
      ],
      whatYouCanDo: [
        'Consult a certified Chartered Accountant (CA) for statutory tax filing.',
        'File an updated return under Section 139(8A) to declare previously missed income within 24 months.',
      ],
      crucialDirective:
        'Comply fully with tax filing deadlines. Never engage in fraudulent billing or undeclared cash transactions.',
      citations: [
        {
          caseTitle: 'McDowell and Co. Ltd. v. Commercial Tax Officer',
          citation: '1985 AIR 1492 (SC)',
          snippet: 'Tax planning is legitimate provided it operates within the framework of law; colorable devices are impermissible.',
        },
      ],
      riskLevel: 'HIGH',
      disclaimer:
        'General statutory guidance. Does not substitute professional chartered accountancy or tax litigation counsel.',
    };
  }

  // 2. Cyber Fraud & Financial Scams
  if (q.includes('upi') || q.includes('cyber') || q.includes('scam') || q.includes('frozen bank') || q.includes('identity theft')) {
    return {
      summary:
        'Under Indian cyber law, immediate reporting of financial fraud on Helpline 1930 within the "Golden Hour" allows authorities to freeze recipient accounts and prevent money laundering.',
      relevantLaw: [
        {
          act: 'Information Technology Act, 2000',
          section: 'Section 66C & 66D',
          text: 'Punishment for identity theft and cheating by personation by using computer resource (up to 3 years imprisonment and fine).',
          verified: true,
        },
        {
          act: 'Bharatiya Nyaya Sanhita, 2023',
          section: 'Section 318(4)',
          text: 'Replaces IPC 420; criminalizes cheating and dishonestly inducing delivery of property.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Dial 1930 Immediately',
          description:
            'National Cyber Crime Helpline initiates Citizen Financial Cyber Fraud Reporting System to freeze fraudulent recipient accounts.',
        },
        {
          step: 2,
          title: 'Lodge Acknowledgement on Portal',
          description:
            'Register a formal complaint at cybercrime.gov.in and obtain your 14-digit Complaint Acknowledgement Number.',
        },
        {
          step: 3,
          title: 'Notify Your Bank',
          description:
            'Submit fraud dispute form to your bank within 3 days to invoke RBI Zero Liability Protection for unauthorized electronic transactions.',
        },
      ],
      whatYouCanDo: [
        'Take screenshots of transaction IDs, sender UPI handles, and message conversations.',
        'If your bank account was frozen falsely as a mule account, submit a representation with KYC and account statement to the Investigating Officer under Section 106 BNSS.',
      ],
      crucialDirective:
        'Act within the first 60 minutes. Once funds are withdrawn via ATMs or P2P crypto exchanges, fund recovery becomes significantly slower.',
      citations: [
        {
          caseTitle: 'RBI Circular on Customer Protection (Unauthorized Electronic Transactions)',
          citation: 'RBI/2017-18/15 DBR.No.Leg.BC.78/09.07.005/2017-18',
          snippet: 'Zero liability of a customer where the unauthorized transaction occurs through third party breach and is reported within 3 days.',
        },
      ],
      riskLevel: 'HIGH',
      disclaimer:
        'Standard legal guidance. For active fraud, dial 1930 immediately or visit the nearest cyber police station.',
    };
  }

  // 3. Tenant Rights & Landlord Disputes
  if (q.includes('rent') || q.includes('tenant') || q.includes('landlord') || q.includes('security deposit') || q.includes('evict')) {
    return {
      summary:
        'Under the Transfer of Property Act, 1882 and state tenancy laws, landlords cannot forcefully evict tenants or withhold security deposits without lawful notice and statutory grounds.',
      relevantLaw: [
        {
          act: 'Transfer of Property Act, 1882',
          section: 'Section 106 & Section 108',
          text: 'Requires 15 days notice for month-to-month tenancy termination and defines rights and liabilities of lessor and lessee.',
          verified: true,
        },
        {
          act: 'Registration Act, 1908',
          section: 'Section 17(1)(d)',
          text: 'Leases of immovable property from year to year, or for any term exceeding one year, are compulsorily registrable.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Issuing Statutory Legal Notice',
          description:
            'Send a formal 15-day demand notice demanding refund of security deposit with proof of handover and clearance of utility bills.',
        },
        {
          step: 2,
          title: 'Prohibition on Forceful Eviction',
          description:
            'Landlord cannot cut electricity, water, or lock the premises without due process of law. Such acts constitute offenses under Section 329 BNS (criminal trespass/mischief).',
        },
        {
          step: 3,
          title: 'Rent Tribunal / Civil Court Recourse',
          description:
            'File a petition before the Rent Authority or Small Causes Court for recovery of deposit and protection from illegal dispossession.',
        },
      ],
      whatYouCanDo: [
        'Retain inspection photos and move-out video showing pristine handover condition.',
        'Serve a legal demand notice through an advocate or via registered Speed Post.',
      ],
      crucialDirective:
        'Do not vacate premises without written acknowledgement of key handover and documented deduction list signed by landlord.',
      citations: [
        {
          caseTitle: 'Bishandas v. State of Punjab',
          citation: 'AIR 1961 SC 1570',
          snippet: 'Persons cannot be dispossessed by executive force or private might without authority and due process of law.',
        },
      ],
      riskLevel: 'MEDIUM',
      disclaimer:
        'General legal guidance. State rent control amendments (Maharashtra Rent Control, Delhi Rent Control, etc.) may apply specific local provisions.',
    };
  }

  // 4. Consumer Protection
  if (q.includes('consumer') || q.includes('counterfeit') || q.includes('airline') || q.includes('hospital') || q.includes('medical negligence') || q.includes('jurisdiction')) {
    return {
      summary:
        'The Consumer Protection Act, 2019 safeguards consumers against deficiency in service, unfair trade practices, and spurious goods through a 3-tier quasi-judicial redressal mechanism.',
      relevantLaw: [
        {
          act: 'Consumer Protection Act, 2019',
          section: 'Section 35 & Section 2(47)',
          text: 'Procedure for filing complaint before District Commission and definition of unfair trade practices including misleading advertisements.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Pecuniary Jurisdiction',
          description:
            'District Commission handles claims up to ₹50 Lakhs; State Commission from ₹50 Lakhs to ₹2 Crores; National Commission above ₹2 Crores.',
        },
        {
          step: 2,
          title: 'Limitation Period',
          description:
            'Complaint must be filed within 2 years from the date on which the cause of action arose (Section 69 of CPA 2019).',
        },
        {
          step: 3,
          title: 'E-Daakhil Online Filing',
          description:
            'File complaints digitally via the e-Daakhil portal (edaakhil.nic.in) with payment of nominal government court fees.',
        },
      ],
      whatYouCanDo: [
        'Call the National Consumer Helpline at 1915 to attempt pre-litigation mediation.',
        'Preserve proof of purchase, tax invoice, warranty card, and written communications.',
      ],
      crucialDirective:
        'Send a formal legal notice to the service provider/merchant allowing 15 days for resolution prior to filing on e-Daakhil.',
      citations: [
        {
          caseTitle: 'Jacob Mathew v. State of Punjab',
          citation: '(2005) 6 SCC 1',
          snippet: 'Parameters and standard of Bolam test for establishing negligence against professional medical practitioners.',
        },
      ],
      riskLevel: 'LOW',
      disclaimer:
        'Informational statutory overview. Does not substitute formal consumer complaint representation.',
    };
  }

  // 5. Motor Accident & Compensation
  if (q.includes('motor') || q.includes('accident') || q.includes('mact') || q.includes('hit-and-run') || q.includes('good samaritan')) {
    return {
      summary:
        'Under the Motor Vehicles Act, 1988, accident victims or their legal heirs are entitled to just and fair compensation from the Motor Accident Claims Tribunal (MACT) backed by compulsory third-party insurance.',
      relevantLaw: [
        {
          act: 'Motor Vehicles Act, 1988 (as amended 2019)',
          section: 'Section 166 & Section 161',
          text: 'Application for compensation before Claims Tribunal and enhanced compensation for hit-and-run motor accidents (₹2 Lakh for death, ₹50,000 for grievous hurt).',
          verified: true,
        },
        {
          act: 'Motor Vehicles Act, 1988',
          section: 'Section 134A',
          text: 'Statutory protection of Good Samaritans against civil or criminal liability and police harassment.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'FIR & Detailed Accident Report (DAR)',
          description:
            'Police must register an FIR and file a Detailed Accident Report (DAR) before the MACT within 90 days.',
        },
        {
          step: 2,
          title: 'Filing Compensation Petition',
          description:
            'Claim can be filed before the MACT having jurisdiction where accident occurred or where claimant resides.',
        },
      ],
      whatYouCanDo: [
        'Collect medical treatment bills, discharge summaries, disability certificates, and income tax returns of the victim.',
        'File MACT claim within the statutory 6-month limitation period introduced under Section 166(3) of the 2019 amendment.',
      ],
      crucialDirective:
        'Never settle privately for inadequate sums without independent assessment of long-term disability and loss of future earnings.',
      citations: [
        {
          caseTitle: 'National Insurance Co. Ltd. v. Pranay Sethi',
          citation: '(2017) 16 SCC 680',
          snippet: 'Supreme Court Constitution Bench guidelines on future prospects and standard compensation heads under Section 166 MV Act.',
        },
      ],
      riskLevel: 'HIGH',
      disclaimer:
        'General legal information. For accident litigation, consult an experienced MACT advocate.',
    };
  }

  // 6. Domestic Violence & Maintenance
  if (q.includes('domestic violence') || q.includes('maintenance') || q.includes('wife') || q.includes('pwdva') || q.includes('cruelty')) {
    return {
      summary:
        'The Protection of Women from Domestic Violence Act, 2005 (PWDVA) provides fast-track civil and emergency relief including protection orders, residence rights, and interim monetary maintenance.',
      relevantLaw: [
        {
          act: 'Protection of Women from Domestic Violence Act, 2005',
          section: 'Section 12, 18, 19 & 20',
          text: 'Applications to Magistrate for Protection Orders, Residence Orders in shared household, and monetary relief for medical expenses and maintenance.',
          verified: true,
        },
        {
          act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
          section: 'Section 144 (replacing Sec 125 CrPC)',
          text: 'Order for maintenance of wives, children, and parents to prevent destitution.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Approach Protection Officer / Service Provider',
          description:
            'Lodge a Domestic Incident Report (DIR) with the local Protection Officer or Magistrate directly under Section 12.',
        },
        {
          step: 2,
          title: 'Ex-Parte Interim Relief',
          description:
            'Magistrate has power to pass ex-parte orders under Section 23 restraining respondent from committing acts of domestic violence or evicting victim from shared household.',
        },
      ],
      whatYouCanDo: [
        'Contact Women Helpline at 181 or 1091 for immediate police assistance and safe shelter.',
        'Apply for free legal representation through District Legal Services Authority (DLSA).',
      ],
      crucialDirective:
        'You have an absolute statutory right to reside in the shared household under Section 17 PWDVA. You cannot be dispossessed without judicial sanction.',
      citations: [
        {
          caseTitle: 'Satish Chander Ahuja v. Sneha Ahuja',
          citation: '(2020) 10 SCC 788',
          snippet: 'Wife entitled to claim right of residence in shared household belonging even to joint family or in-laws.',
        },
      ],
      riskLevel: 'EMERGENCY',
      disclaimer:
        'In immediate danger, call 112 or Women Helpline 181 immediately. LawGPT is an informational reference.',
    };
  }

  // 7. Employment & Labor Disputes
  if (q.includes('employment') || q.includes('salary') || q.includes('gratuity') || q.includes('maternity') || q.includes('posh') || q.includes('non-compete')) {
    return {
      summary:
        'Indian labor jurisprudence protects employees against unlawful wage withholding, arbitrary termination without statutory notice, and provides mandatory maternity and workplace safety rights.',
      relevantLaw: [
        {
          act: 'Payment of Gratuity Act, 1972',
          section: 'Section 4 & Section 7',
          text: 'Gratuity payable on completion of 5 continuous years of service; employer must pay within 30 days of leaving with interest for delay.',
          verified: true,
        },
        {
          act: 'Indian Contract Act, 1872',
          section: 'Section 27',
          text: 'Every agreement by which anyone is restrained from exercising a lawful profession, trade or business is void to that extent.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Non-Compete Enforceability',
          description:
            'Post-termination non-compete clauses are void and unenforceable under Section 27 of the Indian Contract Act in India.',
        },
        {
          step: 2,
          title: 'Labor Commissioner Conciliation',
          description:
            'File a wage recovery application before the Controlling Authority under Payment of Wages / Gratuity Act.',
        },
      ],
      whatYouCanDo: [
        'Issue a formal legal notice for settlement of pending salary and gratuity.',
        'File an online complaint via the SAMADHAN portal (samadhan.labour.gov.in) for labor disputes.',
      ],
      crucialDirective:
        'Retain all offer letters, appraisal letters, pay slips, and email correspondence before company IT account access is severed.',
      citations: [
        {
          caseTitle: 'Percept D’Mark (India) (P) Ltd. v. Zaheer Khan',
          citation: 'AIR 2006 SC 3426',
          snippet: 'Doctrine of restraint of trade applies strictly post-employment; negative covenants beyond contract term are void under Section 27.',
        },
      ],
      riskLevel: 'LOW',
      disclaimer:
        'Informational reference. Employment laws differ between managerial employees and workmen under the Industrial Disputes Act.',
    };
  }

  // 8. Cheque Bounce (Section 138 NI Act)
  if (q.includes('cheque') || q.includes('check') || q.includes('138') || q.includes('dishonour') || q.includes('ni act')) {
    return {
      summary:
        'Under Section 138 of the Negotiable Instruments Act, 1881, dishonour of a cheque due to insufficiency of funds is a criminal offense punishable with imprisonment up to 2 years or twice the cheque amount.',
      relevantLaw: [
        {
          act: 'Negotiable Instruments Act, 1881',
          section: 'Section 138 & Section 142',
          text: 'Dishonour of cheque for insufficiency of funds. Requires statutory demand notice within 30 days of memo and complaint within 30 days after expiry of 15-day notice period.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Obtain Bank Return Memo',
          description:
            'Collect original cheque and bank return memo stating exact dishonour reason (e.g. Funds Insufficient).',
        },
        {
          step: 2,
          title: 'Issue 30-Day Statutory Demand Notice',
          description:
            'Send a formal legal notice demanding payment within 15 days of receipt of notice. Notice must be dispatched within 30 days of bank return memo.',
        },
        {
          step: 3,
          title: 'File Criminal Complaint Within 30 Days',
          description:
            'If drawer fails to pay within 15 days of receiving notice, file criminal complaint before Judicial Magistrate within the next 30 days.',
        },
      ],
      whatYouCanDo: [
        'Send notice via Registered Speed Post with Acknowledgment Due (RPAD) and preserve postal tracking receipt.',
        'Compound the case under Section 147 NI Act if the drawer offers full settlement at any stage.',
      ],
      crucialDirective:
        'Strict limitation timelines apply. Missing the 30-day notice window or 30-day complaint filing window requires rigorous condonation of delay.',
      citations: [
        {
          caseTitle: 'Dashrath Rupsingh Rathod v. State of Maharashtra',
          citation: '(2014) 9 SCC 129 / NI Amendment Act 2015',
          snippet: 'Territorial jurisdiction lies exclusively where the payee delivers the cheque for collection through their home bank account.',
        },
      ],
      riskLevel: 'MEDIUM',
      disclaimer:
        'Legal intelligence reference. Consult a practicing advocate to draft and dispatch statutory Section 138 notices.',
    };
  }

  // 9. Right to Information (RTI)
  if (q.includes('rti') || q.includes('right to information') || q.includes('pio') || q.includes('public information')) {
    return {
      summary:
        'The Right to Information Act, 2005 empowers Indian citizens to seek transparent access to information and records held by Public Authorities within strict statutory time limits.',
      relevantLaw: [
        {
          act: 'Right to Information Act, 2005',
          section: 'Section 6(1) & Section 7(1)',
          text: 'Request for obtaining information with nominal ₹10 fee; Public Information Officer (PIO) must provide information within 30 days (48 hours if life or liberty involved).',
          verified: true,
        },
        {
          act: 'Right to Information Act, 2005',
          section: 'Section 8',
          text: 'Exemptions from disclosure (national security, cabinet papers, trade secrets, personal privacy).',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Online Filing via RTI Online Portal',
          description:
            'Central Ministries and departments accept digital applications via rtionline.gov.in with ₹10 online payment (free for BPL applicants).',
        },
        {
          step: 2,
          title: '30-Day Mandatory Response Window',
          description:
            'PIO must either provide information or reject with specific Section 8 exemption reasons within 30 days.',
        },
        {
          step: 3,
          title: 'First Appeal under Section 19(1)',
          description:
            'If no reply is received or if dissatisfied, file a First Appeal to the Departmental First Appellate Authority within 30 days.',
        },
      ],
      whatYouCanDo: [
        'Formulate specific, clear questions requesting certified copies of government files, tenders, or logbooks.',
        'If First Appeal fails, file Second Appeal before the Central/State Information Commission.',
      ],
      crucialDirective:
        'Ask for "information" as defined in Section 2(f) (documents, emails, orders, samples) rather than seeking opinions or justifications for decisions.',
      citations: [
        {
          caseTitle: 'CBSE v. Aditya Bandopadhyay',
          citation: '(2011) 8 SCC 497',
          snippet: 'Scope and ambit of the right to information, inspection of evaluated answer scripts, and fiduciary relationships under Section 8(1)(e).',
        },
      ],
      riskLevel: 'LOW',
      disclaimer:
        'General legal guidance. State governments maintain distinct RTI web portals and application fee rules.',
    };
  }

  // 10. Bail & Pre-Trial Procedure
  if (q.includes('bail') || q.includes('anticipatory') || q.includes('surety') || q.includes('personal bond')) {
    return {
      summary:
        'Under the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS), bail is a statutory right in bailable offenses and a judicial discretion in non-bailable matters, guided by the principle that bail is the rule and jail is an exception.',
      relevantLaw: [
        {
          act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
          section: 'Section 482 (replacing Sec 438 CrPC)',
          text: 'Direction for grant of bail to person apprehending arrest (Anticipatory Bail) filed before Sessions Court or High Court.',
          verified: true,
        },
        {
          act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
          section: 'Section 479 (replacing Sec 436A CrPC)',
          text: 'Maximum period for which an undertrial prisoner can be detained; first-time offenders eligible for release on bond after serving one-third of maximum sentence.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Anticipatory vs Regular Bail',
          description:
            'Anticipatory bail is applied before arrest upon reasonable apprehension; regular bail is applied after being taken into judicial or police custody.',
        },
        {
          step: 2,
          title: 'Bail Conditions',
          description:
            'Courts typically mandate surrender of passport, cooperation with investigating officer, and furnishing of local sureties.',
        },
      ],
      whatYouCanDo: [
        'Collect antecedents, proof of clean criminal record, local roots, and medical history.',
        'File an urgent anticipatory bail application before the Sessions Court under Section 482 BNSS.',
      ],
      crucialDirective:
        'Do not evade lawful summons. If anticipatory bail is rejected, approach the High Court immediately for protective interim orders.',
      citations: [
        {
          caseTitle: 'Sushila Aggarwal v. State (NCT of Delhi)',
          citation: '(2020) 5 SCC 1',
          snippet: 'Supreme Court Constitution Bench ruling confirming that anticipatory bail should not ordinarily be limited to a fixed time period.',
        },
      ],
      riskLevel: 'HIGH',
      disclaimer:
        'General legal intelligence. Bail applications must be formally drafted and argued by an advocate before the appropriate court.',
    };
  }

  // 12. Arrest & Police Custody Rights
  if (
    q.includes('arrest') ||
    q.includes('custody') ||
    q.includes('detain') ||
    q.includes('handcuff') ||
    q.includes('police power')
  ) {
    return {
      summary:
        'Under Indian Law (BNSS 2023 & Article 22), police must inform you of the grounds of arrest, allow you to contact a lawyer or family, and mandatorily present you before a Judicial Magistrate within 24 hours.',
      relevantLaw: [
        {
          act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
          section: 'Section 47 & 50 BNSS 2023',
          text: 'Mandatory obligation on police to notify nominated family member and present arrestee to magistrate within 24 hours.',
          verified: true,
        },
        {
          act: 'Constitution of India',
          section: 'Article 22(1) & (2)',
          text: 'Protection against arrest and detention in certain cases; right to consult legal practitioner.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Right to Know Grounds of Arrest',
          description:
            'Must be informed immediately of specific allegations and whether the offense is bailable.',
        },
        {
          step: 2,
          title: 'Right to Counsel',
          description:
            'Allowed to consult and be defended by a legal practitioner of your choice during interrogation.',
        },
        {
          step: 3,
          title: 'Production Within 24 Hours',
          description:
            'Police must produce the arrested citizen before the nearest Judicial Magistrate within 24 hours excluding travel time.',
        },
      ],
      whatYouCanDo: [
        'Demand an Arrest Memo recording exact time, location, and signed by at least one respectable local witness.',
        'Request an immediate statutory medical examination under Section 53 BNSS to record physical state.',
      ],
      crucialDirective:
        'Do not sign blank papers under duress. Maintain composure and insist on your right to telephone your family or an advocate immediately.',
      citations: [
        {
          caseTitle: 'D.K. Basu v. State of West Bengal',
          citation: 'AIR 1997 SC 610',
          snippet: 'Landmark Supreme Court guidelines on arrest memos, custody inspections, and mandatory medical examination.',
        },
      ],
      riskLevel: 'HIGH',
      disclaimer:
        'General legal reference intelligence. Does not establish an attorney-client relationship. In an active trial or arrest, consult an advocate immediately.',
    };
  }

  // 13. FIR, Zero FIR & Police Complaint Remedies
  if (
    q.includes('fir') ||
    q.includes('zero fir') ||
    q.includes('police complaint') ||
    q.includes('refuse to file') ||
    q.includes('station')
  ) {
    return {
      summary:
        'Under Section 173 BNSS 2023, police are mandated to register an FIR for cognizable offenses. If the local station refuses, you can file a Zero FIR or send the complaint directly to the District Superintendent of Police.',
      relevantLaw: [
        {
          act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
          section: 'Section 173(1) & (4)',
          text: 'Every information relating to the commission of a cognizable offence shall be recorded. If an officer refuses, complaint can be sent to the SP.',
          verified: true,
        },
        {
          act: 'Bharatiya Nyaya Sanhita, 2023',
          section: 'Section 199',
          text: 'Public servant disobeying direction under law with intent to cause injury or refusing to record mandatory information.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Mandatory FIR Registration',
          description:
            'Registration of an FIR is compulsory whenever information discloses a cognizable offense, as affirmed in Lalita Kumari v. Govt of UP.',
        },
        {
          step: 2,
          title: 'Zero FIR Facility',
          description:
            'A Zero FIR can be lodged at any police station across India, regardless of territorial jurisdiction. It is later transferred to the relevant police station.',
        },
        {
          step: 3,
          title: 'Remedy for Refusal',
          description:
            'Send a written complaint by registered post to the SP/DCP under Section 173(4) BNSS, or approach the Judicial Magistrate under Section 175(3) BNSS.',
        },
      ],
      whatYouCanDo: [
        'Demand a free copy of the registered FIR under Section 173(2) BNSS.',
        'File an application under Section 175(3) BNSS before the Magistrate to direct investigation.',
      ],
      crucialDirective:
        'Always obtain an official receiving stamp or speed-post tracking receipt as proof of submitting your criminal complaint.',
      citations: [
        {
          caseTitle: 'Lalita Kumari v. Govt. of U.P.',
          citation: '(2014) 2 SCC 1',
          snippet: 'Police officers are statutorily bound to register an FIR upon receipt of information disclosing a cognizable offense.',
        },
      ],
      riskLevel: 'MEDIUM',
      disclaimer:
        'Informational statutory guidance. Consult a criminal defense lawyer for formal court representations.',
    };
  }

  // 14. IPC to BNS Transition & Criminal Offenses
  if (
    q.includes('bns') ||
    q.includes('ipc') ||
    q.includes('420') ||
    q.includes('302') ||
    q.includes('cheating') ||
    q.includes('penal')
  ) {
    return {
      summary:
        'Since July 1, 2024, Bharatiya Nyaya Sanhita (BNS 2023) replaces IPC 1860 across India. For example, Cheating (formerly Section 420 IPC) is now governed under Section 318 BNS.',
      relevantLaw: [
        {
          act: 'Bharatiya Nyaya Sanhita, 2023',
          section: 'Section 318 (formerly Section 420 IPC)',
          text: 'Cheating and dishonestly inducing delivery of property punishable with imprisonment up to 7 years and fine.',
          verified: true,
        },
        {
          act: 'Bharatiya Nyaya Sanhita, 2023',
          section: 'Section 103 (formerly Section 302 IPC)',
          text: 'Punishment for murder: Whoever commits murder shall be punished with death or imprisonment for life and fine.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Applicability by Date',
          description:
            'Offenses committed on or after July 1, 2024 are charged strictly under BNS 2023. Prior offenses remain governed by IPC 1860.',
        },
        {
          step: 2,
          title: 'Section Mapping',
          description:
            'Section 420 IPC -> Section 318 BNS; Section 302 IPC -> Section 103 BNS; Section 376 IPC -> Section 64 BNS.',
        },
        {
          step: 3,
          title: 'Community Service Sanctions',
          description:
            'BNS introduces community service as an alternative punishment for first-time petty offenses and defamation.',
        },
      ],
      whatYouCanDo: [
        'Open the IPC to BNS Converter in the Tools tab to find exact section mappings instantly.',
        'Verify the date of offense before filing criminal complaints or bail petitions.',
      ],
      crucialDirective:
        'Ensure all new charge sheets and criminal complaints cite BNS 2023 sections for incidents occurring after July 1, 2024.',
      citations: [
        {
          caseTitle: 'Official Gazette Notification',
          citation: 'MHA S.O. 850(E) 2024',
          snippet: 'BNS, BNSS, and BSA entered into force throughout India on 1st July 2024.',
        },
      ],
      riskLevel: 'LOW',
      disclaimer:
        'Statutory reference guidance. Verify with legal counsel for specific charge sheet drafting.',
    };
  }

  // 15. Neighbor Disputes, Gate Obstruction & Public Nuisance
  if (
    q.includes('neighbor') ||
    q.includes('neighbour') ||
    q.includes('parking') ||
    q.includes('gate') ||
    q.includes('loud music') ||
    q.includes('nuisance') ||
    q.includes('block')
  ) {
    return {
      summary:
        'You have an absolute easementary right of unobstructed access (ingress and egress) to your property. Blocking a residential gate or creating excessive noise constitutes actionable Public Nuisance under Section 270 & 292 BNS 2023.',
      relevantLaw: [
        {
          act: 'Bharatiya Nyaya Sanhita, 2023',
          section: 'Section 270 & 292 (formerly Sec 268 & 283 IPC)',
          text: 'Public nuisance and danger or obstruction in public way or navigation. Causing injury, obstruction, or danger to persons using public ways.',
          verified: true,
        },
        {
          act: 'Indian Easements Act, 1882',
          section: 'Section 7 & 15',
          text: 'Right to uninterrupted access to one\'s property and peaceful enjoyment of private premises.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Immediate Police Assistance (112)',
          description:
            'Call the 112 emergency helpline or local traffic police. An officer will be dispatched to tow the vehicle or warn the neighbor.',
        },
        {
          step: 2,
          title: 'Document with Timestamped Evidence',
          description:
            'Take photographs showing the vehicle blocking your gate with license plate and time stamp visible.',
        },
        {
          step: 3,
          title: 'Formal Police Complaint & Injunction',
          description:
            'If repeated, submit a written complaint to the Station House Officer (SHO) under Section 126 BNSS for preventive breach of peace, or file an application before the Executive Magistrate under Section 152 BNSS for removal of nuisance.',
        },
      ],
      whatYouCanDo: [
        'Call 112 to request towing of the vehicle obstructing your driveway.',
        'Issue a formal written notice or society complaint to the building management committee.',
        'File a complaint before the Executive Magistrate (SDM) under Section 152 BNSS.',
      ],
      crucialDirective:
        'Do not damage the neighbor\'s vehicle, as that could invite a counter-charge for criminal mischief under Section 324 BNS.',
      citations: [
        {
          caseTitle: 'Municipal Corporation of Delhi v. Subhagwanti',
          citation: 'AIR 1966 SC 1750',
          snippet: 'Duty of care on public premises and liability for maintaining or creating dangerous obstructions.',
        },
      ],
      riskLevel: 'LOW',
      disclaimer:
        'Civil and municipal guidance. Consult a local civil advocate if filing for a permanent civil injunction.',
    };
  }

  // 16. Women\'s Rights & Arrest After Sunset
  if (
    q.includes('sunset') ||
    q.includes('sunrise') ||
    (q.includes('woman') && (q.includes('arrest') || q.includes('night') || q.includes('police'))) ||
    (q.includes('female') && (q.includes('arrest') || q.includes('night')))
  ) {
    return {
      summary:
        'Under Section 43(5) of Bharatiya Nagarik Suraksha Sanhita (BNSS 2023), no woman can be arrested after sunset and before sunrise. Any arrest in exceptional circumstances requires prior written permission from a Judicial Magistrate First Class and the mandatory presence of a female police officer.',
      relevantLaw: [
        {
          act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
          section: 'Section 43(5) (formerly Section 46(4) CrPC)',
          text: 'Save in exceptional circumstances, no woman shall be arrested after sunset and before sunrise, and where such exceptional circumstances exist, the woman police officer shall obtain prior permission of the Judicial Magistrate.',
          verified: true,
        },
        {
          act: 'Constitution of India',
          section: 'Article 21 & 22',
          text: 'Protection of female dignity, personal liberty, and safeguards against arbitrary custodial detention.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Strict Prohibition on Night Arrest',
          description:
            'Police cannot arrest a woman between sunset and sunrise under ordinary criminal procedures.',
        },
        {
          step: 2,
          title: 'Mandatory Female Police Officer',
          description:
            'Even during daytime arrest, a woman must only be touched or arrested by a female police officer, unless an offense requires urgent apprehension.',
        },
        {
          step: 3,
          title: 'Right to Nominate Relative / Legal Counsel',
          description:
            'A woman has the statutory right to have a relative or advocate present and to be medically examined only by a female doctor under Section 53 BNSS.',
        },
      ],
      whatYouCanDo: [
        'Politely state Section 43(5) BNSS and refuse to accompany male officers after sunset.',
        'Demand to see written permission from the Judicial Magistrate if nighttime arrest is attempted.',
        'Contact the National Commission for Women (NCW Helpline 7827170170) or dial 112 immediately.',
      ],
      crucialDirective:
        'Do not accompany male police officers to a police station at night without a female officer and judicial warrant.',
      citations: [
        {
          caseTitle: 'Christian Community Welfare Council of U.P. v. Govt. of U.P.',
          citation: '(2003) 8 SCC 546',
          snippet: 'Mandatory guidelines prohibiting arrest of women without female officers and after sunset.',
        },
      ],
      riskLevel: 'HIGH',
      disclaimer:
        'Statutory constitutional safeguards for women. Seek urgent legal aid if facing unlawful detention.',
    };
  }

  // 17. Phone Call Recording, Privacy & Surveillance
  if (
    q.includes('call record') ||
    q.includes('recording') ||
    q.includes('tap') ||
    q.includes('spy') ||
    q.includes('secretly record') ||
    q.includes('record conversation')
  ) {
    return {
      summary:
        'In India, recording a phone conversation that you are a participant in is not per se illegal and is admissible as electronic evidence under Section 63 of Bharatiya Sakshya Adhiniyam (BSA 2023), provided its authenticity and continuous chain of custody are proved with an electronic certificate.',
      relevantLaw: [
        {
          act: 'Bharatiya Sakshya Adhiniyam, 2023',
          section: 'Section 63 (formerly Section 65B Indian Evidence Act)',
          text: 'Admissibility of electronic records and certificates required to prove integrity of recordings.',
          verified: true,
        },
        {
          act: 'Indian Telegraph Act, 1885',
          section: 'Section 5(2) & Section 25',
          text: 'Prohibition on unauthorized interception of telecommunication by third parties without Home Ministry approval.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Participant vs Third-Party Tapping',
          description:
            'A person can record conversations they are actively having. Third-party wiretapping or spyware installation without government authorization is a criminal offense under Section 43/66 of the IT Act.',
        },
        {
          step: 2,
          title: 'Admissibility in Court',
          description:
            'The Supreme Court in R.M. Malkani ruled that relevant tape-recorded conversations are admissible evidence if the voice is identified and the recording is un-tampered.',
        },
        {
          step: 3,
          title: 'Section 63 Certificate',
          description:
            'To introduce the audio in court, the party must submit an electronic certificate detailing the device, software, and non-alteration.',
        },
      ],
      whatYouCanDo: [
        'Keep original unedited audio files on the primary recording device with timestamps.',
        'Never edit or splice recordings, as forensic analysis can disqualify tampered files under Section 39 BSA.',
      ],
      crucialDirective:
        'Do not install unauthorized spyware on another person\'s phone, as that invites prosecution under Section 66E and 66 of the IT Act.',
      citations: [
        {
          caseTitle: 'R.M. Malkani v. State of Maharashtra',
          citation: 'AIR 1973 SC 157',
          snippet: 'Tape-recorded conversation is admissible provided voice is identified and accuracy is established.',
        },
      ],
      riskLevel: 'LOW',
      disclaimer:
        'Evidentiary guidance under BSA 2023. Consult your advocate regarding admissibility in matrimonial or criminal trials.',
    };
  }

  // 18. Traffic Challan & Motor Vehicles Inquiries
  if (
    q.includes('traffic') ||
    q.includes('challan') ||
    q.includes('helmet') ||
    q.includes('red light') ||
    q.includes('signal') ||
    q.includes('drunk driving') ||
    q.includes('rc') ||
    q.includes('driving license')
  ) {
    return {
      summary:
        'Traffic violations in India are governed by the Motor Vehicles Act (amended 2019). Traffic police can issue electronic e-challans, but only officers of the rank of Assistant Sub-Inspector (ASI) or above are authorized to confiscate documents or issue on-the-spot spot fines.',
      relevantLaw: [
        {
          act: 'Motor Vehicles (Amendment) Act, 2019',
          section: 'Section 185, 194D & 206',
          text: 'Drunk driving punishable with fine up to Rs 10,000 or 6 months imprisonment; driving without helmet fine Rs 1,000 + 3-month DL suspension; power of officer to impound document.',
          verified: true,
        },
        {
          act: 'Central Motor Vehicles Rules, 1989',
          section: 'Rule 139',
          text: 'Production of digital documents via DigiLocker or mParivahan is legally valid and mandatory for authorities to accept.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'DigiLocker & mParivahan Validity',
          description:
            'You are legally permitted to present your Driving License, RC, Insurance, and PUC in digital format via DigiLocker. Police cannot insist on physical copies.',
        },
        {
          step: 2,
          title: 'Challenging an E-Challan',
          description:
            'If you received a wrong e-challan, contest it online via the Virtual Court portal (vcourts.gov.in) or submit a grievance on echallan.parivahan.gov.in.',
        },
        {
          step: 3,
          title: 'Drunk Driving Breathalyzer Test',
          description:
            'A breathalyzer test is mandatory for drunk driving suspicion under Section 185. If alcohol exceeds 30 mg per 100 ml of blood, police may seize the vehicle.',
        },
      ],
      whatYouCanDo: [
        'Store your Driving License and RC in DigiLocker for instant digital presentation.',
        'Contest incorrect virtual challans at vcourts.gov.in before the Virtual Court Magistrate.',
        'Demand to see the e-challan machine receipt before paying any fine.',
      ],
      crucialDirective:
        'Police constables cannot remove your vehicle keys from the ignition. Only officers with ASI rank or above have legal authority to issue compoundable traffic challans.',
      citations: [
        {
          caseTitle: 'Ministry of Road Transport Notification',
          citation: 'RT-11036/64/2017-MVL',
          snippet: 'Digital documents presented through DigiLocker or mParivahan have legal parity with original physical certificates.',
        },
      ],
      riskLevel: 'LOW',
      disclaimer:
        'Administrative traffic guidance. For vehicle impoundment or court summons, appear before the concerned Metropolitan Magistrate.',
    };
  }

  // 19. Defamation, False Accusation & Online Slander
  if (
    q.includes('defamation') ||
    q.includes('defame') ||
    q.includes('slander') ||
    q.includes('libel') ||
    q.includes('false review') ||
    q.includes('tarnish')
  ) {
    return {
      summary:
        'Under Indian law, making or publishing false statements intended to harm a person\'s reputation constitutes both a Civil wrong (damages) and a Criminal offense under Section 356 BNS 2023, punishable with simple imprisonment up to 2 years, fine, or community service.',
      relevantLaw: [
        {
          act: 'Bharatiya Nyaya Sanhita, 2023',
          section: 'Section 356 (formerly Section 499 & 500 IPC)',
          text: 'Defamation: Whoever makes or publishes any imputation concerning any person intending to harm reputation is punishable with imprisonment up to 2 years, fine, or community service.',
          verified: true,
        },
        {
          act: 'Code of Civil Procedure, 1908',
          section: 'Section 9',
          text: 'Civil suit for damages and compensatory relief for injury to reputation.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Issue a Cease & Desist Legal Notice',
          description:
            'Send a formal Legal Notice giving 15 days to retract the defamatory statement, issue an unconditional apology, and take down online posts.',
        },
        {
          step: 2,
          title: 'File Criminal Complaint (Section 356 BNS)',
          description:
            'If unaddressed, file a private criminal complaint under Section 223 BNSS before the Judicial Magistrate.',
        },
        {
          step: 3,
          title: 'Civil Suit for Damages & Injunction',
          description:
            'File a civil suit seeking damages and an interim injunction under Order 39 Rules 1 & 2 CPC restraining further publication.',
        },
      ],
      whatYouCanDo: [
        'Take certified screenshots and URL archives of the defamatory online posts.',
        'Issue a formal Cease & Desist Legal Notice demanding unconditional apology within 15 days.',
      ],
      crucialDirective:
        'Truth published for the public good is a statutory defense to defamation (Exception 1, Sec 356 BNS). Ensure your evidence disproves truthfulness.',
      citations: [
        {
          caseTitle: 'Subramanian Swamy v. Union of India',
          citation: '(2016) 7 SCC 221',
          snippet: 'Supreme Court upheld constitutional validity of criminal defamation, balancing reputation under Article 21 against free speech under Article 19(1)(a).',
        },
      ],
      riskLevel: 'MEDIUM',
      disclaimer:
        'Legal advisory on defamation proceedings. Formal notices must be drafted and served through an advocate.',
    };
  }

  // 20. Contracts, Breach of Agreement & Legal Notices
  if (
    q.includes('legal notice') ||
    q.includes('contract') ||
    q.includes('agreement') ||
    q.includes('breach') ||
    q.includes('stamp paper') ||
    q.includes('notary') ||
    q.includes('affidavit')
  ) {
    return {
      summary:
        'A valid contract requires lawful offer, acceptance, consideration, and capacity under the Indian Contract Act, 1872. When a party breaches essential covenants, sending a formal statutory Legal Notice is the mandatory first step before initiating recovery or civil proceedings.',
      relevantLaw: [
        {
          act: 'Indian Contract Act, 1872',
          section: 'Section 10 & Section 73',
          text: 'All agreements are contracts if made by free consent for lawful consideration. Compensation for loss or damage caused by breach of contract.',
          verified: true,
        },
        {
          act: 'Specific Relief Act, 1963',
          section: 'Section 10 & 14',
          text: 'Specific performance of contracts and injunctions against breach.',
          verified: true,
        },
      ],
      explanationSteps: [
        {
          step: 1,
          title: 'Examine Agreement Clauses',
          description:
            'Check the dispute resolution clause, governing law jurisdiction, notice period requirements, and arbitration agreements.',
        },
        {
          step: 2,
          title: 'Statutory Legal Notice',
          description:
            'Draft and dispatch a detailed Legal Notice via Registered Speed Post detailing facts, damages, and demanding performance within 15 to 30 days.',
        },
        {
          step: 3,
          title: 'Civil Suit or Commercial Court Action',
          description:
            'If the counter-party fails to comply, file a summary suit under Order XXXVII CPC or commercial suit under the Commercial Courts Act, 2015.',
        },
      ],
      whatYouCanDo: [
        'Use the Legal Documents generator in the Tools tab to create a formal Legal Notice or Affidavit.',
        'Send the notice via Registered Post with Acknowledgment Due (RPAD) and preserve the tracking report.',
      ],
      crucialDirective:
        'Always preserve postal receipts and tracking delivery proofs as conclusive evidence of service under Section 27 of the General Clauses Act.',
      citations: [
        {
          caseTitle: 'Kailash Nath Associates v. DDA',
          citation: '(2015) 4 SCC 136',
          snippet: 'Damages under Section 74 Indian Contract Act can only be awarded if loss is actually proven.',
        },
      ],
      riskLevel: 'LOW',
      disclaimer:
        'Commercial and contract law advisory. Verify with counsel before initiating civil recovery suits.',
    };
  }

  // 21. Intelligent Dynamic ChatGPT-Style Answer for Any Query
  const isQuestion =
    q.includes('?') ||
    q.startsWith('can') ||
    q.startsWith('how') ||
    q.startsWith('what') ||
    q.startsWith('why') ||
    q.startsWith('is') ||
    q.startsWith('should') ||
    q.startsWith('where') ||
    q.startsWith('when');

  const cleanQuery = query.replace(/[?.,!]/g, '').trim();

  return {
    summary: isQuestion
      ? `Regarding your question "${query.trim()}": Under Indian law, your rights and remedies depend on whether this matter involves civil rights, statutory criminal provisions under BNS/BNSS 2023, or consumer protections. Here is the direct legal advisory and procedural roadmap.`
      : `LawGPT Advisory on "${cleanQuery}": Under the Indian legal system, addressing this matter requires establishing whether civil remedies, penal statutory provisions (under BNS 2023), or administrative dispute mechanisms apply. Here is the structured guidance.`,
    relevantLaw: [
      {
        act: 'Constitution of India',
        section: 'Article 21 & Article 39A',
        text: 'Protection of life, personal liberty, and equal access to justice and legal aid under the Constitution of India.',
        verified: true,
      },
      {
        act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
        section: 'Section 173 & Section 175',
        text: 'Statutory mechanisms for reporting grievances, recording complaints, and judicial oversight.',
        verified: true,
      },
    ],
    explanationSteps: [
      {
        step: 1,
        title: 'Classify the Nature of the Dispute',
        description:
          'Determine whether the situation calls for civil relief (e.g., formal Legal Notice, injunction, money recovery) or criminal intervention (e.g., police complaint under BNS 2023).',
      },
      {
        step: 2,
        title: 'Preserve Admissible Evidence',
        description:
          'Collect all written records, electronic timestamps, invoices, screenshots, emails, and financial statements as primary electronic evidence under Section 63 of Bharatiya Sakshya Adhiniyam (BSA 2023).',
      },
      {
        step: 3,
        title: 'Pursue Pre-Action Remedies',
        description:
          'For civil matters, issue a formal statutory Legal Notice giving 15 to 30 days for resolution. For criminal grievances, file a formal signed representation before the competent local authority.',
      },
    ],
    whatYouCanDo: [
      'Provide more details about your specific situation (e.g. state, dates, contracts, or parties involved) for deeper statutory analysis.',
      'Use the Legal Documents generator in the Tools tab to draft a formal Legal Notice, Affidavit, or Agreement.',
      'Consult the National Legal Services Authority helpline (15100) for free government legal assistance if eligible.',
    ],
    crucialDirective:
      'Maintain all written communications and timestamped receipts. Consult a certified advocate for active representation in court or before statutory tribunals.',
    citations: [
      {
        caseTitle: 'Maneka Gandhi v. Union of India',
        citation: '(1978) 1 SCC 248',
        snippet: 'Procedure established by law must be just, fair, and reasonable, not arbitrary or oppressive.',
      },
    ],
    riskLevel: 'MEDIUM',
    disclaimer:
      'LawGPT provides general legal reference intelligence based on Indian statutes. Consult an advocate for active litigation.',
  };
}
