import { Request, Response } from 'express';
import { RegisterUser } from '../../application/use-cases/auth/RegisterUser';
import { LoginUser } from '../../application/use-cases/auth/LoginUser';
import { GetCurrentUser } from '../../application/use-cases/auth/GetCurrentUser';
import { UpdateProfile } from '../../application/use-cases/auth/UpdateProfile';
import { VerifyEmail } from '../../application/use-cases/auth/VerifyEmail';
import { ResendVerification } from '../../application/use-cases/auth/ResendVerification';
import { GoogleAuthUser } from '../../application/use-cases/auth/GoogleAuthUser';
import { ForgotPassword } from '../../application/use-cases/auth/ForgotPassword';
import { ResetPassword } from '../../application/use-cases/auth/ResetPassword';
import { registerSchema, loginSchema, updateProfileSchema, resetPasswordSchema } from '../validators/schemas';
import { z } from 'zod';
import { UserRole } from '../../domain/entities/User';

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly loginUser: LoginUser,
    private readonly getCurrentUser: GetCurrentUser,
    private readonly updateProfileUC: UpdateProfile,
    private readonly verifyEmailUC: VerifyEmail,
    private readonly resendVerificationUC: ResendVerification,
    private readonly googleAuthUser: GoogleAuthUser,
    private readonly forgotPasswordUC: ForgotPassword,
    private readonly resetPasswordUC: ResetPassword
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const dto = registerSchema.parse(req.body);
    const result = await this.registerUser.execute(dto);
    res.status(201).json(result);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const dto = loginSchema.parse(req.body);
    const result = await this.loginUser.execute(dto);
    res.json(result);
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.getCurrentUser.execute(req.user!.userId);
    res.json(user);
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    const body = updateProfileSchema.parse(req.body);
    const user = await this.updateProfileUC.execute({
      userId: req.user!.userId,
      fullName: body.fullName,
      companyName: body.companyName,
      phone: body.phone,
      avatarUrl: body.avatarUrl,
    });
    res.json(user);
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.query);
    const result = await this.verifyEmailUC.execute(token);
    res.json(result);
  };

  resendVerification = async (req: Request, res: Response): Promise<void> => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const result = await this.resendVerificationUC.execute(email);
    res.json(result);
  };

  googleAuth = async (req: Request, res: Response): Promise<void> => {
    const { idToken, role } = z.object({
      idToken: z.string().min(1),
      role: z.nativeEnum(UserRole).optional(),
    }).parse(req.body);
    const result = await this.googleAuthUser.execute({ idToken, role });
    res.json(result);
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const result = await this.forgotPasswordUC.execute(email);
    res.json(result);
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const result = await this.resetPasswordUC.execute(token, password);
    res.json(result);
  };
}
