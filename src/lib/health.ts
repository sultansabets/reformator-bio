/** BMI = weight (kg) / (height (m))^2 */
export function calcBmi(weightKg: number, heightCm: number): number | null {
  if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export type BmiCategory = "underweight" | "normal" | "overweight" | "obesity";

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "underweight";
  if (bmi <= 24.9) return "normal";
  if (bmi <= 29.9) return "overweight";
  return "obesity";
}

export const BMI_CATEGORY_LABELS: Record<BmiCategory, string> = {
  underweight: "Недостаточный вес",
  normal: "Норма",
  overweight: "Избыточный вес",
  obesity: "Ожирение",
};

/** Base maintenance kcal (simplified: 25 kcal per kg for rough estimate). Returns null if missing data. */
export function getRecommendedKcalBase(weightKg: number): number | null {
  if (!weightKg || weightKg <= 0) return null;
  return Math.round(weightKg * 25);
}

/** Recommended daily kcal based on BMI: <18.5 +300, 18.5-24.9 maintenance, >25 -300 */
export function getRecommendedKcal(
  weightKg: number,
  heightCm: number
): { target: number; surplus: number; label: string } | null {
  const bmi = calcBmi(weightKg, heightCm);
  if (bmi == null || !weightKg) return null;
  const base = getRecommendedKcalBase(weightKg);
  if (base == null) return null;
  if (bmi < 18.5) {
    return { target: base + 300, surplus: 300, label: "Рекомендуется набор массы (+300 ккал)" };
  }
  if (bmi <= 24.9) {
    return { target: base, surplus: 0, label: "Поддержание веса" };
  }
  return { target: Math.max(1200, base - 300), surplus: -300, label: "Рекомендуется дефицит (-300 ккал)" };
}

export type NutritionGoal = "gain" | "maintain" | "lose";

export const NUTRITION_GOAL_LABELS: Record<NutritionGoal, string> = {
  gain: "Набор массы",
  maintain: "Поддержание",
  lose: "Похудение",
};

/** Protein g/kg, Fat g/kg; carbs from remaining kcal (4 kcal/g) */
export function getMacros(
  goal: NutritionGoal,
  weightKg: number,
  dailyKcal: number
): { protein: number; fat: number; carbs: number } | null {
  if (!weightKg || weightKg <= 0 || dailyKcal <= 0) return null;
  let proteinPerKg: number;
  let fatPerKg: number;
  if (goal === "gain") {
    proteinPerKg = 2;
    fatPerKg = 1;
  } else if (goal === "lose") {
    proteinPerKg = 1.8;
    fatPerKg = 0.8;
  } else {
    proteinPerKg = 1.6;
    fatPerKg = 1;
  }
  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round(weightKg * fatPerKg);
  const proteinKcal = protein * 4;
  const fatKcal = fat * 9;
  const carbsKcal = Math.max(0, dailyKcal - proteinKcal - fatKcal);
  const carbs = Math.round(carbsKcal / 4);
  return { protein, fat, carbs };
}
