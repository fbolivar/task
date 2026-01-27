import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateApiKey, hasPermission } from '@/lib/api/validateApiKey';

/**
 * GET /api/v1/tasks
 * 
 * Example API endpoint for external integrations.
 * Requires X-API-Key header with valid API key.
 * 
 * Query Parameters:
 * - status: Filter by status (pending, in_progress, completed, on_hold)
 * - project_id: Filter by project
 * - limit: Max results (default: 50)
 * - offset: Pagination offset (default: 0)
 * 
 * Example:
 * curl -H "X-API-Key: sgp_xxx..." https://your-app.com/api/v1/tasks?status=pending
 */
export async function GET(request: NextRequest) {
    // 1. Validate API Key
    const apiKey = request.headers.get('X-API-Key');
    const validation = await validateApiKey(apiKey);

    if (!validation.valid) {
        return NextResponse.json(
            { error: validation.error, code: 'UNAUTHORIZED' },
            { status: 401 }
        );
    }

    // 2. Check permission
    if (!hasPermission(validation.key!.permissions, 'read')) {
        return NextResponse.json(
            { error: 'Insufficient permissions. READ access required.', code: 'FORBIDDEN' },
            { status: 403 }
        );
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const projectId = searchParams.get('project_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // 4. Fetch data using service role (bypasses RLS for API access)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
        .from('tasks')
        .select(`
            id,
            title,
            description,
            status,
            priority,
            due_date,
            progress,
            created_at,
            project:projects(id, name),
            assigned_to:profiles!tasks_assigned_to_fkey(id, full_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
        query = query.eq('status', status);
    }
    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tasks', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }

    // 5. Return response with metadata
    return NextResponse.json({
        success: true,
        meta: {
            total: count,
            limit,
            offset,
            api_key_name: validation.key!.name
        },
        data
    });
}

/**
 * POST /api/v1/tasks
 * 
 * Create a new task via API.
 * Requires X-API-Key with WRITE permission.
 * 
 * Body:
 * {
 *   "title": "Task title",
 *   "description": "Optional description",
 *   "project_id": "uuid",
 *   "assigned_to": "uuid (optional)",
 *   "priority": "low|medium|high|critical",
 *   "due_date": "2025-01-30 (optional)"
 * }
 */
export async function POST(request: NextRequest) {
    // 1. Validate API Key
    const apiKey = request.headers.get('X-API-Key');
    const validation = await validateApiKey(apiKey);

    if (!validation.valid) {
        return NextResponse.json(
            { error: validation.error, code: 'UNAUTHORIZED' },
            { status: 401 }
        );
    }

    // 2. Check permission
    if (!hasPermission(validation.key!.permissions, 'write')) {
        return NextResponse.json(
            { error: 'Insufficient permissions. WRITE access required.', code: 'FORBIDDEN' },
            { status: 403 }
        );
    }

    // 3. Parse body
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON body', code: 'BAD_REQUEST' },
            { status: 400 }
        );
    }

    const { title, description, project_id, assigned_to, priority, due_date } = body;

    if (!title || !project_id) {
        return NextResponse.json(
            { error: 'title and project_id are required', code: 'VALIDATION_ERROR' },
            { status: 400 }
        );
    }

    // 4. Create task
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('tasks')
        .insert({
            title,
            description: description || '',
            project_id,
            assigned_to: assigned_to || null,
            priority: priority || 'medium',
            due_date: due_date || null,
            status: 'pending',
            progress: 0
        })
        .select()
        .single();

    if (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to create task', details: error.message, code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        message: 'Task created successfully',
        data
    }, { status: 201 });
}
