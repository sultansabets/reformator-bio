import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { Link } from "react-router-dom";
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryCode, setCountryCode] = useState<string>(DEFAULT_COUNTRY.code);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) ?? DEFAULT_COUNTRY;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneDigits(digitsOnly(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim()) {
      setError("Введите имя");
      return;
    }
    if (!lastName.trim()) {
      setError("Введите фамилию");
      return;
    }
    const digits = digitsOnly(phoneDigits);
    if (digits.length < 7) {
      setError("Введите номер телефона (минимум 7 цифр)");
      return;
    }
    if (password.length < 6) {
      setError("Пароль не менее 6 символов");
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    const fullPhone = selectedCountry.dial + digits;
    register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: fullPhone,
      email: email.trim() || undefined,
      password,
    });
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Иван"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border-border bg-background"
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Иванов"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border-border bg-background"
                  autoComplete="family-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger
                      id="country"
                      className="w-[130px] shrink-0 border-border bg-background transition-colors"
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
              <div className="space-y-2">
                <Label htmlFor="email">Электронная почта (необязательно)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@mail.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-border bg-background"
                  autoComplete="email"
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Повтор пароля</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-border bg-background"
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full transition-all duration-200 hover:opacity-90">
                Зарегистрироваться
              </Button>
            </form>
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
