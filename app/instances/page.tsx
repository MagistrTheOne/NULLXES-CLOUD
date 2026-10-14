import { ProductPage } from "@/components/site/product-page";
import { InstancesWorkspace } from "@/components/site/instances-workspace";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default function InstancesPage() {
  return (
    <ProductPage
      eyebrow="Compute"
      title="Your instances."
      description="View and organize the compute resources associated with your account."
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <SignOutButton />
        </div>
        <InstancesWorkspace />
      </div>
    </ProductPage>
  );
}
