# CABLING SURVEY SYSTEM - PRINTABLE VISUAL DIAGRAM

## 📐 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SITE SURVEY (CABLING TYPE)                          │
│                                                                             │
│  • Project Scope                                                            │
│  • General Notes                                                            │
│  • Standards (TIA568, ISO11801, etc.)                                       │
│  • Total Cable Runs                                                         │
│  • Total Outlets                                                            │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ╔═══════════════════════╗       ╔═══════════════════════╗
        ║     BUILDING #1       ║       ║     BUILDING #2       ║
        ║  (Main Building)      ║       ║   (Annex Building)    ║
        ╚═══════════════════════╝       ╚═══════════════════════╝
                    │                               │
        ┌───────────┼───────────┐                   │
        │           │           │                   │
        ▼           ▼           ▼                   ▼
    [Info]   [Central Rack]  [Images]        [Same structure...]
                    │
    ┌───────────────┼───────────────┬───────────────┬───────────────┐
    │               │               │               │               │
    ▼               ▼               ▼               ▼               ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ FLOOR 1 │    │ FLOOR 2 │    │ FLOOR 3 │    │ FLOOR 4 │    │ FLOOR 5 │
│ Ground  │    │         │    │         │    │         │    │ Penthouse│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

---

## 🏢 BUILDING STRUCTURE (Detailed View)

```
╔════════════════════════════════════════════════════════════════════════════╗
║                              BUILDING                                       ║
║                                                                            ║
║  Name: Main Building                                                       ║
║  Code: MB-001                                                              ║
║  Address: 123 Main Street                                                  ║
║  Notes: 5-story office building                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
                                    │
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌───────────────────────┐       ┌───────────────────────┐
        │   📸 IMAGES           │       │  🔌 CENTRAL RACK      │
        │                       │       │  (MDF - Main Dist.)   │
        │ • Building Exterior   │       │                       │
        │ • Main Entrance       │       │  Name: Central Rack   │
        │ • Lobby               │       │  Code: CR-001         │
        │ • General Views       │       │  Location: Basement   │
        │                       │       │  Units: 42U           │
        │ [Stored in BunnyCDN]  │       │                       │
        └───────────────────────┘       │  Devices:             │
                                        │  • Core Switch 48p    │
                                        │  • Fiber ODF 24p      │
                                        │  • Patch Panel 96p    │
                                        │  • UPS                │
                                        │                       │
                                        │  📸 Images:           │
                                        │  • Front view         │
                                        │  • Back view          │
                                        │  • Cable management   │
                                        └───────────┬───────────┘
                                                    │
                    ┌───────────┬───────────┬──────┴──────┬───────────┐
                    │           │           │             │           │
                    ▼           ▼           ▼             ▼           ▼
                 Floor 1     Floor 2     Floor 3       Floor 4     Floor 5
```

---

## 🏢 FLOOR STRUCTURE (Detailed View)

```
╔════════════════════════════════════════════════════════════════════════════╗
║                              FLOOR 2                                        ║
║                                                                            ║
║  Name: Second Floor                                                        ║
║  Level: 2                                                                  ║
║  Notes: Standard office floor                                              ║
║                                                                            ║
║  📋 BLUEPRINT                                                              ║
║  └── floor-2-blueprint.pdf (BunnyCDN)                                      ║
║                                                                            ║
║  🔗 SIMILAR TO: Floor 3, Floor 4 (same layout)                             ║
╚════════════════════════════════════════════════════════════════════════════╝
                    │
        ┌───────────┴───────────┬───────────────────┐
        │                       │                   │
        ▼                       ▼                   ▼
  ┌──────────┐          ┌──────────────┐    ┌──────────┐
  │  📸      │          │  🔌 FLOOR    │    │  ROOMS   │
  │ IMAGES   │          │    RACK      │    │          │
  │          │          │   (IDF)      │    │  (see    │
  │ • Floor  │          │              │    │   below) │
  │   photos │          │  Code: FR-2  │    │          │
  │ • Hall   │          │  Units: 24U  │    └──────────┘
  │ • Common │    ┌────▶│              │
  └──────────┘    │     │  🔗 Connected│
                  │     │  to Central  │
        ╔═════════╧═════╧══════════════╧═════════════════════════════════╗
        ║                                                                 ║
        ║  Connection: FLOOR RACK ←────(Fiber OS2)────→ CENTRAL RACK     ║
        ║                                                                 ║
        ║  Cable Details:                                                 ║
        ║  • Media: FIBER                                                 ║
        ║  • Type: OS2 (Single-mode)                                      ║
        ║  • Strands: 12                                                  ║
        ║  • Length: 45m                                                  ║
        ║  • Test: PASS (OTDR)                                            ║
        ╚═════════════════════════════════════════════════════════════════╝
```

