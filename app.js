const form = document.querySelector("#label-form");
const labelTemplateSelect = document.querySelector("#label-template");
const borderStyleSelect = document.querySelector("#border-style");
const labelFontSelect = document.querySelector("#label-font");
const labelHeadingInput = document.querySelector("#label-heading");
const resetHeadingButton = document.querySelector("#reset-heading-button");
const spiceOptions = document.querySelector("#spice-options");
const customSpiceInput = document.querySelector("#custom-spice");
const addSpiceButton = document.querySelector("#add-spice-button");
const selectionCount = document.querySelector("#selection-count");
const message = document.querySelector("#form-message");
const previewGrid = document.querySelector("#preview-grid");
const dimension = document.querySelector("#dimension");
const templateNote = document.querySelector("#template-note");
const printTipText = document.querySelector("#print-tip-text");
const renderCanvas = document.createElement("canvas");

const POINTS_PER_INCH = 72;
const A4_WIDTH = (210 / 25.4) * POINTS_PER_INCH;
const A4_HEIGHT = (297 / 25.4) * POINTS_PER_INCH;
const MAX_SPICES = 100;
const LABEL_HEADING_STORAGE_KEY = "mason-spices.label-heading";
const DEFAULT_LABEL_HEADING = labelHeadingInput.defaultValue;
const LABEL_FONTS = {
  classic: {
    family: "Fraunces, Georgia, serif",
    face: "700 16px Fraunces",
    weight: 700,
  },
  geometric: {
    family: "Montserrat, Arial, sans-serif",
    face: "700 16px Montserrat",
    weight: 700,
  },
};
const LABEL_TEMPLATES = {
  "plain-a4": {
    name: "Plain A4",
    width: 60 / 25.4,
    height: 40 / 25.4,
    columns: 3,
    rows: 6,
    left: 20 / 25.4,
    top: 20 / 25.4,
    horizontalPitch: 64 / 25.4,
    verticalPitch: 44 / 25.4,
    pageWidth: A4_WIDTH,
    pageHeight: A4_HEIGHT,
    cutOffset: 2 / 25.4,
    originalDesign: true,
    size: "60 × 40 mm",
    paper: "A4",
  },
  l7159: {
    name: "Avery L7159",
    width: 63.5 / 25.4,
    height: 33.9 / 25.4,
    columns: 3,
    rows: 8,
    left: 7.25 / 25.4,
    top: 12.9 / 25.4,
    horizontalPitch: 66 / 25.4,
    verticalPitch: 33.9 / 25.4,
    pageWidth: A4_WIDTH,
    pageHeight: A4_HEIGHT,
    size: "63.5 × 33.9 mm",
    paper: "A4",
  },
  l7160: {
    name: "Avery L7160",
    width: 63.5 / 25.4,
    height: 38.1 / 25.4,
    columns: 3,
    rows: 7,
    left: 7.25 / 25.4,
    top: 15.15 / 25.4,
    horizontalPitch: 66 / 25.4,
    verticalPitch: 38.1 / 25.4,
    pageWidth: A4_WIDTH,
    pageHeight: A4_HEIGHT,
    size: "63.5 × 38.1 mm",
    paper: "A4",
  },
  l7161: {
    name: "Avery L7161",
    width: 63.5 / 25.4,
    height: 46.6 / 25.4,
    columns: 3,
    rows: 6,
    left: 7.25 / 25.4,
    top: 8.7 / 25.4,
    horizontalPitch: 66 / 25.4,
    verticalPitch: 46.6 / 25.4,
    pageWidth: A4_WIDTH,
    pageHeight: A4_HEIGHT,
    size: "63.5 × 46.6 mm",
    paper: "A4",
  },
  l7162: {
    name: "Avery L7162",
    width: 99.1 / 25.4,
    height: 33.9 / 25.4,
    columns: 2,
    rows: 8,
    left: 4.65 / 25.4,
    top: 12.9 / 25.4,
    horizontalPitch: 101.6 / 25.4,
    verticalPitch: 33.9 / 25.4,
    pageWidth: A4_WIDTH,
    pageHeight: A4_HEIGHT,
    size: "99.1 × 33.9 mm",
    paper: "A4",
  },
  l7163: {
    name: "Avery L7163",
    width: 99.1 / 25.4,
    height: 38.1 / 25.4,
    columns: 2,
    rows: 7,
    left: 4.65 / 25.4,
    top: 15.15 / 25.4,
    horizontalPitch: 101.6 / 25.4,
    verticalPitch: 38.1 / 25.4,
    pageWidth: A4_WIDTH,
    pageHeight: A4_HEIGHT,
    size: "99.1 × 38.1 mm",
    paper: "A4",
  },
  l7165: {
    name: "Avery L7165",
    width: 99.1 / 25.4,
    height: 67.7 / 25.4,
    columns: 2,
    rows: 4,
    left: 4.65 / 25.4,
    top: 13.1 / 25.4,
    horizontalPitch: 101.6 / 25.4,
    verticalPitch: 67.7 / 25.4,
    pageWidth: A4_WIDTH,
    pageHeight: A4_HEIGHT,
    size: "99.1 × 67.7 mm",
    paper: "A4",
  },
  l4774: {
    name: "Avery L4774-20",
    width: 139 / 25.4,
    height: 99.1 / 25.4,
    columns: 2,
    rows: 2,
    left: 9.5 / 25.4,
    top: 4.63 / 25.4,
    horizontalPitch: 139 / 25.4,
    verticalPitch: 101.64 / 25.4,
    pageWidth: A4_HEIGHT,
    pageHeight: A4_WIDTH,
    size: "139 × 99.1 mm",
    paper: "A4 landscape",
  },
};
const DEFAULT_SPICES = [
  "Cumin Powder",
  "Cumin Seeds",
  "Ginger Powder",
  "Cardamom Pods",
  "Garlic Powder",
  "Mexican Oregano",
  "Oregano",
  "Ground Coriander",
  "Coriander Seeds",
  "Cinnamon Sticks",
  "Ground Cumin",
  "Sesame Seeds",
  "Nutritional Yeast",
];

