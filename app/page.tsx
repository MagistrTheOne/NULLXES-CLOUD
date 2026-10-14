import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { GpuSection } from "@/components/site/gpu-section";
import { Footer } from "@/components/site/footer";

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <GpuSection />
      </main>
      <Footer />
    </>
  );
}
