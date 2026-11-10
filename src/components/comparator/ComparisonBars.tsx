import { SIDE_STYLES } from "./params";

export interface ComparisonMetric {
  label: string;
  title: string;
  a: number | null;
  b: number | null;
  /** Por ejemplo, en las pérdidas gana quien tiene menos. */
  lowerIsBetter?: boolean;
  /** Porcentajes: se muestran con "%". */
  isPercent?: boolean;
}

function formatValue(value: number | null, isPercent = false) {
  if (value === null) return "-";
  return `${value.toFixed(1)}${isPercent ? "%" : ""}`;
}

/** -1 si gana A, 1 si gana B y 0 si empatan o falta un dato. */
function getWinner({ a, b, lowerIsBetter }: ComparisonMetric) {
  if (a === null || b === null || a === b) return 0;
  const aWins = lowerIsBetter ? a < b : a > b;
  return aWins ? -1 : 1;
}

function Bar({
  value,
  max,
  side,
  isWinner,
}: {
  value: number | null;
  max: number;
  side: "a" | "b";
  isWinner: boolean;
}) {
  const width = value && max > 0 ? Math.max((value / max) * 100, 2) : 0;

  return (
    <div
      className={`flex h-2.5 overflow-hidden bg-surface-raised ${
        side === "a" ? "justify-end rounded-l-full" : "rounded-r-full"
      }`}
    >
      <div
        style={{ width: `${width}%` }}
        className={`h-full transition-[width] duration-500 ${SIDE_STYLES[side].barClass} ${
          isWinner ? "" : "opacity-45"
        }`}
      />
    </div>
  );
}

function MetricRow({ metric }: { metric: ComparisonMetric }) {
  const winner = getWinner(metric);
  const max = Math.max(metric.a ?? 0, metric.b ?? 0);

  const valueClass = (isWinner: boolean, side: "a" | "b") =>
    `tabular-nums ${isWinner ? `font-bold ${SIDE_STYLES[side].textClass}` : "text-muted"}`;

  return (
    <li className="py-2.5">
      <div className="mb-1.5 grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 text-sm">
        <span className={valueClass(winner === -1, "a")}>
          {formatValue(metric.a, metric.isPercent)}
        </span>
        <abbr
          title={metric.title}
          className="text-xs font-semibold tracking-wide text-muted no-underline"
        >
          {metric.label}
        </abbr>
        <span className={`text-right ${valueClass(winner === 1, "b")}`}>
          {formatValue(metric.b, metric.isPercent)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <Bar value={metric.a} max={max} side="a" isWinner={winner !== 1} />
        <Bar value={metric.b} max={max} side="b" isWinner={winner !== -1} />
      </div>
    </li>
  );
}

/** Barras enfrentadas: A crece hacia la izquierda y B hacia la derecha. */
export function ComparisonBars({ metrics }: { metrics: ComparisonMetric[] }) {
  return (
    <ul className="divide-y divide-line rounded-lg border border-line bg-surface px-4">
      {metrics.map((metric) => (
        <MetricRow key={metric.label} metric={metric} />
      ))}
    </ul>
  );
}
