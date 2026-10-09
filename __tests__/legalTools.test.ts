import ipcBnsData from '../src/data/ipcBnsMapping.json';
import legalGlossaryData from '../src/data/legalGlossary.json';
import knowYourRightsData from '../src/data/knowYourRights.json';
import firGuideData from '../src/data/firGuide.json';
import cyberFraudData from '../src/data/cyberFraud.json';

describe('IPC -> BNS Converter Data Integrity & Lookup', () => {
  it('contains valid static mapping items without AI generation', () => {
    expect(ipcBnsData.items.length).toBeGreaterThan(0);
    expect(ipcBnsData.reviewStatus).toBe('UNREVIEWED');
    expect(ipcBnsData.source).toContain('Official Gazette');
  });

  it('correctly maps IPC 302 to BNS 103(1)', () => {
    const item = ipcBnsData.items.find(
      (i) => i.oldCode.section.toLowerCase().includes('302')
    );
    expect(item).toBeDefined();
    expect(item?.newCode.section).toContain('103');
  });

  it('correctly maps IPC 420 to BNS 318(4)', () => {
    const item = ipcBnsData.items.find(
      (i) => i.oldCode.section.toLowerCase().includes('420')
    );
    expect(item).toBeDefined();
    expect(item?.newCode.section).toContain('318');
  });

  it('correctly maps CrPC 154 to BNSS 173 (FIR registration)', () => {
    const item = ipcBnsData.items.find(
      (i) => i.oldCode.section.toLowerCase().includes('154')
    );
    expect(item).toBeDefined();
    expect(item?.newCode.section).toContain('173');
  });

  it('returns undefined for non-existent section numbers', () => {
    const item = ipcBnsData.items.find(
      (i) => i.oldCode.section.toLowerCase() === 'section 99999'
    );
    expect(item).toBeUndefined();
  });
});

describe('Legal Glossary Multilingual & A-Z Index', () => {
  it('has valid metadata and unreviewed status banner', () => {
    expect(legalGlossaryData.terms.length).toBeGreaterThan(0);
    expect(legalGlossaryData.reviewStatus).toBe('UNREVIEWED');
    expect(legalGlossaryData.source).toContain('Ministry of Law and Justice');
  });

  it('contains English, Hindi, and Marathi terms for essential vocabulary', () => {
    const bail = legalGlossaryData.terms.find((t) => t.term.toLowerCase() === 'bail');
    expect(bail).toBeDefined();
    expect(bail?.hi).toBe('ज़मानत');
    expect(bail?.mr).toBe('जामीन');
    expect(bail?.category).toBe('Criminal');
  });

  it('contains Zero FIR and Affidavit entries', () => {
    const zeroFir = legalGlossaryData.terms.find((t) => t.id === 'term_zero_fir');
    expect(zeroFir).toBeDefined();
    expect(zeroFir?.plainExplanationEn).toBeDefined();

    const affidavit = legalGlossaryData.terms.find((t) => t.id === 'term_affidavit');
    expect(affidavit).toBeDefined();
    expect(affidavit?.mr).toBe('प्रतिज्ञापत्र');
  });
});

describe('Know Your Rights & FIR Guide Disclaimers', () => {
  it('verifies 8 rights categories exist', () => {
    expect(knowYourRightsData.categories.length).toBe(8);
  });

  it('verifies FIR guide disclaimer is explicitly present', () => {
    expect(firGuideData.disclaimer).toContain('LawGPT guides you through statutory Indian criminal procedure');
    expect(firGuideData.steps.length).toBe(4);
  });

  it('verifies Cyber Fraud Golden Hour has 1930 helpline', () => {
    expect(cyberFraudData.emergencyHelpline).toBe('1930');
    expect(cyberFraudData.checklist.length).toBe(4);
  });
});
