/* ============================================================
   ALCHEM APPAREL — MASTER DESIGN LIBRARY
   script.js — data model, boot sequence, navigation & rendering
   ============================================================ */
(function(){
"use strict";

/* ===============================================================
   0. SUPABASE CONFIGURATION
   =============================================================== */

const supabaseUrl = 'https://kmnucujsggakvjhcnyti.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbnVjdWpzZ2dha3ZqaGNueXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODc0NjAsImV4cCI6MjA5NzU2MzQ2MH0.8fbRBLIutIXI7o0gydg3jxM6-veVVSNx3aRGHqq1PZM'; 
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

/* ---------------------------------------------------------------
   1. DATA MODEL
   Folder structure expected for real artwork (to swap in later):
   assets/designs/<collection-id>/<concept-id>/white-01.jpg ... 10
   assets/designs/<collection-id>/<concept-id>/black-01.jpg ... 10
   This build renders placeholder tiles only — no image files yet.
   --------------------------------------------------------------- */
/* ===============================================================
   DATA MODEL
   ---------------------------------------------------------------
   HOW TO ADD A NEW COLLECTION IN THE FUTURE:
   1. Copy one of the "COMING SOON" blocks below
   2. Fill in: id, code, name, glyph, set available: true
   3. Fill in each concept's id, code, name
   4. Create matching folders in Supabase Storage
      (folder name must match the id exactly)
   5. Upload images into black/ and white/ subfolders
   =============================================================== */
var COLLECTIONS = [

  /* ============================================================
     COLLECTION 1: NOSTALGIA & LEGACY CONNECTION
     STATUS: ✅ LIVE
     Supabase folder: nostalgia-legacy/
     ============================================================ */
{
    id:        "nostalgia-legacy",
    folderId:  "NOSTALGIA & LEGACY COLLECTIONS", /* ⚠️ Change this to your EXACT Supabase folder name */
    code:      "NLC",
    name:      "NOSTALGIA & LEGACY COLLECTION",
    glyph:     "disk",
    available: true,
    concepts: [
      { id: "family-roots-legacy", folderId: "FAMILY ROOTS & LEGACY",  code: "FRL", name: "Family Roots & Legacy" },
      { id: "family-yearbook",     folderId: "FAMILY YEARBOOK",         code: "FYB", name: "Family Yearbook"        },
      { id: "retro-arcade-gaming", folderId: "RETRO ARCADE & GAMING",   code: "RAG", name: "Retro Arcade & Gaming"  },
      { id: "vhs-memories",        folderId: "VHS MEMORIES",            code: "VHS", name: "VHS Memories"           },
      { id: "windows-90-internet", folderId: "WINDOWS 90 INTERNET",     code: "W90", name: "Windows 90 Internet"    }
    ]
  },

  /* ============================================================
     COLLECTION 2 — IN DEVELOPMENT
     HOW TO ACTIVATE:
       - Change available: false → true
       - Fill in the real id, code, name
       - Fill in the 5 concepts below
       - Create matching folders in Supabase
     ============================================================ */
  {
    id:        "collection-2",
    code:      "C02",
    name:      "COMING SOON",
    glyph:     "tree",
    available: false,
    concepts:  [
      /* paste your 5 concepts here when ready */
    ]
  },

  /* ============================================================
     COLLECTION 3 — IN DEVELOPMENT
     ============================================================ */
  {
    id:        "collection-3",
    code:      "C03",
    name:      "COMING SOON",
    glyph:     "plane",
    available: false,
    concepts:  [
      /* paste your 5 concepts here when ready */
    ]
  },

  /* ============================================================
     COLLECTION 4 — IN DEVELOPMENT
     ============================================================ */
  {
    id:        "collection-4",
    code:      "C04",
    name:      "COMING SOON",
    glyph:     "trophy",
    available: false,
    concepts:  [
      /* paste your 5 concepts here when ready */
    ]
  }

];

/* 10x10 pixel-art bitmaps for collection glyph badges */
var GLYPHS = {
  disk:[
    "1111111111","1000000001","1011000001","1011000001","1000000001",
    "1000000001","1011111101","1010000101","1011111101","1111111111"
  ],
  tree:[
    "0000110000","0001111000","0011111100","0111111110","1111111111",
    "0000110000","0000110000","0000110000","0000000000","0000000000"
  ],
  plane:[
    "0000110000","0000110000","0011111100","1111111111","0011111100",
    "0000110000","0001111000","0000000000","0000000000","0000000000"
  ],
  trophy:[
    "1000000001","1100000011","0111111110","0111111110","0011111100",
    "0001111000","0001111000","0011111100","0011111100","0000000000"
  ]
};

var TSHIRT_PATH = "M38,8 Q50,20 62,8 L85,22 L78,35 L72,92 Q50,98 28,92 L22,35 L15,22 Z";

/* ---------------------------------------------------------------
   SUPABASE STORAGE — fetch real design images by folder
   Path structure: designs/{collectionId}/{conceptId}/{color}/
   --------------------------------------------------------------- */
async function fetchDesignFiles(collectionFolderId, conceptFolderId, color) {
  var colorFolder = color === "white" ? "WHITE" : "BLACK";

  /* First, try looking in the BLACK/WHITE subfolder */
  var subFolderPath = collectionFolderId + "/" + conceptFolderId + "/" + colorFolder;

  /* 🔍 DEBUG — shows exactly what path is being searched */
  console.log("=== ALCHEM DEBUG ===");
  console.log("Looking in path:", subFolderPath);

  var subResult = await supabase.storage.from("Designs").list(subFolderPath, {
    limit: 100,
    sortBy: { column: "name", order: "asc" }
  });

/* 🔍 DEBUG — shows full raw response */
  console.log("Supabase raw result:", JSON.stringify(subResult));
  console.log("Error:", subResult.error);
  console.log("Raw data:", subResult.data);
  console.log("Files after filter:", subFiles);

  var subFiles = [];
  if (!subResult.error && subResult.data) {
    subFiles = subResult.data.filter(function(file){
      return file.name !== ".emptyFolderPlaceholder"
          && file.name !== ".gitkeep"
          && file.id  !== null;
    });
  }

  /* If subfolder has files, use them */
  if (subFiles.length > 0) {
    return subFiles.map(function(file){
      return { name: file.name, path: subFolderPath + "/" + file.name };
    });
  }

  /* Otherwise, fall back to flat folder — filter by BLACK/WHITE in filename */
  var flatPath = collectionFolderId + "/" + conceptFolderId;
  var flatResult = await supabase.storage.from("designs").list(flatPath, {
    limit: 100,
    sortBy: { column: "name", order: "asc" }
  });

  if (flatResult.error || !flatResult.data) return [];

  return flatResult.data
    .filter(function(file){
      return file.name !== ".emptyFolderPlaceholder"
          && file.name !== ".gitkeep"
          && file.id  !== null
          && file.name.toUpperCase().indexOf(colorFolder) !== -1; /* match BLACK or WHITE in filename */
    })
    .map(function(file){
      return { name: file.name, path: flatPath + "/" + file.name };
    });
}

function glyphSVG(name){
  var rows = GLYPHS[name];
  if(!rows) return "";
  var rects = "";
  for(var y=0;y<rows.length;y++){
    var row = rows[y];
    for(var x=0;x<row.length;x++){
      if(row[x]==="1"){ rects += '<rect x="'+x+'" y="'+y+'" width="1" height="1"/>'; }
    }
  }
  return '<svg viewBox="0 0 10 10" class="pixel-svg" aria-hidden="true">'+rects+'</svg>';
}

function tshirtSVG(){
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="'+TSHIRT_PATH+'"/></svg>';
}

function getCollection(id){
  for(var i=0;i<COLLECTIONS.length;i++){ if(COLLECTIONS[i].id===id) return COLLECTIONS[i]; }
  return null;
}
function getConcept(collection, conceptId){
  for(var i=0;i<collection.concepts.length;i++){ if(collection.concepts[i].id===conceptId) return collection.concepts[i]; }
  return null;
}

/* ---------------------------------------------------------------
   2. STATE
   --------------------------------------------------------------- */
var state = { view:"desktop", collectionId:null, conceptId:null, tab:"white" };
var lastTileTrigger = null; // for returning focus after lightbox closes

/* ---------------------------------------------------------------
   3. DOM REFS
   --------------------------------------------------------------- */
var $stage, $breadcrumb, $taskbarCurrent, $taskbarBack, $disclaimerModal,
    $lightboxModal, $toastEl, $dontShowAgain;

function qs(id){ return document.getElementById(id); }

/* ---------------------------------------------------------------
   4. RENDERING
   --------------------------------------------------------------- */
function render(){
  $stage.innerHTML = "";
  if(state.view==="desktop") renderDesktop();
  else if(state.view==="collection") renderCollectionView();
  else if(state.view==="library") renderLibraryView();
  renderBreadcrumb();
  renderTaskbar();
  window.scrollTo({top:0, behavior:"auto"});
}

function renderDesktop(){
  var wrap = document.createElement("div");
  wrap.className = "stage-inner";
  wrap.innerHTML =
    '<div class="desktop-intro">MASTER LIBRARY // 4 COLLECTIONS</div>'+
    '<p class="desktop-hint">Tap a collection to open its concepts. Each concept holds 20 designs &mdash; 10 for white shirts, 10 for black.</p>'+
    '<div class="folder-grid" id="collection-grid"></div>';
  $stage.appendChild(wrap);

  var grid = qs("collection-grid");
  COLLECTIONS.forEach(function(col){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "folder-item" + (col.available ? "" : " folder-unavailable");

    /* Show SOON badge on unavailable collections */
    var badge = col.available ? "" : '<span class="coming-soon-badge">SOON</span>';

    btn.innerHTML =
      '<span class="folder-shape"><span class="folder-glyph">'+glyphSVG(col.glyph)+'</span></span>'+
      '<span class="folder-label">'+col.name+badge+'</span>';

    if(col.available){
      btn.addEventListener("click", function(){ openCollection(col.id); });
    } else {
      btn.addEventListener("click", function(){ showToast("COMING SOON \u2014 STAY TUNED!"); });
    }
    grid.appendChild(btn);
  });
}

function renderCollectionView(){
  var col = getCollection(state.collectionId);
  if(!col || !col.available){ state.view="desktop"; return renderDesktop(); }

  var panel = document.createElement("div");
  panel.className = "win-panel";
  panel.innerHTML =
    '<div class="title-bar">'+
      '<span class="title-bar-text">'+col.name+' \u2014 '+col.code+'</span>'+
      '<div class="title-bar-ctrls">' +
        '<button class="win-ctrl close-ctrl" id="col-close" type="button" aria-label="Close">\u2715</button>' +
      '</div>' +
    '</div>'+
    '<div class="panel-body">'+
      '<p class="panel-intro">'+col.concepts.length+' concepts in this collection. Open one to view its 20-design library.</p>'+
      '<div class="folder-grid concept-grid" id="concept-grid"></div>'+
    '</div>'+
    '<div class="panel-statusbar"><span>'+col.concepts.length+' folders</span><span>'+col.code+'</span></div>';
  
  $stage.appendChild(panel);
  
  // Appends drag functionality to the collection window
  makeDraggable(panel, panel.querySelector('.title-bar'));

  qs("col-close").addEventListener("click", goHome);

  var grid = qs("concept-grid");
  col.concepts.forEach(function(con){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "folder-item";
    btn.innerHTML =
      '<span class="folder-shape"><span class="folder-glyph"><svg viewBox="0 0 10 10" class="pixel-svg" aria-hidden="true"><rect x="1" y="2" width="8" height="6"/><rect x="1" y="1" width="3" height="1"/></svg></span></span>'+
      '<span class="folder-label">'+con.name+'</span>';
    btn.addEventListener("click", function(){ openConcept(col.id, con.id); });
    grid.appendChild(btn);
  });
}

function renderLibraryView(){
  var col = getCollection(state.collectionId);
  var con = col ? getConcept(col, state.conceptId) : null;
  if(!col || !con){ state.view="desktop"; return renderDesktop(); }

  var panel = document.createElement("div");
  panel.className = "win-panel";
  panel.innerHTML =
    '<div class="title-bar">'+
      '<span class="title-bar-text">'+con.name+' \u2014 DESIGN LIBRARY</span>'+
      '<div class="title-bar-ctrls">'+
        '<button class="win-ctrl close-ctrl" id="lib-close" type="button" aria-label="Close">\u2715</button>'+
      '</div>'+
    '</div>'+
    '<div class="tab-row" role="tablist">'+
      '<button class="tab-btn" id="tab-white" role="tab" type="button">WHITE SHIRTS (10)</button>'+
      '<button class="tab-btn" id="tab-black" role="tab" type="button">BLACK SHIRTS (10)</button>'+
    '</div>'+
    '<div class="tab-panel-shell">'+
      '<div class="note-banner"><span aria-hidden="true">\u270E</span><span><b>Reminder:</b> these are concepts. Color, text, and imagery are all customizable before final print.</span></div>'+
      '<div class="tile-grid" id="tile-grid"></div>'+
    '</div>'+
    '<div class="panel-statusbar"><span id="lib-status-count">10 of 10 designs</span><span>'+col.code+'-'+con.code+'</span></div>';
  
  $stage.appendChild(panel);

  // Appends drag functionality to the design library window
  makeDraggable(panel, panel.querySelector('.title-bar'));

  qs("lib-close").addEventListener("click", function(){ openCollection(col.id); });

  var tabWhite = qs("tab-white");
  var tabBlack = qs("tab-black");
  function setTab(tab){
    state.tab = tab;
    tabWhite.setAttribute("aria-selected", tab==="white" ? "true":"false");
    tabBlack.setAttribute("aria-selected", tab==="black" ? "true":"false");
    renderTileGrid(col, con, tab);
  }
  tabWhite.addEventListener("click", function(){ setTab("white"); });
  tabBlack.addEventListener("click", function(){ setTab("black"); });
  setTab(state.tab || "white");
}

async function renderTileGrid(col, con, tab){
  var grid = qs("tile-grid");

  /* Show loading message while images fetch */
  grid.innerHTML =
    '<p style="padding:16px;font-size:16px;color:var(--bevel-darkest);">'+
    '\u23F3 Loading designs...</p>';

  var files = await fetchDesignFiles(col.folderId, con.folderId, tab);

  grid.innerHTML = "";

  /* No images uploaded yet for this tab */
  if(files.length === 0){
    grid.innerHTML =
      '<p style="padding:16px;font-size:16px;color:var(--bevel-darkest);">'+
      'No designs uploaded yet for '+(tab==="white"?"WHITE":"BLACK")+' shirts.</p>';
    var sc = qs("lib-status-count");
    if(sc) sc.textContent = "0 designs";
    return;
  }

  /* Build a tile for each image file found */
  files.forEach(function(file, index){
    var colorFolder = tab === "white" ? "WHITE" : "BLACK";
    var imageUrl = supabase.storage.from("designs").getPublicUrl(file.path).data.publicUrl;
    var displayName = file.name.replace(/\.[^/.]+$/, ""); /* strip file extension */

    var tile = document.createElement("button");
    tile.type = "button";
    tile.className = "design-tile";
    tile.innerHTML =
      '<span class="swatch is-'+tab+'">'+
        '<img src="'+imageUrl+'" alt="'+displayName+'" class="design-img" '+
          'onerror="this.style.display=\'none\'">'+
        '<span class="design-placeholder">'+tshirtSVG()+'</span>'+
      '</span>'+
      '<span class="tile-label">'+
        '<span class="num">'+(index+1)+'</span>'+
        '<span class="clr">'+displayName+'</span>'+
      '</span>';

    tile.addEventListener("click", function(url, name, t){
      return function(ev){
        lastTileTrigger = ev.currentTarget;
        openLightboxWithImage(url, name, t);
      };
    }(imageUrl, displayName, tab));

    grid.appendChild(tile);
  });

  var statusCount = qs("lib-status-count");
  if(statusCount) statusCount.textContent = files.length+" designs loaded";
}

/* ---------------------------------------------------------------
   5. BREADCRUMB + TASKBAR
   --------------------------------------------------------------- */
function renderBreadcrumb(){
  var parts = [];
  parts.push({label:"HOME", action:goHome, current: state.view==="desktop"});
  if(state.collectionId){
    var col = getCollection(state.collectionId);
    if(col) parts.push({label:col.name, action:function(){ openCollection(col.id); }, current: state.view==="collection"});
  }
  if(state.conceptId){
    var col2 = getCollection(state.collectionId);
    var con = col2 ? getConcept(col2, state.conceptId) : null;
    if(con) parts.push({label:con.name, action:null, current: state.view==="library"});
  }
  $breadcrumb.innerHTML = "";
  parts.forEach(function(p, idx){
    if(idx>0){
      var sep = document.createElement("span");
      sep.className = "crumb-sep";
      sep.textContent = "\u203A";
      sep.setAttribute("aria-hidden","true");
      $breadcrumb.appendChild(sep);
    }
    var btn = document.createElement("button");
    btn.className = "crumb";
    btn.type = "button";
    btn.textContent = p.label;
    if(p.current){ btn.setAttribute("aria-current","page"); }
    if(!p.action){ btn.disabled = true; btn.style.cursor="default"; }
    else { btn.addEventListener("click", p.action); }
    $breadcrumb.appendChild(btn);
  });
}

function renderTaskbar(){
  if(state.view==="desktop"){
    $taskbarCurrent.textContent = "DESKTOP";
    $taskbarBack.disabled = true;
  } else if(state.view==="collection"){
    var col = getCollection(state.collectionId);
    $taskbarCurrent.textContent = col ? col.name : "";
    $taskbarBack.disabled = false;
  } else if(state.view==="library"){
    var col2 = getCollection(state.collectionId);
    var con = col2 ? getConcept(col2, state.conceptId) : null;
    $taskbarCurrent.textContent = con ? (col2.code+" / "+con.name) : "";
    $taskbarBack.disabled = false;
  }
}

function goHome(){
  state.view = "desktop"; state.collectionId = null; state.conceptId = null;
  render();
}
function openCollection(id){
  state.view = "collection"; state.collectionId = id; state.conceptId = null;
  render();
}
function openConcept(collectionId, conceptId){
  state.collectionId = collectionId; state.conceptId = conceptId; state.tab = "white";
  if(localStorage.getItem("alchem_hide_disclaimer")==="1"){
    state.view = "library";
    render();
  } else {
    showDisclaimer(function(){
      state.view = "library";
      render();
    });
  }
}
function taskbarBackHandler(){
  if(state.view==="library"){ openCollection(state.collectionId); }
  else if(state.view==="collection"){ goHome(); }
}

/* ---------------------------------------------------------------
   6. DISCLAIMER MODAL
   --------------------------------------------------------------- */
var disclaimerCallback = null;
function showDisclaimer(onContinue){
  disclaimerCallback = onContinue;
  $dontShowAgain.checked = false;
  $disclaimerModal.classList.remove("hidden");
  qs("disclaimer-continue").focus();
}
function hideDisclaimer(){
  $disclaimerModal.classList.add("hidden");
  disclaimerCallback = null;
}

/* ---------------------------------------------------------------
   7. LIGHTBOX MODAL
   --------------------------------------------------------------- */
function openLightbox(code, tab) {
  qs("lightbox-code").textContent = code;
  qs("lightbox-art").innerHTML = '<span class="swatch is-' + tab + '" style="border:none;width:100%;height:100%;">' + tshirtSVG() + '</span>';
  qs("lightbox-title").textContent = (tab === "white" ? "WHITE SHIRT" : "BLACK SHIRT") + " \u2014 " + code;
  $lightboxModal.classList.remove("hidden");
  qs("lightbox-close").focus();
  
  // Existing Copy Button Logic
  qs("lightbox-copy").onclick = function() {
    var text = code;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() { showToast("COPIED: " + text); })
        .catch(function() { showToast("CODE: " + text); });
    } else {
      showToast("CODE: " + text);
    }
  };
  
  // NEW: Supabase Save Button Logic
  var saveBtn = qs("lightbox-save");
  if (saveBtn) {
    saveBtn.onclick = async function() {
      // Show loading feedback on the retro UI
      saveBtn.textContent = "SAVING...";
      saveBtn.disabled = true;
      
      // Insert data into your Supabase table
      const { data, error } = await supabase
        .from('saved_designs')
        .insert([
          { design_code: code }
        ]);
      
      // Check results and trigger your retro green toast notification
      if (error) {
        console.error("Supabase Error:", error);
        showToast("ERROR SAVING TO DB");
      } else {
        showToast("SAVED TO SUPABASE!");
      }
      
      // Reset button state
      saveBtn.textContent = "SAVE TO DB";
      saveBtn.disabled = false;
    };
  }
}

