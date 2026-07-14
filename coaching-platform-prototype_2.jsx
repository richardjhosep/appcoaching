import React, { useState, createContext, useContext } from "react";
import {
  Compass, BookOpen, Calendar, TrendingUp, Users, Lock,
  ChevronRight, Star, FileText, PenLine, Building2, UserCircle,
  Clock, Target, CheckCircle2, Download, Plus, ArrowUpRight, ArrowRight,
  Bell, AlertTriangle, Search, Award, FileSpreadsheet, RefreshCw, Filter,
  Sparkles, DollarSign, BarChart3, PencilLine, Video, Phone, Mail, MessageSquare
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/* ---------------------------------------------------------
   DISEÑO — CoachFernandoRamos (nombre placeholder, fácil de cambiar)
   Paleta: tinta profunda #16232E · pergamino #F1EBDD · salvia #6B8F71 (crecimiento)
           bronce #B08D57 (acento cálido, uso restringido) · marfil #FBF9F4
   Tipografía: Fraunces (display) + Inter (cuerpo/datos) + IBM Plex Mono (cifras)
   Arquitectura: un solo Context (CoachingContext) conecta los datos entre las
   3 vistas de rol — cualquier edición en una vista se refleja en las demás.
--------------------------------------------------------- */

const FASES = ["Diagnóstico", "Desarrollo", "Consolidación"];
const TARIFA_HORA = { "Andes Minerals": 45000, "Viña del Sur": 40000 };
const HOY = { dia: 10, mes: 6, anio: 2026 }; // fecha de referencia del prototipo

const recursos = [
  { titulo: "Mapa de partes en conflicto interno", tipo: "PDF · Ejercicio", tag: "Autoconocimiento" },
  { titulo: "Guía: feedback ascendente sin fricción", tipo: "PDF · Lectura", tag: "Comunicación" },
  { titulo: "Diario de decisiones semanal", tipo: "Plantilla", tag: "Seguimiento" },
  { titulo: "Video: sistemas y roles (B. Oshry)", tipo: "Video · 12 min", tag: "Marco teórico" },
];

const plantillasPlan = [
  "Delegación y gestión de equipos",
  "Comunicación ascendente",
  "Manejo de conflicto con pares",
  "Foco estratégico y priorización",
];

const alertasSeguimiento = [
  { tipo: "warning", texto: "María Fernanda Soto no registra logros nuevos hace 5 días." },
  { tipo: "info", texto: "El ciclo de Rodrigo Peña ya se completó — confirma si el informe final quedó subido." },
  { tipo: "warning", texto: "Camila Rojas no tiene sesión agendada después del 22 de julio." },
];

const initialCoacheesData = [
  {
    id: 1,
    nombre: "María Fernanda Soto",
    empresa: "Andes Minerals",
    cargo: "Gerenta de Operaciones",
    jefeDirecto: "Gonzalo Ibáñez, Gerente General",
    objetivoProceso: "Delegar decisiones operativas de nivel medio para liberar foco estratégico",
    area: "Operaciones",
    telefono: "+56 9 7712 4530",
    email: "mfsoto@andesminerals.cl",
    resumenReunionInicial: {
      texto: "RRHH y su jefatura (Gonzalo Ibáñez) coinciden en que María Fernanda tiene alto potencial pero concentra decisiones que ya podría delegar. Se espera que el proceso libere tiempo para foco estratégico y fortalezca a su equipo de nivel medio.",
      fecha: "28 abr 2026",
      autor: "Coach Fernando Ramos",
    },
    postSesion: {
      aprendizajes: [
        { texto: "Delegar no es perder el control, es cambiar el tipo de control que ejerzo.", fecha: "30 jun" },
      ],
      utilidad: [
        { sesion: 4, valor: 5 },
        { sesion: 5, valor: 4 },
      ],
      temasProximos: [
        { texto: "Cómo dar feedback de proceso sin corregir el contenido", fecha: "30 jun" },
      ],
    },
    fase: 1,
    sesiones: { hechas: 5, total: 10 },
    avanceGeneral: 62,
    satisfaccion: 5,
    proximaSesion: "14 jul, 10:00",
    objetivos: [
      { titulo: "Delegar decisiones operativas de nivel medio", avance: 70 },
      { titulo: "Reducir reuniones 1:1 reactivas", avance: 45 },
    ],
    notasPrivadas: "Explorar patrón de sobre-responsabilización (Bowen: fusión con el equipo). Tarea: probar delegar comité semanal completo.",
    historialSesiones: [
      { sesion: 1, fecha: "5 may", nivel: 2, resumen: "Exploramos el patrón de sobre-responsabilización y el rol que ha tomado frente al equipo." },
      { sesion: 2, fecha: "19 may", nivel: 2, resumen: "Definimos criterios iniciales para decidir qué se delega y a quién." },
      { sesion: 3, fecha: "2 jun", nivel: 2.5, resumen: "Primer intento de comité delegado; identificamos qué gatilla que retome el control." },
      { sesion: 4, fecha: "16 jun", nivel: 3, resumen: "Practicó la pregunta '¿qué propones tú?' en dos situaciones reales." },
      { sesion: 5, fecha: "30 jun", nivel: 3, resumen: "Revisó su diario de logros; consolidando el hábito de no intervenir de inmediato." },
    ],
    historialCiclos: [
      { periodo: "Ene - Mar 2026", competencia: "Comunicación efectiva en reuniones", resultado: "Logrado" },
    ],
    resultadoProceso: null,
    recursosAsignados: ["Mapa de partes en conflicto interno", "Guía: feedback ascendente sin fricción"],
    logros: [
      { texto: "Sostuve el comité semanal completo sin tomar la palabra primero", fecha: "5 jul" },
      { texto: "Delegué la decisión del cronograma de mantenimiento sin intervenir después", fecha: "8 jul" },
    ],
    aprendizajes: [
      { recurso: "Mapa de partes en conflicto interno", texto: "Lo usé antes de la reunión con mi equipo para separar mi rol de jefa del de compañera; no intervine de inmediato.", fecha: "3 jul" },
    ],
    planDesarrollo: {
      competencia: "Delegación y gestión de equipos",
      nivelObjetivo: 4,
      objetivoGeneral: "Delegar de forma sostenida las decisiones operativas de nivel medio, liberando foco para decisiones estratégicas.",
      objetivosEspecificos: [
        "Definir criterios claros de qué decisiones delega y a quién",
        "Sostener un comité semanal sin intervenir en decisiones ya delegadas",
        "Dar feedback de proceso, no de contenido, en la mayoría de las delegaciones",
      ],
      estadoAprobacion: "Aprobado",
      comentarioCoach: "",
      nivelActual: 2,
      plazo: "30 sep 2026",
      descripcionActual: "Tiende a mantener el control operativo de decisiones que ya podrían estar en manos de su equipo de nivel medio.",
      habito: {
        cuando: "Un integrante del equipo trae una decisión operativa a resolver",
        enVezDe: "Resolverla ella misma o indicar exactamente qué hacer",
        voyA: "Preguntar '¿qué propones tú?' antes de opinar",
        obvio: "Post-it con la pregunta clave pegado en el monitor",
        sencillo: "Una sola pregunta, no un proceso largo",
        atractivo: "Asociarlo a la sensación de 'ganar tiempo' que más valora",
        satisfactorio: "Registrar cada logro en el diario de reflexión",
      },
      planEjecucion: [
        { actividad: "Mapear decisiones delegables del área", inicio: "01 jul", fin: "08 jul", estado: "Completado", objetivoIndex: 0 },
        { actividad: "Comunicar nuevos criterios al equipo", inicio: "09 jul", fin: "12 jul", estado: "Completado", objetivoIndex: 0 },
        { actividad: "Primer comité semanal sin intervención directa", inicio: "14 jul", fin: "14 jul", estado: "En curso", objetivoIndex: 1 },
        { actividad: "Revisión de resultados con jefatura", inicio: "28 jul", fin: "28 jul", estado: "Pendiente", objetivoIndex: 2 },
      ],
      formacion: {
        Libros: ["Multipliers — Liz Wiseman"],
        Artículos: ["HBR: el arte de dar y recibir feedback"],
        Videos: ["Sistemas y roles en equipos (B. Oshry) — 12 min"],
        Podcasts: ["WorkLife: la trampa de hacerlo todo tú"],
      },
    },
  },
  {
    id: 2,
    nombre: "Rodrigo Peña",
    empresa: "Andes Minerals",
    cargo: "Jefe de Proyectos",
    jefeDirecto: "María Fernanda Soto, Gerenta de Operaciones",
    objetivoProceso: "Fortalecer comunicación ascendente y manejo de conflicto con pares",
    area: "Proyectos",
    telefono: "+56 9 8823 1190",
    email: "rpena@andesminerals.cl",
    resumenReunionInicial: {
      texto: "RRHH y su jefatura directa señalan que Rodrigo evita llevar malas noticias al directorio y posterga conversaciones difíciles con pares. Buscan que gane soltura y estructura para comunicar avances y desacuerdos sin escalar innecesariamente.",
      fecha: "1 mar 2026",
      autor: "Coach Fernando Ramos",
    },
    postSesion: {
      aprendizajes: [
        { texto: "Preparar 3 puntos antes de una conversación difícil baja mi ansiedad y mejora cómo me escuchan.", fecha: "28 jun" },
      ],
      utilidad: [{ sesion: 8, valor: 5 }],
      temasProximos: [],
    },
    fase: 2,
    sesiones: { hechas: 8, total: 8 },
    avanceGeneral: 88,
    satisfaccion: 5,
    proximaSesion: "Sesión de cierre agendada",
    objetivos: [
      { titulo: "Comunicación ascendente con directorio", avance: 90 },
      { titulo: "Manejo de conflicto con par de área", avance: 85 },
    ],
    notasPrivadas: "Listo para autonomía plena. Consolidar con plan de sostenimiento a 90 días.",
    historialSesiones: [
      { sesion: 1, fecha: "10 mar", nivel: 2, resumen: "Diagnóstico inicial: evita llevar malas noticias al directorio." },
      { sesion: 4, fecha: "5 may", nivel: 3, resumen: "Practicó estructura de presentación de avances con datos." },
      { sesion: 8, fecha: "28 jun", nivel: 4, resumen: "Cierre del ciclo — revisión de logros y plan de sostenimiento." },
    ],
    historialCiclos: [],
    resultadoProceso: "Logrado",
    recursosAsignados: ["Video: sistemas y roles (B. Oshry)"],
    logros: [
      { texto: "Presentó el informe de avance al directorio sin apoyo previo del coach", fecha: "20 jun" },
    ],
    aprendizajes: [],
    reporteFinal: {
      fecha: "30 jun 2026",
      subidoPor: "Coach Fernando Ramos",
      resumen:
        "Rodrigo completó su ciclo de 8 sesiones enfocado en comunicación ascendente y manejo de conflicto. Muestra un cambio sostenido en cómo presenta información al directorio y cómo aborda desacuerdos con pares.",
      logros: [
        "Presenta avances de proyecto con estructura clara y datos, sin necesidad de guía previa",
        "Resolvió dos conflictos de coordinación entre áreas sin escalar a su jefatura",
        "Adoptó el hábito de pedir feedback de proceso al cierre de cada hito",
      ],
      recomendacion:
        "Sostener con revisiones trimestrales breves durante los próximos 6 meses; no requiere nuevo ciclo de coaching en el corto plazo.",
    },
    planDesarrollo: {
      competencia: "Comunicación ascendente y manejo de conflicto",
      nivelObjetivo: 4,
      objetivoGeneral: "Comunicar avances y desacuerdos con claridad y sin evitación frente a jefaturas y pares.",
      objetivosEspecificos: [
        "Presentar avances con estructura y datos, sin depender de guía previa",
        "Abordar desacuerdos con pares sin escalar de inmediato",
      ],
      estadoAprobacion: "Aprobado",
      comentarioCoach: "",
      nivelActual: 4,
      plazo: "30 jun 2026",
      descripcionActual: "Evitaba llevar malas noticias o desacuerdos hacia arriba en la organización.",
      habito: {
        cuando: "Debe informar un atraso o desacuerdo a su jefatura",
        enVezDe: "Postergar la conversación o suavizar el mensaje hasta perder claridad",
        voyA: "Preparar 3 puntos clave antes de la reunión y decirlos directo",
        obvio: "Bloque de 10 min en la agenda antes de cada reunión de avance",
        sencillo: "Solo 3 puntos, no un informe extenso",
        atractivo: "Vincularlo a la sensación de control que le da prepararse",
        satisfactorio: "Feedback positivo inmediato de su jefatura",
      },
      planEjecucion: [
        { actividad: "Preparar estructura de 3 puntos para reportes", inicio: "10 mar", fin: "20 mar", estado: "Completado", objetivoIndex: 0 },
        { actividad: "Presentar primer informe con la nueva estructura", inicio: "25 mar", fin: "25 mar", estado: "Completado", objetivoIndex: 0 },
        { actividad: "Sostener estructura por 3 meses", inicio: "01 abr", fin: "28 jun", estado: "Completado", objetivoIndex: 1 },
      ],
      formacion: {
        Libros: [],
        Artículos: ["HBR: cómo dar malas noticias hacia arriba"],
        Videos: [],
        Podcasts: [],
      },
    },
  },
  {
    id: 3,
    nombre: "Camila Rojas",
    empresa: "Viña del Sur",
    cargo: "Directora Comercial",
    jefeDirecto: "Ignacio Correa, Gerente General",
    objetivoProceso: "Definir foco estratégico comercial del semestre",
    area: "Comercial",
    telefono: "+56 9 6541 0287",
    email: "crojas@vinadelsur.cl",
    resumenReunionInicial: null,
    postSesion: {
      aprendizajes: [],
      utilidad: [],
      temasProximos: [
        { texto: "Cómo decir que no a solicitudes que no son prioritarias", fecha: "8 jul" },
      ],
    },
    fase: 0,
    sesiones: { hechas: 1, total: 8 },
    avanceGeneral: 12,
    satisfaccion: 4,
    proximaSesion: "22 jul, 15:30",
    objetivos: [{ titulo: "Definir foco estratégico del semestre", avance: 20 }],
    notasPrivadas: "Primera sesión: alta demanda externa, poco espacio propio. Aplicar mapa de sistemas (Oshry) en próxima sesión.",
    historialSesiones: [
      { sesion: 1, fecha: "8 jul", nivel: 2, resumen: "Primera sesión: mapeo de demandas externas y espacio propio de decisión." },
    ],
    historialCiclos: [],
    resultadoProceso: null,
    recursosAsignados: [],
    logros: [],
    aprendizajes: [],
    planDesarrollo: {
      competencia: "",
      nivelObjetivo: 3,
      objetivoGeneral: "",
      objetivosEspecificos: [""],
      estadoAprobacion: "Sin enviar",
      comentarioCoach: "",
      nivelActual: 2,
      plazo: "",
      descripcionActual: "",
      habito: { cuando: "", enVezDe: "", voyA: "", obvio: "", sencillo: "", atractivo: "", satisfactorio: "" },
      planEjecucion: [],
      formacion: { Libros: [], Artículos: [], Videos: [], Podcasts: [] },
    },
  },
];

const sesionesAgendaIniciales = [
  { id: 1, dia: 14, mes: 6, anio: 2026, hora: "10:00", coachee: "María Fernanda Soto" },
  { id: 2, dia: 16, mes: 6, anio: 2026, hora: "09:30", coachee: "Rodrigo Peña" },
  { id: 3, dia: 22, mes: 6, anio: 2026, hora: "15:30", coachee: "Camila Rojas" },
  { id: 4, dia: 24, mes: 6, anio: 2026, hora: "11:00", coachee: "María Fernanda Soto" },
  { id: 5, dia: 3, mes: 7, anio: 2026, hora: "09:00", coachee: "Rodrigo Peña" },
  { id: 6, dia: 3, mes: 6, anio: 2026, hora: "10:00", coachee: "Rodrigo Peña" },
  { id: 7, dia: 8, mes: 6, anio: 2026, hora: "10:00", coachee: "María Fernanda Soto" },
  { id: 8, dia: 8, mes: 6, anio: 2026, hora: "15:00", coachee: "Camila Rojas" },
  { id: 9, dia: 10, mes: 6, anio: 2026, hora: "11:30", coachee: "María Fernanda Soto" },
];

/* ---------------------------------------------------------
   CONTEXTO — fuente única de datos compartida entre roles
--------------------------------------------------------- */
const CoachingContext = createContext(null);
function useCoaching() {
  return useContext(CoachingContext);
}

function CoachingProvider({ children }) {
  const [coachees, setCoachees] = useState(initialCoacheesData);
  const [sesionesAgenda, setSesionesAgenda] = useState(sesionesAgendaIniciales);

  const updateCoachee = (id, updater) => {
    setCoachees((prev) =>
      prev.map((c) => (c.id === id ? (typeof updater === "function" ? updater(c) : { ...c, ...updater }) : c))
    );
  };

  return (
    <CoachingContext.Provider value={{ coachees, updateCoachee, sesionesAgenda, setSesionesAgenda }}>
      {children}
    </CoachingContext.Provider>
  );
}

/* ---------------------------------------------------------
   COMPONENTES BASE
--------------------------------------------------------- */
function Rings({ fase }) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {FASES.map((f, i) => (
        <div key={f} className="flex items-center gap-1 sm:gap-1.5">
          <div
            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 ${
              i < fase ? "bg-[#6B8F71] border-[#6B8F71]" :
              i === fase ? "border-[#6B8F71] bg-transparent" :
              "border-[#C9C0AC] bg-transparent"
            }`}
          />
          {i < FASES.length - 1 && (
            <div className={`w-3 sm:w-4 h-[1.5px] ${i < fase ? "bg-[#6B8F71]" : "bg-[#C9C0AC]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ value, color = "#6B8F71" }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-[#E4DCC9] overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

function Stars({ n }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} className={i <= n ? "fill-[#B08D57] text-[#B08D57]" : "text-[#D8D0BC]"} />
      ))}
    </div>
  );
}

