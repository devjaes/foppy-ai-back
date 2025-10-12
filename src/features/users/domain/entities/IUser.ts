export interface IUser {
  id: number;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  registration_date: Date;
  active: boolean;
  recoveryToken?: string | null;
  recoveryTokenExpires?: Date | null;
}
