import { useTheme, type Theme } from "@pos/ui";

/**
 * Internal-only route (`/dev/theme-preview`, no auth guard) rendering
 * every design token as a swatch, plus a live Light/Dark/High-Contrast
 * switcher.
 *
 * Exit criteria for Phase 1 (docs/design-system/00-PLAN.md): switching
 * `data-theme` here changes every swatch below with zero component code
 * changes. Swatches use `var(--token)` directly (not Tailwind classes)
 * so this page proves the token system itself, independent of how
 * faithfully any given Tailwind class maps to it.
 */

const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "high-contrast", label: "High Contrast" },
];

const SURFACE_TOKENS = ["--background", "--surface", "--surface-secondary"];
const TEXT_TOKENS = ["--text-primary", "--text-secondary", "--text-disabled"];
const BORDER_TOKENS = ["--border", "--divider"];
const PRIMARY_TOKENS = [
  "--primary",
  "--primary-hover",
  "--primary-surface",
  "--primary-border",
];
const STATUS_GROUPS: { label: string; base: string }[] = [
  { label: "Success", base: "--success" },
  { label: "Warning", base: "--warning" },
  { label: "Danger", base: "--danger" },
  { label: "Info", base: "--info" },
];
const RADIUS_TOKENS = [
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--radius-xl",
];
const SHADOW_TOKENS = ["--shadow-sm", "--shadow-md", "--shadow-dropdown"];
const SPACING_TOKENS = [
  "--spacing-xs",
  "--spacing-sm",
  "--spacing-md",
  "--spacing-lg",
];

function Swatch({
  token,
  textOn,
}: {
  token: string;
  textOn?: "light" | "dark";
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 56,
          background: `var(${token})`,
          display: "flex",
          alignItems: "flex-end",
          padding: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            color: textOn === "dark" ? "#fff" : "var(--text-primary)",
            background: "rgba(128,128,128,0.15)",
            padding: "1px 4px",
            borderRadius: 4,
          }}
        >
          {token}
        </span>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2
      style={{
        fontSize: 13,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "var(--text-secondary)",
        marginBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 12,
        marginBottom: 32,
      }}
    >
      {children}
    </div>
  );
}

export function ThemePreviewPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--background)",
        color: "var(--text-primary)",
        padding: 32,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Theme Preview</h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            Internal Phase 1 exit-criteria page — no auth guard. Not linked from
            app navigation. See docs/design-system/README.md.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                border:
                  theme === t.value
                    ? "1px solid var(--primary)"
                    : "1px solid var(--border)",
                background:
                  theme === t.value
                    ? "var(--primary-surface)"
                    : "var(--surface)",
                color:
                  theme === t.value ? "var(--primary)" : "var(--text-primary)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <SectionTitle>Surfaces</SectionTitle>
        <Grid>
          {SURFACE_TOKENS.map((t) => (
            <Swatch key={t} token={t} />
          ))}
        </Grid>

        <SectionTitle>Text</SectionTitle>
        <Grid>
          {TEXT_TOKENS.map((t) => (
            <Swatch key={t} token={t} textOn="dark" />
          ))}
        </Grid>

        <SectionTitle>Borders</SectionTitle>
        <Grid>
          {BORDER_TOKENS.map((t) => (
            <Swatch key={t} token={t} />
          ))}
        </Grid>

        <SectionTitle>Primary</SectionTitle>
        <Grid>
          {PRIMARY_TOKENS.map((t) => (
            <Swatch key={t} token={t} textOn="dark" />
          ))}
        </Grid>

        <SectionTitle>Status</SectionTitle>
        <Grid>
          {STATUS_GROUPS.flatMap((g) => [
            <Swatch key={g.base} token={g.base} textOn="dark" />,
            <Swatch key={`${g.base}-surface`} token={`${g.base}-surface`} />,
          ])}
        </Grid>

        <SectionTitle>Radius</SectionTitle>
        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          {RADIUS_TOKENS.map((t) => (
            <div key={t} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: "var(--primary-surface)",
                  border: "1px solid var(--primary-border)",
                  borderRadius: `var(${t})`,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginTop: 6,
                }}
              >
                {t}
              </span>
            </div>
          ))}
        </div>

        <SectionTitle>Shadow</SectionTitle>
        <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
          {SHADOW_TOKENS.map((t) => (
            <div key={t} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 96,
                  height: 64,
                  background: "var(--surface)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: `var(${t})`,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginTop: 6,
                }}
              >
                {t}
              </span>
            </div>
          ))}
        </div>

        <SectionTitle>Spacing</SectionTitle>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 12,
            marginBottom: 8,
          }}
        >
          {SPACING_TOKENS.map((t) => (
            <div key={t} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: `var(${t})`,
                  height: `var(${t})`,
                  background: "var(--primary)",
                  borderRadius: 2,
                  margin: "0 auto",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginTop: 6,
                }}
              >
                {t}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