function Campo({ label, value, onChange, placeholder, mono, disabled }) {
  return (
    <div>
      {label && <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-1.5">{label}</p>}
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full text-sm border border-[#E4DCC9] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40 disabled:bg-[#F1EBDD] disabled:text-[#8A8270] disabled:cursor-not-allowed ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

function CampoTexto({ label, value, onChange, placeholder, filas = 2, disabled }) {
  return (
    <div>
      {label && <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-1.5">{label}</p>}
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={filas}
        className="w-full text-sm border border-[#E4DCC9] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40 disabled:bg-[#F1EBDD] disabled:text-[#8A8270] disabled:cursor-not-allowed"
      />
    </div>
  );
}

/* ---------------------------------------------------------
   PLAN DE DESARROLLO
   - Competencia, nivel objetivo, objetivo general y objetivos específicos
     requieren aprobación del coach antes de quedar activos.
   - Todo lo demás (nivel actual, plazo, descripción actual, hábito,
     plan de ejecución y formación) lo edita el coachee libremente.
--------------------------------------------------------- */
function BotonUnirseSesion({ nombreCoachee }) {
  const { sesionesAgenda } = useCoaching();
  const [conectando, setConectando] = useState(false);
  const sesionHoy = sesionesAgenda.find(
    (s) => s.dia === HOY.dia && s.mes === HOY.mes && s.anio === HOY.anio && (!nombreCoachee || s.coachee === nombreCoachee)
  );

  if (!sesionHoy) {
    return (
      <div className="flex items-center gap-2 text-xs sm:text-sm text-[#8A8270] border border-dashed border-[#E4DCC9] rounded-xl px-3.5 py-2.5">
        <Video size={15} className="shrink-0" /> No tienes sesión activa hoy.
      </div>
    );
  }

  return (
    <button
      onClick={() => setConectando(true)}
      className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm bg-[#6B8F71] text-white px-4 py-2.5 rounded-xl hover:bg-[#52735A] transition-colors"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
      </span>
      <Video size={16} />
      {conectando
        ? "Conectando a tu videollamada…"
        : `Unirse a la sesión de hoy · ${sesionHoy.hora}${nombreCoachee ? "" : " · " + sesionHoy.coachee}`}
    </button>
  );
}

function PlanDesarrollo({ coacheeId }) {
  const { coachees, updateCoachee } = useCoaching();
  const coachee = coachees.find((c) => c.id === coacheeId);
  const plan = coachee.planDesarrollo;
  const estados = ["Pendiente", "En curso", "Completado"];
  const colorEstado = (e) =>
    e === "Completado" ? "#6B8F71" : e === "En curso" ? "#B08D57" : "#B0A78E";

  const bloqueado = plan.estadoAprobacion === "Aprobado" || plan.estadoAprobacion === "Pendiente de aprobación";

  const setPlan = (patch) =>
    updateCoachee(coacheeId, (c) => ({ ...c, planDesarrollo: { ...c.planDesarrollo, ...patch } }));
  const setHabitoCampo = (campo, valor) =>
    updateCoachee(coacheeId, (c) => ({ ...c, planDesarrollo: { ...c.planDesarrollo, habito: { ...c.planDesarrollo.habito, [campo]: valor } } }));

  const setObjetivo = (idx, valor) => {
    const objetivos = [...plan.objetivosEspecificos];
    objetivos[idx] = valor;
    setPlan({ objetivosEspecificos: objetivos });
  };
  const agregarObjetivo = () => setPlan({ objetivosEspecificos: [...plan.objetivosEspecificos, ""] });
  const quitarObjetivo = (idx) => setPlan({ objetivosEspecificos: plan.objetivosEspecificos.filter((_, i) => i !== idx) });

  const setActividadCampo = (idx, campo, valor) => {
    const actividades = [...plan.planEjecucion];
    actividades[idx] = { ...actividades[idx], [campo]: valor };
    setPlan({ planEjecucion: actividades });
  };
  const avanzarEstado = (idx) => {
    const actividades = [...plan.planEjecucion];
    const actual = estados.indexOf(actividades[idx].estado);
    actividades[idx] = { ...actividades[idx], estado: estados[(actual + 1) % estados.length] };
    setPlan({ planEjecucion: actividades });
  };
  const agregarActividad = () =>
    setPlan({ planEjecucion: [...plan.planEjecucion, { actividad: "", inicio: "", fin: "", estado: "Pendiente", objetivoIndex: null }] });
  const quitarActividad = (idx) => setPlan({ planEjecucion: plan.planEjecucion.filter((_, i) => i !== idx) });

  const setFormacionItem = (categoria, idx, valor) => {
    const items = [...plan.formacion[categoria]];
    items[idx] = valor;
    setPlan({ formacion: { ...plan.formacion, [categoria]: items } });
  };
  const agregarFormacionItem = (categoria) =>
    setPlan({ formacion: { ...plan.formacion, [categoria]: [...plan.formacion[categoria], ""] } });
  const quitarFormacionItem = (categoria, idx) =>
    setPlan({ formacion: { ...plan.formacion, [categoria]: plan.formacion[categoria].filter((_, i) => i !== idx) } });

  const enviarAprobacion = () => setPlan({ estadoAprobacion: "Pendiente de aprobación" });
  const proponerCambios = () => setPlan({ estadoAprobacion: "Sin enviar" });

  const badge = {
    "Sin enviar": { bg: "#E4DCC9", text: "#5C5340", label: "Borrador — aún no enviado" },
    "Pendiente de aprobación": { bg: "#B08D57", text: "white", label: "Pendiente de aprobación" },
    "Aprobado": { bg: "#6B8F71", text: "white", label: "Aprobado por tu coach" },
    "Cambios solicitados": { bg: "#B0665B", text: "white", label: "Tu coach solicitó cambios" },
  }[plan.estadoAprobacion];

  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5 space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-[#6B8F71]" />
          <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Plan de desarrollo</h3>
        </div>
        <p className="text-xs text-[#8A8270]">Completa cada parte — este plan es tuyo.</p>
      </div>

      {/* Bloque que requiere aprobación del coach */}
      <div className="border border-[#E4DCC9] rounded-xl p-3.5 sm:p-4 space-y-4 bg-[#FBF9F4]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: badge.bg, color: badge.text }}>
            {badge.label}
          </span>
          {plan.estadoAprobacion === "Aprobado" && (
            <button onClick={proponerCambios} className="flex items-center gap-1 text-xs text-[#6B8F71] hover:text-[#16232E]">
              <PencilLine size={12} /> Proponer cambios
            </button>
          )}
        </div>

        {plan.estadoAprobacion === "Cambios solicitados" && plan.comentarioCoach && (
          <div className="flex items-start gap-2 bg-[#F5EAE0] border border-[#E4C9A8] rounded-lg px-3 py-2.5 text-sm text-[#5C5340]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#B08D57]" />
            <span><strong>Tu coach pidió ajustar esto:</strong> {plan.comentarioCoach}</span>
          </div>
        )}

        <Campo
          label="Competencia a desarrollar"
          value={plan.competencia}
          onChange={(v) => setPlan({ competencia: v })}
          placeholder="Ej. Delegación y gestión de equipos"
          disabled={bloqueado}
        />

        <div>
          <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-1.5">Nivel objetivo (1-5)</p>
          <select
            value={plan.nivelObjetivo}
            disabled={bloqueado}
            onChange={(e) => setPlan({ nivelObjetivo: Number(e.target.value) })}
            className="w-full sm:w-32 text-sm border border-[#E4DCC9] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40 disabled:bg-[#F1EBDD] disabled:text-[#8A8270]"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <CampoTexto
          label="Objetivo general"
          value={plan.objetivoGeneral}
          onChange={(v) => setPlan({ objetivoGeneral: v })}
          placeholder="¿Cómo se vería el nuevo nivel logrado?"
          filas={3}
          disabled={bloqueado}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide text-[#8A8270]">Objetivos específicos</p>
            {!bloqueado && (
              <button onClick={agregarObjetivo} className="flex items-center gap-1 text-xs text-[#6B8F71] hover:text-[#16232E]">
                <Plus size={12} /> Agregar
              </button>
            )}
          </div>
          <div className="space-y-2">
            {plan.objetivosEspecificos.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-mono text-[#6B8F71] shrink-0 text-sm">{String(i + 1).padStart(2, "0")}</span>
                <input
                  value={o}
                  disabled={bloqueado}
                  onChange={(e) => setObjetivo(i, e.target.value)}
                  placeholder="¿Cómo lograrás el objetivo general?"
                  className="flex-1 min-w-0 text-sm border border-[#E4DCC9] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40 disabled:bg-[#F1EBDD] disabled:text-[#8A8270]"
                />
                {!bloqueado && (
                  <button onClick={() => quitarObjetivo(i)} className="text-xs text-[#B0A78E] hover:text-[#16232E] shrink-0">Quitar</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {(plan.estadoAprobacion === "Sin enviar" || plan.estadoAprobacion === "Cambios solicitados") && (
          <button
            onClick={enviarAprobacion}
            className="w-full sm:w-auto text-sm bg-[#16232E] text-[#F1EBDD] px-4 py-2.5 rounded-lg hover:bg-[#233544] transition-colors"
          >
            Enviar a mi coach para aprobación
          </button>
        )}
        {plan.estadoAprobacion === "Pendiente de aprobación" && (
          <p className="text-xs text-[#8A8270] italic">Tu coach está revisando esto — te avisaremos cuando lo confirme.</p>
        )}
      </div>

      {/* Campos de libre edición del coachee */}
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-1.5">Nivel actual (1-5)</p>
          <select
            value={plan.nivelActual}
            onChange={(e) => setPlan({ nivelActual: Number(e.target.value) })}
            className="w-full text-sm border border-[#E4DCC9] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Campo label="Plazo para lograrlo" value={plan.plazo} onChange={(v) => setPlan({ plazo: v })} placeholder="Ej. 30 sep 2026" />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-[#B0A78E] flex items-center justify-center font-mono text-sm text-[#8A8270] shrink-0">
          {plan.nivelActual}
        </div>
        <ArrowRight size={14} className="text-[#B0A78E]" />
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#6B8F71] flex items-center justify-center font-mono text-sm text-white shrink-0">
          {plan.nivelObjetivo}
        </div>
        <span className="text-xs text-[#8A8270] ml-1">tu recorrido de nivel</span>
      </div>

      <CampoTexto
        label="Descripción del estado actual"
        value={plan.descripcionActual}
        onChange={(v) => setPlan({ descripcionActual: v })}
        placeholder="¿Cómo se ve hoy esta competencia en tu día a día?"
        filas={3}
      />

      <div className="border-t border-[#EFEAE0] pt-5">
        <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-3">Hábito a cambiar</p>
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-3 bg-[#FBF9F4] rounded-xl p-3.5 sm:p-4">
            <Campo label="Cuándo (el detonante)" value={plan.habito.cuando} onChange={(v) => setHabitoCampo("cuando", v)} placeholder="¿Qué situación dispara el hábito actual?" />
            <Campo label="En vez de (tu hábito actual)" value={plan.habito.enVezDe} onChange={(v) => setHabitoCampo("enVezDe", v)} placeholder="¿Qué haces hoy?" />
            <Campo label="Voy a (tu nuevo hábito)" value={plan.habito.voyA} onChange={(v) => setHabitoCampo("voyA", v)} placeholder="¿Qué harás en su lugar?" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {[
              ["Obvio", "obvio", "¿Cómo lo haces visible?"],
              ["Sencillo", "sencillo", "¿Cómo lo haces fácil?"],
              ["Atractivo", "atractivo", "¿Cómo lo haces apetecible?"],
              ["Satisfactorio", "satisfactorio", "¿Cómo lo haces gratificante?"],
            ].map(([label, campo, placeholder]) => (
              <div key={campo} className="border border-[#E4DCC9] rounded-xl p-2.5 sm:p-3">
                <p className="text-xs font-medium text-[#B08D57] mb-1.5">{label}</p>
                <textarea
                  value={plan.habito[campo]}
                  onChange={(e) => setHabitoCampo(campo, e.target.value)}
                  placeholder={placeholder}
                  rows={2}
                  className="w-full text-xs border-none p-0 resize-none focus:outline-none bg-transparent leading-snug"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#EFEAE0] pt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wide text-[#8A8270]">Plan de ejecución</p>
          <button onClick={agregarActividad} className="flex items-center gap-1 text-xs text-[#6B8F71] hover:text-[#16232E]">
            <Plus size={12} /> Agregar actividad
          </button>
        </div>
        <div className="space-y-2.5">
          {plan.planEjecucion.map((a, i) => (
            <div key={i} className="border border-[#E4DCC9] rounded-xl px-3 py-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={a.actividad}
                  onChange={(e) => setActividadCampo(i, "actividad", e.target.value)}
                  placeholder="Actividad"
                  className="flex-1 min-w-0 text-sm border-none focus:outline-none bg-transparent text-[#3A3226]"
                />
                <button
                  onClick={() => avanzarEstado(i)}
                  className="text-xs font-medium px-3 py-1 rounded-full text-white transition-colors whitespace-nowrap shrink-0"
                  style={{ backgroundColor: colorEstado(a.estado) }}
                  title="Click para actualizar el estado"
                >
                  {a.estado}
                </button>
                <button onClick={() => quitarActividad(i)} className="text-xs text-[#B0A78E] hover:text-[#16232E] shrink-0">Quitar</button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={a.inicio}
                  onChange={(e) => setActividadCampo(i, "inicio", e.target.value)}
                  placeholder="Inicio"
                  className="w-20 text-xs font-mono border border-[#E4DCC9] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
                />
                <input
                  value={a.fin}
                  onChange={(e) => setActividadCampo(i, "fin", e.target.value)}
                  placeholder="Fin"
                  className="w-20 text-xs font-mono border border-[#E4DCC9] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
                />
                <select
                  value={a.objetivoIndex === null || a.objetivoIndex === undefined ? "" : a.objetivoIndex}
                  onChange={(e) => setActividadCampo(i, "objetivoIndex", e.target.value === "" ? null : Number(e.target.value))}
                  className="flex-1 min-w-[140px] text-xs border border-[#E4DCC9] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
                >
                  <option value="">Objetivo primario: sin vincular</option>
                  {plan.objetivosEspecificos.map((o, oi) => (
                    <option key={oi} value={oi}>
                      Objetivo {oi + 1}: {o.length > 40 ? o.slice(0, 40) + "…" : o || "(sin definir)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#EFEAE0] pt-5">
        <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-3">Plan de formación</p>
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {Object.entries(plan.formacion).map(([categoria, items]) => (
            <div key={categoria}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-[#16232E] flex items-center gap-1.5">
                  <BookOpen size={13} className="text-[#6B8F71]" /> {categoria}
                </p>
                <button onClick={() => agregarFormacionItem(categoria)} className="text-xs text-[#6B8F71] hover:text-[#16232E]">
                  <Plus size={12} className="inline" />
                </button>
              </div>
              <div className="space-y-1.5">
                {items.map((it, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      value={it}
                      onChange={(e) => setFormacionItem(categoria, i, e.target.value)}
                      placeholder={`Agregar ${categoria.toLowerCase()}`}
                      className="flex-1 min-w-0 text-xs border border-[#E4DCC9] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
                    />
                    <button onClick={() => quitarFormacionItem(categoria, i)} className="text-xs text-[#B0A78E] hover:text-[#16232E]">✕</button>
                  </div>
                ))}
                {items.length === 0 && <p className="text-xs text-[#B0A78E] italic">Sin registros aún.</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LineaProgreso({ datos }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <TrendingUp size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Línea de tiempo de tu progreso</h3>
      </div>
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer>
          <LineChart data={datos} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E4DCC9" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "#8A8270" }} axisLine={{ stroke: "#E4DCC9" }} tickLine={false} />
            <YAxis domain={[1, 5]} tick={{ fontSize: 10, fill: "#8A8270" }} axisLine={false} tickLine={false} width={22} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4DCC9" }} />
            <Line type="monotone" dataKey="nivel" stroke="#6B8F71" strokeWidth={2.5} dot={{ r: 4, fill: "#6B8F71" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-[#8A8270] mt-2">Nivel de la competencia registrado sesión a sesión.</p>
    </div>
  );
}

function ResumenSesiones({ historial }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <FileText size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Resumen de tus sesiones</h3>
      </div>
      <p className="text-xs text-[#8A8270] mb-3">Lo que tu coach comparte al cierre de cada sesión (distinto de sus notas privadas).</p>
      <div className="space-y-2 sm:space-y-2.5">
        {[...historial].reverse().map((h) => (
          <div key={h.sesion} className="flex gap-3 border border-[#E4DCC9] rounded-xl px-3 py-2.5">
            <div className="flex flex-col items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#FBF9F4] shrink-0">
              <span className="text-xs font-mono font-semibold text-[#16232E]">#{h.sesion}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#8A8270] mb-0.5">{h.fecha}</p>
              <p className="text-sm text-[#3A3226] leading-snug">{h.resumen}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Autoevaluacion() {
  const preguntas = [
    "¿Qué tan cerca sientes que estás de tu objetivo?",
    "¿Qué tan sostenido es el cambio de hábito hasta ahora?",
    "¿Qué tanto apoyo sientes de tu entorno para este proceso?",
  ];
  const [respuestas, setRespuestas] = useState({});
  const [enviado, setEnviado] = useState(false);
  const responder = (i, valor) => setRespuestas((r) => ({ ...r, [i]: valor }));
  const completa = preguntas.every((_, i) => respuestas[i]);

  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Autoevaluación periódica</h3>
      </div>
      <p className="text-xs text-[#8A8270] mb-4">Toca cada tres sesiones — tu propia mirada del proceso, además de los datos.</p>
      {enviado ? (
        <p className="text-sm text-[#6B8F71] flex items-center gap-1.5"><CheckCircle2 size={15} /> Gracias, tu autoevaluación quedó registrada.</p>
      ) : (
        <div className="space-y-4">
          {preguntas.map((p, i) => (
            <div key={i}>
              <p className="text-sm text-[#3A3226] mb-2">{p}</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => responder(i, n)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border text-xs font-mono transition-colors"
                    style={
                      respuestas[i] === n
                        ? { backgroundColor: "#6B8F71", borderColor: "#6B8F71", color: "white" }
                        : { borderColor: "#E4DCC9", color: "#8A8270", backgroundColor: "white" }
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            disabled={!completa}
            onClick={() => setEnviado(true)}
            className={`w-full sm:w-auto text-sm px-4 py-2 rounded-lg transition-colors ${
              completa ? "bg-[#16232E] text-[#F1EBDD] hover:bg-[#233544]" : "bg-[#E4DCC9] text-[#B0A78E] cursor-not-allowed"
            }`}
          >
            Enviar autoevaluación
          </button>
        </div>
      )}
    </div>
  );
}

function SolicitudReagendamiento({ proximaSesion }) {
  const [motivo, setMotivo] = useState("");
  const [enviado, setEnviado] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <RefreshCw size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Solicitar reagendamiento</h3>
      </div>
      <p className="text-xs text-[#8A8270] mb-3">Sesión actual: {proximaSesion}</p>
      {enviado ? (
        <p className="text-sm text-[#6B8F71] flex items-center gap-1.5"><CheckCircle2 size={15} /> Solicitud enviada a tu coach — te confirmará una nueva hora.</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo del cambio (opcional)"
            className="flex-1 min-w-0 text-sm border border-[#E4DCC9] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
          />
          <button
            onClick={() => setEnviado(true)}
            className="text-sm bg-[#16232E] text-[#F1EBDD] px-3.5 py-2 rounded-lg hover:bg-[#233544] transition-colors"
          >
            Solicitar cambio
          </button>
        </div>
      )}
    </div>
  );
}

function CertificadoFinal({ finalizado }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <Award size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Certificado y resumen final</h3>
      </div>
      {finalizado ? (
        <>
          <p className="text-sm text-[#3A3226] mb-3">Tu proceso está cerrado. Descarga tu resumen completo — objetivo, logros y aprendizajes.</p>
          <button className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-sm bg-[#16232E] text-[#F1EBDD] px-3.5 py-2 rounded-lg hover:bg-[#233544] transition-colors">
            <Download size={14} /> Descargar certificado (PDF)
          </button>
        </>
      ) : (
        <p className="text-sm text-[#B0A78E] italic">Disponible cuando termines tu ciclo de sesiones actual.</p>
      )}
    </div>
  );
}

function PostSesion({ coacheeId }) {
  const { coachees, updateCoachee } = useCoaching();
  const coachee = coachees.find((c) => c.id === coacheeId);
  const postSesion = coachee.postSesion || { aprendizajes: [], utilidad: [], temasProximos: [] };

  const [nuevoAprendizaje, setNuevoAprendizaje] = useState("");
  const [nuevoTema, setNuevoTema] = useState("");

  const sesionActual = coachee.sesiones.hechas;
  const yaEvaluada = postSesion.utilidad.some((u) => u.sesion === sesionActual);

  const agregarAprendizaje = () => {
    if (!nuevoAprendizaje.trim()) return;
    updateCoachee(coacheeId, (c) => ({
      ...c,
      postSesion: { ...c.postSesion, aprendizajes: [{ texto: nuevoAprendizaje.trim(), fecha: "hoy" }, ...c.postSesion.aprendizajes] },
    }));
    setNuevoAprendizaje("");
  };

  const evaluarUtilidad = (valor) => {
    updateCoachee(coacheeId, (c) => ({
      ...c,
      postSesion: {
        ...c.postSesion,
        utilidad: [...c.postSesion.utilidad.filter((u) => u.sesion !== sesionActual), { sesion: sesionActual, valor }],
      },
    }));
  };

  const agregarTema = () => {
    if (!nuevoTema.trim()) return;
    updateCoachee(coacheeId, (c) => ({
      ...c,
      postSesion: { ...c.postSesion, temasProximos: [{ texto: nuevoTema.trim(), fecha: "hoy" }, ...c.postSesion.temasProximos] },
    }));
    setNuevoTema("");
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5 space-y-5">
      <div className="flex items-center gap-2">
        <MessageSquare size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Post-sesión</h3>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-2">Aprendizajes principales</p>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            value={nuevoAprendizaje}
            onChange={(e) => setNuevoAprendizaje(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarAprendizaje()}
            placeholder="¿Qué te llevas de esta sesión?"
            className="flex-1 min-w-0 text-sm border border-[#E4DCC9] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
          />
          <button onClick={agregarAprendizaje} className="flex items-center justify-center gap-1.5 text-sm bg-[#16232E] text-[#F1EBDD] px-3.5 py-2 rounded-lg hover:bg-[#233544] transition-colors">
            <Plus size={14} /> Agregar
          </button>
        </div>
        <div className="space-y-1.5">
          {postSesion.aprendizajes.length === 0 && <p className="text-xs text-[#B0A78E] italic">Sin registros aún.</p>}
          {postSesion.aprendizajes.map((a, i) => (
            <div key={i} className="text-sm border border-[#E4DCC9] rounded-lg px-3 py-2">
              <p className="text-[#3A3226]">{a.texto}</p>
              <p className="text-xs text-[#8A8270] mt-0.5">{a.fecha}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#EFEAE0] pt-4">
        <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-2">¿Qué tan útil fue tu última sesión?</p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const evaluada = postSesion.utilidad.find((u) => u.sesion === sesionActual);
            const activo = evaluada?.valor === n;
            return (
              <button
                key={n}
                onClick={() => evaluarUtilidad(n)}
                className="w-8 h-8 rounded-full border text-xs font-mono transition-colors"
                style={activo ? { backgroundColor: "#6B8F71", borderColor: "#6B8F71", color: "white" } : { borderColor: "#E4DCC9", color: "#8A8270", backgroundColor: "white" }}
              >
                {n}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[#8A8270] mt-1.5">1 = poco útil · 5 = muy útil</p>
      </div>

      <div className="border-t border-[#EFEAE0] pt-4">
        <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-2">Temas propuestos para la próxima sesión</p>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            value={nuevoTema}
            onChange={(e) => setNuevoTema(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarTema()}
            placeholder="¿Qué te gustaría conversar la próxima vez?"
            className="flex-1 min-w-0 text-sm border border-[#E4DCC9] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
          />
          <button onClick={agregarTema} className="flex items-center justify-center gap-1.5 text-sm bg-[#16232E] text-[#F1EBDD] px-3.5 py-2 rounded-lg hover:bg-[#233544] transition-colors">
            <Plus size={14} /> Agregar
          </button>
        </div>
        <div className="space-y-1.5">
          {postSesion.temasProximos.length === 0 && <p className="text-xs text-[#B0A78E] italic">Sin temas propuestos aún.</p>}
          {postSesion.temasProximos.map((t, i) => (
            <div key={i} className="text-sm border border-[#E4DCC9] rounded-lg px-3 py-2">
              <p className="text-[#3A3226]">{t.texto}</p>
              <p className="text-xs text-[#8A8270] mt-0.5">{t.fecha}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CoacheeView() {
  const { coachees, updateCoachee } = useCoaching();
  const yo = coachees[0];
  const [reflexion, setReflexion] = useState("");

  const [nuevoLogro, setNuevoLogro] = useState("");
  const agregarLogro = () => {
    if (!nuevoLogro.trim()) return;
    updateCoachee(yo.id, (c) => ({ ...c, logros: [{ texto: nuevoLogro.trim(), fecha: "hoy" }, ...(c.logros || [])] }));
    setNuevoLogro("");
  };

  const asignados = recursos.filter((r) => (yo.recursosAsignados || []).includes(r.titulo));
  const [recursoSel, setRecursoSel] = useState(asignados[0]?.titulo || "Otro");
  const [textoAprendizaje, setTextoAprendizaje] = useState("");
  const agregarAprendizaje = () => {
    if (!textoAprendizaje.trim()) return;
    updateCoachee(yo.id, (c) => ({ ...c, aprendizajes: [{ recurso: recursoSel, texto: textoAprendizaje.trim(), fecha: "hoy" }, ...(c.aprendizajes || [])] }));
    setTextoAprendizaje("");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-[#16232E] text-[#F1EBDD] rounded-2xl p-5 sm:p-6 md:p-8">
        <p className="text-xs sm:text-sm text-[#B08D57] tracking-wide uppercase mb-1">Tu proceso</p>
        <h2 className="text-xl sm:text-2xl md:text-3xl mb-4" style={{ fontFamily: "Fraunces, serif" }}>
          Hola, {yo.nombre.split(" ")[0]}
        </h2>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
          <Rings fase={yo.fase} />
          <span className="text-xs sm:text-sm text-[#C9C0AC]">Etapa: {FASES[yo.fase]}</span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm bg-white/5 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 w-fit">
          <Calendar size={16} className="text-[#B08D57]" />
          Próxima sesión: <span className="font-medium">{yo.proximaSesion}</span>
        </div>
      </div>

      <BotonUnirseSesion nombreCoachee={yo.nombre} />

      <div className="flex items-center gap-2 bg-[#EFE9DD] border border-[#E4DCC9] rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-[#5C5340]">
        <Bell size={15} className="text-[#B08D57] shrink-0" />
        Recordatorio: tu próxima sesión es el <span className="font-medium">{yo.proximaSesion}</span>.
      </div>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Target size={16} className="text-[#6B8F71]" />
            <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Tus objetivos activos</h3>
          </div>
          <div className="space-y-4">
            {yo.objetivos.map((o, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[#3A3226]">{o.titulo}</span>
                  <span className="font-mono text-[#6B8F71]">{o.avance}%</span>
                </div>
                <ProgressBar value={o.avance} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Clock size={16} className="text-[#6B8F71]" />
            <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Sesiones</h3>
          </div>
          <p className="text-3xl font-mono text-[#16232E] mb-1">
            {yo.sesiones.hechas}<span className="text-[#B0A78E] text-lg">/{yo.sesiones.total}</span>
          </p>
          <p className="text-sm text-[#8A8270] mb-3">completadas este ciclo</p>
          <ProgressBar value={(yo.sesiones.hechas / yo.sesiones.total) * 100} color="#B08D57" />
        </div>
      </div>

      <LineaProgreso datos={yo.historialSesiones} />
      <ResumenSesiones historial={yo.historialSesiones} />
      <PostSesion coacheeId={yo.id} />

      <PlanDesarrollo coacheeId={yo.id} />

      <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 size={16} className="text-[#6B8F71]" />
          <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Registro de logros</h3>
        </div>
        <p className="text-xs text-[#8A8270] mb-3">Anota cada avance concreto, por pequeño que sea — el progreso queda visible con el tiempo.</p>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            value={nuevoLogro}
            onChange={(e) => setNuevoLogro(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarLogro()}
            placeholder="¿Qué lograste esta semana?"
            className="flex-1 min-w-0 text-sm border border-[#E4DCC9] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
          />
          <button
            onClick={agregarLogro}
            className="flex items-center justify-center gap-1.5 text-sm bg-[#16232E] text-[#F1EBDD] px-3.5 py-2 rounded-lg hover:bg-[#233544] transition-colors"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
        <div className="space-y-2">
          {(yo.logros || []).length === 0 && (
            <p className="text-sm text-[#B0A78E] italic">Aún no registras logros. Anota el primero arriba.</p>
          )}
          {(yo.logros || []).map((l, i) => (
            <div key={i} className="flex items-start gap-2.5 border border-[#E4DCC9] rounded-xl px-3.5 py-2.5">
              <CheckCircle2 size={15} className="text-[#6B8F71] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-[#3A3226]">{l.texto}</p>
                <p className="text-xs text-[#8A8270]">{l.fecha}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <Autoevaluacion />
        <SolicitudReagendamiento proximaSesion={yo.proximaSesion} />
      </div>

      <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={16} className="text-[#6B8F71]" />
          <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Biblioteca de recursos</h3>
        </div>
        <p className="text-xs text-[#8A8270] mb-3">Los recursos que tu coach te asigna aparecen aquí.</p>
        {asignados.length === 0 ? (
          <p className="text-sm text-[#B0A78E] italic">Tu coach aún no te ha asignado recursos.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {asignados.map((r, i) => (
              <div key={i} className="flex items-start justify-between gap-3 border border-[#E4DCC9] rounded-xl p-3.5 hover:border-[#6B8F71] transition-colors">
                <div>
                  <p className="text-sm font-medium text-[#16232E] leading-snug">{r.titulo}</p>
                  <p className="text-xs text-[#8A8270] mt-1">{r.tipo}</p>
                  <span className="inline-block text-xs bg-[#EFE9DD] text-[#6B8F71] px-2 py-0.5 rounded-full mt-2">{r.tag}</span>
                </div>
                <Download size={16} className="text-[#B0A78E] shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <PenLine size={16} className="text-[#6B8F71]" />
          <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Aprendizajes prácticos de tus recursos</h3>
        </div>
        <p className="text-xs text-[#8A8270] mb-3">Después de leer, ver o escuchar algo de tu biblioteca, anota qué te sirvió llevar a la práctica.</p>
        <div className="flex flex-wrap gap-2 mb-2">
          <select
            value={recursoSel}
            onChange={(e) => setRecursoSel(e.target.value)}
            className="w-full sm:w-auto text-sm border border-[#E4DCC9] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
          >
            {asignados.map((r) => (
              <option key={r.titulo} value={r.titulo}>{r.titulo}</option>
            ))}
            <option value="Otro">Otro recurso</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <textarea
            value={textoAprendizaje}
            onChange={(e) => setTextoAprendizaje(e.target.value)}
            placeholder="¿Qué aprendizaje concreto aplicaste?"
            className="flex-1 min-w-0 text-sm border border-[#E4DCC9] rounded-xl p-3 h-16 resize-none focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
          />
          <button
            onClick={agregarAprendizaje}
            className="flex items-center justify-center gap-1.5 text-sm bg-[#16232E] text-[#F1EBDD] px-3.5 py-2 rounded-lg hover:bg-[#233544] transition-colors self-start"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
        <div className="space-y-2">
          {(yo.aprendizajes || []).map((a, i) => (
            <div key={i} className="border border-[#E4DCC9] rounded-xl px-3.5 py-2.5">
              <span className="inline-block text-xs bg-[#EFE9DD] text-[#6B8F71] px-2 py-0.5 rounded-full mb-1.5">{a.recurso}</span>
              <p className="text-sm text-[#3A3226]">{a.texto}</p>
              <p className="text-xs text-[#8A8270] mt-1">{a.fecha}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <PenLine size={16} className="text-[#6B8F71]" />
          <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Diario de reflexión</h3>
        </div>
        <p className="text-xs text-[#8A8270] mb-3">Solo tú y tu coach ven esto. Úsalo antes de tu próxima sesión.</p>
        <textarea
          value={reflexion}
          onChange={(e) => setReflexion(e.target.value)}
          placeholder="¿Qué situación quieres traer a la próxima sesión?"
          className="w-full text-sm border border-[#E4DCC9] rounded-xl p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
        />
      </div>

      <CertificadoFinal finalizado={yo.sesiones.hechas === yo.sesiones.total} />
    </div>
  );
}

function AlertaCicloPorVencer({ equipo }) {
  const porVencer = equipo.filter((c) => c.sesiones.total - c.sesiones.hechas <= 2 && c.sesiones.hechas < c.sesiones.total);
  if (porVencer.length === 0) return null;
  return (
    <div className="flex items-start gap-2 bg-[#F5EAE0] border border-[#E4C9A8] rounded-xl p-3.5 text-sm text-[#5C5340]">
      <AlertTriangle size={15} className="mt-0.5 text-[#B08D57] shrink-0" />
      <div>
        {porVencer.map((c) => (
          <p key={c.id}>
            Quedan <span className="font-medium">{c.sesiones.total - c.sesiones.hechas}</span> sesión(es) de{" "}
            <span className="font-medium">{c.nombre}</span> — ¿renuevan el ciclo o lo cierran?
          </p>
        ))}
      </div>
    </div>
  );
}

function ExportarReporte() {
  return (
    <div className="flex flex-wrap gap-2">
      <button className="flex items-center gap-1.5 text-xs border border-[#E4DCC9] rounded-lg px-3 py-2 hover:border-[#6B8F71] transition-colors text-[#3A3226]">
        <FileText size={13} /> Exportar PDF
      </button>
      <button className="flex items-center gap-1.5 text-xs border border-[#E4DCC9] rounded-lg px-3 py-2 hover:border-[#6B8F71] transition-colors text-[#3A3226]">
        <FileSpreadsheet size={13} /> Exportar Excel
      </button>
    </div>
  );
}

function HistorialCiclos({ historial }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="mt-1.5">
      <button onClick={() => setAbierto((a) => !a)} className="text-xs text-[#8A8270] hover:text-[#16232E] underline underline-offset-2">
        {abierto ? "Ocultar historial de procesos" : `Ver historial de procesos (${historial.length})`}
      </button>
      {abierto && (
        <div className="mt-2 space-y-1.5">
          {historial.length === 0 && <p className="text-xs text-[#B0A78E] italic">Este es su primer ciclo de coaching.</p>}
          {historial.map((h, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-1 text-xs border border-[#E4DCC9] rounded-lg px-3 py-1.5">
              <span className="text-[#3A3226]">{h.periodo} — {h.competencia}</span>
              <span className="font-medium" style={{ color: h.resultado === "Logrado" ? "#6B8F71" : "#B08D57" }}>{h.resultado}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EncuestaSatisfaccionEmpresa() {
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <Star size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Satisfacción con el servicio de coaching</h3>
      </div>
      <p className="text-xs text-[#8A8270] mb-3">Tu evaluación del servicio en general — distinta de la que das por proceso.</p>
      {enviado ? (
        <p className="text-sm text-[#6B8F71] flex items-center gap-1.5"><CheckCircle2 size={15} /> Gracias por tu evaluación.</p>
      ) : (
        <>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setPuntaje(n)}>
                <Star size={22} className={n <= puntaje ? "fill-[#B08D57] text-[#B08D57]" : "text-[#D8D0BC]"} />
              </button>
            ))}
          </div>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="¿Algo que quieras comentar sobre el servicio?"
            className="w-full text-sm border border-[#E4DCC9] rounded-xl p-3 h-20 resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
          />
          <button
            disabled={!puntaje}
            onClick={() => setEnviado(true)}
            className={`w-full sm:w-auto text-sm px-4 py-2 rounded-lg transition-colors ${
              puntaje ? "bg-[#16232E] text-[#F1EBDD] hover:bg-[#233544]" : "bg-[#E4DCC9] text-[#B0A78E] cursor-not-allowed"
            }`}
          >
            Enviar evaluación
          </button>
        </>
      )}
    </div>
  );
}

function SolicitudNuevoProceso() {
  const [abierto, setAbierto] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [candidato, setCandidato] = useState("");
  const [cargo, setCargo] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const enviar = () => {
    if (!candidato.trim()) return;
    setEnviado(true);
  };
  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Plus size={16} className="text-[#6B8F71]" />
          <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Solicitar nuevo proceso</h3>
        </div>
        <button onClick={() => setAbierto((a) => !a)} className="text-xs text-[#6B8F71] hover:text-[#16232E]">
          {abierto ? "Cerrar" : "Nueva solicitud"}
        </button>
      </div>
      {abierto && (
        enviado ? (
          <p className="text-sm text-[#6B8F71] flex items-center gap-1.5 mt-3"><CheckCircle2 size={15} /> Solicitud enviada — tu coach se pondrá en contacto para coordinar.</p>
        ) : (
          <div className="mt-3 space-y-2.5">
            <input value={candidato} onChange={(e) => setCandidato(e.target.value)} placeholder="Nombre del candidato/a" className="w-full text-sm border border-[#E4DCC9] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40" />
            <input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Cargo" className="w-full text-sm border border-[#E4DCC9] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40" />
            <textarea value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="¿Qué objetivo tienen en mente para este proceso?" className="w-full text-sm border border-[#E4DCC9] rounded-xl p-3 h-16 resize-none focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40" />
            <button onClick={enviar} className="w-full sm:w-auto text-sm bg-[#16232E] text-[#F1EBDD] px-4 py-2 rounded-lg hover:bg-[#233544] transition-colors">Enviar solicitud</button>
          </div>
        )
      )}
    </div>
  );
}

function ComparativaAreas({ equipo }) {
  const datos = equipo.map((c) => ({ nombre: c.nombre.split(" ")[0], area: c.area, avance: c.avanceGeneral }));
  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Users size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Comparativa de avance por área</h3>
      </div>
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer>
          <BarChart data={datos} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E4DCC9" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="area" tick={{ fontSize: 10, fill: "#8A8270" }} axisLine={{ stroke: "#E4DCC9" }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#8A8270" }} axisLine={false} tickLine={false} width={26} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4DCC9" }} formatter={(v) => `${v}%`} />
            <Bar dataKey="avance" fill="#6B8F71" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-[#8A8270] mt-2">Avance general por área/gerencia representada en tu equipo en coaching.</p>
    </div>
  );
}

function TarjetaCoacheeEmpresa({ c, resultado, onResultado }) {
  const [expandido, setExpandido] = useState(false);
  const finalizado = c.sesiones.hechas === c.sesiones.total;
  const colorResultado = (r) =>
    r === "Logrado" ? "#6B8F71" : r === "Medianamente logrado" ? "#B08D57" : r === "No logrado" ? "#B0665B" : "#B0A78E";

  return (
    <div className="border border-[#E4DCC9] rounded-xl p-3.5 sm:p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#16232E]">{c.nombre}</p>
          <p className="text-xs text-[#8A8270]">{c.cargo}</p>
          <p className="text-xs text-[#8A8270] mt-0.5">Jefe directo: {c.jefeDirecto}</p>
        </div>
        <Rings fase={c.fase} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2 text-xs">
        <span className="font-mono text-[#3A3226]">{c.sesiones.hechas}/{c.sesiones.total} sesiones</span>
        <div className="flex items-center gap-1.5">
          <div className="w-12"><ProgressBar value={c.avanceGeneral} /></div>
          <span className="font-mono text-[#6B8F71]">{c.avanceGeneral}%</span>
        </div>
        <Stars n={c.satisfaccion} />
      </div>

      <div className="flex items-start gap-1.5">
        <Target size={12} className="text-[#B08D57] mt-0.5 shrink-0" />
        <p className="text-xs text-[#5C5340]"><span className="text-[#8A8270]">Objetivo:</span> {c.objetivoProceso}</p>
      </div>

      <HistorialCiclos historial={c.historialCiclos || []} />

      <div className="border-t border-[#EFEAE0] pt-3">
        <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-1.5">Resumen de reunión inicial (RRHH + Jefe)</p>
        {c.resumenReunionInicial ? (
          <div className="bg-[#FBF9F4] border border-[#E4DCC9] rounded-lg p-3">
            <p className="text-sm text-[#3A3226] leading-relaxed">{c.resumenReunionInicial.texto}</p>
            <p className="text-xs text-[#8A8270] mt-1.5">{c.resumenReunionInicial.autor} · {c.resumenReunionInicial.fecha}</p>
          </div>
        ) : (
          <p className="text-xs text-[#B0A78E] italic">Tu coach aún no ha cargado el resumen de la reunión inicial.</p>
        )}
      </div>

      {finalizado && (
        <div className="border-t border-[#EFEAE0] pt-3">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="flex items-center gap-1 text-xs bg-[#EFE9DD] text-[#6B8F71] px-2.5 py-1 rounded-full font-medium">
              <CheckCircle2 size={12} /> Proceso finalizado
            </span>
            {c.reporteFinal && (
              <button
                onClick={() => setExpandido((e) => !e)}
                className="flex items-center gap-1.5 text-xs text-[#16232E] border border-[#E4DCC9] rounded-full px-3 py-1 hover:border-[#6B8F71] transition-colors"
              >
                <FileText size={12} />
                {expandido ? "Ocultar informe final" : "Ver informe final"}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs text-[#8A8270]">Resultado del proceso:</span>
            {["Logrado", "Medianamente logrado", "No logrado"].map((opcion) => {
              const activo = resultado === opcion;
              return (
                <button
                  key={opcion}
                  onClick={() => onResultado(opcion)}
                  className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                  style={
                    activo
                      ? { backgroundColor: colorResultado(opcion), borderColor: colorResultado(opcion), color: "white" }
                      : { borderColor: "#E4DCC9", color: "#3A3226", backgroundColor: "white" }
                  }
                >
                  {opcion}
                </button>
              );
            })}
          </div>
          {!resultado && <p className="text-xs text-[#B0A78E] italic mb-2">Aún sin calificar por la empresa.</p>}

          {expandido && c.reporteFinal && (
            <div className="mt-3 bg-[#FBF9F4] border border-[#E4DCC9] rounded-xl p-3.5 sm:p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8A8270]">
                <span>Subido por {c.reporteFinal.subidoPor}</span>
                <span className="font-mono">{c.reporteFinal.fecha}</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-1">Resumen del proceso</p>
                <p className="text-sm text-[#3A3226] leading-relaxed">{c.reporteFinal.resumen}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-1.5">Logros clave</p>
                <ul className="space-y-1">
                  {c.reporteFinal.logros.map((l, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#3A3226]">
                      <CheckCircle2 size={14} className="text-[#6B8F71] mt-0.5 shrink-0" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-1">Recomendación de sostenimiento</p>
                <p className="text-sm text-[#3A3226] leading-relaxed">{c.reporteFinal.recomendacion}</p>
              </div>
              <button className="flex items-center gap-1.5 text-xs text-[#6B8F71] hover:text-[#16232E]">
                <Download size={12} /> Descargar como PDF
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmpresaView() {
  const { coachees, updateCoachee } = useCoaching();
  const empresa = "Andes Minerals";
  const equipo = coachees.filter((c) => c.empresa === empresa);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-[#16232E] text-[#F1EBDD] rounded-2xl p-5 sm:p-6 md:p-8">
        <p className="text-xs sm:text-sm text-[#B08D57] tracking-wide uppercase mb-1">Panel de empresa</p>
        <h2 className="text-xl sm:text-2xl md:text-3xl mb-2" style={{ fontFamily: "Fraunces, serif" }}>{empresa}</h2>
        <p className="text-sm text-[#C9C0AC] max-w-xl">
          Seguimiento del proceso de coaching de tu equipo. Las notas de sesión son
          estrictamente confidenciales entre coach y coachee — aquí ves avance, no contenido.
        </p>
      </div>

      <div className="flex items-start gap-2 bg-[#EFE9DD] border border-[#E4DCC9] rounded-xl p-3.5 text-sm text-[#5C5340]">
        <Lock size={15} className="mt-0.5 text-[#B08D57] shrink-0" />
        Por acuerdo de confidencialidad, el contenido de las sesiones no es visible para la empresa.
      </div>

      <AlertaCicloPorVencer equipo={equipo} />

      <div className="flex justify-end">
        <ExportarReporte />
      </div>

      <div className="space-y-3">
        {equipo.map((c) => (
          <TarjetaCoacheeEmpresa
            key={c.id}
            c={c}
            resultado={c.resultadoProceso}
            onResultado={(valor) => updateCoachee(c.id, { resultadoProceso: valor })}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
          <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-2">Avance promedio</p>
          <p className="text-2xl sm:text-3xl font-mono text-[#16232E]">
            {Math.round(equipo.reduce((a, c) => a + c.avanceGeneral, 0) / equipo.length)}%
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
          <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-2">Sesiones este mes</p>
          <p className="text-2xl sm:text-3xl font-mono text-[#16232E]">6</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5 col-span-2 sm:col-span-1">
          <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-2">Satisfacción prom.</p>
          <p className="text-2xl sm:text-3xl font-mono text-[#16232E]">4.7</p>
        </div>
      </div>

      <ComparativaAreas equipo={equipo} />

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <EncuestaSatisfaccionEmpresa />
        <SolicitudNuevoProceso />
      </div>
    </div>
  );
}

function CalendarioSesiones() {
  const { sesionesAgenda, setSesionesAgenda, coachees } = useCoaching();
  const nombresMes = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const nombresMesCorto = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const diasSemana = ["D", "L", "M", "M", "J", "V", "S"];
  const clave = (s) => s.anio * 10000 + s.mes * 100 + s.dia;

  const [mesActual, setMesActual] = useState(new Date(2026, 6, 1));
  const [diaSel, setDiaSel] = useState(14);
  const [nuevaHora, setNuevaHora] = useState("");
  const [nuevoCoachee, setNuevoCoachee] = useState(coachees[0].nombre);

  const anio = mesActual.getFullYear();
  const mes = mesActual.getMonth();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const primerDia = new Date(anio, mes, 1).getDay();

  const cambiarMes = (delta) => {
    setMesActual(new Date(anio, mes + delta, 1));
    setDiaSel(null);
  };

  const sesionesDia = (dia) => sesionesAgenda.filter((s) => s.dia === dia && s.mes === mes && s.anio === anio);

  const agregarSesion = () => {
    if (!diaSel || !nuevaHora.trim()) return;
    setSesionesAgenda((s) => [...s, { id: Date.now(), dia: diaSel, mes, anio, hora: nuevaHora.trim(), coachee: nuevoCoachee }]);
    setNuevaHora("");
  };
  const eliminarSesion = (id) => setSesionesAgenda((s) => s.filter((x) => x.id !== id));
  const actualizarHora = (id, hora) => setSesionesAgenda((s) => s.map((x) => (x.id === id ? { ...x, hora } : x)));
  const irASesion = (s) => {
    setMesActual(new Date(s.anio, s.mes, 1));
    setDiaSel(s.dia);
  };

  const proximas = [...sesionesAgenda]
    .filter((s) => clave(s) >= clave(HOY))
    .sort((a, b) => clave(a) - clave(b) || a.hora.localeCompare(b.hora));

  const celdas = [];
  for (let i = 0; i < primerDia; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Calendar size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Calendario resumen — próximas sesiones</h3>
      </div>

      <div className="grid md:grid-cols-[1.3fr_1fr] gap-4 sm:gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => cambiarMes(-1)} className="text-[#8A8270] hover:text-[#16232E] px-1 text-lg leading-none">‹</button>
            <span className="text-sm font-medium text-[#16232E]">{nombresMes[mes]} {anio}</span>
            <button onClick={() => cambiarMes(1)} className="text-[#8A8270] hover:text-[#16232E] px-1 text-lg leading-none">›</button>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1">
            {diasSemana.map((d, i) => (
              <div key={i} className="text-center text-xs text-[#8A8270] font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {celdas.map((dia, i) => {
              if (dia === null) return <div key={i} />;
              const del = sesionesDia(dia);
              const seleccionado = diaSel === dia;
              const esHoy = dia === HOY.dia && mes === HOY.mes && anio === HOY.anio;
              return (
                <button
                  key={i}
                  onClick={() => setDiaSel(dia)}
                  className={`aspect-square rounded-lg border text-left p-1 sm:p-1.5 flex flex-col transition-colors ${
                    seleccionado ? "border-[#6B8F71] bg-[#EFE9DD]" : esHoy ? "border-[#B08D57] bg-white" : "border-[#E4DCC9] bg-white hover:border-[#B0A78E]"
                  }`}
                >
                  <span className={`text-[10px] sm:text-xs font-mono ${esHoy ? "text-[#B08D57] font-semibold" : "text-[#3A3226]"}`}>{dia}</span>
                  <div className="flex gap-0.5 mt-auto flex-wrap">
                    {del.slice(0, 3).map((s) => (
                      <span key={s.id} className="w-1.5 h-1.5 rounded-full bg-[#6B8F71]" />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {diaSel && (
            <div className="mt-4 sm:mt-5 border-t border-[#EFEAE0] pt-4">
              <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-3">
                {diaSel} de {nombresMes[mes]} · {sesionesDia(diaSel).length} sesión(es)
              </p>
              <div className="space-y-2 mb-4">
                {sesionesDia(diaSel).length === 0 && (
                  <p className="text-sm text-[#B0A78E] italic">Sin sesiones este día.</p>
                )}
                {sesionesDia(diaSel).map((s) => (
                  <div key={s.id} className="flex items-center gap-2 border border-[#E4DCC9] rounded-xl px-3 py-2">
                    <input
                      value={s.hora}
                      onChange={(e) => actualizarHora(s.id, e.target.value)}
                      className="w-14 sm:w-16 text-sm font-mono border-none focus:outline-none bg-transparent text-[#6B8F71]"
                    />
                    <span className="text-sm text-[#3A3226] flex-1 min-w-0 truncate">{s.coachee}</span>
                    <button onClick={() => eliminarSesion(s.id)} className="text-xs text-[#B0A78E] hover:text-[#16232E]">
                      Quitar
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <select
                  value={nuevoCoachee}
                  onChange={(e) => setNuevoCoachee(e.target.value)}
                  className="text-sm border border-[#E4DCC9] rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
                >
                  {coachees.map((c) => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    value={nuevaHora}
                    onChange={(e) => setNuevaHora(e.target.value)}
                    placeholder="Hora (ej. 10:00)"
                    className="flex-1 sm:w-28 text-sm border border-[#E4DCC9] rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
                  />
                  <button
                    onClick={agregarSesion}
                    className="flex items-center gap-1.5 text-sm bg-[#16232E] text-[#F1EBDD] px-3.5 py-2 rounded-lg hover:bg-[#233544] transition-colors"
                  >
                    <Plus size={14} /> Agendar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t md:border-t-0 md:border-l border-[#EFEAE0] pt-4 md:pt-0 md:pl-6">
          <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-3">
            Agenda completa · {proximas.length} sesión(es) programadas
          </p>
          <div className="space-y-1.5 max-h-[360px] sm:max-h-[420px] overflow-y-auto pr-1">
            {proximas.length === 0 && (
              <p className="text-sm text-[#B0A78E] italic">Sin sesiones próximas — agenda abierta.</p>
            )}
            {proximas.map((s) => (
              <button
                key={s.id}
                onClick={() => irASesion(s)}
                className="w-full flex items-center gap-3 text-left border border-[#E4DCC9] rounded-xl px-3 py-2 hover:border-[#6B8F71] transition-colors"
              >
                <div className="flex flex-col items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#FBF9F4] shrink-0">
                  <span className="text-sm font-mono font-semibold text-[#16232E] leading-none">{s.dia}</span>
                  <span className="text-[10px] text-[#8A8270] uppercase leading-none mt-0.5">{nombresMesCorto[s.mes]}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#3A3226] truncate">{s.coachee}</p>
                  <p className="text-xs font-mono text-[#6B8F71]">{s.hora}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-[#8A8270] mt-3">
            Los huecos entre sesiones son tus espacios disponibles para agendar.
          </p>
        </div>
      </div>
    </div>
  );
}

function PanelAlertas() {
  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Alertas de seguimiento</h3>
      </div>
      <div className="space-y-2">
        {alertasSeguimiento.map((a, i) => (
          <div key={i} className="flex items-start gap-2 text-sm border border-[#E4DCC9] rounded-xl px-3.5 py-2.5">
            <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${a.tipo === "warning" ? "text-[#B08D57]" : "text-[#6B8F71]"}`} />
            <span className="text-[#3A3226]">{a.texto}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelNegocio() {
  const { coachees, sesionesAgenda } = useCoaching();
  const clave = (s) => s.anio * 10000 + s.mes * 100 + s.dia;
  const empresaPorNombre = {};
  coachees.forEach((c) => { empresaPorNombre[c.nombre] = c.empresa; });

  const realizadasEsteMes = sesionesAgenda.filter(
    (s) => s.mes === HOY.mes && s.anio === HOY.anio && clave(s) <= clave(HOY)
  );
  const horasRealizadasMes = realizadasEsteMes.length;
  const ingresosMes = realizadasEsteMes.reduce((acc, s) => acc + (TARIFA_HORA[empresaPorNombre[s.coachee]] || 0), 0);

  const proximasSesiones = sesionesAgenda.filter((s) => clave(s) > clave(HOY)).length;
  const ingresoProyectado = sesionesAgenda
    .filter((s) => clave(s) > clave(HOY))
    .reduce((acc, s) => acc + (TARIFA_HORA[empresaPorNombre[s.coachee]] || 0), 0);

  const coacheesActivos = coachees.filter((c) => c.sesiones.hechas < c.sesiones.total).length;
  const satisfaccionProm = (coachees.reduce((a, c) => a + c.satisfaccion, 0) / coachees.length).toFixed(1);
  const fmt = (n) => `$${n.toLocaleString("es-CL")}`;

  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Panel de negocio</h3>
      </div>
      <p className="text-xs text-[#8A8270] mb-4">Julio 2026 — datos calculados desde tu calendario de sesiones.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
        <div className="bg-[#FBF9F4] rounded-xl p-3">
          <p className="text-xs text-[#8A8270] flex items-center gap-1"><Clock size={11} /> Horas realizadas</p>
          <p className="font-mono text-lg sm:text-xl text-[#16232E] mt-1">{horasRealizadasMes}</p>
        </div>
        <div className="bg-[#FBF9F4] rounded-xl p-3">
          <p className="text-xs text-[#8A8270] flex items-center gap-1"><DollarSign size={11} /> Ingresos del mes</p>
          <p className="font-mono text-lg sm:text-xl text-[#6B8F71] mt-1">{fmt(ingresosMes)}</p>
        </div>
        <div className="bg-[#FBF9F4] rounded-xl p-3">
          <p className="text-xs text-[#8A8270]">Coachees activos</p>
          <p className="font-mono text-lg sm:text-xl text-[#16232E] mt-1">{coacheesActivos}</p>
        </div>
        <div className="bg-[#FBF9F4] rounded-xl p-3">
          <p className="text-xs text-[#8A8270]">Satisfacción prom.</p>
          <p className="font-mono text-lg sm:text-xl text-[#16232E] mt-1">{satisfaccionProm}</p>
        </div>
      </div>

      <div className="border-t border-[#EFEAE0] pt-3.5 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-[#8A8270]">Ingreso proyectado — {proximasSesiones} sesiones agendadas</span>
        <span className="font-mono text-[#B08D57] font-medium">{fmt(ingresoProyectado)}</span>
      </div>
    </div>
  );
}

function GestionHoras() {
  const { coachees } = useCoaching();
  const porEmpresa = [
    { empresa: "Andes Minerals", contratadas: 40, consumidas: coachees.filter((c) => c.empresa === "Andes Minerals").reduce((a, c) => a + c.sesiones.hechas, 0) },
    { empresa: "Viña del Sur", contratadas: 16, consumidas: coachees.filter((c) => c.empresa === "Viña del Sur").reduce((a, c) => a + c.sesiones.hechas, 0) },
  ];
  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Clock size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Horas contratadas vs. consumidas</h3>
      </div>
      <div className="space-y-4">
        {porEmpresa.map((e) => (
          <div key={e.empresa}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-[#3A3226]">{e.empresa}</span>
              <span className="font-mono text-[#6B8F71]">{e.consumidas}/{e.contratadas} hrs</span>
            </div>
            <ProgressBar value={(e.consumidas / e.contratadas) * 100} color="#B08D57" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlantillasPlanDesarrollo() {
  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Plantillas de plan de desarrollo</h3>
      </div>
      <p className="text-xs text-[#8A8270] mb-3">Competencias frecuentes — úsalas como punto de partida al crear un nuevo plan.</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {plantillasPlan.map((p, i) => (
          <div key={i} className="flex items-center justify-between border border-[#E4DCC9] rounded-xl px-3.5 py-2.5">
            <span className="text-sm text-[#3A3226]">{p}</span>
            <button className="text-xs text-[#6B8F71] hover:text-[#16232E] shrink-0">Usar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeneradorInformeFinal({ coachee }) {
  const [borrador, setBorrador] = useState("");
  const generar = () => {
    const texto = `Resumen del proceso de ${coachee.nombre}\n\nObjetivo del proceso: ${coachee.objetivoProceso}\n\nSesiones realizadas: ${coachee.sesiones.hechas}/${coachee.sesiones.total}\nAvance general: ${coachee.avanceGeneral}%\n\nObjetivos trabajados:\n${coachee.objetivos.map((o) => `- ${o.titulo} (${o.avance}% de avance)`).join("\n")}\n\n[Edita este borrador antes de subirlo como informe final]`;
    setBorrador(texto);
  };
  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[#6B8F71]" />
          <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Generador de borrador de informe final</h3>
        </div>
        <button onClick={generar} className="flex items-center gap-1.5 text-xs bg-[#16232E] text-[#F1EBDD] px-3 py-1.5 rounded-lg hover:bg-[#233544] transition-colors">
          <Sparkles size={12} /> Generar borrador
        </button>
      </div>
      <p className="text-xs text-[#8A8270] mb-3">Toma los datos ya cargados de {coachee.nombre} y arma un primer borrador — tú lo editas y subes.</p>
      <textarea
        value={borrador}
        onChange={(e) => setBorrador(e.target.value)}
        placeholder="Haz clic en 'Generar borrador' para empezar..."
        rows={7}
        className="w-full text-xs sm:text-sm border border-[#E4DCC9] rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40 font-mono"
      />
    </div>
  );
}

function BibliotecaConBuscador() {
  const [busqueda, setBusqueda] = useState("");
  const [tagActivo, setTagActivo] = useState("Todos");
  const tags = ["Todos", ...new Set(recursos.map((r) => r.tag))];
  const filtrados = recursos.filter(
    (r) => (tagActivo === "Todos" || r.tag === tagActivo) && r.titulo.toLowerCase().includes(busqueda.toLowerCase())
  );
  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base flex items-center gap-2"><BookOpen size={16} className="text-[#6B8F71]"/>Biblioteca de recursos</h3>
        <button className="flex items-center gap-1.5 text-sm bg-[#16232E] text-[#F1EBDD] px-3.5 py-2 rounded-lg hover:bg-[#233544] transition-colors">
          <Plus size={14} /> Nuevo recurso
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-1.5 border border-[#E4DCC9] rounded-lg px-2.5 py-1.5 flex-1 min-w-[160px]">
          <Search size={13} className="text-[#8A8270]" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar recurso..."
            className="text-sm border-none focus:outline-none bg-transparent w-full"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTagActivo(t)}
              className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                tagActivo === t ? "bg-[#16232E] text-[#F1EBDD] border-[#16232E]" : "border-[#E4DCC9] text-[#5C5340] hover:border-[#6B8F71]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {filtrados.map((r, i) => (
          <div key={i} className="flex items-center justify-between border border-[#E4DCC9] rounded-xl p-3.5">
            <div>
              <p className="text-sm font-medium text-[#16232E]">{r.titulo}</p>
              <p className="text-xs text-[#8A8270] mt-0.5">{r.tipo}</p>
            </div>
            <FileText size={16} className="text-[#B0A78E]" />
          </div>
        ))}
        {filtrados.length === 0 && <p className="text-sm text-[#B0A78E] italic">Sin resultados para tu búsqueda.</p>}
      </div>
    </div>
  );
}

function AprobacionPlanes() {
  const { coachees, updateCoachee } = useCoaching();
  const [comentarios, setComentarios] = useState({});
  const pendientes = coachees.filter((c) => c.planDesarrollo.estadoAprobacion === "Pendiente de aprobación");

  const aprobar = (id) =>
    updateCoachee(id, (c) => ({ ...c, planDesarrollo: { ...c.planDesarrollo, estadoAprobacion: "Aprobado", comentarioCoach: "" } }));
  const solicitarCambios = (id) => {
    const comentario = comentarios[id] || "Revisemos algunos puntos antes de aprobar.";
    updateCoachee(id, (c) => ({ ...c, planDesarrollo: { ...c.planDesarrollo, estadoAprobacion: "Cambios solicitados", comentarioCoach: comentario } }));
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Planes pendientes de aprobación</h3>
      </div>
      <p className="text-xs text-[#8A8270] mb-3">Confirma la competencia, el nivel objetivo, el objetivo general y los objetivos específicos antes de que queden activos.</p>
      {pendientes.length === 0 && <p className="text-sm text-[#B0A78E] italic">No hay planes esperando tu aprobación.</p>}
      <div className="space-y-3">
        {pendientes.map((c) => (
          <div key={c.id} className="border border-[#E4DCC9] rounded-xl p-3.5">
            <p className="text-sm font-medium text-[#16232E]">{c.nombre}</p>
            <p className="text-xs text-[#8A8270] mb-2">{c.planDesarrollo.competencia || "Sin competencia definida"} · Nivel objetivo: {c.planDesarrollo.nivelObjetivo}</p>
            <p className="text-sm text-[#3A3226] mb-2">{c.planDesarrollo.objetivoGeneral}</p>
            <ul className="mb-2 space-y-1">
              {c.planDesarrollo.objetivosEspecificos.map((o, i) => (
                <li key={i} className="text-xs text-[#5C5340] flex gap-1.5"><span className="font-mono text-[#6B8F71]">{i + 1}.</span>{o}</li>
              ))}
            </ul>
            <textarea
              placeholder="Comentario si solicitas cambios (opcional)"
              value={comentarios[c.id] || ""}
              onChange={(e) => setComentarios((x) => ({ ...x, [c.id]: e.target.value }))}
              className="w-full text-xs border border-[#E4DCC9] rounded-lg p-2 h-14 resize-none mb-2 focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
            />
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => aprobar(c.id)} className="text-xs bg-[#6B8F71] text-white px-3 py-1.5 rounded-lg hover:bg-[#52735A]">Aprobar</button>
              <button onClick={() => solicitarCambios(c.id)} className="text-xs border border-[#E4DCC9] text-[#3A3226] px-3 py-1.5 rounded-lg hover:border-[#B08D57]">Solicitar cambios</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AsignarRecursos({ coacheeId }) {
  const { coachees, updateCoachee } = useCoaching();
  const coachee = coachees.find((c) => c.id === coacheeId);
  const asignados = coachee.recursosAsignados || [];

  const toggle = (titulo) => {
    updateCoachee(coacheeId, (c) => {
      const actuales = c.recursosAsignados || [];
      const yaAsignado = actuales.includes(titulo);
      return { ...c, recursosAsignados: yaAsignado ? actuales.filter((t) => t !== titulo) : [...actuales, titulo] };
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Asignar recursos a {coachee.nombre.split(" ")[0]}</h3>
      </div>
      <p className="text-xs text-[#8A8270] mb-3">Lo que actives aquí aparece directo en la biblioteca de este coachee.</p>
      <div className="space-y-2">
        {recursos.map((r) => {
          const activo = asignados.includes(r.titulo);
          return (
            <button
              key={r.titulo}
              onClick={() => toggle(r.titulo)}
              className={`w-full flex items-center justify-between gap-3 text-left border rounded-xl px-3.5 py-2.5 transition-colors ${activo ? "border-[#6B8F71] bg-[#EFE9DD]" : "border-[#E4DCC9] hover:border-[#B0A78E]"}`}
            >
              <div className="min-w-0">
                <p className="text-sm text-[#3A3226] truncate">{r.titulo}</p>
                <p className="text-xs text-[#8A8270]">{r.tipo} · {r.tag}</p>
              </div>
              {activo ? <CheckCircle2 size={16} className="text-[#6B8F71] shrink-0" /> : <Plus size={16} className="text-[#B0A78E] shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GestionContacto({ coacheeId }) {
  const { coachees, updateCoachee } = useCoaching();
  const coachee = coachees.find((c) => c.id === coacheeId);
  const [telefono, setTelefono] = useState(coachee.telefono || "");
  const [email, setEmail] = useState(coachee.email || "");

  const guardar = () => updateCoachee(coacheeId, { telefono, email });

  const faltaTelefono = !telefono.trim();
  const faltaEmail = !email.trim();

  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <Phone size={16} className="text-[#6B8F71]" />
        <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Gestión de coachee — Contacto</h3>
      </div>
      <p className="text-xs text-[#8A8270] mb-3">Requeridos para alertas de compromisos y agenda de {coachee.nombre.split(" ")[0]}.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-1.5 flex items-center gap-1">
            Teléfono celular <span className="text-[#B0665B]">*</span>
          </p>
          <div className="flex items-center gap-1.5 border border-[#E4DCC9] rounded-lg px-2.5">
            <Phone size={13} className="text-[#8A8270] shrink-0" />
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              onBlur={guardar}
              placeholder="+56 9 0000 0000"
              className="w-full text-sm py-2 border-none focus:outline-none bg-transparent"
            />
          </div>
          {faltaTelefono && <p className="text-xs text-[#B0665B] mt-1">Campo requerido — sin esto no llegan alertas por SMS/WhatsApp.</p>}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8A8270] mb-1.5 flex items-center gap-1">
            Email <span className="text-[#B0665B]">*</span>
          </p>
          <div className="flex items-center gap-1.5 border border-[#E4DCC9] rounded-lg px-2.5">
            <Mail size={13} className="text-[#8A8270] shrink-0" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={guardar}
              placeholder="nombre@empresa.cl"
              className="w-full text-sm py-2 border-none focus:outline-none bg-transparent"
            />
          </div>
          {faltaEmail && <p className="text-xs text-[#B0665B] mt-1">Campo requerido — sin esto no llegan alertas de agenda.</p>}
        </div>
      </div>
    </div>
  );
}

function ResumenReunionInicial({ coacheeId }) {
  const { coachees, updateCoachee } = useCoaching();
  const coachee = coachees.find((c) => c.id === coacheeId);
  const existente = coachee.resumenReunionInicial;
  const [editando, setEditando] = useState(!existente);
  const [texto, setTexto] = useState(existente?.texto || "");

  const guardar = () => {
    if (!texto.trim()) return;
    updateCoachee(coacheeId, {
      resumenReunionInicial: { texto: texto.trim(), fecha: existente?.fecha || "hoy", autor: "Coach Fernando Ramos" },
    });
    setEditando(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[#6B8F71]" />
          <h3 className="font-medium text-[#16232E] text-sm sm:text-base">Resumen de reunión inicial (RRHH + Jefe)</h3>
        </div>
        {existente && !editando && (
          <button onClick={() => setEditando(true)} className="flex items-center gap-1 text-xs text-[#6B8F71] hover:text-[#16232E]">
            <PencilLine size={12} /> Editar
          </button>
        )}
      </div>
      <p className="text-xs text-[#8A8270] mb-3">Solo tú puedes cargar este resumen — la empresa lo ve, pero no lo edita.</p>
      {editando ? (
        <div className="space-y-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`¿Qué se acordó con RRHH y la jefatura de ${coachee.nombre.split(" ")[0]} en la reunión inicial?`}
            rows={4}
            className="w-full text-sm border border-[#E4DCC9] rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
          />
          <button onClick={guardar} className="text-sm bg-[#16232E] text-[#F1EBDD] px-4 py-2 rounded-lg hover:bg-[#233544] transition-colors">
            Guardar resumen
          </button>
        </div>
      ) : (
        <div className="bg-[#FBF9F4] border border-[#E4DCC9] rounded-xl p-3.5">
          <p className="text-sm text-[#3A3226] leading-relaxed">{existente.texto}</p>
          <p className="text-xs text-[#8A8270] mt-1.5">{existente.autor} · {existente.fecha}</p>
        </div>
      )}
    </div>
  );
}

function CoachView() {
  const { coachees } = useCoaching();
  const [seleccionado, setSeleccionado] = useState(coachees[0].id);
  const [filtroEmpresa, setFiltroEmpresa] = useState("Todas");
  const activo = coachees.find((c) => c.id === seleccionado);
  const empresasUnicas = ["Todas", ...new Set(coachees.map((c) => c.empresa))];
  const coacheesFiltrados = filtroEmpresa === "Todas" ? coachees : coachees.filter((c) => c.empresa === filtroEmpresa);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-[#16232E] text-[#F1EBDD] rounded-2xl p-5 sm:p-6 md:p-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <p className="text-xs sm:text-sm text-[#B08D57] tracking-wide uppercase mb-1">Tu práctica</p>
          <h2 className="text-xl sm:text-2xl md:text-3xl" style={{ fontFamily: "Fraunces, serif" }}>Panel del coach</h2>
        </div>
        <div className="flex gap-4 sm:gap-6 text-sm">
          <div><p className="font-mono text-lg sm:text-xl">{coachees.length}</p><p className="text-[#C9C0AC] text-xs">coachees</p></div>
          <div><p className="font-mono text-lg sm:text-xl">2</p><p className="text-[#C9C0AC] text-xs">empresas</p></div>
          <div><p className="font-mono text-lg sm:text-xl">14</p><p className="text-[#C9C0AC] text-xs">sesiones · jul</p></div>
        </div>
      </div>

      <BotonUnirseSesion />

      <PanelNegocio />
      <PanelAlertas />
      <AprobacionPlanes />

      <div className="grid md:grid-cols-[1fr_1.4fr] gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-[#E4DCC9] p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-medium text-[#16232E] text-sm sm:text-base flex items-center gap-2"><Users size={16} className="text-[#6B8F71]"/>Coachees</h3>
          </div>
          <div className="flex items-center gap-1.5 mb-3 px-1 flex-wrap">
            <Filter size={12} className="text-[#8A8270]" />
            {empresasUnicas.map((e) => (
              <button
                key={e}
                onClick={() => setFiltroEmpresa(e)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  filtroEmpresa === e ? "bg-[#16232E] text-[#F1EBDD] border-[#16232E]" : "border-[#E4DCC9] text-[#5C5340] hover:border-[#6B8F71]"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            {coacheesFiltrados.map((c) => (
              <button
                key={c.id}
                onClick={() => setSeleccionado(c.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                  seleccionado === c.id ? "bg-[#EFE9DD]" : "hover:bg-[#FBF9F4]"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#16232E] truncate">{c.nombre}</p>
                  <p className="text-xs text-[#8A8270]">{c.empresa}</p>
                </div>
                <ChevronRight size={15} className="text-[#B0A78E] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4DCC9] p-4 sm:p-5">
          <div className="flex justify-between items-start mb-4 gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-[#16232E] text-sm sm:text-base truncate">{activo.nombre}</h3>
              <p className="text-xs text-[#8A8270]">{activo.cargo} · {activo.empresa}</p>
            </div>
            <Rings fase={activo.fase} />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            <div className="bg-[#FBF9F4] rounded-xl p-2.5 sm:p-3">
              <p className="text-xs text-[#8A8270]">Sesiones</p>
              <p className="font-mono text-base sm:text-lg text-[#16232E]">{activo.sesiones.hechas}/{activo.sesiones.total}</p>
            </div>
            <div className="bg-[#FBF9F4] rounded-xl p-2.5 sm:p-3">
              <p className="text-xs text-[#8A8270]">Avance</p>
              <p className="font-mono text-base sm:text-lg text-[#6B8F71]">{activo.avanceGeneral}%</p>
            </div>
            <div className="bg-[#FBF9F4] rounded-xl p-2.5 sm:p-3">
              <p className="text-xs text-[#8A8270]">Satisf.</p>
              <Stars n={activo.satisfaccion} />
            </div>
          </div>
          <div className="bg-[#16232E]/[0.04] border border-[#E4DCC9] rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={13} className="text-[#B08D57]" />
              <p className="text-xs uppercase tracking-wide text-[#8A8270]">Notas privadas — no visibles para la empresa</p>
            </div>
            <p className="text-sm text-[#3A3226] leading-relaxed">{activo.notasPrivadas}</p>
          </div>
        </div>
      </div>

      <AsignarRecursos coacheeId={activo.id} />
      <GestionContacto coacheeId={activo.id} />
      <ResumenReunionInicial coacheeId={activo.id} />
      <GeneradorInformeFinal coachee={activo} />
      <CalendarioSesiones />

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <PlantillasPlanDesarrollo />
        <GestionHoras />
      </div>

      <BibliotecaConBuscador />
    </div>
  );
}

export default function CoachingPlatform() {
  const [rol, setRol] = useState("coachee");
  const roles = [
    { id: "coachee", label: "Coachee", icon: UserCircle },
    { id: "empresa", label: "Empresa", icon: Building2 },
    { id: "coach", label: "Coach", icon: Compass },
  ];
  return (
    <CoachingProvider>
      <div className="min-h-screen bg-[#FBF9F4]" style={{ fontFamily: "Inter, sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        `}</style>

        <header className="border-b border-[#E4DCC9] bg-[#FBF9F4] sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-3 sm:px-5 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass size={18} className="text-[#6B8F71] shrink-0" />
              <span className="text-base sm:text-lg text-[#16232E] truncate" style={{ fontFamily: "Fraunces, serif" }}>
                Coach Fernando Ramos
              </span>
            </div>
            <div className="flex gap-1 bg-white rounded-full border border-[#E4DCC9] p-1">
              {roles.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => setRol(r.id)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm transition-colors ${
                      rol === r.id ? "bg-[#16232E] text-[#F1EBDD]" : "text-[#5C5340] hover:bg-[#FBF9F4]"
                    }`}
                  >
                    <Icon size={13} /> {r.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-3 sm:px-5 pb-2 sm:pb-3 text-xs text-[#8A8270] flex items-center gap-1.5">
            <ArrowUpRight size={12} className="shrink-0" /> Vista demo — así se ve la plataforma según quién inicia sesión
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-3 sm:px-5 py-4 sm:py-8">
          {rol === "coachee" && <CoacheeView />}
          {rol === "empresa" && <EmpresaView />}
          {rol === "coach" && <CoachView />}
        </main>
      </div>
    </CoachingProvider>
  );
}
