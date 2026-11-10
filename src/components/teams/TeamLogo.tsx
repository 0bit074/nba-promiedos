import Image from "next/image";

/** ESPN publica cada logo en dos versiones: para fondo oscuro y para claro. */
function getLightLogoUrl(darkUrl: string) {
  return darkUrl.replace("/500-dark/", "/500/");
}

interface TeamLogoProps {
  /** Logo para fondo oscuro, como viene en `Team.logoUrl`. */
  url: string;
  /** Ancho y alto en píxeles. */
  size: number;
  className?: string;
}

/** Muestra la versión del logo que se lee bien en el tema activo. */
export function TeamLogo({ url, size, className = "" }: TeamLogoProps) {
  const lightUrl = getLightLogoUrl(url);

  if (lightUrl === url) {
    return (
      <Image src={url} alt="" width={size} height={size} className={className} />
    );
  }

  return (
    <>
      <Image
        src={url}
        alt=""
        width={size}
        height={size}
        className={`hidden dark:block ${className}`}
      />
      <Image
        src={lightUrl}
        alt=""
        width={size}
        height={size}
        className={`dark:hidden ${className}`}
      />
    </>
  );
}
