// Contoh pemain untuk demo & tes. Setiap persona memainkan ketiga stage dengan
// gaya berbeda; mesin analisis harus bisa membedakan mereka.

const GLYPH_ORDER = ["sun", "wave", "leaf", "moon"];
const SOS = ["short", "short", "short", "long", "long", "long", "short", "short", "short"];

export const PERSONAS = [
  {
    id: "explorer",
    name: "Penjelajah teliti",
    expect: "eksplorasi tinggi, mengamati sebelum memutuskan, suka mengumpulkan, pemecah kode",
    stepMs: 9000,
    steps: [
      // Stage 1
      ["zone", "shore"], ["walk", 400],
      ["do", "message_bottle", "read_message"], ["do", "tide_pool", "collect_shell"],
      ["do", "wreck", "search"], ["do", "driftwood_1", "take"],
      ["zone", "wilderness"], ["walk", 600],
      ["do", "shore_tracks", "inspect_tracks"], ["do", "split_branch", "inspect_branch"],
      ["do", "palm_1", "pick"], ["do", "supply_cache", "pry_with_axe"],
      ["do", "carved_stone", "read_marks"],
      ["zone", "riverbank"], ["walk", 300],
      ["do", "river_reeds", "inspect_reeds"], ["look", "river_bank"], ["wait", 20000],
      ["do", "upstream_path", "discover_shallow_route"],
      ["zone", "far_side"], ["walk", 800],
      ["do", "abandoned_camp", "search_camp"],
      ["goal"], ["explore"],
      ["do", "far_side_marker", "inspect_marker"], ["cover", 0.8],
      ["goal"], ["finish"],
      // Stage 2
      ["zone", "jungle_edge"], ["do", "explorer_note", "read_note"], ["do", "banana_tree", "pick_banana"],
      ["do", "monkey", "give_banana"], ["do", "bamboo_grove_1", "take_bamboo"],
      ["zone", "ruins"], ["do", "mural_sun", "study_mural"], ["do", "mural_wave", "study_mural"], ["do", "mural_moon", "study_mural"],
      ["do", "shrine", "offer_shell"], ["do", "stone_tablet", "read_tablet"],
      ["puzzle", "relic_chest", "chest_code", ["moon", "leaf", "moon"]],
      ["zone", "temple"], ["do", "waterfall_birds", "watch_birds"], ["do", "cracked_wall", "inspect_cracks"], ["wait", 15000],
      ["puzzle", "temple_panel", "enter_code", GLYPH_ORDER],
      ["zone", "highland"], ["do", "explorer_backpack", "search_backpack"], ["do", "viewpoint", "look_out"], ["cover", 0.75],
      ["goal"], ["explore"], ["goal"], ["finish"],
      // Stage 3
      ["zone", "trail"], ["do", "keeper_grave", "read_grave"], ["do", "dry_grass", "gather_grass"], ["do", "woodpile", "take_wood"],
      ["zone", "keeper"], ["do", "keeper_logbook", "read_logbook"], ["do", "tide_chart", "study_chart"], ["do", "oil_barrel", "take_oil"],
      ["zone", "peak"], ["do", "telescope", "look_telescope"], ["wait", 15000],
      ["puzzle", "lighthouse_lamp", "send_signal", SOS],
      ["zone", "cove"], ["do", "fishing_wreck", "search_wreck"], ["cover", 0.7],
      ["goal"], ["finish"]
    ]
  },
  {
    id: "speedrunner",
    name: "Pelari cepat",
    expect: "terfokus, cepat bertindak, hampir tanpa barang",
    stepMs: 4000,
    steps: [
      ["zone", "shore"], ["walk", 300], ["zone", "wilderness"], ["walk", 500],
      ["zone", "riverbank"], ["do", "upstream_path", "discover_shallow_route"],
      ["zone", "far_side"], ["walk", 700], ["cover", 0.3], ["goal"], ["finish"],
      ["zone", "jungle_edge"], ["zone", "ruins"], ["zone", "temple"],
      ["do", "cracked_wall", "climb"],
      ["zone", "highland"], ["cover", 0.3], ["goal"], ["finish"],
      ["zone", "trail"], ["do", "woodpile", "take_wood"], ["do", "dry_grass", "gather_grass"], ["do", "flint_rocks", "take_flint"],
      ["zone", "keeper"], ["zone", "peak"], ["do", "signal_firepit", "light_fire"],
      ["zone", "cove"], ["cover", 0.35], ["goal"], ["finish"]
    ]
  },
  {
    id: "builder",
    name: "Perakit hemat",
    expect: "gaya Perakit, hemat barang",
    stepMs: 7000,
    steps: [
      ["zone", "shore"], ["do", "wreck", "search"], ["do", "driftwood_1", "take"], ["do", "driftwood_2", "take"],
      ["zone", "wilderness"], ["do", "shore_tracks", "inspect_tracks"],
      ["zone", "riverbank"], ["do", "river_bank", "make_raft"],
      ["zone", "far_side"], ["cover", 0.45], ["goal"], ["finish"],
      ["zone", "jungle_edge"], ["do", "bamboo_grove_1", "take_bamboo"], ["do", "hanging_vines", "cut_vine"],
      ["zone", "ruins"], ["zone", "temple"], ["do", "temple_panel", "build_lever"],
      ["zone", "highland"], ["cover", 0.45], ["goal"], ["finish"],
      ["zone", "trail"], ["zone", "keeper"], ["do", "storeroom_crate", "search_crate"], ["do", "weather_station", "salvage_wire"],
      ["zone", "peak"], ["do", "lighthouse_radio", "repair_radio"],
      ["zone", "cove"], ["cover", 0.5], ["goal"], ["finish"]
    ]
  },
  {
    id: "adaptive_risk",
    name: "Pengambil risiko yang beradaptasi",
    expect: "mencoba langsung, gagal, lalu berganti cara",
    stepMs: 5000,
    steps: [
      ["zone", "shore"], ["zone", "wilderness"], ["zone", "riverbank"],
      ["do", "river_bank", "swim"],
      ["zone", "shore"], ["do", "wreck", "search"],
      ["zone", "wilderness"], ["do", "palm_1", "chop"],
      ["zone", "riverbank"], ["do", "river_bank", "build_log_bridge"],
      ["zone", "far_side"], ["cover", 0.4], ["goal"], ["finish"],
      ["zone", "jungle_edge"], ["do", "banana_tree", "pick_banana"], ["do", "bamboo_grove_1", "take_bamboo"],
      ["zone", "ruins"], ["zone", "temple"],
      ["do", "cracked_wall", "climb"],
      ["do", "temple_panel", "build_lever"],
      ["zone", "highland"], ["cover", 0.4], ["goal"], ["finish"],
      ["zone", "trail"], ["zone", "keeper"], ["zone", "cove"],
      ["do", "broken_pier", "take_planks"], ["do", "fishing_wreck", "search_wreck"],
      ["do", "boat_frame", "sail_away"],
      ["zone", "trail"], ["zone", "keeper"], ["do", "storeroom_crate", "search_crate"], ["do", "weather_station", "salvage_wire"],
      ["zone", "peak"], ["do", "lighthouse_radio", "repair_radio"],
      ["zone", "cove"], ["cover", 0.45], ["goal"], ["finish"]
    ]
  },
  {
    id: "stubborn",
    name: "Pencoba gigih",
    expect: "mencoba cara yang sama berulang kali, coba-coba",
    stepMs: 5000,
    steps: [
      ["zone", "shore"], ["zone", "wilderness"], ["zone", "riverbank"],
      ["blocked", "river_bank", "make_raft"],
      ["do", "river_bank", "swim"],
      ["zone", "shore"], ["zone", "wilderness"], ["zone", "riverbank"],
      ["do", "river_bank", "swim"],
      ["zone", "shore"], ["zone", "wilderness"], ["zone", "riverbank"],
      ["do", "river_bank", "swim"],
      ["zone", "shore"], ["zone", "wilderness"], ["zone", "riverbank"],
      ["do", "upstream_path", "discover_shallow_route"],
      ["zone", "far_side"], ["cover", 0.35], ["goal"], ["finish"],
      ["zone", "jungle_edge"], ["zone", "ruins"], ["zone", "temple"],
      ["puzzle", "temple_panel", "enter_code", [
        ["sun", "sun", "sun", "sun"], ["wave", "wave", "wave", "wave"], ["leaf", "leaf", "leaf", "leaf"],
        ["moon", "moon", "moon", "moon"], ["sun", "leaf", "wave", "moon"], GLYPH_ORDER
      ]],
      ["zone", "highland"], ["cover", 0.3], ["goal"], ["finish"],
      ["zone", "trail"], ["zone", "keeper"], ["zone", "cove"],
      ["do", "broken_pier", "take_planks"], ["do", "fishing_wreck", "search_wreck"], ["do", "boat_frame", "sail_away"],
      ["zone", "cove"], ["do", "broken_pier", "take_planks"], ["do", "fishing_wreck", "search_wreck"], ["do", "boat_frame", "sail_away"],
      ["zone", "keeper"], ["do", "tide_chart", "study_chart"],
      ["zone", "cove"], ["do", "broken_pier", "take_planks"], ["do", "fishing_wreck", "search_wreck"], ["do", "boat_frame", "sail_away"],
      ["cover", 0.35], ["goal"], ["finish"]
    ]
  }
];
