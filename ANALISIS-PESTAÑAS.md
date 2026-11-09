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
