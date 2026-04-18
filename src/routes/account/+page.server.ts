import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const { user } = await locals.safeGetSession();
	const driveConnected = !!cookies.get('drive_tok');
	return { user, driveConnected };
};
