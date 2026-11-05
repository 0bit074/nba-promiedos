import Link from "next/link";
import { StatusMessage } from "@/components/ui/StatusMessage";

export default function NotFound() {
  return (
    <StatusMessage title="No encontramos a este equipo">
      Puede que el enlace sea incorrecto.{" "}
      <Link href="/posiciones" className="font-medium text-accent">
        Volver a Posiciones
      </Link>
    </StatusMessage>
  );
}
