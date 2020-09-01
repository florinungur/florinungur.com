/**
 * Inspired by:
 *  1. https://web.archive.org/web/20200718030036/https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/
 *  2. https://web.archive.org/web/20200513012012/https://jenil.github.io/chota/
 */

"use strict";

// Select the ☀️/🌙 button.
const button = document.querySelector("#theme-switcher");

/**
 * Select the whole class list.
 * This is used to add a 'dark' class if the user prefers the dark theme.
 * By default the body has no theme class, so the default theme is light.
 * Note: This website's CSS only has special values for the dark theme.
 */
const bodyClassList = document.body.classList;

/**
 * Check for theme preference at the OS level.
 * Values: light | dark.
 */
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

/**
 * Get the user's theme preference from local storage.
 * If the user visits the site for the first time, the default value is 'null'.
 */
let localStorageTheme = localStorage.getItem("theme");

/**
 * If:
 *  1: The OS-level theme is 'dark' AND the local storage theme is 'dark' OR 'null'.
 * OR
 *  2: The OS-level theme is 'light' AND/BUT the local storage theme is 'dark'.
 * Notes:
 *  1. The localStorageTheme variable is needed because
 *     without it the site will always switch to dark mode if a user prefers it
 *     at the OS level even though they said otherwise at the website level.
 *  2. If the theme preference at the OS level is light, the only other condition
 *     needed for the page to be dark is for the theme in local storage to be dark.
 *     If 'null' would also be accepted, that would mean that a new user which prefers
 *     the light theme at the OS level would always get the dark theme of the website,
 *     unless they manually select otherwise using the ☀️/🌙 button.
 */
if (
  (prefersDarkScheme.matches && (localStorageTheme == "dark" || localStorageTheme == null)) ||
  (!prefersDarkScheme.matches && localStorageTheme == "dark")
) {
  // Make the button a moon.
  button.innerHTML = "🌙";
  // Tell the body to use the dark CSS values.
  bodyClassList.add("dark");
  // Save the current preference to localStorage to keep using it between pages.
  localStorageTheme = "dark";
}

// Listen for a click on the ☀️/🌙 button.
button.addEventListener("click", themeSwitcher);

/**
 * Switches between the two available color schemes.
 */
function themeSwitcher() {
  // If the body uses the .dark class...
  if (bodyClassList.contains("dark")) {
    // Switch to the light theme.
    button.innerHTML = "☀️";
    bodyClassList.remove("dark");
    localStorageTheme = "light";
  } else {
    // Switch to the dark theme.
    button.innerHTML = "🌙";
    bodyClassList.add("dark");
    localStorageTheme = "dark";
  }
  // Save the current preference to localStorage to keep using it between pages.
  localStorage.setItem("theme", localStorageTheme);
}
