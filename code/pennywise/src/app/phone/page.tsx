import type { Metadata } from "next";
import { PhoneFrame } from "@/components/PhoneFrame";

export const metadata: Metadata = { title: "PennyWise on a phone" };

export default function PhonePage() {
  return <PhoneFrame />;
}
