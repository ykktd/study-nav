import type { Session, SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			supabase: SupabaseClient<any>;
			safeGetSession: () => Promise<{ session: Session | null }>;
		}
		interface PageData {
			session: Session | null;
		}
	}
}

export {};
