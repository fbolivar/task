export interface Role {
    id: string;
    name: string;
}

export interface EntityShort {
    id: string;
    name: string;
}

export interface UserProfile {
    id: string;
    full_name: string | null;
    email: string | null;
    role_id: string | null;
    has_all_entities_access: boolean;
    is_active: boolean;
    created_at: string;
    role?: Role;
    profile_entities?: { entity: EntityShort }[];
}

export interface UserFormData {
    full_name: string;
    email: string;
    role_id: string;
    is_active: boolean;
    has_all_entities_access: boolean;
    entity_ids: string[];
    password?: string;
}
