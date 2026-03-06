# Техническое задание Backend — Reformator Bio

**Версия:** 1.0  
**Дата:** 23.02.2026  
**Статус:** Анализ и проектирование (код не пишем)

---

## 1. Общая архитектура приложения

### 1.1. Текущий стек фронтенда

- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **State:** Zustand (healthStore, dateStore, subscriptionStore)
- **Routing:** React Router
- **HTTP:** @tanstack/react-query (подготовлен, но API не используются)
- **3D:** react-three-fiber + three
- **Hosting:** Vercel (SSR/Edge: API routes)

### 1.2. Модули приложения

| Модуль | Назначение | Данные |
|--------|------------|--------|
| **Auth** | Регистрация, вход, профиль | localStorage `reformator_users` |
| **ControlCenter** | Главная: орб состояния, сон, нагрузка, дата | healthStore, dateStore |
| **Center** | Питание + Спорт (журналы) | localStorage per user |
| **AI** | Doctor AI — чат-ассистент | in-memory (нет персистенции) |
| **Labs** | Анализы крови | localStorage `user_{id}_labs` |
| **Insights / LabInsights** | Инсайты по данным | производные от healthStore |
| **Medical** | Медкарта (Notion) | API `/api/medical-card`, mock |
| **Profile** | Профиль, настройки | userStorage, medications |
| **Notifications** | Уведомления | localStorage |
| **Subscription** | Подписки Pro / Pro+ | zustand persist `reformator-subscription` |
| **SmartWake** | Будильник | localStorage |

### 1.3. Как связаны модули

```
Auth (user.id)
    └── HealthStoreHydrator: hydrate(userId, profile)
    └── Center: load/save nutrition, workouts (user_{id}_*)
    └── healthDataSync: read nutrition_v2, workout_history, labs
    └── dateStore: selectedDate для навигации по датам

healthStore (Zustand, in-memory)
    └── Raw: sleepHours, sleepQuality, hrv, heartRate, steps,
              caloriesIntake, protein, carbs, fats, workouts, nutritionHistory, etc.
    └── Computed: sleepScore, loadPercent, mainStateScore, stress, etc.
    └── recompute() вызывается при изменении raw

ControlCenter
    └── hydrateForDate(userId, profile, selectedDate)
    └── Отображает: mainStateScore, sleepPercent, loadPercent, stress, testosterone
```

---

## 2. Список всех функций приложения

| # | Функция | Описание |
|---|---------|----------|
| 1 | **Метрика «Состояние»** | Главная метрика 0–100 (орб), формула: Sleep + Load |
| 2 | **Сон** | SleepScore, фазы, длительность, качество |
| 3 | **Нагрузка** | LoadPercent, BodyLoad, NeuroLoad (тренировки + шаги + стресс) |
| 4 | **Питание** | Ккал, БЖУ, journal (продукты), targetCalories/targetProtein |
| 5 | **Тренировки** | Workout history, program, calendar, exercises |
| 6 | **Медкарта** | Notion API / mock: анализы, УЗИ, заключения врачей |
| 7 | **Анализы (Labs)** | testosterone, cortisol, vitaminD, hemoglobin, др. |
| 8 | **AI (Doctor AI)** | Чаты, промпты (локальные ответы, не LLM) |
| 9 | **Подписки** | free / pro / pro_plus, expiresAt |
| 10 | **Устройства** | Apple Watch, Reformator Band (только UI, нет синка) |
| 11 | **Уведомления** | Список, read/unread |
| 12 | **SmartWake** | Время пробуждения |

---

## 3. Детальное описание функций и данных

### 3.1. Метрика «Состояние» (mainStateScore)

**Используемые данные:**
- sleepPercent (из sleepEngine)
- loadPercent (из loadEngine)

**Формула (healthEngine.calculateEnergy):**
```
stateScore = (recoveryFactor * 0.6 + stressFactor * 0.4) * 100
recoveryFactor = sleep / 100
stressFactor = 1 - load / 100
```

