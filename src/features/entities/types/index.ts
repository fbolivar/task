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
    budget_q1: number;
    budget_q2: number;
    budget_q3: number;
    budget_q4: number;
    logo_url: string | null;
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
    budget_q1: number;
    budget_q2: number;
    budget_q3: number;
    budget_q4: number;
    logo_url: string;
}
