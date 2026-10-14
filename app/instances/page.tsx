import { ProductPage } from "@/components/site/product-page";
import { InstancesWorkspace } from "@/components/site/instances-workspace";

export default function InstancesPage() {
  return (
    <ProductPage
      eyebrow="Compute"
      title="Your instances."
      description="View and organize the compute resources associated with your account."
    >
      <InstancesWorkspace />
    </ProductPage>
  );
}
