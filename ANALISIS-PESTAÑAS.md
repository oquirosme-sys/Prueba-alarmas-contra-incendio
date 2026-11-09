# Variante «formato Notifier» · análisis de pestañas

Punto de partida: el libro `referencia/Notifier - Memoría de Alarma.xlsx` (5 pestañas) frente a la herramienta de Detección tal como está hoy (`index.html`, `js/` y `css/`, copia sin cambios del repositorio Herramienta-alarmas-contraincendio (commit 6b859b5)).

Este documento es el insumo para decidir qué pestañas se usan, cuáles se descartan y cuáles se reemplazan por lo que la herramienta ya hace. **Todavía no se cambió código.**

## 1. Qué hace el libro

| Pestaña | Contenido | Entradas | Salidas (fórmulas) |
|---|---|---|---|
| 1. Dispositivos | Corrientes (A) en espera y alarma de cada dispositivo, tensión mínima, y la tabla de cables (AWG, modelo, ohm/km, pF/m). Segunda tabla: dispositivos de notificación (SE15…SE185, E15…E185) con corriente NAC y de voceo. | Todas | Ninguna |
| 2. Paneles | Base de diseño (24 h espera, 15 min alarma, factor de seguridad 20 %, 24 V × 85 % = 20,4 V, parámetros de voceo), panel/transponder, fuentes remotas (RPS) y amplificadores. | Parámetros, nombre, modelo y nivel de cada equipo | Cantidad de lazos, corriente total, Ah en espera y en alarma, Ah + factor de seguridad |
| 3. Conteo dispositivos | Cantidad de cada tipo de dispositivo por nivel, y el total por lazo SLC (agrupa 3 niveles por lazo). | Cantidades por nivel | Sumas por lazo |
| 4. SLC + AUX | Un renglón por lazo: panel, lazo, niveles, cantidades, corriente, distancia, calibre. Comprobación del cableado SLC y del auxiliar +24 VDC. | Cantidades, distancia, calibre | Corriente, resistencia, caída, tensión disponible, «Cumple / No cumple» |
| 5. NAC + VOCEO | Un renglón por lazo NAC y por lazo de voceo: cantidades de altavoz con estrobo y de estrobo, potencia, distancia, calibre. | Cantidades, distancia, calibre | Corriente de alarma, caída, tensión disponible, pérdida de voceo (dB), estado |

## 2. Qué ya hace la herramienta

| Pestaña del libro | Equivalente en la herramienta | Cobertura |
|---|---|---|
| 1. Dispositivos | Catálogo de dispositivos y cables (Administración) | Completa y con más fabricantes. **Falta contrastar los valores** (ver 4). |
| 2. Paneles · base de diseño | Parámetros del proyecto: `tEspera` 24 h, `tAlarma` 15 min, `fs` 0,2, `vNominal` 24 V, `pctFinVida` 0,85, `vMin` 16 V | Idéntica. Los valores por defecto coinciden con el libro. |
| 2. Paneles · baterías | Pestaña de cada panel (`Calc.panel`, `Calc.bateria`): Ah en espera + Ah en alarma, por el factor de seguridad, y selección de batería comercial | Cubierta. La herramienta además propone la batería comercial. |
| 2. Paneles · fuentes y amplificadores | Pestañas de fuentes (`Calc.fuente`, `tipo` AMP) | Cubierta. |
| 3. Conteo dispositivos | Pestaña por nivel (`vistaNivel`) y «Resumen de dispositivos» (`resumenDispositivos`) | Cubierta por nivel. **Falta la agrupación por lazo SLC** como tabla propia. |
| 4. SLC + AUX | Pestaña «Caída de tensión» (`Calc.caida`), circuitos de tipo SLC, 24VDC y SLC+24V | Cubierta en el cálculo; **falta la presentación en el formato del libro** (un renglón por lazo con las cantidades por tipo). |
| 5. NAC + VOCEO | Pestaña «Caída de tensión», circuitos NAC, VOCEO y NAC+VOCEO; amplificadores | Cubierta en el cálculo; **falta la presentación**, y la pérdida de voceo en dB. |

Lo que la herramienta hace y el libro no: varios fabricantes, niveles y paneles ilimitados, segundo lazo por dispositivo, clase A/B, «alimentado por», diagrama unifilar y láminas 1100 × 750, memoria en PDF, Excel con formato, conflictos de edición entre usuarios y guardado en Supabase.

## 3. Propuesta de uso de las pestañas

