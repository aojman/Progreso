import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

// ─── jsPDF loader ────────────────────────────────────────────────────────────
function loadJsPDF() {
  return new Promise((resolve) => {
    if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => resolve(window.jspdf.jsPDF);
    document.head.appendChild(s);
  });
}

function generarPDF(data, st) {
  loadJsPDF().then((JsPDF) => {
    const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210, margin = 16;
    let y = 0;

    // ── Header band ──────────────────────────────────────────────────────────
    doc.setFillColor(6, 78, 59);
    doc.rect(0, 0, W, 36, "F");
    doc.setTextColor(110, 231, 183);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Mi Progreso de Salud", margin, 18);
    doc.setFontSize(9);
    doc.setTextColor(100, 200, 150);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado el ${new Date().toLocaleDateString("es-ES", { day:"2-digit", month:"long", year:"numeric" })}  ·  ${data[0]?.date} - ${data[data.length-1]?.date}`, margin, 28);
    y = 48;

    // ── Stat boxes ───────────────────────────────────────────────────────────
    const boxes = [
      { l: "Bajada total",      v: `${st.bajada} kg`,       sub: `${st.pi} kg → ${st.pa} kg` },
      { l: "Minimo historico",  v: `${st.pm} kg`,            sub: st.pmDate },
      { l: "Km totales",        v: `${st.kmTotal} km`,       sub: `${st.diasActivos} dias activos` },
      { l: "Inyecciones",       v: `${st.inyecciones}`,      sub: `${st.vuelos} vuelos` },
    ];
    const bw = (W - margin*2 - 9) / 2;
    boxes.forEach((b, i) => {
      const x = margin + (i % 2) * (bw + 9);
      const by = y + Math.floor(i / 2) * 26;
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(x, by, bw, 22, 3, 3, "F");
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text(b.l.toUpperCase(), x + 5, by + 7);
      doc.setFontSize(14);
      doc.setTextColor(110, 231, 183);
      doc.setFont("helvetica", "bold");
      doc.text(b.v, x + 5, by + 16);
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text(b.sub, x + bw - 5, by + 16, { align: "right" });
    });
    y += 58;

    // ── Section title ────────────────────────────────────────────────────────
    doc.setFillColor(6, 78, 59);
    doc.rect(margin, y, W - margin*2, 8, "F");
    doc.setFontSize(9);
    doc.setTextColor(110, 231, 183);
    doc.setFont("helvetica", "bold");
    doc.text("REGISTRO COMPLETO", margin + 4, y + 5.5);
    y += 12;

    // ── Table header ─────────────────────────────────────────────────────────
    const cols = [
      { h:"Fecha",  w:22 },
      { h:"Peso",   w:20 },
      { h:"Km",     w:18 },
      { h:"Vuelo",  w:16 },
      { h:"Inyyec.", w:16 },
      { h:"Nota",   w: W - margin*2 - 22-20-18-16-16 },
    ];
    let x = margin;
    doc.setFillColor(22, 33, 62);
    doc.rect(margin, y, W - margin*2, 7, "F");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 231, 183);
    doc.setFont("helvetica", "bold");
    cols.forEach(c => { doc.text(c.h, x + 2, y + 5); x += c.w; });
    y += 8;

    // ── Table rows ───────────────────────────────────────────────────────────
    const rowH = 6.5;
    data.forEach((row, i) => {
      if (y > 272) {
        doc.addPage();
        y = 16;
        // re-draw header on new page
        x = margin;
        doc.setFillColor(22, 33, 62);
        doc.rect(margin, y, W - margin*2, 7, "F");
        doc.setFontSize(7.5);
        doc.setTextColor(110, 231, 183);
        doc.setFont("helvetica", "bold");
        cols.forEach(c => { doc.text(c.h, x + 2, y + 5); x += c.w; });
        y += 8;
      }
      if (i % 2 === 0) {
        doc.setFillColor(15, 23, 42);
        doc.rect(margin, y, W - margin*2, rowH, "F");
      }
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      x = margin;
      // date
      doc.setTextColor(148, 163, 184);
      doc.text(row.date, x + 2, y + 4.5); x += cols[0].w;
      // peso
      doc.setTextColor(row.peso ? 241 : 55, row.peso ? 245 : 65, row.peso ? 249 : 81);
      doc.text(row.peso ? `${row.peso} kg` : "—", x + 2, y + 4.5); x += cols[1].w;
      // km
      const kmColor = row.km > 0 ? [147,197,253] : row.km === 0 ? [239,68,68] : [55,65,81];
      doc.setTextColor(...kmColor);
      doc.text(row.km != null ? (row.km > 0 ? `${row.km} km` : "0") : "—", x + 2, y + 4.5); x += cols[2].w;
      // vuelo
      doc.setTextColor(147, 197, 253);
      doc.text(row.vuelo ? "Si" : "", x + 2, y + 4.5); x += cols[3].w;
      // iny
      doc.setTextColor(244, 114, 182);
      doc.text(row.iny ? "Si" : "", x + 2, y + 4.5); x += cols[4].w;
      // nota
      doc.setTextColor(107, 114, 128);
      const notaText = [row.gym ? "Gym" : "", row.nota].filter(Boolean).join(" · ");
      doc.text(notaText.substring(0, 38), x + 2, y + 4.5);
      y += rowH;
    });

    // ── Footer ───────────────────────────────────────────────────────────────
    const pages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(55, 65, 81);
      doc.setFont("helvetica", "normal");
      doc.text(`Pagina ${p} de ${pages}`, W - margin, 290, { align: "right" });
    }

    doc.save("mi-progreso-salud.pdf");
  });
}

const SEED = [
  { date:"04/03", peso:100.7, km:null, vuelo:false, iny:false, gym:false, nota:"" },
  { date:"27/03", peso:100.0, km:null, vuelo:false, iny:true,  gym:false, nota:"1ª inyección" },
  { date:"28/03", peso:99.2,  km:null, vuelo:false, iny:false, gym:false, nota:"" },
  { date:"29/03", peso:99.0,  km:5,   vuelo:false, iny:false, gym:false, nota:"" },
  { date:"30/03", peso:98.8,  km:5,   vuelo:false, iny:false, gym:false, nota:"" },
  { date:"31/03", peso:97.9,  km:5,   vuelo:false, iny:false, gym:false, nota:"" },
  { date:"01/04", peso:97.8,  km:4.7, vuelo:false, iny:false, gym:false, nota:"" },
  { date:"02/04", peso:97.1,  km:7.5, vuelo:false, iny:false, gym:false, nota:"" },
  { date:"03/04", peso:97.4,  km:null,vuelo:false, iny:true,  gym:false, nota:"2ª inyección" },
  { date:"04/04", peso:97.4,  km:3,   vuelo:false, iny:false, gym:false, nota:"" },
  { date:"05/04", peso:97.7,  km:7.5, vuelo:false, iny:false, gym:false, nota:"" },
  { date:"06/04", peso:97.9,  km:0,   vuelo:false, iny:false, gym:false, nota:"No caminé, comí poco" },
  { date:"07/04", peso:96.9,  km:7,   vuelo:false, iny:false, gym:false, nota:"" },
  { date:"08/04", peso:96.7,  km:7,   vuelo:false, iny:false, gym:false, nota:"" },
  { date:"09/04", peso:96.3,  km:10,  vuelo:false, iny:false, gym:false, nota:"" },
  { date:"10/04", peso:96.4,  km:7,   vuelo:false, iny:false, gym:false, nota:"" },
  { date:"11/04", peso:96.0,  km:3,   vuelo:false, iny:false, gym:false, nota:"" },
  { date:"12/04", peso:95.8,  km:3,   vuelo:false, iny:false, gym:false, nota:"" },
  { date:"13/04", peso:95.6,  km:5,   vuelo:true,  iny:false, gym:false, nota:"Viaje a PTY" },
  { date:"14/04", peso:null,  km:4,   vuelo:false, iny:false, gym:false, nota:"PTY" },
  { date:"15/04", peso:null,  km:5,   vuelo:false, iny:false, gym:false, nota:"PTY" },
  { date:"16/04", peso:null,  km:5,   vuelo:false, iny:false, gym:false, nota:"PTY" },
  { date:"17/04", peso:null,  km:5.5, vuelo:false, iny:false, gym:false, nota:"PTY" },
  { date:"18/04", peso:null,  km:3,   vuelo:true,  iny:false, gym:false, nota:"Regreso de PTY" },
  { date:"19/04", peso:94.1,  km:0,   vuelo:false, iny:false, gym:false, nota:"" },
  { date:"20/04", peso:94.8,  km:0,   vuelo:true,  iny:false, gym:false, nota:"Viaje a Chile" },
  { date:"21/04", peso:null,  km:2,   vuelo:false, iny:false, gym:true,  nota:"Gimnasio 30 min" },
  { date:"22/04", peso:null,  km:4,   vuelo:false, iny:false, gym:false, nota:"Chile" },
  { date:"23/04", peso:null,  km:5,   vuelo:false, iny:false, gym:false, nota:"Chile" },
  { date:"24/04", peso:null,  km:3,   vuelo:false, iny:false, gym:false, nota:"Chile" },
  { date:"25/04", peso:93.0,  km:4,   vuelo:false, iny:false, gym:false, nota:"" },
  { date:"26/04", peso:93.3,  km:3,   vuelo:false, iny:false, gym:false, nota:"" },
  { date:"27/04", peso:93.2,  km:3,   vuelo:true,  iny:false, gym:false, nota:"Viaje a Panamá" },
  { date:"28/04", peso:null,  km:3,   vuelo:false, iny:false, gym:false, nota:"Panamá" },
];

const SK = "ht_v5";
const loadData = () => { try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : SEED; } catch { return SEED; } };

function calcStats(data) {
  const wp = data.filter(d => d.peso != null);
  const pi = wp[0]?.peso ?? 0;
  const pa = wp[wp.length-1]?.peso ?? 0;
  const pm = wp.length ? Math.min(...wp.map(d => d.peso)) : 0;
  const pmDate = data.find(d => d.peso === pm)?.date ?? "";
  const kmTotal = +data.reduce((s,d) => s+(d.km??0), 0).toFixed(1);
  const diasActivos = data.filter(d => (d.km??0) > 0).length;
  const vuelos = data.filter(d => d.vuelo).length;
  const inyecciones = data.filter(d => d.iny).length;
  return { pi, pa, pm, pmDate, kmTotal, diasActivos, vuelos, inyecciones, bajada:+(pi-pa).toFixed(1), bajadaMax:+(pi-pm).toFixed(1) };
}

const C = {
  bg:"#070c17", card:"rgba(255,255,255,0.04)", border:"rgba(255,255,255,0.08)",
  green:"#6ee7b7", teal:"#2dd4bf", blue:"#93c5fd", amber:"#fcd34d",
  pink:"#f472b6", muted:"#6b7280", text:"#f1f5f9", sub:"#94a3b8", nav:"#0d1424"
};

const Tip = ({ active, payload, label, allData }) => {
  if (!active || !payload?.length) return null;
  const row = (allData||[]).find(d => d.date===label) || {};
  return (
    <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:10, padding:"9px 13px", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
      <p style={{ color:C.green, fontWeight:700, marginBottom:4 }}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{ color:p.color, margin:"2px 0" }}>{p.name}: <b>{p.value}{p.name==="Peso"?" kg":" km"}</b></p>)}
      {(row.iny||row.vuelo||row.gym) && (
        <p style={{ color:C.sub, marginTop:5, fontSize:11 }}>
          {[row.iny&&"💉",row.vuelo&&"✈️",row.gym&&"🏋️"].filter(Boolean).join("  ")}
        </p>
      )}
      {row.nota && <p style={{ color:"#4b5563", fontSize:11, marginTop:2 }}>{row.nota}</p>}
    </div>
  );
};

const Check = ({ checked, onChange, icon, label, sub, color }) => (
  <div onClick={() => onChange(!checked)} style={{
    display:"flex", alignItems:"center", gap:12, cursor:"pointer",
    background: checked ? `${color}12` : "rgba(255,255,255,0.03)",
    border:`1.5px solid ${checked ? color : "rgba(255,255,255,0.08)"}`,
    borderRadius:14, padding:"14px 16px", transition:"all 0.15s", userSelect:"none"
  }}>
    <div style={{
      width:26, height:26, borderRadius:8, flexShrink:0, transition:"all 0.15s",
      background: checked ? color : "rgba(255,255,255,0.06)",
      border:`2px solid ${checked ? color : "#374151"}`,
      display:"flex", alignItems:"center", justifyContent:"center"
    }}>
      {checked && <span style={{ color:"#000", fontSize:15, fontWeight:900, lineHeight:1 }}>✓</span>}
    </div>
    <div>
      <div style={{ fontSize:15, fontWeight:600, color: checked ? color : C.text, fontFamily:"'DM Sans',sans-serif" }}>{icon} {label}</div>
      <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginTop:1 }}>{sub}</div>
    </div>
  </div>
);

// ── Events chart with annotated dots ─────────────────────────────────────────
const EventsDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload) return null;
  if (payload.iny)   return <g><circle cx={cx} cy={cy} r={7} fill={C.pink} stroke="#070c17" strokeWidth={2}/><text x={cx} y={cy-13} textAnchor="middle" fontSize={11}>💉</text></g>;
  if (payload.vuelo) return <g><circle cx={cx} cy={cy} r={6} fill={C.blue} stroke="#070c17" strokeWidth={2}/><text x={cx} y={cy-13} textAnchor="middle" fontSize={11}>✈️</text></g>;
  if (payload.isMin) return <g><circle cx={cx} cy={cy} r={7} fill={C.amber} stroke="#070c17" strokeWidth={2}/><text x={cx} y={cy-13} textAnchor="middle" fontSize={10} fill={C.amber} fontWeight="700">MIN</text></g>;
  return <circle cx={cx} cy={cy} r={2.5} fill={C.green} />;
};

export default function App() {
  const [data,  setData]  = useState(loadData);
  const [tab,   setTab]   = useState("reg");   // ← starts on registro
  const [toast, setToast] = useState("");

  const now = new Date();
  const def = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}`;
  const [fDate,  setFDate]  = useState(def);
  const [fPeso,  setFPeso]  = useState("");
  const [fKm,    setFKm]    = useState("");
  const [fVuelo, setFVuelo] = useState(false);
  const [fIny,   setFIny]   = useState(false);
  const [fGym,   setFGym]   = useState(false);
  const [fNota,  setFNota]  = useState("");

  useEffect(() => { try { localStorage.setItem(SK, JSON.stringify(data)); } catch {} }, [data]);

  const st       = calcStats(data);
  const pesoData = data.filter(d => d.peso != null).map(d => ({ ...d, isMin: d.peso === st.pm }));
  const kmData   = data.filter(d => d.km   != null);
  const lastPeso = pesoData[pesoData.length-1];

  function toast2(m) { setToast(m); setTimeout(()=>setToast(""), 2300); }

  function handleSave() {
    if (!fDate.match(/^\d{2}\/\d{2}$/)) { toast2("⚠️ Formato: DD/MM"); return; }
    const tags = [fIny&&"💉 Inyección", fGym&&"🏋️ Gym", fVuelo&&"✈️ Vuelo"].filter(Boolean);
    const notaFinal = [fNota, ...tags].filter(Boolean).join(" · ");
    const entry = { date:fDate, peso:fPeso!==""?+fPeso:null, km:fKm!==""?+fKm:null, vuelo:fVuelo, iny:fIny, gym:fGym, nota:notaFinal };
    const idx = data.findIndex(d => d.date===fDate);
    let next;
    if (idx>=0) { next=[...data]; next[idx]=entry; toast2("✏️ Actualizado"); }
    else {
      next = [...data, entry].sort((a,b) => {
        const [da,ma]=a.date.split("/").map(Number), [db,mb]=b.date.split("/").map(Number);
        return ma!==mb ? ma-mb : da-db;
      });
      toast2("✅ ¡Guardado!");
    }
    setData(next);
    setFPeso(""); setFKm(""); setFVuelo(false); setFIny(false); setFGym(false); setFNota("");
  }

  const inp = {
    width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)",
    borderRadius:12, padding:"14px 16px", color:C.text, fontSize:16, outline:"none",
    fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", transition:"border 0.15s"
  };

  const label = (txt) => (
    <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.9px", fontWeight:700, marginBottom:6 }}>{txt}</div>
  );

  // Bottom nav items
  const NAV = [
    { id:"reg",    icon:"📝", l:"Registrar" },
    { id:"dash",   icon:"📊", l:"Resumen"   },
    { id:"graf",   icon:"📈", l:"Gráficas"  },
    { id:"events", icon:"🗓", l:"Eventos"   },
    { id:"tabla",  icon:"📋", l:"Tabla"     },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input::placeholder{color:#374151;}
        input:focus{border-color:rgba(110,231,183,0.5) !important;}
      `}</style>

      {toast && (
        <div style={{
          position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
          background:"#064e3b", color:C.green, borderRadius:30, padding:"9px 24px",
          fontSize:13, fontFamily:"'DM Sans',sans-serif", zIndex:999, fontWeight:700,
          boxShadow:"0 4px 28px rgba(0,0,0,0.8)", whiteSpace:"nowrap"
        }}>{toast}</div>
      )}

      {/* ── CONTENT ──────────────────────────────────────── */}
      <div style={{ padding:"24px 16px 0" }}>

        {/* ══ REGISTRO (pantalla principal) ══════════════ */}
        {tab==="reg" && (
          <>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:C.green, marginBottom:4 }}>
              Registrar día
            </h2>
            {lastPeso && (
              <p style={{ fontSize:12, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginBottom:20 }}>
                Último peso: <span style={{ color:C.green, fontWeight:700 }}>{lastPeso.peso} kg</span> · {lastPeso.date}
              </p>
            )}

            {/* Fecha */}
            <div style={{ marginBottom:14 }}>
              {label("FECHA  (DD/MM)")}
              <input style={inp} value={fDate} onChange={e=>setFDate(e.target.value)} placeholder="28/04" />
            </div>

            {/* Peso */}
            <div style={{ marginBottom:14 }}>
              {label("PESO  (kg)")}
              <input style={inp} type="number" step="0.1" value={fPeso} onChange={e=>setFPeso(e.target.value)} placeholder="93.0  —  dejar vacío si no te pesaste" />
            </div>

            {/* Km */}
            <div style={{ marginBottom:20 }}>
              {label("KILÓMETROS CAMINADOS")}
              <input style={inp} type="number" step="0.1" value={fKm} onChange={e=>setFKm(e.target.value)} placeholder="5.0  —  dejar vacío si no caminaste" />
            </div>

            {/* Checkboxes */}
            {label("¿QUÉ MÁS PASÓ HOY?")}
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
              <Check checked={fVuelo} onChange={setFVuelo} icon="✈️" label="Viajé en avión"        sub="Marcar si hubo vuelo este día"         color={C.blue}  />
              <Check checked={fIny}   onChange={setFIny}   icon="💉" label="Me apliqué inyección"  sub="Registrar dosis del tratamiento"       color={C.pink}  />
              <Check checked={fGym}   onChange={setFGym}   icon="🏋️" label="Fui al gimnasio"       sub="Sesión de entrenamiento"               color={C.amber} />
            </div>

            {/* Comentario */}
            <div style={{ marginBottom:24 }}>
              {label("COMENTARIO  (opcional)")}
              <input style={inp} value={fNota} onChange={e=>setFNota(e.target.value)} placeholder="ej: comí afuera, viaje a Buenos Aires..." />
            </div>

            <button onClick={handleSave} style={{
              width:"100%", padding:"16px",
              background:`linear-gradient(135deg, ${C.green}, ${C.teal})`,
              border:"none", borderRadius:14, color:"#052e16",
              fontSize:16, fontWeight:800, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.3px"
            }}>
              Guardar registro
            </button>
          </>
        )}

        {/* ══ DASHBOARD ══════════════════════════════════ */}
        {tab==="dash" && (
          <>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:C.green }}>Resumen</h2>
              <button onClick={() => { toast2("⏳ Generando PDF..."); setTimeout(() => generarPDF(data, st), 100); }} style={{
                display:"flex", alignItems:"center", gap:7, padding:"9px 16px",
                background:"linear-gradient(135deg,#6ee7b7,#2dd4bf)",
                border:"none", borderRadius:30, cursor:"pointer",
                fontSize:13, fontWeight:800, color:"#052e16",
                fontFamily:"'DM Sans',sans-serif", boxShadow:"0 2px 12px rgba(110,231,183,0.3)"
              }}>
                <span style={{ fontSize:16 }}>📤</span> Compartir
              </button>
            </div>

            {/* Hero */}
            <div style={{ background:C.card, border:`1px solid rgba(110,231,183,0.2)`, borderRadius:16, padding:"20px", marginBottom:12, textAlign:"center" }}>
              <div style={{ fontSize:10, color:C.muted, fontFamily:"'DM Sans',sans-serif", letterSpacing:"1.2px" }}>BAJASTE EN TOTAL</div>
              <div style={{ fontSize:58, fontWeight:800, fontFamily:"'DM Serif Display',serif", lineHeight:1.1, marginTop:4,
                background:`linear-gradient(135deg,${C.green},${C.teal})`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                {st.bajada} kg
              </div>
              <div style={{ fontSize:13, color:C.sub, marginTop:6, fontFamily:"'DM Sans',sans-serif" }}>
                {st.pi} kg → {st.pa} kg &nbsp;·&nbsp; último peso {lastPeso?.date}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
              {[
                { l:"Mínimo histórico", v:`${st.pm} kg`,        c:C.amber, s:st.pmDate },
                { l:"Bajada máxima",   v:`↓ ${st.bajadaMax} kg`,c:C.teal,  s:`vs ${st.pi} kg inicial` },
                { l:"Km totales",      v:`${st.kmTotal} km`,    c:C.blue,  s:`${st.diasActivos} días activos` },
                { l:"Inyecciones",     v:`${st.inyecciones} 💉`,c:C.pink,  s:`${st.vuelos} vuelos ✈️` },
              ].map((s,i) => (
                <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px" }}>
                  <div style={{ fontSize:10, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginBottom:3 }}>{s.l}</div>
                  <div style={{ fontSize:21, fontWeight:800, color:s.c, fontFamily:"'DM Serif Display',serif" }}>{s.v}</div>
                  <div style={{ fontSize:10, color:"#374151", marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>{s.s}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ GRÁFICAS ═══════════════════════════════════ */}
        {tab==="graf" && (
          <>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:C.green, marginBottom:16 }}>Gráficas</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Peso */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 10px" }}>
                <p style={{ fontSize:12, color:C.green, fontFamily:"'DM Sans',sans-serif", fontWeight:700, marginBottom:12, paddingLeft:4 }}>⚖️ Peso (kg)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={pesoData} margin={{ top:8, right:8, left:-24, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:9 }} interval={2} />
                    <YAxis domain={[91,102]} tick={{ fill:C.muted, fontSize:9 }} />
                    <Tooltip content={<Tip allData={data}/>}/>
                    <Line type="monotone" dataKey="peso" name="Peso" stroke={C.green} strokeWidth={2.5} dot={{ r:3, fill:C.green }} activeDot={{ r:6 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Km */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 10px" }}>
                <p style={{ fontSize:12, color:C.blue, fontFamily:"'DM Sans',sans-serif", fontWeight:700, marginBottom:12, paddingLeft:4 }}>🚶 Kilómetros por día</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={kmData} margin={{ top:4, right:8, left:-24, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:9 }} interval={2} />
                    <YAxis tick={{ fill:C.muted, fontSize:9 }} />
                    <Tooltip content={<Tip allData={data}/>}/>
                    <Bar dataKey="km" name="Km" radius={[4,4,0,0]}>
                      {kmData.map((e,i) => <Cell key={i} fill={e.km>=7?C.teal:e.km>=4?C.blue:e.km>0?"#818cf8":"#374151"} opacity={0.85}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p style={{ fontSize:10, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginTop:8, paddingLeft:4 }}>
                  🟣 1–4 km &nbsp;·&nbsp; 🔵 4–7 km &nbsp;·&nbsp; 🩵 7+ km
                </p>
              </div>
            </div>
          </>
        )}

        {/* ══ EVENTOS ════════════════════════════════════ */}
        {tab==="events" && (
          <>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:C.green, marginBottom:16 }}>Eventos</h2>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 10px", marginBottom:14 }}>
              <p style={{ fontSize:12, color:C.text, fontFamily:"'DM Sans',sans-serif", fontWeight:700, marginBottom:4, paddingLeft:4 }}>Peso con eventos</p>
              <p style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginBottom:14, paddingLeft:4 }}>💉 Inyección · ✈️ Vuelo · MIN mínimo histórico</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={pesoData} margin={{ top:16, right:8, left:-24, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:9 }} interval={2} />
                  <YAxis domain={[91,102]} tick={{ fill:C.muted, fontSize:9 }} />
                  <Tooltip content={<Tip allData={data}/>}/>
                  <Line type="monotone" dataKey="peso" name="Peso" stroke={C.green} strokeWidth={2} dot={<EventsDot/>} activeDot={{ r:6, fill:C.teal }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Event list */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {data.filter(d => d.iny || d.vuelo || (d.peso!=null && d.peso===st.pm)).map((d,i) => {
                const icon  = d.iny ? "💉" : d.vuelo ? "✈️" : "⭐";
                const color = d.iny ? C.pink : d.vuelo ? C.blue : C.amber;
                const lbl   = d.iny ? d.nota : d.vuelo ? d.nota : `Mínimo histórico`;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:C.card, border:`1px solid ${C.border}`, borderRadius:11, padding:"10px 14px" }}>
                    <span style={{ fontSize:18 }}>{icon}</span>
                    <span style={{ fontSize:12, color:C.sub, fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>{d.date}</span>
                    <span style={{ fontSize:13, color, fontWeight:600, fontFamily:"'DM Sans',sans-serif", flex:1 }}>{lbl}</span>
                    {d.peso!=null && <span style={{ fontSize:13, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>{d.peso} kg</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══ TABLA ══════════════════════════════════════ */}
        {tab==="tabla" && (
          <>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:C.green, marginBottom:16 }}>Tabla completa</h2>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
                <thead>
                  <tr style={{ background:"rgba(110,231,183,0.08)" }}>
                    {["Fecha","Peso","Km","","Nota"].map((h,i)=>(
                      <th key={i} style={{ padding:"10px 8px", textAlign:"left", color:C.green, fontSize:10, fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...data].reverse().map((row,i)=>(
                    <tr key={i} style={{ borderBottom:`1px solid rgba(255,255,255,0.04)`, background:i%2===0?"transparent":"rgba(255,255,255,0.015)" }}>
                      <td style={{ padding:"8px 8px", color:C.sub, fontWeight:600 }}>{row.date}</td>
                      <td style={{ padding:"8px 8px", color:row.peso?C.text:"#374151", fontWeight:row.peso?700:400 }}>{row.peso??"-"}</td>
                      <td style={{ padding:"8px 8px", color:row.km>0?C.blue:row.km===0?"#ef4444":"#374151" }}>
                        {row.km!=null?(row.km>0?row.km:"0"):"-"}
                      </td>
                      <td style={{ padding:"8px 6px", fontSize:13 }}>
                        {[row.vuelo&&"✈️", row.iny&&"💉", row.gym&&"🏋️"].filter(Boolean).join("")}
                      </td>
                      <td style={{ padding:"8px 8px", color:"#4b5563", fontSize:11, maxWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.nota}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── BOTTOM NAV ───────────────────────────────────── */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0,
        background:C.nav, borderTop:"1px solid rgba(255,255,255,0.07)",
        display:"flex", padding:"8px 0 10px", zIndex:100
      }}>
        {NAV.map(n => (
          <button key={n.id} onClick={()=>setTab(n.id)} style={{
            flex:1, border:"none", background:"transparent", cursor:"pointer",
            display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"4px 2px"
          }}>
            <span style={{ fontSize:20 }}>{n.icon}</span>
            <span style={{ fontSize:10, fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              color: tab===n.id ? C.green : C.muted, transition:"color 0.15s"
            }}>{n.l}</span>
            {tab===n.id && (
              <div style={{ width:20, height:2, borderRadius:2, background:C.green, marginTop:1 }}/>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
