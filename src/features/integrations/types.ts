export interface IntegrationConfig {
    email?: string;
    app_password?: string;
    smtp_host?: string;
    smtp_port?: number;
    [key: string]: any;
}

export interface Integration {
    id: string;
    provider: string; // 'gmail' | 'sendgrid' | etc.
    name: string;
    config: IntegrationConfig;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
