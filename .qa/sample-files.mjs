/* ==========================================================================
   .qa/sample-files.mjs — builds the test fixtures used by the suite:
   a DOCX with headings/table/list/image, a 3-sheet XLSX (one of them wide),
   a CSV, real PNGs of different sizes, and multi-page PDFs.
   ========================================================================== */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as XLSX from "xlsx";
import zlib from "node:zlib";

/* ---- PNG ---------------------------------------------------------------- */
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** A real, decodable RGB PNG. */
export function makePng(width, height, color = [99, 102, 241]) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0; /* filter: none */
    for (let x = 0; x < width; x++) {
      const o = y * (width * 3 + 1) + 1 + x * 3;
      raw[o] = color[0];
      raw[o + 1] = color[1];
      raw[o + 2] = color[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; /* bit depth */
  ihdr[9] = 2; /* colour type: truecolour */
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---- DOCX --------------------------------------------------------------- */
/* Built with the `docx` package so the fixture is a genuine Word file with a
   real styles part, numbering part and embedded image relationship. */
export async function makeDocx() {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    Table, TableRow, TableCell, WidthType, ImageRun,
  } = await import("docx");

  const cell = (text, bold) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold: !!bold })] })],
    });

  const doc = new Document({
    creator: "FileTools QA",
    title: "Quarterly Report",
    sections: [
      {
        children: [
          new Paragraph({ text: "Quarterly Report", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            children: [
              new TextRun({ text: "Bold lead-in", bold: true }),
              new TextRun({ text: " followed by normal text and an " }),
              new TextRun({ text: "italic", italics: true }),
              new TextRun({ text: " run." }),
            ],
          }),
          new Paragraph({ text: "Key numbers", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: "Revenue grew 18%", bullet: { level: 0 } }),
          new Paragraph({ text: "Costs stayed flat", bullet: { level: 0 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [cell("Region", true), cell("Sales", true)] }),
              new TableRow({ children: [cell("North"), cell("1250")] }),
              new TableRow({ children: [cell("South"), cell("980")] }),
            ],
          }),
          new Paragraph({
            children: [
              new ImageRun({
                type: "png",
                data: makePng(120, 60, [6, 182, 212]),
                transformation: { width: 120, height: 60 },
                altText: { title: "Sales chart", description: "Sales chart", name: "chart" },
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

/* ---- Spreadsheets ------------------------------------------------------- */
export function makeXlsx() {
  const wb = XLSX.utils.book_new();

  const summary = [
    ["Region", "Q1", "Q2", "Q3", "Q4", "Total"],
    ["North", 120, 145, 160, 175, 600],
    ["South", 98, 110, 121, 133, 462],
    ["East", 54, 61, 70, 88, 273],
    ["West", 210, 220, 233, 240, 903],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

  const people = [
    ["Name", "Role", "Start date", "Salary", "City"],
    ["Ada Lovelace", "Engineer", "2019-04-01", 92000, "London"],
    ["Alan Turing", "Researcher", "2020-09-15", 88000, "Manchester"],
    ["Grace Hopper", "Architect", "2018-01-20", 104000, "Arlington"],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(people), "People");

  /* A deliberately wide sheet to exercise the shrink / column-split logic. */
  const wideHeader = ["ID"];
  const wideRow1 = ["row"];
  for (let c = 1; c <= 30; c++) {
    wideHeader.push("Column number " + c);
    wideRow1.push("A fairly long descriptive value for column " + c);
  }
  const wide = [wideHeader];
  for (let r = 1; r <= 40; r++) wide.push([String(r)].concat(wideRow1.slice(1).map((v) => v + " · row " + r)));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wide), "Wide");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export function makeCsv() {
  return Buffer.from(
    "product,units,price\nWidget,120,9.99\nGadget,54,24.5\nDoohickey,12,99\n",
    "utf8"
  );
}

/* ---- PDFs --------------------------------------------------------------- */
export async function makePdf(pageCount, label = "Sample") {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pageCount; i++) {
    const page = i % 3 === 0 ? doc.addPage([612, 396]) : doc.addPage([595.28, 841.89]);
    page.drawText(label + " page " + i, { x: 50, y: page.getHeight() - 80, size: 18, font, color: rgb(0.1, 0.1, 0.2) });
    page.drawText("Lorem ipsum dolor sit amet, consectetur adipiscing elit.", {
      x: 50,
      y: page.getHeight() - 110,
      size: 11,
      font,
    });
  }
  doc.setTitle(label);
  return Buffer.from(await doc.save());
}
