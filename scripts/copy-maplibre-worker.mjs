// MapLibre spawns a module worker from a URL relative to its own bundle, which app bundlers don't preserve.
// Copy the worker module and the shared module it imports into public/ so the map can point at a stable URL.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const dist = path.join(path.dirname(require.resolve("maplibre-gl/package.json")), "dist");
const dest = path.join(process.cwd(), "public", "vendor");
mkdirSync(dest, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(path.join(dist, f), path.join(dest, f));
}
console.log("copied maplibre worker modules -> public/vendor/");
