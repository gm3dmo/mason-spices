const form = document.querySelector("#label-form");
const labelHeadingInput = document.querySelector("#label-heading");
const printTargetInputs = [...document.querySelectorAll('input[name="print-target"]')];
const printTipText = document.querySelector("#print-tip-text");
const spiceOptions = document.querySelector("#spice-options");
const customSpiceInput = document.querySelector("#custom-spice");
const addSpiceButton = document.querySelector("#add-spice-button");
const selectionCount = document.querySelector("#selection-count");
const message = document.querySelector("#form-message");
const previewGrid = document.querySelector("#preview-grid");
const renderCanvas = document.createElement("canvas");
renderCanvas.width = 900;
renderCanvas.height = 600;

const MAX_LABELS = 18;
const POINTS_PER_MM = 72 / 25.4;
const mm = (value) => value * POINTS_PER_MM;
const PRINT_TARGETS = {
  laser: {
    pageWidth: mm(210),
    pageHeight: mm(297),
    labelWidth: mm(60),
    labelHeight: mm(40),
    marginLeft: mm(20),
    marginTop: mm(20),
    horizontalGap: mm(4),
    verticalGap: mm(4),
    cutOffset: mm(2),
    columns: 3,
    rows: 6,
    canvasWidth: 900,
    canvasHeight: 600,
    filename: "mason-spice-labels-a4.pdf",
    tip: "A4 portrait · 2 mm cut guides · Print at 100% scale.",
  },
  avery: {
    pageWidth: mm(297),
    pageHeight: mm(210),
    labelWidth: mm(139),
    labelHeight: mm(99.1),
    marginLeft: mm(9.5),
    marginTop: mm(4.63),
    horizontalGap: 0,
    verticalGap: mm(2.54),
    cutOffset: 0,
    columns: 2,
    rows: 2,
    canvasWidth: 1000,
    canvasHeight: 713,
    filename: "mason-spice-labels-avery-l4774.pdf",
    tip: "Avery L4774-20 · A4 landscape · Print at 100% scale.",
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

function fitText(
  context,
  text,
  maxWidth,
  startingSize,
  minimumSize = 54,
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

function drawLabel(canvas, name = "", heading = "MASON'S FINE SPICES") {
  const context = canvas.getContext("2d");
  const displayName = name.trim() || "Your Spice";
  const displayHeading = heading.trim() || "MASON'S FINE SPICES";
  const width = canvas.width;
  const height = canvas.height;

  context.fillStyle = "#fffaf0";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "#354332";
  context.lineWidth = width * 0.0089;
  context.strokeRect(width * 0.02, height * 0.03, width * 0.96, height * 0.94);

  context.strokeStyle = "#b65b3f";
  context.lineWidth = width * 0.0022;
  context.strokeRect(
    width * 0.0344,
    height * 0.0517,
    width * 0.9312,
    height * 0.8966,
  );

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#b65b3f";
  context.letterSpacing = `${width * 0.0078}px`;
  const headingFont = "DM Sans, Arial, sans-serif";
  const headingSize = fitText(
    context,
    displayHeading,
    width * 0.8333,
    width * 0.0256,
    width * 0.0133,
    headingFont,
    600,
  );
  context.font = `600 ${headingSize}px ${headingFont}`;
  context.fillText(displayHeading, width / 2, height * 0.2033);

  context.fillStyle = "#354332";
  context.beginPath();
  context.arc(width / 2, height * 0.2933, width * 0.0056, 0, Math.PI * 2);
  context.fill();

  const fontSize = fitText(
    context,
    displayName,
    width * 0.8389,
    width * 0.1244,
    width * 0.06,
  );
  context.fillStyle = name.trim() ? "#202019" : "#8d887d";
  context.font = `700 ${fontSize}px Fraunces, Georgia, serif`;
  context.letterSpacing = "0px";
  context.fillText(displayName, width / 2, height * 0.525);

  context.strokeStyle = "#b65b3f";
  context.lineWidth = width * 0.0033;
  context.beginPath();
  context.moveTo(width * 0.3778, height * 0.675);
  context.lineTo(width * 0.6222, height * 0.675);
  context.stroke();

  context.fillStyle = "#60705a";
  context.font = `600 ${width * 0.0222}px DM Sans, Arial, sans-serif`;
  context.letterSpacing = `${width * 0.0067}px`;
  context.fillText("PANTRY GOODS", width / 2, height * 0.7767);
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

function selectedPrintTarget() {
  const selected = printTargetInputs.find((input) => input.checked);
  return PRINT_TARGETS[selected.value];
}

function createPdf(spiceNames, heading, target) {
  renderCanvas.width = target.canvasWidth;
  renderCanvas.height = target.canvasHeight;
  const imageBytes = spiceNames.map((name) => {
    drawLabel(renderCanvas, name, heading);
    return dataUrlToBytes(renderCanvas.toDataURL("image/jpeg", 0.96));
  });
  const labelsPerPage = target.columns * target.rows;
  const pageCount = Math.ceil(spiceNames.length / labelsPerPage);
  const imageObjectStart = 3 + pageCount;
  const contentObjectStart = imageObjectStart + spiceNames.length;
  const pageContents = Array.from({ length: pageCount }, (_, pageIndex) => {
    const pageStart = pageIndex * labelsPerPage;
    const pageEnd = Math.min(pageStart + labelsPerPage, spiceNames.length);
    const commands = target.cutOffset
      ? ["0.25 w", "[2 2] 0 d", "0.65 G"]
      : [];

    for (let imageIndex = pageStart; imageIndex < pageEnd; imageIndex += 1) {
      const localIndex = imageIndex - pageStart;
      const column = localIndex % target.columns;
      const row = Math.floor(localIndex / target.columns);
      const labelLeft =
        target.marginLeft + column * (target.labelWidth + target.horizontalGap);
      const labelTop =
        target.marginTop + row * (target.labelHeight + target.verticalGap);
      const labelBottom = target.pageHeight - labelTop - target.labelHeight;

      if (target.cutOffset) {
        commands.push(
          `${labelLeft - target.cutOffset} ${labelBottom - target.cutOffset} ${target.labelWidth + target.cutOffset * 2} ${target.labelHeight + target.cutOffset * 2} re S`,
        );
      }

      commands.push(
        `q\n${target.labelWidth} 0 0 ${target.labelHeight} ${labelLeft} ${labelBottom} cm\n/Img${imageIndex + 1} Do\nQ`,
      );
    }

    return `${commands.join("\n")}\n`;
  });

  const pageObjects = pageContents.map((_, pageIndex) => {
    const pageStart = pageIndex * labelsPerPage;
    const pageEnd = Math.min(pageStart + labelsPerPage, spiceNames.length);
    const resources = spiceNames
      .slice(pageStart, pageEnd)
      .map(
        (_, localIndex) =>
          `/Img${pageStart + localIndex + 1} ${imageObjectStart + pageStart + localIndex} 0 R`,
      )
      .join(" ");

    return ascii(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${target.pageWidth} ${target.pageHeight}] /Resources << /XObject << ${resources} >> >> /Contents ${contentObjectStart + pageIndex} 0 R >>`,
    );
  });

  const objects = [
    ascii("<< /Type /Catalog /Pages 2 0 R >>"),
    ascii(
      `<< /Type /Pages /Kids [${pageObjects.map((_, index) => `${index + 3} 0 R`).join(" ")}] /Count ${pageCount} >>`,
    ),
    ...pageObjects,
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

  if (inputs.length >= MAX_LABELS) {
    message.textContent = `An A4 sheet can hold up to ${MAX_LABELS} labels.`;
    return;
  }

  spiceOptions.append(createSpiceOption(name));
  customSpiceInput.value = "";
  updateSelection();
  customSpiceInput.focus();
}

function updateSelection() {
  const spices = selectedSpices();
  const count = spices.length;
  const heading = labelHeadingInput.value;
  const target = selectedPrintTarget();

  selectionCount.textContent = `${count} ${count === 1 ? "LABEL" : "LABELS"} SELECTED`;
  printTipText.textContent = target.tip;
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
    previewCanvas.width = target.canvasWidth;
    previewCanvas.height = target.canvasHeight;
    previewCanvas.setAttribute("aria-label", `${name} label preview`);
    drawLabel(previewCanvas, name, heading);
    previewGrid.append(previewCanvas);
  });
}

spiceOptions.append(...DEFAULT_SPICES.map(createSpiceOption));
spiceOptions.addEventListener("change", updateSelection);
printTargetInputs.forEach((input) => input.addEventListener("change", updateSelection));
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
  message.classList.remove("success");

  if (spices.length === 0) {
    message.textContent = "Select at least one spice to create a label sheet.";
    document.querySelector('input[name="spice"]').focus();
    return;
  }

  try {
    const target = selectedPrintTarget();
    const pdf = createPdf(spices, labelHeadingInput.value, target);
    const downloadUrl = URL.createObjectURL(pdf);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = target.filename;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
    message.classList.add("success");
    message.textContent = "PDF generated. Check your downloads.";
  } catch (error) {
    console.error("Unable to generate the PDF.", error);
    message.classList.remove("success");
    message.textContent = "The PDF could not be generated. Please try again.";
  }
});

document.fonts.ready.then(updateSelection);
updateSelection();
