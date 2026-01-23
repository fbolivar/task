import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { UserProfile, UserFormData, Role, EntityShort } from '../types';

export function useUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [entities, setEntities] = useState<EntityShort[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersData, rolesData, entitiesData] = await Promise.all([
                userService.getUsers(),
                userService.getRoles(),
                userService.getEntities()
            ]);
            setUsers(usersData);
            setRoles(rolesData);
            setEntities(entitiesData);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const createUser = async (data: UserFormData) => {
        await userService.createUser(data);
        await fetchData(); // Refresh list
    };

    const updateUser = async (id: string, data: UserFormData) => {
        await userService.updateUser(id, data);
        await fetchData();
    };

    const deleteUser = async (id: string) => {
        await userService.deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    const toggleUserStatus = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        await userService.toggleStatus(id, newStatus);
        setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: newStatus } : u));
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        users,
        roles,
        entities,
        loading,
        createUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        refresh: fetchData
    };
}
