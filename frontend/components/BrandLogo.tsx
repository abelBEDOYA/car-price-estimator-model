"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

const PNG = "/ryc_logo.png";
const SVG_FALLBACK = "/logo.svg";

type Props = {
  linkHome?: boolean;
  /** Ancho máximo en px (mantiene proporción del PNG). */
  maxWidth?: number;
  maxHeight?: number;
};

export function BrandLogo({ linkHome = false, maxWidth = 300, maxHeight = 100 }: Props) {
  const [src, setSrc] = useState(PNG);

  const onError = useCallback(() => {
    setSrc((s) => (s === PNG ? SVG_FALLBACK : s));
  }, []);

  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- PNG/SVG de marca en /public
    <img
      className="brand-logo"
      src={src}
      alt="RYC"
      width={maxWidth}
      height={maxHeight}
      decoding="async"
      fetchPriority="high"
      onError={onError}
      style={{
        maxWidth: `min(100%, ${maxWidth}px)`,
        maxHeight: `${maxHeight}px`,
        width: "auto",
        height: "auto",
        objectFit: "contain",
      }}
    />
  );

  return (
    <div className="brand-logo-wrap">
      {linkHome ? (
        <Link href="/" className="brand-logo-link">
          {img}
        </Link>
      ) : (
        img
      )}
    </div>
  );
}
