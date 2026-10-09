import en from '../src/i18n/locales/en.json';
import hi from '../src/i18n/locales/hi.json';
import mr from '../src/i18n/locales/mr.json';

function getDeepKeys(obj: Record<string, any>, prefix = ''): string[] {
  return Object.keys(obj).reduce((res: string[], el: string) => {
    const name = prefix ? `${prefix}.${el}` : el;
    if (typeof obj[el] === 'object' && obj[el] !== null && !Array.isArray(obj[el])) {
      res.push(...getDeepKeys(obj[el], name));
    } else {
      res.push(name);
    }
    return res;
  }, []);
}

describe('i18n Localization Integrity & Deep Key Parity', () => {
  it('has identical top-level sections across en, hi, and mr', () => {
    const enSections = Object.keys(en).sort();
    const hiSections = Object.keys(hi).sort();
    const mrSections = Object.keys(mr).sort();

    expect(hiSections).toEqual(enSections);
    expect(mrSections).toEqual(enSections);
  });

  it('fails if any key exists in en but is missing in hi or mr (Deep Key Parity)', () => {
    const enKeys = getDeepKeys(en);
    const hiKeys = new Set(getDeepKeys(hi));
    const mrKeys = new Set(getDeepKeys(mr));

    const missingInHi = enKeys.filter((k) => !hiKeys.has(k));
    const missingInMr = enKeys.filter((k) => !mrKeys.has(k));

    expect(missingInHi).toEqual([]);
    expect(missingInMr).toEqual([]);
  });

  it('contains all common navigation labels in each language', () => {
    expect(en.nav.home).toBe('Home');
    expect(hi.nav.home).toBe('होम');
    expect(mr.nav.home).toBe('मुख्यपृष्ठ');

    expect(en.nav.chat).toBe('AI Chat');
    expect(hi.nav.chat).toBe('AI चैट');
    expect(mr.nav.chat).toBe('AI चॅट');
  });

  it('contains mandatory statutory disclaimers in all three languages', () => {
    expect(en.common.disclaimer.length).toBeGreaterThan(20);
    expect(hi.common.disclaimer.length).toBeGreaterThan(20);
    expect(mr.common.disclaimer.length).toBeGreaterThan(20);
  });
});
