/**
 * Smart Zoom Engine — ONNX-based face/body detection for cinema mode
 *
 * Uses NudeNet 320n.onnx (YOLOv8-nano) to detect faces and body regions,
 * then converts those detections into Ken Burns zoom targets.
 *
 * All inference runs client-side via ONNX Runtime Web (WASM).
 */

import * as ort from 'onnxruntime-web';

// ──────────────────────────── Types ────────────────────────────

export interface Detection {
  class: string;
  confidence: number;
  x: number;  // center X (0-1 normalized)
  y: number;  // center Y (0-1 normalized)
  w: number;  // width (0-1 normalized)
  h: number;  // height (0-1 normalized)
}

export interface ZoomTarget {
  x: number;  // center X as percentage (0-100)
  y: number;  // center Y as percentage (0-100)
  scale: number;  // zoom scale (1.05-1.15)
}

// NudeNet 320n classes
const CLASSES = [
  'EXPOSED_ANUS', 'EXPOSED_ARMPITS', 'COVERED_BELLY', 'EXPOSED_BELLY',
  'COVERED_BUTTOCKS', 'EXPOSED_BUTTOCKS', 'FACE_F', 'FACE_M',
  'COVERED_FEET', 'EXPOSED_FEET', 'COVERED_BREAST_F', 'EXPOSED_BREAST_F',
  'COVERED_GENITALIA_F', 'EXPOSED_GENITALIA_F', 'EXPOSED_BREAST_M',
  'EXPOSED_GENITALIA_M',
];

// Priority order for zoom targeting (higher = more interesting to zoom into)
const PRIORITY: Record<string, number> = {
  'FACE_F': 10, 'FACE_M': 10,
  'EXPOSED_BREAST_F': 8, 'EXPOSED_BUTTOCKS': 7,
  'EXPOSED_GENITALIA_F': 7, 'EXPOSED_GENITALIA_M': 6,
  'EXPOSED_BELLY': 5, 'EXPOSED_BREAST_M': 4,
  'COVERED_BREAST_F': 3, 'COVERED_BUTTOCKS': 3,
  'COVERED_BELLY': 2, 'COVERED_GENITALIA_F': 2,
  'EXPOSED_ARMPITS': 1, 'EXPOSED_ANUS': 1,
  'COVERED_FEET': 0, 'EXPOSED_FEET': 0,
};

// Color coding for detection overlay
export const DETECTION_COLORS: Record<string, string> = {
  'FACE_F': '#f472b6', 'FACE_M': '#60a5fa',
  'EXPOSED_BREAST_F': '#fb923c', 'EXPOSED_BUTTOCKS': '#f87171',
  'EXPOSED_GENITALIA_F': '#e879f9', 'EXPOSED_GENITALIA_M': '#c084fc',
  'EXPOSED_BELLY': '#fbbf24', 'EXPOSED_BREAST_M': '#fdba74',
  'COVERED_BREAST_F': '#86efac', 'COVERED_BUTTOCKS': '#6ee7b7',
  'COVERED_BELLY': '#a3e635', 'COVERED_GENITALIA_F': '#67e8f9',
  'EXPOSED_ARMPITS': '#fcd34d', 'EXPOSED_ANUS': '#f9a8d4',
  'COVERED_FEET': '#94a3b8', 'EXPOSED_FEET': '#cbd5e1',
};

// ──────────────────────────── Singleton Session ────────────────────────────

let session: ort.InferenceSession | null = null;
let sessionLoading: Promise<ort.InferenceSession> | null = null;

/**
 * Lazily init the ONNX inference session (singleton).
 * Model is loaded from public/models/320n.onnx
 */
export async function initDetector(): Promise<ort.InferenceSession> {
  if (session) return session;
  if (sessionLoading) return sessionLoading;

  sessionLoading = (async () => {
    // Configure WASM paths — point to our public/models/ copies
    ort.env.wasm.numThreads = 1; // single thread to avoid SharedArrayBuffer issues in Electron
    ort.env.wasm.simd = true;
    ort.env.wasm.wasmPaths = new URL('/models/', window.location.origin).href;

    const modelUrl = new URL('/models/320n.onnx', window.location.origin).href;

    console.log('[SmartZoom] Loading NudeNet 320n.onnx model...');
    const s = await ort.InferenceSession.create(modelUrl, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    console.log('[SmartZoom] Model loaded. Inputs:', s.inputNames, 'Outputs:', s.outputNames);
    session = s;
    return s;
  })();

  return sessionLoading;
}

// ──────────────────────────── Image Preprocessing ────────────────────────────

/**
 * Load an image URL and preprocess for NudeNet 320×320 input.
 * Returns Float32Array in NCHW format [1, 3, 320, 320] normalized to 0-1.
 */
async function preprocessImage(imageUrl: string): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext('2d')!;

      // Letterbox: scale to fit 320×320 preserving aspect ratio
      const scale = Math.min(320 / img.naturalWidth, 320 / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const dx = (320 - w) / 2;
      const dy = (320 - h) / 2;

      ctx.fillStyle = '#808080'; // neutral gray padding
      ctx.fillRect(0, 0, 320, 320);
      ctx.drawImage(img, dx, dy, w, h);

      const imageData = ctx.getImageData(0, 0, 320, 320);
      const { data } = imageData;

      // Convert to NCHW Float32Array normalized to [0, 1]
      const float32 = new Float32Array(3 * 320 * 320);
      for (let i = 0; i < 320 * 320; i++) {
        float32[i] = data[i * 4] / 255;                 // R
        float32[320 * 320 + i] = data[i * 4 + 1] / 255; // G
        float32[2 * 320 * 320 + i] = data[i * 4 + 2] / 255; // B
      }

      resolve(float32);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    img.src = imageUrl;
  });
}

// ──────────────────────────── Post-processing ────────────────────────────

const CONF_THRESHOLD = 0.25;
const IOU_THRESHOLD = 0.45;

/**
 * YOLOv8 output post-processing.
 * Output tensor shape: [1, numClasses+4, numBoxes] → transpose to [numBoxes, numClasses+4]
 * Each box: [cx, cy, w, h, class_scores...]
 */
function postProcess(output: ort.Tensor): Detection[] {
  const data = output.data as Float32Array;
  const [, features, numBoxes] = output.dims; // [1, 20, 2100] for 320n

  // Transpose from [1, features, numBoxes] to iterate per box
  const detections: Detection[] = [];

  for (let b = 0; b < numBoxes; b++) {
    const cx = data[0 * numBoxes + b];
    const cy = data[1 * numBoxes + b];
    const w = data[2 * numBoxes + b];
    const h = data[3 * numBoxes + b];

    // Find best class
    let bestClass = 0;
    let bestScore = 0;
    for (let c = 0; c < features - 4; c++) {
      const score = data[(c + 4) * numBoxes + b];
      if (score > bestScore) {
        bestScore = score;
        bestClass = c;
      }
    }

    if (bestScore < CONF_THRESHOLD) continue;

    detections.push({
      class: CLASSES[bestClass] || `class_${bestClass}`,
      confidence: bestScore,
      x: cx / 320,
      y: cy / 320,
      w: w / 320,
      h: h / 320,
    });
  }

  // NMS
  return nms(detections, IOU_THRESHOLD);
}

function nms(detections: Detection[], iouThreshold: number): Detection[] {
  // Sort by confidence descending
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const kept: Detection[] = [];

  for (const det of sorted) {
    let dominated = false;
    for (const k of kept) {
      if (iou(det, k) > iouThreshold) {
        dominated = true;
        break;
      }
    }
    if (!dominated) kept.push(det);
  }

  return kept;
}

