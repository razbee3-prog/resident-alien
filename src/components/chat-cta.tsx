import QRCode from "qrcode";
import { ChatButton } from "@/components/chat-button";
import { site } from "@/lib/site";

/** Server wrapper: renders nothing until a Sendblue number is configured; pre-renders the desktop QR as SVG. */
export async function ChatCta({ size = "md", className = "" }: { size?: "md" | "lg"; className?: string }) {
  if (!site.chatNumber) return null;
  const qrSvg = await QRCode.toString(`sms:${site.chatNumber}?&body=${encodeURIComponent("Hi Credit Alien 👽 Help me build U.S. credit.")}`, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#ececf1", light: "#00000000" },
  });
  return <ChatButton number={site.chatNumber} qrSvg={qrSvg} size={size} className={className} />;
}
