import { useEffect, useState } from "preact/hooks";
import { daisyThemes } from "lib/daisy_themes.ts";

export function Themes({ theme }: { theme: string }) {
  const [selectedTheme, setSelectedTheme] = useState<string>(theme);

  const handleThemeChange = (event: Event) => {
    const select = event.target as HTMLInputElement;
    const theme = select.value;
    if (daisyThemes.includes(theme)) {
      const one_year = 60 * 60 * 24 * 365;
      document.cookie = `theme=${theme}; max-age=${one_year}; path=/;`;
      document.documentElement.setAttribute("data-theme", theme);
      setSelectedTheme(select.value);
    }
  };

  useEffect(() => {
    localStorage.setItem("selectedTheme", JSON.stringify(selectedTheme));
  }, [selectedTheme]);

  const visibleThemes = daisyThemes.slice(0, 5);
  const hiddenThemes = daisyThemes.slice(5);

  return (
    <div class="dropdown">
      <div tabIndex={0} role="button" class="btn m-1">
        Themes
        <svg
          width="12px"
          height="12px"
          class="h-2 w-2 fill-current opacity-60 inline-block"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z">
          </path>
        </svg>
      </div>
      <ul
        tabIndex={0}
        class="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52 overflow-y-auto max-h-48"
      >
        {visibleThemes.map((theme) => (
          <li key={theme}>
            <input
              type="radio"
              name="theme-dropdown"
              class="theme-controller btn btn-sm btn-block btn-ghost justify-start capitalize"
              aria-label={theme}
              value={theme}
              onChange={handleThemeChange}
              checked={selectedTheme === theme}
            />
          </li>
        ))}
        {hiddenThemes.length > 0 && (
          <div class="hidden-themes">
            {hiddenThemes.map((theme) => (
              <li key={theme}>
                <input
                  type="radio"
                  name="theme-dropdown"
                  class="theme-controller btn btn-sm btn-block btn-ghost justify-start capitalize"
                  aria-label={theme}
                  value={theme}
                  onChange={handleThemeChange}
                  checked={selectedTheme === theme}
                />
              </li>
            ))}
          </div>
        )}
      </ul>
    </div>
  );
}
