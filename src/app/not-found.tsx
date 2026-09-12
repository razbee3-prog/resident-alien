import { ButtonLink, Container, Eyebrow } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="py-24">
      <Container className="max-w-[40rem]">
        <Eyebrow>404</Eyebrow>
        <h1 className="mt-4 text-[2.4rem] font-bold tracking-[-0.03em]">This page didn’t make it through customs.</h1>
        <p className="mt-4 text-muted">The address is wrong or the page moved. The landing page has everything that exists.</p>
        <ButtonLink href="/" variant="ghost" className="mt-8">
          Back to the start
        </ButtonLink>
      </Container>
    </section>
  );
}
