import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDatabase } from '../database/db';

export function seedContentDrafts() {
  const db = getDatabase();
  console.log('[Seed] Initializing LawGPT statutory content draft seeder...');

  // 1. Get or create a system author for seeding
  let author = db.prepare('SELECT id FROM admin_users LIMIT 1').get() as { id: string } | undefined;
  if (!author) {
    const authorId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, totp_enabled, created_at, updated_at)
      VALUES (?, 'system.importer@lawgpt.in', 'DISABLED_ACCOUNT', 'System Legal Importer', 'reviewer', 0, ?, ?)
    `).run(authorId, now, now);
    author = { id: authorId };
  }

  const authorId = author.id;
  const projectRoot = path.resolve(__dirname, '../../../');
  const dataDir = path.join(projectRoot, 'src/data');

  if (!fs.existsSync(dataDir)) {
    console.warn(`[Seed] Data directory not found at ${dataDir}`);
    return;
  }

  const now = new Date().toISOString();
  let insertedCount = 0;

  const insertItem = db.prepare(`
    INSERT INTO content_item (id, type, key, language, status, current_version_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)
  `);

  const insertVersion = db.prepare(`
    INSERT INTO content_version (id, content_item_id, version_number, body_json, source, section_reference, created_by, review_status, created_at)
    VALUES (?, ?, 1, ?, ?, ?, ?, 'draft', ?)
  `);

  function importItem(
    type: string,
    key: string,
    language: 'en' | 'hi' | 'mr',
    body: any,
    source?: string,
    sectionReference?: string
  ) {
    const existing = db.prepare('SELECT id FROM content_item WHERE type = ? AND key = ? AND language = ?').get(type, key, language);
    if (existing) {
      return; // Already seeded
    }

    const itemId = crypto.randomUUID();
    const versionId = crypto.randomUUID();

    db.transaction(() => {
      insertItem.run(itemId, type, key, language, versionId, now, now);
      insertVersion.run(versionId, itemId, JSON.stringify(body), source || 'Statutory Source Gazette', sectionReference || null, authorId, now);
    })();

    insertedCount++;
  }

  // 1. IPC to BNS Mapping
  const ipcBnsFile = path.join(dataDir, 'ipcBnsMapping.json');
  if (fs.existsSync(ipcBnsFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(ipcBnsFile, 'utf8'));
      const items = parsed.items || (Array.isArray(parsed) ? parsed : []);
      items.forEach((item: any) => {
        const key = item.id || `ipc_${item.oldCode?.section || 'unknown'}`.replace(/\s+/g, '_').toLowerCase();
        importItem('ipc_bns_mapping', key, 'en', item, parsed.source || 'Acts 45 & 46 of 2023', item.newCode?.section);
      });
      console.log(`[Seed] Seeded IPC-BNS mappings from ${ipcBnsFile}`);
    } catch (e: any) {
      console.error(`[Seed] Failed to parse ipcBnsMapping.json:`, e.message);
    }
  }

  // 2. Know Your Rights / Quick Rights
  const rightsFile = path.join(dataDir, 'knowYourRights.json');
  if (fs.existsSync(rightsFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(rightsFile, 'utf8'));
      const items = parsed.categories ? parsed.categories.flatMap((c: any) => c.rights || []) : (Array.isArray(parsed) ? parsed : [parsed]);
      items.forEach((item: any, idx: number) => {
        const key = item.id || `right_${idx + 1}`;
        importItem('rights', key, 'en', item, 'Constitution of India, Part III', item.article || 'Fundamental Rights');
      });
      console.log(`[Seed] Seeded Rights from ${rightsFile}`);
    } catch (e: any) {
      console.error(`[Seed] Failed to parse knowYourRights.json:`, e.message);
    }
  }

  // 3. Legal Glossary
  const glossaryFile = path.join(dataDir, 'legalGlossary.json');
  if (fs.existsSync(glossaryFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(glossaryFile, 'utf8'));
      const items = parsed.terms || (Array.isArray(parsed) ? parsed : []);
      items.forEach((item: any, idx: number) => {
        const key = item.term ? item.term.toLowerCase().replace(/[^a-z0-9]/g, '_') : `term_${idx + 1}`;
        importItem('glossary', key, 'en', item, 'Indian Judicial Lexicon', item.statutoryContext);
      });
      console.log(`[Seed] Seeded Legal Glossary from ${glossaryFile}`);
    } catch (e: any) {
      console.error(`[Seed] Failed to parse legalGlossary.json:`, e.message);
    }
  }

  // 4. FIR Guide
  const firFile = path.join(dataDir, 'firGuide.json');
  if (fs.existsSync(firFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(firFile, 'utf8'));
      importItem('fir_guide', 'fir_procedure_master', 'en', parsed, 'BNSS 2023 Section 173', 'Section 173 BNSS');
      console.log(`[Seed] Seeded FIR Guide from ${firFile}`);
    } catch (e: any) {
      console.error(`[Seed] Failed to parse firGuide.json:`, e.message);
    }
  }

  // 5. Cyber Fraud Guide
  const cyberFile = path.join(dataDir, 'cyberFraud.json');
  if (fs.existsSync(cyberFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(cyberFile, 'utf8'));
      importItem('cyber_fraud_guide', 'cyber_fraud_master', 'en', parsed, 'I4C MHA / IT Act 2000', 'IT Act Section 66D');
      console.log(`[Seed] Seeded Cyber Fraud Guide from ${cyberFile}`);
    } catch (e: any) {
      console.error(`[Seed] Failed to parse cyberFraud.json:`, e.message);
    }
  }

  // 6. Legal Aid Entry
  const legalAidFile = path.join(dataDir, 'legalAid.json');
  if (fs.existsSync(legalAidFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(legalAidFile, 'utf8'));
      importItem('legal_aid_entry', 'legal_aid_master', 'en', parsed, 'NALSA / Legal Services Authorities Act, 1987', 'Section 12 LSA Act');
      console.log(`[Seed] Seeded Legal Aid from ${legalAidFile}`);
    } catch (e: any) {
      console.error(`[Seed] Failed to parse legalAid.json:`, e.message);
    }
  }

  // 7. Law of the Day
  const lotdFile = path.join(dataDir, 'lawOfTheDay.json');
  if (fs.existsSync(lotdFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(lotdFile, 'utf8'));
      const items = parsed.entries || (Array.isArray(parsed) ? parsed : []);
      items.forEach((item: any, idx: number) => {
        const key = item.id || `lotd_${idx + 1}`;
        importItem('law_of_the_day', key, 'en', item, 'Judicial Education Series', item.statute);
      });
      console.log(`[Seed] Seeded Law of the Day from ${lotdFile}`);
    } catch (e: any) {
      console.error(`[Seed] Failed to parse lawOfTheDay.json:`, e.message);
    }
  }

  // 8. Document Templates
  const templatesDir = path.join(dataDir, 'templates');
  if (fs.existsSync(templatesDir)) {
    const templateFiles = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.json'));
    templateFiles.forEach((file) => {
      try {
        const parsed = JSON.parse(fs.readFileSync(path.join(templatesDir, file), 'utf8'));
        const key = path.basename(file, '.json');
        importItem('document_template', key, 'en', parsed, 'Standard Legal Draft Format', parsed.statutoryAct);
      } catch (e: any) {
        console.error(`[Seed] Failed to parse template ${file}:`, e.message);
      }
    });
    console.log(`[Seed] Seeded Document Templates from ${templatesDir}`);
  }

  console.log(`[Seed] Content seeding complete. Inserted ${insertedCount} draft items (ALL AS DRAFT, NEVER PUBLISHED).`);
}

// Allow direct CLI invocation
if (require.main === module) {
  seedContentDrafts();
}
