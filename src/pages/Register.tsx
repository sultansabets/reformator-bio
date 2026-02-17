import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const COUNTRIES = [
  { code: "KZ", name: "Казахстан", dial: "+7", flag: "🇰🇿" },
  { code: "RU", name: "Россия", dial: "+7", flag: "🇷🇺" },
  { code: "UZ", name: "Узбекистан", dial: "+998", flag: "🇺🇿" },
  { code: "KG", name: "Киргизия", dial: "+996", flag: "🇰🇬" },
  { code: "AE", name: "ОАЭ", dial: "+971", flag: "🇦🇪" },
  { code: "TR", name: "Турция", dial: "+90", flag: "🇹🇷" },
  { code: "DE", name: "Германия", dial: "+49", flag: "🇩🇪" },
  { code: "US", name: "США", dial: "+1", flag: "🇺🇸" },
] as const;

const DEFAULT_COUNTRY = COUNTRIES[0];

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function formatPhoneDisplay(digits: string): string {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`.trim();
}

const Register = () => {
  const navigate = useNavigate();
  const { isAuthenticated, register } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [countryCode, setCountryCode] = useState<string>(DEFAULT_COUNTRY.code);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) ?? DEFAULT_COUNTRY;
  const fullPhone = selectedCountry.dial + digitsOnly(phoneDigits);

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
      setError("Введите номер телефона (минимум 7 цифр)");
      return;
    }
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.trim() !== MOCK_CODE) {
      setError("Неверный код. Введите 1111 для демо.");
      return;
    }
    setStep(3);
  };

  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nickname.trim()) {
      setError("Введите никнейм");
      return;
    }
    if (password.length < 6) {
      setError("Пароль не менее 6 символов");
      return;
    }
    register({
      phone: fullPhone,
      password,
      nickname: nickname.trim(),
    });
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
              Регистрация
            </h1>
          </CardHeader>
          <CardContent className="pb-8">
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Номер телефона</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger
                        id="country"
                        className="w-[130px] shrink-0 border-border bg-background"
                      >
                        <SelectValue>
                          <span className="flex items-center gap-1.5">
                            <span className="text-base leading-none">{selectedCountry.flag}</span>
                            <span className="text-foreground">{selectedCountry.dial}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border-border bg-popover">
                        {COUNTRIES.map((c) => (
                          <SelectItem
                            key={c.code}
                            value={c.code}
                            className="flex items-center gap-2 focus:bg-accent focus:text-accent-foreground"
                          >
                            <span className="text-base">{c.flag}</span>
                            <span>{c.name}</span>
                            <span className="text-muted-foreground">{c.dial}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="701 123 45 67"
                      value={formatPhoneDisplay(phoneDigits)}
                      onChange={handlePhoneChange}
                      className="flex-1 border-border bg-background tabular-nums"
                      autoComplete="tel-national"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Минимум 7 цифр после кода страны</p>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full">
                  Подтвердить
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Код из SMS</Label>
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
                  <p className="text-[10px] text-muted-foreground">Для демо введите 1111</p>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full">
                  Продолжить
                </Button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleStep3} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">Никнейм</Label>
                  <Input
                    id="nickname"
                    type="text"
                    placeholder="Как к вам обращаться"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="border-border bg-background"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-border bg-background"
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <p className="text-[10px] text-muted-foreground">Не менее 6 символов</p>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full">
                  Завершить регистрацию
                </Button>
              </form>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link to="/login" className="font-medium text-foreground underline hover:no-underline">
                Войти
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
