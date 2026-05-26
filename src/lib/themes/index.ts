/**
 * Theme API for code-based theme configuration
 * 
 * This module exports functions to programmatically apply themes without requiring UI components.
 * Import themes from theme-config.ts and use these functions to apply them directly in code.
 */

import { applyTheme, getThemeByName, type ThemeConfig } from "@/lib/theme-config";
import { STORAGE_KEYS } from "@/lib/constants";

// Types for theme system
export type ColorMode = "light" | "dark" | "system";

// Function to set the color mode (light/dark/system)
export function setColorMode(mode: ColorMode): void {
  const root = document.documentElement;
  const theme = getThemeByName(getCurrentTheme());
  
  if (!theme) return;
  
  localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  
  if (mode === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(theme, isDark);
  } else {
    applyTheme(theme, mode === "dark");
  }
}

// Function to set a specific theme by name
export function setTheme(themeName: string): void {
  const theme = getThemeByName(themeName);
  if (!theme) {
    console.warn(`Theme "${themeName}" not found. Using default theme.`);
    return;
  }
  
  const mode = getCurrentColorMode();
  const isDark = mode === "system" 
    ? window.matchMedia("(prefers-color-scheme: dark)").matches 
    : mode === "dark";
  
  localStorage.setItem(STORAGE_KEYS.THEME_NAME, themeName);
  applyTheme(theme, isDark);
}

// Function to set a specific theme by theme object
export function setThemeFromConfig(themeConfig: ThemeConfig): void {
  const mode = getCurrentColorMode();
  const isDark = mode === "system" 
    ? window.matchMedia("(prefers-color-scheme: dark)").matches 
    : mode === "dark";
  
  localStorage.setItem(STORAGE_KEYS.THEME_NAME, themeConfig.name);
  applyTheme(themeConfig, isDark);
}

// Function to get the current color mode
export function getCurrentColorMode(): ColorMode {
  return (localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ColorMode) || "system";
}

// Function to get the current theme name
export function getCurrentTheme(): string {
  return localStorage.getItem(STORAGE_KEYS.THEME_NAME) || "default";
}

// Set up listener for system theme changes
export function initializeThemeSystem(): void {
  // Set up initial theme based on stored preferences
  const storedMode = getCurrentColorMode();
  const storedTheme = getCurrentTheme();
  
  const theme = getThemeByName(storedTheme);
  if (!theme) return;
  
  if (storedMode === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(theme, isDark);
    
    // Add listener for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", (e) => {
      const currentTheme = getThemeByName(getCurrentTheme());
      if (currentTheme && getCurrentColorMode() === "system") {
        applyTheme(currentTheme, e.matches);
      }
    });
  } else {
    applyTheme(theme, storedMode === "dark");
  }
}

// Initialize on import if needed
export function initializeTheme(options: { 
  theme?: string; 
  mode?: ColorMode;
  autoInitialize?: boolean;
} = {}): void {
  const { 
    theme = "default", 
    mode = "system",
    autoInitialize = true
  } = options;
  
  if (autoInitialize) {
    // Set initial theme values in localStorage if not present
    if (!localStorage.getItem(STORAGE_KEYS.THEME_MODE)) {
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.THEME_NAME)) {
      localStorage.setItem(STORAGE_KEYS.THEME_NAME, theme);
    }
    
    // Initialize the theme system
    initializeThemeSystem();
  } else {
    // Force update with the provided values
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    localStorage.setItem(STORAGE_KEYS.THEME_NAME, theme);
    
    const themeConfig = getThemeByName(theme);
    if (themeConfig) {
      const isDark = mode === "system" 
        ? window.matchMedia("(prefers-color-scheme: dark)").matches 
        : mode === "dark";
      
      applyTheme(themeConfig, isDark);
    }
  }
}