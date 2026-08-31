import { describe, expect, it } from "vitest";
import * as mod from "@/modules/menu/categories/category.errors";

describe("category.errors error factories", () => {
  it("exports callable error factories with stable AppError-shaped results", () => {
    const factories = Object.entries(mod).filter(
      ([, v]) => typeof v === "function",
    );
    expect(factories.length).toBeGreaterThan(0);
    for (const [, factory] of factories) {
      const args = Array.from(
        { length: Math.min((factory as Function).length, 1) },
        () => "id",
      );
      const result = (factory as any)(...args);
      expect(result).toBeInstanceOf(Error);
      expect(result).toHaveProperty("code");
      expect(result).toHaveProperty("message");
    }
  });
});
