'use client';

import { useState, useMemo } from 'react';
import { useUsers } from '@/features/users/hooks/useUsers';
import { userService } from '@/features/users/services/userService';
import { UserTable } from '@/features/users/components/UserTable';
import { UserModal } from '@/features/users/components/UserModal';
import { ChangePasswordModal } from '@/features/users/components/ChangePasswordModal';
import { UserProfile, UserFormData } from '@/features/users/types';
import { Shield, Plus, Search, Loader2, Users } from 'lucide-react';

export default function UsuariosPage() {
    const {
        users,
        roles,
        entities,
        loading,
        createUser,
        updateUser,
        deleteUser,
        toggleUserStatus
    } = useUsers();

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [passwordUser, setPasswordUser] = useState<UserProfile | null>(null);

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.role?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const handleOpenCreate = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user: UserProfile) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleSave = async (data: UserFormData) => {
        if (editingUser) {
            await updateUser(editingUser.id, data);
        } else {
            await createUser(data);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este usuario? Se perderá el acceso permanentemente.')) {
            await deleteUser(id);
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">Cifrando accesos...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 rotate-3">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter">Gestión de Capital Humano</h1>
                        <p className="text-muted-foreground font-bold flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-emerald-500" /> Control Centralizado de Roles y Protocolos de Acceso
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleOpenCreate}
                    className="group bg-slate-900 dark:bg-primary hover:bg-black dark:hover:bg-primary/80 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-2xl flex items-center gap-3 transition-all hover:translate-y-[-4px] active:translate-y-[0px] active:scale-95"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Añadir Nuevo Funcionario
                </button>
            </div>

            {/* Quick Stats & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Filtrar por nombre, correo o rol administrativo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-8 focus:ring-primary/5 transition-all text-sm font-bold placeholder:text-muted-foreground/50 outline-none shadow-sm"
                    />
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col justify-center items-center">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Usuarios</p>
                    <p className="text-2xl font-black text-primary leading-none">{users.length}</p>
                </div>
            </div>

            {/* Content Area */}
            {filteredUsers.length > 0 ? (
                <UserTable
                    users={filteredUsers}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onToggleStatus={toggleUserStatus}
                    onChangePassword={(user) => {
                        setPasswordUser(user);
                        setIsPasswordModalOpen(true);
                    }}
                />
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-8">
                        <Users className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground">No se detectaron usuarios activos</h3>
                    <p className="text-muted-foreground mt-3 max-w-sm font-medium">
                        Tu búsqueda no coincide con ningún registro en la base de datos central.
                    </p>
                </div>
            )}

            {/* Admin Modal */}
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                user={editingUser}
                roles={roles}
                entities={entities}
            />

            {/* Password Modal */}
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                user={passwordUser}
                onConfirm={async (newPassword) => {
                    if (passwordUser) {
                        await userService.adminUpdatePassword(passwordUser.id, newPassword);
                        alert('Contraseña actualizada correctamente para ' + passwordUser.full_name);
                    }
                }}
            />
        </div>
    );
}
