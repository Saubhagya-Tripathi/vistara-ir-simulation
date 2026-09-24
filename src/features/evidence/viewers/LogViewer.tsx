import { splitHighlight } from "../search";

/**
 * Monospace, pre-wrapped renderer for .log artifacts. Lines starting with
 * "#" are dimmed as comments; occurrences of the current search query are
 * highlighted. Text remains user-selectable (log-body sets user-select).
 */
export function LogViewer({ body, query = "" }: { body: string; query?: string }) {
  const lines = body.split(/\r?\n/);
  const highlight = query.trim().length >= 2 ? query : "";
  return (
    <pre className="log-body">
      {lines.map((line, i) => (
        <div key={i} className={line.startsWith("#") ? "log-comment" : undefined}>
          {highlight
            ? splitHighlight(line, highlight).map((part, j) =>
                part.match ? (
                  <mark key={j} className="log-highlight">
                    {part.text}
                  </mark>
                ) : (
                  <span key={j}>{part.text}</span>
                ),
              )
            : line || " "}
        </div>
      ))}
    </pre>
  );
}
