import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.hoisted(() => vi.fn());
vi.mock("../../../../shared/lib/api-client", () => ({ apiClient: { get } }));

import { menuAllergensService } from "../menu-allergens.service";

describe("menuAllergensService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns allergen data from the API envelope", async () => {
    const allergens = [{ id: "a1", name: "Peanuts" }];
    get.mockResolvedValue({ data: { data: allergens } });
    await expect(menuAllergensService.list()).resolves.toEqual(allergens);
    expect(get).toHaveBeenCalledWith("/menu/allergens");
  });
});
