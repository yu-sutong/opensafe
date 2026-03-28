import { Shield, User } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-2.5">
        <Shield className="h-6 w-6 text-primary" fill="hsl(var(--primary))" />
        <span className="text-lg font-semibold tracking-tight text-foreground">
          OpenSafe
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-pulse-dot" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          <span>Proxy Online: Port 3000</span>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
