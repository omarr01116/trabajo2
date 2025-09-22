import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Configuración Supabase
const SUPABASE_URL = "https://bazwwhwjruwgyfomyttp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmVlUs7q_BeBHxUo";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("formUpload");
const estado = document.getElementById("estado");
const listaArchivos = document.getElementById("listaArchivos");

const filtroCurso = document.getElementById("filtroCurso");
const filtroSemana = document.getElementById("filtroSemana");

// 🔼 Subir archivo
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const archivo = document.getElementById("archivo").files[0];
  const curso = document.getElementById("curso").value;
  const semana = document.getElementById("semana").value;

  if (!archivo) {
    estado.textContent = "⚠️ Selecciona un archivo.";
    estado.style.color = "yellow";
    return;
  }

  estado.textContent = "⏳ Subiendo...";
  estado.style.color = "orange";

  // ✅ Guardar en carpeta curso/semana
  const filePath = `${curso}/${semana}/${Date.now()}_${archivo.name}`;

  const { error } = await supabase.storage
    .from("archivos")
    .upload(filePath, archivo);

  if (error) {
    estado.textContent = "❌ Error al subir: " + error.message;
    estado.style.color = "red";
    return;
  }

  estado.textContent = "✅ Archivo subido.";
  estado.style.color = "lime";
  form.reset();

  cargarArchivos(filtroCurso.value, filtroSemana.value);
});

// 📂 Cargar archivos de un curso y semana
async function cargarArchivos(curso, semana) {
  listaArchivos.innerHTML = "<tr><td colspan='3'>⏳ Cargando...</td></tr>";

  const { data, error } = await supabase.storage
    .from("archivos")
    .list(`${curso}/${semana}`, { limit: 100 });

  listaArchivos.innerHTML = "";

  if (error) {
    listaArchivos.innerHTML = "<tr><td colspan='3'>❌ Error al listar</td></tr>";
    return;
  }

  if (!data || data.length === 0) {
    listaArchivos.innerHTML = "<tr><td colspan='3'>📭 Sin archivos</td></tr>";
    return;
  }

  for (const file of data) {
    const { data: urlData } = supabase.storage
      .from("archivos")
      .getPublicUrl(`${curso}/${semana}/${file.name}`);

    const fecha = new Date(file.created_at || Date.now()).toLocaleString();

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><a href="${urlData.publicUrl}" target="_blank">${file.name}</a></td>
      <td>${fecha}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="eliminarArchivo('${curso}/${semana}/${file.name}')">
          <i class="icon-trash"></i> Eliminar
        </button>
      </td>
    `;
    listaArchivos.appendChild(row);
  }
}

// 🎯 Eventos de filtros
filtroCurso.addEventListener("change", () => {
  cargarArchivos(filtroCurso.value, filtroSemana.value);
});

filtroSemana.addEventListener("change", () => {
  cargarArchivos(filtroCurso.value, filtroSemana.value);
});

// 🗑️ Eliminar archivo
window.eliminarArchivo = async (path) => {
  const { error } = await supabase.storage.from("archivos").remove([path]);
  if (error) {
    alert("❌ Error al eliminar: " + error.message);
  } else {
    alert("✅ Archivo eliminado.");
    cargarArchivos(filtroCurso.value, filtroSemana.value);
  }
};

// 🚀 Cargar inicial
cargarArchivos(filtroCurso.value, filtroSemana.value);
