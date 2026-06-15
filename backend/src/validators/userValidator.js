import { body, query } from 'express-validator';
import validate from '../middleware/validator.js';

export const updateProfileValidator = [
  body('bio')
    .optional()
    .isString().withMessage('Bio must be a string')
    .isLength({ max: 160 }).withMessage('Bio cannot exceed 160 characters'),
  body('interests')
    .optional()
    .isArray().withMessage('Interests must be an array of strings')
    .custom((value) => {
      if (value.some(item => typeof item !== 'string')) {
        throw new Error('All interests must be strings');
      }
      return true;
    }),
  validate
];

export const searchValidator = [
  query('q')
    .optional()
    .isString().withMessage('Search query must be a string'),
  validate
];
