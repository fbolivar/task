import { create } from 'zustand';
import { AuthState, User, Profile } from '../types';

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    activeEntityId: 'all',
    setUser: (user: User | null) => set({ user }),
    setProfile: (profile: Profile | null) => set({ profile }),
    setLoading: (loading: boolean) => set({ loading }),
    setInitialized: (initialized: boolean) => set({ initialized }),
    setActiveEntityId: (activeEntityId: string | 'all') => set({ activeEntityId }),
}));
