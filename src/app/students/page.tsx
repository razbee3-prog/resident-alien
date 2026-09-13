import type { Metadata } from "next";
import { SegmentPage } from "@/components/segment-page";
import { segments } from "@/lib/segments";

export const metadata: Metadata = {
  title: "Student card",
  description: segments.student.sub,
};

export default function StudentsPage() {
  return <SegmentPage segment="student" />;
}