| Pestaña | Propuesta | Razón |
|---|---|---|
| 1. Dispositivos | **No se usa como pestaña.** Se usa una vez, para contrastar los valores contra el catálogo. | El catálogo ya es la fuente. Una segunda tabla de dispositivos duplicaría el dato. |
| 2. Paneles | **No se usa como pestaña.** Base de diseño y baterías ya están. | Sin aporte. |
| 3. Conteo dispositivos | **Se analiza.** Candidata a vista del Resumen: cantidades por nivel y por lazo SLC. | Es la forma en que el equipo revisa cuántos dispositivos entran en cada lazo. |
| 4. SLC + AUX | **Se usa como formato de salida.** | Es el cuadro que se entrega: un renglón por lazo con cantidades, corriente, distancia, calibre y estado. |
| 5. NAC + VOCEO | **Se usa como formato de salida.** | Igual que la anterior, con la pérdida de voceo. |

Esta propuesta toma como candidatas las tres pestañas que quedaron marcadas en la captura (3, 4 y 5). **Hay que confirmarla.**

## 4. Diferencias de cálculo que hay que decidir

Se compararon las fórmulas del libro con `calc.js`. Donde difieren, la variante no puede ofrecer los dos resultados sin que se elija uno.

1. **Resistencia del lazo.** El libro calcula `R = ohm/km × distancia / 1000` (un solo sentido). La herramienta calcula `R = 2 × L / 1000 × ohm/km` (ida y vuelta). Con la misma distancia, la herramienta da el doble de caída. Hay que decidir cuál rige y qué significa la columna «Distancia (m)» del libro.
2. **Criterio de cumplimiento.** El libro dice «Cumple» si la tensión disponible es mayor que 16 V. La herramienta acepta mayor o igual, y además revisa que la corriente no pase de 2,4 A (80 % del NAC), que el libro no revisa.
3. **Corriente del lazo SLC.** El libro usa para la caída la corriente de alarma de todos los dispositivos del lazo. La herramienta suma la corriente de alarma de las filas asignadas al lazo. Es equivalente si las cantidades coinciden.
4. **Consumo del módulo de lazo.** El libro suma 0,159 A en espera y 0,21 A en alarma por cada módulo SLM-318 (uno por lazo) a la corriente del panel. En la herramienta eso solo se obtiene si el módulo está como renglón del panel. Hay que confirmar que el catálogo lo permita.
5. **Catálogo.** Modelos del libro que **no se encontraron por ese nombre** en `catalogo-base.js`: FSP-1, FST-1, SLM-318, HPF-PS10, HPF-PS6, BA-FIRE-AVDS-62174 y el cable 5320FL. Pueden existir con otro nombre (FSP-851, por ejemplo). Falta revisarlo uno por uno y comparar las corrientes.

## 5. Inconsistencias dentro del libro

Son una razón para que la variante calcule en la herramienta y deje el libro solo como formato.

- **3. Conteo.** La suma de cada lazo para DT está desfasada respecto a la de DH: `L5 = SUM(B11:B13)` pero `M5 = SUM(C12:C14)`; `M6 = SUM(C13:C15)` y `M7 = SUM(C16:C18)`. Los lazos 4 a 6 suman filas distintas según el tipo de dispositivo.
- **2. Paneles.** Muchas celdas de fuentes y amplificadores están escritas como número y no como fórmula (por ejemplo `F37:F40`, `G37:G40`, `G56`, `I58`). Si cambia una cantidad, esos totales no se actualizan.
- **2. Paneles.** La corriente en espera del panel (`I25`) solo suma el lazo SLC; la de alarma (`J25`) suma el lazo SLC más el NAC y el voceo. Es coherente, pero el auxiliar +24 VDC no entra en ninguna.
- **4. SLC + AUX.** Varias celdas de resistencia y de caída están en blanco o como número fijo (`S8:S12`, `T10:T12`, `V8:V12`). La resistencia del auxiliar usa `P × X` sin dividir entre 1000.
- **1. Dispositivos.** La corriente de voceo de los altavoces con estrobo es 0,0833 A (2 W a 24 V) en los siete modelos, pero solo SE15 y SE30 la traen como fórmula (`2/24`); el resto es un número escrito. Los estrobos solos (E15 a E185) tienen 0 en voceo.

## 6. Siguientes pasos propuestos