**Должны храниться в БД:**
- Рассчитанное значение mainStateScore по дате
- Исходные sleepPercent, loadPercent

**Raw / Derived:**
- sleepPercent, loadPercent — DERIVED
- mainStateScore — DERIVED

---

### 3.2. Сон

**Используемые данные:**
- sleepHours, sleepQuality, hrv, heartRate (сырые)
- SleepEngine: actualSleepMinutes, awakenings, deepPercent, remPercent, baselineHRV, baselineNightHR

**Сейчас:** Частично mock (sleepHours=7.5, sleepQuality=80, hrv=45, heartRate=62, steps=6500). Фазы рассчитываются из quality.

**Должны храниться:**
- Сырые: actualSleepMinutes, sleepQuality, awakenings, deepPercent, remPercent, nightHR, nightHRV
- Baseline: personalOptimalSleepMinutes, baselineHRV, baselineNightHR

**С устройств (будущее):**
- Apple Health / Fitbit / Oura / Reformator Band: стадии сна, HR, HRV

---

### 3.3. Нагрузка

**Используемые данные:**
- workouts (date, type, durationSec, caloriesBurned, bodyParts)
- steps
- stress (из healthEngine)
- totalSleepMinutes, hrv

**LoadEngine:**
- strengthLoad, cardioLoad, stepsLoad, stressLoad, sleepDebtLoad, hrvLoad
- bodyLoad, neuroLoad, totalLoad

**Должны храниться:**
- workouts (RAW)
- steps (RAW)
- loadPercent, totalLoad (DERIVED)

---

### 3.4. Питание

**Используемые данные:**
- FoodEntry: product_id, name, grams, calories, protein, carbs, fats, timestamp
- DayData: { entries: FoodEntry[] } по дате
- targetCalories, targetProtein (из профиля / health)

**Storage keys:** `user_{id}_nutrition_v2_{date}`, fallback `user_{id}_nutrition`

**Должны храниться:**
- FoodEntry (RAW)
- nutritionHistory (агрегат по дате) — можно DERIVED

---

### 3.5. Тренировки

**Используемые данные:**
- WorkoutHistoryEntry: date, type, durationSec, caloriesBurned, startedAt, bodyParts
- WorkoutLog: id, date, type, exercises, feeling, notes, status

**Storage keys:** `user_{id}_workout_history`, `user_{id}_workout_log`, `user_{id}_workout_plan`

**Должны храниться:**
- WorkoutHistoryEntry (RAW)
- WorkoutLog (RAW)
- WeekPlan / WorkoutDay (если сохраняется)

---

### 3.6. Медкарта

**Источники:**
- API `/api/medical-card`: Notion (page + blocks)
- Mock: `medicalSections` из `medicalMock.ts`

**Данные:** patient (name, phone, birthDate, admissionDate, checkup, status), sections (id, title, type)

**С API Notion:** блоки child_page, тип по заголовку (анализы, УЗИ, ЭКГ, врачи).

**Должны храниться в БД:**
- Ссылки на разделы, контент (или ссылки на файлы)
- Связь user ↔ medical_card (один пациент на пользователя?)

---

### 3.7. Анализы (Labs)

**Используемые данные:**
- LabEntry: date, testosterone, cortisol?, vitaminD?, hemoglobin?, other?

**Storage key:** `user_{id}_labs` (через getStorageKey)

**Расчёт:** getLatestLab, testosteroneToScore (nmol/L), getTestosteroneStatus

**Должны храниться:**
- LabEntry (RAW)

---

### 3.8. AI

**Сейчас:**
- Промпты из i18n: recovery, testosterone, cortisol, energy, labs, overtrain
- Ответы — захардкожены в i18n
- Подписка: isProOrHigher() для доступа
- Сообщения — in-memory, не сохраняются

