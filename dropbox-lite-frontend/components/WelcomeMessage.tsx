"use client";
import React from "react";
import { useTheme } from "./ThemeProvider";

export default function WelcomeMessage() {
  const { theme } = useTheme();
  return (
    <div
      className={`mt-4 text-xl font-semibold text-center ${
        theme === "dark" ? "text-white" : "text-black"
      }`}
    >
      {theme === "dark"
        ? "Welcome to your cozy night file den"
        : "Welcome to your file upload dashboard"}
    </div>
  );
}
