import { createClient } from '@supabase/supabase-js';

/**
 * Validates an API key from the X-API-Key header
 * Returns the API key record if valid, null if invalid
 */
export async function validateApiKey(apiKey: string | null): Promise<{
    valid: boolean;
    key?: {
        id: string;
        name: string;
        permissions: string[];
        rate_limit: number;
    };
    error?: string;
}> {
    if (!apiKey) {
        return { valid: false, error: 'API key required. Use X-API-Key header.' };
    }

    // Extract prefix for lookup
    const keyPrefix = apiKey.substring(0, 8);

    // Create admin client (uses service role key)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.includes('PEGA_AQUÍ')) {
        return { valid: false, error: 'Internal configuration error. Missing SUPABASE_SERVICE_ROLE_KEY.' };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find key by prefix
    const { data: keys, error } = await supabase
        .from('api_keys')
        .select('id, name, key_hash, permissions, rate_limit, is_active')
        .eq('key_prefix', keyPrefix)
        .eq('is_active', true);

    if (error || !keys || keys.length === 0) {
        return { valid: false, error: 'Invalid API key' };
    }

    // Hash the provided key and compare
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const providedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const matchingKey = keys.find(k => k.key_hash === providedHash);

    if (!matchingKey) {
        return { valid: false, error: 'Invalid API key' };
    }

    // Update last_used_at
    await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', matchingKey.id);

    return {
        valid: true,
        key: {
            id: matchingKey.id,
            name: matchingKey.name,
            permissions: matchingKey.permissions,
            rate_limit: matchingKey.rate_limit
        }
    };
}

/**
 * Check if the API key has a specific permission
 */
export function hasPermission(permissions: string[], required: 'read' | 'write' | 'delete'): boolean {
    return permissions.includes(required) || permissions.includes('*');
}
