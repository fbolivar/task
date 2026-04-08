'use client';

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import {
    Upload,
    FileSpreadsheet,
    X,
    CheckCircle,
    AlertCircle,
    Loader2,
    Info,
} from 'lucide-react';
import { BaseModal } from '@/shared/components/BaseModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExcelImportProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: Record<string, string>[]) => Promise<void>;
    title?: string;
    expectedColumns?: string[];
}

type ImportStep = 'idle' | 'preview' | 'importing' | 'done' | 'error';

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
const ACCEPTED_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
];
const PREVIEW_ROW_COUNT = 5;

// ─── Helper ───────────────────────────────────────────────────────────────────

function cellToString(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return String(value);
}

function parseWorkbook(file: File): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const raw = e.target?.result;
                if (!raw) {
                    reject(new Error('No se pudo leer el archivo.'));
                    return;
                }

                const wb = XLSX.read(raw, { type: 'array', cellDates: true });
                const sheetName = wb.SheetNames[0];
                if (!sheetName) {
                    reject(new Error('El archivo no contiene hojas de cálculo.'));
                    return;
                }

                const ws = wb.Sheets[sheetName];
                const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
                    header: 1,
                    defval: '',
                    blankrows: false,
                });

                if (rows.length < 2) {
                    reject(new Error('El archivo está vacío o solo contiene encabezados.'));
                    return;
                }

                const headers = (rows[0] as unknown[]).map(cellToString);
                const dataRows = rows.slice(1) as unknown[][];

                const parsed: Record<string, string>[] = dataRows.map((row) => {
                    const obj: Record<string, string> = {};
                    headers.forEach((header, idx) => {
                        if (header) obj[header] = cellToString(row[idx]);
                    });
                    return obj;
                });

                resolve(parsed);
            } catch {
                reject(new Error('El archivo no pudo ser procesado. Verifique que sea un Excel o CSV válido.'));
            }
        };

        reader.onerror = () => reject(new Error('Error al leer el archivo del disco.'));
        reader.readAsArrayBuffer(file);
    });
}

function isValidFile(file: File): boolean {
    const name = file.name.toLowerCase();
    const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
    const hasValidMime = ACCEPTED_MIME_TYPES.includes(file.type) || file.type === '';
    return hasValidExt || hasValidMime;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
            <span className="w-6 h-[2px] bg-primary/30 inline-block" />
            {children}
        </p>
    );
}

interface PreviewTableProps {
    headers: string[];
    rows: Record<string, string>[];
    expectedColumns?: string[];
}

