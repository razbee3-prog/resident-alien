import type { Metadata } from "next";
import { SegmentPage } from "@/components/segment-page";
import { segments } from "@/lib/segments";

export const metadata: Metadata = {
  title: "Professional card",
  description: segments.professional.sub,
};

export default function ProfessionalsPage() {
  return <SegmentPage segment="professional" />;
}
