import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";

export function WaiterApp() {
  return <RouterProvider router={router} />;
}