**Должны храниться (для реального AI):**
- History сообщений (user, assistant)
- Контекст (данные пользователя для промпта)

---

### 3.9. Подписки

**Текущая логика:**
- plan: "free" | "pro" | "pro_plus"
- expiresAt: timestamp | null
- isProOrHigher(), isPremium()

**Storage:** zustand persist `reformator-subscription`

**Должны храниться в БД:**
- userId, plan, expiresAt, stripePaymentId (или аналог)

---

### 3.10. Устройства

**Сейчас:**
- DevicesPopover: Apple Watch, Reformator Band
- Статус: user.wearable === "apple" | "reformator-band"
- Нет синка с реальными устройствами

**Должны храниться:**
- deviceId, type, userId, lastSyncAt, battery, token/credentials

---

## 4. Типы данных для backend

### 4.1. Пользователь (User)

```ts
{
  id: string;
  phone: string;
  email?: string;
  passwordHash: string;
  nickname: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  dob?: string;
  activityLevel?: string;
  wearable?: string;
  height?: number;
  weight?: number;
  goal?: "gain" | "maintain" | "lose";
  createdAt: number;
  updatedAt: number;
}
```

### 4.2. Устройства (Device)

```ts
{
  id: string;
  userId: string;
  type: "apple" | "reformator-band";
  name: string;
  lastSyncAt?: number;
  battery?: number;
  token?: string; // для OAuth / API
}
```

### 4.3. Сырые данные с браслетов (RawDeviceData)

```ts
{
  id: string;
  userId: string;
  deviceId: string;
  date: string; // YYYY-MM-DD
  sleepMinutes?: number;
  sleepQuality?: number;
  hrv?: number;
  heartRate?: number;
  steps?: number;
  rawJson?: object; // сырой payload
  createdAt: number;
}
```

### 4.4. Рассчитанные метрики (DailyMetrics)

```ts
{
  id: string;
  userId: string;
  date: string;
  mainStateScore: number;
  sleepScore: number;
  loadPercent: number;
  stress: number;
  hrvScore?: number;
  testosteroneScore?: number;
  // ...
  computedAt: number;
}
```

### 4.5. Медицинские данные

```ts
// Labs
{
  id: string;
  userId: string;
  date: string;
  testosterone?: number;
  cortisol?: number;
  vitaminD?: number;
  hemoglobin?: number;
  other?: Record<string, number>;
}

// MedicalCard (связь с Notion или собственная структура)
{
  userId: string;
  notionPageId?: string;
  sections: { id: string; title: string; type: string; content?: object }[];
}
```

### 4.6. Тренировки (Workout)

```ts
{
  id: string;
  userId: string;
  date: string;
  type: string;
  durationSec: number;
  caloriesBurned: number;
  startedAt?: number;
  bodyParts?: string[];
}
```

### 4.7. Питание (NutritionEntry)

```ts
{
  id: string;
  userId: string;
  date: string;
  productId?: string;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timestamp: number;
}
```

### 4.8. Подписки (Subscription)

```ts
{
  userId: string;
  plan: "free" | "pro" | "pro_plus";
  expiresAt: number | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}
```

### 4.9. AI запросы (если нужна история)

```ts
{
  id: string;
  userId: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
  conversationId?: string;
}
```

---

## 5. Структура базы данных (предложение)

### Таблицы

| Таблица | Ключевые поля | Связи |
|---------|---------------|-------|
| users | id, phone, email, passwordHash, nickname, ... | — |
| devices | id, userId, type, token | users |
| raw_device_data | id, userId, deviceId, date, sleepMinutes, hrv, steps, ... | users, devices |
| daily_metrics | id, userId, date, mainStateScore, sleepScore, loadPercent | users |
| nutrition_entries | id, userId, date, productId, name, grams, calories, protein, carbs, fats | users |
| workouts | id, userId, date, type, durationSec, caloriesBurned | users |
| lab_entries | id, userId, date, testosterone, cortisol, ... | users |
| medical_cards | userId, notionPageId, sections | users |
| subscriptions | userId, plan, expiresAt | users |
| ai_conversations | id, userId, conversationId | users |
| ai_messages | id, conversationId, role, text | ai_conversations |
| notifications | id, userId, type, title, message, read | users |

