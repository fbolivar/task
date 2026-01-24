import { z } from 'zod';

// Schemas de validación
export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const signupSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
export type SignupCredentials = z.infer<typeof signupSchema>;

// Tipos de base de datos
export interface Role {
    id: string;
    name: string;
    permissions: Record<string, boolean>;
}

export interface Profile {
    id: string;
    full_name: string | null;
    role_id: string | null;
    avatar_url: string | null;
    skills: string[] | null;
    email: string | null;
    whatsapp_number: string | null;
    created_at: string;
    has_all_entities_access: boolean;
    must_change_password?: boolean;
    role?: Role;
    profile_entities?: { entity: { id: string; name: string } }[];
}

export interface User {
    id: string;
    email?: string;
    user_metadata?: {
        full_name?: string;
    };
}

export interface AuthState {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    initialized: boolean;
    activeEntityId: string | 'all';
    setUser: (user: User | null) => void;
    setProfile: (profile: Profile | null) => void;
    setLoading: (loading: boolean) => void;
    setInitialized: (initialized: boolean) => void;
    setActiveEntityId: (entityId: string | 'all') => void;
}
