import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";
import type { JSX } from "react";
import LoginForm from "./LoginForm";
import { use } from "react";


export const dynamic = "force-dynamic";

export default function LoginPage(): JSX.Element {
  const cookieStore = use(cookies());

  if (cookieStore.get("auth")?.value === "true") {
    redirect("/hub");
  }
  return <LoginForm />;
}