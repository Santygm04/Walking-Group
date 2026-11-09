export const WHATSAPP_NUMBER = "5493816288837"
export const CONTACT_EMAIL = "panaxxx@hotmail.com"
export const CONTACT_PHONE_DISPLAY = "+54 9381 628 8837"
export const CONTACT_PHONE_HREF = "+5493816288837"
export const INSTAGRAM_URL = "https://instagram.com/mambomarket"

export const NAV_ITEMS = [
  { id: "inicio", label: "Inicio" },
  { id: "nosotros", label: "Nosotros" },
  { id: "servicios", label: "Servicios" },
  { id: "metodologia", label: "Metodología" },
  { id: "clientes", label: "Clientes" },
  { id: "contacto", label: "Contacto" },
]

export const STATS = [
  { value: 40, suffix: "+", label: "Tipos de estudio" },
  { value: 19, suffix: "", label: "Años de experiencia" },
  { value: 200, suffix: "+", label: "Clientes satisfechos" },
  { value: 3, suffix: "", label: "Continentes" },
]

export const SERVICES = [
  {
    index: "01",
    icon: "chart",
    visual: "bars",
    title: "Estudios de mercado",
    offer: "Estudio de Mercado Completo",
    description:
      "Investigación cuantitativa y cualitativa para entender al consumidor, leer tendencias y detectar oportunidades antes que el mercado.",
    tags: ["Cuantitativo", "Cualitativo", "Tendencias"],
    featured: true,
  },
  {
    index: "02",
    icon: "tag",
    visual: "curve",
    title: "Sensibilidad de precios",
    offer: "Análisis de Sensibilidad de Precios",
    description:
      "Modelos propios de elasticidad para encontrar el precio que maximiza valor, volumen y margen.",
    tags: ["Elasticidad", "Pricing", "Modelos propios"],
  },
  {
    index: "03",
    icon: "network",
    visual: "nodes",
    title: "Brand analysis & redes semánticas",
    offer: "Brand Analysis & Redes Semánticas",
    description:
      "Qué significa tu marca en la cabeza del consumidor y cómo se conecta con las decisiones de compra.",
    tags: ["Percepción", "Posicionamiento", "Semántica"],
  },
  {
    index: "04",
    icon: "compass",
    visual: "orbit",
    title: "Coaching empresarial",
    offer: "Coaching Empresarial",
    description:
      "Acompañamiento estratégico para equipos y líderes que necesitan claridad, foco y ejecución.",
    tags: ["Estrategia", "Liderazgo", "Procesos"],
  },
  {
    index: "05",
    icon: "store",
    visual: "shelf",
    title: "Estudios de punto de venta",
    offer: "Estudios de Punto de Venta",
    description:
      "Distribución, facing, merchandising y comportamiento real del shopper en la última milla de la decisión.",
    tags: ["Retail", "Merchandising", "Shopper"],
  },
  {
    index: "06",
    icon: "star",
    visual: "gauge",
    title: "Calidad de servicio",
    offer: "Evaluación de Calidad de Servicio",
    description:
      "Medimos la experiencia completa del cliente y convertimos cada punto de fricción en una mejora concreta.",
    tags: ["Experiencia", "Evaluación", "Mejora continua"],
  },
]

export const METHODS = [
  {
    index: "01",
    title: "Decisiones de marketing",
    description:
      "Del insight a la acción comercial. Diseñamos cada estudio alrededor de una decisión concreta de negocio.",
    bullets: [
      "Desarrollo y lanzamiento de productos",
      "Estrategias de marca y posicionamiento",
      "Optimización de precios y promociones",
      "Campañas publicitarias efectivas",
    ],
  },
  {
    index: "02",
    title: "Comportamiento del consumidor",
    description:
      "Entendemos por qué la gente elige, descarta y vuelve a elegir. El contexto importa tanto como la respuesta.",
    bullets: [
      "Hábitos de compra y consumo",
      "Motivaciones y frenos de compra",
      "Segmentación psicográfica",
      "Journey del cliente",
    ],
  },
  {
    index: "03",
    title: "Técnicas especializadas",
    description:
      "Modelos propios y técnicas avanzadas para preguntas que no se responden con una encuesta convencional.",
    bullets: [
      "Modelos econométricos propios",
      "Análisis de redes semánticas",
      "Estudios de elasticidad de precios",
      "Técnicas proyectivas avanzadas",
    ],
  },
  {
    index: "04",
    title: "Investigación avanzada",
    description:
      "Escalamos el conocimiento a nuevos mercados, categorías y escenarios futuros con rigor metodológico.",
    bullets: [
      "Estudios multipaís",
      "Análisis predictivos",
      "Investigación digital",
      "Metodologías mixtas",
    ],
  },
]