---

## 🚪 ROOM STRUCTURE (Detailed View)

```
╔════════════════════════════════════════════════════════════════════════════╗
║                            ROOM 201                                         ║
║                                                                            ║
║  Name: Office 201                        Type: ROOM                        ║
║  Number: 201                             Floor: Floor 2                    ║
║                                                                            ║
║  📋 FLOOR PLAN                                                             ║
║  └── room-201-floorplan.pdf (BunnyCDN)                                     ║
║                                                                            ║
║  🔌 CONNECTION TYPE: FLOOR_RACK                                            ║
║     Connected to: Floor Rack FR-2                                          ║
║                                                                            ║
║  Notes: Corner office, 2 occupants                                         ║
╚════════════════════════════════════════════════════════════════════════════╝
                    │
        ┌───────────┴───────────┬───────────────────┐
        │                       │                   │
        ▼                       ▼                   ▼
  ┌──────────┐          ┌──────────────┐    ┌──────────────┐
  │  📸      │          │  📞 OUTLETS  │    │  🔌 CABLES   │
  │ IMAGES   │          │              │    │              │
  │          │          │  FP-201-A    │    │  From: Room  │
  │ • Room   │          │  ├─ Port 1   │    │  To: Floor   │
  │   view   │          │  ├─ Port 2   │    │      Rack    │
  │ • Desk   │          │  └─ Port 3   │    │              │
  │   area   │          │              │    │  CAT6A       │
  │ • Outlet │          │  FP-201-B    │    │  4 pairs     │
  │   loc.   │          │  ├─ Port 1   │    │  15m         │
  │ • Cable  │          │  └─ Port 2   │    │  PASS ✓      │
  │   path   │          │              │    │              │
  │ • Issues │          │  Total: 5    │    └──────────────┘
  │          │          │     ports    │
  │ (8 photos│          └──────────────┘
  │  stored) │
  └──────────┘
```

---

## 🔄 CONNECTION TYPES

### **Option 1: Standard - Via Floor Rack (Most Common)**

```
┌─────────────┐
│   ROOM 101  │
│             │
│  Outlets:   │
│  • FP-101-A │
└──────┬──────┘
       │
       │ CAT6A (15m)
       │
       ▼
┌─────────────┐
│ FLOOR RACK  │  ──────▶  Fiber OS2 (45m)  ──────▶  ┌──────────────┐
│    FR-1     │                                      │ CENTRAL RACK │
│   (IDF)     │  ◀──────  Fiber OS2 (45m)  ◀──────  │    CR-001    │
└─────────────┘                                      │    (MDF)     │
       ▲                                             └──────────────┘
       │ CAT6A (12m)
       │
┌──────┴──────┐
│   ROOM 102  │
│             │
│  Outlets:   │
│  • FP-102-A │
└─────────────┘
```

### **Option 2: Direct to Central (Special Cases)**

```
┌─────────────┐                                      ┌──────────────┐
│ PENTHOUSE   │                                      │ CENTRAL RACK │
│  SUITE 601  │  ──▶  Fiber OS2 (120m)  ──────▶    │    CR-001    │
│             │                                      │    (MDF)     │
│  10 Outlets │  ◀──  Fiber OS2 (120m)  ◀──────    └──────────────┘
└─────────────┘
       (No floor rack - direct connection)
```

---

## 📊 COMPLETE HIERARCHY CHART

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│                          SITE SURVEY (Root)                                │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │  General Info │ Project Scope │ Standards │ Totals              │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└──────────────────────────────┬─────────────────────────────────────────────┘
                               │
               ┌───────────────┴────────────────┐
               │                                │
               ▼                                ▼
        ┌─────────────┐                  ┌─────────────┐
        │  BUILDING   │                  │  BUILDING   │
        │     #1      │                  │     #2      │
        └──────┬──────┘                  └──────┬──────┘
               │                                │
               ├─────────────┬──────────────────┤
               │             │                  │
               ▼             ▼                  ▼
          [Images]  [CENTRAL RACK]        [Pathways]
                         │                [Work Requests]
                         │
         ┌───────────────┼───────────────┬───────────────┐
         │               │               │               │
         ▼               ▼               ▼               ▼
    ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐
    │FLOOR 1 │      │FLOOR 2 │      │FLOOR 3 │      │FLOOR 4 │
    └────┬───┘      └────┬───┘      └────┬───┘      └────┬───┘
         │               │               │               │
         ├───────┬───────┼───────┬───────┼───────┬───────┤
         │       │       │       │       │       │       │
         ▼       ▼       ▼       ▼       ▼       ▼       ▼
     [Images][Floor] [Blueprint][Similar] [Floor] [Work]
            [Rack]              [To F1]   [Rack]  [Req]
              │                             │
              │                             │
     ┌────────┼─────────┬─────────┐        │
     │        │         │         │        │
     ▼        ▼         ▼         ▼        ▼
  [Room]  [Room]    [Room]    [Room]   [Room]
   101     102       103       104      105
    │       │         │         │        │
    ├───┬───┼─────┬───┼─────┬───┼────┬───┤
    │   │   │     │   │     │   │    │   │
    ▼   ▼   ▼     ▼   ▼     ▼   ▼    ▼   ▼
