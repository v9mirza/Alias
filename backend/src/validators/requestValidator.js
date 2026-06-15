import { body, param } from 'express-validator';
import validate from '../middleware/validator.js';

export const sendRequestValidator = [
  body('receiverId')
    .notEmpty().withMessage('Receiver ID is required')
    .isMongoId().withMessage('Invalid Receiver ID format'),
  body('isTemporary')
    .optional()
    .isBoolean().withMessage('isTemporary must be a boolean'),
  body('expiryDuration')
    .optional({ checkFalsy: true })
    .isIn(['1h', '24h', '7d', '1 hour', '24 hours', '7 days']).withMessage('Expiry duration must be 1h, 24h, or 7d'),
  validate
];

export const requestIdValidator = [
  param('id')
    .isMongoId().withMessage('Invalid request ID format'),
  validate
];
