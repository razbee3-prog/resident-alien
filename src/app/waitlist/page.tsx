import type { Metadata } from "next";
import { WaitlistForm } from "@/components/waitlist-form";
import { Container, Heading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description: "Tell us where you’re coming from and when. We open by country and segment.",
};

export default function WaitlistPage() {
  return (
    <section className="py-16 md:py-24">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <Heading
          eyebrow="Waitlist"
          title="Day one starts now."
          lede="We open by country and segment. Your answers decide the order, and the first bill you name shapes what we build first."
        />
        <WaitlistForm />
      </Container>
    </section>
  );
}
