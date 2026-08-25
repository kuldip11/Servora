import { z } from 'zod';
import { loginSchema } from '@pos/validation';
import type { AvailableMembership, Branch, User } from '@pos/types';
export const credentialsSchema = loginSchema;
export type CredentialsForm = z.infer<typeof credentialsSchema>;
export type { Branch, AvailableMembership };
export interface LoginResult { accessToken: string; refreshToken: string; user: User; }
