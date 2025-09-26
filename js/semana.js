import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// -------------------- Config Supabase --------------------
const SUPABASE_URL = "https://bazwwhwjruwgyfomyttp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmVlUs7q_BeBHxUo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------------------- Parámetros (curso / semana) --------------------
const params = new URLSearchParams(window.location.search);
let curso = params.get("curso") || "Arquitectura de Software";
let semanaNumero = params.get("semana") || "1";
curso = decodeURIComponent(curso).trim();
semanaNumero = semanaNumero.trim();
const carpeta = `${curso}/Semana ${semanaNumero}`;

console.log("🎯 Curso:", curso);
console.log("🎯 Semana:", semanaNumero);
console.log("🎯 Carpeta Supabase:", carpeta);

// -------------------- DOM --------------------
const tituloEl = document.getElementById("tituloSemana");
if (tituloEl) tituloEl.textContent = `${curso} - Semana ${semanaNumero}`;

const listaArchivos =
  document.getElementById("listaArchivos") || document.getElementById("archivos");

if (!listaArchivos) {
  console.error(
    'No se encontró el contenedor de archivos. Debes tener id="listaArchivos" o id="archivos" en tu HTML.'
  );
}

// -------------------- Botón dinámico "Volver al curso" (Hero) --------------------
const volverCursoEl = document.getElementById("volverCurso");
if (volverCursoEl) {
  volverCursoEl.innerHTML = `
    <p>
      <a href="curso.html?curso=${encodeURIComponent(curso)}" class="btn btn-secondary">
        ⬅️ Volver al curso ${curso}
      </a>
    </p>
  `;
}

// -------------------- Crear modal si no existe --------------------
function ensureModalExists() {
  if (document.getElementById("previewModal")) return;

  const modalHTML = `
  <div class="modal fade" id="previewModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl" style="max-width:90%;">
      <div class="modal-content" style="height:90vh; border-radius:12px; overflow:hidden;">
        <div class="modal-header">
          <h5 class="modal-title">Vista previa</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body p-0" style="height: calc(100% - 110px);">
          <iframe id="previewFrame" style="width:100%; height:100%; border:none;"></iframe>
        </div>
        <div class="modal-footer d-flex justify-content-between">
          <a id="volverCursoModal" class="btn btn-secondary">⬅ Volver al curso</a>
          <div>
            <a id="downloadBtn" class="btn btn-success" target="_blank" rel="noopener">⬇ Descargar</a>
            <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // 🔹 Evento botón modal
  document
    .getElementById("volverCursoModal")
    .addEventListener("click", () => {
      window.location.href = `curso.html?curso=${encodeURIComponent(curso)}`;
    });
}

// -------------------- Icon mapping --------------------
function getIconForExt(ext) {
  const map = {
    pdf: "https://cdn-icons-png.flaticon.com/512/337/337946.png",
    doc: "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftword.svg",
    docx: "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftword.svg",
    xls: "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftexcel.svg",
    xlsx: "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftexcel.svg",
    ppt: "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftpowerpoint.svg",
    pptx: "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftpowerpoint.svg",
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
  };
  return map[ext] || "https://cdn-icons-png.flaticon.com/512/564/564619.png";
}

// -------------------- URL para vista previa --------------------
function getViewUrl(url, filename) {
  const ext = (filename || url).split(".").pop().toLowerCase();
  if (["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return url;
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(
      url
    )}&embedded=true`;
  }
  return url;
}

// -------------------- Verificar conexión --------------------
async function verificarConexion() {
  try {
    const { data, error } = await supabase.storage
      .from("archivos")
      .list(carpeta, { limit: 1 });
    if (error) {
      console.warn("Error verificando conexión Supabase:", error.message);
      return;
    }
    console.log("Conexión Supabase OK. Ejemplo de archivos:", data);
  } catch (err) {
    console.error("Error al verificar conexión:", err);
  }
}

