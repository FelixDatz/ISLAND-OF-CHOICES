const LOCATIONS = {
  beach: { name: "Pantai Sunyi", icon: "🏝️", description: "Sisa perahu, kayu apung, dan jejak menuju hutan ada di sini.", problem: "river" },
  forest: { name: "Hutan Lumina", icon: "🌿", description: "Hutan lembap ini menyimpan stasiun penelitian tua.", problem: "locked_station" },
  hub: { name: "Pos Peneliti", icon: "🛖", description: "Pos tua ini memberi pandangan ke menara sinyal di bukit.", problem: "signal_tower" },
  signal_point: { name: "Menara Sinyal", icon: "📡", description: "Sinyal darurat siap dikirim. Kamu hanya perlu mengaktifkannya." }
};

function getAvailableLocations(state) {
  return Object.entries(LOCATIONS).filter(([id]) => state.world.locations[id].unlocked);
}
