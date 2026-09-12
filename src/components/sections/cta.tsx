import { Container, Heading, Section } from "@/components/ui";
import { WaitlistForm } from "@/components/waitlist-form";

export function Cta() {
  return (
    <Section id="waitlist">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <Heading
          eyebrow="Waitlist"
          title="Day one starts now."
          lede="Tell us where you’re coming from and when. We open by country and segment, and the first bill you name shapes what we build."
        />
        <WaitlistForm />
      </Container>
    </Section>
  );
}
