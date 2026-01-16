import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";

export const metadata = {
  title: "Pricing - SafePlay",
  description: "Choose the right SafePlay plan for you. From free to enterprise, we have a plan that fits your needs.",
};

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
