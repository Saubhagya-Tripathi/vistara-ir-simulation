# ENVIRONMENT.md

**Fictional Organization Environment Definition**
**Simulation:** Browser-Based Cyber Incident Investigation & Response Simulation
**Version:** 1.0 — Agent 2 Deliverable
**Companion documents:** SCENARIO_BIBLE.md, ATTACK_TIMELINE.md

---

## 1. Organization Overview

**Organization name:** Vistara Polymers Pvt. Ltd.
**Industry:** Specialty polymer and packaging materials manufacturing
**Headquarters:** Pune, Maharashtra, India
**Founded:** 2009
**Employees:** ~480 (this scenario focuses on the Pune HQ campus and its IT estate)
**Business:** Manufactures food-grade polymer films and industrial packaging for FMCG and pharma clients. Operates one HQ campus (Pune) with a corporate office, a plant floor, and a warehouse. A second small sales office exists in Ahmedabad (out of scope for this incident; no systems there are involved).

**Why this org is plausible:** Mid-sized Indian manufacturing companies commonly have a small IT team, a flat network with partial segmentation, legacy systems kept alive for plant operations, and a public-facing web presence for customer orders and dealer engagement. Security maturity is moderate: they have an EDR rollout in progress, a SIEM fed by some sources, and a vulnerability scanner — but gaps exist.

---

## 2. Business Context

### 2.1 Core business processes

| Process | System(s) | Business criticality |
|---------|-----------|---------------------|
| Customer order intake & dealer portal | WEB-PRD-01 (IIS + custom ASP.NET app), DB-PRD-01 | High — revenue channel |
| ERP (finance, procurement, inventory) | ERP-APP-01 + DB-PRD-01 | Critical — operations halt without it |
| Plant floor execution & quality | MES-PLC-01 (isolated VLAN), FILE-PRD-01 (shared specs) | High — production continuity |
| Email & collaboration | MAIL-PRD-01 (on-prem Exchange) | High |
| HR & payroll | HR-APP-01 | Medium — monthly payroll cycle |
| File sharing & engineering drawings | FILE-PRD-01 | High — client IP (packaging designs) |

### 2.2 Business hours and operational rhythm

- **Standard office hours:** 09:00–18:00 IST, Monday–Saturday (half-day Saturday optional for corporate teams).
- **Plant operations:** 06:00–22:00 IST, three shifts on weekdays; maintenance window Sunday 00:00–06:00 IST.
- **Payroll cycle:** Runs on the 25th of each month; HR-APP-01 must be stable between the 20th–28th.
- **Peak season:** October–January (festive + pharma client year-end). The incident occurs in **September 2026**, just before peak season — raising business stakes for containment/recovery decisions.
- **Dealer portal usage:** Peaks 10:00–13:00 and 15:00–18:00 IST on weekdays.

### 2.3 Key personnel (business side)

| Name | Role | Notes |
|------|------|-------|
| Meera Krishnan | CFO | Approves any downtime on ERP; very sensitive to payroll-period disruption |
| Arvind Bhatnagar | VP Sales | Owns dealer portal revenue; pushes for minimal portal downtime |
| Sunita Deshmukh | Plant Head | Owns MES/PLC continuity; insists plant VLAN is untouchable |
| Rohit Chavan | HR Manager | Owns HR-APP-01; monthly payroll guardian |

---

## 3. Network Architecture

### 3.1 Network zones