function currentTemplate() {
  return LABEL_TEMPLATES[labelTemplateSelect.value];
}

function loadLabelFont(fontStyle) {
  const font = LABEL_FONTS[fontStyle] || LABEL_FONTS.classic;
  return document.fonts.load(font.face);
}

function updateHeadingResetButton() {
  resetHeadingButton.disabled =
    labelHeadingInput.value === DEFAULT_LABEL_HEADING;
}

function restoreSavedHeading() {
  const savedHeading = localStorage.getItem(LABEL_HEADING_STORAGE_KEY);

  if (savedHeading !== null) {
    labelHeadingInput.value = savedHeading.slice(0, labelHeadingInput.maxLength);
  }

  updateHeadingResetButton();
}

function saveHeading() {
  if (labelHeadingInput.value === DEFAULT_LABEL_HEADING) {
    localStorage.removeItem(LABEL_HEADING_STORAGE_KEY);
  } else {
    localStorage.setItem(LABEL_HEADING_STORAGE_KEY, labelHeadingInput.value);
  }

  updateHeadingResetButton();
}

function resetHeading() {
  localStorage.removeItem(LABEL_HEADING_STORAGE_KEY);
  labelHeadingInput.value = DEFAULT_LABEL_HEADING;
  updateHeadingResetButton();
  updateSelection();
  labelHeadingInput.focus();
}

function fitText(
  context,
  text,
  maxWidth,
  startingSize,
  minimumSize,
  fontFamily = "Fraunces, Georgia, serif",
  fontWeight = 700,
) {
  let size = startingSize;

  do {
    context.font = `${fontWeight} ${size}px ${fontFamily}`;
    if (context.measureText(text).width <= maxWidth) {
      return size;
    }
    size -= 2;
  } while (size > minimumSize);

  return size;
}

function drawCorner(context, x, y, size, horizontalDirection, verticalDirection) {
  context.beginPath();
  context.moveTo(x + horizontalDirection * size, y);
  context.quadraticCurveTo(x, y, x, y + verticalDirection * size);
  context.stroke();

  context.beginPath();
  context.arc(
    x + horizontalDirection * size * 0.42,
    y + verticalDirection * size * 0.42,
    size * 0.12,
    0,
    Math.PI * 2,
  );
  context.fill();
}

