import ExcelJS from "exceljs";

interface CablingSurveyData {
  siteSurvey: {
    id?: string;
    title: string;
    type: string;
    status: string;
    arrangedDate: string | null;
    address: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
    description: string | null;
    customer: {
      name: string;
      email: string | null;
      phone01: string | null;
    };
    contact: {
      name: string;
      email: string | null;
    } | null;
    assignFrom: {
      name: string;
      email: string;
    } | null;
    assignTo: {
      name: string;
      email: string;
    } | null;
    buildings?: Array<{
      name: string;
      code: string | null;
      address: string | null;
      notes: string | null;
      floors?: Array<{
        name: string;
        level: number | null;
        notes: string | null;
        spaces?: Array<{
          name: string;
          number: string | null;
          type: string;
          notes: string | null;
          racks?: Array<{
            name: string;
            code: string | null;
            units: number | null;
            notes: string | null;
          }>;
          devices?: Array<{
            type: string;
            vendor: string | null;
            model: string | null;
            label: string | null;
            serial: string | null;
            mgmtIp: string | null;
            notes: string | null;
          }>;
          outlets?: Array<{
            label: string;
            ports: number;
            notes: string | null;
          }>;
        }>;
      }>;
    }>;
    pathways?: Array<{
      type: string;
      description: string | null;
      notes: string | null;
    }>;
    cableRuns?: Array<{
      code: string | null;
      media: string;
      copperCat: string | null;
      pairCount: number | null;
      fiberType: string | null;
      strandCount: number | null;
      lengthMeters: number | null;
      purpose: string | null;
      notes: string | null;
      tests?: Array<{
        standard: string;
        result: string;
        notes: string | null;
        measuredAt: string;
      }>;
    }>;
  };
  generalNotes: string | null;
  projectScope: string | null;
  standards: string[] | null;
  totalCableRuns: number | null;
  totalOutlets: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function generateCablingSurveyExcel(data: CablingSurveyData): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Cabling Survey Report");

  // Set default column widths
  worksheet.columns = [
    { width: 25 },
    { width: 50 },
  ];

  let currentRow = 1;

