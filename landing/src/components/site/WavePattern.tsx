// Subtle right-side chevron/wave decorative pattern like the reference.
export function WavePattern({ className = "" }: { className?: string }) {
  const cols = 26;
  const rows = 22;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${cols * 14} ${rows * 18}`}
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const x = c * 14;
          const y = r * 18;
          // fade in intensity toward the right
          const opacity = Math.min(0.22, 0.03 + (c / cols) * 0.22);
          return (
            <path
              key={`${r}-${c}`}
              d={`M${x} ${y + 8} l4 -5 l4 5 l4 -5`}
              stroke="#7fb4ff"
              strokeOpacity={opacity}
              strokeWidth={1}
              fill="none"
            />
          );
        }),
      )}
    </svg>
  );
}
