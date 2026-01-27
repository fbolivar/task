'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { createClient } from '@/lib/supabase/client';
import { LoginCredentials, SignupCredentials } from '../types';

export function useAuth() {
    const { user, profile, loading, initialized, setUser, setProfile, setLoading, setInitialized } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (initialized) return;

        let mounted = true;
        let authSubscription: { unsubscribe: () => void } | null = null;

        const initAuth = async () => {
            try {
                const supabase = createClient();

                // Get initial session
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (mounted && session?.user) {
                    setUser(session.user);
                    // Load profile
                    const userProfile = await authService.getProfile(session.user.id);
                    if (mounted) setProfile(userProfile);
                }

                // Listen for changes
                const { data } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
                    if (mounted) {
                        setUser(session?.user ?? null);
                        if (session?.user) {
                            const userProfile = await authService.getProfile(session.user.id);
                            setProfile(userProfile);
                        } else {
                            setProfile(null);
                        }
                    }
                });
                authSubscription = data.subscription;
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                if (mounted) {
                    setLoading(false);
                    setInitialized(true);
                }
            }
        };

        initAuth();

        return () => {
            mounted = false;
            authSubscription?.unsubscribe();
        };
    }, [initialized, setUser, setProfile, setLoading, setInitialized]);

    const signIn = async (credentials: LoginCredentials) => {
        try {
            setLoading(true);
            await authService.signIn(credentials);

            // Force load profile before redirect
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                const userProfile = await authService.getProfile(session.user.id);
                setProfile(userProfile);

                // Role-based redirect
                if (userProfile?.role?.name === 'Gerente') {
                    router.push('/analisis');
                } else {
                    router.push('/dashboard');
                }
            } else {
                router.push('/dashboard');
            }
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (credentials: SignupCredentials) => {
        try {
            setLoading(true);
            await authService.signUp(credentials);
            router.push('/dashboard');
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setLoading(true);
            await authService.signOut();
            setUser(null);
            setProfile(null);
            router.push('/login');
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updatePassword = async (password: string) => {
        try {
            setLoading(true);
            await authService.updatePassword(password);
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        profile,
        loading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        updatePassword,
    };
}
