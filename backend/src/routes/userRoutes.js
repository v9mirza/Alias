import express from 'express';
import { getProfile, updateProfile, searchUsers, deleteAccount } from '../controllers/userController.js';
import { updateProfileValidator, searchValidator } from '../validators/userValidator.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All user endpoints require authentication

router.put('/profile', updateProfileValidator, updateProfile);
router.delete('/me', deleteAccount);
router.get('/search', searchValidator, searchUsers);
router.get('/:id', getProfile);

export default router;
