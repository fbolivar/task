export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
}

const MIN_LENGTH = 8;

export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (password.length < MIN_LENGTH) {
        errors.push(`Debe tener al menos ${MIN_LENGTH} caracteres`);
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Debe incluir al menos una letra mayuscula');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Debe incluir al menos una letra minuscula');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Debe incluir al menos un numero');
    }

    return { valid: errors.length === 0, errors };
}

export function getPasswordRequirements(): string[] {
    return [
        `Minimo ${MIN_LENGTH} caracteres`,
        'Al menos una letra mayuscula',
        'Al menos una letra minuscula',
        'Al menos un numero',
    ];
}
