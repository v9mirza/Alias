import rateLimit from 'express-rate-limit';

const isProduction = process.env.NODE_ENV === 'production';

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max: isProduction ? max : Math.max(max * 5, 300),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message
    }
  });

export const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Too many authentication attempts, please try again shortly.'
});

export const apiLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many requests, please slow down and retry.'
});

export const messagingLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 90,
  message: 'Too many chat actions in a short period. Please wait a moment.'
});