/* Open lightbox using a real image URL instead of a design code */
function openLightboxWithImage(imageUrl, displayName, tab){
  qs("lightbox-code").textContent  = displayName;
  qs("lightbox-title").textContent = displayName;
  qs("lightbox-art").innerHTML =
    '<img src="'+imageUrl+'" alt="'+displayName+'" class="lightbox-img" '+
      'onerror="this.style.display=\'none\'">'+
    '<span class="design-placeholder" '+
      'style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">'+
      tshirtSVG()+
    '</span>';

  $lightboxModal.classList.remove("hidden");
  qs("lightbox-close").focus();

  /* Copy button — copies the design name */
  qs("lightbox-copy").onclick = function(){
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(displayName)
        .then(function(){ showToast("COPIED: "+displayName); })
        .catch(function(){ showToast("NAME: "+displayName); });
    } else {
      showToast("NAME: "+displayName);
    }
  };

  /* Save button — saves to Supabase table */
  var saveBtn = qs("lightbox-save");
  if(saveBtn){
    saveBtn.onclick = async function(){
      saveBtn.textContent = "SAVING...";
      saveBtn.disabled    = true;
      const { error } = await supabase
        .from("saved_designs")
        .insert([{ design_code: displayName }]);
      showToast(error ? "ERROR SAVING TO DB" : "SAVED TO SUPABASE!");
      saveBtn.textContent = "SAVE TO DB";
      saveBtn.disabled    = false;
    };
  }
}