// -------------------- Listar archivos --------------------
async function listarArchivos(path = carpeta) {
  try {
    const { data, error } = await supabase.storage
      .from("archivos")
      .list(path, { limit: 200 });
    if (error) {
      console.error("Error listando archivos:", error.message);
      return [];
    }
    return Array.isArray(data)
      ? data.filter((i) => !i.metadata?.is_directory)
      : [];
  } catch (err) {
    console.error("Error listarArchivos:", err);
    return [];
  }
}

// -------------------- Renderizar cards --------------------
async function cargarArchivos() {
  if (!listaArchivos) return;

  ensureModalExists();
  listaArchivos.innerHTML = `<div class="col-12 text-center text-muted"><p>⏳ Cargando archivos...</p></div>`;

  const archivos = await listarArchivos();
  listaArchivos.innerHTML = "";

  if (!archivos || archivos.length === 0) {
    listaArchivos.innerHTML = `<div class="col-12 text-center text-muted"><p>📭 No hay archivos en "${curso} / Semana ${semanaNumero}".</p></div>`;
    return;
  }

  for (const file of archivos) {
    const { data: urlData } = supabase.storage
      .from("archivos")
      .getPublicUrl(`${carpeta}/${file.name}`);
    if (!urlData?.publicUrl) continue;

    const publicUrl = urlData.publicUrl;
    const descargarUrl = `${publicUrl}?download=${encodeURIComponent(
      file.name
    )}`;
    const ext = file.name.split(".").pop().toLowerCase();
    const icon = getIconForExt(ext);

    const col = document.createElement("div");
    col.className = "col-md-3 col-sm-6 d-flex justify-content-center";

    const card = document.createElement("div");
    card.className = "archivo-card";
    card.style.width = "220px";
    card.style.minHeight = "220px";
    card.style.margin = "12px";
    card.style.padding = "12px";
    card.style.border = "1px solid #e6e6e6";
    card.style.borderRadius = "12px";
    card.style.textAlign = "center";
    card.style.background = "#fff";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.justifyContent = "space-between";

    let iconHtml = "";
    if (icon === "image") {
      iconHtml = `<img src="${publicUrl}" alt="${file.name}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;margin:0 auto 8px;"/>`;
    } else {
      iconHtml = `<img src="${icon}" alt="${ext}" style="width:96px;height:96px;object-fit:contain;margin:8px auto;"/>`;
    }

    card.innerHTML = `
      <div>
        ${iconHtml}
        <div style="margin-top:6px;font-size:13px;font-weight:600;word-break:break-word;">${file.name}</div>
      </div>
      <div style="margin-top:10px; display:flex; gap:8px; justify-content:center;">
        <button type="button" class="btn btn-primary btn-sm btn-preview">👁 Vista previa</button>
        <a class="btn btn-success btn-sm" href="${descargarUrl}" download>⬇ Descargar</a>
      </div>
    `;

    col.appendChild(card);
    listaArchivos.appendChild(col);

    // Event Vista previa
    card.querySelector(".btn-preview").addEventListener("click", () => {
      abrirPreview(publicUrl, file.name);
    });
  }
}

// -------------------- Abrir modal vista previa --------------------
function abrirPreview(fileUrl, filename) {
  ensureModalExists();
  const previewFrame = document.getElementById("previewFrame");
  const downloadBtn = document.getElementById("downloadBtn");
  const modalEl = document.getElementById("previewModal");

  if (!previewFrame || !downloadBtn || !modalEl) return;

  previewFrame.src = getViewUrl(fileUrl, filename);
  downloadBtn.href = `${fileUrl}?download=${encodeURIComponent(filename)}`;
  downloadBtn.setAttribute("download", filename);

  if (typeof bootstrap === "undefined") {
    window.open(previewFrame.src, "_blank", "noopener");
    return;
  }

  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  modalEl.addEventListener(
    "hidden.bs.modal",
    () => {
      previewFrame.src = "";
    },
    { once: true }
  );
}

// -------------------- Ejecutar --------------------
verificarConexion();
cargarArchivos();
