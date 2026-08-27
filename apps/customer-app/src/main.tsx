import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@pos/ui";
import { CustomerApp } from "./CustomerApp";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <CustomerApp />
    </ThemeProvider>
  </StrictMode>,
);
