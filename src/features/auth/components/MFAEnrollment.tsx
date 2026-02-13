'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import QRCode from 'qrcode';
import { ShieldCheck, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface Props {
    onSuccess?: () => void;
}

export function MFAEnrollment(props: Props) {
    const { enrollMFA, verifyMFA, listFactors, unenrollMFA } = useAuth();
    const { t } = useSettings();

    const [factors, setFactors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [enrollmentData, setEnrollmentData] = useState<{ id: string; secret: string; qr: string } | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadFactors();
    }, []);

    const loadFactors = async () => {
        try {
            setLoading(true);
            const data = await listFactors();
            setFactors(data?.all || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await enrollMFA();
            setEnrollmentData(data);

            if (data.totp.uri) {
                const url = await QRCode.toDataURL(data.totp.uri);
                setQrCodeUrl(url);
            }
        } catch (err: any) {
            setError(err.message || 'Error al iniciar enrolamiento');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enrollmentData) return;

        try {
            setLoading(true);
            setError('');
            await verifyMFA(enrollmentData.id, verifyCode);
            setSuccess(true);
            setEnrollmentData(null);
            setVerifyCode('');
            loadFactors();
            if (props.onSuccess) props.onSuccess();
        } catch (err: any) {
            setError('Código inválido. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleUnenroll = async (factorId: string) => {
        if (!confirm('¿Estás seguro de desactivar el 2FA? Tu cuenta será menos segura.')) return;

        try {
            setLoading(true);
            await unenrollMFA(factorId);
            loadFactors();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copySecret = () => {
        if (enrollmentData?.secret) {
            navigator.clipboard.writeText(enrollmentData.secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const hasMFA = factors.length > 0 && factors.some(f => f.status === 'verified');

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            {loading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-[#166A2F]" />
                </div>
            )}

            <div className="flex items-start gap-4 mb-6">
                <div className={`p-3 rounded-xl ${hasMFA ? 'bg-[#166A2F]/10 text-[#166A2F]' : 'bg-slate-100 text-slate-500'}`}>
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Autenticación de Dos Factores (2FA)</h3>
                    <p className="text-slate-500 text-sm mt-1">
                        Protege tu cuenta requiriendo un código adicional al iniciar sesión.
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {hasMFA ? (
                <div className="flex flex-col gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#166A2F] rounded-full animate-pulse" />
                            <span className="font-semibold text-[#166A2F]">2FA Activo</span>
                        </div>
                        <button
                            onClick={() => handleUnenroll(factors[0].id)}
                            className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                        >
                            Desactivar
                        </button>
                    </div>
                    {props.onSuccess && (
                        <button
                            onClick={props.onSuccess}
                            className="w-full py-2 bg-[#166A2F] text-white rounded-lg text-sm font-bold hover:bg-[#125a27] transition-all"
                        >
                            Continuar a la Aplicación
                        </button>
                    )}
                </div>
            ) : (
                !enrollmentData ? (
                    <button
                        onClick={handleEnroll}
                        className="px-4 py-2 bg-[#166A2F] text-white rounded-xl text-sm font-semibold hover:bg-[#125a27] transition-all"
                    >
                        Activar 2FA
                    </button>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                                {qrCodeUrl ? (
                                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
                                ) : (
                                    <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-lg" />
                                )}
                                <p className="text-xs text-slate-400 mt-2">Escanea con Google Authenticator</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                        O ingresa el código manualmente
                                    </label>
                                    <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg border border-slate-200 font-mono text-sm break-all">
                                        <span className="select-all">{enrollmentData.secret}</span>
                                        <button onClick={copySecret} className="p-1 hover:bg-slate-200 rounded">
                                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                        </button>
                                    </div>
                                </div>

                                <form onSubmit={handleVerify} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                            Verificar Código
                                        </label>
                                        <input
                                            type="text"
                                            value={verifyCode}
                                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000 000"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#166A2F] focus:ring-4 focus:ring-[#166A2F]/5 transition-all text-center text-lg font-medium tracking-widest"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={verifyCode.length !== 6 || loading}
                                        className="w-full py-2.5 bg-[#166A2F] text-white rounded-xl font-semibold hover:bg-[#125a27] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Verificar y Activar
                                    </button>
                                </form>
                            </div>
                        </div>
                        <button
                            onClick={() => setEnrollmentData(null)}
                            className="text-sm text-slate-500 hover:text-slate-700 underline"
                        >
                            Cancelar
                        </button>
                    </div>
                )
            )}
        </div>
    );
}
