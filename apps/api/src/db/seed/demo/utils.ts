import { createHash } from "node:crypto";
import type { DemoPreset } from "./types";

export const DEMO_EMAIL = "demo@servora.local";
export const DEMO_PASSWORD = "ServoraDemo@2026";
export const DEMO_ORG_NAME = "Servora Demo Group";

export const uuidFor = (key: string): string => {
  const hex = createHash("sha256").update(`servora-demo:${key}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

export const seededNumber = (key: string): number => {
  const value = createHash("sha256").update(key).digest().readUInt32BE(0);
  return value / 0xffffffff;
};

export const pick = <T>(items: readonly T[], key: string): T => items[Math.floor(seededNumber(key) * items.length)]!;
export const money = (value: number): string => value.toFixed(2);
export const qty = (value: number): string => value.toFixed(3);

export const parsePreset = (argv: string[]): DemoPreset => {
  const raw = argv.find((arg) => arg.startsWith("--preset="))?.split("=")[1] ?? "demo";
  if (raw !== "small" && raw !== "demo" && raw !== "stress") throw new Error(`Unknown demo preset: ${raw}`);
  return raw;
};

export async function insertBatches<T>(rows: T[], batchSize: number, insert: (batch: T[]) => Promise<unknown>): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) await insert(rows.slice(i, i + batchSize));
}
