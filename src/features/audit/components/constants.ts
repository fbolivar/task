// Icon names as strings - resolved at render time to avoid SSR initialization issues
export const ACTION_ICON_NAMES: Record<string, string> = {
    create: 'Plus',
    update: 'Edit',
    delete: 'Trash2',
    view: 'Eye',
    login: 'User',
    logout: 'User',
    approve: 'CheckCircle',
    reject: 'AlertCircle',
};

export const ACTION_COLORS: Record<string, string> = {
    create: 'bg-emerald-500/10 text-emerald-600',
    update: 'bg-blue-500/10 text-blue-600',
    delete: 'bg-red-500/10 text-red-600',
    view: 'bg-slate-500/10 text-slate-600',
    login: 'bg-purple-500/10 text-purple-600',
    logout: 'bg-purple-500/10 text-purple-600',
    approve: 'bg-emerald-500/10 text-emerald-600',
    reject: 'bg-red-500/10 text-red-600',
};

export const ENTITY_ICON_NAMES: Record<string, string> = {
    task: 'FileText',
    project: 'FolderKanban',
    asset: 'Package',
    user: 'User',
};

export const SECURITY_EVENT_ICON_NAMES: Record<string, string> = {
    login_success: 'LogIn',
    login_failed: 'AlertCircle',
    logout: 'LogOut',
    password_change: 'Lock',
    api_access: 'Key',
    permission_change: 'Shield',
    session_expired: 'Clock',
    mfa_enabled: 'Shield',
    mfa_disabled: 'AlertTriangle',
};

export const SECURITY_EVENT_LABELS: Record<string, string> = {
    login_success: 'Inicio de sesion exitoso',
    login_failed: 'Intento de login fallido',
    logout: 'Cierre de sesion',
    password_change: 'Cambio de contrasena',
    api_access: 'Acceso via API',
    permission_change: 'Cambio de permisos',
    session_expired: 'Sesion expirada',
    mfa_enabled: 'MFA habilitado',
    mfa_disabled: 'MFA deshabilitado',
};

export const SEVERITY_COLORS: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    critical: 'bg-red-500/10 text-red-600 border-red-500/20',
};
