import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MOCK_CODE = "1111";

const COUNTRY_CODES = ["KZ", "RU", "UZ", "KG", "AE", "TR", "DE", "US"] as const;
const COUNTRY_DIALS: Record<string, string> = {
  KZ: "+7", RU: "+7", UZ: "+998", KG: "+996",
  AE: "+971", TR: "+90", DE: "+49", US: "+1",
};
const COUNTRY_FLAGS: Record<string, string> = {
  KZ: "🇰🇿", RU: "🇷🇺", UZ: "🇺🇿", KG: "🇰🇬",
  AE: "🇦🇪", TR: "🇹🇷", DE: "🇩🇪", US: "🇺🇸",
};

const DEFAULT_COUNTRY_CODE = "KZ";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function formatPhoneDisplay(digits: string): string {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`.trim();
}

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, register } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [countryCode, setCountryCode] = useState<string>(DEFAULT_COUNTRY_CODE);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

  const dial = COUNTRY_DIALS[countryCode] ?? "+7";
  const fullPhone = dial + digitsOnly(phoneDigits);

  if (isAuthenticated) {
    return <Navigate to="/control" replace />;
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneDigits(digitsOnly(e.target.value));
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (digitsOnly(phoneDigits).length < 7) {
      setError(t("errors.enterPhone"));
      return;
    }
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.trim() !== MOCK_CODE) {
      setError(t("errors.invalidSmsCode"));
      return;
    }
    setStep(3);
  };

  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nickname.trim()) {
      setError(t("errors.enterNickname"));
      return;
    }
    if (password.length < 6) {
      setError(t("errors.passwordMinLength"));
      return;
    }
    const result = register({
      phone: fullPhone,
      password,
      nickname: nickname.trim(),
    });
    if (!result.success) {
      setError(result.error ?? t("errors.registrationError"));
      return;
    }
    navigate("/control", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm"
      >
        <Card className="border border-border bg-card shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <CardHeader className="space-y-1 pb-4 pt-8 text-center">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              REFORMATOR BIO
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {t("auth.register")}
            </h1>
          </CardHeader>
          <CardContent className="pb-8">
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("auth.phone")}</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger
                        id="country"
                        className="w-[130px] shrink-0 border-border bg-background"
                      >
                        <SelectValue>
                          <span className="flex items-center gap-1.5">
                            <span className="text-base leading-none">{COUNTRY_FLAGS[countryCode]}</span>
                            <span className="text-foreground">{dial}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border-border bg-popover">
                        {COUNTRY_CODES.map((code) => (
                          <SelectItem
                            key={code}
                            value={code}
                            className="flex items-center gap-2 focus:bg-accent focus:text-accent-foreground"
                          >
                            <span className="text-base">{COUNTRY_FLAGS[code]}</span>
                            <span>{t(`countries.${code.toLowerCase()}`)}</span>
                            <span className="text-muted-foreground">{COUNTRY_DIALS[code]}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder={t("auth.placeholderPhoneShort")}
                      value={formatPhoneDisplay(phoneDigits)}
                      onChange={handlePhoneChange}
                      className="flex-1 border-border bg-background tabular-nums"
                      autoComplete="tel-national"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t("auth.hintPhone")}</p>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full">
                  {t("auth.confirm")}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">{t("auth.smsCode")}</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="1111"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="border-border bg-background text-center text-lg tracking-[0.5em] tabular-nums"
                    autoComplete="one-time-code"
                  />
                  <p className="text-[10px] text-muted-foreground">{t("auth.hintSmsCode")}</p>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full">
                  {t("common.continue")}
                </Button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleStep3} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">{t("auth.nickname")}</Label>
                  <Input
                    id="nickname"
                    type="text"
                    placeholder={t("auth.placeholderNickname")}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="border-border bg-background"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-border bg-background"
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <p className="text-[10px] text-muted-foreground">{t("auth.hintPassword")}</p>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full">
                  {t("auth.finishRegistration")}
                </Button>
              </form>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <Link to="/login" className="font-medium text-foreground underline hover:no-underline">
                {t("auth.signIn")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