function iou(a: Detection, b: Detection): number {
  const ax1 = a.x - a.w / 2, ay1 = a.y - a.h / 2;
  const ax2 = a.x + a.w / 2, ay2 = a.y + a.h / 2;
  const bx1 = b.x - b.w / 2, by1 = b.y - b.h / 2;
  const bx2 = b.x + b.w / 2, by2 = b.y + b.h / 2;

  const ix1 = Math.max(ax1, bx1), iy1 = Math.max(ay1, by1);
  const ix2 = Math.min(ax2, bx2), iy2 = Math.min(ay2, by2);
  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);

  const areaA = (ax2 - ax1) * (ay2 - ay1);
  const areaB = (bx2 - bx1) * (by2 - by1);
  return inter / (areaA + areaB - inter + 1e-6);
}

// ──────────────────────────── Detection API ────────────────────────────

/**
 * Detect regions in a single image.
 */
export async function detectRegions(imageUrl: string): Promise<Detection[]> {
  const s = await initDetector();
  const inputData = await preprocessImage(imageUrl);
  const tensor = new ort.Tensor('float32', inputData, [1, 3, 320, 320]);

  const inputName = s.inputNames[0];
  const results = await s.run({ [inputName]: tensor });
  const outputName = s.outputNames[0];

  return postProcess(results[outputName]);
}

/**
 * Pick the best zoom target from detections.
 * Returns a Ken Burns target point.
 */
export function pickZoomTarget(detections: Detection[]): ZoomTarget {
  if (detections.length === 0) {
    // Random fallback
    return {
      x: 40 + Math.random() * 20,
      y: 40 + Math.random() * 20,
      scale: 1.0 + Math.random() * 0.08,
    };
  }

  // Sort by priority, then confidence
  const sorted = [...detections].sort((a, b) => {
    const pa = PRIORITY[a.class] ?? 0;
    const pb = PRIORITY[b.class] ?? 0;
    if (pa !== pb) return pb - pa;
    return b.confidence - a.confidence;
  });

  const best = sorted[0];

  // Zoom scale based on detection size (smaller regions = more zoom)
  const regionSize = Math.max(best.w, best.h);
  const scale = regionSize < 0.15 ? 1.12 : regionSize < 0.3 ? 1.08 : 1.05;

  return {
    x: Math.min(90, Math.max(10, best.x * 100)),
    y: Math.min(90, Math.max(10, best.y * 100)),
    scale,
  };
}

// ──────────────────────────── Batch Analysis ────────────────────────────

export interface AnalysisProgress {
  done: number;
  total: number;
  targets: Map<string, ZoomTarget>;
  detections: Map<string, Detection[]>;
}

/**
 * Analyze all frames in background, calling onProgress for each completed frame.
 * Returns a Map of imageUrl → ZoomTarget + detections.
 */
export async function analyzeFrames(
  imageUrls: string[],
  onProgress?: (progress: AnalysisProgress) => void,
  abortSignal?: { aborted: boolean },
): Promise<{ targets: Map<string, ZoomTarget>; detections: Map<string, Detection[]> }> {
  const targets = new Map<string, ZoomTarget>();
  const detections = new Map<string, Detection[]>();

  // Init model first
  await initDetector();

  for (let i = 0; i < imageUrls.length; i++) {
    if (abortSignal?.aborted) break;

    const url = imageUrls[i];
    try {
      const dets = await detectRegions(url);
      const target = pickZoomTarget(dets);
      targets.set(url, target);
      detections.set(url, dets);
    } catch (e) {
      console.warn(`[SmartZoom] Failed to analyze frame ${i}:`, e);
      targets.set(url, {
        x: 40 + Math.random() * 20,
        y: 40 + Math.random() * 20,
        scale: 1.0 + Math.random() * 0.08,
      });
      detections.set(url, []);
    }

    onProgress?.({ done: i + 1, total: imageUrls.length, targets, detections });

    // Yield to UI thread every frame
    await new Promise(r => setTimeout(r, 0));
  }

  return { targets, detections };
}
