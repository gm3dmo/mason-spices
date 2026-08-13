const form = document.querySelector("#label-form");
const labelTemplateSelect = document.querySelector("#label-template");
const borderStyleSelect = document.querySelector("#border-style");
const labelHeadingInput = document.querySelector("#label-heading");
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
];

function currentTemplate() {
  return LABEL_TEMPLATES[labelTemplateSelect.value];
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
) {
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const shortSide = Math.min(width, height);
  const displayName = name.trim() || "Your Spice";
  const displayHeading = heading.trim() || "MASON'S FINE SPICES";
  const compact = height / width < 0.35;

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
  );
  context.fillStyle = name.trim() ? "#202019" : "#8d887d";
  context.font = `700 ${nameSize}px Fraunces, Georgia, serif`;
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

function createPdf(spiceNames, heading, template, borderStyle) {
  sizeCanvas(renderCanvas, template);
  const imageBytes = spiceNames.map((name) => {
    drawLabel(renderCanvas, name, heading, borderStyle, template);
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
    : "A4 · Matches the selected Avery sheet · Print at 100% scale.";
}

function updateSelection() {
  const spices = selectedSpices();
  const count = spices.length;
  const heading = labelHeadingInput.value;
  const template = currentTemplate();
  const borderStyle = borderStyleSelect.value;
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
    drawLabel(previewCanvas, name, heading, borderStyle, template);
    previewGrid.append(previewCanvas);
  });
}

spiceOptions.append(...DEFAULT_SPICES.map(createSpiceOption));
spiceOptions.addEventListener("change", updateSelection);
labelTemplateSelect.addEventListener("change", updateSelection);
borderStyleSelect.addEventListener("change", updateSelection);
labelHeadingInput.addEventListener("input", updateSelection);
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

form.addEventListener("submit", (event) => {
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
    const pdf = createPdf(
      spices,
      labelHeadingInput.value,
      template,
      borderStyleSelect.value,
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

document.fonts.ready.then(updateSelection);
updateSelection();
