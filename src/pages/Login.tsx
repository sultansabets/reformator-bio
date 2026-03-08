import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Navigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { requestCode } from "@/api/phoneAuthApi";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COUNTRY_CODES = ["KZ", "RU", "UZ", "KG", "AE", "TR", "DE", "US"] as const;
const COUNTRY_DIALS: Record<string, string> = {
  KZ: "+7", RU: "+7", UZ: "+998", KG: "+996",
  AE: "+971", TR: "+90", DE: "+49", US: "+1",
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

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, loginWithOtp } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [countryCode, setCountryCode] = useState<string>(DEFAULT_COUNTRY_CODE);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const dial = COUNTRY_DIALS[countryCode] ?? "+7";
  const fullPhone = dial + digitsOnly(phoneDigits);

  if (isAuthenticated) {
    return <Navigate to="/control" replace />;
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = digitsOnly(phoneDigits);
    if (digits.length < 7) {
      setError(t("errors.enterPhone"));
      return;
    }
    setSending(true);
    try {
      await requestCode(fullPhone);
      setStep(2);
      setCode("");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : t("errors.requestFailed");
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError(t("errors.invalidSmsCode"));
      return;
    }
    setVerifying(true);
    try {
      const result = await loginWithOtp(fullPhone, code);
      if (!result.success) {
        setError(result.error ?? t("errors.invalidSmsCode"));
        return;
      }
      navigate("/control", { replace: true });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : t("errors.invalidSmsCode");
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <Card className="border border-border bg-card shadow-[var(--shadow-card)]">
          <CardHeader className="space-y-1 pb-6 pt-8 text-center">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              REFORMATOR BIO
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {t("auth.login")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {step === 1 ? t("auth.step1Phone") : t("auth.step2Code")}
            </p>
          </CardHeader>
          <CardContent className="pb-8">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  onSubmit={handleSendCode}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">
                      {t("auth.phone")}
                    </Label>
                    <div className="flex gap-2">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="w-[100px] shrink-0 border-border bg-background">
                          <SelectValue placeholder="+7" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_CODES.map((cc) => (
                            <SelectItem key={cc} value={cc}>
                              {COUNTRY_DIALS[cc]} {cc}
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
                        onChange={(e) => setPhoneDigits(digitsOnly(e.target.value))}
                        className="flex-1 border-border bg-background"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full transition-all duration-200 hover:opacity-90"
                  >
                    {sending ? t("auth.sending") : t("auth.sendCode")}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  onSubmit={handleVerify}
                  className="space-y-4"
                >
                  <p className="text-sm text-muted-foreground">
                    {t("auth.codeSentTo")} {fullPhone}
                  </p>
                  <div className="space-y-2">
                    <Label className="text-foreground">{t("auth.smsCode")}</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={code}
                        onChange={setCode}
                        className="justify-center"
                      >
                        <InputOTPGroup className="gap-1">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <InputOTPSlot key={i} index={i} className="rounded-md" />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button
                    type="submit"
                    disabled={verifying || code.length !== 6}
                    className="w-full transition-all duration-200 hover:opacity-90"
                  >
                    {verifying ? t("auth.verifying") : t("auth.verify")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={handleBack}
                  >
                    {t("common.back")}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
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
