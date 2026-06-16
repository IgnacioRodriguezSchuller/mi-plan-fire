// Contenido editorial — extraído byte-a-byte de mi_plan_v1_5_0a_3.html.
// Etapa 1 · Paso 3 · Tanda 5. Solo se añade `export`; texto íntegro, sin
// recortes (verificado deep-equal en scripts/verify-content.mjs):
//   LEARN_CORPUS   (corpus de conceptos, L182-584)
//   CATEGORY_LABELS (L638)
//   TABLON         (corpus de lecciones del tablón, L586)

export const LEARN_CORPUS = {
  'interes-compuesto': {
    title: 'Interés compuesto',
    category: 'matematica',
    short: 'El motor que convierte el ahorro en patrimonio. Aporta poco pero pronto.',
    tooltip: 'Es ganar intereses sobre los intereses que ya generaste. Si tienes 12.000€ al 7%, el primer año ganas 840€. El segundo ganas 899€, porque ya hay 12.840€ trabajando. A 30 años pone la mayor parte de tu patrimonio final.',
    glossary: 'Es la mecánica por la que el dinero invertido genera rendimientos, y esos rendimientos a su vez generan más rendimientos. No crece de forma lineal sino exponencial.\n\nCuando inviertes 100€ al 7% anual, al final del primer año tienes 107€. Pero al final del segundo no tienes 114€, tienes 114,49€. Esos 49 céntimos extra son interés sobre el interés. A diez años, esos 100€ se convierten en 197€. A treinta, en 761€.\n\nSi aportas 100€ todos los meses durante treinta años, terminas con más de 122.000€, de los que solo 36.000€ los aportaste tú. El resto, 86.000€, lo puso el interés compuesto.\n\nEsta es la razón por la que empezar pronto importa más que empezar con mucho.',
    article: {
      heading: 'La única magia matemática',
      lesson: 'Tu mayor decisión financiera no es cuánto ahorras. Es cuándo empiezas.',
      rule: 'Aporta poco pero antes, en lugar de mucho pero más tarde. La matemática no perdona los años perdidos.',
      warning: 'La bola de nieve solo funciona si nunca la tocas. Cada vez que retiras dinero antes de tiempo, no estás sacando solo lo que sacas: estás sacando todo lo que ese dinero habría generado durante el resto de tu vida.',
      body: 'Hay una idea que distingue a quien construye patrimonio de quien solo ahorra. No es la disciplina, aunque ayuda. No es el sueldo, aunque también ayuda. Es entender el interés compuesto.\n\n**Qué es**\n\nEs lo que ocurre cuando los rendimientos que genera tu dinero se reinvierten y a su vez empiezan a generar más rendimientos. Es la diferencia entre crecimiento lineal y exponencial.\n\nPongamos 1.000€ invertidos al 7% anual. Sin compuesto, cada año ganarías 70€ fijos: a los 30 años tendrías 3.100€. Con compuesto, los 70€ del primer año se quedan dentro y empiezan a generar sus propios intereses. A los 30 años no tienes 3.100€, tienes 7.612€. La diferencia, 4.512€, la pone el compuesto.\n\n**En tu caso**\n\nMira tu pantalla principal. La cifra que ves a la edad de retiro tiene dos componentes: lo que tú habrás aportado a lo largo de los años, y lo que el interés compuesto pondrá por encima. En la mayoría de planes razonables, el compuesto pone más de la mitad. En planes con horizonte muy largo, puede poner el 70% u 80%.\n\n**Tres factores que lo mueven todo**\n\nPor orden de impacto: el *tiempo* (exponencial sobre los años — diez años de ventaja valen más que doblar la aportación los últimos diez), la *rentabilidad* (un punto porcentual extra al año cambia el resultado un 30% a 30 años vista), y la *aportación* (importa, pero menos de lo que la gente cree).\n\n**Lo que no te cuentan**\n\nEl compuesto solo es bonito a largo plazo. En el corto, las inversiones suben y bajan. Una caída del 40% en un mal año no es un mal augurio del cálculo: es el coste normal de obtener un 7-8% a 30 años. La gente que rompe con el compounding lo hace cuando vende en pánico durante esas caídas.\n\n**Lo que esto cambia en tu plan**\n\nEmpezar hoy, aunque sea con 50€/mes. Vigilar las comisiones. Y entender que el siguiente paso es saber dónde poner el dinero para que rinda — la cuenta corriente no lo hace.',
    },
    seeAlso: ['retorno-anual', 'comisiones', 'horizonte', 'aporte-mensual'],
  },

  'retorno-anual': {
    title: 'Retorno anual',
    category: 'matematica',
    short: 'Lo que tu dinero crece de media cada año si está bien invertido.',
    tooltip: 'Una cartera 100% bolsa global ha dado históricamente 5-7% real (descontada inflación), o 7-9% nominal. Mi Plan FIRE usa 8% nominal por defecto. Atención: si tu dinero está en cuenta corriente, no obtienes este retorno. Para obtenerlo hay que invertir.',
    glossary: 'La rentabilidad media que tu dinero invertido genera cada año. Es el motor que mueve el interés compuesto.\n\nHay dos formas de expresarlo: nominal (la cifra bruta) y real (después de descontar inflación). Si la bolsa rinde 8% nominal con 3% de inflación, el retorno real es ~5%.\n\nDatos históricos a largo plazo (50+ años) para la bolsa mundial: ~7% real anual, con desviaciones grandes año a año. Renta fija de calidad: 2-4% real. Cuenta corriente: 0-1% real, a menudo negativo tras inflación.\n\nMi Plan FIRE usa 8% nominal por defecto. Si pones el dinero en cuenta corriente, la proyección es ficción. Solo se cumple si tu dinero está invertido de forma que pueda alcanzarlo.',
    article: {
      heading: 'El número que lo cambia todo',
      lesson: 'El retorno medio del 7-8% no es lo que ves cada año. Es lo que queda cuando llevas muchos años aguantando lo que pasa cada año.',
      rule: 'Busca un producto con rentabilidad histórica de 6-8% a largo plazo, comisiones bajas (TER por debajo del 0,3%), bien diversificado y de gestión pasiva. El candidato natural es un fondo indexado a un índice global como el MSCI World.',
      warning: 'Si dejas el retorno al 8% pero tu dinero está en cuenta corriente, Mi Plan FIRE te proyecta un patrimonio que no vas a tener. El número de la app no genera dinero. Lo genera el sitio donde está tu dinero.',
      body: 'Mi Plan FIRE te pregunta una sola cifra en Ajustes que mueve todas las demás: el retorno anual. Por defecto pone 8%. Si lo subes a 10%, tu patrimonio final se dispara. Si lo bajas a 4%, se derrumba. Antes de tocar ese número, entiende qué estás eligiendo.\n\n**De dónde sale el 8%**\n\nEs una estimación basada en lo que históricamente ha rendido una cartera diversificada en renta variable global a largo plazo. La bolsa mundial ha rendido alrededor de un 7% real anual desde 1900. Sumando ~2-2,5% de inflación media, sale el 8-9% nominal.\n\n**Por qué no es lo mismo que un depósito**\n\nUn depósito al 3% te paga 3% sí o sí. Una cartera al 8% medio rinde -30% un año, +25% al siguiente. La cifra que ves es el resultado promediado de muchas idas y venidas.\n\n**Qué valor poner en tu plan**\n\nConservador (4-5% nominal): cartera mixta, horizonte corto, necesitas dormir. Razonable (6-7%): cartera mayoritariamente bolsa global, 20+ años. Optimista (8-9%): 100% bolsa durante décadas. Fantasioso (10%+): irreal a 30 años para un inversor minorista.\n\n**Lo que esto cambia en tu plan**\n\nAntes de cualquier otra cosa: averigua dónde está tu dinero. Si está en cuenta corriente, el retorno por defecto es ficción. El siguiente paso es entender qué es un fondo indexado y cómo evitar las comisiones que destruyen el compounding silenciosamente.',
    },
    seeAlso: ['interes-compuesto', 'inflacion', 'volatilidad', 'fondos-indexados'],
  },

  'inflacion': {
    title: 'Inflación',
    category: 'macro',
    short: 'El ladrón silencioso. Si tu dinero no crece por encima, lo pierdes.',
    tooltip: 'El aumento general de precios con el tiempo. Si la inflación es 2,5% anual, lo que hoy cuesta 1.000€ costará 2.097€ a los 30 años. Si tu dinero está en cuenta corriente, pierdes poder adquisitivo cada año aunque la cifra nominal no caiga.',
    glossary: 'El aumento general y sostenido de los precios. Si una barra de pan cuesta hoy 1€ y la inflación anual es del 3%, dentro de un año costará 1,03€, y dentro de 10 años costará ~1,34€.\n\nLo importante no es el cambio de precios en sí, sino que erosiona el poder adquisitivo de tu dinero. 1.000€ bajo el colchón hoy comprarán mucho menos dentro de 20 años, aunque sigan siendo 1.000€ nominalmente.\n\nEn la zona euro, el BCE se marca como objetivo una inflación cercana al 2%. La media histórica en España ha estado entre 2-3%, con picos puntuales como 2022 (~8%). Mi Plan FIRE usa 2,5% por defecto.\n\nSi tu plan proyecta 500.000€ a los 30 años con 2,5% de inflación, ese dinero comprará lo que ~238.000€ comprarían hoy. La mitad. Por eso Mi Plan FIRE ofrece el modo "Ajustar por inflación".',
    article: {
      heading: 'El ladrón que entra en tu cuenta cada noche',
      lesson: 'Ahorrar no conserva tu dinero. Solo invertir por encima de la inflación lo conserva. Todo lo demás es perderlo lentamente.',
      rule: 'Calcula cuánto dinero tienes ahora mismo en cuentas que rinden por debajo de la inflación. Esa cifra es tu sangrado activo. La conversación importante de esta semana es qué vas a hacer con él.',
      warning: 'Cualquier promesa de "rentabilidad segura" del 2-3% en un año con inflación al 3% es una pérdida real disfrazada de ganancia nominal.',
      body: 'Hay un ladrón que entra en tu cuenta corriente todas las noches mientras duermes. Te roba un poco. Tan poco que ni lo notas en una semana, ni en un mes, ni siquiera en un año. Tu saldo sigue diciendo lo mismo. Pero ese saldo, cada noche, compra un poco menos que la noche anterior.\n\nEl ladrón se llama inflación. Y lleva trabajando en tu contra desde el día en que tuviste dinero.\n\n**Lo que te hace en 10 años**\n\n10.000€ guardados hoy en cuenta corriente, con inflación media del 2,5%, dentro de 10 años seguirán siendo 10.000€. Pero comprarán lo que hoy compran 7.812€. Has perdido 2.188€ sin que nadie te haya robado. Sin que nadie te lo haya dicho. El saldo es el mismo. El poder adquisitivo se ha derretido.\n\n**Lo que te hace en 30 años**\n\nEsos mismos 10.000€ a 30 años con la misma inflación: 4.767€ en poder adquisitivo actual. **Has perdido más de la mitad de tu dinero sin haber gastado un euro.**\n\n**Por qué es más urgente que cualquier otra decisión**\n\nLa mayoría de problemas financieros admiten matices y debate. Este no. La inflación funciona automáticamente, todos los días, sin que tú hagas nada. Es la única ley financiera que no necesita tu participación para actuar contra ti. Y opera con interés compuesto en tu contra.\n\n**Lo que esto cambia en tu plan**\n\nPrimera: si tienes dinero parado en cuenta corriente que no necesitas para los próximos 6-12 meses, **estás perdiendo dinero ahora mismo**. Ahora. Mientras lees esto. Segunda: cualquier asunción de retorno tiene que estar muy por encima de la inflación. Tercera: activa "Ajustar por inflación" para leer cifras realistas.',
    },
    seeAlso: ['retorno-anual', 'patrimonio', 'interes-compuesto'],
  },

  'volatilidad': {
    title: 'Volatilidad y caídas',
    category: 'psicologia',
    short: 'El precio que pagas por los retornos a largo plazo. No es lo mismo que pérdida.',
    tooltip: 'Cuánto sube y baja el valor de tu inversión a lo largo del tiempo. Una cartera 100% bolsa puede caer 30-50% en un mal año aunque a 30 años dé un 7% anual. Quien aguanta sin vender gana el premio del largo plazo.',
    glossary: 'La medida de cuánto fluctúa el valor de una inversión a lo largo del tiempo. La bolsa es volátil, los depósitos casi no.\n\nVolatilidad no es lo mismo que riesgo de perder dinero permanentemente. Una bolsa que cae 40% y luego se recupera en dos años no te ha hecho perder dinero, salvo que hayas vendido en el peor momento.\n\nCifras históricas, bolsa mundial: año medio ±10-15%, año malo (cada 5-7 años) -20-30%, crash mayor (cada 15-20 años) -40-60% con recuperación de 2-5 años. Ejemplos reales: 2000-2002 (-49%), 2008-2009 (-57%), marzo 2020 (-34%). En los tres casos, quien no vendió salió ganando.\n\nLa volatilidad es el precio que pagas por los retornos. Si quieres un 7% real anual, tienes que estar dispuesto a aguantar -40% un mal año.',
    article: {
      heading: 'Lo que nadie te cuenta de invertir',
      lesson: 'La volatilidad no es pérdida. La pérdida es lo que materializas al vender en pánico.',
      rule: 'Las grandes caídas son cuando se construye o se destruye el patrimonio de toda una vida. La diferencia no la hace la información que tienes ese día. La hace lo que decidiste años antes sobre cómo ibas a comportarte cuando llegara.',
      warning: 'Tu cerebro está cableado para venderte mal. Es evolución, no estupidez. Pero saberlo no te protege: te protege diseñar un plan al que no puedas saltar fácilmente cuando llegue el pánico.',
      body: 'Mi Plan FIRE proyecta tu patrimonio creciendo año tras año con una curva suave. Es útil para pensar a largo plazo, pero es una mentira amable. El verdadero recorrido se parece más a esto: dos años buenos, un año plano, un año en el que pierdes 35%, dos años de recuperación, otro año fuerte, otro mal año, etc.\n\n**La volatilidad como peaje**\n\nEl 7-8% real anual no se paga gratis. El precio es la volatilidad. Algunos años verás +25%, otros -30%. La rentabilidad y la volatilidad son las dos caras de la misma moneda. No existe rentabilidad alta y estable de forma consistente; quien promete eso, miente o asume un riesgo oculto.\n\n**El gran ejemplo: 2008**\n\nEntre octubre de 2007 y marzo de 2009, la bolsa mundial cayó alrededor del 57%. Una persona con 100.000€ vio cómo se convertían en 43.000€ en 18 meses. La mitad vendió. La otra mitad siguió aportando. A día de hoy, la que aguantó tiene varias veces más patrimonio del que tenía antes de la caída. La que vendió materializó la pérdida y muchas veces no volvió a invertir nunca.\n\n**Cómo prepararse**\n\nSaberlo de antemano. Diversificar. No mirar a corto plazo. La gente que revisa su cartera todos los días sufre. La que mira una vez al trimestre o al año duerme mejor y termina con más dinero.',
    },
    seeAlso: ['riesgo-incertidumbre', 'asset-allocation', 'secuencia-retornos'],
  },

  'riesgo-incertidumbre': {
    title: 'Riesgo vs incertidumbre',
    category: 'psicologia',
    short: 'Riesgo es lo que se puede medir. Incertidumbre es lo que no.',
    tooltip: 'Riesgo es lo cuantificable: conoces los escenarios posibles y puedes asignarles probabilidades. Incertidumbre es lo que escapa al modelo: situaciones genuinamente nuevas. Mi Plan FIRE trabaja con riesgo. Por eso ningún plan a 30 años es predicción: es apuesta razonada.',
    glossary: 'Dos conceptos que la gente confunde y que tienen implicaciones muy distintas.\n\nEl riesgo es cuantificable. Conoces los escenarios posibles y puedes asignarles probabilidades. Tirar una moneda es riesgo. Invertir en una cartera diversificada a 30 años es, mayoritariamente, riesgo medible.\n\nLa incertidumbre es lo que no puedes cuantificar. ¿Y si en 2034 hay una guerra global? ¿Y si una innovación tecnológica transforma la economía? ¿Y si cambia radicalmente la fiscalidad? Son escenarios reales pero no asignables a una probabilidad fiable.\n\nMi Plan FIRE trabaja con riesgo. No puede modelar incertidumbre verdadera. Por eso ninguna proyección a 30 años es predicción: es apuesta razonada con la información disponible hoy.\n\nLa conclusión no es paralizante: no hace falta un plan perfecto, hace falta uno suficientemente bueno, revisado cada cierto tiempo, con margen para sorpresas. La perfección no existe. La robustez sí.',
    article: {
      heading: 'Lo que se puede saber y lo que no',
      lesson: 'La perfección no existe en planificación financiera. La robustez sí. Un plan no tiene que prever el futuro: tiene que sobrevivir a varios futuros posibles.',
      rule: 'Un plan no se hace para no fallar. Se hace para sobrevivir a varios escenarios y poder corregir cuando uno se equivoca.',
      warning: 'El error más caro de la planificación financiera no es elegir mal el fondo, ni equivocarse con el retorno asumido. Es romper la bola de nieve para comprar algo que se podía haber pagado de otra manera.',
      body: 'Mi Plan FIRE calcula tu patrimonio a 30 años con cifras precisas: 487.342€, 612.180€, 1.245.700€. Esa precisión es útil pero engaña sobre la naturaleza del cálculo.\n\n**El riesgo es medible**\n\nEn 1921, el economista Frank Knight definió el riesgo como una situación donde conoces todos los resultados posibles y puedes asignarles probabilidades. Las herramientas como Monte Carlo son el ejercicio matemático de medir riesgo.\n\n**La incertidumbre es lo que escapa al modelo**\n\nEs lo que no puede cuantificarse: situaciones genuinamente nuevas. No es imposible; es que no tienes base histórica suficiente para asignar probabilidades.\n\n**Cómo se construye un plan robusto**\n\nDiversificar (no poner todo en un activo). Margen de seguridad (apuntar más alto del mínimo necesario). Revisión periódica (no es planearlo y olvidarlo). Y la más difícil: no tocar la bola de nieve. La gente, al ver patrimonio acumulado, lo gasta. Cada euro retirado antes de tiempo no es solo ese euro: es todo lo que ese euro habría generado durante el resto de tu vida.',
    },
    seeAlso: ['volatilidad', 'monte-carlo', 'secuencia-retornos'],
  },

  'regla-4': {
    title: 'Regla del 4%',
    category: 'fire',
    short: '25 veces tu gasto anual es la cifra de libertad financiera.',
    tooltip: 'Si tu patrimonio es X, puedes retirar el 4% al año (X dividido entre 25) sin que se acabe en una jubilación de 30 años, según el estudio Trinity de 1998. No es una ley física: funcionó en la mayoría de escenarios históricos, no en todos.',
    glossary: 'Una guía empírica para calcular cuánto patrimonio necesitas acumular si quieres vivir de él en el retiro: tu patrimonio multiplicado por 4% es lo que puedes retirar al año sin que se agote.\n\nOrigen: estudio publicado en 1998 por tres profesores de la Trinity University de Texas. Analizaron carteras mixtas sobre datos históricos de la bolsa americana desde 1925, simulando jubilaciones de 30 años. Una tasa del 4% sobrevivió en la práctica totalidad de los escenarios.\n\nAplicado a tu plan: si quieres vivir con 24.000€/año (2.000€/mes), necesitas 600.000€ (24.000 × 25). Si quieres 36.000€/año, necesitas 900.000€.\n\nLo que la regla no dice: que sea garantía. Es estadística histórica de un solo mercado en una época concreta. Hay escenarios futuros plausibles donde fallaría.',
    article: {
      heading: 'La regla que cambió cómo se piensa la jubilación',
      lesson: 'La libertad financiera no es un sueldo grande. Es 25 veces el gasto anual que necesitas para vivir bien. La aritmética es la misma para todos.',
      rule: 'Calcula tu número una sola vez. Revísalo cuando cambie tu estilo de vida esperado. No lo cambies cuando cambie el mercado: ese juego psicológico lo pierde casi todo el mundo.',
      warning: 'Si te retiras justo antes de una caída del 40%, los primeros retiros son devastadores para el largo plazo. Es el principal riesgo que la regla del 4% no captura bien: se llama secuencia de retornos.',
      body: 'Durante décadas, la pregunta "¿cuánto necesito para jubilarme?" tuvo una respuesta torpe: "depende, habla con tu asesor". En 1998, tres profesores de la Trinity University publicaron un estudio que convirtió esa pregunta en aritmética. Lo llamaron multiplicar tu gasto anual por 25.\n\n**La idea**\n\nPara vivir indefinidamente de tu patrimonio invertido sin agotarlo, necesitas acumular 25 veces tu gasto anual. Eso equivale a poder retirar el 4% anual del total.\n\n¿Quieres vivir con 30.000€/año? Necesitas 750.000€. ¿Con 48.000€/año? 1.200.000€. ¿Con 18.000€/año (vida modesta)? 450.000€.\n\n**El detalle que casi nadie ve**\n\nLa regla del 4% no se aplica sobre tu gasto actual, se aplica sobre el gasto que tendrás cuando te jubiles. Eso cambia totalmente la cifra. Y en € de entonces, no de hoy.\n\n**Lo que la regla no protege**\n\nAsume jubilación de 30 años. Si te retiras a los 45 y vives 50, la regla es demasiado generosa: baja a 3-3,5%. Asume mercado americano del siglo XX. Asume disciplina de gasto en años malos.',
    },
    seeAlso: ['tasa-retiro', 'secuencia-retornos', 'libertad-financiera'],
  },

  'monte-carlo': {
    title: 'Monte Carlo',
    category: 'matematica',
    short: 'Tu plan no es una curva. Es una nube de futuros posibles.',
    tooltip: 'Una técnica que simula miles de futuros posibles para tu plan, en lugar de calcular un solo escenario. Mi Plan FIRE corre miles de simulaciones con distintas secuencias de retornos para mostrar cuántos terminan bien y cuántos no.',
    glossary: 'Una técnica matemática que, en lugar de calcular un resultado único, simula miles de escenarios posibles asignando probabilidades a las variables inciertas. El nombre viene del casino de Mónaco: alude al carácter aleatorio.\n\nAplicada a tu plan, una simulación Monte Carlo no te dice "a los 65 tendrás 487.342€". Te dice algo más útil: "ejecutando 5.000 escenarios, el 80% terminó con más de 400.000€, el 50% con más de 580.000€, el 5% peor con menos de 200.000€".\n\nEsa nube de futuros es más realista que cualquier proyección lineal, porque captura un hecho fundamental: el futuro no es una curva, es una distribución.\n\nLimitación: solo simula escenarios estadísticamente similares al pasado. Eventos sin precedente escapan a sus modelos.',
    article: {
      heading: 'Por qué tu plan no es una curva, es una nube',
      lesson: 'Cualquier cifra de patrimonio futuro a 30 años es una predicción promedio, no un destino. La pregunta correcta no es "¿voy a llegar?" sino "¿en qué porcentaje de futuros plausibles llego?".',
      rule: 'Un plan sólido es el que funciona en el 80-90% de los escenarios Monte Carlo. Un plan frágil es el que solo funciona en la media.',
      warning: 'Monte Carlo te enseña la incertidumbre del futuro, no la elimina. El modelo asume que el futuro será estadísticamente similar al pasado. Si el siglo XXI rinde sustancialmente menos que el XX, todos los porcentajes se desplazan hacia abajo.',
      body: 'La pantalla principal de Mi Plan FIRE te muestra una curva suave. Es útil pero técnicamente es una simplificación drástica. El futuro no funciona así. El futuro no es una curva. El futuro es una nube.\n\n**Qué es una simulación**\n\nImagina que en lugar de calcular tu plan asumiendo que cada año rendirá exactamente 7%, lo calculas asumiendo que cada año será aleatorio: a veces +20%, a veces -25%, a veces +5%. Pero con la misma media a largo plazo.\n\nSi haces una sola simulación, tienes un escenario posible. Si haces 5.000 simulaciones distintas, tienes una nube de escenarios. Y esa nube te dice en qué porcentaje de escenarios llegas a tu meta.\n\n**Cómo leer la pantalla de Monte Carlo**\n\nMira tres cosas. El porcentaje de éxito: ¿en qué proporción llegas a tu meta? Por debajo del 70% es señal de plan frágil. La banda inferior: ¿en el peor 10%, dónde acabas? La banda superior: ¿hay margen real o el plan depende de tener suerte?',
    },
    seeAlso: ['secuencia-retornos', 'volatilidad', 'riesgo-incertidumbre'],
  },

  'fondos-indexados': {
    title: 'Fondos indexados',
    category: 'producto',
    short: 'Replican un índice de mercado al menor coste posible. La base de la inversión pasiva.',
    tooltip: 'Fondos que no intentan superar al mercado: lo replican. Si el índice MSCI World sube 8%, el fondo sube 8% menos comisiones. TER bajísimo (0,1-0,3%), diversificación amplia, simplicidad total.',
    glossary: 'Un fondo de inversión que replica de forma pasiva un índice bursátil, en lugar de intentar superarlo mediante gestión activa. Si el índice contiene 500 empresas en una proporción dada, el fondo compra esas mismas 500 empresas en esa proporción.\n\nÍndices comunes:\n— MSCI World: ~1.500 empresas de 23 países desarrollados.\n— MSCI ACWI: ~3.000 empresas incluyendo mercados emergentes.\n— S&P 500: las 500 mayores de EEUU.\n— MSCI Emerging Markets: empresas de mercados emergentes.\n— Bloomberg Global Aggregate Bond: bonos de gobiernos y empresas global.\n\nCaracterísticas clave: TER muy bajo (0,05-0,30%), diversificación automática, replicación física preferible, volumen alto.\n\nLos informes SPIVA (S&P) muestran consistentemente que el 70-90% de fondos activos terminan por debajo de su índice a 10-20 años, tras descontar comisiones.',
    article: {
      heading: 'La herramienta que cambió la inversión personal',
      lesson: 'No tienes que ser más listo que el mercado para ganar. Tienes que evitar pagar a alguien por intentar serlo y mayoritariamente no conseguirlo.',
      rule: 'Empieza por lo simple: un fondo indexado global diversificado, con TER bajo, replicación física, domiciliado en la UE. Añade complejidad solo cuando entiendas qué te da cada complejidad adicional.',
      warning: 'El rendimiento pasado no garantiza rendimiento futuro, pero al menos en un fondo indexado el rendimiento pasado coincide razonablemente con el del índice menos la comisión. En un fondo activo, el rendimiento pasado es casi pura suerte.',
      body: 'Hasta los años 70, invertir en bolsa significaba pagar a alguien (un gestor) para que eligiera acciones intentando superar al mercado. Era caro, opaco y mayoritariamente no funcionaba. En 1976, John Bogle fundó Vanguard y lanzó el primer fondo indexado público con una propuesta radical: replicar el mercado en lugar de intentar superarlo.\n\n**Por qué funciona**\n\nLas comisiones son brutalmente bajas: replicar un índice es operativamente barato. Un fondo indexado global cuesta hoy 0,10-0,25% TER. Un fondo activo equivalente cuesta 1,5-2%. A 30 años, ~30% más patrimonio para el indexado.\n\nLa gestión activa no compensa, en promedio, su coste: los datos SPIVA llevan dos décadas mostrando que el 80-90% de fondos activos quedan por debajo de su índice a 10-20 años.\n\nLa diversificación es automática: un solo fondo indexado al MSCI World te da exposición a ~1.500 empresas de 23 países.\n\n**Qué buscar al elegir uno**\n\nTER bajo (<0,3% para globales). Tamaño grande (>100M€). Replicación física (compra de verdad las acciones). Antigüedad razonable (5-10 años con caída fuerte vivida). Domicilio UE, idealmente Irlanda o Luxemburgo por motivos fiscales sobre dividendos.',
    },
    seeAlso: ['asset-allocation', 'comisiones', 'etfs-vs-fondos', 'inversion-pasiva'],
  },

  'comisiones': {
    title: 'Comisiones (TER)',
    category: 'producto',
    short: 'La única certeza negativa de tu plan. Siempre te restan, sin sorpresas.',
    tooltip: 'Lo que te cobra anualmente el producto donde inviertes. El indicador clave es el TER (Total Expense Ratio): por debajo de 0,3% es excelente, por encima de 1% es alto, por encima de 2% destructivo. Un 1% extra anual puede comerte un tercio del patrimonio final a 30 años.',
    glossary: 'El precio que pagas anualmente por tener tu dinero en un producto de inversión.\n\nTER (Total Expense Ratio): la comisión global de un fondo, expresada como porcentaje anual. Incluye gestión, depositaría, gastos operativos. Se descuenta automáticamente del valor del fondo: no recibes factura, simplemente tu fondo rinde menos.\n\nRangos típicos:\n— Indexados de calidad: 0,05-0,30%\n— Indexados caros: 0,40-0,70%\n— Activos de bajo coste: 0,70-1,20%\n— Activos típicos: 1,40-2,00%\n— Especialmente caros: 2,00-2,50%+\n\nOtras comisiones a vigilar: suscripción/reembolso (raras en fondos buenos), éxito (en algunos activos), custodia (en brokers, 0,1-0,3%), compra-venta (ETFs y acciones).\n\nUn 1% adicional anual puede reducir tu patrimonio final un 25-35% a 30 años.',
    article: {
      heading: 'El coste oculto que decide tu jubilación',
      lesson: 'Las comisiones son la única certeza negativa de tu plan. Todo lo demás puede salir mejor o peor de lo esperado. Las comisiones siempre te restan, sin sorpresas.',
      rule: 'Las comisiones son lo único que controlas con certeza. Acepta un TER por encima de 0,5% solo cuando puedas explicar exactamente qué te da a cambio. Si no puedes, no lo tomes.',
      warning: 'Cuando un fondo activo se publicita con "rentabilidad superior al mercado", suele haber sesgo de supervivencia: los fondos malos se cierran y desaparecen del histórico. La rentabilidad media real, incluyendo los fondos cerrados, suele ser inferior a la del índice.',
      body: 'Si un día te ofrecieran trabajar 30 años para alguien que te robara un tercio de tu sueldo al final, sin contrato, sin recibo, sin que pudieras verlo... no aceptarías. Esa es exactamente la estructura económica de invertir con comisiones altas.\n\n**La matemática del compounding al revés**\n\nDos personas invierten 200€/mes durante 30 años al 7% bruto anual. La diferencia: la comisión.\n\nPersona A, fondo al 0,2% TER: patrimonio final ~234.000€.\nPersona B, fondo al 1,5% TER: patrimonio final ~178.000€.\n\nMisma aportación. Mismo tiempo. **56.000€ de diferencia**. La persona B trabajó cinco años regalados sin saberlo.\n\n**Por qué las comisiones altas son peores de lo que parecen**\n\nSe aplican sobre el patrimonio total, no sobre el rendimiento. Crecen con tu patrimonio: con 5.000€ son 75€/año. Con 500.000€ son 7.500€/año. Cada año.\n\n**Lo que dicen los datos sobre la gestión activa**\n\nLos informes SPIVA muestran de forma consistente que entre el 70% y el 90% de fondos activos terminan por debajo de su índice de referencia tras descontar comisiones, en 10 años. A 20 años, sube al 90-95%. No es estadística trampeada: es la consecuencia matemática de aplicar un 1,5-2% TER sobre un mercado que rinde 7-8%.',
    },
    seeAlso: ['interes-compuesto', 'fondos-indexados', 'etfs-vs-fondos'],
  },

  'libertad-financiera': {
    title: 'Libertad financiera',
    category: 'fire',
    short: '25 veces tu gasto anual. El punto en que tu patrimonio te sostiene sin trabajar.',
    tooltip: 'El punto en el que tu patrimonio invertido genera lo suficiente para cubrir tus gastos sin que tengas que trabajar. La cifra concreta es ~25 veces tu gasto anual (regla del 4%). Para una vida a 30.000€/año, son 750.000€.',
    glossary: 'El estado en el que tu patrimonio invertido genera, por sí solo, lo suficiente para cubrir tus gastos sin necesidad de trabajar. Es el concepto central del movimiento FIRE (Financial Independence, Retire Early).\n\nNo es lo mismo que ser rico. No requiere lujo. Requiere que el rendimiento medio de tu patrimonio cubra tu gasto medio anual.\n\nAplicando la regla del 4%, la cifra es 25 veces tu gasto anual:\n— Vida mínima (15.000€/año): 375.000€\n— Vida modesta (25.000€/año): 625.000€\n— Vida confortable (40.000€/año): 1.000.000€\n— Vida holgada (60.000€/año): 1.500.000€\n\nVariantes: Lean FIRE (vida austera, cifra menor), Fat FIRE (vida holgada, cifra mucho mayor), Coast FIRE (has acumulado lo suficiente para que el compuesto te lleve sin más aportaciones), Barista FIRE (trabajo parcial mientras compone).\n\nLa libertad no es un sueldo. Es una proporción: relación entre patrimonio y gasto.',
    article: {
      heading: 'La libertad es una cifra',
      lesson: 'La libertad financiera no la da subir el sueldo. La da la proporción entre tu patrimonio y tu gasto. Por eso bajar el gasto te acerca a la meta más rápido de lo que la sube ganar más.',
      rule: 'Tu cifra de libertad no es el sueldo que cobras. Es 25 veces lo que gastas al año. Cada euro que ahorras y no gastas trabaja dos veces para ti: reduce tu meta y aumenta tu patrimonio simultáneamente.',
      warning: 'Llegar a la libertad financiera no es llegar a la felicidad. Mucha gente FIRE descubre que el problema no era el trabajo, sino lo que esperaba que el dinero arreglara. La libertad te da tiempo y opciones, no propósito ni sentido.',
      body: 'Hay una frase que se repite mucho en el mundo FIRE: "La libertad no la da el sueldo. La da el patrimonio." Es exacta, pero queda incompleta. La libertad la da una proporción.\n\n**Qué significa**\n\nEres financieramente libre cuando puedes dejar de trabajar sin que cambie tu calidad de vida. La aritmética viene de la regla del 4%: necesitas 25 veces tu gasto anual.\n\n**Por qué es distinto a ser rico**\n\nSer rico es tener mucho. Ser financieramente libre es tener suficiente. Son dos cosas distintas. Hay gente rica que no es libre (gasta tanto como gana). Hay gente con patrimonios modestos que sí es libre (su vida cuesta poco y su dinero cubre ese poco).\n\nHay una asimetría brutal: **cada euro menos de gasto anual reduce tu cifra de libertad en 25 euros**. Si reduces 1.000€/año de gasto, tu meta baja en 25.000€. Eso es una vida entera de aportaciones menos. La tijera del gasto es matemáticamente más poderosa que la palanca del sueldo.\n\n**Las variantes**\n\nLean FIRE (vida austera). Fat FIRE (vida holgada). Coast FIRE (has acumulado lo suficiente para que el compuesto te lleve a la libertad en una fecha futura). Barista FIRE (trabajo parcial mientras compone). La elección no es solo numérica, es vital.',
    },
    seeAlso: ['regla-4', 'tasa-retiro', 'horizonte'],
  },

  'asset-allocation': {
    title: 'Asset allocation',
    category: 'producto',
    short: 'Cómo repartes entre tipos de activo. La decisión más importante de tu cartera.',
    tooltip: 'Cómo repartes tu dinero entre tipos de activos: acciones, bonos, liquidez. Es la decisión más importante de tu cartera, más que elegir el fondo concreto. Define rentabilidad esperada y volatilidad asumida.',
    glossary: 'La proporción en la que repartes tu patrimonio entre clases de activos: renta variable (acciones, fondos de acciones), renta fija (bonos), liquidez (depósitos), y otros (materias primas, inmobiliario cotizado).\n\nEstudios académicos repetidos (Brinson, Hood y Beebower, 1986+) muestran que la decisión de asset allocation explica más del 90% de la variabilidad de los retornos de una cartera a largo plazo.\n\nReparto típico:\n— Conservador: 30% RV / 70% RF (3-4% real, caída esperada -15%)\n— Moderado: 50/50 o 60/40 (4-5% real, -25%)\n— Dinámico: 80/20 (5-6% real, -35%)\n— Agresivo: 100% RV (6-7% real, -50%)\n\nDebe alinearse con tu horizonte temporal: cuanto más largo, más renta variable puedes asumir.',
    article: {
      heading: 'La decisión que pesa más que todas las demás',
      lesson: 'La decisión más cara de tu carrera inversora no es qué fondo eliges. Es cómo repartes tu dinero entre tipos de activos. Eso explica más del 90% de tus resultados a largo plazo.',
      rule: 'Decide primero tu asset allocation. Después elige productos para llenarlo. Nunca al revés.',
      warning: 'Casi todo el mundo sobreestima su tolerancia al riesgo cuando el mercado va bien. La verdadera prueba llega en una caída del 30-40%. Si no has vivido una, asume que tu tolerancia real es un escalón por debajo de lo que crees.',
      body: 'La gente que empieza a invertir suele obsesionarse con dos preguntas equivocadas: "¿qué fondo elijo?" y "¿es buen momento para entrar?". Las dos importan, pero mucho menos de lo que parecen. La pregunta que realmente decide cuánto patrimonio tendrás dentro de 30 años es: cómo repartes tu dinero entre tipos de activos.\n\n**Por qué pesa tanto**\n\nDos personas con 100.000€ invirtiendo 30 años en los mismos fondos. Una pone 90% en renta variable y 10% en bonos. Otra 30% en renta variable y 70% en bonos.\n\nA 30 años, la primera termina con ~760.000€. La segunda con ~380.000€. Mismo periodo, mismos fondos. El doble de patrimonio. La diferencia no la hace el fondo. La hace el reparto.\n\n**Cómo se decide**\n\nHorizonte temporal: más años permiten más renta variable. Tolerancia al riesgo: real, no teórica. La cartera correcta es la que puedes mantener en una caída, no la que rinde más sobre el papel. Capacidad de absorber pérdidas: ingresos estables y reserva permiten más volatilidad.\n\nEl reparto evoluciona contigo. Una persona de 30 años con 30 años por delante puede asumir 100% renta variable. La misma a los 55, con 10 años por delante, debería reducir paulatinamente para no llegar al retiro en mitad de una caída del 40%.',
    },
    seeAlso: ['diversificacion', 'volatilidad', 'horizonte', 'fondos-indexados'],
  },

  // Conceptos más cortos solo con glosario
  'patrimonio': {
    title: 'Patrimonio',
    category: 'matematica',
    short: 'La suma del dinero que tienes invertido y trabajando para ti.',
    tooltip: 'La suma de todo el dinero que tienes invertido o ahorrado para tu futuro. No incluye el coche o la casa donde vives, salvo que pienses venderlos. Es lo que sí puede generar interés compuesto trabajando para ti.',
    glossary: 'En el contexto de Mi Plan FIRE, el patrimonio es el conjunto del dinero que tienes invertido o destinado a invertirse. Es lo que trabaja para ti vía interés compuesto.\n\nIncluye: fondos, ETFs, acciones, bonos, planes de pensiones, depósitos a largo plazo, liquidez para invertir.\n\nNo incluye normalmente: la casa donde vives (no genera ingresos sin venderla), el coche y bienes de uso, cuenta corriente del día a día, pensión pública futura (derecho, no patrimonio capitalizado).\n\nSolo el patrimonio invertido genera el efecto bola de nieve a largo plazo. La casa no compone — su valor sube o baja, pero no genera intereses sobre intereses.',
    seeAlso: ['interes-compuesto', 'aporte-mensual'],
  },

  'horizonte': {
    title: 'Horizonte temporal',
    category: 'matematica',
    short: 'Los años hasta que necesitas el dinero. El factor más poderoso del plan.',
    tooltip: 'Los años que tienes por delante hasta que necesites usar ese dinero. En Mi Plan FIRE suele ser desde hoy hasta tu edad de retiro. El tiempo es lo único que multiplica exponencialmente el interés compuesto.',
    glossary: 'Los años que separan el momento actual del momento en que necesitas ese dinero.\n\nEs el factor con mayor impacto sobre tu patrimonio final, más incluso que cuánto aportas o qué retorno consigues. La razón es la matemática del compounding: exponencial sobre los años.\n\nAsumiendo 7% real anual y aporte constante:\n— 100€/mes × 10 años → ~17.000€\n— 100€/mes × 20 años → ~52.000€\n— 100€/mes × 30 años → ~122.000€\n— 100€/mes × 40 años → ~262.000€\n\nCada década más que duplica el resultado. Por eso empezar a los 25 con 100€/mes deja más patrimonio que empezar a los 35 con 250€/mes.\n\nEl horizonte determina qué tipo de inversión es apropiada. Meta a 2 años: no en bolsa. Meta a 25 años: sí.',
    seeAlso: ['interes-compuesto', 'volatilidad', 'aporte-mensual'],
  },

  'aporte-mensual': {
    title: 'Aporte mensual',
    category: 'matematica',
    short: 'Lo que añades cada mes. La única variable que controlas con certeza.',
    tooltip: 'Es lo que añades a tu patrimonio cada mes. La constancia importa más que la cantidad: 100€/mes durante 30 años pesa más que 1.000€ esporádicos. Por debajo del 10% del sueldo, el compuesto se queda corto.',
    glossary: 'La cantidad de dinero que destinas a invertir cada mes. Junto con horizonte y retorno, una de las tres variables que determinan tu patrimonio final.\n\nDos modalidades en Mi Plan FIRE: aporte fijo (cantidad concreta, no escala con sueldo) o porcentual (% del ingreso, crece automáticamente). Para una carrera larga, el porcentual es matemáticamente superior.\n\nReferencias FIRE: 10% mínimo recomendado, 15-20% saludable, 25%+ permite jubilación temprana real. Por debajo del 10%, el compuesto se queda corto.\n\nLo más importante no es la cantidad concreta sino la constancia. 100€/mes durante 30 años vence con holgura a 1.000€ tres veces al año.',
    seeAlso: ['interes-compuesto', 'horizonte'],
  },

  'tasa-retiro': {
    title: 'Tasa de retiro segura',
    category: 'fire',
    short: 'El % anual que puedes retirar sin agotar tu patrimonio en jubilación.',
    tooltip: 'El porcentaje anual que puedes sacar de tu patrimonio sin agotarlo durante tu jubilación. La regla del 4% es la más conocida. Para retiros largos (40+ años) se baja al 3-3,5%. Para retiros cortos (20 años) se puede subir al 5-6%.',
    glossary: 'El porcentaje anual que puedes retirar de tu patrimonio sin que se agote durante el periodo de jubilación esperado.\n\nReferencias orientativas:\n— Retiro 20 años: 5-6%\n— Retiro 30 años: ~4% (regla clásica)\n— Retiro 40 años: 3,3-3,5%\n— Retiro 50 años: 3% o menos (datos históricos escasos)\n\nLa tasa también depende de la cartera. 100% acciones tolera tasas más altas pero con más volatilidad. Mixta 60/40 es más estable.\n\nMi Plan FIRE permite ajustar entre 2% y 8%. Por defecto 4%. Retiro temprano debería bajar a 3,3-3,5%; jubilación legal puede subir a 4,5-5%.\n\nLa tasa es inversa al horizonte: cuanto antes te retires, menos puedes retirar, y más necesitas acumular.',
    seeAlso: ['regla-4', 'secuencia-retornos', 'libertad-financiera'],
  },

  'secuencia-retornos': {
    title: 'Secuencia de retornos',
    category: 'fire',
    short: 'El orden de los retornos importa tanto como la media — sobre todo al retirar.',
    tooltip: 'El orden en el que se producen los rendimientos. Importa enormemente cuando estás retirando: dos secuencias con la misma rentabilidad media pueden producir resultados radicalmente distintos según cuándo vengan los buenos y malos años.',
    glossary: 'El orden en el que se producen los rendimientos de una inversión. Importa cuando estás retirando dinero, porque dos secuencias con la misma rentabilidad media pueden producir resultados radicalmente distintos.\n\nEjemplo: dos personas se jubilan con 500.000€ y retiran 25.000€/año (5%). Las dos viven 30 años. Media de retorno: 7% para ambas. La diferencia es el orden.\n\nPersona A: malos retornos al principio (-15%, -10%, -5%), buenos al final.\nPersona B: buenos al principio (+15%, +20%, +12%), malos al final.\n\nA 30 años, B termina con cientos de miles sobrantes. A se queda sin dinero antes del año 25.\n\n¿Por qué? Porque al retirar, los primeros años son críticos. Si el mercado cae mientras sacas, vendes en mínimos y reduces la base sobre la que actuará la recuperación.\n\nLos primeros 5-10 años de jubilación son desproporcionadamente importantes.',
    seeAlso: ['regla-4', 'tasa-retiro', 'monte-carlo'],
  },

  'etfs-vs-fondos': {
    title: 'ETFs vs fondos',
    category: 'producto',
    short: 'En España los fondos permiten traspasos sin tributar. Los ETFs no.',
    tooltip: 'Un ETF es un fondo que cotiza en bolsa: lo compras como una acción. En España hay un detalle fiscal crítico: los fondos permiten traspasos sin tributar; los ETFs no. Para construir a largo plazo en España, los fondos suelen ser más eficientes.',
    glossary: 'Dos vehículos similares con una diferencia operativa y, en España, fiscal muy importante.\n\nFondo tradicional: se compra/vende a través de la gestora. Operación 1-3 días. No cotiza en bolsa. Traspasos entre fondos no tributan (exclusivo en España).\n\nETF: cotiza en bolsa, se compra como acción. Universo más amplio. Operación inmediata. TER bajos. PERO: las plusvalías al vender tributan inmediatamente.\n\nLa diferencia fiscal es clave: los fondos permiten rebalancear sin coste fiscal. Los ETFs no. Para construir patrimonio a largo plazo en España, los fondos suelen ser más eficientes.\n\nMuchos inversores españoles construyen el grueso con fondos indexados (por el diferimiento) y usan ETFs solo cuando no hay fondo equivalente.',
    seeAlso: ['fondos-indexados', 'comisiones', 'irpf'],
  },

  'plan-pensiones': {
    title: 'Plan de pensiones',
    category: 'producto',
    short: 'Ventaja fiscal al aportar, pero tributa todo al rescatar. Solo compensa con diferencia clara de tipos.',
    tooltip: 'Vehículo con ventaja fiscal en aportación (reduces tu base imponible). El problema: al rescatar tributa como rendimiento del trabajo (IRPF general). Compensa solo si tu tipo marginal al rescatar será claramente más bajo.',
    glossary: 'Vehículo de inversión para complementar la jubilación con tratamiento fiscal específico.\n\nVentaja en aportación: reduces tu base imponible del IRPF. Aportar 1.500€ con tipo marginal 37% te ahorra 555€ ese año.\n\nLímite [v. 2026]: 1.500€/año en plan individual, 8.500€ adicionales en plan de empleo (con condiciones).\n\nProblema en rescate: todo (aportaciones + plusvalías) tributa como rendimiento del trabajo, no del capital. Tipos del 19-47%.\n\nIliquidez: no recuperas hasta jubilación salvo causas tasadas. Desde 2025, aportaciones con más de 10 años de antigüedad son rescatables libremente.\n\nFunciona cuando tu tipo marginal al aportar es claramente superior al esperado al rescatar (diferencia ≥10 puntos). Plan de empleo con aportación de empresa: casi siempre conviene.',
    seeAlso: ['fondos-indexados', 'irpf', 'libertad-financiera'],
  },

  'irpf': {
    title: 'IRPF sobre plusvalías',
    category: 'fiscal-es',
    short: 'Lo que pagas a Hacienda cuando vendes con ganancia. Solo al vender.',
    tooltip: 'Cuando vendes una inversión con ganancia, esa ganancia tributa en el IRPF. En España [v. 2026] la base del ahorro: 19% hasta 6k€, 21% hasta 50k€, 23% hasta 200k€, 27% hasta 300k€, 28% por encima.',
    glossary: 'El IRPF grava las ganancias de vender una inversión por más de lo que costó. Se integran en la base del ahorro, separada del IRPF del trabajo.\n\nTramos [v. 2026]:\n— Hasta 6.000€: 19%\n— 6.000-50.000€: 21%\n— 50.000-200.000€: 23%\n— 200.000-300.000€: 27%\n— Más de 300.000€: 28%\n\nTributa solo la ganancia, no el importe vendido. La obligación nace al vender, no al subir el valor. Esto permite diferimiento: mantener invertido sin vender retrasa el pago y el dinero sigue componiendo.\n\nCompensación: ganancias y pérdidas del año se compensan. Saldo negativo se arrastra 4 años.\n\nExcepción dorada: traspasos entre fondos no tributan. Solo se tributa al rescatar finalmente.',
    seeAlso: ['etfs-vs-fondos', 'plan-pensiones'],
  },

  'inversion-pasiva': {
    title: 'Inversión activa vs pasiva',
    category: 'producto',
    short: 'La evidencia favorece a la pasiva para casi todos los inversores normales.',
    tooltip: 'Activa: intentar superar al mercado eligiendo qué comprar y cuándo. Pasiva: replicar el mercado al menor coste posible. Los datos SPIVA muestran consistentemente que 70-90% de fondos activos pierden contra su índice a 10-20 años.',
    glossary: 'Dos filosofías opuestas sobre cómo invertir.\n\nActiva: intentar superar al mercado mediante selección de valores o timing. Comisiones altas (TER 1-2,5%). Gestores profesionales o trabajo personal.\n\nPasiva: capturar el rendimiento medio del mercado al menor coste. Fondos indexados. Aportaciones periódicas sin timing. Comisiones bajísimas (TER 0,1-0,3%).\n\nLos datos llevan décadas favoreciendo a la pasiva. Informes SPIVA muestran que el 70-90% de fondos activos pierden contra su índice a 10 años. A 20 años, 90-95%. No es opinión: es dato medido.\n\nRazones técnicas: las comisiones se acumulan, el mercado refleja la información rápido, la selección post-hoc engaña por sesgo de supervivencia.',
    seeAlso: ['fondos-indexados', 'comisiones', 'asset-allocation'],
  },

  'esperanza-vida': {
    title: 'Esperanza de vida',
    category: 'fire',
    short: 'Cuántos años vas a vivir realmente. Un dato más decisivo de lo que parece.',
    tooltip: 'La edad probable a la que vivirás. España [v. 2026] está cerca de los 83 años de media. Para planificar, conviene asumir más: si vives hasta 95 con un plan calculado para 85, tienes un problema. Mi Plan FIRE usa 90 por defecto.',
    glossary: 'La estimación estadística de cuántos años va a vivir alguien. En España [v. 2026] la esperanza de vida al nacer ronda los 83 años (mujeres ~85, hombres ~80), pero la esperanza condicional a los 65 ya supera los 85.\n\nLo importante: si tienes 35 años y has llegado vivo, tu esperanza de vida no es la media nacional al nacer. Es bastante mayor — alrededor de 85-87 años — porque ya superaste todos los riesgos de la infancia, adolescencia y juventud.\n\nPara planificación financiera, conviene asumir más años que la media. Si planeas para 85 y vives hasta 95, esos 10 años extra son tiempo sin dinero. Si planeas para 95 y mueres a 85, simplemente dejas más herencia. El riesgo es asimétrico: planificar largo es prudente.\n\nMi Plan FIRE usa 90 años por defecto, ajustable hasta 100. Si tienes antecedentes de longevidad familiar o salud excelente, súbelo a 92-95.',
    seeAlso: ['regla-4', 'tasa-retiro', 'secuencia-retornos'],
  },

  'independencia-jubilacion': {
    title: 'Independencia vs jubilación',
    category: 'fire',
    short: 'Dos cosas distintas: la jubilación es administrativa, la independencia es patrimonial.',
    tooltip: 'Jubilarse es un evento administrativo regulado por el Estado (edad legal, años cotizados). Ser financieramente independiente es una situación patrimonial: que tu patrimonio invertido pueda sostenerte sin necesidad de un sueldo. Pueden coincidir o no.',
    glossary: 'Dos conceptos que suelen confundirse pero son distintos.\n\nJubilación: evento administrativo regulado. En España [v. 2026], cumples una edad (67 años, o 65 con cotización completa), acreditas tu carrera y la Seguridad Social te empieza a pagar la pensión. Tiene fecha mínima, requisitos formales, y depende del sistema público.\n\nIndependencia financiera: situación patrimonial. Tu patrimonio invertido genera ingresos suficientes para cubrir tus gastos sin que tengas que trabajar por dinero. No depende de edad ni del Estado: depende de cuánto tienes acumulado y cuánto gastas.\n\nLas dos pueden coincidir (te jubilas a los 67 con patrimonio para vivir) o no:\n\n- Independencia antes de jubilación: tienes patrimonio para vivir, pero aún no cumples la edad legal. Decides si trabajas o no.\n- Jubilación sin independencia: cumples la edad pero la pensión sola no te llega para vivir como querrías. Sigues necesitando otros ingresos o aceptas vida más austera.\n\nMi Plan FIRE calcula tu fecha estimada de independencia financiera, no de jubilación. Son cifras distintas. La diferencia entre las dos te dice qué opciones reales tienes.',
    seeAlso: ['libertad-financiera', 'regla-4', 'pension-publica'],
  },

  'diversificacion': {
    title: 'Diversificación',
    category: 'producto',
    short: 'No poner los huevos en una sola cesta. La única "comida gratis" en inversión.',
    tooltip: 'Repartir tu inversión entre muchas empresas, sectores, países y tipos de activos. La diversificación no aumenta tu rentabilidad esperada, pero reduce el riesgo de catástrofe individual. Es de las pocas cosas en inversión que se considera "comida gratis".',
    glossary: 'La práctica de repartir el dinero invertido entre múltiples activos para reducir el riesgo de que uno solo falle catastróficamente. Si tienes 10.000€ en una sola empresa que quiebra, lo pierdes todo. Si tienes 10.000€ repartidos entre 500 empresas y una quiebra, pierdes 20€.\n\nNiveles de diversificación:\n— Por empresas: en lugar de comprar 5 acciones, comprar un fondo con 100, 500 o 1.500.\n— Por sectores: no concentrar en una industria. Tecnología, sanidad, energía, consumo, finanzas...\n— Por geografía: no invertir solo en empresas de un país. EEUU, Europa, emergentes...\n— Por clase de activo: combinar renta variable, renta fija, etc.\n— Por momento de entrada: aportar mensualmente en lugar de todo de golpe (DCA).\n\nHarry Markowitz (Nobel 1990) demostró que la diversificación reduce el riesgo total sin reducir la rentabilidad esperada. Es lo más cercano a "comida gratis" que existe en finanzas.\n\nHay un límite: a partir de 30-50 activos bien repartidos, diversificar más no añade mucho. Un solo fondo indexado global ya proporciona diversificación suficiente para empezar.',
    seeAlso: ['asset-allocation', 'fondos-indexados', 'volatilidad', 'dca'],
  },

  'broker': {
    title: 'Broker / cuenta valores',
    category: 'producto',
    short: 'La infraestructura donde están depositados tus activos invertidos.',
    tooltip: 'La cuenta donde tus activos están custodiados y desde la que operas. Puede ser tu banco habitual (suele ser caro y limitado), un broker especializado (más barato y amplio) o una gestora directa. Las diferencias en comisiones y catálogo son grandes.',
    glossary: 'La cuenta donde están depositados tus activos invertidos (fondos, ETFs, acciones, bonos) y desde la que ordenas operaciones. La "puerta de entrada" operativa al mercado.\n\nTipos de proveedores:\n— Bancos tradicionales: acceso a inversión como parte de sus servicios. Suelen tener comisiones de custodia y catálogo limitado a productos de la entidad.\n— Brokers online: especializados en ejecución. Comisiones bajas, catálogos amplios, herramientas avanzadas.\n— Gestoras directas de fondos: contratas sus fondos directamente, a veces más barato.\n— Comercializadores de fondos: plataformas con catálogo amplio de varias gestoras.\n\nCriterios para elegir:\n— Comisiones (custodia, compraventa, cambio de divisa).\n— Catálogo (¿tiene los productos que te interesan?).\n— Solidez y regulación (CNMV en España, equivalente UE).\n— Operativa (facilidad de uso, aportación periódica automática).\n— Fiscalidad operativa (facilita declaración).\n\nAtención si usas brokers extranjeros: obligación de declarar en modelo 720 si tu cartera supera 50.000€ a 31 de diciembre. Brokers domiciliados en España no entran en esa obligación.',
    seeAlso: ['etfs-vs-fondos', 'fondos-indexados', 'comisiones', 'modelo-720'],
  },

  'robo-advisors': {
    title: 'Robo-advisors',
    category: 'producto',
    short: 'Gestores automatizados de carteras indexadas. Pagas un poco más por no decidir tú.',
    tooltip: 'Servicios que invierten tu dinero por ti en una cartera de fondos indexados según un perfil de riesgo. Comisión agregada típica: 0,4-0,8%. Más caro que hacerlo solo, mucho más barato que la gestión activa tradicional. Útiles para empezar sin pensar.',
    glossary: 'Servicios de gestión automática de inversión usando algoritmos para asignar tu dinero a una cartera diversificada de fondos indexados, alineada con un perfil de riesgo definido por un cuestionario.\n\nCaracterísticas típicas:\n— Cartera construida con fondos indexados de bajo coste.\n— Rebalanceo automático.\n— Comisiones agregadas 0,4-0,8% anual (comisión propia + TER de los fondos).\n— Mínimos de entrada bajos.\n— Cumplimentación de cuestionario MiFID.\n\nTiene sentido cuando: estás empezando y no quieres tomar decisiones activas, valoras la simplicidad sobre el ahorro marginal de comisiones, quieres cumplimiento regulatorio claro.\n\nNo tiene tanto sentido cuando: ya entiendes bien los fondos indexados y prefieres pagar menos haciéndolo solo, tu patrimonio es grande y el 0,3-0,5% adicional supone cifras importantes.\n\nLección práctica: para alguien que aún no invierte, el mejor robo-advisor es cualquiera (empezar pesa más que la comisión extra). Para alguien que ya entiende, ninguno (puede hacerlo más barato).',
    seeAlso: ['fondos-indexados', 'asset-allocation', 'comisiones'],
  },

  'pension-publica': {
    title: 'Pensión pública española',
    category: 'fiscal-es',
    short: 'No es un patrimonio. Es un derecho condicionado a un sistema que puede cambiar.',
    tooltip: 'Lo que el Estado te pagará mensualmente al jubilarte, calculado a partir de tu base de cotización. La media [v. 2026] está alrededor de 1.450€/mes. Funciona como sistema de reparto: las cotizaciones actuales pagan las pensiones actuales. Sujeto a presión demográfica y reformas.',
    glossary: 'La prestación económica que recibe un trabajador al jubilarse, financiada con cotizaciones a la Seguridad Social a lo largo de su vida laboral. España opera bajo sistema de reparto: las cotizaciones actuales pagan las pensiones actuales.\n\nRequisitos [v. 2026]:\n— Edad legal: 67 (con ≤36 años cotizados) o 65 (con ≥38,5 años).\n— Mínimo 15 años cotizados (2 de ellos en los últimos 15) para tener derecho.\n— ~36 años cotizados para cobrar el 100% que correspondería.\n\nCifras orientativas [v. 2026]:\n— Pensión media de jubilación: ~1.450€/mes (14 pagas).\n— Pensión máxima: ~3.267€/mes.\n— Pensión mínima: ~966€/mes con cónyuge, ~783€/mes individual.\n\nTributa como rendimiento del trabajo en IRPF general (19-47% según ingresos).\n\nFactor crítico: desequilibrio demográfico estructural. La proporción de cotizantes por pensionista lleva años cayendo. El sistema no va a colapsar mañana, pero las pensiones futuras pueden ver: cuantía nominal mantenida pero poder adquisitivo erosionado, endurecimiento de requisitos, factor de sostenibilidad.\n\nPlanificar contando con cobrar el 100% que las normas actuales prometen es prudente. Confiar exclusivamente en la pensión pública es una apuesta cada vez más difícil.',
    seeAlso: ['base-reguladora', 'plan-pensiones', 'independencia-jubilacion'],
  },

  'base-reguladora': {
    title: 'Base Reguladora (BR)',
    category: 'fiscal-es',
    short: 'El sueldo medio cotizado sobre el que se calcula tu pensión.',
    tooltip: 'Se obtiene promediando tus bases de cotización en los últimos años antes de jubilarte. Mi Plan FIRE estima la tuya a partir de tu salario actual y trayectoria. Subir el salario al final de la carrera tiene impacto directo en la BR.',
    glossary: 'El indicador económico sobre el que se calcula la pensión pública contributiva en España. Simplificando: el sueldo medio cotizado en los últimos años de tu vida laboral.\n\nCómo se calcula [v. 2026]:\nLa normativa está en transición hacia un periodo de cómputo más amplio (entre 25 y 29 años según la reforma reciente). Fórmula general:\n— Se toman las bases de cotización mensuales de los últimos N años.\n— Las más antiguas se actualizan según el IPC para reflejar inflación.\n— Se suman y se divide por el número de meses para obtener la BR mensual.\n\nReforma reciente (RDL 2/2023): "doble fórmula" que se aplica progresivamente. El trabajador podrá optar por el cómputo tradicional o por uno que descarte los peores años de su carrera, beneficiando a quienes tuvieron años de paro o ingresos bajos.\n\nDepende fuertemente de tu sueldo medio en la última parte de tu carrera. Los años cotizando bajo (paro, autónomo con base mínima) reducen la BR. Los años cotizando alto la suben.\n\nLímite: la base máxima de cotización [v. 2026, ~58.000€/año brutos, revisable]. Lo que ganes por encima no cotiza y no incrementa tu BR. Para sueldos muy altos, este límite hace que la pensión sea pequeña en proporción al salario activo.',
    seeAlso: ['pension-publica', 'plan-pensiones'],
  },

  'tributacion-pp': {
    title: 'Tributación del plan de pensiones',
    category: 'fiscal-es',
    short: 'Aportar reduce el IRPF. Rescatar tributa como rendimiento del trabajo. Solo compensa con diferencia clara.',
    tooltip: 'Las aportaciones reducen tu base imponible al tipo marginal. El rescate tributa como rendimiento del trabajo, no como plusvalía. El plan compensa solo cuando tu tipo marginal al rescatar es claramente más bajo que al aportar (diferencia ≥10 puntos).',
    glossary: 'Tratamiento fiscal específico del plan de pensiones que conviene entender en detalle.\n\nFase de aportación:\nLas aportaciones reducen tu base imponible general del IRPF. Aportar 1.500€ con tipo marginal 37% te ahorra 555€ ese año. Coste real de la aportación: 945€.\nLímite [v. 2026]: 1.500€/año en plan individual, 8.500€ adicionales en plan de empleo (con condiciones).\n\nFase de mantenimiento:\nEl dinero compone sin tributar mientras está dentro del plan.\n\nFase de rescate:\nTodo lo recibido (aportaciones + plusvalías) tributa como rendimiento del trabajo, en base general del IRPF (19-47%). NO como plusvalía (19-28%).\nFormas de rescate: capital de golpe (suele meter en tramos altos), renta mensual (distribuye carga fiscal), mixto.\n\nVentaja histórica: aportaciones realizadas antes de 31/12/2006 pueden tener reducción del 40% al rescatar en capital, con plazos específicos.\n\nCálculo de la ventaja real:\n— Ahorro fiscal acumulado en aportaciones (aportación × tipo marginal al aportar, sumado).\n— Impuestos pagados al rescatar (cantidad rescatada × tipo marginal al rescatar promedio).\n\nEl plan gana cuando la diferencia entre tipos marginales (aportar - rescatar) es al menos 10-12 puntos porcentuales. Por debajo, el fondo gana o queda empatado con la ventaja añadida de la liquidez.\n\nCaso especial: si tu empresa aporta al plan de empleo igualando tu aportación, es dinero gratis. Aportar hasta el máximo que iguala la empresa casi siempre conviene.',
    seeAlso: ['plan-pensiones', 'irpf', 'pension-publica'],
  },

  'modelo-720': {
    title: 'Modelo 720',
    category: 'fiscal-es',
    short: 'Declaración informativa de bienes en el extranjero. Régimen sancionador suavizado tras la sentencia del TJUE 2022.',
    tooltip: 'Obligación de declarar a Hacienda los bienes que tengas fuera de España (cuentas, valores, inmuebles) si superan 50.000€ por bloque. Aplica especialmente si usas brokers extranjeros. Tras la sentencia TJUE 2022, el régimen sancionador original (que era draconiano) quedó anulado.',
    glossary: 'Obligación declarativa para residentes fiscales en España con determinados bienes o derechos fuera del territorio español. Se presenta anualmente entre 1 enero y 31 marzo, sobre la situación a 31 de diciembre del año anterior.\n\nQué hay que declarar [v. 2026]:\nTres bloques con umbral propio (no agregado):\n— Cuentas bancarias en entidades extranjeras: saldo a 31/12 o saldo medio del último trimestre > 50.000€.\n— Valores, derechos y seguros desde el extranjero (fondos, ETFs, acciones, planes, seguros): valor a 31/12 > 50.000€.\n— Inmuebles y derechos sobre ellos fuera de España: valor de adquisición > 50.000€.\n\nReiteración: una vez presentado, no es obligatorio cada año. Solo volver a declarar cuando:\n— El valor en algún bloque aumenta más de 20.000€ respecto a la última declaración.\n— Cese de titularidad sobre alguno de los bienes declarados.\n\nRégimen sancionador: el original era draconiano (imputación como ganancia patrimonial sin posibilidad de prescripción, sanciones porcentuales sobre valor total). En enero 2022, sentencia C-788/19 del TJUE declaró ese régimen contrario al derecho comunitario. España adaptó la normativa.\n\nA día de hoy [v. 2026]: la OBLIGACIÓN DE DECLARAR persiste. Las sanciones por presentación tardía o incorrecta se rigen por el régimen sancionador general del IRPF, no por el antiguo régimen específico anulado.\n\nAfecta especialmente a quienes invierten a través de brokers extranjeros. Brokers domiciliados en España no entran en este modelo.',
    seeAlso: ['broker', 'irpf'],
  },

  'tramos': {
    title: 'Tramos de ingreso',
    category: 'producto-propio',
    short: 'Mi Plan FIRE modela tu vida laboral por etapas, no como una línea recta.',
    tooltip: 'Cada tramo representa una etapa de tu vida laboral con su sueldo y aporte. La realidad no es lineal: la gente cambia de trabajo, sube de puesto, cambia de sector, se hace autónomo. Un plan que no contempla cambios no refleja vidas reales.',
    glossary: 'Concepto propio de Mi Plan FIRE para modelar tu vida laboral y financiera de forma realista. En lugar de asumir que ganarás lo mismo durante 30 años (lo que casi a nadie le pasa), divides tu trayectoria en periodos consecutivos llamados tramos, cada uno con sueldo, capacidad de aporte y duración propios.\n\nPor qué tramos y no un solo dato:\nLa vida laboral típica no es lineal:\n— Subes de puesto y tu sueldo da un salto.\n— Cambias de empresa y arrancas con otro nivel.\n— Te haces autónomo: ingresos variables, distinta capacidad de aporte.\n— Reduces jornada por familia: ingresos menores durante unos años.\n— Vuelves a tiempo completo: nivel recuperado o superior.\n— Transición al retiro: ingresos parciales antes de la jubilación total.\n\nUn único sueldo medio promedia todo, pero pierde información clave: la temporalidad importa. Subir el sueldo a los 25 produce un efecto compuesto enorme; subirlo a los 55 apenas mueve la aguja.\n\nCómo usar los tramos en Mi Plan FIRE:\nDefine un tramo por cada etapa razonablemente homogénea de tu carrera prevista. No necesitas precisión quirúrgica.\n\nRecomendación práctica: define los próximos 5-10 años con cierta precisión y los más lejanos con asunciones conservadoras. La incertidumbre crece con el horizonte.',
    seeAlso: ['aporte-mensual', 'patrimonio', 'horizonte'],
  },

  'eventos-pos-conf': {
    title: 'Eventos posibles vs confirmados',
    category: 'producto-propio',
    short: 'Lo que sabes que va a pasar vs lo que podría pasar. Mi Plan FIRE los trata distinto.',
    tooltip: 'Confirmados: algo seguro (herencia firmada, contrato cerrado). Entran en tu plan real. Posibles: algo que podría pasar (ascenso esperado, venta posible). No entran en tu proyección base; los puedes contemplar como escenarios hipotéticos.',
    glossary: 'Una distinción propia de Mi Plan FIRE para separar lo que sabes que va a pasar de lo que podría pasar, sin mezclar las dos cosas en la proyección de patrimonio.\n\nEventos confirmados:\nAlgo con certeza alta de suceder en el momento y la cuantía indicados. Ejemplos: liquidación de contrato firmado, herencia formalizada, pago aplazado con calendario establecido, venta de inmueble con compraventa firmada, alquileres ya percibidos.\n\nEntran directamente en tu plan real. Mi Plan FIRE los considera al calcular patrimonio proyectado y aportes futuros.\n\nEventos posibles:\nAlgo que podría suceder pero sin certeza alta. Ejemplos: ascenso esperado pero no confirmado, herencia que podría llegar sin fecha definida, venta de activo en consideración, ingreso esperado de fuente con incertidumbre, gasto extraordinario que podría aparecer.\n\nPor qué la distinción importa:\nDecisión de diseño deliberada para evitar dos errores frecuentes:\n— Inflar el plan con asunciones optimistas. Si todo "lo que podría pasar" entrara en la proyección base, tu plan parecería mejor de lo que es. Cuando uno no se materializa, descubres la fragilidad.\n— Bloquear el plan por cosas no decididas. Si solo puedes planificar "lo seguro", pierdes la capacidad de ver cómo afectaría una decisión que estás considerando.\n\nLa diferencia entre soñar y planificar es exactamente esta.',
    seeAlso: ['patrimonio', 'horizonte'],
  },

  'lean-coast-fat': {
    title: 'Lean, Coast y Fat FIRE',
    category: 'fire',
    short: 'Distintos sabores de libertad financiera según el estilo de vida que busques.',
    tooltip: 'Lean FIRE: libertad con vida austera (~20k€/año, ~500k€). Fat FIRE: libertad holgada (~80k€/año, ~2M€). Coast FIRE: tienes lo suficiente para que el compounding te lleve a la meta sin aportar más, aunque sigas trabajando. La elección no es numérica: es vital.',
    glossary: 'Variantes del FIRE (Financial Independence, Retire Early) que reconocen que "libertad financiera" significa cosas distintas según el estilo de vida que cada uno busque.\n\nLean FIRE:\nLibertad financiera con vida austera. Meta calculada sobre gasto anual modesto.\nCifras: vivir con 15.000-22.000€/año, patrimonio ~375-550.000€ (regla del 4%).\nVentaja: se llega antes, posible a los 35-40 con disciplina alta.\nDesventaja: vida austera por definición. Margen reducido frente a sorpresas. Más vulnerable.\n\nFat FIRE:\nLibertad financiera con vida holgada. Meta sobre gasto anual elevado.\nCifras: vivir con 50.000-100.000€/año, patrimonio 1,25-2,5M€.\nVentaja: confort, mucho margen, resiliencia ante imprevistos.\nDesventaja: tarda mucho más en llegar. Requiere ingresos altos o tiempo largo. Inalcanzable para algunos perfiles.\n\nCoast FIRE:\nEl punto intermedio interesante. Has acumulado lo suficiente para que el interés compuesto, sin nuevas aportaciones, te lleve a la libertad en una fecha futura razonable.\nNo estás libre todavía: aún trabajas. Pero no necesitas aportar más. Te libera psicológicamente: puedes elegir trabajos que te gusten aunque paguen menos, reducir jornada, cambiar de sector. El compounding hace el resto.\nProbablemente la versión más realista y accesible del FIRE.\n\nBarista FIRE:\nVariante práctica del Coast. Trabajas a tiempo parcial cubriendo gastos corrientes, mientras tu patrimonio sigue componiendo. Reduces presión sin haber alcanzado libertad total.\n\nLa elección entre estas variantes no es solo numérica, es vital. Tu cifra depende de qué estilo de vida quieres. Esa pregunta no la responde una calculadora.',
    seeAlso: ['libertad-financiera', 'regla-4', 'independencia-jubilacion'],
  },

  'dca': {
    title: 'Dollar-Cost Averaging (DCA)',
    category: 'estrategia',
    short: 'Aportar la misma cantidad periódicamente, sin intentar adivinar el momento del mercado.',
    tooltip: 'Aportar cantidades fijas periódicamente (mensual o trimestral) en lugar de invertir todo de golpe. Reduces el riesgo de "entrar justo en máximos" comprando a precios distintos a lo largo del tiempo. Especialmente útil cuando empiezas o cuando recibes ingresos regulares.',
    glossary: 'Una estrategia de inversión que consiste en aportar una cantidad fija de dinero de forma periódica (típicamente mensual), independientemente del precio del mercado en ese momento. "Promediación del coste".\n\nCómo funciona:\nAportas, por ejemplo, 250€ cada mes a tu fondo. Algunos meses el mercado está caro: con 250€ compras menos participaciones. Otros meses está barato: con los mismos 250€ compras más. A largo plazo, el precio medio al que has comprado se sitúa cerca del precio medio del mercado durante todo el periodo.\n\nVentajas:\n— Reduce el riesgo de timing. No tienes que adivinar cuándo es buen momento.\n— Disciplina automática. Operación recurrente, sin tentación de "esperar a ver".\n— Aprovecha caídas sin decisión activa. Cuando el mercado cae, tu aporte mensual compra más participaciones baratas. Una caída durante acumulación es buena, no mala.\n— Encaja con el flujo de ingresos. La mayoría cobra mensualmente, así que aportar mensualmente es natural.\n\nLimitaciones:\nComparado con "invertir todo de golpe", DCA es estadísticamente inferior cuando el mercado sube a largo plazo. Si tuvieras 30.000€ disponibles hoy y los pudieras invertir todos hoy, hacerlo de golpe tiene más probabilidad de superar a invertirlos en 12 mensualidades — porque el mercado sube más años de los que baja.\n\nPero esto solo aplica si tienes cantidad grande disponible HOY. Para quien va construyendo patrimonio desde su nómina mensual, DCA no es una estrategia "frente a otra": es la única disponible.',
    seeAlso: ['aporte-mensual', 'volatilidad', 'fondos-indexados'],
  },

  'pignoracion': {
    title: 'Pignoración de activos',
    category: 'estrategia',
    short: 'Pedir un préstamo con tu cartera de inversión como garantía, sin venderla.',
    tooltip: 'Dar tu cartera de inversión como garantía de un préstamo, sin venderla. Útil para pagar hitos grandes sin romper el interés compuesto ni tributar plusvalías. Tiene letra pequeña: tipo de interés, riesgo de margin call, contrato a leer.',
    glossary: 'Dar tu cartera de inversión como garantía de un préstamo, sin venderla.\n\nPignorar significa que el banco te presta dinero y se queda con el derecho a quedarse con esos activos si no devuelves el préstamo. Mientras tanto, los activos siguen siendo tuyos: siguen invertidos, siguen creciendo, y no realizas plusvalías a efectos del IRPF.\n\nEs una herramienta legítima para mantener el interés compuesto cuando tienes que pagar un hito grande (entrada de casa, herencia con costes asociados, gasto extraordinario). No es gratis ni inocua: tiene tipo de interés (Euríbor + 1-2 puntos habitualmente), riesgo de margin call si la cartera cae mucho, y solo compensa cuando el rendimiento esperado supera con margen el coste del préstamo.',
    warning: 'No es una herramienta de uso general. Solo tiene sentido cuando el rendimiento esperado de tu cartera supera con margen el coste del préstamo, y siempre que tu colchón soporte un margin call sin liquidar a la fuerza. Si tu plan FIRE depende de pignorar todo, probablemente no es un buen plan.',
    article: {
      heading: 'Pignoración de activos: cuándo tiene sentido y cuándo no',
      lesson: 'Pignorar es una forma de no romper la bola de nieve cuando llega un hito grande. Pero no es magia: tiene coste, riesgo y letra pequeña.',
      rule: 'Antes de pignorar: verifica que el rendimiento esperado de tu cartera supera con margen el coste del préstamo, que tu LTV no supera el 40-50%, y que has leído el contrato entero (tipo, comisiones, cláusulas de margin call).',
      warning: 'Si no entiendes el contrato, no firmes. La letra pequeña de un préstamo pignoraticio puede incluir tipos variables, cláusulas de margin call, plazos de aviso cortos y comisiones de cancelación. Leerlo todo antes de firmar es innegociable.',
      body: 'Pignorar significa dar tus activos (cartera de fondos, ETFs, acciones) como garantía de un préstamo. El banco te presta dinero y se queda con el derecho a quedarse con esos activos si no devuelves el préstamo.\n\n**Por qué es interesante**\n\nLa razón principal: no vendes. Si vendes 50.000 € de tu cartera para pagar la entrada de una casa, esos 50.000 € dejan de crecer al 8% anual estimado. En 20 años, esos 50.000 € se habrían convertido en ~233.000 €. Eso es lo que pierdes.\n\nAdemás, al vender realizas plusvalías que tributan en el IRPF (19-28% según el tramo). En cambio, pedir un préstamo pignorando no genera evento fiscal: sigues siendo dueño de la cartera, sigue creciendo, y pagas IRPF solo si algún día vendes.\n\n**Cuándo tiene sentido**\n\nTres condiciones tienen que cumplirse a la vez:\n\n1. El rendimiento esperado de tu cartera supera con margen el coste del préstamo. Si tu cartera rinde un 8% esperado y el préstamo pignoraticio cuesta Euríbor + 1.5% (digamos 4-5% actualmente), la diferencia compensa con holgura.\n\n2. Tienes colchón suficiente para soportar una caída grande de tu cartera sin que el banco te exija aportar más garantía (margin call). Una regla cauta: el LTV (loan-to-value) no debería superar el 40-50% del valor de la cartera. Si pignoras 50.000 € sobre una cartera de 100.000 €, una caída del 50% deja al banco sin margen.\n\n3. El horizonte del préstamo es razonable. La pignoración funciona mejor para plazos de 3-10 años. Préstamos a 30 años pignorando es poco habitual y depende de la entidad.\n\n**Cuándo NO tiene sentido**\n\n— Para gastos corrientes o consumo: si no puedes permitirte algo con tu salario, pignorar para pagarlo es apalancamiento de consumo. Eso es lo contrario del camino FIRE.\n\n— Cuando tu cartera está concentrada en activos muy volátiles: si una caída del 40% es plausible, el riesgo de margin call es real.\n\n— Cuando el coste del préstamo se acerca o supera el rendimiento esperado de tu cartera: la cuenta sale mal.\n\n— Si no entiendes los detalles del contrato. La pignoración tiene letra pequeña: tipo variable o fijo, comisiones, plazos, cláusulas de margin call, qué activos acepta el banco como garantía. Leerlo todo antes de firmar es innegociable.\n\n**En la práctica española**\n\nNo todos los bancos ofrecen préstamos pignoraticios sobre carteras de inversión. Bancos privados y entidades especializadas en banca patrimonial tienden a hacerlo. Los brokers tradicionales en España ofrecen líneas de crédito sobre la cartera (margin loans), pero el funcionamiento es distinto y los costes pueden ser más altos.\n\nPignorar planes de pensiones no es posible (son inembargables hasta rescate). Cripto se pignora en algunos brokers con haircuts grandes (te dan menos préstamo por el mismo valor de garantía debido a la volatilidad).\n\n**Resumen**\n\nPignoración es una herramienta legítima para mantener el efecto del interés compuesto cuando tienes que pagar un hito grande. No es gratis ni inocua. Requiere entender el coste, el riesgo de margin call, y leer el contrato con cuidado.\n\nSi tu plan FIRE depende de pignorar todo, probablemente no es un buen plan. Si llega un hito grande y tienes la posibilidad de no vender, vale la pena valorarla.',
    },
    seeAlso: ['interes-compuesto', 'irpf', 'libertad-financiera'],
  },

  'rebalanceo': {
    title: 'Rebalanceo',
    category: 'estrategia',
    short: 'Ajustar periódicamente las proporciones de tu cartera para mantener el asset allocation.',
    tooltip: 'Si querías 80/20 acciones-bonos y la bolsa ha subido tanto que ahora estás en 88/12, vendes algo de acciones y compras bonos para volver a 80/20. Mantiene tu riesgo bajo control y captura disciplinadamente parte de las subidas.',
    glossary: 'El acto de ajustar periódicamente la composición de tu cartera para mantener las proporciones de asset allocation que decidiste originalmente. Como las clases de activos rinden a ritmos distintos, sus pesos relativos cambian con el tiempo. El rebalanceo los devuelve a la asignación deseada.\n\nPor qué es necesario:\nImagina cartera 70/30 acciones/bonos. Pasa un año bueno de bolsa, normal de bonos. Sin hacer nada, te quedas en 78/22. Has "asumido" sin querer más riesgo del que decidiste.\n\nEl rebalanceo consiste en vender una pequeña parte de lo que más ha subido (acciones) y comprar más de lo que ha quedado atrás (bonos) para volver al 70/30. Te obliga a "vender alto y comprar bajo" automáticamente, sin adivinar el mercado.\n\nFrecuencia:\n— Calendario fijo: una o dos veces al año. Sencillo, disciplinado.\n— Por umbral: solo cuando la desviación supera un umbral (ej. ±5%). Más eficiente fiscalmente, requiere monitorización.\n\nPara la mayoría, revisión anual basta.\n\nMétodos:\n— Vender y comprar. Forma clásica. Inconveniente fiscal en ETFs (cada venta tributa). En fondos no aplica si traspasas entre ellos.\n— Solo con nuevas aportaciones. Diriges los aportes mensuales hacia lo infraponderado hasta restablecer proporciones. Más lento, sin coste fiscal.\n— Solo en retiradas. En fase de retiro, sacas dinero desproporcionadamente del que está sobrepuesto.\n\nVentaja oculta: estadísticamente mejora ligeramente la rentabilidad a largo plazo, porque te obliga a comprar barato y vender caro de forma mecánica ("rebalancing bonus", 0,3-0,5% adicional anual).\n\nEl rebalanceo es el único momento en que un inversor pasivo "actúa" sobre su cartera. Hacerlo en calendario fijo, sin pensar demasiado, mantiene la disciplina sin caer en timing emocional.',
    seeAlso: ['asset-allocation', 'diversificacion', 'etfs-vs-fondos'],
  },

};

