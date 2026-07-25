import { Link, Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const KNOWN_ROUTES = [
  "/dashboard",
  "/transactions",
  "/insights",
  "/analysis",
  "/savings",
  "/profile",
  "/auth",
];

const ALIASES: Record<string, string> = {
  "": "/dashboard",
  "/": "/dashboard",
  "/index": "/dashboard",
  "/index.html": "/dashboard",
  "/home": "/dashboard",
  "/accueil": "/dashboard",
  "/login": "/auth",
  "/signin": "/auth",
  "/connexion": "/auth",
  "/signup": "/auth",
  "/inscription": "/auth",
  "/epargne": "/savings",
  "/analyse": "/analysis",
  "/conseils": "/insights",
  "/profil": "/profile",
};

const NotFound = () => {
  const location = useLocation();

  // Normalise le chemin : minuscules, sans slash final, sans query/hash
  const normalized = location.pathname.toLowerCase().replace(/\/+$/, "");

  const target = ALIASES[normalized] ?? KNOWN_ROUTES.find((r) => r === normalized);

  if (target) {
    return <Navigate to={target} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <h1 className="mb-3 text-5xl font-bold gradient-primary bg-clip-text text-transparent">
          404
        </h1>
        <p className="mb-2 text-xl font-semibold text-foreground">Page introuvable</p>
        <p className="mb-6 text-sm text-muted-foreground">
          La page <span className="font-mono">{location.pathname}</span> n'existe pas.
        </p>
        <Button asChild>
          <Link to="/dashboard">Retour au tableau de bord</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