1. Confirmar la propuesta de la sección 3 y las cinco decisiones de la sección 4.
2. Contrastar la pestaña 1 con el catálogo (sección 4, punto 5) y completar lo que falte.
3. Agregar a la pestaña «Caída de tensión» una **vista en formato del libro**: un renglón por lazo SLC y por lazo NAC/voceo, con cantidades por tipo de dispositivo.
4. Agregar al Excel de la memoria las hojas «SLC + AUX» y «NAC + VOCEO» con ese formato, calculadas una sola vez (`memoriaDatos`) para que coincidan con el PDF.
5. Probar con el proyecto del libro (6 lazos SLC en FACP, 5 en el transponder, 14 amplificadores, 11 fuentes remotas) y comparar los resultados contra el libro, renglón por renglón.

## 7. Contenido de este repositorio

| Ruta | Qué es |
|---|---|
| `index.html`, `js/`, `css/`, `img/`, `supabase/`, `excel/`, `.github/` | La herramienta tal como está en Herramienta-alarmas-contraincendio (commit 6b859b5), sin cambios |
| `referencia/Notifier - Memoría de Alarma.xlsx` | El libro de origen |
| `ANALISIS-PESTAÑAS.md` | Este documento |

La herramienta usa Supabase y su propio acceso con PIN (`js/auth.js`, `js/config.js`). El flujo de `.github/workflows/static.yml` publica el sitio en GitHub Pages con cada push a `main`.

## 8. Avance (2026-11-09)

- Decisión del usuario: se usan las pestañas 3, 4 y 5. Las pestañas 1 y 2 no se usan.
- Se agregó la pestaña **Formato libro** (`js/formato-libro.js` y `vistaLibro` en `js/app.js`), de solo lectura, con las tablas 3 (conteo por nivel), 4 (lazos SLC y auxiliar) y 5 (lazos NAC y voceo). No cambia ninguna fórmula: usa `Calc.caida` y la misma asignación de dispositivos a lazos.
- Las columnas de dispositivos son los TAG del catálogo presentes en el proyecto, no las abreviaturas del libro (DH, DT, MM…), porque el catálogo trae varios fabricantes.
- Verificado en el navegador, con datos simulados: las corrientes y la caída de la tabla coinciden con `Calc.caida` (SLC 17 mA, NAC 428 mA) y las cantidades por lazo y por nivel coinciden con las filas cargadas.
- **No se hizo:** la pérdida de voceo en dB (el catálogo no trae la potencia de los parlantes), la columna de amplificador de la tabla 5, el Excel y el PDF en este formato, ni la comparación contra el proyecto completo del libro. Las decisiones de la sección 4 siguen abiertas: el cálculo es el de la herramienta.

## 9. Excel en formato libro (2026-11-09)

- Botón **Descargar Excel** en la pestaña «Formato libro» (`js/excel-libro.js`, ExcelJS 4.4.0 desde cdnjs, se carga al exportar). Genera tres hojas con los nombres del libro: «3. Conteo dispositivos», «4. SLC + AUX» y «5. NAC + VOCEO», con los mismos datos que la pantalla.
- R total, caída, tensión disponible, estado y los totales del conteo son fórmulas con su resultado guardado. La tensión de la fuente y la mínima están en las celdas C2 y H2 de las hojas 4 y 5.
- Verificado: el libro se genera, se vuelve a leer con ExcelJS y se comprueban hojas, orientación (carta; apaisada en 4 y 5), fórmulas y resultados contra el cálculo de la herramienta. El botón dispara la descarga sin errores en la consola.
- **No verificado:** el aspecto abierto en Excel real y la impresión. Faltan el PDF en este formato y la pérdida de voceo en dB.

## 10. PDF de la memoria (2026-11-09)

- La memoria de cálculo (pestaña «Memoria de cálculo», botón «Imprimir / Guardar PDF») tiene una casilla nueva, activa por defecto: «Incluir tablas en formato del libro (anexo B, apaisado)».
- El **Anexo B** va en hojas carta apaisadas, con el mismo membrete y pie que la memoria (página con nombre `memoria-apaisada` en `css/styles.css`). Trae tres tablas numeradas a continuación de las anteriores: conteo de dispositivos por nivel, lazos SLC y auxiliar +24 VDC, y lazos NAC y voceo. Las cifras son las de la pestaña «Formato libro» y las del Excel. La nota final de la memoria cierra en la última hoja apaisada.
- Verificado con un proyecto de prueba (2 paneles, 4 niveles, 6 lazos): PDF generado con Chrome sin ventana y revisado con pdf.js. Resultado: 7 páginas, 5 verticales y 2 apaisadas; tablas numeradas del 1 al 10; texto de 8 pt como mínimo; nada fuera del margen; ningún encabezado partido tras ajustar el ancho de las columnas.
- **No verificado:** el diálogo de impresión del navegador y el aspecto en pantalla completa; la lectura visual de las páginas fue a baja resolución. Con muchos TAG distintos en un lazo las columnas se estrechan (el ancho útil apaisado es 23,9 cm).

