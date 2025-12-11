import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RenderSettingsService {
  private clearColor = { r: 0, g: 0, b: 0, a: 1 };

  getClearColor() {
    return this.clearColor;
  }

  setClearColorHex(hex: string): void {
    const { r, g, b } = this.hexToRgbNormalized(hex);
    this.setClearColor(r, g, b);
  }

  setClearColor(r: number, g: number, b: number, a = 1): void {
    this.clearColor = { r, g, b, a };
  }
  

  private hexToRgbNormalized(hex: string) {
    const raw = hex.replace('#', '');
    const full =
      raw.length === 3
        ? raw
            .split('')
            .map((c) => c + c)
            .join('')
        : raw;
    const v = parseInt(full, 16);
    const r = (v >> 16) & 255;
    const g = (v >> 8) & 255;
    const b = v & 255;
    return { r: r / 255, g: g / 255, b: b / 255 };
  }
}
