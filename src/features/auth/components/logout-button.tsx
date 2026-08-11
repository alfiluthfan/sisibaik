import { logoutAction } from "@/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-lg border px-4 py-2 text-sm font-medium"
      >
        Logout
      </button>
    </form>
  );
}