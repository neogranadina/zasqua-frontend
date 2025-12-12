module.exports = {
  title: "Zasqua",
  description: "Zasqua es la plataforma de consulta de materiales de archivo, libros, revistas e instrumentos de consulta digitalizados y sistematizados por Neogranadina y sus aliados.",
  url: process.env.SITE_URL || "http://localhost:8080",
  apiUrl: process.env.API_URL || "http://localhost:8000/api/v1",
  meilisearchUrl: process.env.MEILISEARCH_URL || "http://localhost:7700",
  meilisearchIndex: "descriptions",
  language: "es",
  buildTime: new Date().toISOString(),
  buildYear: new Date().getFullYear()
};