function drawLeaf(context, x, y, size, angle) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.beginPath();
  context.moveTo(0, 0);
  context.quadraticCurveTo(size * 0.55, -size * 0.42, size, 0);
  context.quadraticCurveTo(size * 0.55, size * 0.42, 0, 0);
  context.fill();
  context.restore();
}

function drawFlower(context, x, y, size) {
  for (let petal = 0; petal < 6; petal += 1) {
    const angle = (Math.PI * 2 * petal) / 6;
    context.beginPath();
    context.arc(
      x + Math.cos(angle) * size * 0.42,
      y + Math.sin(angle) * size * 0.42,
      size * 0.3,
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  context.fillStyle = "#354332";
  context.beginPath();
  context.arc(x, y, size * 0.22, 0, Math.PI * 2);
  context.fill();
}

function drawHeart(context, x, y, size) {
  context.beginPath();
  context.moveTo(x, y + size * 0.35);
  context.bezierCurveTo(
    x - size,
    y - size * 0.25,
    x - size * 0.55,
    y - size,
    x,
    y - size * 0.42,
  );
  context.bezierCurveTo(
    x + size * 0.55,
    y - size,
    x + size,
    y - size * 0.25,
    x,
    y + size * 0.35,
  );
  context.fill();
}

function drawCornerMotif(context, width, height, motif) {
  const shortSide = Math.min(width, height);
  const inset = shortSide * 0.07;
  const size = shortSide * 0.075;
  const lineWidth = Math.max(2, shortSide * 0.005);
  const corners = [
    [inset, inset, 1, 1],
    [width - inset, inset, -1, 1],
    [inset, height - inset, 1, -1],
    [width - inset, height - inset, -1, -1],
  ];

  context.strokeStyle = "#354332";
  context.fillStyle = "#b65b3f";
  context.lineWidth = lineWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.setLineDash([]);

  corners.forEach(([x, y, horizontalDirection, verticalDirection]) => {
    context.save();
    context.translate(x, y);
    context.scale(horizontalDirection, verticalDirection);

    if (motif === "flowers") {
      context.beginPath();
      context.moveTo(0, size * 1.65);
      context.quadraticCurveTo(size * 0.45, size, size * 1.25, size * 0.48);
      context.stroke();
      drawLeaf(context, size * 0.45, size * 1.05, size * 0.65, -0.5);
      context.fillStyle = "#b65b3f";
      drawFlower(context, size * 1.35, size * 0.42, size * 0.55);
    }

    if (motif === "hearts") {
      drawHeart(context, size * 0.72, size * 0.75, size * 0.58);
      context.fillStyle = "#354332";
      context.beginPath();
      context.arc(size * 1.55, size * 0.72, size * 0.1, 0, Math.PI * 2);
      context.fill();
    }

    if (motif === "herbs") {
      context.beginPath();
      context.moveTo(0, size * 1.75);
      context.lineTo(size * 1.6, size * 0.15);
      context.stroke();
      context.fillStyle = "#60705a";
      drawLeaf(context, size * 0.48, size * 1.22, size * 0.68, -0.78);
      drawLeaf(context, size * 0.78, size * 0.92, size * 0.68, 2.35);
      drawLeaf(context, size * 1.08, size * 0.62, size * 0.68, -0.78);
    }

    if (motif === "peppercorns") {
      context.beginPath();
      context.moveTo(0, size * 1.65);
      context.quadraticCurveTo(size * 0.6, size * 0.7, size * 1.35, size * 0.4);
      context.stroke();
      context.fillStyle = "#354332";
      [
        [0.95, 0.48],
        [1.25, 0.72],
        [1.5, 0.42],
        [1.45, 0.95],
        [1.75, 0.72],
      ].forEach(([pepperX, pepperY]) => {
        context.beginPath();
        context.arc(
          size * pepperX,
          size * pepperY,
          size * 0.18,
          0,
          Math.PI * 2,
        );
        context.fill();
      });
    }

    if (motif === "vines") {
      context.beginPath();
      context.moveTo(0, size * 1.7);
      context.bezierCurveTo(
        size * 0.3,
        size * 0.7,
        size * 1.15,
        size * 1.45,
        size * 1.65,
        size * 0.25,
      );
      context.stroke();
      context.fillStyle = "#60705a";
      drawLeaf(context, size * 0.38, size * 1.12, size * 0.55, -0.5);
      drawLeaf(context, size * 0.9, size * 1.05, size * 0.55, 2.55);
      drawLeaf(context, size * 1.3, size * 0.65, size * 0.55, -0.7);
    }

    if (motif === "starbursts") {
      context.save();
      context.translate(size * 0.9, size * 0.82);
      for (let ray = 0; ray < 8; ray += 1) {
        context.rotate(Math.PI / 4);
        context.beginPath();
        context.moveTo(size * 0.35, 0);
        context.lineTo(size * 0.72, 0);
        context.stroke();
      }
      context.restore();
      context.fillStyle = "#b65b3f";
      context.beginPath();
      context.arc(size * 0.9, size * 0.82, size * 0.2, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
  });
}

function drawBorder(context, width, height, style) {
  const shortSide = Math.min(width, height);
  const outerInset = Math.max(12, shortSide * 0.05);
  const innerInset = Math.max(20, shortSide * 0.09);
  const outerLine = Math.max(3, shortSide * 0.014);
  const accentLine = Math.max(2, shortSide * 0.006);

  context.strokeStyle = "#354332";
  context.fillStyle = "#b65b3f";
  context.lineWidth = outerLine;
  context.setLineDash([]);

  if (
    ["flowers", "hearts", "herbs", "peppercorns", "vines", "starbursts"].includes(
      style,
    )
  ) {
    context.lineWidth = accentLine;
    context.strokeRect(
      innerInset,
      innerInset,
      width - innerInset * 2,
      height - innerInset * 2,
    );
    drawCornerMotif(context, width, height, style);
    return;
  }

  if (style === "simple") {
    context.strokeRect(
      outerInset,
      outerInset,
      width - outerInset * 2,
      height - outerInset * 2,
    );
    return;
  }

  if (style === "corners") {
    const cornerSize = Math.min(shortSide * 0.2, width * 0.09);
    context.lineWidth = accentLine;
    drawCorner(context, innerInset, innerInset, cornerSize, 1, 1);
    drawCorner(context, width - innerInset, innerInset, cornerSize, -1, 1);
    drawCorner(context, innerInset, height - innerInset, cornerSize, 1, -1);
    drawCorner(
      context,
      width - innerInset,
      height - innerInset,
      cornerSize,
      -1,
      -1,
    );
    return;
  }

  if (style === "dotted") {
    context.lineWidth = accentLine;
    context.setLineDash([accentLine, accentLine * 2.3]);
    context.strokeRect(
      outerInset,
      outerInset,
      width - outerInset * 2,
      height - outerInset * 2,
    );
    context.setLineDash([]);
    return;
  }

  context.strokeRect(
    outerInset,
    outerInset,
    width - outerInset * 2,
    height - outerInset * 2,
  );
  context.strokeStyle = "#b65b3f";
  context.lineWidth = accentLine;
  context.strokeRect(
    innerInset,
    innerInset,
    width - innerInset * 2,
    height - innerInset * 2,
  );
}

function sizeCanvas(canvas, template) {
  canvas.width = 1200;
  canvas.height = Math.round(1200 * (template.height / template.width));
}

function drawLabel(
  canvas,
  name = "",
  heading = "MASON'S FINE SPICES",
  borderStyle = "classic",
  template = currentTemplate(),
  fontStyle = "classic",
) {
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const shortSide = Math.min(width, height);
  const displayName = name.trim() || "Your Spice";
  const displayHeading = heading.trim() || "MASON'S FINE SPICES";
  const compact = height / width < 0.35;
  const nameFont = LABEL_FONTS[fontStyle] || LABEL_FONTS.classic;

  context.fillStyle = "#fffaf0";
  context.fillRect(0, 0, width, height);

  if (template.originalDesign && borderStyle === "classic") {
    context.strokeStyle = "#354332";
    context.lineWidth = width * (8 / 900);
    context.strokeRect(
      width * (18 / 900),
      height * (18 / 600),
      width * (864 / 900),
      height * (564 / 600),
    );

    context.strokeStyle = "#b65b3f";
    context.lineWidth = width * (2 / 900);
    context.strokeRect(
      width * (31 / 900),
      height * (31 / 600),
      width * (838 / 900),
      height * (538 / 600),
    );
  } else {
    drawBorder(context, width, height, borderStyle);
  }

  context.textAlign = "center";
  context.textBaseline = "middle";

  const headingFont = "DM Sans, Arial, sans-serif";
  const originalDesign = template.originalDesign && borderStyle === "classic";
  const headingY = originalDesign
    ? height * (122 / 600)
    : compact
      ? height * 0.25
      : height * 0.2;
  const headingSize = fitText(
    context,
    displayHeading,
    width * 0.72,
    Math.max(16, shortSide * 0.055),
    Math.max(11, shortSide * 0.026),
    headingFont,
    600,
  );
  context.fillStyle = "#b65b3f";
  context.font = `600 ${headingSize}px ${headingFont}`;
  context.fillText(displayHeading, width / 2, headingY);

  if (originalDesign) {
    context.fillStyle = "#354332";
    context.beginPath();
    context.arc(
      width / 2,
      height * (176 / 600),
      width * (5 / 900),
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  const nameY = originalDesign
    ? height * (315 / 600)
    : compact
      ? height * 0.59
      : height * 0.53;
  const nameSize = fitText(
    context,
    displayName,
    width * 0.78,
    Math.max(34, shortSide * (compact ? 0.3 : 0.2)),
    Math.max(19, shortSide * 0.09),
    nameFont.family,
    nameFont.weight,
  );
  context.fillStyle = name.trim() ? "#202019" : "#8d887d";
  context.font = `${nameFont.weight} ${nameSize}px ${nameFont.family}`;
  context.fillText(displayName, width / 2, nameY);

  if (!compact) {
    const lineY = originalDesign ? height * (405 / 600) : height * 0.7;
    context.strokeStyle = "#b65b3f";
    context.lineWidth = Math.max(2, shortSide * 0.006);
    context.beginPath();
    context.moveTo(originalDesign ? width * (340 / 900) : width * 0.38, lineY);
    context.lineTo(originalDesign ? width * (560 / 900) : width * 0.62, lineY);
    context.stroke();

    context.fillStyle = "#60705a";
    context.font = `600 ${Math.max(13, shortSide * 0.036)}px ${headingFont}`;
    context.fillText(
      "PANTRY GOODS",
      width / 2,
      originalDesign ? height * (466 / 600) : height * 0.82,
    );
  }
}

function ascii(value) {
  return new TextEncoder().encode(value);
}

function joinBytes(parts) {
  const totalLength = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(totalLength);
  let position = 0;

  parts.forEach((part) => {
    result.set(part, position);
    position += part.length;
  });

  return result;
}

function dataUrlToBytes(dataUrl) {
  const binary = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function createPageContent(spiceNames, template, firstImageIndex) {
  const labelWidth = template.width * POINTS_PER_INCH;
  const labelHeight = template.height * POINTS_PER_INCH;
  const left = template.left * POINTS_PER_INCH;
  const top = template.top * POINTS_PER_INCH;
  const horizontalPitch = template.horizontalPitch * POINTS_PER_INCH;
  const verticalPitch = template.verticalPitch * POINTS_PER_INCH;
  const pageHeight = template.pageHeight;
  const cutOffset = (template.cutOffset || 0) * POINTS_PER_INCH;
  const commands = cutOffset ? ["0.25 w", "[2 2] 0 d", "0.65 G"] : [];

  spiceNames.forEach((_, index) => {
    const column = index % template.columns;
    const row = Math.floor(index / template.columns);
    const labelLeft = left + column * horizontalPitch;
    const labelTop = top + row * verticalPitch;
    const labelBottom = pageHeight - labelTop - labelHeight;

    if (cutOffset) {
      commands.push(
        `${labelLeft - cutOffset} ${labelBottom - cutOffset} ${labelWidth + cutOffset * 2} ${labelHeight + cutOffset * 2} re S`,
      );
    }
    commands.push(
      `q\n${labelWidth} 0 0 ${labelHeight} ${labelLeft} ${labelBottom} cm\n/Img${firstImageIndex + index + 1} Do\nQ`,
    );
  });

  return `${commands.join("\n")}\n`;
}

function createPdf(spiceNames, heading, template, borderStyle, fontStyle) {
  sizeCanvas(renderCanvas, template);
  const imageBytes = spiceNames.map((name) => {
    drawLabel(renderCanvas, name, heading, borderStyle, template, fontStyle);
    return dataUrlToBytes(renderCanvas.toDataURL("image/jpeg", 0.96));
  });
  const labelsPerPage = template.columns * template.rows;
  const pageCount = Math.ceil(spiceNames.length / labelsPerPage);
  const pageObjectStart = 3;
  const imageObjectStart = pageObjectStart + pageCount;
  const contentObjectStart = imageObjectStart + spiceNames.length;
  const pageIds = Array.from(
    { length: pageCount },
    (_, index) => pageObjectStart + index,
  );
  const pageContents = pageIds.map((_, pageIndex) => {
    const firstImageIndex = pageIndex * labelsPerPage;
    return createPageContent(
      spiceNames.slice(firstImageIndex, firstImageIndex + labelsPerPage),
      template,
      firstImageIndex,
    );
  });
  const imageResources = spiceNames
    .map((_, index) => `/Img${index + 1} ${imageObjectStart + index} 0 R`)
    .join(" ");
  const objects = [
    ascii("<< /Type /Catalog /Pages 2 0 R >>"),
    ascii(
      `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`,
    ),
    ...pageIds.map((_, index) =>
      ascii(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${template.pageWidth} ${template.pageHeight}] /Resources << /XObject << ${imageResources} >> >> /Contents ${contentObjectStart + index} 0 R >>`,
      ),
    ),
    ...imageBytes.map((bytes) =>
      joinBytes([
        ascii(
          `<< /Type /XObject /Subtype /Image /Width ${renderCanvas.width} /Height ${renderCanvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`,
        ),
        bytes,
        ascii("\nendstream"),
      ]),
    ),
    ...pageContents.map((content) =>
      ascii(`<< /Length ${ascii(content).length} >>\nstream\n${content}endstream`),
    ),
  ];

  const parts = [ascii("%PDF-1.4\n%PDFLABEL\n")];
  const offsets = [0];
  let byteOffset = parts[0].length;

  objects.forEach((object, index) => {
    offsets.push(byteOffset);
    const objectBytes = joinBytes([
      ascii(`${index + 1} 0 obj\n`),
      object,
      ascii("\nendobj\n"),
    ]);
    parts.push(objectBytes);
    byteOffset += objectBytes.length;
  });

  const xrefOffset = byteOffset;
  const xrefEntries = offsets
    .map((offset, index) =>
      index === 0
        ? "0000000000 65535 f \n"
        : `${String(offset).padStart(10, "0")} 00000 n \n`,
    )
    .join("");

  parts.push(
    ascii(
      `xref\n0 ${objects.length + 1}\n${xrefEntries}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
    ),
  );

  return new Blob([joinBytes(parts)], { type: "application/pdf" });
}

function selectedSpices() {
  return [...document.querySelectorAll('input[name="spice"]:checked')].map(
    (input) => input.value,
  );
}

function createSpiceOption(name) {
  const label = document.createElement("label");
  const input = document.createElement("input");
  const content = document.createElement("span");
  const checkmark = document.createElement("span");
  const spiceName = document.createElement("span");

  label.className = "spice-option";
  input.type = "checkbox";
  input.name = "spice";
  input.value = name;
  input.checked = true;
  content.className = "option-content";
  checkmark.className = "checkmark";
  checkmark.setAttribute("aria-hidden", "true");
  checkmark.textContent = "✓";
  spiceName.textContent = name;
  content.append(checkmark, spiceName);
  label.append(input, content);

  return label;
}

function addCustomSpice() {
  const name = customSpiceInput.value.trim();
  const inputs = [...document.querySelectorAll('input[name="spice"]')];
  message.classList.remove("success");

  if (!name) {
    message.textContent = "Enter a spice name to add it.";
    customSpiceInput.focus();
    return;
  }

  const existing = inputs.find(
    (input) => input.value.toLowerCase() === name.toLowerCase(),
  );

  if (existing) {
    existing.checked = true;
    customSpiceInput.value = "";
    updateSelection();
    existing.focus();
    return;
  }

  if (inputs.length >= MAX_SPICES) {
    message.textContent = `You can add up to ${MAX_SPICES} spices.`;
    return;
  }

  spiceOptions.append(createSpiceOption(name));
  customSpiceInput.value = "";
  updateSelection();
  customSpiceInput.focus();
}

function updateTemplateDetails(template) {
  const capacity = template.columns * template.rows;
  dimension.textContent = template.size;
  templateNote.textContent = `${template.size} · ${template.columns} columns × ${template.rows} rows · ${capacity} per sheet`;
  printTipText.textContent = template.cutOffset
    ? "A4 plain paper · 2 mm cut guides · Print at 100% scale."
    : `${template.paper} · Matches the selected Avery sheet · Print at 100% scale.`;
}

function updateSelection() {
  const spices = selectedSpices();
  const count = spices.length;
  const heading = labelHeadingInput.value;
  const template = currentTemplate();
  const borderStyle = borderStyleSelect.value;
  const fontStyle = labelFontSelect.value;
  const capacity = template.columns * template.rows;
  const sheets = Math.max(1, Math.ceil(count / capacity));

  updateTemplateDetails(template);
  selectionCount.textContent =
    count === 0
      ? "NO LABELS SELECTED"
      : `${count} ${count === 1 ? "LABEL" : "LABELS"} · ${sheets} ${sheets === 1 ? "SHEET" : "SHEETS"}`;
  message.classList.remove("success");
  message.textContent = "";
  previewGrid.replaceChildren();

  if (count === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-preview";
    emptyMessage.textContent = "Select a spice to preview its label.";
    previewGrid.append(emptyMessage);
    return;
  }

  spices.forEach((name) => {
    const previewCanvas = document.createElement("canvas");
    sizeCanvas(previewCanvas, template);
    previewCanvas.setAttribute("aria-label", `${name} label preview`);
    drawLabel(
      previewCanvas,
      name,
      heading,
      borderStyle,
      template,
      fontStyle,
    );
    previewGrid.append(previewCanvas);
  });
}

spiceOptions.append(...DEFAULT_SPICES.map(createSpiceOption));
spiceOptions.addEventListener("change", updateSelection);
labelTemplateSelect.addEventListener("change", updateSelection);
borderStyleSelect.addEventListener("change", updateSelection);
labelFontSelect.addEventListener("change", async () => {
  await loadLabelFont(labelFontSelect.value);
  updateSelection();
});
labelHeadingInput.addEventListener("input", () => {
  saveHeading();
  updateSelection();
});
resetHeadingButton.addEventListener("click", resetHeading);
addSpiceButton.addEventListener("click", addCustomSpice);
customSpiceInput.addEventListener("input", () => {
  message.classList.remove("success");
  message.textContent = "";
});
customSpiceInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addCustomSpice();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const spices = selectedSpices();
  const template = currentTemplate();
  message.classList.remove("success");

  if (spices.length === 0) {
    message.textContent = "Select at least one spice to create a label sheet.";
    document.querySelector('input[name="spice"]').focus();
    return;
  }

  try {
    await loadLabelFont(labelFontSelect.value);
    const pdf = createPdf(
      spices,
      labelHeadingInput.value,
      template,
      borderStyleSelect.value,
      labelFontSelect.value,
    );
    const downloadUrl = URL.createObjectURL(pdf);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download =
      labelTemplateSelect.value === "plain-a4"
        ? "mason-spice-labels-plain-a4.pdf"
        : `mason-spice-labels-avery-${labelTemplateSelect.value}.pdf`;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
    message.classList.add("success");
    message.textContent = `${template.name} PDF generated. Check your downloads.`;
  } catch (error) {
    console.error("Unable to generate the PDF.", error);
    message.classList.remove("success");
    message.textContent = "The PDF could not be generated. Please try again.";
  }
});

window.addEventListener("storage", (event) => {
  if (event.key !== LABEL_HEADING_STORAGE_KEY) {
    return;
  }

  labelHeadingInput.value = (event.newValue ?? DEFAULT_LABEL_HEADING).slice(
    0,
    labelHeadingInput.maxLength,
  );
  updateHeadingResetButton();
  updateSelection();
});

restoreSavedHeading();
document.fonts.ready.then(updateSelection);
updateSelection();
