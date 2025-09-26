import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// -------------------- Config Supabase (no tocar) --------------------
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

// -------------------- DOM containers --------------------
const tituloEl = document.getElementById("tituloSemana");
if (tituloEl) tituloEl.textContent = `${curso} - Semana ${semanaNumero}`;

// Soportar ambos ids: listaArchivos o archivos
const listaArchivos =
  document.getElementById("listaArchivos") || document.getElementById("archivos");

if (!listaArchivos) {
  console.error('No se encontró el contenedor de archivos. Debes tener id="listaArchivos" o id="archivos" en tu HTML.');
}

// -------------------- Util: crear modal si no existe --------------------
function ensureModalExists() {
  if (document.getElementById("previewModal")) return; // ya existe

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
        <div class="modal-footer">
          <a id="downloadBtn" class="btn btn-success" target="_blank" rel="noopener">⬇ Descargar</a>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// -------------------- Util: icon mapping --------------------
function getIconForExt(ext) {
  const map = {
    pdf: "https://cdn-icons-png.flaticon.com/512/337/337946.png",
    doc: "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftword.svg",
    docx: "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftword.svg",
    xls: "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftexcel.svg",
    xlsx: "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftexcel.svg",
    ppt: "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftpowerpoint.svg",
    pptx: "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftpowerpoint.svg",
    jpg: "image", // special: show thumbnail
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
  };
  return map[ext] || "https://cdn-icons-png.flaticon.com/512/564/564619.png";
}

// -------------------- Generar URL de vista (Google Docs para Office) --------------------
function getViewUrl(url, filename) {
  const ext = (filename || url).split(".").pop().toLowerCase();
  if (["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return url;
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  }
  return url;
}

// -------------------- Verificar conexión (solo log) --------------------
async function verificarConexion() {
  try {
    const { data, error } = await supabase.storage.from("archivos").list(carpeta, { limit: 1 });
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
    const { data, error } = await supabase.storage.from("archivos").list(path, { limit: 200 });
    if (error) {
      console.error("Error listando archivos:", error.message);
      return [];
    }
    return Array.isArray(data) ? data.filter(i => !i.metadata?.is_directory) : [];
  } catch (err) {
    console.error("Error listarArchivos:", err);
    return [];
  }
}

// -------------------- Cargar y renderizar cards (ICONOS) --------------------
async function cargarArchivos() {
  if (!listaArchivos) return;

  ensureModalExists();

  listaArchivos.innerHTML = `
    <div class="col-12 text-center text-muted">
      <p>⏳ Cargando archivos...</p>
    </div>
  `;

  const archivos = await listarArchivos();
  listaArchivos.innerHTML = "";

  if (!archivos || archivos.length === 0) {
    listaArchivos.innerHTML = `
      <div class="col-12 text-center text-muted">
        <p>📭 No hay archivos en "${curso} / Semana ${semanaNumero}".</p>
      </div>
    `;
    return;
  }

  for (const file of archivos) {
    // obtener url pública
    const { data: urlData } = supabase.storage.from("archivos").getPublicUrl(`${carpeta}/${file.name}`);
    if (!urlData || !urlData.publicUrl) {
      console.warn("No se obtuvo publicUrl para", file.name);
      continue;
    }
    const publicUrl = urlData.publicUrl;
    const descargarUrl = `${publicUrl}?download=${encodeURIComponent(file.name)}`;

    // extensión e icono
    const ext = file.name.split(".").pop().toLowerCase();
    const icon = getIconForExt(ext);

    // crear columna/card (usando clases bootstrap que ya tienes)
    const col = document.createElement("div");
    col.className = "col-md-3 col-sm-6 d-flex justify-content-center";

    const card = document.createElement("div");
    card.className = "archivo-card";
    // inline styles mínimos para que queden parejitas si no aplicaste CSS aún
    card.style.width = "230px";
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

    // icon / thumbnail
    let iconHtml = "";
    if (icon === "image") {
      // mostrar thumbnail para imágenes
      iconHtml = `<img src="${publicUrl}" alt="${file.name}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;margin:0 auto 8px;"/>`;
    } else {
      iconHtml = `<img src="${icon}" alt="${ext}" style="width:96px;height:96px;object-fit:contain;margin:8px auto;filter: none;"/>`;
    }

    // titulo y botones
    card.innerHTML = `
      <div>
        ${iconHtml}
        <div style="margin-top:6px;">
          <div style="font-size:13px;font-weight:600;word-break:break-word;">${file.name}</div>
        </div>
      </div>
      <div style="margin-top:10px; display:flex; gap:8px; justify-content:center;">
        <button type="button" class="btn btn-primary btn-sm btn-preview">👁 Vista previa</button>
        <a class="btn btn-success btn-sm" href="${descargarUrl}" download>⬇ Descargar</a>
      </div>
    `;

    // añadir al DOM
    col.appendChild(card);
    listaArchivos.appendChild(col);

    // añadir listener al botón (evita onclick inline)
    const viewBtn = card.querySelector(".btn-preview");
    if (viewBtn) {
      viewBtn.addEventListener("click", () => {
        abrirPreview(publicUrl, file.name);
      });
    }
  }
}

// -------------------- Abrir preview (usa modal creado arriba) --------------------
function abrirPreview(fileUrl, filename) {
  ensureModalExists(); // por si acaso

  const previewFrame = document.getElementById("previewFrame");
  const downloadBtn = document.getElementById("downloadBtn");
  const modalEl = document.getElementById("previewModal");

  if (!previewFrame || !downloadBtn || !modalEl) {
    console.error("Elementos del modal no encontrados (previewFrame, downloadBtn o previewModal).");
    return;
  }

  const verUrl = getViewUrl(fileUrl, filename);
  previewFrame.src = verUrl;

  downloadBtn.href = `${fileUrl}?download=${encodeURIComponent(filename)}`;
  downloadBtn.setAttribute("download", filename);

  if (typeof bootstrap === "undefined") {
    console.error("Bootstrap no está cargado. Asegúrate de incluir bootstrap.min.js antes de semana.js");
    // abrir en nueva ventana como fallback
    window.open(verUrl, "_blank", "noopener");
    return;
  }

  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  // limpiar iframe cuando se cierre el modal
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
