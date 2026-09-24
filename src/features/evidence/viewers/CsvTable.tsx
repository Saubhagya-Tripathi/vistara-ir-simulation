/**
 * CSV drill-down renderer. Parses with a small quoted-field-safe state
 * machine (handles "...", embedded commas, and "" escapes) — sufficient for
 * the generated drill-down files, which never embed newlines in fields.
 */

export function parseCsv(body: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inQuotes) {
      if (c === '"') {
        if (body[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell !== ""));
}

export function CsvTable({ body }: { body: string }) {
  const rows = parseCsv(body);
  if (rows.length === 0) {
    return <p className="muted small">Empty CSV file.</p>;
  }
  const [header, ...data] = rows;
  return (
    <table className="data-table">
      <thead>
        <tr>
          {header.map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {header.map((_, j) => (
              <td key={j} className="mono">
                {row[j] ?? ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
