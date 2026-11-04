import Link from "next/link";
import { Logo } from "@/components/Navbar";
import { SearchIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="container section" style={{ textAlign: "center", paddingTop: 110, paddingBottom: 110 }}>
      <div className="row" style={{ justifyContent: "center", gap: 10, marginBottom: 12 }}>
        <Logo size={40} />
      </div>
      <div style={{ fontSize: 64, fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1, color: "var(--brand)" }}>404</div>
      <h1 className="title-md" style={{ marginTop: 10 }}>Page introuvable</h1>
      <p className="muted" style={{ maxWidth: 420, margin: "0 auto 22px" }}>
        Cette planche n'existe pas (encore). Retournez au catalogue pour trouver votre prochaine saga.
      </p>
      <div className="row" style={{ justifyContent: "center", gap: 10 }}>
        <Link href="/" className="btn btn-ghost">Accueil</Link>
        <Link href="/catalog" className="btn btn-primary"><SearchIcon size={16} /> Catalogue</Link>
      </div>
    </div>
  );
}
