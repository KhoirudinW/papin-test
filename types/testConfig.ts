import { ReactNode } from "react";
import { ShareCardData } from "@/components/ShareResultCard";

export type StandardScoreBar = {
  label: string;
  percentage: number; // 0-100
  valueText?: string; // e.g., "10 Poin" or "Tinggi (3.5/5)"
  colorClass?: string; // Optional tailwind color class
};

export type StandardTestSection = {
  type: "list" | "text" | "tags";
  title: string;
  icon: "check" | "alert" | "heart" | "info" | "star";
  items?: string[]; // For list or tags
  text?: string | ReactNode; // For text
  bgColorClass?: string; // Optional tailwind background
};

export type StandardTestResult = {
  title: string;
  primaryResult: string;
  description: string;
  scoreBars: StandardScoreBar[];
  sections: StandardTestSection[];
  tags?: string[]; // E.g. "Words of Affirmation", "Quality Time"
};

export type TestConfig<TVariant extends string, TAnswers = Record<number, number>> = {
  testSlug: string; // Used for DB and routing identifying the test category
  storageKey: string; // Used for saving ongoing progress in localStorage
  variants: TVariant[]; // e.g. ["lite", "pro"]

  getVariantMeta: (variant: TVariant) => {
    label: string;
    purpose: string;
    questionCount: number;
  };

  getQuestions: (variant: TVariant) => Array<{
    id: number;
    text: string;
    leftLabel?: string;
    rightLabel?: string;
  }>;

  getScaleOptions: (variant: TVariant) => number[];

  calculateResult: (answers: TAnswers, variant: TVariant) => StandardTestResult;

  getShareData: (result: StandardTestResult, variant: TVariant) => ShareCardData | null;

  getSyncPayload: (result: StandardTestResult, answers: TAnswers, variant: TVariant) => any;
};
