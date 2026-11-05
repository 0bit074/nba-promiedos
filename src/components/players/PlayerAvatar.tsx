"use client";

import Image from "next/image";
import { useState } from "react";

interface PlayerAvatarProps {
  name: string;
  url: string | null;
  /** Diámetro en píxeles. */
  size: number;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
}

/** Foto del jugador; si no existe o falla, muestra sus iniciales. */
export function PlayerAvatar({ name, url, size }: PlayerAvatarProps) {
  const [hasFailed, setHasFailed] = useState(false);

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-raised font-bold text-muted"
    >
      {url && !hasFailed ? (
        <Image
          src={url}
          alt=""
          width={size}
          height={size}
          onError={() => setHasFailed(true)}
          className="size-full object-cover object-top"
        />
      ) : (
        <span aria-hidden>{getInitials(name)}</span>
      )}
    </div>
  );
}
