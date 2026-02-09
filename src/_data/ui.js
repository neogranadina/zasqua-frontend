module.exports = {
  // Navigation
  nav: {
    home: "Inicio",
    search: "Buscar",
    browse: "Explorar"
  },

  // Breadcrumbs
  breadcrumb: {
    home: "Inicio"
  },

  // Search page
  search: {
    placeholder: "Buscar en el catálogo...",
    button: "Buscar",
    results: "{count} resultados",
    noResults: "No se encontraron resultados",
    clearFilters: "Limpiar filtros",
    filtersHeader: "Filtros",
    sidebarHeading: "Filtrar por:",
    sidebarSearch: "Buscar en resultados...",
    sort: {
      label: "Ordenar por",
      relevance: "Relevancia",
      dateAsc: "Fecha (más antiguo)",
      dateDesc: "Fecha (más reciente)",
      titleAsc: "Título (A-Z)"
    },
    filterToggle: "Filtros",
    noResultsSuggestion: "Intenta limpiar los filtros o modificar la consulta.",
    dateFrom: "Desde",
    dateTo: "Hasta"
  },

  // Facet labels
  facets: {
    repository: "Repositorio",
    level: "Nivel de descripción",
    dateRange: "Rango de fechas",
    hasDigital: "Copia digitalizada disponible"
  },

  // Description levels (singular)
  levels: {
    fonds: "Fondo",
    subfonds: "Subfondo",
    series: "Serie",
    subseries: "Subserie",
    file: "Expediente",
    item: "Unidad documental",
    collection: "Colección",
    section: "Sección",
    volume: "Tomo"
  },

  // Description levels (plural, for child counts)
  levelsPlural: {
    fonds: "fondos",
    subfonds: "subfondos",
    series: "series",
    subseries: "subseries",
    file: "expedientes",
    item: "documentos",
    collection: "colecciones",
    section: "secciones",
    volume: "tomos",
    // Container types (from titles)
    caja: "cajas",
    carpeta: "carpetas",
    legajo: "legajos",
    tomo: "tomos"
  },

  // Description page
  description: {
    metadataHeader: "Descripción",
    accessConditionsHeader: "Condiciones de acceso",
    notesHeader: "Notas",
    entitiesHeader: "Personas y entidades relacionadas",
    placesHeader: "Lugares",
    childrenHeader: "Contenido",
    previous: "Anterior",
    next: "Siguiente",
    notDigitised: "Material no digitalizado",
    notDigitisedText: "Este documento no cuenta con copia digital. Para consultarlo, diríjase al repositorio de origen.",
    externalDigital: "Copia digital disponible",
    externalDigitalText: "Este documento ha sido digitalizado y puede consultarse en el repositorio de la institución custodia.",
    viewAllChildren: "Ver los {count} documentos"
  },

  // Entity roles
  roles: {
    creator: "Productor",
    contributor: "Colaborador",
    publisher: "Editor",
    subject: "Materia",
    mentioned: "Mencionado"
  },

  // Metadata field labels
  fields: {
    referenceCode: "Código de referencia",
    title: "Título",
    date: "Fecha",
    extent: "Extensión",
    scopeContent: "Alcance y contenido",
    arrangement: "Organización",
    accessConditions: "Condiciones de acceso",
    language: "Idioma",
    notes: "Notas"
  },

  // Repository page
  repository: {
    itemsCount: "documentos",
    dateRange: "Fechas extremas",
    collections: "Fondos y colecciones",
    noCollections: "No hay colecciones disponibles"
  },

  // Footer
  footer: {
    credits: "Desarrollado por Neogranadina con el apoyo de la Universidad de California, Santa Bárbara",
    copyright: "© {year} Fundación Histórica Neogranadina"
  },

  // General
  general: {
    loading: "Cargando...",
    error: "Ha ocurrido un error",
    viewMore: "Ver más",
    back: "Volver"
  }
};
