import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Configuración Supabase
const SUPABASE_URL = "https://bazwwhwjruwgyfomyttp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmVlUs7q_BeBHxUo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📌 Obtener curso y semana desde la URL
const params = new URLSearchParams(window.location.search);
let curso = params.get("curso") || "Arquitectura de Software"; // nombre completo
let semanaNumero = params.get("semana") || "1"; // número (1,2,3...)

curso = decodeURIComponent(curso).trim();
semanaNumero = semanaNumero.trim();

// ✅ Carpeta real en Supabase
const carpeta = `${curso}/Semana ${semanaNumero}`; // Ejemplo: "Arquitectura de Software/Semana 1"

// Depuración
console.log("🎯 Curso obtenido:", curso);
console.log("🎯 Semana obtenida:", semanaNumero);
console.log("🎯 Carpeta a consultar en Supabase:", carpeta);

// Cambiar el título en la página
document.getElementById("tituloSemana").textContent = `${curso} - Semana ${semanaNumero}`;
const listaArchivos = document.getElementById("listaArchivos");

// 🔙 Insertar botón dinámico para volver al curso
const hero = document.querySelector("#fh5co-header .container .row .col-md-12");
if (hero) {
  const volverCursoBtn = document.createElement("a");
  volverCursoBtn.href = `curso.html?curso=${encodeURIComponent(curso)}`;
  volverCursoBtn.className = "btn btn-transparent m-2";
  volverCursoBtn.textContent = `⬅️ Volver a ${curso}`;
  hero.appendChild(volverCursoBtn);
}


// 📂 Verificar conexión a Supabase
async function verificarConexion() {
  try {
    const { data, error } = await supabase.storage
      .from("archivos")
      .list(carpeta, { limit: 1 });

    if (error) {
      console.error("❌ Error en la conexión con Supabase:", error.message);
      return;
    }

    console.log("✅ Conexión exitosa a Supabase. Archivos encontrados:", data);
  } catch (error) {
    console.error("❌ Error desconocido al verificar conexión:", error);
  }
}

// 📂 Listar archivos en carpeta
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

// 📂 Cargar archivos y mostrarlos
async function cargarArchivos() {
  listaArchivos.innerHTML = ` 
    <div class="col-12 text-center text-muted">
      <p>⏳ Cargando archivos...</p>
    </div>
  `;

  const archivos = await listarArchivos();
  listaArchivos.innerHTML = "";

  if (archivos.length === 0) {
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
      console.error("❌ Error al obtener URL pública para el archivo:", file.name);
      continue;
    }

    const verUrl = urlData.publicUrl;
    const descargarUrl = `${verUrl}?download=${file.name}`;

    console.log(`📂 Archivo: ${file.name}`);
    console.log(`🔗 URL pública generada: ${verUrl}`);

    // Detectar extensión
    const extension = file.name.split('.').pop().toLowerCase();
    let previewHTML = "";

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      previewHTML = `<img src="${verUrl}" class="preview-img" alt="${file.name}">`;
    } else if (extension === "pdf") {
      previewHTML = `<embed src="${verUrl}" type="application/pdf" class="preview-pdf"/>`;
    } else if (["doc", "docx"].includes(extension)) {
      previewHTML = `<img src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftword.svg" class="preview-icon" alt="Word">`;
    } else if (["xls", "xlsx"].includes(extension)) {
      previewHTML = `<img src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/microsoftexcel.svg" class="preview-icon" alt="Excel">`;
    } else {
      previewHTML = `<img src="https://cdn-icons-png.flaticon.com/512/564/564619.png" class="preview-icon" alt="Archivo">`;
    }

    const col = document.createElement("div");
    col.className = "col-md-4 col-sm-6";

    col.innerHTML = `
      <div class="card p-3 text-center shadow-sm h-100">
        ${previewHTML}
        <h6 class="card-title mt-2 text-truncate" title="${file.name}">${file.name}</h6>
        <div class="d-grid gap-2 mt-3">
          <a href="${verUrl}" target="_blank" class="btn btn-primary btn-sm">👁 Ver</a>
          <a href="${descargarUrl}" class="btn btn-success btn-sm">⬇ Descargar</a>
        </div>
      </div>
    `;

    listaArchivos.appendChild(col);
  }
}

// 🚀 Ejecutar
verificarConexion();
cargarArchivos();