### Схема связей

```
users
  ├── devices (1:N)
  ├── raw_device_data (1:N)
  ├── daily_metrics (1:N, по date)
  ├── nutrition_entries (1:N)
  ├── workouts (1:N)
  ├── lab_entries (1:N)
  ├── medical_cards (1:1)
  ├── subscriptions (1:1)
  ├── ai_conversations (1:N)
  └── notifications (1:N)
```

---

## 6. RAW vs DERIVED

| Данные | Тип | Источник |
|--------|-----|----------|
| sleepHours, sleepQuality, hrv, heartRate, steps | RAW | Устройство / ручной ввод |
| workouts, nutrition_entries, lab_entries | RAW | Пользователь / импорт |
| sleepScore, loadPercent, mainStateScore, stress | DERIVED | healthEngine, sleepEngine, loadEngine |
| daily_metrics | DERIVED | Пересчёт по raw |

---

## 7. API эндпоинты

### 7.1. Аутентификация

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/users/me` — обновление профиля

### 7.2. Данные с устройства

- `POST /api/device/sync` — загрузка сырых данных (sleep, hrv, steps, hr)

### 7.3. Метрики

- `GET /api/metrics?date=YYYY-MM-DD` — метрики за дату
- `GET /api/metrics/range?from=&to=` — история за период

### 7.4. Питание

- `GET /api/nutrition?date=`
- `POST /api/nutrition` — добавить запись
- `DELETE /api/nutrition/:id`

### 7.5. Тренировки

- `GET /api/workouts?date=`
- `POST /api/workouts`
- `PATCH /api/workouts/:id`
- `DELETE /api/workouts/:id`

### 7.6. Медкарта

- `GET /api/medical-card` — данные (Notion или БД)

### 7.7. Анализы

- `GET /api/labs`
- `POST /api/labs`

### 7.8. AI

- `POST /api/ai/chat` — отправка сообщения, получение ответа

### 7.9. Подписки

- `GET /api/subscription`
- `POST /api/subscription/checkout` — создание сессии Stripe (или аналог)

---

## 8. Синхронные vs асинхронные процессы

| Операция | Тип | Комментарий |
|----------|-----|-------------|
| Login, Register | Синхронный | Быстрый ответ |
| Получение метрик за дату | Синхронный | Чтение из БД |
| Добавление nutrition/workout | Синхронный | Запись + пересчёт метрик |
| Загрузка данных с устройства | Синхронный (или очередь) | Может быть тяжёлой |
| Пересчёт daily_metrics | Асинхронный (worker) | При изменении raw |
| AI chat | Асинхронный (streaming) | Вызов LLM |
| Notion sync | Асинхронный | Периодическая синхронизация |

---

## 9. Алгоритм расчёта «Состояния»

### 9.1. Формула

```text
mainStateScore = (recoveryFactor * 0.6 + stressFactor * 0.4) * 100
recoveryFactor = sleepPercent / 100
stressFactor = 1 - loadPercent / 100
```

### 9.2. Входные данные

- **sleepPercent** — из SleepEngine (0–100)
- **loadPercent** — из LoadEngine (0–100)

### 9.3. sleepPercent

Источник: `calculateSleepFromBlocks` (sleepEngine).

Блоки: duration (35%), continuity (25%), deep (20%), rem (10%), hrv (10%).

Маппинг упрощённый (mapHealthToSleepInput): из sleepHours, sleepQuality, hrv, heartRate.

### 9.4. loadPercent

Формула (healthEngine.calculateLoadPercent):

```text
activeKcal = sum(workouts.caloriesBurned)
stepsPart = min(steps/10000, 1) * 50
kcalPart = min(activeKcal/400, 1) * 50
loadPercent = kcalPart + stepsPart
```

### 9.5. Baseline пользователя

Сейчас baseline не хранится явно. В sleepEngine:

- personalOptimalSleepMinutes (по умолчанию 480)
- baselineHRV, baselineNightHR — можно брать из средней по истории

**Для backend:** хранить baseline в users или отдельной таблице user_baselines:

```ts
{
  userId: string;
  optimalSleepMinutes: number;
  baselineHRV?: number;
  baselineNightHR?: number;
  targetCalories?: number;
  targetProtein?: number;
}
```

---

## 10. Минимальная архитектура backend для MVP

### 10.1. Стек технологий

- **Runtime:** Node.js 20
- **Framework:** Express / Fastify / Hono (лёгкий для Vercel)
- **БД:** PostgreSQL (Vercel Postgres / Supabase / Neon)
- **ORM:** Prisma / Drizzle
- **Auth:** JWT + bcrypt
- **Деплой:** Vercel Serverless Functions

### 10.2. Структура сервиса

```
api/
  auth/
    login.ts
    register.ts
    me.ts
  metrics/
    index.ts          # GET ?date=
  nutrition/
    index.ts
    [id].ts
  workouts/
    index.ts
    [id].ts
  labs/
    index.ts
  medical-card.ts
  subscription/
    index.ts
