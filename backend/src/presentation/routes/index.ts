import { Router } from 'express';
import {
  authController,
  tenderController,
  categoryController,
  bidController,
  discussionController,
  authMiddleware,
} from '../../container';
import { asyncHandler } from '../middlewares/asyncHandler';
import { requireRole } from '../middlewares/authMiddleware';
import { uploadProposal } from '../middlewares/upload';
import { UserRole } from '../../domain/entities/User';

const router = Router();

// --- Auth ---
router.post('/auth/register', asyncHandler(authController.register));
router.post('/auth/login', asyncHandler(authController.login));
router.get('/auth/me', authMiddleware, asyncHandler(authController.me));
router.patch('/auth/profile', authMiddleware, asyncHandler(authController.updateProfile));

// --- Categories (public) ---
router.get('/categories', asyncHandler(categoryController.list));

// --- Tenders (public read) ---
router.get('/tenders', asyncHandler(tenderController.list));
router.get('/tenders/:id', asyncHandler(tenderController.getById));

// --- Discussions (public read, authenticated write) ---
router.get('/tenders/:id/discussions', asyncHandler(discussionController.listForTender));
router.post(
  '/tenders/:id/discussions',
  authMiddleware,
  asyncHandler(discussionController.create)
);

// --- Bids (bidder only) ---
router.post(
  '/tenders/:id/bids',
  authMiddleware,
  requireRole(UserRole.BIDDER),
  uploadProposal.single('document'),
  asyncHandler(bidController.submit)
);
router.get(
  '/bids/my',
  authMiddleware,
  requireRole(UserRole.BIDDER),
  asyncHandler(bidController.myBids)
);
router.patch(
  '/bids/:id',
  authMiddleware,
  requireRole(UserRole.BIDDER),
  uploadProposal.single('document'),
  asyncHandler(bidController.update)
);
router.delete(
  '/bids/:id',
  authMiddleware,
  requireRole(UserRole.BIDDER),
  asyncHandler(bidController.withdraw)
);

export default router;
