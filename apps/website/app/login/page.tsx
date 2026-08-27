import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to the Servora application.",
};

export default function Login() {
  redirect(process.env.NEXT_PUBLIC_APP_SIGNIN_URL ?? "/app/login");
}
