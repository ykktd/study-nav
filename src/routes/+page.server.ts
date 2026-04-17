import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import type { SubjectWithProgress } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;

	const [subjectsRes, resourcesRes] = await Promise.all([
		supabase.from('subjects').select('*').order('sort_order').order('exam_date'),
		supabase.from('resources').select('subject_id, done').eq('category', 'past_exam')
	]);

	const subjects = subjectsRes.data ?? [];
	const resources = resourcesRes.data ?? [];

	// Build progress map per subject
	const progressMap = new Map<string, { total: number; done: number }>();
	for (const r of resources) {
		const p = progressMap.get(r.subject_id) ?? { total: 0, done: 0 };
		p.total++;
		if (r.done) p.done++;
		progressMap.set(r.subject_id, p);
	}

	const enriched: SubjectWithProgress[] = subjects.map((s) => {
		const p = progressMap.get(s.id) ?? { total: 0, done: 0 };
		return { ...s, past_exam_total: p.total, past_exam_done: p.done };
	});

	const active = enriched.filter((s) => !s.is_archived);
	const archived = enriched.filter((s) => s.is_archived);

	// Pinned subjects for sidebar
	const pinnedSubjects = active.filter((s) => s.pinned);

	// Determine current term from most common non-archived term
	const term = active[0]?.term ?? '2026 春学期';

	// Next exam: earliest exam_date that hasn't passed
	const today = new Date().toISOString().slice(0, 10);
	const nextExam = active
		.filter((s) => s.exam_date && s.exam_date >= today)
		.sort((a, b) => (a.exam_date! > b.exam_date! ? 1 : -1))[0];

	const totalPastExams = resources.length;
	const donePastExams = resources.filter((r) => r.done).length;

	return {
		subjects: active,
		archived,
		pinnedSubjects,
		term,
		nextExam,
		totalPastExams,
		donePastExams
	};
};

export const actions: Actions = {
	addSubject: async ({ request, locals }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const professor = String(data.get('professor') ?? '').trim() || null;
		const day_period = String(data.get('day_period') ?? '').trim() || null;
		const exam_date = String(data.get('exam_date') ?? '').trim() || null;
		const term = String(data.get('term') ?? '').trim();

		if (!name || !term) return fail(400, { error: '科目名と学期は必須です' });

		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: '未認証です' });

		const { error } = await locals.supabase.from('subjects').insert({
			user_id: user.id,
			name,
			professor,
			day_period,
			exam_date,
			term,
			is_archived: false,
			pinned: false,
			sort_order: 0
		});

		if (error) return fail(500, { error: error.message });
	}
};
