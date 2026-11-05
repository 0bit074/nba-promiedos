import Link from "next/link";
import { StatusMessage } from "@/components/ui/StatusMessage";

export default function NotFound() {
  return (
    <StatusMessage title="No encontramos a este jugador">
      Puede que el enlace sea incorrecto.{" "}
      <Link href="/jugadores" className="font-medium text-accent">
        Volver a Jugadores
      </Link>
    </StatusMessage>
  );
}
