import test from "node:test";
import assert from "node:assert/strict";
import {
  PRNG,
  NoiseGenerator,
  CellularNoise,
  BiomeRamp,
  HeightmapChunk,
  VoxelRegion,
  TerrainEngine
} from "../dist/index.mjs";

test("PRNG: produces deterministic pseudo-random sequences", () => {
  const prng1 = new PRNG(1337);
  const prng2 = new PRNG(1337);

  const seq1 = Array.from({ length: 10 }, () => prng1.next());
  const seq2 = Array.from({ length: 10 }, () => prng2.next());

  assert.deepEqual(seq1, seq2, "Identical seeds must produce identical sequences");

  for (const val of seq1) {
    assert.ok(val >= 0 && val < 1, `Value ${val} must be in [0, 1) range`);
  }
});

test("NoiseGenerator: continuous fBm 2D and 3D output bounds", () => {
  const noise = new NoiseGenerator(42);

  for (let x = 0; x < 5; x += 0.5) {
    for (let y = 0; y < 5; y += 0.5) {
      const val2D = noise.fbm2D(x, y, 4, 0.5, 2.0);
      assert.ok(typeof val2D === "number" && !isNaN(val2D), "fBm 2D must return a valid number");
      assert.ok(val2D >= 0 && val2D <= 1, `fbm2D (${val2D}) should be normalized [0, 1]`);

      const val3D = noise.fbm3D(x, y, 0.5, 3, 0.5, 2.0);
      assert.ok(typeof val3D === "number" && !isNaN(val3D), "fBm 3D must return a valid number");
    }
  }
});

test("CellularNoise: supports Euclidean, Manhattan, and Chebyshev metrics", () => {
  const cell = new CellularNoise(999);

  const metrics = ["euclidean", "manhattan", "chebyshev"];
  for (const metric of metrics) {
    const res = cell.sample2D(2.5, 3.5, metric);
    assert.ok(typeof res.f1 === "number", "f1 must be a number");
    assert.ok(typeof res.f2 === "number", "f2 must be a number");
    assert.ok(res.f1 <= res.f2, "f1 distance must be <= f2 distance");
  }
});

test("BiomeRamp: evaluates normalized elevation to RGB colors across all presets", () => {
  const presets = [
    BiomeRamp.Alpine,
    BiomeRamp.Atoll,
    BiomeRamp.Caldera,
    BiomeRamp.Boreal,
    BiomeRamp.Dune
  ];

  for (const ramp of presets) {
    for (let h = 0; h <= 1.0; h += 0.2) {
      const color = ramp.evaluate(h);
      assert.ok(Array.isArray(color) && color.length === 3, "Color must be [r, g, b]");
      assert.ok(color[0] >= 0 && color[0] <= 255, "R channel in [0, 255]");
      assert.ok(color[1] >= 0 && color[1] <= 255, "G channel in [0, 255]");
      assert.ok(color[2] >= 0 && color[2] <= 255, "B channel in [0, 255]");

      const css = ramp.evaluateCss(h);
      assert.ok(css.startsWith("rgb("), "CSS output must format as rgb()");
    }
  }
});

test("HeightmapChunk: generates grid vertices with valid normals", () => {
  const noise = new NoiseGenerator(12345);
  const chunk = new HeightmapChunk(noise, {
    chunkX: 0,
    chunkZ: 0,
    resolution: 16,
    octaves: 3,
    persistence: 0.5,
    worldScale: 50
  });

  const data = chunk.data;
  assert.equal(data.resolution, 16);
  assert.equal(data.elevations.length, 16 * 16);
  assert.equal(data.normals.length, 16 * 16 * 3);

  for (let i = 0; i < data.normals.length; i += 3) {
    const nx = data.normals[i];
    const ny = data.normals[i + 1];
    const nz = data.normals[i + 2];
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    assert.ok(Math.abs(len - 1.0) < 0.05, `Normal vector length should be approx 1.0, got ${len}`);
  }
});

test("VoxelRegion: creates 3D density grid with classified voxel materials and Luau export", () => {
  const noise = new NoiseGenerator(777);
  const voxelRegion = new VoxelRegion(noise, {
    sizeX: 8,
    sizeY: 16,
    sizeZ: 8,
    seaLevel: 4
  });

  const voxels = voxelRegion.voxels;
  assert.equal(voxels.length, 8 * 16 * 8);

  const materials = new Set(voxels.map((v) => v.material));
  assert.ok(materials.size > 0, "Should generate at least one voxel material type");

  const luauScript = voxelRegion.toRobloxTerrainTable();
  assert.ok(luauScript.includes("RegionData"), "Luau export must define RegionData table");
  assert.ok(luauScript.includes("Enum.Material"), "Luau export must map to Roblox Enum.Material");
  assert.ok(luauScript.includes("Vector3.new"), "Luau export must format Vector3 positions");
});

test("TerrainEngine: provides unified facade and deterministic output", () => {
  const engine = new TerrainEngine({
    seed: 8888,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0,
    biome: BiomeRamp.Alpine
  });

  const elev1 = engine.sampleElevation(10, 20);
  const elev2 = engine.sampleElevation(10, 20);
  assert.equal(elev1, elev2, "Same coords must return identical elevation");

  const chunk = engine.generateChunk({ resolution: 8 });
  assert.equal(chunk.data.resolution, 8);

  engine.reseed(9999);
  const elevAfterReseed = engine.sampleElevation(10, 20);
  assert.notEqual(elev1, elevAfterReseed, "Different seeds should produce different elevation");
});
