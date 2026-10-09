import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getDatabase } from '../database/db';

export const publicContentRoutes = Router();

/**
 * GET /api/content/:type
 * Public distribution endpoint for LawGPT Mobile App with ETag and offline caching headers.
 * STRICT SECURITY: Only serves published, four-eyes reviewed statutory content.
 */
publicContentRoutes.get('/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const { language = 'en' } = req.query;
  const db = getDatabase();

  // Query only published items with their active published version
  const items = db.prepare(`
    SELECT 
      c.id, 
      c.type, 
      c.key, 
      c.language, 
      c.updated_at,
      v.version_number, 
      v.body_json, 
      v.source, 
      v.section_reference
    FROM content_item c
    JOIN content_version v ON c.current_version_id = v.id
    WHERE c.type = ? 
      AND c.language = ? 
      AND c.status = 'published' 
      AND v.review_status = 'published'
    ORDER BY c.key ASC
  `).all(type, language);

  const formattedItems = items.map((item: any) => ({
    id: item.id,
    key: item.key,
    version: item.version_number,
    source: item.source,
    sectionReference: item.section_reference,
    updatedAt: item.updated_at,
    data: JSON.parse(item.body_json),
  }));

  const lastUpdated = items.length > 0 ? (items[0] as any).updated_at : 'static';
  const responsePayload = {
    type,
    language,
    count: formattedItems.length,
    lastUpdated,
    items: formattedItems,
  };

  const payloadString = JSON.stringify(responsePayload);

  // Compute strong ETag hash
  const etag = `"${crypto.createHash('sha256').update(payloadString).digest('hex')}"`;

  // Set HTTP Caching Headers
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');

  // Verify If-None-Match for 304 Not Modified
  const clientEtag = req.headers['if-none-match'];
  if (clientEtag && clientEtag === etag) {
    return res.status(304).end();
  }

  return res.status(200).json(responsePayload);
});
