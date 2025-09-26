import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Configuración Supabase
const SUPABASE_URL = "https://bazwwhwjruwgyfomyttp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmVlUs7q_BeBHxUo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📌 Obtener curso y semana desde la URL
const params = new URLSearchParams(window.location.search);
let curso = params.get("curso") || "Arquitectura de Software";
let semanaNumero = params.get("semana") || "1";

curso = decodeURIComponent(curso).trim();
semanaNumero = semanaNumero.trim();

// ✅ Carpeta real en Supabase
const carpeta = `${curso}/Semana ${semanaNumero}`;

// Cambiar el título
const tituloEl = document.getElementById("tituloSemana");
if (tituloEl) tituloEl.textContent = `${curso} - Semana ${semanaNumero}`;

// Soportar ambos IDs (listaArchivos o archivos)
const listaArchivos =
  document.getElementById("listaArchivos") || document.getElementById("archivos");

if (!listaArchivos) {
  console.error(
    '⚠️ No se encontró el contenedor de archivos. Añade id="listaArchivos" o id="archivos".'
  );
}

// 🔙 Botón "Volver a [curso]"
const hero = document.querySelector("#fh5co-header .container .row .col-md-12");
if (hero) {
  const volverCursoBtn = document.createElement("a");
  volverCursoBtn.href = `curso.html?curso=${encodeURIComponent(curso)}`;
  volverCursoBtn.className = "btn btn-transparent m-2";
  volverCursoBtn.textContent = `⬅️ Volver a ${curso}`;
  hero.appendChild(volverCursoBtn);
}

// 🔍 Generar URL de vista (usa Google Docs para Office)
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

// 📂 Verificar conexión
async function verificarConexion() {
  try {
    const { data, error } = await supabase.storage
      .from("archivos")
      .list(carpeta, { limit: 1 });

    if (error) {
      console.error("❌ Error en la conexión con Supabase:", error.message);
      return;
    }
    console.log("✅ Conexión exitosa. Archivos encontrados:", data);
  } catch (error) {
    console.error("❌ Error desconocido al verificar conexión:", error);
  }
}

// 📂 Listar archivos
async function listarArchivos(path = carpeta) {
  console.log(`🌍 Listando archivos en: ${path}`);
  const { data, error } = await supabase.storage
    .from("archivos")
    .list(path, { limit: 100 });

  if (error) {
    console.error("❌ Error al listar archivos:", error.message);
    return [];
  }

  console.log("✅ Archivos encontrados:", data);
  return data.filter((item) => !item.metadata?.is_directory);
}

// 📂 Cargar archivos
async function cargarArchivos() {
  if (!listaArchivos) return;

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
    const { data: urlData } = supabase.storage
      .from("archivos")
      .getPublicUrl(`${carpeta}/${file.name}`);

    if (!urlData || !urlData.publicUrl) {
      console.error("❌ No se pudo obtener URL pública para:", file.name);
      continue;
    }

    const publicUrl = urlData.publicUrl;
    const descargarUrl = `${publicUrl}?download=${encodeURIComponent(
      file.name
    )}`;

    // Determinar ícono/preview
    const extension = file.name.split(".").pop().toLowerCase();
    let previewHTML = "";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      previewHTML = `<img src="${publicUrl}" class="preview-img" alt="${file.name}">`;
    } else if (extension === "pdf") {
      previewHTML = `<img src="https://cdn-icons-png.flaticon.com/512/337/337946.png" class="preview-icon" alt="PDF">`;
    } else if (["doc", "docx"].includes(extension)) {
      previewHTML = `<img src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftword.svg" class="preview-icon" alt="Word">`;
    } else if (["xls", "xlsx"].includes(extension)) {
      previewHTML = `<img src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftexcel.svg" class="preview-icon" alt="Excel">`;
    } else if (["ppt", "pptx"].includes(extension)) {
      previewHTML = `<img src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftpowerpoint.svg" class="preview-icon" alt="PowerPoint">`;
    } else {
      previewHTML = `<img src="https://cdn-icons-png.flaticon.com/512/564/564619.png" class="preview-icon" alt="Archivo">`;
    }

    // Crear card
    const col = document.createElement("div");
    col.className = "col-md-4 col-sm-6";

    const card = document.createElement("div");
    card.className = "card p-3 text-center shadow-sm h-100";

    card.innerHTML = `
      ${previewHTML}
      <h6 class="card-title mt-2 text-truncate" title="${file.name}">${file.name}</h6>
      <div class="d-grid gap-2 mt-3"></div>
    `;

    const actions = card.querySelector(".d-grid");

    // Botón vista previa
    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "btn btn-primary btn-sm";
    viewBtn.textContent = "👁 Vista previa";
    viewBtn.addEventListener("click", () =>
      abrirPreview(publicUrl, file.name)
    );

    // Botón descarga
    const dlLink = document.createElement("a");
    dlLink.href = descargarUrl;
    dlLink.className = "btn btn-success btn-sm";
    dlLink.textContent = "⬇ Descargar";
    dlLink.setAttribute("download", "");

    actions.appendChild(viewBtn);
    actions.appendChild(dlLink);

    col.appendChild(card);
    listaArchivos.appendChild(col);
  }
}

// 📌 Abrir modal con vista previa
function abrirPreview(fileUrl, filename) {
  const previewFrame = document.getElementById("previewFrame");
  const downloadBtn = document.getElementById("downloadBtn");
  const modalEl = document.getElementById("previewModal");

  if (!previewFrame || !downloadBtn || !modalEl) {
    console.error(
      "⚠️ Elementos del modal no encontrados (previewFrame, downloadBtn o previewModal)."
    );
    return;
  }

  const verUrl = getViewUrl(fileUrl, filename);
  previewFrame.src = verUrl;

  downloadBtn.href = `${fileUrl}?download=${encodeURIComponent(filename)}`;
  downloadBtn.setAttribute("download", filename);

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

// 🚀 Ejecutar
verificarConexion();
cargarArchivos();
