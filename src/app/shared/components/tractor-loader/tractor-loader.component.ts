import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface TractorState {
  x: number;
  y: number;
  dir: number;
  rowIndex: number;
  rowFrac: number;
}

const W = 640;
const H = 320;
const FIELD_X = 30;
const FIELD_Y = 170;
const FIELD_W = 580;
const FIELD_H = 120;
const ROWS = 3;
const ROW_H = FIELD_H / ROWS;
const ROW_CENTERS = [0, 1, 2].map((i) => FIELD_Y + ROW_H * i + ROW_H / 2);
const FIELD_START = 55;
const FIELD_END = 585;
const BAND_HALF_H = 14;

@Component({
  selector: 'app-tractor-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tractor-loader.component.html',
  styleUrls: ['./tractor-loader.component.css'],
})
export class TractorLoaderComponent implements AfterViewInit, OnDestroy {
  @Input() mode: 'indeterminate' | 'progress' = 'indeterminate';
  @Input() progress = 0;
  @Input() label?: string;

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  private frameId: number | null = null;
  private lastTime = 0;

  private indetPhase = 0;
  private wheelAngle = 0;
  private particles: Particle[] = [];
  private spawnTimer = 0;

  private readonly soilDots: { x: number; y: number; r: number; shade: number }[] = [];
  private readonly clouds = [
    { x: 90, y: 55, s: 1.0, speed: 3 },
    { x: 320, y: 35, s: 0.7, speed: 2 },
    { x: 480, y: 70, s: 0.85, speed: 4 },
  ];

  constructor() {
    for (let i = 0; i < 150; i++) {
      this.soilDots.push({
        x: FIELD_X + Math.random() * FIELD_W,
        y: FIELD_Y + Math.random() * FIELD_H,
        r: 0.6 + Math.random() * 1.3,
        shade: Math.random(),
      });
    }
  }

