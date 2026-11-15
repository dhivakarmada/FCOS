import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
    vendorId?: string;
  };
}
