---
title: "How I bypassed my ISP's ONT with a WAS-110 SFP+ stick"
summary: "Replaced the Telus ONT with a WAS-110 GPON/XGS-PON stick plugged directly into my UniFi router. Full 10G symmetric, no ISP box."
date: "Mar 15 2026"
tags:
- Networking
- UniFi
- GPON
- Home Lab
draft: false
---

My ISP gave me an ONT — a box that converts fiber to Ethernet. It works, but it's another device in the chain, another point of failure, and it blocks features I want (like running my own DHCP, VLANs, and firewall rules from the router directly).

So I replaced it with a **WAS-110 SFP+ stick** that plugs straight into my router's SFP+ port. The stick pretends to be the original ONT, and the ISP's network doesn't know the difference.

## What is ONT bypass?

Your ISP's fiber terminates at an **OLT** (their equipment in the neighborhood). The OLT talks to your **ONT** (the box in your house) over PON — a passive optical network.

The key insight: the OLT authenticates the ONT by its serial number, equipment ID, and software version. If you clone those values onto a different device, the OLT accepts it.

The **WAS-110** (also called the "8311 stick") is an SFP+ module with a PON transceiver inside. You flash community firmware onto it, enter your original ONT's identity values, plug in the fiber, and the ISP's OLT authenticates it as your ONT.

## What you need

| Item | Notes |
|---|---|
| **WAS-110 SFP+ stick** (SC/APC connector) | ~$60-90 USD. Get the right PON variant — GPON for ≤1 Gbps plans, XGS-PON for 2.5G+ plans. They're NOT interchangeable. |
| **Router with 10G SFP+ port** | UDM Pro Max, UDM SE, Mikrotik CCR2004, pfSense with SFP+ NIC, etc. |
| **Your original ONT's identity values** | Serial number, equipment ID, hardware version, software version, MAC address — all from the ONT's label and status page. |

> **SC/APC vs SC/UPC**: PON in North America uses **SC/APC** (green connector). Don't buy SC/UPC (blue) — it won't work and can damage the port.

## The process (high level)

### 1. Gather your ONT's identity

Before unplugging anything, grab these values from your ISP's ONT:

**From the physical label** (sticker on the box):
- PON Serial Number (starts with a vendor prefix like `ARCB`, `ALCL`, `HWTC`)
- Equipment ID / Model
- Hardware Version
- MAC Address

**From the status page** (connect to the ONT, browse to its admin IP):
- Software Version (usually not on the label)

Write everything down. Once you unplug the ONT, you lose access to its status page.

### 2. Flash 8311 community firmware

The stock WAS-110 firmware has compatibility issues with many ISPs. The [8311 community firmware](https://github.com/djGrrr/8311-was-110-firmware-builder/releases/latest) fixes these and adds a web UI (LuCI) for easy configuration.

```bash
# Download the latest basic firmware
curl -L --output-dir ~/Downloads -O \
  https://github.com/djGrrr/8311-was-110-firmware-builder/releases/download/v2.8.3/WAS-110_8311_firmware_mod_v2.8.3_basic.7z

# Extract
brew install sevenzip
7zz e '-i!local-upgrade.*' ~/Downloads/WAS-110_8311_firmware_mod_v2.8.3_basic.7z -o/tmp
```

Plug the stick into your router's SFP+ port, access it at `192.168.11.1`, and flash via SSH:

```bash
scp -O /tmp/local-upgrade.tar root@192.168.11.1:/tmp/
ssh root@192.168.11.1 \
  'tar xvf /tmp/local-upgrade.tar -C /tmp/ -- upgrade.sh && /tmp/upgrade.sh -y -r /tmp/local-upgrade.tar'
```

Flash both A/B firmware slots (the OLT can select either one).

### 3. Configure the ONT identity

Open the web UI at `https://192.168.11.1` and fill in the PON config tab with your original ONT's values:

- PON Serial Number
- Equipment ID
- Hardware Version
- Software Version (both A and B slots)
- MIB file (pick your ISP from the dropdown — Telus, AT&T, Bell, etc.)

Save and reboot.

### 4. Swap the fiber

Unplug the SC/APC fiber from the ISP ONT → plug it into the WAS-110 stick. Check the status page:

| Check | Expected | Bad sign |
|---|---|---|
| PLOAM Status | **O5.1** (Associated) | O1.1 — identity mismatch, double-check your values |
| RX Power | -8 to -28 dBm | No signal — check fiber connection |
| TX Power | Within spec | — |

### 5. Configure the router

- **Clone MAC**: Set your router's WAN MAC to the original ONT's MAC address. ISP DHCP leases are tied to the MAC — without cloning, you wait ~30 min for the old lease to expire.
- **DHCP**: Set WAN to DHCP.
- **Port speed**: Set SFP+ port to 10G.

## Why bother?

**One less box.** The ONT is gone. Fiber goes straight into the router.

**Full control.** No ISP-managed device sitting between my fiber and my network. I run my own DNS, DHCP, firewall rules, and VLANs without the ONT's limited firmware in the way.

**Speed.** XGS-PON gives 10G symmetric. My UniFi setup now runs at full line rate from the fiber to the LAN — no bottleneck at the ONT's Ethernet port.

**Reliability.** Fewer devices = fewer failure points. The SFP+ stick is passive and solid-state. No fan, no overheating ONT box, no random reboots.

## Gotchas I ran into

- **GPON vs XGS-PON** — I bought the wrong variant first. Check your ISP plan speed. If it's 2.5G+, you need XGS-PON.
- **SSH host key changes after firmware flash** — run `ssh-keygen -R 192.168.11.1` to clear the old key.
- **Route to 192.168.11.1 through UDM** — the router doesn't have a default route to the stick's management IP. You need to add a temporary host route: `ip route add 192.168.11.1/32 dev eth9`
- **Forgetting to clone the MAC** — spent 30 minutes wondering why DHCP wasn't handing out a WAN IP. Clone the ONT MAC first.

## Resources

- [pon.wiki](https://pon.wiki/guides/) — community guides for every ISP
- [8311 Discord](https://discord.gg/8311) — active community, great for troubleshooting
- [8311 firmware releases](https://github.com/djGrrr/8311-was-110-firmware-builder/releases/latest)
- [YouTube walkthrough](https://www.youtube.com/watch?v=BluDAuSU1T4) — visual setup guide
