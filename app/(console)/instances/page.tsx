import { InstancesWorkspace } from "@/components/site/instances-workspace";

export default function InstancesPage() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">
          Console / Compute
        </p>
        <h1 className="text-3xl font-medium tracking-tight">Instances</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Review instance lifecycle records associated with your account.
        </p>
      </div>
      <InstancesWorkspace />
    </div>
  );
}
