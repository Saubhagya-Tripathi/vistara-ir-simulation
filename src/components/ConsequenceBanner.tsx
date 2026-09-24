import { useSimStore } from "../engine/state/store";

/**
 * Professional, non-modal consequence notifications driven by run state
 * (PROGRESSION_LOGIC.md §4). Never announces correctness — only operational
 * events the candidate's own decisions triggered.
 */
export function ConsequenceBanner() {
  const state = useSimStore((s) => s.state);
  if (!state) return null;
  const c = state.consequences;
  const banners: { kind: string; text: string }[] = [];

  if (c.underContainment && !c.underContainmentRemediated) {
    banners.push({
      kind: "alert",
      text: "SIEM escalation: outbound 8443 traffic to the known external destination is still being observed ~30 minutes after containment. The containment set appears incomplete — review Q-06-01 and apply remedial containment.",
    });
  }
  if (c.overContainment) {
    const q = state.submissions["Q-06-01"];
    if (q) {
      const verdictOver = true; // flag is only set by the over-containment path
      if (verdictOver) {
        banners.push({
          kind: "warn",
          text: "Business impact: domain authentication / plant operations degraded by the current isolation scope. CFO and plant head are escalating. You may roll back and re-scope Q-06-01.",
        });
      }
    }
  }
  if (c.eradicationIncomplete) {
    banners.push({
      kind: "alert",
      text: "Validation rediscovered surviving attacker persistence. Safe-state validation (Q-07-02) remains blocked until eradication (Q-06-03) is revised to cover every mechanism.",
    });
  }
  if (c.prematureSafe && state.safeState.stage !== 2) {
    banners.push({
      kind: "warn",
      text: "Follow-up review: the skipped persistence re-check and pending AD audit were executed under the remediation loop. The 16:55 re-run packet is now available — complete the stage-2 declaration.",
    });
  }

  if (banners.length === 0) return null;
  return (
    <div className="consequence-stack">
      {banners.map((b, i) => (
        <div key={i} className={`banner banner-${b.kind}`}>
          {b.text}
        </div>
      ))}
    </div>
  );
}