function PreviewTable({ headers, rows, expectedColumns }: PreviewTableProps) {
    const missingColumns =
        expectedColumns?.filter((col) => !headers.includes(col)) ?? [];

    return (
        <div className="space-y-3">
            {missingColumns.length > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium">
                        Columnas esperadas no encontradas:{' '}
                        <span className="font-bold">{missingColumns.join(', ')}</span>
                    </p>
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs" role="table" aria-label="Vista previa del archivo importado">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60">
                            {headers.map((h) => {
                                const isMissing = expectedColumns?.includes(h) === false && expectedColumns !== undefined;
                                const isExpected = expectedColumns?.includes(h);
                                return (
                                    <th
                                        key={h}
                                        scope="col"
                                        className={`px-3 py-2.5 text-left font-black uppercase tracking-wider whitespace-nowrap border-b border-slate-200 dark:border-slate-700 ${
                                            isExpected
                                                ? 'text-primary'
                                                : isMissing
                                                ? 'text-slate-400 dark:text-slate-500'
                                                : 'text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        {h || '—'}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.slice(0, PREVIEW_ROW_COUNT).map((row, rowIdx) => (
                            <tr
                                key={rowIdx}
                                className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                {headers.map((h) => (
                                    <td
                                        key={h}
                                        className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-[180px] truncate"
                                        title={row[h] || ''}
                                    >
                                        {row[h] || (
                                            <span className="text-slate-300 dark:text-slate-600 italic">vacío</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExcelImport({
    isOpen,
    onClose,
    onImport,
    title = 'Importar desde Excel',
    expectedColumns,
}: ExcelImportProps) {
    const [step, setStep] = useState<ImportStep>('idle');
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string>('');
    const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Reset ──────────────────────────────────────────────────────────────
    const reset = useCallback(() => {
        setStep('idle');
        setIsDragging(false);
        setFileName('');
        setParsedData([]);
        setHeaders([]);
        setErrorMessage('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleClose = useCallback(() => {
        reset();
        onClose();
    }, [reset, onClose]);

    // ── File processing ────────────────────────────────────────────────────
    const processFile = useCallback(async (file: File) => {
        if (!isValidFile(file)) {
            setErrorMessage('Formato no soportado. Use archivos .xlsx, .xls o .csv.');
            setStep('error');
            return;
        }

        setErrorMessage('');
        setStep('idle');

        try {
            const data = await parseWorkbook(file);
            const derivedHeaders = data.length > 0 ? Object.keys(data[0]) : [];

            setFileName(file.name);
            setParsedData(data);
            setHeaders(derivedHeaders);
            setStep('preview');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error desconocido al procesar el archivo.';
            setErrorMessage(msg);
            setStep('error');
        }
    }, []);

    // ── Drag and drop handlers ─────────────────────────────────────────────
    const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Only clear if leaving the drop zone itself, not a child element
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const file = e.dataTransfer.files?.[0];
            if (file) processFile(file);
        },
        [processFile]
    );

    // ── Input file change ──────────────────────────────────────────────────
    const handleInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
        },
        [processFile]
    );

    // ── Confirm import ─────────────────────────────────────────────────────
    const handleConfirm = useCallback(async () => {
        if (parsedData.length === 0) return;

        setStep('importing');
        try {
            await onImport(parsedData);
            setStep('done');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al importar los datos.';
            setErrorMessage(msg);
            setStep('error');
        }
    }, [parsedData, onImport]);

    // ── Derived values ─────────────────────────────────────────────────────
    const totalRows = parsedData.length;
    const previewCount = Math.min(totalRows, PREVIEW_ROW_COUNT);
    const remainingRows = totalRows - previewCount;

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            maxWidth="4xl"
            title={title}
            subtitle="Cargue un archivo .xlsx, .xls o .csv para importar datos"
            icon={<FileSpreadsheet className="w-5 h-5 text-primary" />}
        >
            <div className="p-6 space-y-6 bg-white dark:bg-slate-900">

                {/* ── Drop zone (shown when idle or error) ── */}
                {(step === 'idle' || step === 'error') && (
                    <div className="space-y-4">
                        <SectionLabel>Seleccionar archivo</SectionLabel>

                        <div
                            role="button"
                            tabIndex={0}
                            aria-label="Zona de arrastre para archivos. Haga clic o arrastre un archivo aquí."
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                            }}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                                isDragging
                                    ? 'border-primary bg-primary/5 dark:bg-primary/10 scale-[1.01]'
                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-primary/60 hover:bg-primary/5 dark:hover:bg-primary/5'
                            }`}
                        >
                            <div
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                                    isDragging
                                        ? 'bg-primary/20'
                                        : 'bg-slate-100 dark:bg-slate-800'
                                }`}
                            >
                                {isDragging ? (
                                    <FileSpreadsheet className="w-8 h-8 text-primary animate-bounce" />
                                ) : (
                                    <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                )}
                            </div>

                            <div className="text-center space-y-1">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                    {isDragging
                                        ? 'Suelte el archivo aquí'
                                        : 'Arrastre un archivo o haga clic para seleccionar'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Formatos aceptados: .xlsx, .xls, .csv
                                </p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleInputChange}
                                className="sr-only"
                                aria-hidden="true"
                                tabIndex={-1}
                            />
                        </div>

                        {/* Error banner */}
                        {step === 'error' && (
                            <div
                                role="alert"
                                className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2 duration-300"
                            >
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-0.5">
                                    <p className="text-sm font-bold text-red-700 dark:text-red-300">
                                        Error al procesar el archivo
                                    </p>
                                    <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Cerrar error"
                                    onClick={() => setStep('idle')}
                                    className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Expected columns hint */}
                        {expectedColumns && expectedColumns.length > 0 && (
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                        Columnas esperadas
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {expectedColumns.map((col) => (
                                            <span
                                                key={col}
                                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wide border border-blue-200 dark:border-blue-700"
                                            >
                                                {col}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Preview ── */}
                {step === 'preview' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* File info bar */}
                        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                        {fileName}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {totalRows.toLocaleString()} filas · {headers.length} columnas
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={reset}
                                aria-label="Eliminar archivo seleccionado"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <SectionLabel>Vista previa — primeras {previewCount} filas</SectionLabel>

                        <PreviewTable
                            headers={headers}
                            rows={parsedData}
                            expectedColumns={expectedColumns}
                        />

                        {remainingRows > 0 && (
                            <p className="text-center text-xs text-muted-foreground italic">
                                + {remainingRows.toLocaleString()} filas adicionales no mostradas
                            </p>
                        )}
                    </div>
                )}

                {/* ── Importing spinner ── */}
                {step === 'importing' && (
                    <div
                        role="status"
                        aria-live="polite"
                        aria-label="Importando datos"
                        className="flex flex-col items-center justify-center gap-4 py-12 animate-in fade-in duration-300"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                Importando datos...
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Procesando {totalRows.toLocaleString()} registros
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Done state ── */}
                {step === 'done' && (
                    <div
                        role="status"
                        aria-live="polite"
                        aria-label="Importacion completada"
                        className="flex flex-col items-center justify-center gap-4 py-12 animate-in zoom-in-95 duration-300"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                Importacion completada
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {totalRows.toLocaleString()} registros procesados correctamente
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Error after import attempt ── */}
                {step === 'error' && fileName && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 animate-in fade-in duration-300"
                    >
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-red-700 dark:text-red-300">
                                Error durante la importacion
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{errorMessage}</p>
                        </div>
                    </div>
                )}

                {/* ── Action buttons ── */}
                <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {step === 'done' ? (
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-[0.99] transition-all"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Cerrar
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={step === 'importing'}
                                className="flex-1 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={step !== 'preview' || parsedData.length === 0}
                                className="flex-[2] py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs bg-primary text-white shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                aria-disabled={step !== 'preview'}
                            >
                                {step === 'importing' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                                Confirmar Importacion
                            </button>
                        </>
                    )}
                </div>
            </div>
        </BaseModal>
    );
}
