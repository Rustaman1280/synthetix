/**
 * @crustdev/synthetix - Cellular Noise
 * Worley / Voronoi distance calculation for biome cells, cracks, and crystal strata.
 */

import { PRNG } from "./prng";

export type DistanceMetric = "euclidean" | "manhattan" | "chebyshev";

export class CellularNoise {
  private prng: PRNG;

  constructor(seed: number = 482917) {
    this.prng = new PRNG(seed);
  }

  private hash2D(ix: number, iy: number): [number, number] {
    const n = Math.sin(ix * 12.9898 + iy * 78.233 + this.prng.next() * 100) * 43758.5453;
    const fx = n - Math.floor(n);
    const m = Math.sin(ix * 39.346 + iy * 11.135) * 43758.5453;
    const fy = m - Math.floor(m);
    return [fx, fy];
  }

  /**
   * Sample 2D Worley noise.
   * Returns:
   *   f1: distance to nearest feature point (0 to ~1)
   *   f2: distance to second nearest feature point
   *   diff: f2 - f1 (creates cell borders/crystal ridges)
   */
  public sample2D(
    x: number,
    y: number,
    metric: DistanceMetric = "euclidean"
  ): { f1: number; f2: number; cellId: number; ridge: number } {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    let f1 = Infinity;
    let f2 = Infinity;
    let nearestCellId = 0;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const [px, py] = this.hash2D(ix + dx, iy + dy);
        const rx = dx + px - fx;
        const ry = dy + py - fy;

        let d: number;
        if (metric === "manhattan") {
          d = Math.abs(rx) + Math.abs(ry);
        } else if (metric === "chebyshev") {
          d = Math.max(Math.abs(rx), Math.abs(ry));
        } else {
          d = Math.sqrt(rx * rx + ry * ry);
        }

        if (d < f1) {
          f2 = f1;
          f1 = d;
          nearestCellId = (ix + dx) * 73856093 ^ (iy + dy) * 19349663;
        } else if (d < f2) {
          f2 = d;
        }
      }
    }

    return {
      f1: Math.min(1, f1),
      f2: Math.min(1, f2),
      cellId: nearestCellId >>> 0,
      ridge: Math.max(0, Math.min(1, f2 - f1)),
    };
  }
}
