import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;

	const [subjectsRes, resourcesRes, pinnedRes] = await Promise.all([
		supabase
			.from('subjects')
			.select('*')
			.eq('is_archived', false)
			.order('sort_order')
			.order('exam_date'),
		supabase
			.from('resources')
			.select('*')
			.eq('category', 'past_exam')
			.order('sort_order')
			.order('created_at'),
		supabase.from('subjects').select('*').eq('pinned', true).order('sort_order')
	]);

	const subjects = subjectsRes.data ?? [];
	const resources = resourcesRes.data ?? [];
	const pinnedSubjects = pinnedRes.data ?? [];

	// Only keep resources for subjects that exist in the subjects list
	const subjectIds = new Set(subjects.map((s) => s.id));
	const filteredResources = resources.filter((r) => subjectIds.has(r.subject_id));

	const term = subjects[0]?.term ?? '2026 春学期';

	return { subjects, resources: filteredResources, pinnedSubjects, term };
};
