import { createClient } from '@/lib/supabase/client';
import { ChangeRequest, ChangeRequestFormData, ChangeStatus, ChangeType } from '../types';
import { notificationService } from '@/shared/services/notificationService';

export const changeService = {
    async getChangeRequests(projectId?: string): Promise<ChangeRequest[]> {
        const supabase = createClient();
        let query = supabase
            .from('change_requests')
            .select(`
                *,
                project:projects(id, name, entity:entities(name, logo_url)),
                requester:profiles!change_requests_requester_id_fkey(full_name, email),
                task:tasks(title)
            `)
            .order('created_at', { ascending: false });

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as unknown as ChangeRequest[];
    },

    async getChangeRequestById(id: string): Promise<ChangeRequest> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('change_requests')
            .select(`
                *,
                project:projects(id, name, entity:entities(name, logo_url)),
                requester:profiles!change_requests_requester_id_fkey(full_name, email),
                approver:profiles!change_requests_approver_id_fkey(full_name),
                task:tasks(title),
                plans:change_plans(*, responsible:profiles!change_plans_responsible_id_fkey(full_name)),
                risks:change_risks(*),
                rollbacks:change_rollbacks(*),
                assets:change_request_assets(asset:assets(id, name))
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Flatten assets
        const flattened = {
            ...data,
            assets: data.assets?.map((a: any) => a.asset)
        };

        return flattened as unknown as ChangeRequest;
    },

    async createChangeRequest(data: ChangeRequestFormData): Promise<ChangeRequest> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // 0. Clean data
        const cleanData = this.cleanFormData(data);
        const { plans, risks, rollbacks, asset_ids, ...crData } = cleanData;

        // 1. Create CR
        const { data: newCR, error } = await supabase
            .from('change_requests')
            .insert({
                ...crData,
                requester_id: user.id,
                status: 'submitted' // Change from draft to submitted directly to trigger workflow
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Insert Children
        if (plans && plans.length > 0) {
            await supabase.from('change_plans').insert(
                plans.map(p => ({ ...p, change_request_id: newCR.id }))
            );
        }
        if (risks && risks.length > 0) {
            await supabase.from('change_risks').insert(
                risks.map(r => ({ ...r, change_request_id: newCR.id }))
            );
        }
        if (rollbacks && rollbacks.length > 0) {
            await supabase.from('change_rollbacks').insert(
                rollbacks.map(r => ({ ...r, change_request_id: newCR.id }))
            );
        }
        if (asset_ids && asset_ids.length > 0) {
            await supabase.from('change_request_assets').insert(
                asset_ids.map(asset_id => ({ change_request_id: newCR.id, asset_id }))
            );
        }


        const newCRFull = await this.getChangeRequestById(newCR.id);

        // 3. Notify Stakeholders (Requester and Approver)
        // Wrap in try/catch to NOT block the main Save operation if email config fails
        try {
            // Notify Requester
            await this.notifyChangeStatus(newCRFull, 'submitted');

            // Notify Approver for authorization
            if (newCRFull.approver_id) {
                const { data: approver } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', newCRFull.approver_id)
                    .single();

                if (approver?.email) {
                    const origin = window.location.origin;
                    await notificationService.notifyWithTemplate(
                        approver.email,
                        'change_auth_request',
                        {
                            approver_name: approver.full_name || 'Autorizador',
                            requester_name: newCRFull.requester?.full_name || 'Usuario',
                            code: newCRFull.code,
                            title: newCRFull.title,
                            project: newCRFull.project?.name || 'N/A',
                            link: `${origin}/cambios`
                        }
                    );
                }
            }
        } catch (error) {
            console.error('Core notification workflow failed, but CR was saved:', error);
        }

        return newCRFull;
    },

    async updateChangeRequest(id: string, updates: Partial<ChangeRequestFormData>): Promise<ChangeRequest> {
        const supabase = createClient();

        // 0. Clean data
        const cleanUpdates = this.cleanFormData(updates as ChangeRequestFormData);
        const { plans, risks, rollbacks, asset_ids, ...crData } = cleanUpdates;

        // 1. Update CR Main Data
        if (Object.keys(crData).length > 0) {
            // Remove status from crData to avoid resetting it during update
            const { status, ...finalData } = crData as any;
            const { error } = await supabase
                .from('change_requests')
                .update(finalData)
                .eq('id', id);
            if (error) throw error;
        }

        // 2. Handle Children
        if (plans) {
            await supabase.from('change_plans').upsert(
                plans.map(p => ({ ...p, change_request_id: id }))
            );
        }
        if (risks) {
            await supabase.from('change_risks').upsert(
                risks.map(r => ({ ...r, change_request_id: id }))
            );
        }
        if (rollbacks) {
            await supabase.from('change_rollbacks').upsert(
                rollbacks.map(r => ({ ...r, change_request_id: id }))
            );
        }
        if (asset_ids) {
            // Replace assets
            await supabase.from('change_request_assets').delete().eq('change_request_id', id);
            if (asset_ids.length > 0) {
                await supabase.from('change_request_assets').insert(
                    asset_ids.map(asset_id => ({ change_request_id: id, asset_id }))
                );
            }
        }

        return this.getChangeRequestById(id);
    },

    cleanFormData(data: ChangeRequestFormData): ChangeRequestFormData {
        const clean: any = { ...data };

        // 1. Handle dates: empty string to null
        const dateFields = ['start_at', 'end_at', 'comm_date'];
        dateFields.forEach(field => {
            if (clean[field] === '') clean[field] = null;
        });

        // 2. Filter children: remove items with missing required fields
        if (clean.plans) {
            clean.plans = clean.plans.filter((p: any) => p.phase && p.activity);
            clean.plans.forEach((p: any) => {
                if (p.start_at === '') p.start_at = null;
                if (p.end_at === '') p.end_at = null;
            });
        }

        if (clean.risks) {
            clean.risks = clean.risks.filter((r: any) => r.risk_description);
        }

        if (clean.rollbacks) {
            clean.rollbacks = clean.rollbacks.filter((r: any) => r.event_trigger && r.activity);
        }

        return clean;
    },

    async updateStatus(id: string, status: ChangeStatus, approverId?: string): Promise<void> {
        const supabase = createClient();
        const updates: any = { status };
        if (status === 'approved' || status === 'rejected') {
            updates.approver_id = approverId;
            updates.approval_date = new Date().toISOString();
        }

        const { error } = await supabase
            .from('change_requests')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        // Notify
        try {
            const updatedCR = await this.getChangeRequestById(id);
            await this.notifyChangeStatus(updatedCR, status);
        } catch (e) {
            console.error("Notification failed", e);
        }
    },

    async getAssets(): Promise<{ id: string; name: string }[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('assets')
            .select('id, name')
            .order('name');

        if (error) {
            console.error('Error fetching assets:', error);
            return []; // Return empty if error or table missing to avoid breaking UI
        }
        return data || [];
    },

    async notifyChangeStatus(cr: ChangeRequest, newStatus: ChangeStatus) {
        if (!cr.requester?.email) return;

        const templateMap: Record<string, string> = {
            'submitted': 'change_submitted',
            'approved': 'change_approved',
            'rejected': 'change_rejected',
            'implemented': 'change_implemented'
        };

        const templateCode = templateMap[newStatus];
        if (!templateCode) return;

        let attachments: any[] = [];

        // Only generate PDF for Approved status
        if (newStatus === 'approved') {
            try {
                const { generateChangeRequestPDF } = await import('../utils/pdfGenerator');
                const base64Pdf = await generateChangeRequestPDF(cr);
                attachments.push({
                    filename: `Reporte_Cambio_${cr.code}.pdf`,
                    content: base64Pdf,
                    encoding: 'base64'
                });
            } catch (pdfError) {
                console.error('Failed to generate PDF for attachment:', pdfError);
            }
        }

        await notificationService.notifyWithTemplate(
            cr.requester.email,
            templateCode,
            {
                name: cr.requester.full_name || 'Usuario',
                code: cr.code,
                title: cr.title,
                project: cr.project?.name || 'N/A',
                link: `${window.location.origin}/cambios`
            },
            attachments
        );
    },

    async deleteChangeRequest(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('change_requests')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
