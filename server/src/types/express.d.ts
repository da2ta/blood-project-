import { User, Hospital } from '@prisma/client';

export type UserWithHospital = User & {
  hospital: Hospital | null;
};

declare global {
  namespace Express {
    interface Request {
      user: UserWithHospital;
    }
  }
}
