/**
 * types/index.ts — modelos de datos de la aplicación.
 */
export type Priority = "alta" | "media" | "baja";
export type ListName = "Personal" | "Trabajo" | "Casa";

export interface SubTask { t: string; d: boolean; }
export interface Task {
  id: number; title: string; list: ListName | string; prio: Priority;
  time: string; notes: string; done: boolean; featured: boolean;
  rem: boolean; subs: SubTask[];
}

export type CardBgMode = "color" | "gradient" | "template" | "image";
export type PayType = "min" | "custom";
export interface Card {
  id: number; name: string; bank?: string; alias?: string; last4?: string;
  limit?: number; balance?: number; apr?: number; cut?: number | string;
  pay?: number | string; min?: number; planned?: number; payType?: PayType;
  color?: string; grad?: string; tpl?: number; img?: string; bg?: CardBgMode;
  active?: boolean;
}

export type AccountType = "debito" | "ahorro" | "efectivo";
export interface Account { id: number; name: string; bank?: string; type: AccountType; balance?: number; alias?: string; accountNo?: string; clabe?: string; cardNo?: string; }

export type TxType = "gasto" | "ingreso";
export type TxMethod = "efectivo" | "debito" | "credito";
export interface Tx {
  id: number; type: TxType; amount: number; cat: string; note?: string;
  date: string; method: TxMethod; cardId?: number; acctId?: number;
}

export interface Sub { id: number; name: string; amount?: number; day?: number | string; active?: boolean; }
export interface Goal { id: number; name: string; target?: number; saved?: number; }
export interface Habit { id: number; n: string; g?: string; }

/** Perfil físico para MealPrep (ajustable a futuro). */
export interface FoodProfile {
  height: number;        // cm
  weight: number;        // kg
  activity: "none" | "light" | "moderate" | "high";
  goal: "recomp" | "muscle" | "deficit" | "maintain";
  waterTargetL: number;  // litros/día
  targetWeight?: number; // kg objetivo
}

export interface WeightEntry { date: string; kg: number; }
export interface Measurement { date: string; waist?: number; chest?: number; hip?: number; arm?: number; thigh?: number; notes?: string; }
export interface BodyPhoto { date: string; img: string; }
export interface PantryItem { id: number; item: string; cat: string; expires?: string; }
export interface Reminders { enabled?: boolean; desayuno?: string; comida?: string; cena?: string; groceryDay?: number; }

export interface AppState {
  theme: "light" | "dark";
  name?: string;
  accent?: string;
  cur: string;
  seq: number;
  tasks: Task[];
  mat: Record<string, boolean>;
  matProg: Record<string, number>;
  schedEdit: Record<string, Record<string, { t: string; a: string }>>;
  habits: Habit[]; habitSeq: number; habitLog: Record<string, Record<string, boolean>>;
  history: Record<string, boolean>;
  cards: Card[]; cardSeq: number;
  tx: Tx[]; txSeq: number;
  accounts: Account[]; accountSeq: number;
  subs: Sub[]; subSeq: number;
  goals: Goal[]; goalSeq: number;
  comidaCheck: Record<string, boolean>;
  // ---- MealPrep ----
  foodProfile?: FoodProfile;
  mealPlan?: Record<string, string>; // slot -> id de receta
  mealPlanWeek?: string;             // semana ISO del plan vigente
  mealPlanType?: string;             // variado | economica | proteina
  // ---- Seguimiento físico (MealPrep) ----
  weightLog?: WeightEntry[];
  measurements?: Measurement[];
  bodyPhotos?: BodyPhoto[];
  waterLog?: Record<string, number>; // dateKey -> litros registrados
  planLog?: Record<string, boolean>; // dateKey -> siguió el plan
  mealsLog?: Record<string, boolean>;// dateKey -> registró comidas
  // ---- Refri, recordatorios, revisión ----
  pantry?: PantryItem[]; pantrySeq?: number;
  reminders?: Reminders;
  review?: Record<string, boolean>;  // claveSemana::item -> hecho
  finPins?: string[];   // accesos de Finanzas fijados
  finHidden?: string[]; // accesos de Finanzas ocultos
  finOrder?: string[];  // orden personalizado de accesos
  mealState?: Record<string, { prep?: boolean; cons?: boolean }>; // semana-día-slot
}
