import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, locals, cookies }) => {
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const VALID_TYPES = ["email", "recovery", "invite"] as const;
  type OtpType = (typeof VALID_TYPES)[number];
  const rawType = url.searchParams.get("type");
  const type: OtpType | null = VALID_TYPES.includes(rawType as OtpType)
    ? (rawType as OtpType)
    : null;

  const rawNext = url.searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") ? rawNext : "/";

  const failRedirect = (message: string) =>
    redirect(303, `/login?error=${encodeURIComponent(message)}`);

  if (code) {
    const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code);
    if (error) throw failRedirect(error.message);
    if (data.session?.provider_token && url.searchParams.get('drive') === '1') {
      cookies.set('drive_tok', data.session.provider_token, {
        path: '/',
        maxAge: 3500,
        httpOnly: false,
        sameSite: 'lax',
        secure: url.protocol === 'https:'
      });
    }
  } else if (token_hash && type) {
    const { error } = await locals.supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (error) throw failRedirect(error.message);
  } else {
    throw failRedirect("ログインリンクが不正です。もう一度お試しください。");
  }

  throw redirect(303, next);
};
