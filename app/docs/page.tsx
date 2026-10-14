import { DocsWorkspace } from "@/components/site/docs-workspace";
import { ProductPage } from "@/components/site/product-page";

export default function DocsPage() {
  return (
    <ProductPage
      eyebrow="Documentation"
      title="Technical documentation."
      description="Guides and product information for working with NULLXES CLOUD."
    >
      <DocsWorkspace />
    </ProductPage>
  );
}
