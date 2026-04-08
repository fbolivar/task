import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(150,20%,96%)] dark:bg-[hsl(160,20%,7%)] px-6">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl font-black text-primary">404</span>
                </div>
                <h1 className="text-2xl font-black text-foreground mb-2">Pagina no encontrada</h1>
                <p className="text-muted-foreground text-sm mb-8">
                    La ruta que buscas no existe o fue movida.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
                >
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
