// Shared types and interfaces

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
  createdAt: Date;
  lastLogin: Date;
  preferences: {
    timezone?: string;
    units?: 'metric' | 'imperial';
    notifications?: boolean;
  };
}

// Re-export specific types
export * from './calendar';
export * from './weather';
