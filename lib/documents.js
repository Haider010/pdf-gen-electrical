import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function parseMarkdown(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => line || lines[index - 1]);
}

export async function createWordBuffer(markdown) {
  const children = parseMarkdown(markdown).flatMap((line) => {
    if (!line) {
      return [new Paragraph({ text: "" })];
    }

    if (line.startsWith("# ")) {
      return [
        new Paragraph({
          text: line.replace("# ", ""),
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 280 },
        }),
      ];
    }

    if (line.startsWith("## ")) {
      return [
        new Paragraph({
          text: line.replace("## ", ""),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 120 },
        }),
      ];
    }

    if (line.startsWith("- ")) {
      return [
        new Paragraph({
          text: line.replace("- ", ""),
          bullet: { level: 0 },
          spacing: { after: 80 },
        }),
      ];
    }

    return [
      new Paragraph({
        children: [new TextRun(line)],
        spacing: { after: 120 },
      }),
    ];
  });

  const doc = new Document({
    creator: "Electrical Proposal MVP",
    sections: [
      {
        properties: {
          page: {
            margin: { top: 900, right: 900, bottom: 900, left: 900 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

export async function createPdfBuffer(markdown) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize = [612, 792];
  const margin = 56;
  const maxWidth = pageSize[0] - margin * 2;
  let page = pdf.addPage(pageSize);
  let y = pageSize[1] - margin;

  const addPageIfNeeded = (height = 18) => {
    if (y - height < margin) {
      page = pdf.addPage(pageSize);
      y = pageSize[1] - margin;
    }
  };

  for (const rawLine of parseMarkdown(markdown)) {
    const line = rawLine.trim();
    if (!line) {
      y -= 8;
      continue;
    }

    const isTitle = line.startsWith("# ");
    const isHeading = line.startsWith("## ");
    const isBullet = line.startsWith("- ");
    const text = line.replace(/^#{1,2}\s/, "").replace(/^- /, isBullet ? "- " : "");
    const font = isTitle || isHeading ? bold : regular;
    const size = isTitle ? 18 : isHeading ? 13 : 10.5;
    const lineHeight = isTitle ? 24 : isHeading ? 19 : 15;
    const lines = wrapText(text, font, size, maxWidth);

    addPageIfNeeded(lines.length * lineHeight + 8);
    if (isHeading) y -= 8;

    for (const wrapped of lines) {
      page.drawText(wrapped, {
        x: margin,
        y,
        size,
        font,
        color: rgb(0.08, 0.1, 0.12),
      });
      y -= lineHeight;
    }

    y -= isTitle ? 10 : isHeading ? 4 : 3;
  }

  return Buffer.from(await pdf.save());
}
