# CABLING SURVEY STRUCTURE

## 📊 Visual Hierarchy

```
SITE SURVEY (CABLING Type)
│
└── BUILDING
    ├── 📍 Central Rack (one per building)
    │   ├── Devices (switches, patch panels, ODF, etc.)
    │   ├── Images (rack photos)
    │   └── Cable Runs (connections to/from central)
    │
    └── FLOORS (multiple per building)
        ├── 📋 Blueprint (BunnyCDN URL)
        ├── 🔗 Similar to Floor? (reference to another floor)
        ├── Images (floor photos, blueprints)
        │
        ├── Floor Rack (one per floor)
        │   ├── 🔌 Connected to: Central Rack
        │   ├── Devices (floor switches, patch panels)
        │   ├── Images (rack photos)
        │   └── Cable Runs (to central or rooms)
        │
        └── ROOMS / APARTMENTS (multiple per floor)
            ├── 📋 Floor Plan (room-specific)
            ├── 🔌 Connection Type:
            │   ├── → Floor Rack (default)
            │   └── → Central Rack (direct)
            ├── Outlets (wall jacks, faceplates)
            ├── Images (multiple room photos)
            └── Cable Runs (to rack)
```

---

## 🏗️ Detailed Structure

### **1. Building Level**
```
Building
├── Name, Code, Address
├── Central Rack (mandatory for connections)
│   ├── Name: "Central Rack"
│   ├── Location
│   ├── Units (rack size)
│   ├── Devices installed
│   └── Images
└── Floors
```

### **2. Floor Level**
```
Floor
├── Name, Level Number
├── Blueprint URL (BunnyCDN) 📋
├── Similar To Floor? (copy layout from another floor)
├── Images (additional floor photos)
├── Floor Rack (one per floor)
│   ├── Connected to Central Rack ⬆️
│   ├── Name, Code, Units
│   ├── Location on floor
│   ├── Devices
│   └── Images
└── Rooms
```

### **3. Room/Apartment Level**
```
Room
├── Name, Number, Type
├── Floor Plan URL (room-specific) 📋
├── Connection Type:
│   ├── FLOOR_RACK → Connected to floor rack
│   └── CENTRAL_RACK → Connected directly to central rack
├── Outlets (RJ45 jacks, fiber ports)
│   ├── Label (e.g., "FP-101-A")
│   ├── Number of ports
│   └── Connection to rack
├── Images (multiple photos) 📷
│   ├── Room overview
│   ├── Outlet locations
│   ├── Cable routing
│   └── Problem areas
└── Cable Runs (to assigned rack)
```

---

## 🔗 Connection Flow

### **Typical Setup:**
```
┌─────────────────┐
│  Central Rack   │ ← Building level
│   (Main MDF)    │
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┐
    ↓         ↓        ↓        ↓
┌─────────┐ ┌─────────┐ ┌─────────┐
│Floor 1  │ │Floor 2  │ │Floor 3  │
│  Rack   │ │  Rack   │ │  Rack   │
│  (IDF)  │ │  (IDF)  │ │  (IDF)  │
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
  ┌──┴──┬──┐  ┌──┴──┬──┐  ┌──┴──┬──┐
  ↓     ↓  ↓  ↓     ↓  ↓  ↓     ↓  ↓
Room  Room... Room Room... Room Room...
101   102     201  202     301  302
```

### **Alternative: Direct to Central**
```
┌─────────────────┐
│  Central Rack   │
└────────┬────────┘
         │
    ┌────┼────┬────────┬────────┐
    ↓    ↓    ↓        ↓        ↓
  Floor  Room Room   Room     Room
  Rack   201  202    301      302
  (IDF)  (Direct connections)
```

---

## 📋 Blueprint & Floor Plan Management

### **Floor Blueprints:**
- Upload blueprint for each floor
- Mark floors as "similar" to copy layout
- Reduces duplicate data entry
- Example:
  ```
  Floor 1: Original blueprint uploaded
  Floor 2: "Similar to Floor 1" ✓
  Floor 3: "Similar to Floor 1" ✓
  Floor 4: Different layout, upload new blueprint
  ```

### **Room Floor Plans:**
- Each room can have its own floor plan
- Shows outlet placement
- Cable routing within room
- Useful for large apartments or complex rooms

---

## 🖼️ Image Management

### **Multiple Images Per Entity:**

| Entity | Image Types |
|--------|-------------|
| **Building** | Exterior, entrance, general |
| **Central Rack** | Front view, back view, cable management |
| **Floor** | Blueprint, overview, hallways |
| **Floor Rack** | Front view, back view, connections |
| **Room** | Overview, outlets, cable paths, ceiling, walls |