function hideLightbox() {
  $lightboxModal.classList.add("hidden");
  if (lastTileTrigger) { lastTileTrigger.focus(); lastTileTrigger = null; }
}

/* ---------------------------------------------------------------
   8. TOAST
   --------------------------------------------------------------- */
var toastTimer = null;
function showToast(msg){
  $toastEl.textContent = msg;
  $toastEl.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ $toastEl.classList.add("hidden"); }, 2400);
}

/* ---------------------------------------------------------------
   9. VISITOR COUNTER + CLOCK
   --------------------------------------------------------------- */
function initVisitorCounter(){
  var total = parseInt(localStorage.getItem("alchem_visitor_total") || "", 10);
  if(isNaN(total)){ total = 184213; }
  if(!sessionStorage.getItem("alchem_visited_this_session")){
    total += 1;
    localStorage.setItem("alchem_visitor_total", String(total));
    sessionStorage.setItem("alchem_visited_this_session", "1");
  }
  var padded = String(total).slice(-6);
  while(padded.length<6){ padded = "0"+padded; }
  qs("visitor-count").textContent = padded;
}

function tickClock(){
  var d = new Date();
  var h = d.getHours();
  var m = d.getMinutes();
  var ampm = h>=12 ? "PM" : "AM";
  h = h % 12; if(h===0) h = 12;
  var mm = (m<10?"0":"")+m;
  qs("taskbar-clock").textContent = h+":"+mm+" "+ampm;
}

