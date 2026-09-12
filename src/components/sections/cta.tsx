import { Container, Section } from "@/components/ui";
import { WaitlistForm } from "@/components/waitlist-form";

export function Cta() {
  return (
    <Section id="waitlist" className="scroll-mt-16">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center lg:gap-16">
        <div>
          <h2 className="text-[2.2rem] font-bold leading-[1] tracking-[-0.035em] md:text-[3.2rem]">Get on the list.</h2>
          <p className="mt-4 max-w-[28rem] text-lg text-muted">We open by country. Tell us where you’re coming from and when.</p>
        </div>
        <div className="panel p-7 md:p-9">
          <WaitlistForm compact />
        </div>
      </Container>
    </Section>
  );
}
