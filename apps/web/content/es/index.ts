import type { SiteContent } from "../types";

export const esContent = {
  locale: "es",
  shared: {
    siteName: "HELP Math",
    siteTagline: "El lenguaje matemático, a la vista",
    skipToContent: "Ir al contenido principal",
    statusLabel: "Vista previa de la plataforma educativa",
    statusMessage:
      "Hay dos lecciones disponibles en JavaScript actual: la lección 3 de cuarto grado, Números negativos (39 páginas), y la lección 4 de quinto grado, Rectas numéricas (54 páginas). Es acceso funcional al aprendizaje, no fidelidad estricta a Flash, aceptación del audio, aceptación del titular ni publicación del currículo más amplio.",
    externalLinkLabel: "Se abre en una pestaña nueva",
    requiredFieldLabel: "Obligatorio",
    navigation: {
      ariaLabel: "Navegación principal",
      homeLabel: "Página principal de HELP Math",
      links: [
        { label: "El proyecto", href: "/es/about" },
        { label: "Enfoque", href: "/es/approach" },
        { label: "Currículo", href: "/es/curriculum" },
        { label: "Investigación", href: "/es/research" },
        { label: "Recursos", href: "/es/resources" },
        { label: "Demostraciones", href: "/es/demos" },
      ],
      supportAction: { label: "Obtener asistencia", href: "/es/support" },
      languageLabel: "Idioma",
      languageNames: { en: "English", es: "Español" },
      openMenuLabel: "Abrir la navegación",
      closeMenuLabel: "Cerrar la navegación",
    },
    footer: {
      summary:
        "HELP Math es una plataforma educativa con opciones de interfaz en inglés y español que hace visibles las ideas matemáticas y ofrece apoyo guiado con Nova Tutor.",
      exploreLabel: "Aprendizaje",
      helpLabel: "Ayuda y políticas",
      exploreLinks: [
        { label: "Inicio de aprendizaje", href: "/" },
        { label: "Lección Números negativos", href: "/courses/4/3?mode=focus" },
        { label: "Aprender con Nova", href: "/courses/4/3?mode=focus" },
        { label: "Currículo y evidencia", href: "/curriculum" },
      ],
      helpLinks: [
        { label: "Asistencia", href: "/es/support" },
        { label: "Contacto", href: "/es/contact" },
        { label: "Privacidad", href: "/es/privacy" },
        { label: "Términos", href: "/es/terms" },
      ],
      languageNote:
        "La interfaz de la plataforma está disponible en inglés y español. Los medios y las interacciones de origen varían según la página y no forman una experiencia completa ni validada en español.",
      legalNote:
        "La lección 3 de cuarto grado y la lección 4 de quinto grado son lecciones funcionales en JavaScript actual. La fidelidad estricta a Flash, la aceptación del audio, la aceptación del titular y la publicación del currículo más amplio siguen siendo procesos separados.",
    },
  },
  pages: {
    home: {
      metadata: {
        title: "El lenguaje matemático, a la vista",
        description:
          "Conozca el proyecto moderno HELP Math: apoyo matemático bilingüe, contexto de investigación, demostraciones interactivas restauradas y ayuda para educadores y estudiantes que regresan.",
      },
      hero: {
        eyebrow: "Bienvenidos de nuevo a HELP Math",
        title: "Descubre el lenguaje dentro de cada idea matemática.",
        summary:
          "HELP Math conecta modelos visuales, explicaciones claras, vocabulario académico y práctica guiada para que los estudiantes multilingües comprendan tanto las matemáticas como las palabras que se usan para describirlas.",
        primaryAction: { label: "Explorar las demostraciones", href: "/es/demos" },
        secondaryAction: { label: "Obtener ayuda con el proyecto", href: "/es/support" },
        supportingNote:
          "El sitio web ofrece dos lecciones funcionales en JavaScript actual: la lección 3 de cuarto grado con 39 páginas y la lección 4 de quinto grado con 54. La fidelidad estricta a Flash, la aceptación del audio, la aceptación del titular y la publicación del currículo más amplio siguen siendo procesos separados.",
      },
      status: {
        label: "Estado del proyecto",
        title: "Una reconstrucción cuidadosa, no una copia del sitio antiguo",
        body:
          "Conservamos las ideas didácticas de HELP Math y sustituimos la tecnología obsoleta por experiencias web accesibles y sostenibles. Esta versión no incluye cuentas, tareas ni registros de progreso estudiantil.",
        action: { label: "Leer el estado de la modernización", href: "/es/about#today" },
      },
      audiences: {
        eyebrow: "Diseñado en torno a necesidades reales",
        title: "Un camino más claro hacia el significado matemático",
        intro:
          "Cada estudiante puede necesitar un punto de entrada distinto. La experiencia pública restaurada de HELP Math se centra en la explicación, el lenguaje y las representaciones de apoyo.",
        cards: [
          {
            id: "multilingual-learners",
            title: "Para estudiantes multilingües",
            description:
              "Conecta el lenguaje cotidiano, el vocabulario académico, los símbolos y los modelos visuales sin reducir la meta matemática.",
          },
          {
            id: "students-needing-support",
            title: "Para quienes necesitan otra vía",
            description:
              "Divide ideas complejas en pasos visibles y pausados, y ofrece varias formas de reconocer relaciones y patrones.",
          },
          {
            id: "educators",
            title: "Para educadores",
            description:
              "Examina el enfoque didáctico, explora ejemplos restaurados y ayuda a definir los próximos pasos responsables del proyecto.",
          },
        ],
      },
      approach: {
        eyebrow: "Cómo enseña HELP Math",
        title: "Las palabras, las representaciones y el razonamiento trabajan juntos",
        intro:
          "El programa histórico combinaba la enseñanza de matemáticas con apoyos lingüísticos. La modernización mantiene esa idea central visible en cada actividad restaurada.",
        cards: [
          {
            id: "make-language-explicit",
            title: "Hacer explícito el lenguaje",
            description:
              "Presenta términos clave en contexto y los conecta con símbolos, acciones, diagramas y ejemplos.",
          },
          {
            id: "show-relationships",
            title: "Mostrar las relaciones",
            description:
              "Usa animación y representaciones manipulables para revelar qué cambia, qué permanece y por qué.",
          },
          {
            id: "pace-the-thinking",
            title: "Dar ritmo al pensamiento",
            description:
              "Segmenta las explicaciones en pasos intencionales para atender una relación a la vez.",
          },
        ],
        action: { label: "Conocer el enfoque didáctico", href: "/es/approach" },
      },
      demos: {
        eyebrow: "Experiencia de aprendizaje disponible",
        title: "Elige una lección para explorar",
        intro:
          "La lección 3 de cuarto grado, Números negativos, y la lección 4 de quinto grado, Rectas numéricas, ya son lecciones funcionales en JavaScript actual con progreso local y apoyos para aprender.",
        items: [],
        note:
          "Estas lecciones funcionales no afirman fidelidad estricta a Flash, aceptación del audio, aceptación del titular ni publicación del currículo más amplio.",
      },
      closing: {
        title: "¿Regresas a HELP Math? Queremos orientarte.",
        body:
          "Cuéntanos si buscas una cuenta antigua, materiales del programa, información de investigación o una futura colaboración. No incluyas expedientes estudiantiles ni contraseñas.",
        action: { label: "Contactar con el proyecto", href: "/es/contact" },
      },
    },
    about: {
      metadata: {
        title: "Acerca de HELP Math",
        description:
          "Conoce para qué se diseñó HELP Math, qué se está preservando y qué incluye y no incluye la modernización actual.",
      },
      hero: {
        eyebrow: "Acerca del proyecto",
        title: "Preservamos una idea didáctica que vale la pena reconstruir",
        summary:
          "HELP Math —nombre que históricamente significaba Help with English Language Proficiency— se diseñó para desarrollar la comprensión matemática junto con el lenguaje académico que el alumnado necesita para participar en el aprendizaje de matemáticas.",
        primaryAction: { label: "Explorar nuestro enfoque", href: "/es/approach" },
        secondaryAction: { label: "Ver el archivo de investigación", href: "/es/research" },
      },
      story: [
        {
          id: "purpose",
          eyebrow: "El propósito original",
          title: "Las matemáticas y el lenguaje pertenecen a la misma lección",
          paragraphs: [
            "Los materiales históricos describen HELP Math como una intervención web para estudiantes de inglés y para otras personas que se benefician de apoyo matemático adicional.",
            "Su propósito didáctico no era simplemente traducir instrucciones. Las lecciones conectaban conceptos matemáticos con vocabulario académico, modelos visuales, explicaciones orales y escritas, práctica guiada y apoyo bilingüe.",
          ],
        },
        {
          id: "preservation",
          eyebrow: "Lo que preservamos",
          title: "La estructura didáctica antes que la nostalgia tecnológica",
          paragraphs: [
            "El archivo del proyecto incluye fuentes de lecciones, medios interactivos, descripciones del programa y materiales de investigación de distintos periodos de la historia de HELP Math.",
            "La restauración trata esos archivos como evidencia. Conserva explicaciones significativas, ritmo, apoyos lingüísticos e interacciones del estudiante a la vez que reemplaza la tecnología obsoleta del navegador.",
          ],
        },
        {
          id: "today",
          eyebrow: "Nuestra situación actual",
          title: "Una plataforma educativa con dos lecciones funcionales en JavaScript actual",
          paragraphs: [
            "Esta versión ofrece la lección 3 de cuarto grado, Números negativos, con 39 páginas registradas en JavaScript actual y la lección 4 de quinto grado, Rectas numéricas, con 54 páginas registradas en JavaScript actual dentro de la experiencia moderna Mi lección.",
            "No restaura el antiguo sistema de cuentas ni ofrece clases, tareas, compras, paneles docentes o calificaciones formales. La fidelidad estricta a Flash, la aceptación del audio, la aceptación del titular y la publicación del currículo más amplio siguen siendo puertas separadas.",
          ],
        },
      ],
      principles: {
        eyebrow: "Principios de modernización",
        title: "Qué orienta cada decisión",
        cards: [
          {
            id: "evidence",
            title: "Evidencia antes que afirmaciones",
            description:
              "Separamos los registros históricos fechados de las afirmaciones verificadas de manera independiente para el uso actual.",
          },
          {
            id: "access",
            title: "Acceso desde el diseño",
            description:
              "Diseño adaptable, teclado, contraste legible, alternativas textuales y movimiento reducido forman parte de la construcción.",
          },
          {
            id: "language",
            title: "Lenguaje con dignidad",
            description:
              "Los apoyos bilingües y de lenguaje académico deben ampliar el acceso a ideas rigurosas, nunca indicar expectativas menores.",
          },
          {
            id: "privacy",
            title: "Primero la privacidad estudiantil",
            description:
              "El lanzamiento público no recopila datos de aprendizaje ni pide al alumnado crear cuentas.",
          },
        ],
      },
      today: {
        title: "Ayúdanos a comprender cómo se utilizó HELP Math",
        body:
          "Educadores, colaboradores e investigadores anteriores pueden compartir contexto no confidencial sobre la historia del programa. No envíes nombres o expedientes de estudiantes, credenciales ni materiales protegidos que no estés autorizado a compartir.",
        action: { label: "Contactar con el equipo de restauración", href: "/es/contact?topic=project-history" },
      },
    },
    approach: {
      metadata: {
        title: "Enfoque didáctico",
        description:
          "Descubre cómo HELP Math integra lenguaje académico, representaciones visuales, explicaciones pausadas y apoyo bilingüe alrededor de ideas matemáticas rigurosas.",
      },
      hero: {
        eyebrow: "Enfoque didáctico",
        title: "Hacer más visibles las matemáticas y su lenguaje",
        summary:
          "El diseño histórico de HELP Math se inspira en la instrucción protegida: explicitar el significado, conectar el lenguaje con las representaciones, segmentar razonamientos complejos y ofrecer oportunidades de participación con apoyo y con la misma meta matemática.",
        primaryAction: { label: "Probar una demostración restaurada", href: "/es/demos" },
        secondaryAction: { label: "Revisar el contexto curricular", href: "/es/curriculum" },
      },
      foundations: {
        eyebrow: "Cuatro fundamentos",
        title: "Apoyos que permanecen conectados con la idea",
        intro:
          "Cada capa debe ayudar a razonar, no decorar la pantalla ni sustituir el pensamiento productivo.",
        cards: [
          {
            id: "academic-language",
            title: "Lenguaje académico en contexto",
            description:
              "Define y retoma los términos donde cumplen una función matemática; conecta palabras como equivalente, convertir y representar con relaciones visibles.",
          },
          {
            id: "multiple-representations",
            title: "Múltiples representaciones",
            description:
              "Coordina números, símbolos, diagramas, objetos manipulables y explicaciones orales o escritas para conectar distintas formas de significado.",
          },
          {
            id: "segmentation",
            title: "Segmentación intencional",
            description:
              "Divide las explicaciones en momentos coherentes, controla el ritmo y deja tiempo suficiente para notar la relación que se estudia.",
          },
          {
            id: "bilingual-support",
            title: "Apoyo bilingüe",
            description:
              "Usa el español como puente a la comprensión y mantiene visibles y significativos los términos académicos importantes en inglés.",
          },
        ],
      },
      learningSequence: {
        eyebrow: "Una secuencia de aprendizaje",
        title: "De la orientación al razonamiento independiente",
        intro:
          "Los patrones exactos de las lecciones varían, pero la experiencia restaurada sigue un recorrido didáctico transparente.",
        steps: [
          {
            id: "orient",
            step: "01",
            title: "Orientar",
            description:
              "Nombra la meta, activa conocimientos previos útiles y presenta el lenguaje que será necesario.",
          },
          {
            id: "model",
            step: "02",
            title: "Modelar",
            description:
              "Hace visible una relación mediante un ejemplo resuelto, representaciones coordinadas y una explicación concisa.",
          },
          {
            id: "interact",
            step: "03",
            title: "Interactuar",
            description:
              "Permite predecir, repetir, manipular o comparar para mantener la atención en la estructura matemática.",
          },
          {
            id: "practice",
            step: "04",
            title: "Practicar y explicar",
            description:
              "Avanza hacia el trabajo independiente e invita a usar el lenguaje objetivo para describir el razonamiento.",
          },
        ],
      },
      supportLayers: {
        id: "support-layers",
        eyebrow: "Metas de diseño del apoyo",
        title: "Añadir apoyo sin ocultar las matemáticas",
        paragraphs: [
          "Una actividad moderna puede diseñarse para combinar texto conciso, narración, énfasis visual, conexión con un glosario, apoyo en español, repetición y ritmo controlado por el estudiante. En la muestra actual, la disponibilidad varía según la página; los medios y las interacciones de origen en español no están completos ni validados.",
          "No todas las actividades necesitan todos los apoyos. La meta es que cada apoyo tenga propósito, pueda percibirse y pueda retirarse cuando ya no sea necesario.",
        ],
        bullets: [
          "Mantener las etiquetas cerca de las representaciones que describen.",
          "Usar el movimiento para explicar cambios, no para competir por la atención.",
          "Permitir pausa y repetición sin alterar la secuencia didáctica.",
          "Tratar las experiencias completas en español e inglés como una meta de diseño, no como una afirmación sobre todas las páginas actuales de la muestra.",
        ],
      },
      teacherRole: {
        title: "La tecnología apoya la enseñanza; los educadores orientan su uso.",
        body:
          "La plataforma ya ofrece dos lecciones funcionales en JavaScript actual con un total de 93 páginas registradas, no un currículo publicado completo ni un sistema docente automatizado. La fidelidad estricta a Flash, la aceptación del audio, la aceptación del titular y la publicación del currículo más amplio siguen siendo procesos separados. Los educadores son esenciales para elegir tareas apropiadas, escuchar el razonamiento del alumnado y conectar las actividades con las metas del aula.",
        action: { label: "Hacer una consulta didáctica", href: "/es/contact?topic=instruction" },
      },
    },
    curriculum: {
      metadata: {
        title: "Currículo",
        description:
          "Explora los dominios históricos del currículo HELP Math, su flujo de lección y los límites del material disponible actualmente en el sitio moderno.",
      },
      hero: {
        eyebrow: "Contexto curricular",
        title: "Un archivo amplio que regresa pieza por pieza, después de validarse",
        summary:
          "Los materiales históricos describen configuraciones de HELP Math para los últimos grados de primaria y los grados intermedios, además de usos de refuerzo. El sitio actual ofrece contexto del proyecto mientras las candidatas de JavaScript permanecen en auditoría local, no el currículo histórico completo.",
        primaryAction: { label: "Ver la disponibilidad de demostraciones", href: "/es/demos" },
        secondaryAction: { label: "Solicitar información curricular", href: "/es/contact?topic=curriculum" },
      },
      archiveNotice: {
        title: "Por qué no publicamos una sola cifra de lecciones u horas",
        body:
          "Los documentos archivados describen distintas ediciones y alcances propuestos, incluidas configuraciones de 3.º a 8.º y de 6.º a 8.º grado. Se están conciliando esos registros antes de publicar un catálogo actual o afirmaciones sobre alineación y disponibilidad.",
      },
      domains: {
        eyebrow: "Dominios históricos de contenido",
        title: "Ideas matemáticas representadas en el archivo",
        intro:
          "El archivo incluye trabajo en cuatro grandes dominios. La cobertura y la secuencia varían según la edición histórica y siguen en auditoría.",
        cards: [
          {
            id: "numbers",
            title: "Números y operaciones",
            description:
              "Valor posicional, relaciones numéricas, fracciones, decimales, razonamiento proporcional y operaciones con lenguaje y modelos visuales.",
          },
          {
            id: "geometry",
            title: "Geometría y medición",
            description:
              "Propiedades, relaciones espaciales, unidades, medición y razonamiento geométrico visibles mediante diagramas y manipulación.",
          },
          {
            id: "algebra",
            title: "Patrones y pensamiento algebraico",
            description:
              "Patrones, variables, expresiones, ecuaciones y el lenguaje utilizado para describir relaciones generales.",
          },
          {
            id: "data",
            title: "Datos y probabilidad",
            description:
              "Leer, representar, comparar y razonar a partir de datos mediante gráficas, cantidades y explicaciones coordinadas.",
          },
        ],
      },
      lessonFlow: {
        eyebrow: "Diseño de objetos de aprendizaje",
        title: "Cómo puede desarrollarse una lección restaurada",
        steps: [
          {
            id: "goal-language",
            step: "1",
            title: "Definir la meta y el lenguaje",
            description:
              "Aclara el propósito matemático, los conocimientos previos relevantes y las palabras que aparecerán.",
          },
          {
            id: "concept-development",
            step: "2",
            title: "Desarrollar el concepto",
            description:
              "Usa representaciones sincronizadas y ejemplos pausados para revelar una relación clave.",
          },
          {
            id: "guided-application",
            step: "3",
            title: "Aplicar con apoyo",
            description:
              "Ofrece elecciones significativas, retroalimentación, repetición y andamiaje lingüístico durante la práctica.",
          },
          {
            id: "reflect-check",
            step: "4",
            title: "Reflexionar y comprobar",
            description:
              "Invita a explicar y comprueba la comprensión sin tratar una sola interacción como medida completa del dominio.",
          },
        ],
      },
      availability: {
        id: "availability",
        eyebrow: "Lo que está disponible ahora",
        title: "Dos lecciones funcionales, sin matrículas",
        paragraphs: [
          "La plataforma ofrece actualmente dos lecciones en JavaScript actual dentro de la experiencia moderna Mi lección: la lección 3 de cuarto grado, Números negativos, con 39 páginas registradas, y la lección 4 de quinto grado, Rectas numéricas, con 54. Incluyen progreso local del navegador y apoyos de aprendizaje, pero no pruebas de ubicación, paneles docentes, tareas, matrículas ni calificaciones formales.",
          "La interfaz está disponible en inglés y español, pero los medios y las interacciones de origen varían según la página y no forman una experiencia completa ni validada en español.",
          "Estas lecciones son acceso funcional al producto, no afirmaciones de migración estricta, fidelidad a Flash, aceptación del audio ni aceptación del titular. La publicación de más currículo aún depende de auditorías de fuentes y derechos, revisión didáctica, accesibilidad, validación del comportamiento original, revisión humana y aceptación del titular.",
        ],
      },
      closing: {
        title: "¿Buscas una lección o un documento histórico de alcance?",
        body:
          "Envía una solicitud de contacto de un adulto con el tema y el uso previsto. Confirmaremos qué puede compartirse y si hay una copia accesible.",
        action: { label: "Solicitar información curricular", href: "/es/contact?topic=curriculum" },
      },
    },
    research: {
      metadata: {
        title: "Archivo de investigación y evidencia",
        description:
          "Consulta contexto histórico de investigación de HELP Math, registros archivados y las normas de evidencia que orientan las afirmaciones públicas actuales.",
      },
      hero: {
        eyebrow: "Investigación y evidencia",
        title: "Mantener visible la historia y precisar las afirmaciones",
        summary:
          "El archivo de HELP Math incluye descripciones de investigaciones, materiales de subvenciones, reseñas y premios de distintos periodos. Esta página los identifica como evidencia histórica hasta poder comprobar cada fuente y su relevancia actual de manera independiente.",
        primaryAction: { label: "Solicitar una fuente", href: "/es/contact?topic=research" },
        secondaryAction: { label: "Conocer el proyecto", href: "/es/about" },
      },
      evidenceNotice: {
        title: "Una declaración archivada no es una afirmación actual de eficacia",
        body:
          "Importan las fechas, poblaciones del estudio, condiciones de comparación, medidas de resultados, versiones del producto e informes originales. No reutilizamos expresiones como «único», «líder», «mejor calificado» o «probado por la investigación» sin respaldo actual que pueda revisarse directamente.",
      },
      entriesLabel: "Registro de evidencia",
      entries: [
        {
          id: "program-description-2014",
          title: "Descripción del programa About HELP Math",
          dateLabel: "Documento archivado creado en 2014",
          status: "archived",
          statusLabel: "Contexto de archivo",
          summary:
            "Descripción general de los estudiantes previstos, los apoyos de lenguaje académico, el diseño de lecciones, el alcance curricular histórico y la narrativa de investigación.",
          interpretation:
            "Es útil para comprender la intención de diseño. Las cifras y afirmaciones específicas requieren confirmación frente a la edición y las fuentes primarias correspondientes.",
          sourceLabel: "Archivo local: About HELP Math.pdf",
        },
        {
          id: "html5-proposal-2020",
          title: "Propuesta de fase I de HELP Math con HTML5",
          dateLabel: "Propuesta archivada creada en 2020",
          status: "context",
          statusLabel: "Contexto de diseño",
          summary:
            "Propuesta que vincula la modernización de HELP Math con aprendizaje multimedia, instrucción protegida, andamiaje, segmentación, desarrollo de vocabulario y manipulación virtual.",
          interpretation:
            "Documenta una dirección de modernización propuesta. Una propuesta no demuestra que todas sus funciones se hayan implementado o evaluado.",
          sourceLabel: "Archivo local: BoulderLearning.PhaseI.HMwithHTML5.pdf",
        },
        {
          id: "scope-2020",
          title: "Alcance de HELP Math 2.0",
          dateLabel: "Documento de alcance archivado creado en 2020",
          status: "context",
          statusLabel: "Alcance propuesto",
          summary:
            "Documento de planificación que describe una visión más amplia de plataforma, evaluación diagnóstica, apoyos personalizables, expansión de contenidos y actualizaciones tecnológicas.",
          interpretation:
            "Muestra la aspiración del producto, no la funcionalidad del sitio actual. Las funciones propuestas no se describen como disponibles sin verificación independiente.",
          sourceLabel: "Archivo local: HELP Math 2.0 Scope.pdf",
        },
        {
          id: "historical-review-records",
          title: "Reseñas y premios externos históricos",
          dateLabel: "Fechas y registros en revisión",
          status: "verification",
          statusLabel: "Requiere verificación",
          summary:
            "Las páginas antiguas aluden a materiales federales de revisión de investigaciones, subvenciones educativas, cobertura periodística y premios del sector.",
          interpretation:
            "Estas referencias se fecharán y vincularán con registros primarios antes de presentarlas como logros verificados en el sitio moderno.",
          sourceLabel: "Sitio antiguo y archivo del proyecto",
        },
      ],
      reviewPolicy: {
        id: "review-policy",
        eyebrow: "Política de evidencia",
        title: "Qué registramos antes de publicar una afirmación",
        paragraphs: [
          "Toda afirmación sustantiva de eficacia o reconocimiento debe señalar una fuente que se pueda consultar. Si una fuente no está disponible o describe una versión anterior, esa limitación acompaña a la afirmación.",
        ],
        bullets: [
          "Cita completa y ubicación estable de la fuente",
          "Fecha de publicación o del premio",
          "Versión del producto y alcance curricular",
          "Muestra, diseño, medidas y condición de comparación cuando corresponda",
          "Resultado expresado en proporción a la evidencia",
          "Conflictos conocidos entre fuentes archivadas",
        ],
      },
      request: {
        title: "¿Conservas un informe primario o una cita de la historia de HELP Math?",
        body:
          "Investigadores y antiguos colaboradores pueden enviar datos bibliográficos o una copia autorizada. No envíes registros individuales de estudiantes ni materiales que no tengas permiso para compartir.",
        action: { label: "Contactar con el archivo de investigación", href: "/es/contact?topic=research" },
      },
    },
    resources: {
      metadata: {
        title: "Recursos",
        description:
          "Encuentra recursos revisados del programa, investigación y modernización de HELP Math, o solicita al equipo una copia accesible.",
      },
      hero: {
        eyebrow: "Biblioteca de recursos",
        title: "Materiales del proyecto con su contexto incluido",
        summary:
          "El archivo contiene documentos útiles de programa y planificación, pero no todos están autorizados ni son accesibles para descarga pública. Cada elemento indica qué es y cómo debe —y no debe— interpretarse.",
        primaryAction: { label: "Solicitar un recurso", href: "/es/contact?topic=resources" },
        secondaryAction: { label: "Ver el contexto de investigación", href: "/es/research" },
      },
      archiveNotice: {
        title: "La publicación accesible está en curso",
        body:
          "Se están revisando la titularidad, el contenido sensible, los metadatos, el orden de lectura, los encabezados y las descripciones de imágenes de los PDF originales. Hasta completar la revisión, solicita acceso al equipo del proyecto.",
      },
      filters: {
        ariaLabel: "Filtrar recursos por categoría",
        all: "Todos los recursos",
        program: "Programa",
        research: "Investigación",
        technical: "Modernización",
      },
      items: [
        {
          id: "about-help-math",
          title: "About HELP Math",
          format: "PDF archivado · Programa",
          dateLabel: "Creado en 2014",
          status: "request",
          statusLabel: "Disponible previa solicitud",
          description:
            "Resumen histórico de los estudiantes previstos, diseño didáctico, descripciones curriculares y narrativa de evidencia. Las cifras y afirmaciones corresponden a un estado anterior del producto.",
          action: { label: "Solicitar este documento", href: "/es/contact?topic=resource-about-help-math" },
        },
        {
          id: "html5-phase-one",
          title: "HELP Math with HTML5: Phase I",
          format: "PDF archivado · Modernización",
          dateLabel: "Creado en 2020",
          status: "review",
          statusLabel: "Revisión de accesibilidad",
          description:
            "Propuesta histórica de actualización tecnológica basada en conceptos de aprendizaje multimedia e instrucción protegida. El trabajo propuesto no debe interpretarse como funcionalidad completada.",
          action: { label: "Consultar sobre esta propuesta", href: "/es/contact?topic=resource-html5-proposal" },
        },
        {
          id: "help-math-two-scope",
          title: "HELP Math 2.0 Scope",
          format: "PDF archivado · Programa",
          dateLabel: "Creado en 2020",
          status: "request",
          statusLabel: "Disponible previa solicitud",
          description:
            "Documento de planificación para ampliar contenido, diagnóstico, apoyos y capacidades de plataforma. Representa un alcance propuesto, no las funciones actuales de este sitio.",
          action: { label: "Solicitar este documento", href: "/es/contact?topic=resource-help-math-2-scope" },
        },
        {
          id: "modernization-notes",
          title: "Notas de modernización y recuperación",
          format: "Recurso web · Modernización",
          dateLabel: "Documentación viva del proyecto",
          status: "available",
          statusLabel: "Disponible previa solicitud",
          description:
            "Resumen de preservación de fuentes, recuperación de objetos de aprendizaje, validación, accesibilidad y planificación escalonada del producto.",
          action: { label: "Solicitar las notas actuales", href: "/es/contact?topic=modernization-notes" },
        },
      ],
      accessibleCopies: {
        title: "¿Necesitas otro formato?",
        body:
          "Indica qué recurso necesitas y qué formato lo haría utilizable. Responderemos con lo que esté disponible; no podemos garantizar la conversión inmediata de todos los archivos.",
        action: { label: "Solicitar una copia accesible", href: "/es/contact?topic=accessible-resource" },
      },
    },
    support: {
      metadata: {
        title: "Asistencia",
        description:
          "Consulta el estado actual de HELP Math, respuestas para usuarios que regresan, ayuda con demostraciones y una vía segura de contacto.",
      },
      hero: {
        eyebrow: "Asistencia de HELP Math",
        title: "Comienza por lo que está disponible hoy",
        summary:
          "La plataforma ofrece la lección 3 de cuarto grado con 39 páginas en JavaScript actual y la lección 4 de quinto grado con 54, junto con progreso local y apoyos de aprendizaje. Las cuentas anteriores no están conectadas y este sitio no puede recuperar contraseñas ni registros históricos.",
        primaryAction: { label: "Contactar con asistencia", href: "/es/contact?topic=support" },
        secondaryAction: { label: "Comprobar el estado de acceso", href: "/es/login" },
      },
      currentStatus: {
        eyebrow: "Estado actual del servicio",
        title: "Lo que puedes utilizar ahora",
        items: [
          {
            id: "website",
            title: "Plataforma de aprendizaje",
            description:
              "Disponible con opciones de interfaz en inglés y español, dos lecciones funcionales en JavaScript actual con un total de 93 páginas registradas, progreso local, Nova Tutor, información del programa y asistencia. Los medios y las interacciones de origen varían según la página.",
            detail: "Disponible",
          },
          {
            id: "demos",
            title: "Grade 4 Lesson 3: Negative Numbers",
            description:
              "Las 39 páginas registradas son navegables dentro de la experiencia moderna Mi lección. Esto no demuestra fidelidad estricta a Flash, aceptación del audio, aceptación del titular ni publicación del currículo más amplio.",
            detail: "Disponible",
          },
          {
            id: "g5-l4",
            title: "Grade 5 Lesson 4: Number Lines",
            description:
              "Las 54 páginas registradas son navegables dentro de la experiencia moderna Mi lección. Esto no demuestra fidelidad estricta a Flash, aceptación del audio, aceptación del titular ni publicación del currículo más amplio.",
            detail: "Disponible",
          },
          {
            id: "accounts",
            title: "Cuentas de estudiantes y educadores",
            description:
              "El sitio moderno no ofrece acceso, clases, tareas, compras ni informes de progreso.",
            detail: "No disponible",
          },
        ],
      },
      faqLabel: "Preguntas frecuentes",
      faqs: [
        {
          id: "old-login",
          question: "¿Puedo usar mi antiguo usuario y contraseña de HELP Math?",
          answer:
            "No. El sitio público moderno no está conectado al antiguo sistema de cuentas. No introduzcas ni envíes una contraseña anterior. Un adulto puede contactar con asistencia indicando la organización y un contexto no sensible.",
        },
        {
          id: "flash",
          question: "¿Necesito Flash o un complemento especial?",
          answer:
            "No. La lección y las actividades públicas funcionan con JavaScript moderno. Los archivos Flash originales se conservan de forma privada como evidencia y no son necesarios para aprender.",
        },
        {
          id: "full-course",
          question: "¿Está disponible el curso completo de HELP Math?",
          answer:
            "Todavía no. La versión actual incluye dos lecciones funcionales en JavaScript actual —la lección 3 de cuarto grado, Números negativos (39 páginas), y la lección 4 de quinto grado, Rectas numéricas (54 páginas)—, no todo el currículo de HELP Math. Esto no demuestra fidelidad estricta a Flash, aceptación del audio ni aceptación del titular; cada lección adicional requiere sus propias revisiones de fuentes, derechos, instrucción, accesibilidad, fidelidad y aceptación.",
        },
        {
          id: "student-help",
          question: "Soy estudiante. ¿Cómo debo pedir ayuda?",
          answer:
            "Usa Nova Tutor dentro de una lección disponible para pedir explicaciones y pistas. Para asistencia de cuentas, escuela o problemas técnicos, pide a un adulto de confianza que contacte con el proyecto. Nunca envíes contraseñas, fechas de nacimiento, identificadores, calificaciones ni expedientes.",
        },
        {
          id: "purchase",
          question: "¿Puede mi escuela comprar HELP Math en este sitio?",
          answer:
            "No. Las compras en línea y los precios públicos no forman parte de este lanzamiento. Un representante autorizado puede contactar con el proyecto para hablar de acceso o colaboración futura.",
        },
        {
          id: "demo-problem",
          question: "¿Qué incluyo al informar de un problema en una demostración?",
          answer:
            "Indica el nombre, la dirección de la página, el dispositivo y navegador, lo que esperabas y lo que ocurrió. Puede ayudar una captura sin información personal. No incluyas trabajo estudiantil ni credenciales.",
        },
      ],
      contact: {
        title: "¿Todavía necesitas ayuda?",
        body:
          "La recepción de contactos está pausada. Este enlace abre el estado actual de disponibilidad; HELP Math no recopila ni envía actualmente solicitudes de asistencia mediante este sitio.",
        action: { label: "Consultar disponibilidad de contacto", href: "/es/contact?topic=support" },
      },
    },
    login: {
      metadata: {
        title: "Estado del acceso a cuentas",
        description:
          "Descubre por qué las antiguas cuentas de HELP Math no funcionan en el sitio moderno y encuentra la vía de asistencia adecuada.",
      },
      hero: {
        eyebrow: "Acceso a cuentas",
        title: "El antiguo acceso de HELP Math no está activo aquí",
        summary:
          "Este sitio es una versión preliminar pública de la modernización. No tiene formulario de acceso para estudiantes o educadores ni está conectado con la base de datos histórica.",
        primaryAction: { label: "Consultar sobre una cuenta", href: "/es/contact?topic=account-access" },
        secondaryAction: { label: "Revisar la disponibilidad", href: "/es/demos" },
      },
      alert: {
        title: "Protege tus credenciales antiguas",
        body:
          "No envíes usuario, contraseña, identificador estudiantil, calificaciones ni lista de clase. El equipo no puede verificar ni restablecer una contraseña anterior mediante este sitio.",
      },
      options: {
        eyebrow: "Elige el siguiente paso",
        title: "Aún puedes explorar o pedir ayuda",
        cards: [
          {
            id: "student",
            title: "Soy estudiante",
            description:
              "Consulta la información pública del proyecto sin iniciar sesión. Pide a un adulto de confianza que contacte por una cuenta antigua u otra asistencia del proyecto.",
            action: { label: "Explorar el proyecto", href: "/es/about" },
          },
          {
            id: "educator",
            title: "Soy educador o representante escolar",
            description:
              "Contacta desde tu correo de trabajo e indica la organización. Describe el tipo de acceso o información histórica que necesitas sin compartir datos de estudiantes.",
            action: { label: "Solicitar asistencia", href: "/es/contact?topic=account-access" },
          },
          {
            id: "family",
            title: "Soy madre, padre o tutor",
            description:
              "Indica la escuela u organización vinculada con el programa anterior y cómo podemos ayudar. No incluyas contraseñas ni expedientes.",
            action: { label: "Contactar con el proyecto", href: "/es/contact?topic=family-support" },
          },
        ],
      },
      safetyNote:
        "Si otro sitio pide tu antigua contraseña de HELP Math, detente y confirma la dirección web con un adulto de confianza o con tu escuela. El sitio público oficial no pide iniciar sesión.",
    },
    contact: {
      metadata: {
        title: "Disponibilidad de contacto",
        description:
          "Consulta el estado pausado del contacto de HELP Math. El sitio no recopila ni envía actualmente solicitudes de asistencia, recursos, investigación, acceso o colaboración.",
      },
      hero: {
        eyebrow: "Disponibilidad de contacto",
        title: "La recepción de contactos está pausada",
        summary:
          "Esta página solo informa del estado actual. No recopila, verifica ni envía nombres, correos, mensajes u otros datos del formulario. No introduzcas información personal. Un futuro flujo de contacto para adultos solo podrá habilitarse tras documentar la autorización del titular, la revisión legal y la autorización de credenciales de producción.",
      },
      responseNote: {
        title: "Ahora no se aceptan mensajes",
        body:
          "HELP Math no recibe ni revisa actualmente mensajes de esta página. La recepción debe permanecer inactiva hasta que se autoricen expresamente sus puertas de titular, revisión legal y credenciales de producción y se revise el aviso de privacidad para el flujo habilitado.",
      },
      form: {
        title: "El envío de contactos está en pausa",
        intro: "El sitio actual no recopila ni envía nombres, correos, escuelas ni mensajes. Los campos siguientes se conservan para un posible flujo futuro de contacto para adultos, pero no son un servicio activo. No introduzcas información.",
        fields: {
          role: "Tu función",
          name: "Nombre",
          email: "Correo electrónico",
          organization: "Escuela u organización",
          topic: "Tema",
          message: "¿Cómo podemos ayudarte?",
          privacyConsent:
            "Un uso futuro requeriría el aviso de privacidad aprobado y nunca deberá incluir expedientes estudiantiles, contraseñas ni otra información personal sensible. El contacto no está disponible actualmente.",
        },
        placeholders: {
          name: "No disponible: no introduzcas un nombre",
          email: "No disponible: no introduzcas un correo",
          organization: "No disponible: no introduzcas una organización",
          message:
            "La recepción está pausada. No introduzcas ni envíes un mensaje.",
        },
        roleOptions: [
          { value: "educator", label: "Educador" },
          { value: "school-representative", label: "Representante de una escuela u organización" },
          { value: "parent-guardian", label: "Madre, padre o tutor" },
          { value: "researcher", label: "Investigador" },
          { value: "former-partner", label: "Antiguo colaborador" },
          { value: "other-adult", label: "Otro adulto" },
        ],
        topicOptions: [
          { value: "support", label: "Asistencia con el sitio o una demostración" },
          { value: "account-access", label: "Consulta sobre una cuenta histórica" },
          { value: "curriculum", label: "Información curricular" },
          { value: "resources", label: "Solicitud de recursos" },
          { value: "research", label: "Investigación o evidencia" },
          { value: "accessibility", label: "Comentarios de accesibilidad" },
          { value: "collaboration", label: "Acceso o colaboración futura" },
          { value: "project-history", label: "Historia del proyecto" },
        ],
        submitLabel: "Contacto no disponible",
        submittingLabel: "Contacto no disponible",
        successTitle: "La recepción de mensajes no está habilitada",
        successMessage:
          "No existe recepción de mensajes autorizada. Esta página no debe recopilar ni enviar información hasta aprobar las puertas de titular, revisión legal y credenciales de producción.",
        errorTitle: "La recepción de contactos está pausada",
        errorMessage:
          "No se recopiló ni envió nada. No lo intentes de nuevo con información personal; consulta más adelante esta página de estado para encontrar una opción expresamente autorizada.",
        validation: {
          required: "El contacto no está disponible; no introduzcas ni envíes información.",
          invalidEmail: "El contacto no está disponible; no introduzcas un correo.",
          consentRequired: "El contacto no está disponible; no se acepta consentimiento ni envío.",
          messageTooLong: "El contacto no está disponible; no introduzcas un mensaje.",
        },
      },
      privacyWarning: {
        title: "No introduzcas información personal o estudiantil",
        body:
          "Esta página pausada no acepta ningún mensaje. No introduzcas nombre, correo, calificaciones, respuestas de evaluación, discapacidad, fecha de nacimiento, identificador, lista de clase, usuario, contraseña ni expediente educativo. Una futura solicitud con información protegida requeriría un proceso seguro aprobado por separado.",
      },
      studentNote:
        "Estudiantes: usen Nova Tutor solo para ayuda con la lección y pidan a un adulto de confianza que consulte esta página más adelante si el contacto con el proyecto llega a estar expresamente disponible.",
    },
    demos: {
      metadata: {
        title: "Experiencia de aprendizaje",
        description:
          "Abre la experiencia de aprendizaje actual y consulta las fronteras de evidencia separadas de la finalización estricta de la migración.",
      },
      hero: {
        eyebrow: "Experiencia de aprendizaje",
        title: "Hay dos lecciones listas para explorar",
        summary:
          "La lección 3 de cuarto grado, Números negativos, tiene 39 páginas registradas en JavaScript actual y la lección 4 de quinto grado, Rectas numéricas, tiene 54. Ejecutarlas no demuestra fidelidad estricta a Flash, aceptación del audio, aceptación del titular ni publicación del currículo más amplio.",
        primaryAction: { label: "Comenzar la lección", href: "/es/courses/4/3?mode=focus" },
        secondaryAction: { label: "Cómo funciona la restauración", href: "/es/about#preservation" },
      },
      previewNotice: {
        title: "Lecciones funcionales; las puertas estrictas siguen abiertas",
        body:
          "Las 39 páginas de G4 L3 y las 54 páginas de G5 L4 son navegables dentro de la experiencia moderna Mi lección. Esto no establece fidelidad original de ejecución, imagen o audio, revisión humana completa, aceptación del titular, derechos, finalización estricta ni publicación del currículo más amplio.",
      },
      listLabel: "Disponibilidad actual",
      items: [
        {
          id: "g4-l3-negative-numbers",
          title: "Grade 4 Lesson 3: Negative Numbers",
          summary: "Avanza por ocho secciones, repite explicaciones visuales, pide ayuda apropiada para la edad a Nova y continúa desde el progreso guardado localmente.",
          conceptLabel: "Lección",
          concept: "Números negativos y la recta numérica",
          statusLabel: "Muestra ejecutable",
          statusDetail: "Las 39 páginas registradas son navegables dentro de la experiencia moderna Mi lección; las puertas de evidencia estricta y publicación más amplia siguen abiertas.",
          action: { label: "Abrir la lección", href: "/es/courses/4/3?mode=focus" },
        },
        {
          id: "g5-l4-number-lines",
          title: "Grade 5 Lesson 4: Number Lines",
          summary: "Explora rectas numéricas en ocho secciones, utiliza los apoyos, pide a Nova ayuda apropiada para la edad y continúa desde el progreso guardado localmente.",
          conceptLabel: "Lección",
          concept: "Rectas numéricas",
          statusLabel: "Lección funcional en JavaScript actual",
          statusDetail: "Las 54 páginas registradas son navegables dentro de la experiencia moderna Mi lección; las puertas de evidencia estricta y publicación más amplia siguen abiertas.",
          action: { label: "Abrir la lección", href: "/es/courses/5/4?mode=focus" },
        },
      ],
      quality: {
        id: "quality",
        eyebrow: "Antes de publicar una demostración",
        title: "Fuentes, comprobaciones de comportamiento y revisión visual",
        paragraphs: [
          "Cada restauración se revisa frente a las fuentes de autoría y ejecución disponibles. El equipo registra el escenario original, la secuencia, los estados visibles, las interacciones y las excepciones conocidas en lugar de tratar una reproducción aproximada como prueba de fidelidad.",
        ],
        bullets: [
          "Captura determinista de fotogramas clave y comparación visual",
          "Comprobaciones de repetición y teclado",
          "Revisión de diseño adaptable, desbordamiento de texto y movimiento reducido",
          "Comprobaciones de consola, recursos y red",
          "Registro escrito de toda diferencia pendiente",
        ],
      },
      accessibility: {
        title: "¿Necesitas ayuda para usar una demostración?",
        body:
          "Indica la demostración, navegador, dispositivo e interacción que presentó dificultades. No incluyas trabajo estudiantil ni expedientes personales.",
        action: { label: "Enviar comentarios de accesibilidad", href: "/es/contact?topic=accessibility" },
      },
    },
    demoDetails: {
      "conversion-1-2": {
        metadata: {
          title: "Demostración Conversión 1.2",
          description:
            "Ejecuta la restauración JavaScript Conversión 1.2 en fase de revisión, consulta las indicaciones y conoce los límites de esta versión preliminar.",
        },
        eyebrow: "Objeto de aprendizaje restaurado",
        title: "Conversión 1.2",
        summary:
          "Esta reconstrucción nativa del navegador conserva una secuencia explicativa breve del archivo HELP Math mediante tiempos por fotogramas, gráficos vectoriales escalables y repetición determinista.",
        statusLabel: "Candidata de auditoría local",
        statusDetail: "Validación incompleta · Solo auditoría local · Sin recopilación de datos estudiantiles",
        instructionsTitle: "Antes de comenzar",
        instructions: [
          "Observa cómo las etiquetas y los elementos visuales cambian juntos durante la secuencia.",
          "Usa Repetir para volver al primer fotograma y ejecutar la misma secuencia.",
          "Con teclado, mueve el foco al control Repetir y actívalo con Intro o la barra espaciadora.",
        ],
        playerLabel: "Demostración interactiva Conversión 1.2",
        loadingLabel: "Cargando la demostración…",
        unavailableTitle: "No se pudo cargar la demostración",
        unavailableMessage:
          "Actualiza la página una vez. Si sigue sin cargar, informa del navegador, dispositivo y dirección a través de asistencia.",
        replayLabel: "Repetir demostración",
        restartLabel: "Reiniciar desde el principio",
        pauseLabel: "Pausar animación",
        playLabel: "Reproducir animación",
        reducedMotionNote:
          "Si está activado el movimiento reducido, la experiencia puede limitar el movimiento automático y mantener disponibles los estados didácticos.",
        accessibilityTitle: "Notas de acceso",
        accessibilityNotes: [
          "La actividad se adapta dentro de la página y conserva las proporciones del escenario original.",
          "Los controles visibles admiten foco y activación mediante teclado.",
          "El texto importante forma parte de la experiencia moderna y no de una superficie de complemento.",
        ],
        disclaimerTitle: "Límites de la demostración",
        disclaimer:
          "Es un objeto de aprendizaje restaurado, no una lección, curso, evaluación ni afirmación actual de eficacia. No guarda respuestas, puntuaciones ni progreso. El material Flash original se conserva de forma privada como evidencia y no se sirve a visitantes.",
        backAction: { label: "Volver a todas las demostraciones", href: "/es/demos" },
        supportAction: { label: "Informar de un problema", href: "/es/contact?topic=support" },
      },
      "conversion-1-4": {
        metadata: {
          title: "Demostración Conversión 1.4",
          description:
            "Ejecuta la restauración JavaScript Conversión 1.4, consulta las indicaciones y conoce los límites de esta versión preliminar.",
        },
        eyebrow: "Objeto de aprendizaje restaurado",
        title: "Conversión 1.4",
        summary:
          "Este segundo ejemplo nativo del navegador muestra cómo el proyecto traduce movimiento didáctico, etiquetas y tiempos a JavaScript sostenible.",
        statusLabel: "Candidata de auditoría local",
        statusDetail: "Validación incompleta · Solo auditoría local · Sin recopilación de datos estudiantiles",
        instructionsTitle: "Antes de comenzar",
        instructions: [
          "Sigue la secuencia desde el estado inicial hasta el estado explicativo final.",
          "Usa Repetir para reiniciar la actividad cuando termine.",
          "Con teclado, mueve el foco al control Repetir y actívalo con Intro o la barra espaciadora.",
        ],
        playerLabel: "Demostración interactiva Conversión 1.4",
        loadingLabel: "Cargando la demostración…",
        unavailableTitle: "No se pudo cargar la demostración",
        unavailableMessage:
          "Actualiza la página una vez. Si sigue sin cargar, informa del navegador, dispositivo y dirección a través de asistencia.",
        replayLabel: "Repetir demostración",
        restartLabel: "Reiniciar desde el principio",
        pauseLabel: "Pausar animación",
        playLabel: "Reproducir animación",
        reducedMotionNote:
          "Si está activado el movimiento reducido, la experiencia puede limitar el movimiento automático y mantener disponibles los estados didácticos.",
        accessibilityTitle: "Notas de acceso",
        accessibilityNotes: [
          "La actividad mantiene sus proporciones previstas en distintos tamaños de página.",
          "Los controles visibles admiten foco y activación mediante teclado.",
          "El texto y los controles los presenta la página moderna, no un complemento obsoleto.",
        ],
        disclaimerTitle: "Límites de la demostración",
        disclaimer:
          "Es un objeto de aprendizaje restaurado, no una lección, curso, evaluación ni afirmación actual de eficacia. No guarda respuestas, puntuaciones ni progreso. El material Flash original se conserva de forma privada como evidencia y no se sirve a visitantes.",
        backAction: { label: "Volver a todas las demostraciones", href: "/es/demos" },
        supportAction: { label: "Informar de un problema", href: "/es/contact?topic=support" },
      },
    },
    privacy: {
      metadata: {
        title: "Borrador del aviso de privacidad",
        description:
          "Consulta el borrador que explica cómo HELP Math gestiona el estado local de la lección, los eventos seudónimos, las solicitudes a Nova Tutor, el contacto pausado y datos técnicos limitados.",
      },
      hero: {
        eyebrow: "Borrador del aviso de privacidad",
        title: "Una experiencia educativa diseñada para saber menos sobre ti",
        summary:
          "Puedes usar la lección 3 de cuarto grado y la lección 4 de quinto grado, ambas en JavaScript actual, sin cuenta, nombre, correo electrónico, escuela, clase, pago ni perfil docente. Este aviso explica qué permanece en tu navegador, qué se envía al almacén de registros de aprendizaje y qué necesita Nova Tutor cuando pides ayuda.",
      },
      effectiveDateLabel: "Última actualización",
      effectiveDate: "16 de agosto de 2026",
      reviewNotice:
        "BORRADOR — Requiere revisión del titular y asesoría legal antes de publicarse. Describe el diseño técnico actual; no es una determinación legal ni garantiza el cumplimiento de FERPA, COPPA u otra normativa.",
      sections: [
        {
          id: "scope",
          title: "1. Alcance",
          paragraphs: [
            "Este aviso se aplica a helpmath.ai, incluidas sus páginas informativas, las dos lecciones funcionales en JavaScript actual —la lección 3 de cuarto grado, Números negativos, y la lección 4 de quinto grado, Rectas numéricas—, Nova Tutor, el registro de eventos de aprendizaje y la página actual de estado del contacto.",
            "La experiencia educativa actual no tiene cuentas de estudiantes o docentes ni pide el nombre, correo, escuela, clase, pago o perfil docente del estudiante. No autentica al estudiante ni conecta la actividad de la lección con un expediente escolar.",
          ],
        },
        {
          id: "browser-storage",
          title: "2. Lo que permanece en tu navegador",
          paragraphs: [
            "La lección guarda en localStorage de tu dispositivo la página actual, las listas de páginas visitadas y completadas, el idioma de la interfaz, los recuentos de repeticiones y la barra de progreso derivada de ese estado. Así el mismo navegador puede continuar la lección, pero no es una cuenta ni un historial de progreso en la nube y puede desaparecer si borras los datos del navegador.",
            "Un UUID aleatorio de sesión para eventos y un contador de secuencia se guardan solo en sessionStorage durante la sesión de la pestaña actual. No son una cuenta nominal del estudiante y se eliminan cuando se borra ese almacenamiento de sesión.",
            "Si la entrega de eventos no está disponible temporalmente, una bandeja de salida en localStorage puede conservar como máximo 200 eventos de formato cerrado. Los siete días son el periodo válido para reintentos: al volver a cargar la aplicación, los registros más antiguos se ignoran y se eliminan de localStorage. Si no vuelves a abrir la aplicación, sus bytes serializados pueden permanecer físicamente más de siete días hasta que el navegador o la persona usuaria borre los datos del sitio. La bandeja no guarda conversaciones de Nova, respuestas de texto libre, grabaciones de voz, fotos ni imágenes de la lección.",
          ],
        },
        {
          id: "learning-events",
          title: "3. Eventos de aprendizaje seudónimos",
          paragraphs: [
            "La plataforma envía un registro xAPI limitado mediante una API de HELP Math del mismo origen a Learning Locker, un almacén de registros de aprendizaje (LRS). El reproductor actual emite eventos del ciclo de la lección, vistas y finalización de páginas y uso de herramientas de apoyo. Sirven para comprobar el funcionamiento y entender el recorrido de aprendizaje sin preguntar quién eres.",
            "Cuando se entregan eventos, el servidor guarda una semilla aleatoria en la cookie hm_lrs_anon_v1. La cookie es HttpOnly y SameSite=Strict, añade Secure en HTTPS de producción y tiene una duración máxima de 180 días, salvo que el navegador o la persona usuaria la elimine antes. El servidor combina esa semilla con un secreto HMAC del servidor para producir un identificador de cuenta seudónimo y unidireccional para el Actor. Los eventos no incluyen nombre ni correo. Borrar la cookie restablece la semilla y asigna a eventos posteriores un nuevo identificador seudónimo, pero no borra los eventos ya entregados al LRS. Un identificador seudónimo no es una cuenta nominal y, en algunos lugares, aún puede considerarse dato personal.",
          ],
          bullets: [
            "Los eventos no contienen preguntas ni respuestas de Nova Tutor, respuestas de texto libre, voz sin procesar, fotos ni capturas de la lección.",
            "Los reproductores actuales de la lección 3 de cuarto grado y la lección 4 de quinto grado no emiten eventos con resultados de ejercicios. Si más adelante se habilita una integración compatible de resultados cerrados, su contrato solo permitirá campos autorizados como resultado, número de intento y página de la lección; este aviso deberá revisarse antes del lanzamiento.",
            "Actualmente la plataforma no convierte estos eventos en panel docente, calificación, resultado de ubicación ni decisión educativa automatizada.",
          ],
        },
        {
          id: "nova",
          title: "4. Nova Tutor y entrada por voz",
          paragraphs: [
            "Cuando pides ayuda a Nova Tutor, el texto que escribes —o la transcripción generada por la función de reconocimiento de voz del navegador— se envía mediante el servidor de HELP Math del mismo origen a OpenRouter para el modelo exacto GPT-5.6 Luna. Si eliges activamente adjuntar la imagen actual del curso, se incluye esa imagen de la lección para que Nova pueda comentar lo que aparece en pantalla.",
            "HELP Math exige un punto final de retención cero de datos, rechaza la recopilación de datos por el proveedor en cada solicitud de Nova y no conserva la conversación en la plataforma. El audio original del micrófono no se envía a HELP Math y el acceso a la cámara del dispositivo está desactivado; la imagen adjunta procede únicamente de la lección que ya muestra el navegador.",
            "Tu navegador, sistema operativo o proveedor de reconocimiento de voz puede procesar el audio según sus propios términos antes de devolver una transcripción. OpenRouter y el proveedor del modelo enrutado pueden procesar metadatos de la solicitud o señales de seguridad según los términos aplicables aunque HELP Math solicite retención cero de datos. Evita decir o escribir información personal o sensible.",
          ],
        },
        {
          id: "contact-and-technical",
          title: "5. Información de contacto y técnica",
          paragraphs: [
            "La experiencia educativa no pide tu nombre ni correo. La página de contacto es actualmente una página de estado: no acepta, recopila, verifica ni envía nombre, correo, organización, función, tema o mensaje. No introduzcas información. Un futuro flujo para adultos solo podrá procesar esos campos tras documentar la autorización del titular, la revisión legal, la autorización de credenciales de producción y una revisión actualizada de privacidad.",
            "Vercel y servicios de red relacionados pueden procesar datos técnicos limitados necesarios para entregar y proteger el sitio, como hora, página, navegador o dispositivo, ubicación aproximada de red y dirección IP. El flujo de contacto actualmente pausado no usa Cloudflare Turnstile ni Resend. Si se autoriza y configura expresamente un futuro flujo para adultos, Turnstile puede procesar señales contra el abuso y Resend puede entregar el mensaje; ninguno es necesario para el uso ordinario de la experiencia educativa.",
          ],
        },
        {
          id: "student-data",
          title: "6. Información estudiantil y sensible",
          paragraphs: [
            "No incluyas nombres, correos, escuela o clase, calificaciones, discapacidad, fecha de nacimiento, identificadores, credenciales, expedientes educativos ni otra información sensible en Nova Tutor o la página de contacto pausada.",
            "El sitio no ofrece actualmente un canal para solicitudes de contacto. Si se autoriza más adelante, el alumnado deberá pedir ayuda a un docente, padre, madre, tutor u otro adulto de confianza. Toda solicitud escolar legítima que requiera información protegida seguirá necesitando un proceso seguro separado y revisado.",
          ],
        },
        {
          id: "providers",
          title: "7. Proveedores y divulgación",
          paragraphs: [
            "El candidato actual de la plataforma usa Vercel para alojar el sitio, Learning Locker para el LRS xAPI y OpenRouter más un proveedor de modelo enrutado elegible para Nova Tutor. El contacto pausado no usa actualmente Cloudflare Turnstile ni Resend. Un futuro flujo para adultos solo podrá usarlos tras documentar la autorización del titular, la revisión legal y la autorización de credenciales de producción. Cada proveedor habilitado puede procesar datos según sus propios términos y periodos configurados de conservación.",
            "El diseño técnico actual no incluye la venta de información personal. El titular y quien realice la revisión legal deben confirmar esa afirmación frente a las operaciones reales antes de publicarla. La información puede divulgarse cuando sea necesario para operar o proteger el servicio, prestar asistencia, cumplir la ley o completar una transición organizativa con salvaguardas adecuadas.",
          ],
        },
        {
          id: "retention-security",
          title: "8. Conservación y seguridad",
          paragraphs: [
            "El estado local de la lección permanece hasta que lo borras o el navegador lo elimina. El UUID de sesión para eventos y el contador de secuencia permanecen solo durante la sesión de la pestaña actual. Los eventos en espera pueden reintentarse durante siete días y se eliminan cuando la aplicación vuelve a cargarse después de ese periodo; si nunca vuelves a abrirla, los registros serializados vencidos pueden permanecer en localStorage hasta que se borren los datos del sitio.",
            "La cookie con la semilla del Actor seudónimo tiene una duración máxima de 180 días. Borrarla restablece el identificador utilizado para eventos futuros. Los eventos entregados siguen el periodo configurado por el operador del LRS. La página de contacto pausada no crea mensajes que conservar. Si se autoriza más adelante un flujo para adultos, su aviso revisado deberá indicar los periodos de conservación del mensaje y de los proveedores; los registros de alojamiento y de otros proveedores habilitados siguen sus periodos correspondientes.",
            "Usamos medidas como API del mismo origen, credenciales restringidas en el servidor, un Actor seudónimo unidireccional y campos cerrados para eventos. Ningún almacenamiento del navegador, formulario o transmisión por internet puede garantizarse como completamente seguro.",
          ],
        },
        {
          id: "choices",
          title: "9. Tus opciones",
          paragraphs: [
            "Puedes leer las páginas públicas sin iniciar la lección, usar Nova, activar el reconocimiento de voz, adjuntar una imagen del curso ni introducir nada en la página de contacto pausada. Los controles de datos del sitio del navegador pueden borrar el progreso y los eventos en espera de localStorage, los identificadores de sessionStorage y la cookie hm_lrs_anon_v1. Borrar la cookie restablece el identificador seudónimo de eventos futuros, pero borrar los datos del navegador no elimina los eventos ya entregados al LRS.",
            "El sitio no ofrece actualmente un canal para solicitar acceso, corrección o eliminación de un registro seudónimo. Si se habilita más adelante un canal autorizado para adultos, el aviso revisado deberá explicar cómo presentar la solicitud y cómo se comprobarán la identidad, la ley y los límites del sistema.",
          ],
        },
        {
          id: "international-changes",
          title: "10. Visitantes internacionales y cambios",
          paragraphs: [
            "Nuestros proveedores pueden procesar información en Estados Unidos y otros lugares. Los derechos y requisitos de transferencia varían por ubicación.",
            "Actualizaremos la fecha y este aviso antes de introducir prácticas sustancialmente distintas, incluidas cuentas, perfiles nominales, listas escolares, pagos, paneles docentes o nuevos proveedores y flujos de datos.",
          ],
        },
      ],
      contact: {
        title: "Canal de solicitudes de privacidad no disponible",
        body:
          "La página de contacto solo muestra el estado de disponibilidad y no recopila ni envía solicitudes de privacidad. No introduzcas allí nombres de estudiantes, expedientes escolares, conversaciones con Nova ni otra información.",
        action: { label: "Consultar disponibilidad de contacto", href: "/es/contact?topic=privacy" },
      },
    },
    terms: {
      metadata: {
        title: "Borrador de los términos de uso",
        description:
          "Consulta el borrador no aprobado de los términos propuestos para HELP Math, sus lecciones en JavaScript actual de cuarto y quinto grado, Nova Tutor y el contenido relacionado.",
      },
      hero: {
        eyebrow: "Borrador de los términos de uso",
        title: "Utiliza responsablemente las experiencias educativas",
        summary:
          "Este borrador describe los términos propuestos para el sitio y sus dos lecciones funcionales en JavaScript actual: la lección 3 de cuarto grado y la lección 4 de quinto grado. Hasta que queden documentadas la aprobación del titular y la revisión legal y se publique una versión final, no constituye contrato, no obliga a quien lo visita ni concede licencia.",
      },
      effectiveDateLabel: "Última actualización",
      effectiveDate: "16 de agosto de 2026",
      reviewNotice:
        "BORRADOR — Requiere revisión del titular y asesoría legal antes de publicarse. Deben confirmarse la entidad responsable, jurisdicción, dirección de contacto, términos de proveedores, condiciones para menores y cualquier licencia específica. Hasta documentar esas aprobaciones, este borrador solo sirve como información para revisión: no constituye contrato, no obliga a quien lo visita ni concede licencia. No garantiza el cumplimiento de FERPA, COPPA u otra normativa.",
      sections: [
        {
          id: "acceptance",
          title: "1. Estado del borrador y requisitos",
          paragraphs: [
            "Este documento se ofrece para revisión del titular y asesoría legal. Antes de documentar esas aprobaciones y publicar una versión final, visitar el candidato no supone aceptar este borrador y el borrador no concede permiso ni licencia.",
            "La recepción de contactos no está disponible actualmente. Si se autoriza más adelante un flujo para adultos, deberá seguir dirigido a adultos y el alumnado deberá pedir ayuda a un docente, padre, madre, tutor u otro adulto de confianza.",
          ],
        },
        {
          id: "service",
          title: "2. Qué ofrece este sitio",
          paragraphs: [
            "El sitio ofrece dos lecciones funcionales en JavaScript actual dentro de la experiencia moderna Mi lección: la lección 3 de cuarto grado, Números negativos, con 39 páginas registradas, y la lección 4 de quinto grado, Rectas numéricas, con 54 páginas registradas.",
            "Que las lecciones estén disponibles no demuestra finalización estricta de la migración, fidelidad al Flash original en ejecución o imagen, fidelidad del audio, aceptación humana o del titular, autorización de derechos ni publicación del currículo histórico restaurado. Son puertas de evidencia y publicación independientes.",
            "Actualmente no ofrece matrículas, cuentas nominales de estudiantes o docentes, escuelas, clases, tareas, paneles docentes, calificaciones oficiales, pagos ni acceso garantizado al programa histórico.",
          ],
        },
        {
          id: "progress-and-events",
          title: "3. Progreso y eventos de aprendizaje",
          paragraphs: [
            "El progreso se guarda en el navegador actual y no constituye certificado, calificación, expediente escolar ni historial de cuenta entre dispositivos. Borrar los datos del navegador puede restablecerlo.",
            "El sitio envía a un LRS de Learning Locker eventos xAPI seudónimos del ciclo de la lección, vistas y finalización de páginas y uso de herramientas de apoyo. El reproductor actual no emite resultados de ejercicios. Los eventos no incluyen nombres, correos, conversaciones con Nova, respuestas de texto libre, voz original, fotos ni imágenes de la lección. Consulta el Aviso de privacidad para conocer detalles y opciones.",
          ],
        },
        {
          id: "nova",
          title: "4. Nova Tutor",
          paragraphs: [
            "Nova Tutor usa OpenRouter para solicitar el modelo exacto GPT-5.6 Luna y responder solicitudes de aprendizaje matemático. Las respuestas de IA pueden ser incompletas o incorrectas y no constituyen calificación oficial, diagnóstico, decisión de ubicación ni sustituyen a un docente o adulto de confianza.",
            "Envía solo la información necesaria para la pregunta matemática. El reconocimiento de voz del navegador puede convertir tu voz en texto y puedes adjuntar activamente la imagen actual de la lección; la cámara del dispositivo está desactivada. No envíes nombres, datos de contacto, expedientes, contraseñas, información médica ni otro material sensible.",
          ],
        },
        {
          id: "acceptable-use",
          title: "5. Límites para una revisión segura",
          paragraphs: [
            "Este borrador no concede permiso ni licencia. Hasta que se apruebe y publique una versión final revisada, el acceso al candidato protegido se limita a la autorización de revisión mediante la cual se concedió el acceso; cualquier uso más amplio para aprendizaje, aula, copia, redistribución o publicación requiere derechos confirmados por separado o permiso escrito de un titular autorizado.",
          ],
          bullets: [
            "No interfieras con el sitio, eludas medidas de seguridad o acceso ni sobrecargues los servicios.",
            "No uses sistemas automatizados para extraer, copiar o redistribuir a gran escala el archivo o las demostraciones sin permiso escrito.",
            "No cargues código malicioso, suplantes a alguien, investigues credenciales de proveedores ni uses Nova o cualquier futuro flujo de contacto para abuso, correo basura o actividades ilícitas.",
            "No envíes expedientes, contraseñas, información identificativa ni otro material sensible de otra persona.",
          ],
        },
        {
          id: "intellectual-property",
          title: "6. Propiedad intelectual y material histórico",
          paragraphs: [
            "El sitio, nombre del proyecto, demostraciones, textos, imágenes, fuentes y otros contenidos pueden estar protegidos por derechos de autor, marcas, contratos u otros derechos. Visualizar el candidato protegido no transfiere titularidad ni concede derecho a republicar, vender, modificar, extraer, enseñar con el contenido ni crear un archivo competidor.",
            "Los nombres y materiales históricos pueden reflejar derechos de sus respectivos titulares. La evaluación en el aula o cualquier uso que exceda la revisión específicamente autorizada del candidato requiere permiso confirmado por separado de un titular autorizado.",
          ],
        },
        {
          id: "educational-use",
          title: "7. Contexto educativo",
          paragraphs: [
            "La lección 3 de cuarto grado y la lección 4 de quinto grado son experiencias educativas en JavaScript actual, no un currículo publicado completo, instrumento diagnóstico validado, intervención individualizada ni sustituto del criterio docente.",
            "Las descripciones históricas de investigación, premios, alineación, alcance o funciones se identifican como contexto archivado salvo que el sitio afirme expresamente una verificación actual.",
          ],
        },
        {
          id: "availability",
          title: "8. Disponibilidad y cambios",
          paragraphs: [
            "El proyecto puede añadir, revisar, pausar o retirar contenido, una lección, Nova Tutor o los servicios de eventos mientras revisa fuentes, derechos, precisión, seguridad, accesibilidad y disponibilidad de proveedores. No prometemos que un recurso, cuenta o función histórica llegue a estar disponible.",
          ],
        },
        {
          id: "links",
          title: "9. Servicios y enlaces de terceros",
          paragraphs: [
            "El candidato de la plataforma depende de Vercel, Learning Locker, OpenRouter y un proveedor de modelo enrutado elegible. Si se configura el flujo separado de contacto para adultos, también puede usar Cloudflare y Resend. Los términos y prácticas de privacidad aplicables de cada proveedor habilitado rigen sus servicios; un enlace no significa que HELP Math respalde todo su contenido.",
          ],
        },
        {
          id: "disclaimer",
          title: "10. Descargos y responsabilidad",
          paragraphs: [
            "El candidato protegido está disponible para revisión técnica, del titular y legal, sin promesa de ingeniería de que funcione sin interrupciones o errores, esté completo o sea adecuado para una decisión didáctica. Este borrador no aprobado no renuncia ni limita derechos u obligaciones legales de quienes visitan u operan el sitio.",
            "Durante una revisión autorizada, utiliza el candidato de forma lícita, adecuada a la edad y coherente con las políticas de tu escuela u organización.",
          ],
        },
        {
          id: "changes",
          title: "11. Cambios en estos términos",
          paragraphs: [
            "Este borrador puede cambiar durante la revisión del titular y legal. Una versión final, si se aprueba, deberá mostrar su fecha de vigencia. Servicios sustancialmente distintos —cuentas, listas escolares, suscripciones, pagos, paneles docentes o tratamiento de datos nominales de estudiantes— requieren términos e información de privacidad revisados y aprobados antes de su lanzamiento.",
          ],
        },
      ],
      contact: {
        title: "El contacto para permisos no está disponible",
        body:
          "Este borrador no concede permiso y el sitio no acepta actualmente solicitudes de permiso. El enlace solo muestra la disponibilidad de contacto; no introduzcas información. Todo futuro canal para adultos requiere autorización documentada del titular, revisión legal y autorización de credenciales de producción.",
        action: { label: "Consultar disponibilidad de contacto", href: "/es/contact?topic=permissions" },
      },
    },
  },
} satisfies SiteContent;
