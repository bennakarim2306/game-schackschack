import { createContext } from "react";

export interface Address {
    street: string;
    city: string;
    zip: string;
    lat: number;
    lng: number;
}

export interface UserProfile {
  email?: string;
  username?: string;
  address?: Address;
  registrationDate?: string;
  notificationsEnabled?: boolean;
  age?: number;
  profilePicture?: string;
  availabilityDays?: string[];
  availabilityTimes?: string[];
  needConfirmation?: boolean
}

export interface AuthContextType {
  getUserToken: () => string | null;
  getCurrentUser: () => UserProfile | null;
  signIn: (data: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (data: { email: string; password: string }) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext