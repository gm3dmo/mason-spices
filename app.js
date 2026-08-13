const form = document.querySelector("#label-form");
const spiceInputs = [...document.querySelectorAll('input[name="spice"]')];
const selectionCount = document.querySelector("#selection-count");
const message = document.querySelector("#form-message");
const canvas = document.querySelector("#label-canvas");
const context = canvas.getContext("2d");

const PAGE_WIDTH = 595.2756;
const PAGE_HEIGHT = 841.8898;
const LABEL_WIDTH = 170.0787;
const LABEL_HEIGHT = 113.3858;
const PAGE_MARGIN = 56.6929;
const CUT_OFFSET = 5.6693;
const GRID_COLUMNS = 3;

function fitText(text, maxWidth, startingSize) {
  let size = startingSize;

  do {
    context.font = `700 ${size}px Fraunces, Georgia, serif`;
    if (context.measureText(text).width <= maxWidth) {
      return size;
    }
    size -= 2;
  } while (size > 54);

  return size;
}

function drawLabel(name = "") {
  const displayName = name.trim() || "Your Spice";

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
  context.font = "600 23px DM Sans, Arial, sans-serif";
  context.letterSpacing = "7px";
  context.fillText("MASON'S FINE SPICES", canvas.width / 2, 122);

  context.fillStyle = "#354332";
  context.beginPath();
  context.arc(canvas.width / 2, 176, 5, 0, Math.PI * 2);
  context.fill();

  const fontSize = fitText(displayName, canvas.width - 145, 112);
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

function createPdf(spiceNames) {
  const imageBytes = spiceNames.map((name) => {
    drawLabel(name);
    return dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.96));
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
          `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`,
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
  return spiceInputs.filter((input) => input.checked).map((input) => input.value);
}

function updateSelection() {
  const spices = selectedSpices();
  const count = spices.length;

  selectionCount.textContent = `${count} ${count === 1 ? "LABEL" : "LABELS"} SELECTED`;
  message.textContent = "";
  drawLabel(spices[0] || "");
}

spiceInputs.forEach((input) => input.addEventListener("change", updateSelection));

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const spices = selectedSpices();

  if (spices.length === 0) {
    message.textContent = "Select at least one spice to create a label sheet.";
    spiceInputs[0].focus();
    return;
  }

  const downloadUrl = URL.createObjectURL(createPdf(spices));
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "mason-spice-labels.pdf";
  link.click();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  message.textContent = "";
  drawLabel(spices[0]);
});

document.fonts.ready.then(updateSelection);
updateSelection();