/* ---------------------------------------------------------------
   10. BOOT SEQUENCE
   --------------------------------------------------------------- */
var BOOT_LINES = [
  "ALCHEMAPPAREL.SYS ............ OK",
  "MOUNTING DESIGN LIBRARY ...... OK",
  "4 COLLECTIONS DETECTED ....... OK",
  "20 CONCEPTS INDEXED .......... OK",
  "400 DESIGN SLOTS FOUND ....... OK",
  "LOADING MASTER LIBRARY ..."
];

function startBoot(){
  var bootScreen = qs("boot-screen");
  var bootLog = qs("boot-log");
  var bootBar = qs("boot-bar-fill");
  var bootPct = qs("boot-percent");
  var skipBtn = qs("boot-skip");
  var finished = false;
  var timers = [];

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function finishBoot(){
    if(finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    bootScreen.classList.add("hidden");
    qs("app").classList.remove("hidden");
    initVisitorCounter();
    tickClock();
    setInterval(tickClock, 15000);
    render();
  }

  skipBtn.addEventListener("click", finishBoot);

  if(reduceMotion){
    finishBoot();
    return;
  }

  var lineIndex = 0;
  function nextLine(){
    if(lineIndex < BOOT_LINES.length){
      bootLog.textContent += (lineIndex>0?"\n":"") + BOOT_LINES[lineIndex];
      lineIndex++;
      timers.push(setTimeout(nextLine, 220));
    } else {
      fillBar();
    }
  }
  function fillBar(){
    var pct = 0;
    var step = function(){
      pct += 4 + Math.floor(Math.random()*6);
      if(pct>=100){ pct = 100; }
      bootBar.style.width = pct+"%";
      bootPct.textContent = pct+"%";
      if(pct<100){
        timers.push(setTimeout(step, 60));
      } else {
        timers.push(setTimeout(finishBoot, 380));
      }
    };
    step();
  }
  timers.push(setTimeout(nextLine, 150));
}

/* ---------------------------------------------------------------
   DRAG UTILITY (MOUSE & MOBILE TOUCH SUPPORT)
   --------------------------------------------------------------- */
function makeDraggable(element, handle) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  // Bind both mouse and touch start events
  handle.onmousedown = dragStart;
  handle.addEventListener("touchstart", dragStart, { passive: false });

  function dragStart(e) {
    var clientX, clientY;
    
    // Check if it's a touch or a mouse click
    if (e.type === "touchstart") {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      e.preventDefault();
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    pos3 = clientX;
    pos4 = clientY;
    
    // Bind the appropriate move and end events
    if (e.type === "touchstart") {
      document.addEventListener("touchmove", elementDrag, { passive: false });
      document.addEventListener("touchend", closeDragElement);
    } else {
      document.onmousemove = elementDrag;
      document.onmouseup = closeDragElement;
    }
    
    // Bring window to front when tapped/clicked
    element.style.zIndex = 101; 
  }

  function elementDrag(e) {
    var clientX, clientY;
    
    if (e.type === "touchmove") {
      e.preventDefault(); // Stops the background page from scrolling on mobile
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      e.preventDefault();
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    pos1 = pos3 - clientX;
    pos2 = pos4 - clientY;
    pos3 = clientX;
    pos4 = clientY;
    
    // Move the element
    element.style.transform = 'none'; 
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // Clean up all event listeners when the user lets go
    document.onmousemove = null;
    document.onmouseup = null;
    document.removeEventListener("touchmove", elementDrag);
    document.removeEventListener("touchend", closeDragElement);
    element.style.zIndex = 100;
  }
}

/* ---------------------------------------------------------------
   11. INIT
   --------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function() {
  // 1. Assign DOM references
  $stage = qs("stage");
  $breadcrumb = qs("breadcrumb-bar");
  $taskbarCurrent = qs("taskbar-current");
  $taskbarBack = qs("taskbar-back");
  $disclaimerModal = qs("disclaimer-modal");
  $lightboxModal = qs("lightbox-modal");
  $toastEl = qs("toast");
  $dontShowAgain = qs("dont-show-again");
  
  // 2. Safely initialize Brand Icon
  const iconMark = qs("icon-mark");
  if (iconMark) {
    iconMark.innerHTML = '<rect x="2" y="2" width="8" height="8" fill="none"/>' +
      '<rect x="1" y="1" width="2" height="2"/><rect x="7" y="1" width="2" height="2"/>' +
      '<rect x="1" y="7" width="2" height="2"/><rect x="7" y="7" width="2" height="2"/>' +
      '<rect x="4" y="4" width="2" height="2"/>';
  } else {
    console.warn("Element 'icon-mark' not found in DOM");
  }
  
  // 3. Safely initialize Home Button
  const homeBtn = qs("brand-home-btn");
  if (homeBtn) {
    homeBtn.addEventListener("click", goHome);
  } else {
    console.warn("Element 'brand-home-btn' not found in DOM");
  }
  
// 4. Initialize other required event listeners
if ($taskbarBack) $taskbarBack.addEventListener("click", taskbarBackHandler);

const discClose = qs("disclaimer-close");
if (discClose) discClose.addEventListener("click", hideDisclaimer);

const discCont = qs("disclaimer-continue");
if (discCont) {
  discCont.addEventListener("click", function() {
    if ($dontShowAgain && $dontShowAgain.checked) { localStorage.setItem("alchem_hide_disclaimer", "1"); }
    var cb = disclaimerCallback;
    hideDisclaimer();
    if (cb) cb();
  });
}

if ($disclaimerModal) {
  $disclaimerModal.addEventListener("click", function(ev) {
    if (ev.target === $disclaimerModal) hideDisclaimer();
  });
}

const lbClose = qs("lightbox-close");
if (lbClose) lbClose.addEventListener("click", hideLightbox);

if ($lightboxModal) {
  $lightboxModal.addEventListener("click", function(ev) {
    if (ev.target === $lightboxModal) hideLightbox();
  });
}

document.addEventListener("keydown", function(ev) {
  if (ev.key === "Escape") {
    if ($lightboxModal && !$lightboxModal.classList.contains("hidden")) hideLightbox();
    else if ($disclaimerModal && !$disclaimerModal.classList.contains("hidden")) hideDisclaimer();
  }
});

// 5. Start the boot sequence
startBoot();
});

})();
