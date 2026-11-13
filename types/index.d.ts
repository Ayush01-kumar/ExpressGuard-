import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';

export interface RequestIdOptions { headerName?: string; }
export interface RequestLoggerRecord { method: string; path: string; statusCode: number; durationMs: number; requestId?: string; timestamp: string; }
export interface RequestLoggerOptions { logger?: (record: RequestLoggerRecord) => void; skip?: (req: Request) => boolean; }
export interface RateLimitOptions { windowMs?: number; max?: number; maxKeys?: number; keyGenerator?: (req: Request) => string; skip?: (req: Request) => boolean; message?: string; statusCode?: number; }
export interface ApiKeyAuthOptions { apiKeys: string[]; headerName?: string; message?: string; }
export interface ErrorHandlerOptions { logger?: (record: { error: unknown; requestId?: string; statusCode: number; timestamp: string }) => void; includeStack?: boolean; exposeMessage?: boolean; }
export function requestId(options?: RequestIdOptions): RequestHandler;
export function requestLogger(options?: RequestLoggerOptions): RequestHandler;
export function rateLimit(options?: RateLimitOptions): RequestHandler;
export function apiKeyAuth(options: ApiKeyAuthOptions): RequestHandler;
export function errorHandler(options?: ErrorHandlerOptions): ErrorRequestHandler;
export function asyncHandler(handler: RequestHandler): RequestHandler;

declare global {
  namespace Express {
    interface Request { id?: string; auth?: { type: 'apiKey'; keyIndex: number }; }
  }
}
