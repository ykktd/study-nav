export type ResourceCategory = 'past_exam' | 'lecture' | 'other';

export interface Subject {
	id: string;
	name: string;
	day_period: string | null;
	exam_date: string | null; // ISO date string e.g. "2026-05-18"
	term: string;
	is_archived: boolean;
	pinned: boolean;
	sort_order: number;
	created_at: string;
}

export interface Resource {
	id: string;
	subject_id: string;
	category: ResourceCategory;
	name: string;
	url: string;
	done: boolean;
	sort_order: number;
	created_at: string;
}

/** Subject enriched with past_exam progress counts */
export interface SubjectWithProgress extends Subject {
	past_exam_total: number;
	past_exam_done: number;
}

/** Database type used by Supabase client generics */
export interface Database {
	public: {
		Tables: {
			subjects: {
				Row: Subject;
				Insert: Omit<Subject, 'id' | 'created_at'>;
				Update: Partial<Omit<Subject, 'id' | 'created_at'>>;
				Relationships: [];
			};
			resources: {
				Row: Resource;
				Insert: Omit<Resource, 'id' | 'created_at'>;
				Update: Partial<Omit<Resource, 'id' | 'created_at'>>;
				Relationships: [];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
}

export function progressState(done: number, total: number): 'low' | 'mid' | 'high' | 'done' {
	if (total === 0) return 'low';
	if (done === total) return 'done';
	const p = done / total;
	if (p <= 0.33) return 'low';
	if (p <= 0.66) return 'mid';
	return 'high';
}

export function toPreviewUrl(url: string): string {
	const match = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
	if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
	return url;
}

export function formatExamDate(dateStr: string | null): string {
	if (!dateStr) return '—';
	const d = new Date(dateStr);
	const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(d.getUTCDate()).padStart(2, '0');
	return `${mm}/${dd}`;
}

export function daysUntil(dateStr: string | null): number | null {
	if (!dateStr) return null;
	const now = new Date();
	const exam = new Date(dateStr);
	const diff = exam.getTime() - now.getTime();
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