[Floor][Outlets][Floor][Cables]
[Plan] (3 ports)[Plan][Tests]
[Images]        [Images]
(8 photos)      (5 photos)
```

---

## 🎯 ENTITY RELATIONSHIP SUMMARY

| Entity | Contains | Connected To | Images | Documents |
|--------|----------|--------------|--------|-----------|
| **Site Survey** | Buildings, Pathways, Cable Runs, Work Requests | - | ✓ | General Notes |
| **Building** | Floors, Central Rack | Site Survey | ✓ | - |
| **Central Rack** | Devices | Building, Floor Racks, Rooms (direct) | ✓ | - |
| **Floor** | Rooms, Floor Rack | Building | ✓ | Blueprint PDF |
| **Floor Rack** | Devices | Floor, Central Rack, Rooms | ✓ | - |
| **Room** | Outlets | Floor, Floor Rack OR Central Rack | ✓ (Multiple) | Floor Plan PDF |
| **Outlet** | Ports | Room | - | - |
| **Device** | Ports | Central Rack OR Floor Rack | ✓ | - |
| **Cable Run** | Terminations, Tests | Any Rack ↔ Any Rack/Room | ✓ | Test Reports |
| **Work Request** | - | Site Survey, Building, Floor, Room | - | Estimates |

---

## 📋 DATA ENTRY WORKFLOW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         START NEW SURVEY                                │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
                      1. CREATE BUILDING
                         • Name, Code
                         • Address
                         • Upload exterior photos
                             │
                             ▼
                      2. CREATE CENTRAL RACK
                         • Location
                         • Rack size (U)
                         • Add devices
                         • Upload rack photos
                             │
                             ▼
                      3. ADD FLOORS
                         • Name, Level
                         • Upload blueprint PDF ← IMPORTANT!
                         • Mark similar floors ← SAVES TIME!
                             │
                             ▼
                      4. CREATE FLOOR RACK
                         • Connect to Central Rack
                         • Add devices
                         • Upload rack photos
                             │
                             ▼
                      5. ADD ROOMS
                         • Name, Number, Type
                         • Choose connection (Floor/Central)
                         • Upload floor plan (optional)
                         • Upload room photos (multiple)
                             │
                             ▼
                      6. ADD OUTLETS
                         • Label (FP-201-A)
                         • Number of ports
                         • Location in room
                             │
                             ▼
                      7. DOCUMENT CABLE RUNS
                         • From → To
                         • Media type & specs
                         • Length
                         • Purpose
                             │
                             ▼
                      8. RECORD TEST RESULTS
                         • Standard (TIA568, etc.)
                         • Result (PASS/FAIL)
                         • Upload test report
                             │
                             ▼
                      9. ADD WORK REQUESTS
                         • Future improvements
                         • Customer requests
                         • Priority & estimates
                             │
                             ▼
                     10. GENERATE REPORT
                         • Professional Excel
                         • All images included
                         • Ready for client ✓
```

---

## 🖨️ PRINT GUIDE

**This document is optimized for printing:**

- **Page Setup**: A4 or Letter
- **Orientation**: Portrait
- **Margins**: Normal (1 inch / 2.54 cm)
- **Font**: Monospace preserved
- **Scale**: 100% (do not scale to fit)

**Recommended sections to print:**
1. Complete System Architecture (Page 1)
2. Floor Structure Detailed View (Page 3)
3. Room Structure Detailed View (Page 4)
4. Connection Types (Page 5)
5. Complete Hierarchy Chart (Page 6)
6. Data Entry Workflow (Page 9)

**Total Pages**: ~10 pages

---

**Last Updated**: January 2025  
**Version**: 1.0  
**System**: Kimon CRM - Cabling Survey Module

