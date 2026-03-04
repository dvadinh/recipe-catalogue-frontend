import type { UserDetailsResponse } from '../types';

export interface AuthenticationState {
  user: UserDetailsResponse | null;
  loading: boolean;
  login: (user: UserDetailsResponse) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
