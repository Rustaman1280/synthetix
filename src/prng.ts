/**
 * @crustdev/synthetix - Deterministic PRNG
 * Mulberry32 implementation for zero-dependency seedable randomness.
 */

export class PRNG {
  private state: number;

  constructor(seed: number = 482917) {
    this.state = seed >>> 0;
  }

  /**
   * Returns a pseudo-random floating point number in [0, 1)
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a pseudo-random integer in [min, max] inclusive
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }

  /**
   * Reset seed state
   */
  public setSeed(seed: number): void {
    this.state = seed >>> 0;
  }

  /**
   * Create a 256-entry permutation array shuffled by this PRNG
   */
  public buildPermutationTable(): Uint8Array {
    const source = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      source[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const swap = source[i];
      source[i] = source[j];
      source[j] = swap;
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      perm[i] = source[i & 255];
    }
    return perm;
  }
}
