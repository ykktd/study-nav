import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as 'magiclink' | 'email' | 'recovery' | 'invite' | null;

	if (code) {
		await locals.supabase.auth.exchangeCodeForSession(code);
	} else if (token_hash && type) {
		await locals.supabase.auth.verifyOtp({ token_hash, type });
	}

	throw redirect(303, '/');
};
