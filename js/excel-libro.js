/* Excel en formato «libro» (Notifier - Memoría de Alarma.xlsx): 3. Conteo dispositivos, 4. SLC + AUX y 5. NAC + VOCEO.
 * Usa los mismos datos que la pestaña «Formato libro» (FormatoLibro.datos), de modo que Excel y pantalla coinciden.
 * Las celdas derivadas (R total, caída, tensión disponible, estado y totales) son fórmulas con su resultado guardado.
 * ExcelJS se carga al exportar (cdnjs, versión fija). */
(function (global) {
  'use strict';

  var URL_EXCELJS = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
  var FUENTE = 'Montserrat';
  var VERDE_ENC = 'FFE2EFDA';           // el libro usa un verde muy pálido en los encabezados

  function cargar() {
    if (global.ExcelJS) return Promise.resolve();
    return new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = URL_EXCELJS; s.onload = ok; s.onerror = function () { mal(new Error('No se pudo cargar ExcelJS')); };
      document.head.appendChild(s);
    });
  }

  function col(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  function v(x) { return x === null || x === undefined || !isFinite(x) ? '—' : x; }

  function estiloEnc(c) {
    c.font = { name: FUENTE, size: 9, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_ENC } };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  }
  function estiloDato(c, num, fmt) {
    c.font = { name: FUENTE, size: 9 };
    c.alignment = { horizontal: num ? 'right' : 'left', vertical: 'middle' };
    c.border = { top: { style: 'hair' }, bottom: { style: 'hair' } };
    if (fmt) c.numFmt = fmt;
  }
  function hoja(wb, nombre, titulo, anchos, apaisada) {
    var ws = wb.addWorksheet(nombre, { pageSetup: { paperSize: 1, orientation: apaisada ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.59, right: 0.59, top: 0.79, bottom: 0.79, header: 0.3, footer: 0.3 } } });
    anchos.forEach(function (w, i) { ws.getColumn(i + 1).width = w; });
    var t = ws.getCell('A1'); t.value = titulo; t.font = { name: FUENTE, size: 11, bold: true };
    return ws;
  }
  function fmtN(d) { return d > 0 ? '0.' + new Array(d + 1).join('0') : '0'; }

  /* Encabezado de una fila (fila 4); devuelve la lista de columnas con su letra */
  function encabezar(ws, fila, nombres) {
    nombres.forEach(function (n, i) { var c = ws.getCell(fila, i + 1); c.value = n; estiloEnc(c); });
    ws.getRow(fila).height = 42;
    ws.views = [{ state: 'frozen', ySplit: fila }];
    ws.pageSetup.printTitlesRow = fila + ':' + fila;
  }

  function hojaConteo(wb, D) {
    var C = D.conteo, nCol = C.tags.length + 2;
    var ws = hoja(wb, '3. Conteo dispositivos', 'CONTEO DE DISPOSITIVOS POR NIVEL', [26].concat(C.tags.map(function () { return 11; }), [11]), nCol > 9);
    encabezar(ws, 3, ['Nivel'].concat(C.tags, ['Total']));
    var f0 = 4;
    C.niveles.forEach(function (n, i) {
      var r = f0 + i, fila = C.porNivel[n] || {}, tot = 0;
      var c0 = ws.getCell(r, 1); c0.value = n; estiloDato(c0, false);
      C.tags.forEach(function (t, j) { var c = ws.getCell(r, 2 + j); c.value = fila[t] || 0; tot += fila[t] || 0; estiloDato(c, true, '0'); });
      var ct = ws.getCell(r, nCol);
      ct.value = C.tags.length ? { formula: 'SUM(B' + r + ':' + col(nCol - 1) + r + ')', result: tot } : 0; estiloDato(ct, true, '0');
    });
    var rt = f0 + C.niveles.length, ct0 = ws.getCell(rt, 1); ct0.value = 'Total'; ct0.font = { name: FUENTE, size: 9, bold: true };
    for (var j = 2; j <= nCol; j++) {
      var c = ws.getCell(rt, j), suma = 0;
      if (j < nCol) C.niveles.forEach(function (n) { suma += (C.porNivel[n] || {})[C.tags[j - 2]] || 0; });
      else C.tags.forEach(function (t) { C.niveles.forEach(function (n) { suma += (C.porNivel[n] || {})[t] || 0; }); });
      c.value = C.niveles.length ? { formula: 'SUM(' + col(j) + f0 + ':' + col(j) + (rt - 1) + ')', result: suma } : 0;
      c.font = { name: FUENTE, size: 9, bold: true }; c.alignment = { horizontal: 'right' }; c.numFmt = '0';
      c.border = { top: { style: 'thin' } };
    }
  }

  /* Parámetros de caída en las celdas B2 (V fuente) y D2 (V mínima) de las hojas 4 y 5 */
  function parametros(ws, P) {
    ws.getCell('A2').value = 'V fuente a fin de vida (V)'; ws.getCell('A2').font = { name: FUENTE, size: 9 };
    var b = ws.getCell('C2'); b.value = P.vFuente; b.numFmt = '0.00'; b.font = { name: FUENTE, size: 9, bold: true };
    ws.getCell('D2').value = 'V mínima de dispositivo (V)'; ws.getCell('D2').font = { name: FUENTE, size: 9 };
    var m = ws.getCell('H2'); m.value = P.vMin; m.numFmt = '0.00'; m.font = { name: FUENTE, size: 9, bold: true };
  }

  /* Bloque común de cableado: distancia, calibre, R/km, R total, caída, V disp., estado. Devuelve la letra de cada columna. */
  function cableado(ws, r, c0, f, iCol, P) {
    var L = col(c0), K = col(c0 + 2), RT = col(c0 + 3), CA = col(c0 + 4), VD = col(c0 + 5), I = col(iCol);
    function put(j, val, d) { var c = ws.getCell(r, j); c.value = val; estiloDato(c, typeof val !== 'string' || val === '—', d === undefined ? undefined : fmtN(d)); return c; }
    put(c0, v(f.dist), 0); put(c0 + 1, v(f.awg), 0); put(c0 + 2, v(f.rKm), 2);
    var ok = f.dist !== null && f.rKm !== null && f.iA !== null;
    put(c0 + 3, ok ? { formula: '2*' + L + r + '/1000*' + K + r, result: f.rLazo } : '—', 3);
    put(c0 + 4, ok ? { formula: I + r + '*' + RT + r, result: f.caida } : '—', 2);
    put(c0 + 5, ok ? { formula: '$C$2-' + CA + r, result: f.vDisp } : '—', 2);
    put(c0 + 6, ok ? { formula: 'IF(' + VD + r + '>=$H$2,"Cumple","No cumple")', result: f.vDisp >= P.vMin - 1e-9 ? 'Cumple' : 'No cumple' } : (f.estado || '—'));
  }

  function hojaSlc(wb, D) {
    var S = D.slc, nT = S.tags.length, c0 = 4 + nT;                 // A panel, B lazo, C niveles, luego tags
    var ancho = [18, 12, 22].concat(S.tags.map(function () { return 8; }), [11, 11, 11, 11, 11, 9, 11, 11, 11, 11, 12]);
    var ws = hoja(wb, '4. SLC + AUX', 'DECLARACIÓN LAZOS SLC / AUXILIAR +24 VDC', ancho, true);
    parametros(ws, D.params);
    encabezar(ws, 4, ['Panel', 'Lazo', 'Nivel / es'].concat(S.tags, ['SLC espera (A)', 'SLC alarma (A)', 'Aux. espera (A)', 'Aux. alarma (A)', 'Distancia (m)', 'Calibre (AWG)', 'R (Ω/km)', 'R total (Ω)', 'Caída (V)', 'V disp. (V)', 'Estado']));
    S.filas.forEach(function (f, i) {
      var r = 5 + i;
      [f.equipo, f.lazo, f.niveles].forEach(function (x, j) { var c = ws.getCell(r, 1 + j); c.value = x; estiloDato(c, false); });
      S.tags.forEach(function (t, j) { var c = ws.getCell(r, 4 + j); c.value = f.tags[t] || 0; estiloDato(c, true, '0'); });
      [f.esp, f.alm, f.auxEsp, f.auxAlm].forEach(function (x, j) { var c = ws.getCell(r, c0 + j); c.value = x; estiloDato(c, true, '0.0000'); });
      cableado(ws, r, c0 + 4, f, c0 + 1, D.params);
    });
    if (!S.filas.length) { var c = ws.getCell(5, 1); c.value = 'Sin lazos SLC, SLC+24V o 24 VDC.'; c.font = { name: FUENTE, size: 9 }; }
  }

  function hojaNac(wb, D) {
    var N = D.nac, nT = N.tags.length, c0 = 5 + nT;                 // A fuente, B lazo, C tipo, D niveles, luego tags
    var ancho = [18, 12, 12, 22].concat(N.tags.map(function () { return 9; }), [12, 11, 9, 11, 11, 11, 11, 12]);
    var ws = hoja(wb, '5. NAC + VOCEO', 'DECLARACIÓN LAZOS NAC / VOCEO', ancho, true);
    parametros(ws, D.params);
    encabezar(ws, 4, ['Fuente de poder remota o panel', 'Lazo', 'Tipo', 'Nivel / es'].concat(N.tags, ['Corriente de alarma (A)', 'Distancia (m)', 'Calibre (AWG)', 'R (Ω/km)', 'R total (Ω)', 'Caída (V)', 'V disp. (V)', 'Estado']));
    N.filas.forEach(function (f, i) {
      var r = 5 + i;
      [f.equipo, f.lazo, f.tipo, f.niveles].forEach(function (x, j) { var c = ws.getCell(r, 1 + j); c.value = x; estiloDato(c, false); });
      N.tags.forEach(function (t, j) { var c = ws.getCell(r, 5 + j); c.value = f.tags[t] || 0; estiloDato(c, true, '0'); });
      var ci = ws.getCell(r, c0); ci.value = v(f.iA); estiloDato(ci, true, '0.0000');
      cableado(ws, r, c0 + 1, f, c0, D.params);
    });
    if (!N.filas.length) { var c = ws.getCell(5, 1); c.value = 'Sin lazos NAC, IDNAC o voceo.'; c.font = { name: FUENTE, size: 9 }; }
  }

  /* Devuelve una promesa con el libro como ArrayBuffer */
  function generar(D, titulo) {
    return cargar().then(function () {
      var wb = new ExcelJS.Workbook();
      wb.creator = 'Sinergia'; wb.title = titulo || 'Memoria de alarma';
      hojaConteo(wb, D); hojaSlc(wb, D); hojaNac(wb, D);
      return wb.xlsx.writeBuffer();
    });
  }

  global.ExcelLibro = { generar: generar };
})(window);
