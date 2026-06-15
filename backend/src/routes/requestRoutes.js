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

const router = express.Router();

router.use(protect); // All request endpoints require authentication

router.post('/', sendRequestValidator, sendRequest);
router.get('/incoming', getIncomingRequests);
router.get('/sent', getSentRequests);
router.post('/:id/accept', requestIdValidator, acceptRequest);
router.post('/:id/reject', requestIdValidator, rejectRequest);

export default router;