export const PRINCIPLES = [
  "Búsqueda permanente de la excelencia",
  "Valor agregado en lo analítico",
  "Innovación y actualización del saber",
  "Relaciones de futuro con los clientes",
  "Conducta ética intachable",
]

export const CLIENT_GROUPS = [
  {
    title: "Investigación internacional",
    clients: ["Kantar", "Ipsos", "Intermarket Research", "Survey Data"],
  },
  {
    title: "Sector alimentario",
    clients: ["Sumesa", "Quala", "Yeti", "Corporación Nacional"],
  },
  {
    title: "Servicios financieros",
    clients: ["Vision Fund", "Biess", "Advance Consultora", "Controladora del Estado"],
  },
  {
    title: "Consultoría & otros",
    clients: ["Insotec", "Mipro", "GeoPlaDeS", "Agencia Nacional"],
  },
]

export const CLIENT_NAMES = CLIENT_GROUPS.flatMap((group) => group.clients)

export const OFFICES = [
  {
    id: "ar",
    country: "Argentina",
    city: "San Miguel de Tucumán",
    shortCity: "Tucumán",
    role: "Sede principal",
    address: "España 1674, San Miguel de Tucumán",
    contact: "Diego Gil",
    phone: CONTACT_PHONE_DISPLAY,
    phoneHref: CONTACT_PHONE_HREF,
    email: CONTACT_EMAIL,
    timeZone: "America/Argentina/Tucuman",
    coords: "26.82° S · 65.22° O",
    point: { left: "25%", top: "61%" },
  },
  {
    id: "es",
    country: "España",
    city: "Oficina europea",
    shortCity: "España",
    role: "Europa",
    address: "Operación europea",
    contact: "Sergio Ferrer",
    phone: "+34 631 079 181",
    phoneHref: "+34631079181",
    email: "viajesbcn2014@gmail.com",
    timeZone: "Europe/Madrid",
    coords: "40.42° N · 3.70° O",
    point: { left: "47%", top: "36%" },
  },
  {
    id: "ae",
    country: "Emiratos Árabes Unidos",
    city: "Umm Al Quwain",
    shortCity: "EAU",
    role: "Medio Oriente",
    address: "Al Shmookh Business Center, One UAQ, UAE Free Trade Zone",
    contact: "Mambo Market",
    phone: "",
    phoneHref: "",
    email: CONTACT_EMAIL,
    timeZone: "Asia/Dubai",
    coords: "25.56° N · 55.55° E",
    point: { left: "72%", top: "52%" },
  },
]

export const SERVICE_OPTIONS = [
  "Estudio de Mercado Completo",
  "Análisis de Sensibilidad de Precios",
  "Brand Analysis & Redes Semánticas",
  "Coaching Empresarial",
  "Estudios de Punto de Venta",
  "Evaluación de Calidad de Servicio",
  "Consultoría Estratégica Integral",
  "Investigación Personalizada",
]

export const BUDGET_OPTIONS = [
  "Menos de $5,000 USD",
  "$5,000 - $15,000 USD",
  "$15,000 - $30,000 USD",
  "$30,000 - $50,000 USD",
  "Más de $50,000 USD",
  "A definir",
]

export const URGENCY_OPTIONS = [
  "Inmediata (1-2 semanas)",
  "Alta (1 mes)",
  "Media (2-3 meses)",
  "Baja (más de 3 meses)",
]

export const TIME_OPTIONS = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"]

export const CAPABILITIES = [
  "Investigación de mercados",
  "Coaching empresarial",
  "Brand analysis",
  "Pricing",
  "Retail",
  "Customer experience",
  "Estudios multipaís",
  "Consultoría estratégica",
]
