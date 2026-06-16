import express from 'express';
import {
  sendRequest,
  getIncomingRequests,
  getSentRequests,
  acceptRequest,
  rejectRequest
} from '../controllers/requestController.js';
import { sendRequestValidator, requestIdValidator } from '../validators/requestValidator.js';
import protect from '../middleware/auth.js';
import { messagingLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.use(protect); // All request endpoints require authentication

router.post('/', messagingLimiter, sendRequestValidator, sendRequest);
router.get('/incoming', getIncomingRequests);
router.get('/sent', getSentRequests);
router.post('/:id/accept', messagingLimiter, requestIdValidator, acceptRequest);
router.post('/:id/reject', messagingLimiter, requestIdValidator, rejectRequest);

export default router;
