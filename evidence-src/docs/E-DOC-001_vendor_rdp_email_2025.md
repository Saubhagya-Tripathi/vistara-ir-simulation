# SYNTHETIC — Email export, MAIL-PRD-01 archive / IT mailbox (it-manager@vistara-polymers.in)
# All timestamps IST. Thread window: 2025-06-16 → 2025-06-17. Exported 2026-09-09 for INC-2026-0417.

---

**Message 1 of 3**
From: vendor.support@polypack-solutions.example
To: it-manager@vistara-polymers.in
Date: 2025-06-16 09:48 IST
Subject: Portal upload page troubleshooting — access request

Hi,

Dealers are still reporting intermittent errors on the portal upload page. Our VPN session to
your network keeps dropping and the diagnostic runs are timing out — we lost the session twice
yesterday during log collection.

Could you open RDP directly to the web server (203.0.113.10) for us this week? It would be much
faster for troubleshooting than working through the VPN.

Regards,
PolyPack Support

---

**Message 2 of 3**
From: it-manager@vistara-polymers.in
To: vendor.support@polypack-solutions.example
Date: 2025-06-16 13:20 IST
Subject: RE: Portal upload page troubleshooting — access request

Spoke with the IT head — verbal OK given for this week only.

I have asked the network admin to add a rule on FW-01 permitting TCP 3389 to 203.0.113.10,
tagged LEGACY-VENDOR-2025-RDP. Please use it only for this troubleshooting engagement and let
us know when you are done.

Thanks,
IT Manager, Vistara Polymers

---

**Message 3 of 3**
From: vendor.support@polypack-solutions.example
To: it-manager@vistara-polymers.in
Date: 2025-06-17 14:22 IST
Subject: RE: Portal upload page troubleshooting — done

Issue found and fixed (stale app-pool setting on the upload handler). Thanks for opening RDP
directly to the web server — much faster than the VPN. Please leave the firewall rule in place
in case we need to get back in this week.

Regards,
PolyPack Support

---

IT annotation appended 2026-09-09 (INC-2026-0417 review): verbal approval to keep rule
LEGACY-VENDOR-2025-RDP was given by the then-IT-head (departed Dec 2025). No change ticket was
ever filed for this rule — CH-Policy-03 requires ticket + 2 approvals for firewall changes.
VP-Policy-05 requires vendors to use VPN-GW-01 with named accounts; direct RDP is not permitted
under that policy. Rule was still active on FW-01 at the time of this incident.
