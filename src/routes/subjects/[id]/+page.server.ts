import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const supabase = locals.supabase;
	const { id } = params;

	const [subjectRes, resourcesRes, pinnedRes] = await Promise.all([
		supabase.from('subjects').select('*').eq('id', id).single(),
		supabase.from('resources').select('*').eq('subject_id', id).order('sort_order').order('created_at'),
		supabase.from('subjects').select('*').eq('pinned', true).order('sort_order')
	]);

	if (subjectRes.error || !subjectRes.data) {
		throw error(404, '科目が見つかりません');
	}

	const subject = subjectRes.data;
	const resources = resourcesRes.data ?? [];
	const pinnedSubjects = pinnedRes.data ?? [];

	const pastExams = resources.filter((r) => r.category === 'past_exam');
	const pastExamDone = pastExams.filter((r) => r.done).length;

	return {
		subject,
		resources,
		pastExamTotal: pastExams.length,
		pastExamDone,
		pinnedSubjects,
		term: subject.term
	};
};

export const actions: Actions = {
	addResource: async ({ request, locals, params }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const url = String(data.get('url') ?? '').trim();
		const category = String(data.get('category') ?? '');

		if (!name || !url || !category) return fail(400, { error: '全項目を入力してください' });
		if (!['past_exam', 'lecture', 'other'].includes(category))
			return fail(400, { error: '無効なカテゴリです' });

		const { error: err } = await locals.supabase.from('resources').insert({
			subject_id: params.id,
			name,
			url,
			category: category as 'past_exam' | 'lecture' | 'other',
			done: false,
			sort_order: 0
		});
		if (err) return fail(500, { error: err.message });
	},

	deleteResource: async ({ request, locals }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		if (!id) return fail(400, { error: 'IDが必要です' });
		await locals.supabase.from('resources').delete().eq('id', id);
	}
};
