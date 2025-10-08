import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type PdfSection = { title: string; rows: Array<[string, string]> };

const timelineMap: Record<string, string> = {
  A1: "2–3 weken",
  A2: "3–4 weken",
  A3: "4–6 weken",
  B1: "4–5 weken",
  B2: "5–7 weken",
  C1: "8–12 weken",
};

export function exportPdf(opts: {
  presetName?: string;
  classification: string;
  sections: PdfSection[];
}) {
  const { presetName, classification, sections } = opts;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  let cursorY = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Onboarding Classifier — Samenvatting", marginX, cursorY);
  cursorY += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const dateStr = new Date().toLocaleString();
  doc.text(`Datum: ${dateStr}${presetName ? `   •   Preset: ${presetName}` : ""}`, marginX, cursorY);
  cursorY += 20;

  const tl = timelineMap[classification] || "n.v.t.";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Classificatie & doorlooptijd", marginX, cursorY);
  cursorY += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Classificatie: ${classification}    |    Verwachte doorlooptijd: ${tl}`, marginX, cursorY);
  cursorY += 18;

  sections.forEach((s) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(s.title, marginX, cursorY);
    cursorY += 8;

    autoTable(doc, {
      startY: cursorY + 6,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [17, 24, 39], textColor: 255 },
      columnStyles: { 0: { cellWidth: 180 }, 1: { cellWidth: 280 } },
      head: [["Parameter", "Waarde"]],
      body: s.rows,
      theme: "striped",
    });

    // @ts-ignore – autotable voegt lastAutoTable toe
    cursorY = (doc as any).lastAutoTable.finalY + 16;
  });

  doc.save(`onboarding-classifier-${new Date().toISOString().slice(0,10)}.pdf`);
}
