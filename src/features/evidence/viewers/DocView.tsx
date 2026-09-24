/**
 * Pre-wrapped renderer for markdown-ish document artifacts (.md). These are
 * plain-text narrative docs (emails, notes, report templates); no markdown
 * library is used.
 */
export function DocView({ body }: { body: string }) {
  return <div className="doc-body">{body}</div>;
}