All images uploaded to **BunnyCDN** ☁️

---

## 🎯 Cable Run Tracking

### **Connection Types:**
```
Central Rack → Floor Rack
Floor Rack → Room
Central Rack → Room (direct)
Room → Room (horizontal runs)
```

### **Cable Run Properties:**
- Media: Copper / Fiber
- Category: CAT5E, CAT6, CAT6A, CAT7
- Fiber Type: OS2, OM3, OM4, OM5
- Length in meters
- Test results
- Purpose/notes

---

## 📝 Future Work Requests

Track what customer wants done:

```
Work Request
├── Work Type:
│   ├── NEW_DROP (new cable run)
│   ├── NEW_TRUNK (backbone)
│   ├── UPGRADE (existing cable)
│   ├── MOVE (relocate outlet)
│   ├── RELOCATION (move equipment)
│   └── REPAIR (fix issues)
├── Status: DRAFT → PLANNED → APPROVED → IN_PROGRESS → DONE
├── Priority (1-5)
├── Due Date
├── Location (Building/Floor/Room)
├── Estimate (materials/labor)
└── Notes
```

---

## 🔧 Key Features

### ✅ **Logical Hierarchy**
- Building → Floors → Rooms
- Clear parent-child relationships

### ✅ **Rack Management**
- One central rack per building
- One floor rack per floor
- Floor racks connect to central

### ✅ **Flexible Connections**
- Rooms connect to floor rack (default)
- OR rooms connect directly to central rack
- System tracks all connections

### ✅ **Blueprint Reuse**
- Upload once, reference many times
- "Similar floor" feature saves time
- Consistent layout documentation

### ✅ **Rich Media**
- Multiple images per room
- Floor plans at room level
- Blueprints at floor level
- All stored in BunnyCDN

### ✅ **Future Planning**
- Work requests track customer needs
- Status tracking
- Estimate management
- Priority system

---

## 📊 Example Survey Structure

```
Hotel XYZ - Cabling Survey
│
└── Main Building
    ├── Central Rack (Ground Floor Comms Room)
    │   ├── Core Switch 48-port
    │   ├── Fiber ODF 24-port
    │   └── Patch Panel 96-port
    │
    ├── Ground Floor
    │   ├── Blueprint: ground-floor.pdf ✓
    │   ├── Floor Rack → Connected to Central
    │   ├── Room G01 - Reception → Floor Rack
    │   ├── Room G02 - Lobby → Floor Rack
    │   └── Room G03 - Restaurant → Floor Rack
    │
    ├── Floor 1 (Similar to Floor 2-5) ✓
    │   ├── Blueprint: standard-floor.pdf ✓
    │   ├── Floor Rack → Connected to Central
    │   ├── Room 101 → Floor Rack
    │   ├── Room 102 → Floor Rack
    │   └── ...
    │
    ├── Floor 2 (Similar to Floor 1) ✓
    │   ├── Uses same blueprint as Floor 1
    │   ├── Floor Rack → Connected to Central
    │   └── Rooms 201-220 → Floor Rack
    │
    └── Penthouse Suite (Floor 6)
        ├── Blueprint: penthouse.pdf ✓
        ├── No Floor Rack (direct to central) ✗
        ├── Suite 601 → Central Rack (direct)
        │   ├── Floor Plan: suite-601.pdf
        │   ├── 8x Images (living, bedroom, office, etc.)
        │   └── 12x Outlets
        └── Suite 602 → Central Rack (direct)
```

---

## 🎨 Benefits of New Structure

### **For Surveyors:**
- ✅ Logical, easy to understand hierarchy
- ✅ Clear connection tracking
- ✅ Efficient data entry (similar floors)
- ✅ Visual documentation (blueprints, photos)

### **For Customers:**
- ✅ Clear visualization of network structure
- ✅ Future planning with work requests
- ✅ Professional documentation
- ✅ Excel reports with full details

### **For Installers:**
- ✅ Know exactly what connects where
- ✅ Floor plans show outlet locations
- ✅ Cable routing documented
- ✅ Test results tracked

---

## 🚀 Workflow

1. **Create Building** → Define central rack
2. **Add Floors** → Upload blueprints, mark similar floors
3. **Configure Floor Racks** → Connect to central rack
4. **Add Rooms** → Choose connection type (floor/central)
5. **Document Outlets** → Add faceplates and jacks
6. **Upload Images** → Multiple photos per room
7. **Track Cable Runs** → From room to rack
8. **Record Tests** → Certification results
9. **Plan Future Work** → Customer requests
10. **Export Report** → Professional Excel document

---

**This structure matches real-world cabling installations perfectly!** 🎯

