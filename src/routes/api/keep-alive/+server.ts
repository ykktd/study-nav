import { json, type RequestHandler } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const KEEP_ALIVE_SECRET_HEADER = 'x-keep-alive-secret';

function isAuthorized(request: Request) {
	const configuredSecret = privateEnv.KEEP_ALIVE_SECRET;
	if (!configuredSecret) return true;

	const headerSecret = request.headers.get(KEEP_ALIVE_SECRET_HEADER);
	const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
	const querySecret = new URL(request.url).searchParams.get('secret');

	return [headerSecret, bearerToken, querySecret].includes(configuredSecret);
}

export const GET: RequestHandler = async ({ request, fetch }) => {
	if (!isAuthorized(request)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!supabaseUrl || !supabaseKey) {
		return json({ ok: false, error: 'Missing Supabase environment variables' }, { status: 500 });
	}

	const response = await fetch(`${supabaseUrl}/rest/v1/rpc/keep_alive`, {
		method: 'POST',
		headers: {
			apikey: supabaseKey,
			authorization: `Bearer ${supabaseKey}`,
			'content-type': 'application/json'
		},
		body: '{}'
	});

	if (!response.ok) {
		const errorText = await response.text();
		return json(
			{ ok: false, error: 'Supabase keep-alive request failed', detail: errorText },
			{ status: 502 }
		);
	}

	return json({ ok: true, checkedAt: await response.json() });
};
