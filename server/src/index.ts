import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './core/config/index';
import { initializeClerkMiddleware, requireAuth, getAuth } from './core/middleware';
import applicationsRouter from './application/applications.routes';
import documentsRouter from './application/documents/documents.routes';
import modulesRouter from './application/modules/modules.routes';
import auditRouter from './application/audit/audit.routes';

const app = express();

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clerk authentication middleware (must be after body parsers)
app.use(initializeClerkMiddleware());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Basic API route
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Agrellus API Server',
    version: '1.0.0',
  });
});

// Protected API route (requires authentication)
app.get('/api/protected', requireAuth(), (req: Request, res: Response) => {
  const auth = getAuth(req);
  res.json({
    message: 'This is a protected route',
    userId: auth.userId,
    sessionId: auth.sessionId,
  });
});

// API Routes
app.use('/api/applications', applicationsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/audit', auditRouter);

// Start server
app.listen(config.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${config.PORT}`);
  console.log(`📊 Health check: http://localhost:${config.PORT}/health`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(`🔐 CORS origin: ${config.CORS_ORIGIN}`);
});

export default app;
