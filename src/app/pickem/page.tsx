import type { Metadata } from "next";
import { Target } from "lucide-react";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Pick'em" };

export default function Page() {
  return (
    <ComingSoon
      title="Pick'em"
      description="Predice los partidos de cada día y suma puntos."
      icon={Target}
    />
  );
}
