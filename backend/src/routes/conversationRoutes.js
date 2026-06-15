import express from 'express';
import { getConversations, getMessages } from '../controllers/conversationController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All conversation endpoints require authentication

router.get('/', getConversations);
router.get('/:id/messages', getMessages);

export default router;
