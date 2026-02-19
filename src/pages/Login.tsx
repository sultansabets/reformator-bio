import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = login(loginId, password);
    if (!result.success) {
      setError(result.error ?? t("errors.invalidLogin"));
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        <Card className="border border-border bg-card shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <CardHeader className="space-y-1 pb-6 pt-8 text-center">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              REFORMATOR BIO
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {t("auth.login")}
            </h1>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginId" className="text-foreground">
                  {t("auth.phoneOrEmail")}
                </Label>
                <Input
                  id="loginId"
                  type="text"
                  placeholder={t("auth.placeholderPhone")}
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="border-border bg-background transition-colors"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  {t("auth.password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-border bg-background transition-colors"
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full transition-all duration-200 hover:opacity-90"
              >
                {t("auth.signIn")}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="font-medium text-foreground underline hover:no-underline">
                {t("auth.register")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
