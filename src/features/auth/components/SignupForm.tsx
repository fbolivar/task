'use client';

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { signupSchema, SignupCredentials } from '../types';

export function SignupForm() {
    const { signUp, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const credentials: SignupCredentials = signupSchema.parse({ email, password, fullName });
            await signUp(credentials);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'issues' in err) {
                const zodError = err as { issues: Array<{ message: string }> };
                setError(zodError.issues[0].message);
            } else if (err instanceof Error) {
                setError(err.message || 'Error al registrarse');
            } else {
                setError('Error al registrarse');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                    Nombre Completo
                </label>
                <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input"
                    placeholder="Juan Pérez"
                    required
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="tu@email.com"
                    required
                />
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                    Contraseña
                </label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="••••••••"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
            >
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
        </form>
    );
}
