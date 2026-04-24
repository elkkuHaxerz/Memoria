import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCAGkDF0yGIplXE5CevEB39oiCQGst4338",
  authDomain: "memoria-2f439.firebaseapp.com",
  databaseURL: "https://memoria-2f439-default-rtdb.firebaseio.com",
  projectId: "memoria-2f439",
  storageBucket: "memoria-2f439.firebasestorage.app",
  messagingSenderId: "599282718028",
  appId: "1:599282718028:web:b2a61c3b0b22216d3fabe9",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

const USERS_BASE = {
  J: { name: "Jessica", color: "#6750A4", light: "#EADDFF", avatar: "J" },
  E: { name: "Elias", color: "#B5006D", light: "#FFD8EE", avatar: "E" },
};

const SK_SESSION = "memoria_session_v1";
const SK_AVATARS = "memoria_avatars_v1";

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function randomTilt() { return (Math.random() - 0.5) * 14; }

function Ripple({ x, y, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 600); return () => clearTimeout(t); }, [onDone]);
  return <span style={{ position:"absolute", left:x-40, top:y-40, width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,0.35)", pointerEvents:"none", animation:"ripple 0.6s ease-out forwards" }} />;
}

function Fab({ onClick, children, color="#6750A4", style={} }) {
  const [ripples, setRipples] = useState([]);
  const fire = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = genId();
    setRipples(p => [...p, { id, x: e.clientX-r.left, y: e.clientY-r.top }]);
    onClick && onClick(e);
  };
  return (
    <button onClick={fire} style={{ position:"relative", overflow:"hidden", background:color, color:"#fff", border:"none", borderRadius:14, padding:"12px 20px", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:"0 3px 12px rgba(0,0,0,0.18)", transition:"transform 0.15s", ...style }}
      onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
      onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}>
      {ripples.map(r => <Ripple key={r.id} x={r.x} y={r.y} onDone={() => setRipples(p => p.filter(x => x.id !== r.id))} />)}
      {children}
    </button>
  );
}

function Chip({ active, onClick, children, color }) {
  return <button onClick={onClick} style={{ background: active ? color : "transparent", color: active ? "#fff" : "#49454F", border:`1.5px solid ${active ? color : "#CAC4D0"}`, borderRadius:8, padding:"6px 14px", fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>{children}</button>;
}

function Avatar({ userKey, avatars, size=28, fontSize=13 }) {
  const user = USERS_BASE[userKey];
  const pic = avatars[userKey];
  if (pic) return <img src={pic} alt={user.name} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:`2px solid ${user.color}` }} />;
  return <div style={{ width:size, height:size, borderRadius:"50%", background:user.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:fontSize, fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>{user.avatar}</div>;
}

function LoginScreen({ avatars, onLogin, onSetAvatar }) {
  const [hovering, setHovering] = useState(null);
  const [uploadingFor, setUploadingFor] = useState(null);
  const fileRef = useRef();

  const compressImage = (file, maxWidth=300) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
        const size = Math.min(img.width, img.height) * scale;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        const sx = (img.width - Math.min(img.width, img.height)) / 2;
        const sy = (img.height - Math.min(img.width, img.height)) / 2;
        ctx.drawImage(img, sx, sy, Math.min(img.width, img.height), Math.min(img.width, img.height), 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handleAvatarFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadingFor) return;
    const url = await compressImage(file);
    onSetAvatar(uploadingFor, url);
    e.target.value = "";
  };

  return (
    <div style={{ minHeight:"100vh", background:"#FEF7FF", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes floatIn { from { opacity:0; transform:translateY(32px) scale(0.96); } to { opacity:1; transform:none; } }
      `}</style>
      <div style={{ animation:"floatIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both", textAlign:"center", maxWidth:460, width:"100%" }}>
        <div style={{ marginBottom:8, fontSize:52, lineHeight:1 }}>🫧</div>
        <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:38, color:"#1C1B1F", marginBottom:6 }}>Memoria</h1>
        <p style={{ color:"#79747E", fontSize:15, marginBottom:40 }}>Your shared photo memories</p>
        <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:"#49454F", marginBottom:24 }}>Who's visiting today?</p>
        <div style={{ display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap" }}>
          {Object.entries(USERS_BASE).map(([key, user]) => {
            const isHov = hovering === key;
            const pic = avatars[key];
            return (
              <div key={key} onMouseEnter={() => setHovering(key)} onMouseLeave={() => setHovering(null)}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
                <div style={{ position:"relative" }}>
                  <div onClick={() => onLogin(key)} style={{ width:120, height:120, borderRadius:"50%", background: pic ? "transparent" : `linear-gradient(135deg, ${user.color}, ${user.color}99)`, border:`4px solid ${isHov ? user.color : "#E8DEF8"}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.22s cubic-bezier(0.34,1.56,0.64,1)", transform: isHov ? "scale(1.08)" : "scale(1)", boxShadow: isHov ? `0 12px 32px ${user.color}40` : "0 4px 16px rgba(0,0,0,0.10)", overflow:"hidden" }}>
                    {pic ? <img src={pic} alt={user.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:44, fontWeight:800, color:"#fff", fontFamily:"'DM Serif Display',serif" }}>{user.avatar}</span>}
                  </div>
                  <button title="Change photo" onClick={() => { setUploadingFor(key); fileRef.current.click(); }} style={{ position:"absolute", bottom:4, right:4, width:32, height:32, borderRadius:"50%", background:user.color, border:"3px solid #FEF7FF", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.2)", transition:"transform 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.transform="scale(1.15)"}
                    onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>📷</button>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:"#1C1B1F", marginBottom:8 }}>{user.name}</div>
                  <button onClick={() => onLogin(key)} style={{ background: isHov ? user.color : "transparent", color: isHov ? "#fff" : user.color, border:`2px solid ${user.color}`, borderRadius:12, padding:"9px 28px", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer", transition:"all 0.2s" }}>
                    Enter as {user.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ marginTop:32, fontSize:12, color:"#CAC4D0" }}>Click the 📷 icon to set a profile photo before entering</p>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarFile} />
    </div>
  );
}

