import { pool } from './infrastructure/database/pool';

// Infrastructure
import { PgUserRepository } from './infrastructure/repositories/PgUserRepository';
import { PgTenderRepository } from './infrastructure/repositories/PgTenderRepository';
import { PgCategoryRepository } from './infrastructure/repositories/PgCategoryRepository';
import { PgBidRepository } from './infrastructure/repositories/PgBidRepository';
import { PgDiscussionRepository } from './infrastructure/repositories/PgDiscussionRepository';
import { BcryptPasswordHasher } from './infrastructure/auth/BcryptPasswordHasher';
import { JwtTokenService } from './infrastructure/auth/JwtTokenService';

// Use cases
import { RegisterUser } from './application/use-cases/auth/RegisterUser';
import { LoginUser } from './application/use-cases/auth/LoginUser';
import { GetCurrentUser } from './application/use-cases/auth/GetCurrentUser';
import { UpdateProfile } from './application/use-cases/auth/UpdateProfile';
import { ListTenders } from './application/use-cases/tenders/ListTenders';
import { GetTenderById } from './application/use-cases/tenders/GetTenderById';
import { ListCategories } from './application/use-cases/categories/ListCategories';
import { SubmitBid } from './application/use-cases/bids/SubmitBid';
import { GetMyBids } from './application/use-cases/bids/GetMyBids';
import { UpdateBid } from './application/use-cases/bids/UpdateBid';
import { WithdrawBid } from './application/use-cases/bids/WithdrawBid';
import { PostDiscussion } from './application/use-cases/discussions/PostDiscussion';
import { GetTenderDiscussions } from './application/use-cases/discussions/GetTenderDiscussions';

// Controllers
import { AuthController } from './presentation/controllers/AuthController';
import { TenderController } from './presentation/controllers/TenderController';
import { CategoryController } from './presentation/controllers/CategoryController';
import { BidController } from './presentation/controllers/BidController';
import { DiscussionController } from './presentation/controllers/DiscussionController';

// Middlewares
import { createAuthMiddleware } from './presentation/middlewares/authMiddleware';

// --- Repositories ---
const userRepo = new PgUserRepository(pool);
const tenderRepo = new PgTenderRepository(pool);
const categoryRepo = new PgCategoryRepository(pool);
const bidRepo = new PgBidRepository(pool);
const discussionRepo = new PgDiscussionRepository(pool);

// --- Services ---
const hasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();

// --- Use cases ---
const registerUser = new RegisterUser(userRepo, hasher, tokenService);
const loginUser = new LoginUser(userRepo, hasher, tokenService);
const getCurrentUser = new GetCurrentUser(userRepo);
const updateProfile = new UpdateProfile(userRepo);
const listTenders = new ListTenders(tenderRepo);
const getTenderById = new GetTenderById(tenderRepo);
const listCategories = new ListCategories(categoryRepo);
const submitBid = new SubmitBid(bidRepo, tenderRepo);
const getMyBids = new GetMyBids(bidRepo);
const updateBid = new UpdateBid(bidRepo, tenderRepo);
const withdrawBid = new WithdrawBid(bidRepo);
const postDiscussion = new PostDiscussion(discussionRepo, tenderRepo);
const getTenderDiscussions = new GetTenderDiscussions(discussionRepo);

// --- Controllers ---
export const authController = new AuthController(registerUser, loginUser, getCurrentUser, updateProfile);
export const tenderController = new TenderController(listTenders, getTenderById);
export const categoryController = new CategoryController(listCategories);
export const bidController = new BidController(submitBid, getMyBids, updateBid, withdrawBid);
export const discussionController = new DiscussionController(postDiscussion, getTenderDiscussions);

// --- Middlewares ---
export const authMiddleware = createAuthMiddleware(tokenService);
