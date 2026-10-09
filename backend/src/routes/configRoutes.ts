import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/db';

export const publicConfigRoutes = Router();

/**
 * Public GET /api/config
 * Served to mobile app and web clients.
 * Highly cacheable (60 seconds), never leaks server secrets.
 */
publicConfigRoutes.get('/', (req: Request, res: Response): void => {
  const db = getDatabase();

  // Retrieve public configs from app_config table
  const configRows = db.prepare('SELECT key, value_json, value_type FROM app_config WHERE is_public = 1').all() as Array<{
    key: string;
    value_json: string;
    value_type: string;
  }>;

  const publicConfig: Record<string, unknown> = {
    // Defaults with statutory defaults
    ai_enabled: true,
    streaming_enabled: true,
    guest_question_limit: 3,
    maintenance_mode: false,
    maintenance_message: '',
    min_supported_version: '1.0.0',
    latest_version: '1.0.0',
    update_url: 'https://play.google.com/store/apps/details?id=in.lawgpt.app',
    emergency_numbers_version: '2024.1',
    bns_gazette_version: 'Act 45 of 2023',
  };

  // Overlay configured values from database
  for (const row of configRows) {
    try {
      publicConfig[row.key] = JSON.parse(row.value_json);
    } catch {
      publicConfig[row.key] = row.value_json;
    }
  }

  // Set HTTP Cache-Control and ETag
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.status(200).json(publicConfig);
});
