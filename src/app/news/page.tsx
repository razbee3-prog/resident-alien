import type { Metadata } from "next";
import { PolicyFeed } from "@/components/sections/policy-feed";

export const metadata: Metadata = {
  title: "News",
  description: "Policy moves that touch H-1B workers and F-1 students, one line each, with sources.",
};

export default function NewsPage() {
  return <PolicyFeed title="News." showAllLink={false} />;
}