## 11. Decisiones de cálculo (2026-11-09)

Se resolvieron los puntos 1 y 2 de la sección 4. **No cambia ningún código**: ambos criterios son los que la herramienta ya aplica.

1. **Resistencia del lazo: ida y vuelta (`R = 2 × L × ohm/km / 1000`).** La «Distancia» se entiende como la del dispositivo más lejano del lazo, no como el recorrido total del cable. El libro usa un solo sentido, así que con los mismos datos da la mitad de la caída.
   - Efecto con los 1000 m del libro: los lazos SLC pasan de 16,8 V disponibles (libro, cumplen) a entre 12,6 V y 14,5 V (ida y vuelta, no cumplen). Con 16 AWG y la corriente de alarma de SLC-1, el límite es de unos 600 m.
   - Consecuencia para la comparación con el libro: los estados «Cumple» del libro no se pueden reproducir con las mismas distancias. Para comparar, hay que usar la mitad de la distancia en la herramienta, o confirmar si los 1000 m del libro eran un valor provisional.
2. **Aceptación: tensión disponible de 16 V o más, y corriente del NAC no mayor de 2,4 A.** El libro exige más de 16 V y no revisa la corriente del NAC.

Siguen abiertos los puntos 3 a 5 de la sección 4 (corriente del SLC, consumo del módulo de lazo y modelos del catálogo).

## 12. Revisión del catálogo contra la pestaña «1. Dispositivos» (2026-11-09)

Se compararon los valores del libro con `js/catalogo-base.js` (versión 9, fabricante NOTIFIER). Corrientes en mA. **No se cambió el catálogo**: no hay forma de saber desde aquí cuál valor es el de la ficha vigente.

### Detección (pestaña 1, tabla 1)

| Libro | Modelo del libro | Espera / alarma (libro) | Equivalente en el catálogo | Espera / alarma (catálogo) | Resultado |
|---|---|---|---|---|---|
| DH | FSP-1 | 0,2 / 4,5 | FSP-951 (SDH) · FSP-851 (SDH) | 0,3 / 6,5 · 0,3 / 6,8 | **Difiere** |
| DT | FST-1 | 0,2 / 4,5 | FST-951 (SDT) · FST-851 (SDT) | 0,3 / 6,5 · 0,3 / 6,8 | **Difiere** |
| DH + SB | FSP-1 + B200S-LF | SLC 0,5 / 304,5; aux. 55 / 140 | SB (B200S) 0,5 / 35, en circuito «FUENTE AUX» | 0,5 / 35 | **Difiere** (alarma y aux.) |
| DT + SB | FST-1 + B200S-LF | igual que DH + SB | no existe la combinación; se arma con FST-951 + SB | — | Falta combinación |
| F | NBG-12X | 0,375 / 5 | NBG-12LX (EM) | 0,23 / 5 | **Difiere** (espera) |
| MM | FMM-1 | 0,375 / 5 | FMM-1 (AIM) | 0,375 / 5 | Coincide |
| MR - MC | FRM-1 | 0,23 / 6,5 | FRM-1 (RLY) | 0,23 / 6,5 | Coincide |
| CO | sin modelo en el libro | — | INTELLIQUAD PLUS (CO) | 0,3 / 7,2 | Sin referencia |

El libro no tiene tensión mínima por dispositivo en la herramienta: usa 16 V para detectores y bases y 15 V para estación manual, monitoreo y control. La herramienta aplica una sola tensión mínima por proyecto.

### Notificación (pestaña 1, tabla 2)

El libro trae siete altavoces con estrobo y siete estrobos del modelo BA-FIRE-AVDS-62174, con corrientes de 18, 22, 70, 75, 85, 105 y 125 mA (15, 30, 75, 95, 110, 135 y 185 cd). El catálogo no tiene ese modelo ni ese fabricante. Los equivalentes NOTIFIER del catálogo tienen **otras corrientes**: SR de 15 a 110 cd con 64, 80, 127 y 167 mA. No son comparables sin saber qué producto usa el proyecto. Además, las corrientes de voceo del libro (0,0833 A por altavoz de 2 W, calculadas a 24 V) no tienen equivalente: el catálogo no registra la potencia de los parlantes.

