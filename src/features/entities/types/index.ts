export type EntityType = 'Prospecto' | 'Cliente' | 'Partner';

export interface Entity {
    id: string;
    name: string;
    type: EntityType;
    contact_info: {
        email?: string;
        phone?: string;
    } | null;
    website: string | null;
    address: string | null;
    contact_name: string | null;
    contact_email: string | null;
    logo_url: string | null;
    is_change_management_enabled: boolean;
    created_at: string;
}

export interface EntityFormData {
    name: string;
    type: EntityType;
    email: string;
    phone: string;
    website: string;
    address: string;
    contact_name: string;
    contact_email: string;
    logo_url: string;
    is_change_management_enabled: boolean;
}
