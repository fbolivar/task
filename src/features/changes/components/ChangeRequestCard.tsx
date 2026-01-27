import { ChangeRequest } from '../types';
import { Badge } from '@/shared/components/ui/Badge';
import { Calendar, User, ArrowRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChangeRequestCardProps {
    changeRequest: ChangeRequest;
    onClick: () => void;
    onDelete: () => void;
}

export function ChangeRequestCard({ changeRequest, onClick, onDelete }: ChangeRequestCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'implemented': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'submitted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    return (
        <div
            onClick={onClick}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5"
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {changeRequest.code}
                        </span>
                        <Badge className={`${getStatusColor(changeRequest.status)} uppercase text-[10px] px-2 py-0.5`}>
                            {changeRequest.status}
                        </Badge>
                    </div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg line-clamp-1">
                        {changeRequest.title}
                    </h3>
                </div>
                <button
                    onClick={handleDelete}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Eliminar Solicitud"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {changeRequest.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3.5 h-3.5" />
                        <span>{changeRequest.requester?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(changeRequest.created_at), 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
            </div>
        </div>
    );
}
