export function getAppUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://gespro.bc-security.com';
}

export function getLoginUrl(): string {
    return `${getAppUrl()}/login`;
}
