import { describe, it, expect } from 'vitest';
import { compressDataUrl } from '../js/photos.js';

describe('compressDataUrl', () => {
  it('returns string starting with data:image', async () => {
    // 100x100 rood JPEG als test-input
    const input = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const out = await compressDataUrl(input, 1600, 0.85);
    expect(typeof out).toBe('string');
    expect(out).toMatch(/^data:image\//);
  });
});
