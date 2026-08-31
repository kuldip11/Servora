import { describe, expect, it, vi } from "vitest";
import type { DomainHttpClient } from "../shared";
import { createOrdersApi } from "../orders";
import { createInventoryApi } from "../inventory";
import { createMenuApi } from "../menu";
import { createCustomersApi } from "../customers";

const createMockClient = (): DomainHttpClient => {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  } as unknown as DomainHttpClient;
};

function response<T>(data: T) {
  return Promise.resolve({ data: { success: true, data } });
}

describe("domain API clients", () => {
  it("binds order list filters and unwraps the response envelope", async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(
      response([{ id: "order-1" }]) as ReturnType<typeof client.get>,
    );

    const result = await createOrdersApi(client).list({
      status: "OPEN",
      type: "DINE_IN",
    });

    expect(client.get).toHaveBeenCalledWith("/orders", {
      params: { status: "OPEN", type: "DINE_IN" },
    });
    expect(result).toEqual([{ id: "order-1" }]);
  });

  it("uses inventory endpoints through the typed client", async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(
      response([]) as ReturnType<typeof client.get>,
    );

    await createInventoryApi(client).list();

    expect(client.get).toHaveBeenCalledWith("/inventory/items", undefined);
  });

  it("creates menu categories through the typed client", async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockReturnValue(
      response({ id: "category-1", name: "Dinner" }) as ReturnType<
        typeof client.post
      >,
    );

    const result = await createMenuApi(client).createCategory("Dinner");

    expect(client.post).toHaveBeenCalledWith(
      "/menu/categories",
      { name: "Dinner" },
      undefined,
    );
    expect(result).toMatchObject({ id: "category-1", name: "Dinner" });
  });

  it("loads customers through the typed client", async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(
      response([]) as ReturnType<typeof client.get>,
    );

    await createCustomersApi(client).list();

    expect(client.get).toHaveBeenCalledWith("/loyalty/customers", undefined);
  });
});
