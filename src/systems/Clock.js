// Sumber waktu tunggal. Game memakai Date.now(); simulasi & tes menyuntikkan
// jam palsu supaya hasil analisis deterministik.
let clock = () => Date.now();

export function now() {
  return clock();
}

export function setClock(fn) {
  clock = typeof fn === "function" ? fn : () => Date.now();
}
