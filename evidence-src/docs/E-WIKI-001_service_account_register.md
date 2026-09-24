# SYNTHETIC — IT Wiki: "Service Accounts — Registered Credentials" (AC-Policy-02 register) | Last edited 2024-03-14 by rajesh.kulkarni
# Source: IT internal wiki export (page SVC-ACCT-REG). All timestamps IST. Register content as of last edit; viewed 2026-09-09 during INC-2026-0417.

Per AC-Policy-02 §6, all shared/service accounts must be registered on this page.
Service accounts are EXEMPT from the 90-day password rotation requirement per AC-Policy-02 §4.

| Account     | Purpose                          | Password     | Rotation                  |
|-------------|----------------------------------|--------------|---------------------------|
| svc_portal  | Dealer portal app pool (WEB+APP) | Portal@2024  | EXEMPT — AC-Policy-02 §4  |
| svc_backup  | Veeam service                    | (vaulted)    | vaulted, auto-rotated     |
| svc_monitor | VULN-01 authenticated scans      | (vaulted)    | vaulted, auto-rotated     |

NOTE: svc_portal is local admin on WEB-PRD-01 for legacy app-pool reasons — do not remove.

Referenced by: `C:\IT\scripts\deploy.ps1` on WEB-PRD-01 (portal deployment script — keep the
app-pool credential in sync with this register when it changes).

---
Page history: created 2023-11-02 by it-manager; last edited 2024-03-14 by rajesh.kulkarni
(added svc_monitor row). Next register review was due 2024-06 — not recorded.
