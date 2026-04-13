import { Request, Response } from 'express';
import { RegisterUser } from '../../application/use-cases/auth/RegisterUser';
import { LoginUser } from '../../application/use-cases/auth/LoginUser';
import { GetCurrentUser } from '../../application/use-cases/auth/GetCurrentUser';
import { UpdateProfile } from '../../application/use-cases/auth/UpdateProfile';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/schemas';

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly loginUser: LoginUser,
    private readonly getCurrentUser: GetCurrentUser,
    private readonly updateProfileUC: UpdateProfile
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
}