  get statusText(): string {
    if (this.label) {
      return this.label;
    }
    return this.mode === 'indeterminate' ? 'Plowing…' : `${Math.round(this.clamp(this.progress, 0, 100))}% loaded`;
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) {
      return;
    }
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      return;
    }
    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame((t) => this.frame(t));
  }

  ngOnDestroy(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private clamp(v: number, a: number, b: number): number {
    return Math.max(a, Math.min(b, v));
  }

  private roundRectPath(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx!;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  private getTractorState(fraction: number): TractorState {
    fraction = this.clamp(fraction, 0, 1);
    const rowFloat = fraction * ROWS;
    const rowIndex = Math.min(Math.floor(rowFloat), ROWS - 1);
    let rowFrac = rowFloat - rowIndex;
    if (rowIndex === ROWS - 1 && fraction >= 1) {
      rowFrac = 1;
    }
    const dir = rowIndex % 2 === 0 ? 1 : -1;
    const x0 = dir === 1 ? FIELD_START : FIELD_END;
    const x1 = dir === 1 ? FIELD_END : FIELD_START;
    const x = this.lerp(x0, x1, rowFrac);
    const y = ROW_CENTERS[rowIndex];
    return { x, y, dir, rowIndex, rowFrac };
  }

  private spawnParticle(x: number, y: number): void {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 12,
      vy: -22 - Math.random() * 14,
      life: 0,
      maxLife: 0.8 + Math.random() * 0.5,
      size: 3 + Math.random() * 3,
    });
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt / 1000;
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
      p.vy += (-6 * dt) / 1000;
      if (p.life > p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private drawParticles(): void {
    const ctx = this.ctx!;
    for (const p of this.particles) {
      const t = p.life / p.maxLife;
      const alpha = (1 - t) * 0.5;
      const radius = p.size * (1 + t * 1.6);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      g.addColorStop(0, `rgba(225,220,210,${alpha})`);
      g.addColorStop(1, 'rgba(225,220,210,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawSky(t: number): void {
    const ctx = this.ctx!;
    const g = ctx.createLinearGradient(0, 0, 0, 180);
    g.addColorStop(0, '#a9d9f2');
    g.addColorStop(1, '#e4f4fb');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 180);

    const sunG = ctx.createRadialGradient(555, 55, 4, 555, 55, 46);
    sunG.addColorStop(0, 'rgba(255,240,170,1)');
    sunG.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = sunG;
    ctx.beginPath();
    ctx.arc(555, 55, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd873';
    ctx.beginPath();
    ctx.arc(555, 55, 22, 0, Math.PI * 2);
    ctx.fill();

    for (const c of this.clouds) {
      const cx = ((c.x + t * c.speed) % (W + 120)) - 60;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(cx, c.y, 26 * c.s, 12 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 22 * c.s, c.y + 4, 20 * c.s, 10 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 20 * c.s, c.y + 5, 18 * c.s, 9 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawHill(): void {
    const ctx = this.ctx!;
    const g = ctx.createLinearGradient(0, 155, 0, 186);
    g.addColorStop(0, '#8fc656');
    g.addColorStop(1, '#6fa83f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 158, W, 28);
  }

  private drawFieldBackground(): void {
    const ctx = this.ctx!;
    const g = ctx.createLinearGradient(0, FIELD_Y, 0, FIELD_Y + FIELD_H);
    g.addColorStop(0, '#d3ab74');
    g.addColorStop(1, '#b98a4f');
    ctx.fillStyle = g;
    this.roundRectPath(FIELD_X, FIELD_Y, FIELD_W, FIELD_H, 6);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#8a6236';
    ctx.stroke();

    for (const d of this.soilDots) {
      ctx.fillStyle = d.shade > 0.5 ? 'rgba(120,84,45,0.25)' : 'rgba(255,235,200,0.25)';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(138,98,54,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 1; i < ROWS; i++) {
      const y = FIELD_Y + ROW_H * i;
      ctx.beginPath();
      ctx.moveTo(FIELD_X, y);
      ctx.lineTo(FIELD_X + FIELD_W, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  private drawPlowedBand(xStart: number, xEnd: number, yCenter: number): void {
    if (xStart === xEnd) {
      return;
    }
    const ctx = this.ctx!;
    const left = Math.min(xStart, xEnd);
    const right = Math.max(xStart, xEnd);
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, yCenter - BAND_HALF_H, right - left, BAND_HALF_H * 2);
    ctx.clip();

    const g = ctx.createLinearGradient(0, yCenter - BAND_HALF_H, 0, yCenter + BAND_HALF_H);
    g.addColorStop(0, '#6b4726');
    g.addColorStop(1, '#523517');
    ctx.fillStyle = g;
    ctx.fillRect(left - 2, yCenter - BAND_HALF_H, right - left + 4, BAND_HALF_H * 2);

    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let x = left - (left % 9); x < right + 10; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, yCenter - BAND_HALF_H);
      ctx.lineTo(x - 5, yCenter + BAND_HALF_H);
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(left, yCenter);
    ctx.lineTo(right, yCenter);
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 3;
    ctx.strokeStyle = '#3d2712';
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  private drawShadow(x: number, y: number): void {
    const ctx = this.ctx!;
    ctx.fillStyle = 'rgba(20,15,10,0.28)';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 3, 34, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWheel(localX: number, localY: number, radius: number): void {
    const ctx = this.ctx!;
    ctx.save();
    ctx.translate(localX, localY);
    ctx.rotate(this.wheelAngle);
    const tireG = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.2, 0, 0, radius);
    tireG.addColorStop(0, '#3a3a3a');
    tireG.addColorStop(1, '#111111');
    ctx.fillStyle = tireG;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(1.5, radius * 0.18);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 0.6, Math.sin(a) * radius * 0.6);
      ctx.lineTo(Math.cos(a) * radius * 0.95, Math.sin(a) * radius * 0.95);
      ctx.stroke();
    }
    const hubG = ctx.createRadialGradient(-2, -2, 1, 0, 0, radius * 0.42);
    hubG.addColorStop(0, '#cfcfcf');
    hubG.addColorStop(1, '#7c7c7c');
    ctx.fillStyle = hubG;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawTractor(x: number, y: number, dir: number, alpha: number): void {
    const ctx = this.ctx!;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(dir, 1);

    const pipeG = ctx.createLinearGradient(-26, -74, -20, -74);
    pipeG.addColorStop(0, '#333');
    pipeG.addColorStop(1, '#666');
    ctx.fillStyle = pipeG;
    this.roundRectPath(-26, -74, 6, 20, 1.5);
    ctx.fill();

    const cabinG = ctx.createLinearGradient(-9, -68, 18, -43);
    cabinG.addColorStop(0, '#f2f2f2');
    cabinG.addColorStop(1, '#cfcfcf');
    ctx.fillStyle = cabinG;
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;
    this.roundRectPath(-9, -68, 27, 25, 3);
    ctx.fill();
    ctx.stroke();

    const glassG = ctx.createLinearGradient(-5, -63, 14, -50);
    glassG.addColorStop(0, '#cdeeff');
    glassG.addColorStop(0.6, '#8fd0ee');
    glassG.addColorStop(1, '#5fb3d9');
    ctx.fillStyle = glassG;
    this.roundRectPath(-5, -63, 19, 13, 2);
    ctx.fill();

    const bodyG = ctx.createLinearGradient(-26, -47, -26, -23);
    bodyG.addColorStop(0, '#e2554f');
    bodyG.addColorStop(1, '#b8342f');
    ctx.fillStyle = bodyG;
    ctx.strokeStyle = '#8a231f';
    ctx.lineWidth = 1.5;
    this.roundRectPath(-26, -47, 58, 23, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    this.roundRectPath(-24, -45, 40, 5, 3);
    ctx.fill();

    ctx.fillStyle = '#fff59d';
    ctx.beginPath();
    ctx.arc(30, -35, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    this.drawWheel(dir * -10, -16, 16);
    this.drawWheel(dir * 26, -10, 10);
    ctx.restore();
  }

  private render(fraction: number, alpha: number): TractorState {
    const ctx = this.ctx!;
    ctx.clearRect(0, 0, W, H);
    const t = performance.now() / 1000;
    this.drawSky(t);
    this.drawHill();
    this.drawFieldBackground();

    const state = this.getTractorState(fraction);

    for (let i = 0; i < state.rowIndex; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      const x0 = dir === 1 ? FIELD_START : FIELD_END;
      const x1 = dir === 1 ? FIELD_END : FIELD_START;
      this.drawPlowedBand(x0, x1, ROW_CENTERS[i]);
    }
    {
      const dir = state.dir;
      const x0 = dir === 1 ? FIELD_START : FIELD_END;
      this.drawPlowedBand(x0, state.x, ROW_CENTERS[state.rowIndex]);
    }

    this.drawShadow(state.x, state.y);
    this.drawParticles();
    this.drawTractor(state.x, state.y, state.dir, alpha);

    return state;
  }

  private frame(now: number): void {
    const dt = Math.min(now - this.lastTime, 50);
    this.lastTime = now;

    this.wheelAngle += dt * 0.012;

    if (this.mode === 'indeterminate') {
      this.indetPhase += dt * 0.00022;
      if (this.indetPhase > 1) {
        this.indetPhase -= 1;
      }
    }

    const fraction = this.mode === 'indeterminate' ? this.indetPhase : this.clamp(this.progress, 0, 100) / 100;
    let alpha = 1;
    if (this.mode === 'indeterminate') {
      if (this.indetPhase > 0.96) {
        alpha = this.clamp(1 - (this.indetPhase - 0.96) / 0.04, 0, 1);
      } else if (this.indetPhase < 0.02) {
        alpha = this.clamp(this.indetPhase / 0.02, 0, 1);
      }
    }

    const state = this.render(fraction, alpha);

    this.updateParticles(dt);
    this.spawnTimer += dt;
    if (this.spawnTimer > 130) {
      this.spawnTimer = 0;
      const ex = state.x + state.dir * -23;
      const ey = state.y - 74;
      this.spawnParticle(ex, ey);
    }

    this.frameId = requestAnimationFrame((t) => this.frame(t));
  }
}