export const CATEGORY_LABELS = {
  'matematica': 'Matemática',
  'macro': 'Macroeconomía',
  'producto': 'Productos de inversión',
  'fiscal-es': 'Fiscalidad española',
  'fire': 'FIRE / Libertad financiera',
  'producto-propio': 'Funciones de Mi Plan FIRE',
  'psicologia': 'Psicología del inversor',
  'estrategia': 'Estrategias',
};

export const TABLON = [
  { theme: 'El motor del patrimonio', lessons: [
    { text: 'Tu mayor decisión financiera no es cuánto ahorras. Es cuándo empiezas.', source: 'interes-compuesto' },
    { text: 'Aporta poco pero antes, en lugar de mucho pero más tarde. La matemática no perdona los años perdidos.', source: 'interes-compuesto' },
    { text: 'La bola de nieve solo funciona si nunca la tocas. Cada vez que retiras dinero antes de tiempo, no estás sacando solo lo que sacas: estás sacando todo lo que ese dinero habría generado durante el resto de tu vida.', source: 'interes-compuesto' },
  ]},
  { theme: 'El rendimiento real', lessons: [
    { text: 'El retorno medio del 7-8% no es lo que ves cada año. Es lo que queda cuando llevas muchos años aguantando lo que pasa cada año.', source: 'retorno-anual' },
    { text: 'Si dejas el retorno al 8% pero tu dinero está en cuenta corriente, Mi Plan FIRE te proyecta un patrimonio que no vas a tener. El número de la app no genera dinero. Lo genera el sitio donde está tu dinero.', source: 'retorno-anual' },
  ]},
  { theme: 'La inflación', lessons: [
    { text: 'Ahorrar no conserva tu dinero. Solo invertir por encima de la inflación lo conserva. Todo lo demás es perderlo lentamente.', source: 'inflacion' },
    { text: 'Calcula cuánto dinero tienes ahora mismo en cuentas que rinden por debajo de la inflación. Esa cifra es tu sangrado activo.', source: 'inflacion' },
  ]},
  { theme: 'La psicología del inversor', lessons: [
    { text: 'La volatilidad no es pérdida. La pérdida es lo que materializas al vender en pánico.', source: 'volatilidad' },
    { text: 'Tu cerebro está cableado para venderte mal. Saberlo no te protege: te protege diseñar un plan al que no puedas saltar fácilmente cuando llegue el pánico.', source: 'volatilidad' },
    { text: 'Las grandes caídas son cuando se construye o se destruye el patrimonio de toda una vida. La diferencia no la hace la información que tienes ese día. La hace lo que decidiste años antes sobre cómo ibas a comportarte cuando llegara.', source: 'volatilidad' },
  ]},
  { theme: 'La robustez del plan', lessons: [
    { text: 'La perfección no existe en planificación financiera. La robustez sí. Un plan no tiene que prever el futuro: tiene que sobrevivir a varios futuros posibles.', source: 'riesgo-incertidumbre' },
    { text: 'El error más caro de la planificación financiera no es elegir mal el fondo, ni equivocarse con el retorno. Es romper la bola de nieve para comprar algo que se podía haber pagado de otra manera.', source: 'riesgo-incertidumbre' },
  ]},
  { theme: 'La libertad financiera', lessons: [
    { text: 'La libertad financiera no es un sueldo grande. Es 25 veces el gasto anual que necesitas para vivir bien. La aritmética es la misma para todos.', source: 'regla-4' },
    { text: 'La libertad financiera no la da subir el sueldo. La da la proporción entre tu patrimonio y tu gasto. Por eso bajar el gasto te acerca a la meta más rápido de lo que la sube ganar más.', source: 'libertad-financiera' },
  ]},
  { theme: 'La secuencia de retornos', lessons: [
    { text: 'No solo importa cuánto patrimonio tengas al jubilarte. Importa qué hace el mercado los primeros años después de jubilarte. Es la diferencia entre vivir tranquilo o quedarte sin dinero antes de morir.', source: 'secuencia-retornos' },
  ]},
  { theme: 'La incertidumbre del futuro', lessons: [
    { text: 'Cualquier cifra de patrimonio futuro a 30 años es una predicción promedio, no un destino. La pregunta correcta no es "¿voy a llegar?" sino "¿en qué porcentaje de futuros plausibles llego?".', source: 'monte-carlo' },
    { text: 'Un plan sólido es el que funciona en el 80-90% de los escenarios Monte Carlo. Un plan frágil es el que solo funciona en la media.', source: 'monte-carlo' },
  ]},
  { theme: 'Asset allocation', lessons: [
    { text: 'La decisión más cara de tu carrera inversora no es qué fondo eliges. Es cómo repartes tu dinero entre tipos de activos. Eso explica más del 90% de tus resultados a largo plazo.', source: 'asset-allocation' },
    { text: 'Decide primero tu asset allocation. Después elige productos para llenarlo. Nunca al revés.', source: 'asset-allocation' },
  ]},
  { theme: 'Las comisiones', lessons: [
    { text: 'Las comisiones son la única certeza negativa de tu plan. Todo lo demás puede salir mejor o peor de lo esperado. Las comisiones siempre te restan, sin sorpresas.', source: 'comisiones' },
    { text: 'Acepta un TER por encima de 0,5% solo cuando puedas explicar exactamente qué te da a cambio. Si no puedes, no lo tomes.', source: 'comisiones' },
  ]},
  { theme: 'Los productos', lessons: [
    { text: 'No tienes que ser más listo que el mercado para ganar. Tienes que evitar pagar a alguien por intentar serlo y mayoritariamente no conseguirlo.', source: 'fondos-indexados' },
    { text: 'Empieza por lo simple: un fondo indexado global diversificado, con TER bajo, replicación física, domiciliado en la UE.', source: 'fondos-indexados' },
    { text: 'En España, los fondos permiten construir patrimonio sin pagar impuestos hasta el rescate final. Los ETFs hacen tributar cada movimiento.', source: 'etfs-vs-fondos' },
    { text: 'El plan de pensiones no es bueno ni malo: es un instrumento de planificación fiscal. Funciona si tu tipo marginal al aportar es claramente superior al esperado al rescatar.', source: 'plan-pensiones' },
  ]},
];

