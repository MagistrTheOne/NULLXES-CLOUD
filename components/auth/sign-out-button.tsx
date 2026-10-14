import { signOut } from "@/lib/auth/actions";
import { buttonVariants } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Sign out
      </button>
    </form>
  );
}
