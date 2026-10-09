import { app } from './app';
import { config } from './config/env';
import { getDatabase } from './database/db';

// Ensure database connection and migrations run on startup
getDatabase();

const server = app.listen(config.port, () => {
  console.log(`[LawGPT Backend] Running on http://localhost:${config.port}`);
  console.log(`[LawGPT Backend] Environment: ${config.nodeEnv}`);
  console.log(`[LawGPT Backend] Admin CORS Origin: ${config.adminCorsOrigin}`);
});

export default server;
