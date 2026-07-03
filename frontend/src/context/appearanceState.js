import { createContext, useContext } from "react";

export const AppearanceContext = createContext(null);

export const useAppearance = () => useContext(AppearanceContext);
