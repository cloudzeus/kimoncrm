import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface VoipSurveyData {
  siteSurvey: {
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
  createdAt: string;
  updatedAt: string;
}

export function generateVoipSurveyPDF(data: VoipSurveyData): jsPDF {
  const doc = new jsPDF();
  
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  const contentWidth = pageWidth - (2 * margin);

  // Helper function to add section
  const addSection = (title: string, content?: string | null) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, yPos);
    yPos += 7;
    
    if (content) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(content, contentWidth);
      doc.text(lines, margin, yPos);
      yPos += (lines.length * 5) + 5;
    } else {
      yPos += 3;
    }
  };

  // Header
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("VOIP SITE SURVEY REPORT", pageWidth / 2, 25, { align: "center" });
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  yPos = 50;

  // Survey Information
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SURVEY INFORMATION", margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Title: ${data.siteSurvey.title}`, margin, yPos);
  yPos += 6;
  doc.text(`Type: ${data.siteSurvey.type}`, margin, yPos);
  yPos += 6;
  doc.text(`Status: ${data.siteSurvey.status}`, margin, yPos);
  yPos += 6;
  
  if (data.siteSurvey.arrangedDate) {
    doc.text(`Arranged Date: ${new Date(data.siteSurvey.arrangedDate).toLocaleString()}`, margin, yPos);
    yPos += 6;
  }

  yPos += 5;
  
  // Customer Information
  addSection("CUSTOMER INFORMATION");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Customer: ${data.siteSurvey.customer.name}`, margin, yPos);
  yPos += 6;
  
  if (data.siteSurvey.contact) {
    doc.text(`Contact: ${data.siteSurvey.contact.name}`, margin, yPos);
    yPos += 6;
  }
  
  if (data.siteSurvey.address) {
    doc.text(`Address: ${data.siteSurvey.address}`, margin, yPos);
    yPos += 6;
  }
  
  if (data.siteSurvey.city) {
    doc.text(`City: ${data.siteSurvey.city}`, margin, yPos);
    yPos += 6;
  }

  yPos += 5;

  // Assignment
  addSection("ASSIGNMENT");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  if (data.siteSurvey.assignFrom) {
    doc.text(`Assigned From: ${data.siteSurvey.assignFrom.name} (${data.siteSurvey.assignFrom.email})`, margin, yPos);
    yPos += 6;
  }
  
  if (data.siteSurvey.assignTo) {
    doc.text(`Assigned To: ${data.siteSurvey.assignTo.name} (${data.siteSurvey.assignTo.email})`, margin, yPos);
    yPos += 6;
  }

  yPos += 10;

  // OLD PBX SYSTEM
  doc.setFillColor(52, 152, 219);
  doc.rect(margin, yPos, contentWidth, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("OLD PBX SYSTEM", margin + 3, yPos + 6);
  doc.setTextColor(0, 0, 0);
  yPos += 12;

  if (data.oldPbxModel) {
    addSection("PBX Model", data.oldPbxModel);
  }

  if (data.oldPbxDescription) {
    addSection("PBX Description", data.oldPbxDescription);
  }

  // PBX Devices Table
  if (data.oldPbxDevices && data.oldPbxDevices.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PBX Devices", margin, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Type", "Model", "Number", "Location"]],
      body: data.oldPbxDevices.map(device => [
        device.type,
        device.model,
        device.number,
        device.location || "-"
      ]),
      theme: "grid",
      headStyles: { fillColor: [52, 152, 219] },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  if (data.cablingStatus) {
    addSection("Cabling Status", data.cablingStatus);
  }

  yPos += 5;

  // PROVIDER INFORMATION
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(46, 204, 113);
  doc.rect(margin, yPos, contentWidth, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PROVIDER INFORMATION", margin + 3, yPos + 6);
  doc.setTextColor(0, 0, 0);
  yPos += 12;

  if (data.providerName) {
    addSection("Provider Name", data.providerName);
  }

  // Provider Lines Table
  if (data.providerLines && data.providerLines.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Provider Lines", margin, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Type", "Lines", "Phone Number"]],
      body: data.providerLines.map(line => [
        line.type,
        line.lines,
        line.phoneNumber || "-"
      ]),
      theme: "grid",
      headStyles: { fillColor: [46, 204, 113] },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // INTERNET
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(155, 89, 182);
  doc.rect(margin, yPos, contentWidth, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("INTERNET CONNECTION", margin + 3, yPos + 6);
  doc.setTextColor(0, 0, 0);
  yPos += 12;

  if (data.internetFeedType) {
    addSection("Feed Type", data.internetFeedType);
  }

  if (data.internetFeedSpeed) {
    addSection("Feed Speed", data.internetFeedSpeed);
  }

  yPos += 5;

  // NETWORK DEVICES
  if (data.networkDevices && data.networkDevices.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(230, 126, 34);
    doc.rect(margin, yPos, contentWidth, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("NETWORK DEVICES", margin + 3, yPos + 6);
    doc.setTextColor(0, 0, 0);
    yPos += 12;

    autoTable(doc, {
      startY: yPos,
      head: [["Type", "Device Name", "Device IP"]],
      body: data.networkDevices.map(device => [
        device.type,
        device.deviceName,
        device.deviceIp || "-"
      ]),
      theme: "grid",
      headStyles: { fillColor: [230, 126, 34] },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${new Date().toLocaleString()} - Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  return doc;
}

export function downloadVoipSurveyPDF(data: VoipSurveyData, filename?: string) {
  const doc = generateVoipSurveyPDF(data);
  const pdfFilename = filename || `VOIP-Survey-${data.siteSurvey.title.replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}.pdf`;
  doc.save(pdfFilename);
}