// ---------- Constantes editoriales (arrastradas Tanda final) ----------
export const GOAL_CATEGORIES = [
  { id: 'liquidez',       label: 'Colchón de liquidez', short: 'Liquidez' },
  { id: 'vivienda',       label: 'Vivienda',            short: 'Vivienda' },
  { id: 'coche',          label: 'Coche',               short: 'Coche' },
  { id: 'objetoGrande',   label: 'Objeto grande',       short: 'Otro objeto' },
  { id: 'ayudaFamiliar',  label: 'Ayuda familiar',      short: 'Familia' },
  { id: 'herencia',       label: 'Herencia',            short: 'Herencia' },
  { id: 'jubilacion',     label: 'Jubilación',          short: 'Jubilación' },
  { id: 'otro',           label: 'Otro',                short: 'Otro' },
];

export const GOAL_CATEGORY_LABEL = (() => {
  const m = {}; GOAL_CATEGORIES.forEach(c => { m[c.id] = c.label; }); return m;
})();

export const LEARN_DISCLAIMER = 'Mi Plan FIRE es una herramienta de planificación financiera personal. No es un servicio de asesoramiento financiero ni de inversión. El contenido educativo tiene carácter exclusivamente informativo y formativo. No constituye recomendación personalizada de inversión, asesoramiento financiero, fiscal o legal. Las decisiones financieras son responsabilidad exclusiva del usuario. Las menciones a tipos de productos (fondos indexados, ETFs, planes de pensiones) son referencias genéricas a categorías reguladas, no recomendaciones específicas. Las proyecciones son estimaciones basadas en supuestos: el comportamiento real puede diferir. Rentabilidades pasadas no garantizan rentabilidades futuras. Los datos fiscales corresponden a normativa vigente en mayo 2026; reformas posteriores pueden alterarlos.';

