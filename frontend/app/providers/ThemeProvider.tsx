"use client";
import React, { useCallback, PropsWithChildren, useEffect } from "react";
import { useLocalStorage } from "react-use";
import { HeroUIProvider } from "@heroui/react";

interface AppStatus {
  theme: "dark" | "light";
  changeTheme: (curr: "dark" | "light") => void;
}

const AppContext = React.createContext<AppStatus | null>(null);

export const ThemeProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [theme, setTheme] = useLocalStorage<"dark" | "light">("theme");

  useEffect(() => {
    const systemTheme = window?.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(systemTheme ? systemTheme : "dark");
  }, [theme, setTheme]);

  const changeTheme = useCallback(
    (curr: "dark" | "light") => {
      setTheme(curr);
    },
    [setTheme]
  );

  return (
    <AppContext.Provider value={{ theme, changeTheme } as AppStatus}>
      <HeroUIProvider>{children}</HeroUIProvider>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = React.useContext(AppContext);
  if (!context) throw new Error("useApp must be used within a ThemeProvider");

  return context;
};
