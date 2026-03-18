/**
 * Smart Zoom Engine v3 — AI Cinema Director
 *
 * Uses MediaPipe FaceDetector for fast, accurate face detection with keypoints.
 * No heavy ONNX models — runs entirely on GPU-accelerated WASM, no UI freezing.
 *
 * CinemaDirector takes face detections per frame and produces ShotPlans
 * with zoom type, center, scale, duration, and easing per frame.
 */

import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';

// ──────────────────────────── Types ────────────────────────────

export interface Detection {
  class: string;
  confidence: number;
  x: number;  // center X (0-1 normalized)
  y: number;  // center Y (0-1 normalized)
  w: number;  // width (0-1 normalized)
  h: number;  // height (0-1 normalized)
  keypoints?: { x: number; y: number; name: string }[];
}

export type ShotType = 'closeup_face' | 'body_detail' | 'body_wide' | 'establishing';

export interface ShotPlan {
  type: ShotType;
  originX: number;  // zoom center X (0-100%)
  originY: number;  // zoom center Y (0-100%)
  scale: number;    // zoom scale (1.0-1.6)
  duration: number; // how long to show this frame (ms)
  easing: string;   // CSS easing curve
  detections: Detection[];
}

// Color coding for detection overlay
export const DETECTION_COLORS: Record<string, string> = {
  'FACE': '#60a5fa',
  'EYE_LEFT': '#38bdf8', 'EYE_RIGHT': '#38bdf8',
  'NOSE': '#a78bfa', 'MOUTH': '#fb7185',
  'LEFT_EAR': '#fbbf24', 'RIGHT_EAR': '#fbbf24',
};

// ──────────────────────────── MediaPipe Face Detector ────────────────────────────

let faceDetector: FaceDetector | null = null;
let faceDetectorLoading: Promise<FaceDetector> | null = null;

async function initFaceDetector(): Promise<FaceDetector> {
  if (faceDetector) return faceDetector;
  if (faceDetectorLoading) return faceDetectorLoading;

  faceDetectorLoading = (async () => {
    console.log('[SmartZoom] Loading MediaPipe FaceDetector...');
    const vision = await FilesetResolver.forVisionTasks(
      new URL('/models/mediapipe/', window.location.origin).href,
    );
    const detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: new URL('/models/blaze_face_short_range.tflite', window.location.origin).href,
        delegate: 'CPU',
      },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.5,
    });
    console.log('[SmartZoom] MediaPipe FaceDetector ready!');
    faceDetector = detector;
    return detector;
  })();

  return faceDetectorLoading;
}

async function detectFaces(imageElement: HTMLImageElement): Promise<Detection[]> {
  const detector = await initFaceDetector();
  const result = detector.detect(imageElement);
  const detections: Detection[] = [];

  for (const face of result.detections) {
    const bb = face.boundingBox;
    if (!bb) continue;
    const imgW = imageElement.naturalWidth;
    const imgH = imageElement.naturalHeight;

    const det: Detection = {
      class: 'FACE',
      confidence: face.categories?.[0]?.score ?? 0.9,
      x: (bb.originX + bb.width / 2) / imgW,
      y: (bb.originY + bb.height / 2) / imgH,
      w: bb.width / imgW,
      h: bb.height / imgH,
      keypoints: [],
    };

    // Extract keypoints (eyes, nose, mouth, ears)
    if (face.keypoints) {
      for (const kp of face.keypoints) {
        det.keypoints!.push({
          x: kp.x,
          y: kp.y,
          name: kp.label || 'unknown',
        });
      }
    }

    detections.push(det);
  }

  return detections;
}

// ──────────────────────────── Image Analysis ────────────────────────────

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

/** Analyze a single frame — fast face detection only */
export async function analyzeFrame(imageUrl: string): Promise<Detection[]> {
  const img = await loadImage(imageUrl);
  return detectFaces(img).catch(() => [] as Detection[]);
}

// ──────────────────────────── Cinema Director ────────────────────────────

