import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/db';
import { ALL_ROLES, AdminRole } from '../security/permissions';

function parseArgs() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
      params[key] = val;
    }
  }
  return params;
}

export function createAdminAccount(options?: {
  email?: string;
  fullName?: string;
  role?: AdminRole;
  password?: string;
}) {
  const args = parseArgs();
  const email = options?.email || args.email || 'admin@lawgpt.in';
  const fullName = options?.fullName || args.name || 'System Administrator';
  const role = (options?.role || args.role || 'admin') as AdminRole;

  if (!ALL_ROLES.includes(role)) {
    console.error(`Invalid role: ${role}. Must be one of: ${ALL_ROLES.join(', ')}`);
    process.exit(1);
  }

  // Never use a default password! Generate cryptographically random secure password if none supplied
  const rawPassword = options?.password || args.password || crypto.randomBytes(12).toString('base64url');
  const passwordHash = bcrypt.hashSync(rawPassword, 12);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const db = getDatabase();

  const existing = db.prepare('SELECT id FROM admin_users WHERE email = ?').get(email);
  if (existing) {
    console.log(`[LawGPT CLI] Admin user with email ${email} already exists.`);
    return;
  }

  db.prepare(`
    INSERT INTO admin_users (id, email, password_hash, full_name, role, totp_enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?)
  `).run(id, email, passwordHash, fullName, role, now, now);

  console.log('====================================================');
  console.log('       LAWGPUT ADMINISTRATIVE ACCOUNT CREATED       ');
  console.log('====================================================');
  console.log(`ID:        ${id}`);
  console.log(`Email:     ${email}`);
  console.log(`Name:      ${fullName}`);
  console.log(`Role:      ${role}`);
  console.log(`Password:  ${rawPassword}`);
  console.log('----------------------------------------------------');
  console.log('NOTE: Save these credentials securely.');
  console.log('Upon first login, the user will be prompted to enroll');
  console.log('their Authenticator App for mandatory TOTP 2FA.');
  console.log('====================================================');

  return { id, email, role, rawPassword };
}

if (require.main === module) {
  createAdminAccount();
}