lib/
  db.ts
  auth.ts
  healthEngine.ts     # перенос формул
  sleepEngine.ts
  loadEngine.ts
prisma/
  schema.prisma
```

### 10.3. Компоненты MVP

1. **Auth** — регистрация, логин, JWT
2. **Users** — CRUD профиля
3. **Nutrition** — CRUD за день
4. **Workouts** — CRUD
5. **Labs** — CRUD
6. **Metrics** — GET по дате (расчёт на лету из raw или кэш daily_metrics)
7. **Medical** — прокси к Notion или замена на БД
8. **Subscription** — чтение статуса (покупка — через Stripe позже)

---

## 11. Архитектурная схема

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  AuthContext │ healthStore │ dateStore │ subscriptionStore       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST / Fetch
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API (Vercel Serverless)                       │
│  /api/auth/* │ /api/metrics │ /api/nutrition │ /api/workouts     │
│  /api/labs │ /api/medical-card │ /api/subscription               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │   Notion     │  │   Stripe     │
│  (users,     │  │   (медкарта) │  │ (подписки)   │
│   raw,       │  │              │  │              │
│   derived)   │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 12. Предложение структуры проекта backend

```
reformator-bio/
├── api/                    # Vercel Serverless (уже есть)
│   ├── auth/
│   │   ├── login.ts
│   │   ├── register.ts
│   │   └── me.ts
│   ├── metrics/
│   │   └── index.ts
│   ├── nutrition/
│   │   └── index.ts
│   ├── workouts/
│   │   └── index.ts
│   ├── labs/
│   │   └── index.ts
│   ├── medical-card.ts
│   └── subscription/
│       └── index.ts
├── prisma/
│   └── schema.prisma
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── healthEngine.ts     # порт из src/engine
│   ├── sleepEngine.ts
│   └── loadEngine.ts
├── package.json
└── vercel.json
```

---

## 13. Итоговый чеклист

- [ ] Выбрать БД (Postgres)
- [ ] Настроить Prisma schema
- [ ] Реализовать Auth (register, login, JWT)
- [ ] Перенести формулы healthEngine, sleepEngine, loadEngine
- [ ] API nutrition, workouts, labs
- [ ] API metrics (расчёт или кэш)
- [ ] Интеграция medical-card (Notion или БД)
- [ ] Subscription status API
- [ ] Миграция данных из localStorage (опционально)

---

*Документ подготовлен на основе анализа кодовой базы Reformator Bio. Код backend не написан — только спецификация.*
