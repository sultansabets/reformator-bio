# Assets

**Logos (theme-aware):**

- **`src/assets/logo-light.png`** – used in light mode (header + splash)
- **`src/assets/logo-dark.png`** – used in dark mode (header + splash)
- **`src/assets/reformator-logo.png`** – legacy; script also creates the two above

The app imports:

```ts
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
```

and switches by theme: `theme === "dark" ? logoDark : logoLight`.

If files are missing, run from project root:

```bash
node scripts/create-logo-placeholder.js
```

Then replace the generated placeholders with your real logo files (use a light-on-transparent for light, dark-on-transparent for dark).
