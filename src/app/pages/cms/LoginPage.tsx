import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAppData } from "../../store/data-store";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { LogIn } from "lucide-react";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAppData();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password, rememberMe)) {
      navigate("/cms");
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-full px-4">
      <div className="w-full max-w-[400px] p-8 border border-border rounded-[var(--radius-card)] bg-card">
        <div className="flex items-center gap-2 mb-6">
          <LogIn className="size-5 text-primary" />
          <h2 style={{ fontSize: "var(--text-h3)", fontWeight: "var(--font-weight-medium)" }}>
            CMS Login
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-card-foreground" style={{ fontSize: "var(--text-label)" }}>
              Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block mb-1.5 text-card-foreground" style={{ fontSize: "var(--text-label)" }}>
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <label
              htmlFor="remember-me"
              className="text-card-foreground cursor-pointer select-none"
              style={{ fontSize: "var(--text-label)" }}
            >
              Keep me signed in for 7 days
            </label>
          </div>

          {error && (
            <p className="text-destructive" style={{ fontSize: "var(--text-label)" }}>
              {error}
            </p>
          )}

          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}