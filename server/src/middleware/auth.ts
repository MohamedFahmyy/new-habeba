import { Request, Response, NextFunction } from 'express';
import { AuthError, ForbiddenError } from './errors.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    throw new AuthError('Authentication required');
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) throw new AuthError();
  if (req.session.role !== 'admin') throw new ForbiddenError('Admin access required');
  next();
}

// Type augmentation for express-session
declare module 'express-session' {
  interface SessionData {
    userId: number;
    userEmail: string;
    username: string;
    role: string;
  }
}
