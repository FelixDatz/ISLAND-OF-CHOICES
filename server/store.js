import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Penyimpanan berbasis file: satu file JSON per sesi. Cukup untuk praktikum/demo
// dan mudah diganti database nanti (antarmuka: save, get, list).
export function createStore(dir) {
  const ready = mkdir(dir, { recursive: true });
  const fileOf = (id) => join(dir, `${id}.json`);

  return {
    dir,

    async save(record) {
      await ready;
      const tmp = `${fileOf(record.sessionId)}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(tmp, JSON.stringify(record), "utf8");
      await rename(tmp, fileOf(record.sessionId)); // tulis atomik
      return record;
    },

    async get(id) {
      await ready;
      try {
        return JSON.parse(await readFile(fileOf(id), "utf8"));
      } catch {
        return null;
      }
    },

    async list() {
      await ready;
      const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
      const records = [];
      for (const file of files) {
        try {
          records.push(JSON.parse(await readFile(join(dir, file), "utf8")));
        } catch {
          // Lewati file rusak agar satu file tidak menjatuhkan seluruh dashboard.
        }
      }
      return records.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    }
  };
}
