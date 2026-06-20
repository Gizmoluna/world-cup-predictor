import { getResetUserId } from "@/lib/password-reset";
import { getUser } from "@/lib/data";
import { ResetForm } from "@/components/reset-form";

export const dynamic = "force-dynamic";

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const userId = await getResetUserId(token);
  const user = userId ? await getUser(userId) : null;

  return (
    <div className="pitch-lines flex min-h-dvh flex-col items-center justify-center p-6">
      <div className="glass w-full max-w-sm rounded-2xl p-6">
        <h1 className="title-bc mb-1 text-2xl">Reset your PIN</h1>
        {user ? (
          <>
            <p className="mb-5 text-sm text-muted">Welcome back, {user.name}. Choose a new PIN or password.</p>
            <ResetForm token={token} />
          </>
        ) : (
          <>
            <p className="mb-5 text-sm text-danger">This reset link is invalid or has expired.</p>
            <a href="/" className="block rounded-xl bg-[var(--accent)] py-3 text-center text-sm font-bold text-black">
              Back to login
            </a>
          </>
        )}
      </div>
    </div>
  );
}
