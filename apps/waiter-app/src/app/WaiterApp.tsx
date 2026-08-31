import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";

export const WaiterApp = () => {
  return <RouterProvider router={router} />;
};