const SHOT_CONFIG: Record<ShotType, { scaleRange: [number, number]; durationRange: [number, number]; easing: string }> = {
  closeup_face:  { scaleRange: [1.25, 1.45], durationRange: [4000, 6000], easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' },
  body_detail:   { scaleRange: [1.15, 1.35], durationRange: [3500, 5000], easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
  body_wide:     { scaleRange: [1.06, 1.14], durationRange: [5000, 7000], easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },
  establishing:  { scaleRange: [1.02, 1.06], durationRange: [5000, 8000], easing: 'cubic-bezier(0.39, 0.575, 0.565, 1)' },
};

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

function pickShotType(dets: Detection[], prevType: ShotType | null): ShotType {
  const faces = dets.filter(d => d.class === 'FACE');

  // Build candidate list
  const candidates: ShotType[] = [];

  if (faces.length === 1) candidates.push('closeup_face');
  if (faces.length >= 2) candidates.push('body_wide');
  if (faces.length === 1) candidates.push('body_detail');
  candidates.push('establishing'); // always available as fallback

  // Prefer variety — avoid repeating the same shot type
  if (prevType && candidates.length > 1) {
    const varied = candidates.filter(c => c !== prevType);
    if (varied.length > 0) return varied[0];
  }

  return candidates[0];
}

function pickZoomCenter(dets: Detection[], shotType: ShotType): { x: number; y: number } {
  if (shotType === 'closeup_face') {
    const face = dets.find(d => d.class === 'FACE');
    if (face?.keypoints && face.keypoints.length >= 2) {
      // Zoom to between the eyes for a cinematic close-up
      const eyes = face.keypoints.filter(k =>
        k.name === 'leftEye' || k.name === 'rightEye' ||
        k.name === 'left_eye' || k.name === 'right_eye'
      );
      if (eyes.length >= 2) {
        return { x: ((eyes[0].x + eyes[1].x) / 2) * 100, y: ((eyes[0].y + eyes[1].y) / 2) * 100 };
      }
    }
    if (face) return { x: face.x * 100, y: face.y * 100 };
  }

  if (shotType === 'body_detail') {
    const face = dets.find(d => d.class === 'FACE');
    // Zoom slightly below face (chest area) for body detail
    if (face) return { x: face.x * 100, y: Math.min(90, face.y * 100 + 15) };
  }

  if (shotType === 'body_wide') {
    // Center on the centroid of all faces
    if (dets.length > 0) {
      const cx = dets.reduce((s, d) => s + d.x, 0) / dets.length;
      const cy = dets.reduce((s, d) => s + d.y, 0) / dets.length;
      return { x: cx * 100, y: cy * 100 };
    }
  }

  // Establishing: gentle offset from center for Ken Burns feel
  return { x: 45 + Math.random() * 10, y: 40 + Math.random() * 20 };
}

export function planShot(dets: Detection[], prevType: ShotType | null): ShotPlan {
  const type = pickShotType(dets, prevType);
  const center = pickZoomCenter(dets, type);
  const config = SHOT_CONFIG[type];
  const t = Math.random();

  return {
    type,
    originX: Math.min(92, Math.max(8, center.x)),
    originY: Math.min(92, Math.max(8, center.y)),
    scale: lerp(config.scaleRange[0], config.scaleRange[1], t),
    duration: Math.round(lerp(config.durationRange[0], config.durationRange[1], t)),
    easing: config.easing,
    detections: dets,
  };
}

// ──────────────────────────── Lazy Per-Frame Analysis ────────────────────────────
// Instead of analyzing ALL frames upfront (which freezes UI),
// analyze one frame at a time on-demand and cache results.

const shotCache = new Map<string, ShotPlan>();
let lastShotType: ShotType | null = null;
let modelReady = false;
let modelInitPromise: Promise<void> | null = null;

/** Initialize models (called once). */
export async function initModels(): Promise<void> {
  if (modelReady) return;
  if (modelInitPromise) return modelInitPromise;
  modelInitPromise = initFaceDetector()
    .then(() => { modelReady = true; })
    .catch(e => console.warn('[SmartZoom] FaceDetector init failed:', e));
  return modelInitPromise;
}

/**
 * Analyze a single frame lazily. Returns cached result if available.
 * Non-blocking: uses requestIdleCallback so detection runs when browser is idle.
 */
export async function analyzeSingleFrame(imageUrl: string): Promise<ShotPlan> {
  // Return cached result immediately
  if (shotCache.has(imageUrl)) return shotCache.get(imageUrl)!;

  // Ensure model is ready
  await initModels();
  if (!modelReady) return makeFallbackShot();

  // Use requestIdleCallback to avoid blocking UI
  const dets = await new Promise<Detection[]>((resolve) => {
    const run = async () => {
      try {
        const result = await analyzeFrame(imageUrl);
        resolve(result);
      } catch {
        resolve([]);
      }
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => { run(); }, { timeout: 500 });
    } else {
      setTimeout(() => { run(); }, 16);
    }
  });

  const shot = planShot(dets, lastShotType);
  shotCache.set(imageUrl, shot);
  lastShotType = shot.type;
  return shot;
}

function makeFallbackShot(): ShotPlan {
  return {
    type: 'establishing',
    originX: 45 + Math.random() * 10,
    originY: 40 + Math.random() * 20,
    scale: 1.03 + Math.random() * 0.03,
    duration: 5000 + Math.random() * 3000,
    easing: 'cubic-bezier(0.39, 0.575, 0.565, 1)',
    detections: [],
  };
}

/** Clear the shot cache (call on album change). */
export function clearShotCache(): void {
  shotCache.clear();
  lastShotType = null;
}

// ──────────────────────────── Legacy batch API (kept for compatibility) ────────────────────────────

export interface AnalysisProgress {
  done: number;
  total: number;
  shots: Map<string, ShotPlan>;
  ready: boolean;
}

/**
 * Analyze frames lazily — only pre-analyzes first 5 frames, rest are on-demand.
 */
export async function analyzeFrames(
  imageUrls: string[],
  onProgress?: (progress: AnalysisProgress) => void,
  abortSignal?: { aborted: boolean },
): Promise<Map<string, ShotPlan>> {
  await initModels();

  // Only pre-analyze first 5 frames to get playback started quickly
  const preloadCount = Math.min(5, imageUrls.length);

  for (let i = 0; i < preloadCount; i++) {
    if (abortSignal?.aborted) break;

    await analyzeSingleFrame(imageUrls[i]);

    // Yield generously between each frame
    await new Promise(r => setTimeout(r, 100));
  }

  // Signal ready immediately
  onProgress?.({
    done: preloadCount,
    total: imageUrls.length,
    shots: new Map(shotCache),
    ready: true,
  });

  return new Map(shotCache);
}