function PhotoCard({ photo, walls, onAddToWall, onRemove, avatars }) {
  const [open, setOpen] = useState(false);
  const wallsContaining = walls.filter(w => w.items && Object.values(w.items).some(i => i.photo.id === photo.id));
  return (
    <div style={{ borderRadius:20, overflow:"hidden", background:"#F7F2FA", boxShadow:"0 2px 8px rgba(0,0,0,0.08)", transition:"transform 0.2s, box-shadow 0.2s", position:"relative" }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px) scale(1.01)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.14)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)"; }}>
      <img src={photo.url} alt={photo.name} style={{ width:"100%", aspectRatio:"4/3", objectFit:"cover", display:"block" }} />
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <Avatar userKey={photo.user} avatars={avatars} size={22} fontSize={11} />
          <span style={{ fontSize:12, color:"#49454F", fontFamily:"'DM Sans',sans-serif", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{photo.name}</span>
        </div>
        {wallsContaining.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
            {wallsContaining.map(w => <span key={w.id} style={{ background:"#EDE7F6", color:"#6750A4", borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>📌 {w.name}</span>)}
          </div>
        )}
        <div style={{ position:"relative", display:"flex", gap:6 }}>
          <button onClick={() => setOpen(o => !o)} style={{ flex:1, background:"#6750A4", color:"#fff", border:"none", borderRadius:10, padding:"8px 0", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            📌 Add to Wall ▾
          </button>
          <button onClick={() => onRemove(photo.id)} style={{ background:"#FDECEA", border:"none", borderRadius:10, padding:"8px 10px", cursor:"pointer", fontSize:14, color:"#B3261E" }} title="Remove">🗑</button>
          {open && (
            <div style={{ position:"absolute", bottom:"calc(100% + 6px)", left:0, background:"#fff", borderRadius:16, boxShadow:"0 8px 32px rgba(0,0,0,0.16)", padding:8, zIndex:50, minWidth:180, animation:"fadeUp 0.15s ease" }}>
              {walls.map(w => {
                const onIt = w.items && Object.values(w.items).some(i => i.photo.id === photo.id);
                return (
                  <button key={w.id} onClick={() => { if (!onIt) onAddToWall(photo, w.id); setOpen(false); }}
                    style={{ display:"flex", alignItems:"center", gap:10, width:"100%", border:"none", background: onIt ? "#F3EDF7" : "transparent", borderRadius:10, padding:"8px 12px", cursor: onIt ? "default" : "pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, color: onIt ? "#9A8CB0" : "#1C1B1F", fontWeight:500, textAlign:"left" }}>
                    <span style={{ fontSize:16 }}>{onIt ? "✓" : "🖼️"}</span> {w.name} {onIt && <span style={{ fontSize:11, color:"#9A8CB0" }}>(pinned)</span>}
                  </button>
                );
              })}
              {walls.length === 0 && <div style={{ padding:"8px 12px", fontSize:13, color:"#79747E", fontFamily:"'DM Sans',sans-serif" }}>No walls yet!</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WallPhoto({ item, onRemove, onUpdatePos, avatars }) {
  const [pos, setPos] = useState({ x: item.x, y: item.y });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  useEffect(() => { setPos({ x: item.x, y: item.y }); }, [item.x, item.y]);

  const onMouseDown = (e) => { e.preventDefault(); dragStart.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y }; setDragging(true); };
  const onTouchStart = (e) => { const t = e.touches[0]; dragStart.current = { mx: t.clientX, my: t.clientY, ox: pos.x, oy: pos.y }; setDragging(true); };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => { const cx = e.touches ? e.touches[0].clientX : e.clientX; const cy = e.touches ? e.touches[0].clientY : e.clientY; setPos({ x: dragStart.current.ox + cx - dragStart.current.mx, y: dragStart.current.oy + cy - dragStart.current.my }); };
    const onUp = (e) => { setDragging(false); const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX; const cy = e.changedTouches ? e.changedTouches[0].clientY : e.clientY; onUpdatePos(item.id, dragStart.current.ox + cx - dragStart.current.mx, dragStart.current.oy + cy - dragStart.current.my); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp); window.addEventListener("touchmove", onMove, { passive: true }); window.addEventListener("touchend", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onUp); };
  }, [dragging, item.id, onUpdatePos]);

  return (
    <div onMouseDown={onMouseDown} onTouchStart={onTouchStart}
      style={{ position:"absolute", left:pos.x, top:pos.y, transform:`rotate(${item.tilt}deg)`, cursor: dragging?"grabbing":"grab", userSelect:"none", zIndex: dragging?999:item.z, filter: dragging?"drop-shadow(0 16px 32px rgba(0,0,0,0.28))":"drop-shadow(0 4px 12px rgba(0,0,0,0.18))", transition: dragging?"none":"filter 0.2s" }}>
      <div style={{ background:"#fff", borderRadius:4, padding:"10px 10px 32px", width:160, boxShadow:"inset 0 0 0 1px rgba(0,0,0,0.06)" }}>
        <img src={item.photo.url} alt={item.photo.name} style={{ width:"100%", aspectRatio:"4/3", objectFit:"cover", display:"block", borderRadius:2 }} draggable={false} />
        <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:5 }}>
          <Avatar userKey={item.photo.user} avatars={avatars} size={16} fontSize={9} />
          <span style={{ fontSize:11, color:"#49454F", fontFamily:"'DM Sans',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.photo.name}</span>
        </div>
      </div>
      <button onMouseDown={e => e.stopPropagation()} onClick={() => onRemove(item.id)} style={{ position:"absolute", top:-8, right:-8, width:22, height:22, borderRadius:"50%", background:"#B3261E", color:"#fff", border:"none", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 6px rgba(0,0,0,0.2)", fontWeight:700 }}>×</button>
    </div>
  );
}

function UploadModal({ user, onClose, onUploadMany }) {
  const [queue, setQueue] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const u = USERS_BASE[user];

  const compressImage = (file, maxWidth=800) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => { const img = new Image(); img.onload = () => { const canvas = document.createElement("canvas"); const scale = Math.min(1, maxWidth/img.width); canvas.width = img.width*scale; canvas.height = img.height*scale; canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL("image/jpeg", 0.75)); }; img.src = e.target.result; };
    reader.readAsDataURL(file);
  });

  const handleFiles = async (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    const placeholders = arr.map(f => ({ id: genId(), url: null, name: f.name.replace(/\.[^.]+$/, ""), loading: true }));
    setQueue(q => [...q, ...placeholders]);
    for (let i = 0; i < arr.length; i++) {
      const url = await compressImage(arr[i]);
      const pid = placeholders[i].id;
      setQueue(q => q.map(item => item.id === pid ? { ...item, url, loading: false } : item));
    }
  };

  const handleUpload = () => {
    const ready = queue.filter(item => !item.loading && item.url);
    if (ready.length === 0) return;
    onUploadMany(ready.map(item => ({ id: genId(), url: item.url, name: item.name || "Untitled", user, createdAt: Date.now() })));
    onClose();
  };

  const readyCount = queue.filter(i => !i.loading).length;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(8px)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#FEF7FF", borderRadius:28, padding:28, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 48px rgba(0,0,0,0.22)", animation:"modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ width:40, height:40, borderRadius:"50%", background:u.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18 }}>{u.avatar}</div>
          <div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:"#1C1B1F" }}>Add Photos</div>
            <div style={{ fontSize:12, color:"#49454F", fontFamily:"'DM Sans',sans-serif" }}>as {u.name} · select multiple at once</div>
          </div>
        </div>
        <div onClick={() => fileRef.current.click()} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          style={{ border:`2px dashed ${dragOver ? u.color : "#CAC4D0"}`, borderRadius:20, padding:24, textAlign:"center", cursor:"pointer", background: dragOver ? u.light : "#F7F2FA", transition:"all 0.2s", marginBottom:16, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:36 }}>🖼️</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", color:"#49454F", fontSize:14, fontWeight:600 }}>Drop images here or click to browse</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", color:"#79747E", fontSize:12 }}>Hold Ctrl / Cmd to select multiple</span>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e => handleFiles(e.target.files)} />
        {queue.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
            {queue.map(item => (
              <div key={item.id} style={{ display:"flex", alignItems:"center", gap:12, background:"#F3EDF7", borderRadius:14, padding:"10px 12px" }}>
                <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden", background:"#E8DEF8", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {item.loading ? <span style={{ fontSize:20, animation:"spin 1s linear infinite", display:"inline-block" }}>⏳</span> : <img src={item.url} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
                </div>
                <input value={item.name} onChange={e => setQueue(q => q.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))} placeholder="Photo name…" style={{ flex:1, border:"1.5px solid #CAC4D0", borderRadius:10, padding:"8px 12px", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:"#fff", color:"#1C1B1F", outline:"none" }} />
                <button onClick={() => setQueue(q => q.filter(i => i.id !== item.id))} style={{ background:"#FDECEA", border:"none", borderRadius:8, padding:"6px 9px", cursor:"pointer", fontSize:14, color:"#B3261E", flexShrink:0 }}>🗑</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, border:"1.5px solid #CAC4D0", borderRadius:12, padding:12, background:"transparent", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", color:"#49454F", fontWeight:500 }}>Cancel</button>
          <Fab onClick={handleUpload} color={queue.some(i => i.loading) ? "#9A8CB0" : u.color} style={{ flex:2, justifyContent:"center", borderRadius:12, padding:"12px 0", opacity: queue.length === 0 ? 0.5 : 1 }}>
            Upload {readyCount > 0 ? `${readyCount} Photo${readyCount !== 1 ? "s" : ""}` : "Photos"}
          </Fab>
        </div>
      </div>
    </div>
  );
}

function WallNameModal({ initial="", title, onConfirm, onClose }) {
  const [val, setVal] = useState(initial);
  const inputRef = useRef();
  useEffect(() => { inputRef.current?.focus(); }, []);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", backdropFilter:"blur(8px)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#FEF7FF", borderRadius:24, padding:28, width:"100%", maxWidth:360, boxShadow:"0 24px 48px rgba(0,0,0,0.2)", animation:"modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:"#1C1B1F", marginBottom:16 }}>{title}</div>
        <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && val.trim() && onConfirm(val.trim())} placeholder="Wall name…" style={{ width:"100%", border:"1.5px solid #CAC4D0", borderRadius:12, padding:"12px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:15, background:"#F7F2FA", color:"#1C1B1F", outline:"none", boxSizing:"border-box", marginBottom:16 }} />
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, border:"1.5px solid #CAC4D0", borderRadius:12, padding:12, background:"transparent", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", color:"#49454F", fontWeight:500 }}>Cancel</button>
          <Fab onClick={() => val.trim() && onConfirm(val.trim())} color="#6750A4" style={{ flex:2, justifyContent:"center", borderRadius:12, padding:"12px 0" }}>Confirm</Fab>
        </div>
      </div>
    </div>
  );
}

function WallsList({ walls, activeWallId, onSelect, onCreate, onRename, onDelete }) {
  return (
    <div style={{ display:"flex", gap:8, padding:"12px 24px", overflowX:"auto", borderBottom:"1px solid #E8DEF8", background:"rgba(254,247,255,0.95)", alignItems:"center" }}>
      {walls.map(w => (
        <div key={w.id} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
          <button onClick={() => onSelect(w.id)} style={{ background: activeWallId===w.id ? "#EDE7F6" : "transparent", border:`1.5px solid ${activeWallId===w.id ? "#6750A4" : "#CAC4D0"}`, borderRadius:"10px 0 0 10px", borderRight:"none", padding:"7px 14px", fontFamily:"'DM Sans',sans-serif", fontWeight: activeWallId===w.id ? 700 : 500, fontSize:13, color: activeWallId===w.id ? "#6750A4" : "#49454F", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            🖼️ {w.name}
            <span style={{ background: activeWallId===w.id ? "#6750A4" : "#E8DEF8", color: activeWallId===w.id ? "#fff" : "#79747E", borderRadius:99, padding:"1px 7px", fontSize:11, fontWeight:700 }}>{w.items ? Object.keys(w.items).length : 0}</span>
          </button>
          <button onClick={() => onRename(w)} style={{ background: activeWallId===w.id ? "#EDE7F6" : "transparent", border:`1.5px solid ${activeWallId===w.id ? "#6750A4" : "#CAC4D0"}`, borderLeft:"1px solid #E8DEF8", borderRight:"none", padding:"7px 8px", cursor:"pointer", fontSize:13, color:"#79747E" }}>✏️</button>
          <button onClick={() => onDelete(w.id)} style={{ background: activeWallId===w.id ? "#EDE7F6" : "transparent", border:`1.5px solid ${activeWallId===w.id ? "#6750A4" : "#CAC4D0"}`, borderLeft:"1px solid #E8DEF8", borderRadius:"0 10px 10px 0", padding:"7px 8px", cursor:"pointer", fontSize:13, color:"#B3261E" }}>🗑</button>
        </div>
      ))}
      <button onClick={onCreate} style={{ flexShrink:0, background:"transparent", border:"1.5px dashed #CAC4D0", borderRadius:10, padding:"7px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#6750A4", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}
        onMouseEnter={e => e.currentTarget.style.borderColor="#6750A4"}
        onMouseLeave={e => e.currentTarget.style.borderColor="#CAC4D0"}>
        + New Wall
      </button>
    </div>
  );
}

function ProfilePopover({ userKey, avatars, onSetAvatar, onLogout, onClose }) {
  const user = USERS_BASE[userKey];
  const fileRef = useRef();

  const compressImage = (file, maxWidth=300) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => { const img = new Image(); img.onload = () => { const canvas = document.createElement("canvas"); const scale = Math.min(1, maxWidth/Math.max(img.width, img.height)); const size = Math.min(img.width, img.height)*scale; canvas.width = size; canvas.height = size; const ctx = canvas.getContext("2d"); const sx = (img.width - Math.min(img.width, img.height))/2; const sy = (img.height - Math.min(img.width, img.height))/2; ctx.drawImage(img, sx, sy, Math.min(img.width, img.height), Math.min(img.width, img.height), 0, 0, size, size); resolve(canvas.toDataURL("image/jpeg", 0.85)); }; img.src = e.target.result; };
    reader.readAsDataURL(file);
  });

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await compressImage(file);
    onSetAvatar(userKey, url);
    e.target.value = "";
    onClose();
  };

  return (
    <>
      <div style={{ position:"fixed", inset:0, zIndex:199 }} onClick={onClose} />
      <div style={{ position:"absolute", top:"calc(100% + 10px)", right:0, background:"#fff", borderRadius:20, boxShadow:"0 8px 32px rgba(0,0,0,0.16)", padding:16, minWidth:200, zIndex:200, animation:"fadeUp 0.18s ease" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, paddingBottom:14, borderBottom:"1px solid #F3EDF7" }}>
          <Avatar userKey={userKey} avatars={avatars} size={44} fontSize={18} />
          <div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, color:"#1C1B1F" }}>{user.name}</div>
            <div style={{ fontSize:11, color:"#79747E", fontFamily:"'DM Sans',sans-serif" }}>Logged in</div>
          </div>
        </div>
        <button onClick={() => fileRef.current.click()} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", border:"none", background:"#F3EDF7", borderRadius:12, padding:"10px 14px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#6750A4", fontWeight:600, marginBottom:8 }}>📷 Change Profile Photo</button>
        <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", border:"none", background:"#FDECEA", borderRadius:12, padding:"10px 14px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#B3261E", fontWeight:600 }}>🚪 Switch User</button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile} />
    </>
  );
}

export default function App() {
  const [activeUser, setActiveUser] = useState(() => { try { return localStorage.getItem(SK_SESSION) || null; } catch { return null; } });
  const [avatars, setAvatars] = useState(() => { try { return JSON.parse(localStorage.getItem(SK_AVATARS)) || {}; } catch { return {}; } });
  const [tab, setTab] = useState("library");
  const [library, setLibrary] = useState([]);
  const [walls, setWalls] = useState([]);
  const [activeWallId, setActiveWallId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [uploadModal, setUploadModal] = useState(false);
  const [wallNameModal, setWallNameModal] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubLib = onValue(ref(db, "library"), (snap) => {
      const data = snap.val();
      setLibrary(data ? Object.values(data) : []);
      setLoading(false);
    });
    const unsubWalls = onValue(ref(db, "walls"), (snap) => {
      const data = snap.val();
      const wallArr = data ? Object.values(data) : [];
      setWalls(wallArr);
      setActiveWallId(id => id || (wallArr.length > 0 ? wallArr[0].id : null));
    });
    return () => { unsubLib(); unsubWalls(); };
  }, []);

  useEffect(() => { if (activeUser) localStorage.setItem(SK_SESSION, activeUser); else localStorage.removeItem(SK_SESSION); }, [activeUser]);
  useEffect(() => { localStorage.setItem(SK_AVATARS, JSON.stringify(avatars)); }, [avatars]);

  const handleSetAvatar = (key, url) => setAvatars(a => ({ ...a, [key]: url }));
  const handleLogin = (key) => setActiveUser(key);
  const handleLogout = () => { setActiveUser(null); setProfileOpen(false); };

  const handleUploadMany = (photos) => {
    photos.forEach(photo => set(ref(db, `library/${photo.id}`), photo));
  };

  const handleRemoveFromLibrary = (id) => {
    remove(ref(db, `library/${id}`));
    walls.forEach(w => {
      if (w.items) Object.values(w.items).forEach(item => { if (item.photo.id === id) remove(ref(db, `walls/${w.id}/items/${item.id}`)); });
    });
  };

  const handleAddToWall = (photo, wallId) => {
    const wid = wallId || activeWallId;
    const itemId = genId();
    set(ref(db, `walls/${wid}/items/${itemId}`), { id: itemId, photo: { id: photo.id, url: photo.url, name: photo.name, user: photo.user }, tilt: randomTilt(), x: 40 + Math.random()*300, y: 40 + Math.random()*200, z: Date.now() });
    setActiveWallId(wid);
    setTab("wall");
  };

  const handleRemoveFromWall = (itemId) => remove(ref(db, `walls/${activeWallId}/items/${itemId}`));
  const handleUpdatePos = (itemId, x, y) => update(ref(db, `walls/${activeWallId}/items/${itemId}`), { x, y });

  const handleCreateWall = (name) => {
    const id = genId();
    set(ref(db, `walls/${id}`), { id, name, items: {} });
    setActiveWallId(id);
    setTab("wall");
    setWallNameModal(null);
  };

  const handleRenameWall = (name) => { update(ref(db, `walls/${wallNameModal.wall.id}`), { name }); setWallNameModal(null); };

  const handleDeleteWall = (id) => {
    remove(ref(db, `walls/${id}`));
    const remaining = walls.filter(w => w.id !== id);
    if (activeWallId === id) setActiveWallId(remaining.length > 0 ? remaining[0].id : null);
  };

  if (!activeUser) return <LoginScreen avatars={avatars} onLogin={handleLogin} onSetAvatar={handleSetAvatar} />;

  const u = USERS_BASE[activeUser];
  const activeWall = walls.find(w => w.id === activeWallId) || walls[0];
  const filteredLibrary = library.filter(p => filter === "all" || p.user === filter).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#FEF7FF; }
        @keyframes ripple { to { transform:scale(6); opacity:0; } }
        @keyframes modalIn { from { transform:scale(0.88) translateY(20px); opacity:0; } to { transform:none; opacity:1; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-thumb { background:#CAC4D0; border-radius:99px; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#FEF7FF", fontFamily:"'DM Sans',sans-serif" }}>
        <header style={{ background:"rgba(254,247,255,0.88)", backdropFilter:"blur(16px)", borderBottom:"1px solid #E8DEF8", padding:"0 24px", position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:26 }}>🫧</span>
            <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:"#1C1B1F" }}>Memoria</span>
          </div>
          <div style={{ position:"relative" }}>
            <button onClick={() => setProfileOpen(o => !o)} style={{ display:"flex", alignItems:"center", gap:10, background: profileOpen ? u.light : "transparent", border:`1.5px solid ${profileOpen ? u.color : "#E8DEF8"}`, borderRadius:14, padding:"6px 14px 6px 8px", cursor:"pointer", transition:"all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = u.light; e.currentTarget.style.borderColor = u.color; }}
              onMouseLeave={e => { if (!profileOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#E8DEF8"; } }}>
              <Avatar userKey={activeUser} avatars={avatars} size={32} fontSize={14} />
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:14, color:u.color }}>{u.name}</span>
              <span style={{ fontSize:11, color:"#79747E" }}>▾</span>
            </button>
            {profileOpen && <ProfilePopover userKey={activeUser} avatars={avatars} onSetAvatar={handleSetAvatar} onLogout={handleLogout} onClose={() => setProfileOpen(false)} />}
          </div>
        </header>

        <div style={{ display:"flex", gap:4, padding:"16px 24px 0", borderBottom:"1px solid #E8DEF8", background:"rgba(254,247,255,0.92)", position:"sticky", top:64, zIndex:99 }}>
          {[{ id:"library", label:"🖼️ Gallery", count:library.length }, { id:"wall", label:"📌 Walls", count:walls.reduce((a,w) => a+(w.items?Object.keys(w.items).length:0), 0) }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background:"none", border:"none", borderBottom:`3px solid ${tab===t.id ? u.color : "transparent"}`, padding:"10px 20px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight: tab===t.id ? 700 : 500, fontSize:14, color: tab===t.id ? u.color : "#49454F", transition:"all 0.2s", display:"flex", gap:8, alignItems:"center" }}>
              {t.label}
              <span style={{ background: tab===t.id ? u.color : "#E8DEF8", color: tab===t.id ? "#fff" : "#49454F", borderRadius:99, padding:"1px 8px", fontSize:11, fontWeight:700 }}>{t.count}</span>
            </button>
          ))}
        </div>

        {tab === "wall" && <WallsList walls={walls} activeWallId={activeWallId} onSelect={setActiveWallId} onCreate={() => setWallNameModal({ mode:"create" })} onRename={(wall) => setWallNameModal({ mode:"rename", wall })} onDelete={handleDeleteWall} />}

        {tab === "library" && (
          <div style={{ padding:24 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
              <div>
                <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:"#1C1B1F" }}>Gallery</h1>
                <p style={{ color:"#49454F", fontSize:13, marginTop:2 }}>All shared memories in one place</p>
              </div>
              <Fab onClick={() => setUploadModal(true)} color={u.color}><span style={{ fontSize:18 }}>+</span> Upload Photos</Fab>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
              <Chip active={filter==="all"} onClick={() => setFilter("all")} color={u.color}>All ({library.length})</Chip>
              {Object.entries(USERS_BASE).map(([key, val]) => (
                <Chip key={key} active={filter===key} onClick={() => setFilter(key)} color={val.color}>{val.name} ({library.filter(p=>p.user===key).length})</Chip>
              ))}
            </div>
            {loading ? (
              <div style={{ textAlign:"center", padding:"64px 0", color:"#79747E" }}>
                <div style={{ fontSize:32, animation:"spin 1s linear infinite", display:"inline-block", marginBottom:12 }}>⏳</div>
                <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20 }}>Loading memories…</div>
              </div>
            ) : filteredLibrary.length === 0 ? (
              <div style={{ textAlign:"center", padding:"64px 0", color:"#79747E" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20 }}>No photos yet</div>
                <div style={{ fontSize:13, marginTop:4 }}>Upload the first memory!</div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16, animation:"fadeUp 0.3s ease" }}>
                {filteredLibrary.map(photo => (
                  <PhotoCard key={photo.id} photo={photo} walls={walls} onAddToWall={handleAddToWall} onRemove={handleRemoveFromLibrary} avatars={avatars} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "wall" && activeWall && (
          <div style={{ padding:24 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:12 }}>
              <div>
                <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:"#1C1B1F" }}>{activeWall.name}</h1>
                <p style={{ color:"#49454F", fontSize:13, marginTop:2 }}>Drag photos around • {activeWall.items ? Object.keys(activeWall.items).length : 0} photos pinned</p>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Fab onClick={() => setWallNameModal({ mode:"rename", wall:activeWall })} color="#625B71" style={{ padding:"10px 16px" }}>✏️ Rename</Fab>
                <Fab onClick={() => setTab("library")} color={u.color}>🖼️ Gallery</Fab>
              </div>
            </div>
            <div style={{ position:"relative", width:"100%", minHeight:"calc(100vh - 280px)", background:"linear-gradient(135deg,#F3EDF7 0%,#EDE7F6 50%,#F8EDF3 100%)", borderRadius:28, overflow:"hidden", backgroundImage:`radial-gradient(circle at 20% 20%,rgba(103,80,164,0.07) 0%,transparent 50%),radial-gradient(circle at 80% 80%,rgba(181,0,109,0.05) 0%,transparent 50%),repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(103,80,164,0.04) 39px,rgba(103,80,164,0.04) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(103,80,164,0.04) 39px,rgba(103,80,164,0.04) 40px)` }}>
              {(!activeWall.items || Object.keys(activeWall.items).length === 0) && (
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#9A8CB0", pointerEvents:"none" }}>
                  <div style={{ fontSize:56, marginBottom:12 }}>📌</div>
                  <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:22 }}>This wall is empty</div>
                  <div style={{ fontSize:13, marginTop:4 }}>Pin photos from the Gallery to start</div>
                </div>
              )}
              {activeWall.items && Object.values(activeWall.items).map(item => (
                <WallPhoto key={item.id} item={item} onRemove={handleRemoveFromWall} onUpdatePos={handleUpdatePos} avatars={avatars} />
              ))}
            </div>
          </div>
        )}
      </div>

      {uploadModal && <UploadModal user={activeUser} onClose={() => setUploadModal(false)} onUploadMany={handleUploadMany} />}
      {wallNameModal?.mode === "create" && <WallNameModal title="Create a New Wall" onConfirm={handleCreateWall} onClose={() => setWallNameModal(null)} />}
      {wallNameModal?.mode === "rename" && <WallNameModal title="Rename Wall" initial={wallNameModal.wall.name} onConfirm={handleRenameWall} onClose={() => setWallNameModal(null)} />}
    </>
  );
}