  // Helper function to add header (14px, bold, blue background)
  const addHeader = (text: string, colSpan: number = 2) => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = text;
    row.getCell(1).font = { size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2980B9" },
    };
    row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
    row.height = 25;
    if (colSpan > 1) {
      worksheet.mergeCells(currentRow, 1, currentRow, colSpan);
    }
    currentRow++;
  };

  // Helper function to add section header (12px, bold)
  const addSectionHeader = (text: string, colSpan: number = 2) => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = text;
    row.getCell(1).font = { size: 12, bold: true };
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8F4F8" },
    };
    row.height = 20;
    if (colSpan > 1) {
      worksheet.mergeCells(currentRow, 1, currentRow, colSpan);
    }
    currentRow++;
  };

  // Helper function to add subsection header (11px, bold, lighter background)
  const addSubsectionHeader = (text: string, colSpan: number = 2) => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = text;
    row.getCell(1).font = { size: 11, bold: true };
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F8FF" },
    };
    row.height = 18;
    if (colSpan > 1) {
      worksheet.mergeCells(currentRow, 1, currentRow, colSpan);
    }
    currentRow++;
  };

  // Helper function to add data row (10px)
  const addDataRow = (label: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined) return;
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = label;
    row.getCell(1).font = { size: 10, bold: true };
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF5F5F5" },
    };
    row.getCell(2).value = String(value);
    row.getCell(2).font = { size: 10 };
    currentRow++;
  };

  // Helper function to add empty row
  const addEmptyRow = () => {
    currentRow++;
  };

  // Main Header
  addHeader("CABLING SITE SURVEY REPORT");
  addEmptyRow();

  // Survey Information Section
  addSectionHeader("ΠΛΗΡΟΦΟΡΙΕΣ ΕΠΙΣΚΟΠΗΣΗΣ / SURVEY INFORMATION");
  addDataRow("Τίτλος / Title", data.siteSurvey.title);
  addDataRow("Τύπος / Type", data.siteSurvey.type);
  addDataRow("Κατάσταση / Status", data.siteSurvey.status);
  if (data.siteSurvey.arrangedDate) {
    addDataRow(
      "Ημερομηνία / Arranged Date",
      new Date(data.siteSurvey.arrangedDate).toLocaleString("el-GR")
    );
  }
  if (data.siteSurvey.description) {
    addDataRow("Περιγραφή / Description", data.siteSurvey.description);
  }
  addEmptyRow();

  // Customer Information
  addSectionHeader("ΠΛΗΡΟΦΟΡΙΕΣ ΠΕΛΑΤΗ / CUSTOMER INFORMATION");
  addDataRow("Πελάτης / Customer", data.siteSurvey.customer.name);
  if (data.siteSurvey.contact) {
    addDataRow("Επαφή / Contact", data.siteSurvey.contact.name);
    if (data.siteSurvey.contact.email) {
      addDataRow("Email Επαφής / Contact Email", data.siteSurvey.contact.email);
    }
  }
  if (data.siteSurvey.address) {
    addDataRow("Διεύθυνση / Address", data.siteSurvey.address);
  }
  if (data.siteSurvey.city) {
    addDataRow("Πόλη / City", data.siteSurvey.city);
  }
  if (data.siteSurvey.phone) {
    addDataRow("Τηλέφωνο / Phone", data.siteSurvey.phone);
  }
  addEmptyRow();

  // Assignment
  addSectionHeader("ΑΝΑΘΕΣΗ / ASSIGNMENT");
  if (data.siteSurvey.assignFrom) {
    addDataRow(
      "Ανατέθηκε Από / Assigned From",
      `${data.siteSurvey.assignFrom.name} (${data.siteSurvey.assignFrom.email})`
    );
  }
  if (data.siteSurvey.assignTo) {
    addDataRow(
      "Ανατέθηκε Σε / Assigned To",
      `${data.siteSurvey.assignTo.name} (${data.siteSurvey.assignTo.email})`
    );
  }
  addEmptyRow();

  // PROJECT OVERVIEW
  addHeader("ΕΠΙΣΚΟΠΗΣΗ ΕΡΓΟΥ / PROJECT OVERVIEW");
  addEmptyRow();

  if (data.projectScope) {
    addDataRow("Σκοπός Έργου / Project Scope", data.projectScope);
  }
  if (data.generalNotes) {
    addDataRow("Γενικές Σημειώσεις / General Notes", data.generalNotes);
  }
  if (data.standards && data.standards.length > 0) {
    addDataRow("Πρότυπα / Standards", data.standards.join(", "));
  }
  if (data.totalCableRuns) {
    addDataRow("Σύνολο Καλωδιώσεων / Total Cable Runs", data.totalCableRuns);
  }
  if (data.totalOutlets) {
    addDataRow("Σύνολο Πριζών / Total Outlets", data.totalOutlets);
  }
  addEmptyRow();

  // BUILDINGS & INFRASTRUCTURE
  if (data.siteSurvey.buildings && data.siteSurvey.buildings.length > 0) {
    addHeader("ΚΤΙΡΙΑ & ΥΠΟΔΟΜΗ / BUILDINGS & INFRASTRUCTURE");
    addEmptyRow();

    data.siteSurvey.buildings.forEach((building, bIdx) => {
      addSectionHeader(`ΚΤΙΡΙΟ ${bIdx + 1} / BUILDING ${bIdx + 1}: ${building.name}`);
      addDataRow("Όνομα Κτιρίου / Building Name", building.name);
      if (building.code) {
        addDataRow("Κωδικός / Code", building.code);
      }
      if (building.address) {
        addDataRow("Διεύθυνση / Address", building.address);
      }
      if (building.notes) {
        addDataRow("Σημειώσεις / Notes", building.notes);
      }
      addEmptyRow();

      // Floors
      if (building.floors && building.floors.length > 0) {
        building.floors.forEach((floor, fIdx) => {
          addSubsectionHeader(`  ΟΡΟΦΟΣ ${fIdx + 1} / FLOOR ${fIdx + 1}: ${floor.name}`);
          addDataRow("    Όνομα Ορόφου / Floor Name", floor.name);
          if (floor.level !== null) {
            addDataRow("    Επίπεδο / Level", floor.level);
          }
          if (floor.notes) {
            addDataRow("    Σημειώσεις / Notes", floor.notes);
          }
          addEmptyRow();

          // Spaces
          if (floor.spaces && floor.spaces.length > 0) {
            floor.spaces.forEach((space, sIdx) => {
              const spaceLabel = `      ΧΩΡΟΣ ${sIdx + 1} / SPACE ${sIdx + 1}: ${space.name}`;
              const row = worksheet.getRow(currentRow);
              row.getCell(1).value = spaceLabel;
              row.getCell(1).font = { size: 10, bold: true, italic: true };
              row.getCell(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFAFAFA" },
              };
              worksheet.mergeCells(currentRow, 1, currentRow, 2);
              currentRow++;

              addDataRow("        Όνομα Χώρου / Space Name", space.name);
              if (space.number) {
                addDataRow("        Αριθμός / Number", space.number);
              }
              addDataRow("        Τύπος / Type", space.type);
              if (space.notes) {
                addDataRow("        Σημειώσεις / Notes", space.notes);
              }

              // Racks
              if (space.racks && space.racks.length > 0) {
                addEmptyRow();
                const racksRow = worksheet.getRow(currentRow);
                racksRow.getCell(1).value = "          RACKS";
                racksRow.getCell(1).font = { size: 9, bold: true, underline: true };
                worksheet.mergeCells(currentRow, 1, currentRow, 2);
                currentRow++;

                space.racks.forEach((rack, rIdx) => {
                  addDataRow(`          Rack ${rIdx + 1}: ${rack.name}`, `Code: ${rack.code || "N/A"}, Units: ${rack.units || "N/A"}`);
                  if (rack.notes) {
                    addDataRow("            Σημειώσεις / Notes", rack.notes);
                  }
                });
              }

              // Devices
              if (space.devices && space.devices.length > 0) {
                addEmptyRow();
                const devicesRow = worksheet.getRow(currentRow);
                devicesRow.getCell(1).value = "          ΣΥΣΚΕΥΕΣ / DEVICES";
                devicesRow.getCell(1).font = { size: 9, bold: true, underline: true };
                worksheet.mergeCells(currentRow, 1, currentRow, 2);
                currentRow++;

                space.devices.forEach((device, dIdx) => {
                  const deviceInfo = `${device.type}${device.vendor ? ` - ${device.vendor}` : ""}${device.model ? ` ${device.model}` : ""}`;
                  addDataRow(`          Device ${dIdx + 1}`, deviceInfo);
                  if (device.label) {
                    addDataRow("            Ετικέτα / Label", device.label);
                  }
                  if (device.serial) {
                    addDataRow("            S/N", device.serial);
                  }
                  if (device.mgmtIp) {
                    addDataRow("            Management IP", device.mgmtIp);
                  }
                  if (device.notes) {
                    addDataRow("            Σημειώσεις / Notes", device.notes);
                  }
                });
              }

              // Outlets
              if (space.outlets && space.outlets.length > 0) {
                addEmptyRow();
                const outletsRow = worksheet.getRow(currentRow);
                outletsRow.getCell(1).value = "          ΠΡΙΖΕΣ / OUTLETS";
                outletsRow.getCell(1).font = { size: 9, bold: true, underline: true };
                worksheet.mergeCells(currentRow, 1, currentRow, 2);
                currentRow++;

                space.outlets.forEach((outlet) => {
                  addDataRow(`          ${outlet.label}`, `Ports: ${outlet.ports}`);
                  if (outlet.notes) {
                    addDataRow("            Σημειώσεις / Notes", outlet.notes);
                  }
                });
              }

              addEmptyRow();
            });
          }
        });
      }
    });
  }

  // PATHWAYS
  if (data.siteSurvey.pathways && data.siteSurvey.pathways.length > 0) {
    addHeader("ΔΙΑΔΡΟΜΕΣ ΚΑΛΩΔΙΩΣΗΣ / CABLE PATHWAYS");
    addEmptyRow();

    // Reset columns to 4 for table
    worksheet.getColumn(1).width = 10;
    worksheet.getColumn(2).width = 25;
    worksheet.getColumn(3).width = 40;
    worksheet.getColumn(4).width = 40;

    const headerRow = worksheet.getRow(currentRow);
    headerRow.getCell(1).value = "#";
    headerRow.getCell(2).value = "Τύπος / Type";
    headerRow.getCell(3).value = "Περιγραφή / Description";
    headerRow.getCell(4).value = "Σημειώσεις / Notes";

    for (let i = 1; i <= 4; i++) {
      headerRow.getCell(i).font = { size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.getCell(i).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF3498DB" },
      };
      headerRow.getCell(i).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
    headerRow.height = 20;
    currentRow++;

    data.siteSurvey.pathways.forEach((pathway, index) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = index + 1;
      row.getCell(2).value = pathway.type;
      row.getCell(3).value = pathway.description || "-";
      row.getCell(4).value = pathway.notes || "-";

      for (let i = 1; i <= 4; i++) {
        row.getCell(i).font = { size: 9 };
        row.getCell(i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
      currentRow++;
    });

    // Reset columns
    worksheet.getColumn(1).width = 25;
    worksheet.getColumn(2).width = 50;
    addEmptyRow();
  }

  // CABLE RUNS
  if (data.siteSurvey.cableRuns && data.siteSurvey.cableRuns.length > 0) {
    addHeader("ΚΑΛΩΔΙΩΣΕΙΣ / CABLE RUNS");
    addEmptyRow();

    data.siteSurvey.cableRuns.forEach((cableRun, index) => {
      addSectionHeader(`ΚΑΛΩΔΙΩΣΗ ${index + 1} / CABLE RUN ${index + 1}${cableRun.code ? `: ${cableRun.code}` : ""}`);
      
      if (cableRun.code) {
        addDataRow("Κωδικός / Code", cableRun.code);
      }
      addDataRow("Μέσο / Media", cableRun.media);

      if (cableRun.media === "COPPER") {
        if (cableRun.copperCat) {
          addDataRow("Κατηγορία / Category", cableRun.copperCat);
        }
        if (cableRun.pairCount) {
          addDataRow("Αριθμός Ζευγών / Pair Count", cableRun.pairCount);
        }
      } else if (cableRun.media === "FIBER") {
        if (cableRun.fiberType) {
          addDataRow("Τύπος Οπτικής / Fiber Type", cableRun.fiberType);
        }
        if (cableRun.strandCount) {
          addDataRow("Αριθμός Ινών / Strand Count", cableRun.strandCount);
        }
      }

      if (cableRun.lengthMeters) {
        addDataRow("Μήκος (μ) / Length (m)", cableRun.lengthMeters);
      }
      if (cableRun.purpose) {
        addDataRow("Σκοπός / Purpose", cableRun.purpose);
      }
      if (cableRun.notes) {
        addDataRow("Σημειώσεις / Notes", cableRun.notes);
      }

      // Tests for this cable run
      if (cableRun.tests && cableRun.tests.length > 0) {
        addEmptyRow();
        addSubsectionHeader("  ΔΟΚΙΜΕΣ / TESTS");

        // Reset columns to 5 for test table
        worksheet.getColumn(1).width = 8;
        worksheet.getColumn(2).width = 20;
        worksheet.getColumn(3).width = 15;
        worksheet.getColumn(4).width = 25;
        worksheet.getColumn(5).width = 40;

        const testHeaderRow = worksheet.getRow(currentRow);
        testHeaderRow.getCell(1).value = "#";
        testHeaderRow.getCell(2).value = "Πρότυπο / Standard";
        testHeaderRow.getCell(3).value = "Αποτέλεσμα / Result";
        testHeaderRow.getCell(4).value = "Ημερομηνία / Date";
        testHeaderRow.getCell(5).value = "Σημειώσεις / Notes";

        for (let i = 1; i <= 5; i++) {
          testHeaderRow.getCell(i).font = { size: 9, bold: true, color: { argb: "FFFFFFFF" } };
          testHeaderRow.getCell(i).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF27AE60" },
          };
          testHeaderRow.getCell(i).border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }
        testHeaderRow.height = 18;
        currentRow++;

        cableRun.tests.forEach((test, tIdx) => {
          const testRow = worksheet.getRow(currentRow);
          testRow.getCell(1).value = tIdx + 1;
          testRow.getCell(2).value = test.standard;
          testRow.getCell(3).value = test.result;
          testRow.getCell(4).value = new Date(test.measuredAt).toLocaleString("el-GR");
          testRow.getCell(5).value = test.notes || "-";

          // Apply result color
          let resultColor = "FF27AE60"; // Green for PASS
          if (test.result === "FAIL") {
            resultColor = "FFE74C3C"; // Red
          } else if (test.result === "MARGINAL") {
            resultColor = "FFF39C12"; // Orange
          }

          testRow.getCell(3).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: resultColor },
          };
          testRow.getCell(3).font = { size: 9, bold: true, color: { argb: "FFFFFFFF" } };

          for (let i = 1; i <= 5; i++) {
            if (i !== 3) {
              testRow.getCell(i).font = { size: 9 };
            }
            testRow.getCell(i).border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          }
          currentRow++;
        });

        // Reset columns
        worksheet.getColumn(1).width = 25;
        worksheet.getColumn(2).width = 50;
      }

      addEmptyRow();
    });
  }

  // Footer - Timestamps
  addEmptyRow();
  addSectionHeader("ΧΡΟΝΙΚΑ ΣΤΟΙΧΕΙΑ / TIMESTAMPS");
  addDataRow(
    "Δημιουργήθηκε / Created",
    new Date(data.createdAt).toLocaleString("el-GR")
  );
  addDataRow(
    "Ενημερώθηκε / Updated",
    new Date(data.updatedAt).toLocaleString("el-GR")
  );

  // Generate blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function downloadCablingSurveyExcel(data: CablingSurveyData) {
  const blob = await generateCablingSurveyExcel(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Cabling_Survey_${data.siteSurvey.title.replace(/\s+/g, "_")}_${
    new Date().toISOString().split("T")[0]
  }.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

