import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <BrandLogo />
        <h1>Estimación inteligente del precio de tu coche</h1>
        <p className="muted" style={{ maxWidth: "52ch" }}>
          Introduce marca, modelo, combustible, cambio, kilómetros, año, potencia y fecha de
          publicación (como año decimal, coherente con la API). Obtén el precio puntual y
          curvas según año de matriculación, fecha de publicación y kilómetros.
        </p>
        <nav className="nav-pill" aria-label="Principal">
          <span className="nav-pill-current" aria-current="page">
            Inicio
          </span>
          <Link href="/simulator">Simulador</Link>
        </nav>
      </section>
      <SiteFooter />
    </main>
  );
}