// Alias de términos del producto → id de LEARN_CORPUS, para que la búsqueda del Glosario los
// encuentre SIN tocar el corpus cerrado (CO4). "tu número" es la cifra de la regla del 4 %.
export const GLOSSARY_ALIASES = {
  'tu número': 'regla-4',
  'tu numero': 'regla-4',
  'mi número': 'regla-4',
  'mi numero': 'regla-4',
};

export const LEARN_LEVELS = {
  esencial: [
    'interes-compuesto', 'retorno-anual', 'inflacion', 'volatilidad',
    'riesgo-incertidumbre', 'patrimonio', 'horizonte', 'aporte-mensual',
    'asset-allocation', 'fondos-indexados', 'comisiones', 'diversificacion',
  ],
  profundizando: [
    'regla-4', 'monte-carlo', 'libertad-financiera', 'tasa-retiro',
    'secuencia-retornos', 'esperanza-vida', 'independencia-jubilacion',
    'etfs-vs-fondos', 'plan-pensiones', 'broker', 'robo-advisors',
    'inversion-pasiva', 'dca',
  ],
  avanzado: [
    'tramos', 'eventos-pos-conf', 'lean-coast-fat', 'rebalanceo',
    'pignoracion',
    'irpf', 'pension-publica', 'base-reguladora', 'tributacion-pp', 'modelo-720',
  ],
};

export const LEARN_LEVEL_LABELS = {
  esencial: 'Esencial',
  profundizando: 'Profundizando',
  avanzado: 'Avanzado',
};

export const LEARN_LEVEL_SUB = {
  esencial: 'Para quien empieza',
  profundizando: 'Para quien ya entiende lo básico',
  avanzado: 'Para optimización',
};

export const LEARN_LEVEL_BY_ID = (() => {
  const m = {};
  Object.entries(LEARN_LEVELS).forEach(([lvl, ids]) => ids.forEach(id => { m[id] = lvl; }));
  return m;
})();
