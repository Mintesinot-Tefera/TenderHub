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
router.get('/auth/verify-email', asyncHandler(authController.verifyEmail));
router.post('/auth/resend-verification', asyncHandler(authController.resendVerification));
router.get('/auth/me', authMiddleware, asyncHandler(authController.me));
router.patch('/auth/profile', authMiddleware, asyncHandler(authController.updateProfile));

// --- Categories (public) ---
router.get('/categories', asyncHandler(categoryController.list));

// --- Tenders: org-owned routes (must come before /:id) ---
router.get(
  '/tenders/my',
  authMiddleware,
  requireRole(UserRole.ORGANIZATION),
  asyncHandler(tenderController.myTenders)
);
router.post(
  '/tenders',
  authMiddleware,
  requireRole(UserRole.ORGANIZATION),
  asyncHandler(tenderController.create)
);

// --- Tenders (public read) ---
router.get('/tenders', asyncHandler(tenderController.list));
router.get('/tenders/:id', asyncHandler(tenderController.getById));

// --- Tender management (org only) ---
router.patch(
  '/tenders/:id',
  authMiddleware,
  requireRole(UserRole.ORGANIZATION),
  asyncHandler(tenderController.update)
);
router.patch(
  '/tenders/:id/status',
  authMiddleware,
  requireRole(UserRole.ORGANIZATION),
  asyncHandler(tenderController.updateStatus)
);

// --- Discussions (public read, authenticated write) ---
router.get('/tenders/:id/discussions', asyncHandler(discussionController.listForTender));
router.post(
  '/tenders/:id/discussions',
  authMiddleware,
  asyncHandler(discussionController.create)
);

// --- Org: view bids on their tenders ---
router.get(
  '/tenders/:id/bids',
  authMiddleware,
  requireRole(UserRole.ORGANIZATION),
  asyncHandler(bidController.getTenderBids)
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

// --- Bid review (org only) ---
router.patch(
  '/bids/:id/review',
  authMiddleware,
  requireRole(UserRole.ORGANIZATION),
  asyncHandler(bidController.review)
);

export default router;
