/* Formato «libro» (Notifier - Memoría de Alarma.xlsx): tablas de conteo, SLC + AUX y NAC + VOCEO.
 * Solo presenta lo que ya calcula Calc: no cambia ninguna fórmula. Las cantidades siguen la misma
 * asignación a lazos que Calc.caida (lazo principal, segundo lazo y lazos combinados).
 * Columnas de dispositivos: una por TAG del catálogo presente en el proyecto (el libro usa DH, DT, MM…
 * porque trae un solo fabricante; la herramienta admite varios). */
(function (global) {
  'use strict';

  var TIPOS_DET = { 'SLC': 1, 'SLC+24V': 1, '24VDC': 1 };
  var TIPOS_NOT = { 'NAC': 1, 'IDNAC': 1, 'VOCEO': 1, 'NAC+VOCEO': 1 };

  function mapaPorId(lista) { var m = {}; (lista || []).forEach(function (x) { m[x.id] = x; }); return m; }
  function nivelesDe(proy) { return (proy.niveles || []).slice(); }

  /* Recorre las filas del proyecto y reparte cantidades y corrientes entre los lazos */
  function repartir(cx, proy) {
    var circs = mapaPorId(proy.caida && proy.caida.circuitos);
    var acum = {};                                    // id de lazo → { tags:{}, niveles:{}, esp, alm, auxEsp, auxAlm }
    var porNivel = {};                                // nivel → { tag → cantidad }
    function a(id) { return acum[id] || (acum[id] = { tags: {}, niveles: {}, esp: 0, alm: 0, auxEsp: 0, auxAlm: 0 }); }
    (proy.paneles || []).concat(proy.fuentes || []).forEach(function (eq) {
      (eq.filas || []).forEach(function (f) {
        if (!f.circ && !f.circ2) return;
        var r = Calc.fila(cx, f), cant = Calc.num(f.cant);
        if (!r.d || !cant) return;
        var t2 = Calc.tipoLazo2De(r.d), lz = f.circ, solo = null, aux = false;
        if (t2) {
          if (Calc.combinado(r.d, circs[f.circ])) lz = f.circ;
          else if (t2 === '24VDC') { lz = f.circ2; solo = f.circ; aux = true; }
          else { lz = f.circ; solo = f.circ2; }
        }
        var esp = r.iEspU === null ? 0 : cant * r.iEspU / 1000, alm = r.iAlmU === null ? 0 : cant * r.iAlmU / 1000;
        function cuenta(id) {
          if (!id) return;
          var x = a(id);
          x.tags[r.tag] = (x.tags[r.tag] || 0) + cant;
          if (f.zona) x.niveles[f.zona] = true;
        }
        cuenta(lz); cuenta(solo);
        if (lz) { var y = a(lz); y.esp += esp; y.alm += alm; }
        if (aux && solo) { var z = a(solo); z.auxEsp += esp; z.auxAlm += alm; }   // corriente a 24 V del dispositivo, mostrada en la fila de su SLC
        if (f.zona) { var n = porNivel[f.zona] || (porNivel[f.zona] = {}); n[r.tag] = (n[r.tag] || 0) + cant; }
      });
    });
    return { acum: acum, porNivel: porNivel };
  }

  function columnasTag(listas) {
    var vistos = {}, cols = [];
    listas.forEach(function (m) { Object.keys(m).forEach(function (t) { if (!vistos[t]) { vistos[t] = 1; cols.push(t); } }); });
    return cols.sort();
  }

  function datos(cx, proy) {
    var rep = repartir(cx, proy);
    var cd = Calc.caida(cx, proy);
    var equipos = mapaPorId((proy.paneles || []).concat(proy.fuentes || []));
    var filas = (proy.caida.circuitos || []).map(function (c, i) {
      var r = cd.circuitos[i], x = rep.acum[c.id] || { tags: {}, niveles: {}, esp: 0, alm: 0, auxEsp: 0, auxAlm: 0 };
      var cab = c.cable ? cx.cables[c.cable] : null;
      var eq = equipos[c.fuente];
      var niv = Object.keys(x.niveles); if (!niv.length && c.nivel) niv = [c.nivel];
      return {
        id: c.id, tipo: c.tipo, equipo: eq ? eq.tag : '—', lazo: c.circuito || '—',
        niveles: niv.length ? niv.join(' · ') : '—',
        tags: x.tags, esp: x.esp, alm: x.alm, auxEsp: x.auxEsp, auxAlm: x.auxAlm,
        otrosA: (Calc.num(c.otros) || 0) / 1000,
        dist: Calc.num(c.long), awg: cab ? cab.awg : null, rKm: r.rKm, rLazo: r.rLazo,
        iA: r.iMa === null ? null : r.iMa / 1000, caida: r.caida, vDisp: r.vDisp, estado: r.estado || '', comentario: r.comentario || ''
      };
    });
    var det = filas.filter(function (f) { return TIPOS_DET[f.tipo]; });
    var not = filas.filter(function (f) { return TIPOS_NOT[f.tipo]; });
    var niveles = nivelesDe(proy);
    Object.keys(rep.porNivel).forEach(function (n) { if (niveles.indexOf(n) < 0) niveles.push(n); });
    return {
      params: cd.params,
      slc: { filas: det, tags: columnasTag(det.map(function (f) { return f.tags; })) },
      nac: { filas: not, tags: columnasTag(not.map(function (f) { return f.tags; })) },
      conteo: { niveles: niveles, porNivel: rep.porNivel, tags: columnasTag(Object.keys(rep.porNivel).map(function (n) { return rep.porNivel[n]; })) }
    };
  }

  global.FormatoLibro = { datos: datos };
})(window);
