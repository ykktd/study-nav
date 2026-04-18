import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(
		env.PUBLIC_SUPABASE_URL ?? '',
		env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
		{
			cookies: {
				getAll() {
					return event.cookies.getAll();
				},
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				setAll(cookiesToSet: any[]) {
					cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: Parameters<typeof event.cookies.set>[2] }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) return { session: null, user: null };

		return { session, user };
	};

	// Protect all routes except exact /login, /auth and their subroutes
	const pathname = event.url.pathname;
	const isPublic =
		pathname === '/login' ||
		pathname.startsWith('/login/') ||
		pathname === '/auth' ||
		pathname.startsWith('/auth/');

	if (!isPublic) {
		const { user } = await event.locals.safeGetSession();
		if (!user) {
			throw redirect(303, '/login');
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
