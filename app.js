const form = document.querySelector("#label-form");
const labelHeadingInput = document.querySelector("#label-heading");
const spiceOptions = document.querySelector("#spice-options");
const customSpiceInput = document.querySelector("#custom-spice");
const addSpiceButton = document.querySelector("#add-spice-button");
const selectionCount = document.querySelector("#selection-count");
const message = document.querySelector("#form-message");
const previewGrid = document.querySelector("#preview-grid");
const renderCanvas = document.createElement("canvas");
renderCanvas.width = 900;
renderCanvas.height = 600;

const PAGE_WIDTH = 595.2756;
const PAGE_HEIGHT = 841.8898;
const LABEL_WIDTH = 170.0787;
const LABEL_HEIGHT = 113.3858;
const PAGE_MARGIN = 56.6929;
const CUT_OFFSET = 5.6693;
const GRID_COLUMNS = 3;
const MAX_LABELS = 18;
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

  context.fillStyle = "#fffaf0";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "#354332";
  context.lineWidth = 8;
  context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  context.strokeStyle = "#b65b3f";
  context.lineWidth = 2;
  context.strokeRect(31, 31, canvas.width - 62, canvas.height - 62);

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#b65b3f";
  context.letterSpacing = "7px";
  const headingFont = "DM Sans, Arial, sans-serif";
  const headingSize = fitText(
    context,
    displayHeading,
    canvas.width - 150,
    23,
    12,
    headingFont,
    600,
  );
  context.font = `600 ${headingSize}px ${headingFont}`;
  context.fillText(displayHeading, canvas.width / 2, 122);

  context.fillStyle = "#354332";
  context.beginPath();
  context.arc(canvas.width / 2, 176, 5, 0, Math.PI * 2);
  context.fill();

  const fontSize = fitText(context, displayName, canvas.width - 145, 112);
  context.fillStyle = name.trim() ? "#202019" : "#8d887d";
  context.font = `700 ${fontSize}px Fraunces, Georgia, serif`;
  context.letterSpacing = "0px";
  context.fillText(displayName, canvas.width / 2, 315);

  context.strokeStyle = "#b65b3f";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(340, 405);
  context.lineTo(560, 405);
  context.stroke();

  context.fillStyle = "#60705a";
  context.font = "600 20px DM Sans, Arial, sans-serif";
  context.letterSpacing = "6px";
  context.fillText("PANTRY GOODS", canvas.width / 2, 466);
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

function createPdf(spiceNames, heading) {
  const imageBytes = spiceNames.map((name) => {
    drawLabel(renderCanvas, name, heading);
    return dataUrlToBytes(renderCanvas.toDataURL("image/jpeg", 0.96));
  });
  const imageResources = spiceNames
    .map((_, index) => `/Img${index + 1} ${index + 4} 0 R`)
    .join(" ");
  const contentObjectId = spiceNames.length + 4;
  const cutWidth = LABEL_WIDTH + CUT_OFFSET * 2;
  const cutHeight = LABEL_HEIGHT + CUT_OFFSET * 2;
  const commands = ["0.25 w", "[2 2] 0 d", "0.65 G"];

  spiceNames.forEach((_, index) => {
    const column = index % GRID_COLUMNS;
    const row = Math.floor(index / GRID_COLUMNS);
    const labelLeft = PAGE_MARGIN + column * cutWidth;
    const labelTop = PAGE_MARGIN + row * cutHeight;
    const labelBottom = PAGE_HEIGHT - labelTop - LABEL_HEIGHT;
    const cutLeft = labelLeft - CUT_OFFSET;
    const cutBottom = labelBottom - CUT_OFFSET;

    commands.push(
      `${cutLeft} ${cutBottom} ${cutWidth} ${cutHeight} re S`,
      `q\n${LABEL_WIDTH} 0 0 ${LABEL_HEIGHT} ${labelLeft} ${labelBottom} cm\n/Img${index + 1} Do\nQ`,
    );
  });

  const content = `${commands.join("\n")}\n`;
  const objects = [
    ascii("<< /Type /Catalog /Pages 2 0 R >>"),
    ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    ascii(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /XObject << ${imageResources} >> >> /Contents ${contentObjectId} 0 R >>`,
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
    ascii(`<< /Length ${ascii(content).length} >>\nstream\n${content}endstream`),
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

  selectionCount.textContent = `${count} ${count === 1 ? "LABEL" : "LABELS"} SELECTED`;
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
    previewCanvas.width = 900;
    previewCanvas.height = 600;
    previewCanvas.setAttribute("aria-label", `${name} label preview`);
    drawLabel(previewCanvas, name, heading);
    previewGrid.append(previewCanvas);
  });
}

spiceOptions.append(...DEFAULT_SPICES.map(createSpiceOption));
spiceOptions.addEventListener("change", updateSelection);
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
    const pdf = createPdf(spices, labelHeadingInput.value);
    const downloadUrl = URL.createObjectURL(pdf);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = "mason-spice-labels.pdf";
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
