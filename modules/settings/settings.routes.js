import express from 'express';
import { authenticate, authorizeRoles } from '../auth/auth.middleware.js';
import { getSettings, updateSettings } from './settings.controller.js';

const router = express.Router();

/**
 * @route GET /api/settings
 * @desc Get platform settings
 * @access Private (Any authenticated user for reading basic settings, or restrict to Admin if needed)
 */
router.get('/', authenticate, getSettings);

/**
 * @route PUT /api/settings
 * @desc Update platform settings
 * @access Private/Admin
 */
router.put('/', authenticate, authorizeRoles('ADMIN'), updateSettings);

export default router;
