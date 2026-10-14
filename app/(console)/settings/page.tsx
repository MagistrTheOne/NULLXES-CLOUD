import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">
          Console / Settings
        </p>
        <h1 className="text-3xl font-medium tracking-tight">Account settings</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Review the account details provided by your sign-in session.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs text-muted-foreground">Name</dt>
              <dd className="text-sm">{user.name || "Not provided"}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="break-all text-sm">{user.email}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs text-muted-foreground">Email status</dt>
              <dd>
                <Badge variant={user.emailVerified ? "secondary" : "outline"}>
                  {user.emailVerified ? "Verified" : "Not verified"}
                </Badge>
              </dd>
            </div>
          </dl>
          <div className="border-t border-border pt-4">
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