### Equipos de campo del libro

| Libro | Dato | Catálogo |
|---|---|---|
| SLM-318 (módulo de lazo, uno por lazo SLC) | 159 mA espera, 210 mA alarma | No existe |
| DAA2-5070 (amplificador) | 400 mA espera, 550 mA alarma | Coincide (DAA2-5070: 400 / 550) |
| HPF-PS10 y HPF-PS6 (fuentes remotas) | 10 A y 6 A | No existen; el catálogo trae FCPS-24S8 (8 A) |

### Cables (pestaña 1, tabla 3)

| AWG | Libro (modelo, Ω/km) | Catálogo (modelo, Ω/km) | Comentario |
|---|---|---|---|
| 18 | 5320FL, 21 | 5320UL, 21 | Coincide el valor; falta el modelo FL |
| 16 | 5220FL, 12,8 | 5220FL, 13,5 | El catálogo es mayor (conservador) |
| 14 | 5120FL, 8 | 5120UL, 8,4 | El catálogo es mayor (conservador); falta el modelo FL |
| 12 | 5020FL, 5,7 | 5020UL, 5,2 | **El catálogo es menor**: con el valor del catálogo la caída sale unos 9 % más baja; falta el modelo FL |

La capacidad en pF/m del libro no se usa en ningún cálculo y el catálogo no la guarda.

### Qué hay que decidir

1. **Detección:** qué valores rigen para FSP, FST y NBG (libro o catálogo). Conviene confirmarlo contra la ficha vigente del fabricante antes de cambiar nada.
2. **Bases sonoras:** el libro pone 304,5 mA en el lazo SLC y 55 / 140 mA en el auxiliar para la base B200S-LF; el catálogo, 35 mA en la alimentación auxiliar. Es la diferencia de mayor efecto en la caída de los lazos SLC.
3. **Notificación:** si el proyecto usa el modelo BA-FIRE-AVDS-62174, hay que agregarlo al catálogo con su fabricante y sus corrientes.
4. **Módulo de lazo, fuentes remotas y cables FL:** agregar SLM-318, HPF-PS10, HPF-PS6 y los cables 5320FL, 5120FL y 5020FL si el proyecto los usa.

## 13. Catálogo: valores del libro para detectores y base sonora (2026-11-09)

Decisión del usuario: rigen los valores del libro. Catálogo base **versión 10** (`js/catalogo-base.js`). Los modelos existentes no se tocaron; se agregaron cuatro, para que los proyectos ya guardados con FSP-951, FSP-851 y B200S den el mismo resultado de antes.

| Id | Modelo | TAG | Espera / alarma (mA) | Circuito |
|---|---|---|---|---|
| d201 | FSP-1 | SDH | 0,2 / 4,5 | SLC |
| d202 | FST-1 | SDT | 0,2 / 4,5 | SLC |
| d203 | NBG-12X | EM | 0,375 / 5 | SLC |
| d204 | B200S-LF (libro) | SB | 55 / 140 | Fuente auxiliar (24 VDC) |

- **Pendiente en la base sonora.** El libro suma además al lazo SLC 0,3 mA en espera y **300 mA en alarma** por base. Esa parte **no se copió**: la herramienta carga todo el consumo de un dispositivo en un solo lazo, y el valor parece un error de unidades en el libro (la espera usa `300/1000000` y la alarma `300/1000`). Con 30 bases en un lazo serían 9 A. Hay que confirmar la corriente real de la base en el lazo SLC; mientras tanto el lazo solo cuenta la base como dispositivo.
- La combinación «DT + base sonora» sigue armándose con dos filas (FST-1 y B200S-LF).
- **Verificado:** el catálogo carga sin errores y sin ids repetidos (160 dispositivos). Con diez FSP-1, dos FST-1, una NBG-12X y tres bases en un lazo, la corriente del SLC es 59 mA y la del auxiliar 420 mA, como dan las cantidades por las corrientes del catálogo; la espera es 2,775 mA y 165 mA.
- Sin cambio: los cables (5320FL, 5120FL, 5020FL), el modelo BA-FIRE-AVDS-62174, el SLM-318 y las fuentes HPF-PS10 y HPF-PS6 siguen sin estar en el catálogo.

**Decisión (2026-11-09):** la corriente de la base B200S-LF en el lazo SLC se deja **sin modelar**. El lazo SLC cuenta la base como dispositivo y no suma su consumo. Se retoma cuando se confirme la corriente con la ficha del fabricante.