| Zone | CIDR | Purpose | Internet-facing? |
|------|------|---------|------------------|
| **DMZ** | 203.0.113.0/28 | Web, mail gateway, VPN concentrator | Yes (NAT'd public IPs) |
| **Corporate LAN** | 10.10.10.0/24 | User workstations, printers, Wi-Fi | No (NAT via FW-01) |
| **Server VLAN** | 10.10.20.0/24 | App servers, file, HR, ERP app | No |
| **Database VLAN** | 10.10.30.0/24 | DB-PRD-01, backup target | No |
| **Management VLAN** | 10.10.40.0/24 | EDR console, SIEM, vuln scanner, jump host | No |
| **Plant VLAN** | 10.10.50.0/24 | MES terminals, PLC engineering station | No; firewall-isolated from Server VLAN except one rule |
| **Guest Wi-Fi** | 10.10.60.0/24 | Visitors | No; internet-only |

**Public IP assignments (DMZ, via ISP "SwiftLink Broadband", fictional):**

| Public IP | Internal host | Service |
|-----------|---------------|---------|
| 203.0.113.10 | WEB-PRD-01 | HTTP/HTTPS (80/443), RDP (3389 — **should not be open**, see weaknesses) |
| 203.0.113.11 | MAIL-PRD-01 | SMTP (25), IMAPS (993) |
| 203.0.113.12 | VPN-GW-01 | IKE/IPsec + SSL-VPN (443) |

**Note on documentation IPs:** 203.0.113.0/24 is used here as a documentation range per convention. The simulation presents these as the organization's real public IPs.

### 3.2 Firewalls and routing

- **FW-01** (perimeter, Linux-based iptables + a web UI): Default-deny inbound; rules for the three public services above. **Known misconfiguration:** a rule added during a 2025 vendor troubleshooting session permits TCP 3389 from `any` to 203.0.113.10 (WEB-PRD-01). It was never removed. (This is weakness W-01.)
- **FW-02** (internal segmentation, managed switch ACLs + host firewall policy): Separates Server VLAN from Corporate LAN and Plant VLAN. **Known gap:** Plant VLAN can reach FILE-PRD-01 (SMB 445) on one legacy rule for spec-sheet distribution (weakness W-06, not exploited in this incident but relevant to scoping judgment).
- **DNS:** Internal DNS on DC-01/DC-02 (AD-integrated); external DNS hosted by ISP. DMZ hosts use ISP DNS.
- **No network IDS/IPS** in line. NetFlow is collected on FW-01 but only retained 7 days and rarely reviewed (weakness W-09).

### 3.3 Remote access

- **VPN-GW-01:** SSL-VPN for ~30 staff (sales team, plant supervisors). Authenticates against AD. No MFA (weakness W-08).
- **RDP exposure:** WEB-PRD-01 reachable on 3389 from internet due to FW-01 rule (W-01). This is the incident's initial vector.

---

## 4. Hosts and Systems (Canonical Registry)

### 4.1 DMZ hosts

| Hostname | OS | IP | Role | EDR? | Notes |
|----------|----|----|------|------|-------|
| WEB-PRD-01 | Windows Server 2016 | 203.0.113.10 (NAT) / 10.10.20.11* | Customer portal + dealer portal (IIS 10, ASP.NET 4.8) | Yes (EDR deployed 2026-06) | *Actually sits in Server VLAN with a DMZ-style public NAT; a legacy "temporary" arrangement from 2023 that was never fixed. Weakness W-02. |
| MAIL-PRD-01 | Windows Server 2019 | 203.0.113.11 / 10.10.20.12 | Exchange 2019 | Yes | Not involved in incident |
| VPN-GW-01 | Linux (Ubuntu 20.04) | 203.0.113.12 / 10.10.20.13 | SSL-VPN | No (network appliance) | Not involved |

*Clarification for evidence agents: WEB-PRD-01's primary interface is 10.10.20.11; the public IP is a 1:1 NAT on FW-01. Logs will show both. This dual-homed nature is intentional and discoverable.

### 4.2 Server VLAN hosts

| Hostname | OS | IP | Role | EDR? | Notes |
|----------|----|----|------|------|-------|
| APP-PRD-01 | Windows Server 2019 | 10.10.20.21 | Internal application server (runs the "Vistara Dealer Portal" backend API and an internal HR self-service module) | Yes | **Primary lateral movement target** |
| ERP-APP-01 | Windows Server 2016 | 10.10.20.22 | ERP application tier (proprietary thick client + app server) | Yes | Business-critical; touched by attacker but not fully compromised |
| FILE-PRD-01 | Windows Server 2019 | 10.10.20.23 | File/print server; engineering drawings, spec sheets, shared drives (S:, R:) | Yes | **Collection target** |
| HR-APP-01 | Windows Server 2019 | 10.10.20.24 | HR & payroll application (third-party, IIS + SQL LocalDB) | Yes | Payroll-sensitive |
| WSUS-01 | Windows Server 2019 | 10.10.20.25 | Patch management | No | Red herring candidate (see SCENARIO_BIBLE §24) |
| JUMP-01 | Windows Server 2019 | 10.10.40.21 | Admin jump host (Management VLAN) | Yes | Used by IT admins; attacker never reaches it |

### 4.3 Database VLAN hosts

| Hostname | OS | IP | Role | EDR? | Notes |
|----------|----|----|------|------|-------|
| DB-PRD-01 | Windows Server 2019 + SQL Server 2019 | 10.10.30.21 | SQL for portal, ERP, HR apps | Yes | Attacker queries it briefly; no data exfil from DB directly |
| BKP-01 | Windows Server 2019 | 10.10.30.22 | Veeam backup target | No | Recovery resource |

### 4.4 Domain controllers

| Hostname | OS | IP | Role | EDR? | Notes |
|----------|----|----|------|------|-------|
| DC-01 | Windows Server 2019 | 10.10.20.31 | Primary DC, FSMO roles, DNS, CA | Yes | **DCSync target (simulated via replication-style access)** |
| DC-02 | Windows Server 2019 | 10.10.20.32 | Secondary DC | Yes | Not directly touched |

### 4.5 Corporate LAN (workstations — representative set)

| Hostname | User | IP (DHCP, typical) | Notes |
|----------|------|--------------------|-------|
| WKSTN-ANU-01 | Ananya Iyer (ananya.iyer) | 10.10.10.51 | Finance executive |
| WKSTN-RAJ-02 | Rajesh Kulkarni (rajesh.kulkarni) | 10.10.10.52 | **IT Systems Administrator — his credentials are the pivot** |
| WKSTN-PRA-03 | Pranav Joshi (pranav.joshi) | 10.10.10.53 | Sales coordinator; red herring (VPN from Ahmedabad office) |
| WKSTN-SNE-04 | Sneha Patil (sneha.patil) | 10.10.10.54 | HR executive |
| WKSTN-VIK-05 | Vikram Rao (vikram.rao) | 10.10.10.55 | Plant supervisor |
| WKSTN-KAV-06 | Kavita Menon (kavita.menon) | 10.10.10.56 | Procurement |
| WKSTN-DEV-07 | Devang Shah (devang.shah) | 10.10.10.57 | IT helpdesk |

Full LAN inventory: 62 workstations total in the registry; only the above 7 appear in evidence.

### 4.6 Plant VLAN

| Hostname | OS | IP | Notes |
|----------|----|----|-------|
| MES-PLC-01 | Windows 10 IoT (embedded) | 10.10.50.11 | PLC engineering station; **not involved** — isolated and clean |
| MES-TERM-01 | Windows 10 | 10.10.50.12 | MES terminal; not involved |

### 4.7 Security/monitoring infrastructure (Management VLAN)

| Hostname | IP | Role |
|----------|----|------|
| SIEM-01 | 10.10.40.11 | Wazuh-based SIEM; receives sysmon, IIS, auth logs from EDR-covered hosts |
| EDR-CON-01 | 10.10.40.12 | EDR management console (e.g., fictional "SentinelNode") |
| VULN-01 | 10.10.40.13 | Tenable-like vulnerability scanner |
| ADM-PC-01 | 10.10.40.14 | IT admin workstation (Rajesh Kulkarni's secondary) |

---

## 5. Users and Identities (Canonical Registry)

### 5.1 AD domain

- **Domain:** `vistara.local` (NetBIOS: VISTARA)
- **Forest functional level:** Windows Server 2016
- **UPN suffix:** `vistara.local`

### 5.2 Privileged groups (membership that matters)

| Group | Members (relevant) | Notes |
|-------|--------------------|-------|
| Domain Admins | svc_backup, admin_legacy, Rajesh Kulkarni (rajesh.kulkarni) | **rajesh.kulkarni was added to Domain Admins in March 2026** for a migration project and never removed (weakness W-04). This is the escalation path. |
| Enterprise Admins | svc_backup | Clean |
| Administrators (built-in, servers) | Domain Admins, svc_backup, admin_legacy | |
| Server Operators | — | Empty |
| Backup Operators | svc_backup | |
| Remote Desktop Users (WEB-PRD-01 local) | svc_portal, rajesh.kulkarni, admin_legacy | |
| Remote Desktop Users (APP-PRD-01 local) | svc_portal, rajesh.kulkarni | |

### 5.3 User accounts (materially relevant)

| Username | Display name | Role | Password hygiene | Incident role |
|----------|-------------|------|------------------|---------------|
| `svc_portal` | (service) Portal App Pool | Service account running the dealer portal app pool on WEB-PRD-01 and APP-PRD-01 | **Weak: `Portal@2024`** — set 2024, never rotated, documented in a wiki page IT keeps (weakness W-03) | **Initial foothold credential** — brute-forced over exposed RDP |
| `rajesh.kulkarni` | Rajesh Kulkarni | IT Systems Administrator | Reuses a variant: `RajKulk@2023` → changed to `RajKulk@2026` during forced rotation; **the 2023 password is recovered from WEB-PRD-01 memory** (weakness W-05 — password reuse across years) | **Pivot identity** — dumped from WEB-PRD-01, used for lateral movement |
| `admin_legacy` | (disabled? No — **enabled**) Legacy Admin | Old built-in-style admin account from 2015 domain setup; password `Vistara#Admin1` (weak, never rotated; weakness W-07) | **Not used by attacker** — red herring: looks juicy, but attacker never touches it. Its existence teaches "not every weak account is exploited." |
| `svc_backup` | (service) Backup Service | Veeam service account; member of Domain Admins | Strong, vaulted | Attacker **attempts** DCSync-style replication as svc_backup? No — attacker uses rajesh.kulkarni (Domain Admin) to request replication. svc_backup itself is clean. |
| `ananya.iyer` | Ananya Iyer | Finance Executive | Normal | Benign noise: VPN login from Ahmedabad trip during incident window (red herring) |
| `pranav.joshi` | Pranav Joshi | Sales Coordinator | Normal | Benign noise: odd-hour portal orders (red herring) |
| `sneha.patil` | Sneha Patil | HR Executive | Normal | Benign: payroll prep activity on HR-APP-01 |
| `vikram.rao` | Vikram Rao | Plant Supervisor | Normal | Benign: plant VLAN activity |
| `kavita.menon` | Kavita Menon | Procurement | Normal | Benign noise |
| `devang.shah` | Devang Shah | IT Helpdesk | Normal | Benign: runs the vuln scan that becomes a red herring |
| `helpdesk` | (shared) Helpdesk | Shared account for ticket system | Weak | Not involved |

### 5.4 Full directory size

~85 user accounts in AD (dossier view), plus ~12 service accounts. Only the accounts above appear in evidence.

---

## 6. Web/Application Environment

### 6.1 Public web stack

- **WEB-PRD-01:** IIS 10 on Server 2016. Sites:
  1. `portal.vistara-polymers.in` — **Vistara Dealer Portal** (custom ASP.NET 4.8 app; order placement, dealer pricing, invoice download). Binds 443; HTTP 80 redirects to 443.
  2. `www.vistara-polymers.in` — static marketing site (WordPress 6.2, kept updated — **not** the entry point; updated plugin set).
  3. `staging.vistara-polymers.in` — **staging copy of the dealer portal, also bound to the same public IP, directory `/staging/`** — left accessible with `robots.txt` disallow but no auth (weakness W-02b). Staging contains a test upload page `/staging/test/upload.aspx` used by a vendor in 2024, never removed.
- **TLS:** Let's Encrypt certs, auto-renew.
- **App pool identity:** `svc_portal` on both WEB-PRD-01 and APP-PRD-01 (same account — weakness W-03b: one service account across tiers).

### 6.2 Internal application layer

- **APP-PRD-01:** hosts the portal's backend API (`/api/orders`, `/api/pricing`) and an internal HR self-service module. The portal frontend on WEB-PRD-01 proxies API calls to APP-PRD-01 over HTTP on the Server VLAN.
- **ERP-APP-01:** proprietary ERP thick-client server; app pool `svc_erp`.
- **HR-APP-01:** third-party HR app (IIS); app pool `svc_hr`.

### 6.3 Database layer

- **DB-PRD-01:** SQL Server 2019. Instances: `VISTARA_SQL` (default). Databases: `PortalDB`, `ERPDB`, `HRDB`. Authentication mixed-mode; app pools use SQL logins `sql_portal`, `sql_erp`, `sql_hr` (passwords vaulted, strong). Attacker does **not** crack SQL logins; brief enumeration only.

---

## 7. AD / Identity Environment

- **Single forest, single domain:** `vistara.local`
- **DCs:** DC-01 (primary), DC-02 (secondary) — both Server 2019
- **Password policy:** Default domain policy — min 8 chars, complexity enabled, **no fine-grained passwords**; **password never expires for service accounts** (weakness W-03c).
- **Privileged access:** No tiering model. Rajesh Kulkarni (helpdesk-origin sysadmin) holds Domain Admin and logs into user workstations, servers, and the jump host interchangeably (weakness W-04b).
- **LAPS:** Not deployed (local admin passwords consistent across servers — weakness W-05b, not needed by attacker since svc_portal + rajesh.kulkarni suffice).
- **Service accounts:** svc_portal (weak, documented in internal wiki), svc_backup (strong, vaulted), svc_erp, svc_hr, svc_monitor (vulnerability scanner service).
- **Legacy:** `admin_legacy` enabled with weak password (red herring).

---

## 8. Security Controls

| Control | Status | Notes |
|---------|--------|-------|
| EDR ("SentinelNode") | Deployed on all Windows servers and ~70% of workstations (rollout in progress) | WEB-PRD-01, APP-PRD-01, FILE-PRD-01, ERP-APP-01, HR-APP-01, DC-01, DC-02, WKSTN-RAJ-02 covered |
| SIEM (Wazuh) | Collects sysmon, security, IIS, EDR alerts | Alert that triggers detection: EDR "suspicious process lineage" on APP-PRD-01 |
| Vulnerability scanning | Weekly authenticated scans (VULN-01), Tuesdays 02:00 IST | Scanner IP: 10.10.40.13 — **source of red-herring scan noise** |
| Email security | Basic spam filter on MAIL-PRD-01 | Not relevant to this incident |
| Backups | Veeam nightly to BKP-01; 30-day retention; quarterly restore test | Recovery resource |
| Patching | WSUS; servers patched quarterly lagging ~60 days | WEB-PRD-01 missing a 2026-era IIS hotfix? No — keep it simple: patching is mediocre but not the root cause; the root cause is exposed RDP + weak service-account password |
| MFA | **Not implemented** for VPN or any remote access (weakness W-08) | |
| Network segmentation | Partial (FW-02 ACLs) | Plant VLAN isolated except FILE-PRD-01 SMB rule |
| Logging | IIS logs retained 90 days on WEB-PRD-01; Windows security logs on servers forwarded to SIEM; **FW-01 NetFlow 7 days only** | NetFlow gap matters for exfil volume verification |

---

## 9. Relevant Policies (dossier content)

1. **IR-Policy-01 "Incident Response Plan"** (2024): Defines severity levels; Sev-1 = confirmed compromise of production server or domain credentials. Requires: isolate affected host, disable compromised accounts, preserve evidence, notify CFO & plant head for Sev-1. **Gap:** policy says "isolate within 2 hours" but contains no guidance on scoping before isolation.
2. **AC-Policy-02 "Access Control & Password Policy"** (2023): 8+ chars, complexity, 90-day rotation for users; **service accounts exempt from rotation** (weakness codified in policy — W-03c). Shared/service accounts must be registered in the service-account wiki.
3. **CH-Policy-03 "Change Management"** (2023): Firewall changes require ticket + 2 approvals. **Gap:** the FW-01 RDP rule (W-01) predates this policy (2025 vendor session) and was grandfathered without a ticket — discoverable via missing change record (evidence).
4. **BK-Policy-04 "Backup & Recovery"** (2024): Nightly backups; RPO 24h; RTO 8h for ERP; restore tests quarterly.
5. **VP-Policy-05 "Vendor Remote Access"** (2025): Vendors must use VPN-GW-01 with named accounts; no direct RDP. **Violation in practice:** the 2025 vendor session that created W-01 used direct RDP for "faster troubleshooting," approved verbally by then-IT-head (departed). Discoverable via email artifact.
6. **NW-Policy-06 "Network Segmentation Standard"** (2024): Plant VLAN must not initiate connections to Server VLAN. **Exception:** FILE-PRD-01 SMB rule documented as "temporary" since 2024 (W-06).

---

## 10. External / Internet Context

- **ISP:** SwiftLink Broadband (fictional), Pune. Static /28.
- **DNS hosting:** ISP-managed for `vistara-polymers.in`.
- **Attacker infrastructure (fictional):**
  - C2 / staging server: `185.220.101.47` (rented VPS, "HostNode EU", fictional provider) — used for RDP brute-force origin, web shell callbacks, and exfil destination.
  - Attacker workstation / VPN exit: `45.155.90.23` (bulletproof-ish VPN exit, fictional).
  - Scanning noise sources: various (see red herrings).
- **Benign external services:** Googlebot, Bingbot, uptime monitor (UptimeRobot), the org's own VULN-01 scanner (10.10.40.13), a payment gateway webhook (Razorpay-like, fictional "PayBridge") hitting `/api/payments/callback`.

---

## 11. Canonical Name/Term Registry (for evidence generation consistency)

| Item | Canonical value |
|------|-----------------|
| Organization | Vistara Polymers Pvt. Ltd. |
| Domain (AD) | vistara.local |
| Public domain | vistara-polymers.in |
| Portal URL | https://portal.vistara-polymers.in |
| Staging URL | https://portal.vistara-polymers.in/staging/ |
| First compromised host | WEB-PRD-01 (203.0.113.10 / 10.10.20.11) |
| Pivot identity | rajesh.kulkarni |
| Initial access account | svc_portal |
| Attacker C2 | 185.220.101.47 |
| Attacker VPN exit | 45.155.90.23 |
| Web shell path | C:\inetpub\wwwroot\staging\assets\upload_2024\img.aspx |
| Staging archive | C:\ProgramData\Microsoft\Crypto\RSA\staging.zip |
| Rogue account | vistara\svc_mon (display: "Monitoring Agent") |
| Rogue scheduled task | "MicrosoftEdgeUpdateTaskMachineCore" on APP-PRD-01 (action: powershell -enc ...) |
| Exfil archive name | order_export_2026.zip |
| Exfil destination | 185.220.101.47:8443 (HTTPS POST to /upload) |
| Detection alert | EDR-20260909-0417 "Suspicious PowerShell encode + external connection" on APP-PRD-01 |
| Detection time | 2026-09-09 09:47 IST |
| Vulnerability scanner | 10.10.40.13 (VULN-01) |
| Legacy admin account | admin_legacy |
| Backup service account | svc_backup |
| Payroll blackout | 20th–28th monthly |
| Incident dates | Attack: 2026-09-02 → 2026-09-09; Detection: 2026-09-09; Response: 2026-09-09 → 2026-09-10 |

---

## 12. Timezone Convention

- **All narrative timestamps: IST (UTC+05:30).**
- IIS logs and some security logs natively in UTC; the simulation must present a stated convention (evidence views show IST with UTC available on hover/drill-down). Evidence Generator: emit IIS logs in UTC with +05:30 conversion note, or emit both. Pick one convention per artifact type and document it in the artifact header.
