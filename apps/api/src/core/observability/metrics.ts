type Labels = Record<string, string | number | boolean | undefined>;

function labelKey(labels: Labels = {}): string {
  return Object.entries(labels)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("|");
}

function renderLabels(key: string): string {
  if (!key) return "";
  const pairs = key.split("|").map((part) => {
    const index = part.indexOf("=");
    const name = part.slice(0, index);
    const value = part.slice(index + 1).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `${name}="${value}"`;
  });
  return `{${pairs.join(",")}}`;
}

const counters = new Map<string, Map<string, number>>();
const gauges = new Map<string, Map<string, number>>();
const durations = new Map<
  string,
  Map<string, { count: number; sum: number; max: number }>
>();

function nested<T>(root: Map<string, Map<string, T>>, name: string): Map<string, T> {
  let value = root.get(name);
  if (!value) {
    value = new Map<string, T>();
    root.set(name, value);
  }
  return value;
}

export const metrics = {
  increment(name: string, labels: Labels = {}, amount = 1): void {
    const entries = nested(counters, name);
    const key = labelKey(labels);
    entries.set(key, (entries.get(key) ?? 0) + amount);
  },

  setGauge(name: string, value: number, labels: Labels = {}): void {
    nested(gauges, name).set(labelKey(labels), value);
  },

  observeDuration(name: string, durationMs: number, labels: Labels = {}): void {
    const entries = nested(durations, name);
    const key = labelKey(labels);
    const current = entries.get(key) ?? { count: 0, sum: 0, max: 0 };
    current.count += 1;
    current.sum += durationMs;
    current.max = Math.max(current.max, durationMs);
    entries.set(key, current);
  },

  renderPrometheus(): string {
    const lines: string[] = [];
    for (const [name, entries] of counters) {
      lines.push(`# TYPE ${name} counter`);
      for (const [labels, value] of entries) lines.push(`${name}${renderLabels(labels)} ${value}`);
    }
    for (const [name, entries] of gauges) {
      lines.push(`# TYPE ${name} gauge`);
      for (const [labels, value] of entries) lines.push(`${name}${renderLabels(labels)} ${value}`);
    }
    for (const [name, entries] of durations) {
      lines.push(`# TYPE ${name} summary`);
      for (const [labels, value] of entries) {
        const suffix = renderLabels(labels);
        lines.push(`${name}_count${suffix} ${value.count}`);
        lines.push(`${name}_sum${suffix} ${value.sum}`);
        lines.push(`${name}_max${suffix} ${value.max}`);
      }
    }
    return `${lines.join("\n")}\n`;
  },
};
