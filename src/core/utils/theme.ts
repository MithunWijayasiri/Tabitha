let timeout: NodeJS.Timeout;

export async function applyTheme(darkMode: boolean, fade?: boolean) {
  // cancelling the pending removal would otherwise strand the class
  if (timeout) {
    clearTimeout(timeout);
    document.body.classList.remove("fade");
  }

  if (fade) document.body.classList.add("fade");

  document.body.classList.toggle("dark", darkMode);

  document.documentElement.style.colorScheme = darkMode ? "dark" : "normal";

  if (fade)
    timeout = setTimeout(() => {
      document.body.classList.remove("fade");
    }, 200);
}
