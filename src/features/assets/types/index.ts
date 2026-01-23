export type AssetStatus = 'Disponible' | 'Asignado' | 'Mantenimiento' | 'Baja';
export type AssetCategory = 'Hardware' | 'Software' | 'Mobiliario' | 'Vehículo' | 'Herramientas' | 'General';

export interface Asset {
    id: string;
    name: string;
    category: AssetCategory;
    status: AssetStatus;
    serial_number: string | null;
    purchase_date: string | null;
    purchase_value: number | null;
    entity_id: string | null;
    assigned_to: string | null;
    location: string | null;
    notes: string | null;
    warranty_expiration: string | null;
    useful_life_years: number;
    depreciation_rate: number;
    created_at: string;
    updated_at: string;
    entity?: {
        name: string;
    };
    assignee?: {
        full_name: string;
    };
}

export interface AssetFormData {
    name: string;
    category: AssetCategory;
    status: AssetStatus;
    serial_number: string;
    purchase_date: string | null;
    purchase_value: number | null;
    entity_id: string | null;
    assigned_to: string | null;
    location: string;
    notes: string;
    warranty_expiration: string | null;
    useful_life_years: number;
    depreciation_rate: number;
}
