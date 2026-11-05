"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

/** Abre el detalle sobre la cartelera; cerrarlo equivale a volver atrás. */
export function GameDetailModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  /** `true` si el cierre lo causó una navegación, que ya cambió la URL. */
  const isLeavingRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    isLeavingRef.current = false;
    if (!dialog.open) dialog.showModal();

    const { documentElement } = document;
    const previousOverflow = documentElement.style.overflow;
    documentElement.style.overflow = "hidden";

    return () => {
      documentElement.style.overflow = previousOverflow;
      // Next conserva oculta la ruta anterior: un <dialog> que siga abierto
      // dejaría inerte al resto de la página.
      isLeavingRef.current = true;
      dialog.close();
    };
  }, []);

  function close() {
    dialogRef.current?.close();
  }

  function handleClose() {
    if (!isLeavingRef.current && !dialogRef.current?.open) router.back();
  }

  function closeOnBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) close();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Detalle del partido"
      onClose={handleClose}
      onClick={closeOnBackdropClick}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-background text-foreground backdrop:bg-black/70 md:m-auto md:h-auto md:max-h-[90dvh] md:max-w-4xl md:rounded-lg md:border md:border-line"
    >
      <div className="relative px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-6 md:pt-5">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={close}
          className="absolute top-[calc(0.5rem+env(safe-area-inset-top))] right-2 z-10 flex size-10 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground"
        >
          <X aria-hidden className="size-5" />
        </button>
        {children}
      </div>
    </dialog>
  );
}
