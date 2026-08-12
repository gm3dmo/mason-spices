const form = document.querySelector("#label-form");
const input = document.querySelector("#spice-name");
const counter = document.querySelector("#character-count");
const message = document.querySelector("#form-message");
const canvas = document.querySelector("#label-canvas");
const context = canvas.getContext("2d");

const PAGE_WIDTH = 595.2756;
const PAGE_HEIGHT = 841.8898;
const LABEL_WIDTH = 170.0787;
const LABEL_HEIGHT = 113.3858;
const PAGE_MARGIN = 56.6929;

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

function createPdf() {
  const imageBytes = dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.96));
  const labelBottom = PAGE_HEIGHT - PAGE_MARGIN - LABEL_HEIGHT;
  const content = `q\n${LABEL_WIDTH} 0 0 ${LABEL_HEIGHT} ${PAGE_MARGIN} ${labelBottom} cm\n/Img1 Do\nQ\n`;
  const objects = [
    ascii("<< /Type /Catalog /Pages 2 0 R >>"),
    ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    ascii(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /XObject << /Img1 4 0 R >> >> /Contents 5 0 R >>`,
    ),
    joinBytes([
      ascii(
        `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
      ),
      imageBytes,
      ascii("\nendstream"),
    ]),
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

function safeFilename(name) {
  const cleanName = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${cleanName || "spice"}-label.pdf`;
}

input.addEventListener("input", () => {
  counter.textContent = `${input.value.length}/32`;
  message.textContent = "";
  drawLabel(input.value);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!input.value.trim()) {
    message.textContent = "Enter a spice name to create your label.";
    input.focus();
    return;
  }

  drawLabel(input.value);
  const downloadUrl = URL.createObjectURL(createPdf());
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = safeFilename(input.value);
  link.click();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  message.textContent = "";
});

document.fonts.ready.then(() => drawLabel(input.value));
drawLabel();
