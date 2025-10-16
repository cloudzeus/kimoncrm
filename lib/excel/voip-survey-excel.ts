import ExcelJS from "exceljs";

interface VoipSurveyData {
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
  };
  oldPbxModel: string | null;
  oldPbxDescription: string | null;
  oldPbxDevices: Array<{
    type: string;
    model: string;
    number: string;
    location?: string;
  }> | null;
  providerName: string | null;
  providerLines: Array<{
    type: string;
    lines: string;
    phoneNumber?: string;
  }> | null;
  internetFeedType: string | null;
  internetFeedSpeed: string | null;
  networkDevices: Array<{
    type: string;
    deviceName: string;
    deviceIp?: string;
  }> | null;
  cablingStatus: string | null;
  pbxBrand: string | null;
  conChannelsNum: string | null;
  extensionsNum: string | null;
  hotelPms: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function generateVoipSurveyExcel(data: VoipSurveyData): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("VOIP Survey Report");

  // Set column widths
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

  // Helper function to add data row (10px)
  const addDataRow = (label: string, value: string | null | undefined) => {
    if (!value) return;
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = label;
    row.getCell(1).font = { size: 10, bold: true };
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF5F5F5" },
    };
    row.getCell(2).value = value;
    row.getCell(2).font = { size: 10 };
    currentRow++;
  };

  // Helper function to add empty row
  const addEmptyRow = () => {
    currentRow++;
  };

  // Main Header
  addHeader("VOIP SITE SURVEY REPORT");
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

  // OLD PBX SYSTEM
  addHeader("ΠΑΛΑΙΟ ΣΥΣΤΗΜΑ PBX / OLD PBX SYSTEM");
  addEmptyRow();

  if (data.oldPbxModel) {
    addDataRow("Μοντέλο PBX / PBX Model", data.oldPbxModel);
  }
  if (data.oldPbxDescription) {
    addDataRow("Περιγραφή PBX / PBX Description", data.oldPbxDescription);
  }

  // PBX Devices Table
  if (data.oldPbxDevices && data.oldPbxDevices.length > 0) {
    addEmptyRow();
    const headerRow = worksheet.getRow(currentRow);
    headerRow.getCell(1).value = "Τύπος / Type";
    headerRow.getCell(2).value = "Μοντέλο / Model";
    headerRow.getCell(3).value = "Αριθμός / Number";
    headerRow.getCell(4).value = "Τοποθεσία / Location";

    // Adjust columns for this section
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 30;

    // Apply styling only to cells with content (columns 1-4)
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

    data.oldPbxDevices.forEach((device) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = device.type;
      row.getCell(2).value = device.model;
      row.getCell(3).value = device.number;
      row.getCell(4).value = device.location || "-";
      
      // Apply styling only to cells 1-4
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
  }

  if (data.cablingStatus) {
    addEmptyRow();
    addDataRow("Κατάσταση Καλωδίωσης / Cabling Status", data.cablingStatus);
  }

  addEmptyRow();

  // PROVIDER INFORMATION
  addHeader("ΠΛΗΡΟΦΟΡΙΕΣ ΠΑΡΟΧΟΥ / PROVIDER INFORMATION");
  addEmptyRow();

  if (data.providerName) {
    addDataRow("Όνομα Παρόχου / Provider Name", data.providerName);
  }

  // Provider Lines Table
  if (data.providerLines && data.providerLines.length > 0) {
    addEmptyRow();
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 30;

    const headerRow = worksheet.getRow(currentRow);
    headerRow.getCell(1).value = "Τύπος / Type";
    headerRow.getCell(2).value = "Γραμμές / Lines";
    headerRow.getCell(3).value = "Τηλέφωνο / Phone Number";

    // Apply styling only to cells with content (columns 1-3)
    for (let i = 1; i <= 3; i++) {
      headerRow.getCell(i).font = { size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.getCell(i).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2ECC71" },
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

    data.providerLines.forEach((line) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = line.type;
      row.getCell(2).value = line.lines;
      row.getCell(3).value = line.phoneNumber || "-";
      
      // Apply styling only to cells 1-3
      for (let i = 1; i <= 3; i++) {
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
  }

  addEmptyRow();

  // INTERNET CONNECTION
  addHeader("ΣΥΝΔΕΣΗ INTERNET / INTERNET CONNECTION");
  addEmptyRow();

  if (data.internetFeedType) {
    addDataRow("Τύπος Σύνδεσης / Feed Type", data.internetFeedType);
  }
  if (data.internetFeedSpeed) {
    addDataRow("Ταχύτητα / Speed", data.internetFeedSpeed);
  }

  addEmptyRow();

  // NETWORK DEVICES
  if (data.networkDevices && data.networkDevices.length > 0) {
    addHeader("ΣΥΣΚΕΥΕΣ ΔΙΚΤΥΟΥ / NETWORK DEVICES", 3);
    addEmptyRow();

    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 35;
    worksheet.getColumn(3).width = 20;

    const headerRow = worksheet.getRow(currentRow);
    headerRow.getCell(1).value = "Τύπος / Type";
    headerRow.getCell(2).value = "Όνομα Συσκευής / Device Name";
    headerRow.getCell(3).value = "IP Συσκευής / Device IP";

    // Apply styling only to cells with content (columns 1-3)
    for (let i = 1; i <= 3; i++) {
      headerRow.getCell(i).font = { size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.getCell(i).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE67E22" },
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

    data.networkDevices.forEach((device) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = device.type;
      row.getCell(2).value = device.deviceName;
      row.getCell(3).value = device.deviceIp || "-";
      
      // Apply styling only to cells 1-3
      for (let i = 1; i <= 3; i++) {
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
  }

  addEmptyRow();

  // FUTURE REQUEST
  if (data.pbxBrand || data.conChannelsNum || data.extensionsNum || data.hotelPms) {
    addHeader("ΜΕΛΛΟΝΤΙΚΟ ΑΙΤΗΜΑ / FUTURE REQUEST", 2);
    addEmptyRow();

    if (data.pbxBrand) {
      addDataRow("Μάρκα PBX / PBX Brand", data.pbxBrand);
    }
    if (data.conChannelsNum) {
      addDataRow("Αριθμός Ταυτόχρονων Καναλιών / Concurrent Channels Number", data.conChannelsNum);
    }
    if (data.extensionsNum) {
      addDataRow("Αριθμός Εσωτερικών / Extensions Number", data.extensionsNum);
    }
    if (data.hotelPms) {
      addDataRow("Ξενοδοχειακό PMS / Hotel PMS", data.hotelPms);
    }

    addEmptyRow();
  }

  addEmptyRow();

  // Footer
  const footerRow = worksheet.getRow(currentRow);
  footerRow.getCell(1).value = `Δημιουργήθηκε / Generated: ${new Date().toLocaleString("el-GR")}`;
  footerRow.getCell(1).font = { size: 9, italic: true, color: { argb: "FF808080" } };
  // Don't merge footer, just leave it in column 1

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function downloadVoipSurveyExcel(
  data: VoipSurveyData & { id?: string; siteSurvey: { id?: string } & VoipSurveyData["siteSurvey"] },
  filename?: string
) {
  const blob = await generateVoipSurveyExcel(data);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  // Use site survey ID for filename
  const surveyId = data.siteSurvey.id || data.id || "Unknown";
  link.download = filename || `SS-${surveyId}-VOIP-Survey.xlsx`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

