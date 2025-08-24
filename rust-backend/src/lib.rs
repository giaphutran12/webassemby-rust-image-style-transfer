use wasm_bindgen::prelude::*;
use image::{DynamicImage, ImageBuffer, Rgba, RgbaImage, GenericImageView};
use std::f32::consts::PI;
use serde::{Deserialize, Serialize};
use std::io::Cursor;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[derive(Serialize, Deserialize)]
pub struct StyleTransferResult {
    pub success: bool,
    pub message: String,
    pub processed_image_data: Option<String>,
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Image Style Transfer", name)
}

#[wasm_bindgen]
pub fn process_image_style(
    image_data: &[u8],
    style: &str,
) -> JsValue {
    // Decode the image
    let img = match image::load_from_memory(image_data) {
        Ok(img) => img,
        Err(e) => {
            let result = StyleTransferResult {
                success: false,
                message: format!("Failed to load image: {}", e),
                processed_image_data: None,
            };
            return serde_wasm_bindgen::to_value(&result).unwrap_or_else(|_| JsValue::NULL);
        }
    };

    // Apply the selected style
    let processed_img = match style {
        "vangogh" => apply_van_gogh_style(&img),
        "picasso" => apply_picasso_style(&img),
        "cyberpunk" => apply_cyberpunk_style(&img),
        _ => {
            let result = StyleTransferResult {
                success: false,
                message: format!("Unknown style: {}", style),
                processed_image_data: None,
            };
            return serde_wasm_bindgen::to_value(&result).unwrap_or_else(|_| JsValue::NULL);
        }
    };

    // Convert back to bytes
    let mut output = Cursor::new(Vec::new());
    if let Err(e) = processed_img.write_to(&mut output, image::ImageFormat::Png) {
        let result = StyleTransferResult {
            success: false,
            message: format!("Failed to encode processed image: {}", e),
            processed_image_data: None,
        };
        return serde_wasm_bindgen::to_value(&result).unwrap_or_else(|_| JsValue::NULL);
    }

    let output_bytes = output.into_inner();
    let base64_data = base64::encode(&output_bytes);

    let result = StyleTransferResult {
        success: true,
        message: format!("Successfully applied {} style", style),
        processed_image_data: Some(format!("data:image/png;base64,{}", base64_data)),
    };
    serde_wasm_bindgen::to_value(&result).unwrap_or_else(|_| JsValue::NULL)
}

fn apply_van_gogh_style(img: &DynamicImage) -> DynamicImage {
    // Van Gogh-inspired: long oriented strokes following isophotes + gentle swirl field,
    // plus a palette tilt towards yellows and blues.
    let (width, height) = img.dimensions();
    let src = img.to_rgba8();
    let mut out = RgbaImage::new(width, height);

    // Parameters
    let stroke_len: i32 = ((width.max(height) as f32) * 0.015).clamp(6.0, 18.0) as i32; // 6..18 pixels
    let sigma_t: f32 = (stroke_len as f32) * 0.5; // Gaussian along stroke
    let swirl_strength: f32 = 0.25; // radians at center
    let swirl_radius: f32 = (width.min(height) as f32) * 0.45;

    // Helpers
    let idx = |x: i32, y: i32| -> usize {
        let xx = x.clamp(0, (width as i32) - 1) as u32;
        let yy = y.clamp(0, (height as i32) - 1) as u32;
        ((yy * width + xx) * 4) as usize
    };

    let get_gray = |x: i32, y: i32| -> f32 {
        let i = idx(x, y);
        let r = src.as_raw()[i] as f32;
        let g = src.as_raw()[i + 1] as f32;
        let b = src.as_raw()[i + 2] as f32;
        (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
    };

    let sample_rgba = |xf: f32, yf: f32| -> [f32; 3] {
        // Bilinear sample in RGB, normalized 0..1
        let x0 = xf.floor() as i32;
        let y0 = yf.floor() as i32;
        let x1 = x0 + 1;
        let y1 = y0 + 1;
        let tx = xf - x0 as f32;
        let ty = yf - y0 as f32;
        let w00 = (1.0 - tx) * (1.0 - ty);
        let w10 = tx * (1.0 - ty);
        let w01 = (1.0 - tx) * ty;
        let w11 = tx * ty;
        let i00 = idx(x0, y0);
        let i10 = idx(x1, y0);
        let i01 = idx(x0, y1);
        let i11 = idx(x1, y1);
        let raw = src.as_raw();
        let c = |i: usize| -> [f32; 3] {
            [raw[i] as f32 / 255.0, raw[i + 1] as f32 / 255.0, raw[i + 2] as f32 / 255.0]
        };
        let c00 = c(i00);
        let c10 = c(i10);
        let c01 = c(i01);
        let c11 = c(i11);
        [
            c00[0] * w00 + c10[0] * w10 + c01[0] * w01 + c11[0] * w11,
            c00[1] * w00 + c10[1] * w10 + c01[1] * w01 + c11[1] * w11,
            c00[2] * w00 + c10[2] * w10 + c01[2] * w01 + c11[2] * w11,
        ]
    };

    // Precompute center
    let cx = (width as f32) * 0.5;
    let cy = (height as f32) * 0.5;
    let two_sigma2 = 2.0 * swirl_radius * swirl_radius;

    for y in 0..(height as i32) {
        for x in 0..(width as i32) {
            // Gradient
            let gx = get_gray(x + 1, y) - get_gray(x - 1, y);
            let gy = get_gray(x, y + 1) - get_gray(x, y - 1);
            // Tangent (isophote) direction
            let mut theta = gy.atan2(gx) + PI * 0.5;

            // Add gentle swirl around center
            let dx = x as f32 - cx;
            let dy = y as f32 - cy;
            let r2 = dx * dx + dy * dy;
            let swirl = swirl_strength * (-r2 / two_sigma2).exp();
            theta += swirl;

            let dirx = theta.cos();
            let diry = theta.sin();

            // Line integral convolution along stroke direction
            let mut sum = [0.0f32; 3];
            let mut wsum = 0.0f32;
            let mut t = -(stroke_len as i32);
            while t <= stroke_len {
                let tf = t as f32;
                let wx = x as f32 + tf * dirx;
                let wy = y as f32 + tf * diry;
                let w = (- (tf * tf) / (2.0 * sigma_t * sigma_t)).exp();
                let c = sample_rgba(wx, wy);
                sum[0] += c[0] * w;
                sum[1] += c[1] * w;
                sum[2] += c[2] * w;
                wsum += w;
                t += 1;
            }
            let mut r = (sum[0] / wsum).clamp(0.0, 1.0);
            let mut g = (sum[1] / wsum).clamp(0.0, 1.0);
            let mut b = (sum[2] / wsum).clamp(0.0, 1.0);

            // Palette tilt: push towards yellows (R+G) and blues, slight saturation boost
            let avg = (r + g + b) / 3.0;
            let s_boost = 0.25;
            r = avg + (r - avg) * (1.0 + s_boost);
            g = avg + (g - avg) * (1.0 + s_boost * 0.9);
            b = avg + (b - avg) * (1.0 + s_boost * 1.1);
            // Yellow/blue bias
            r = (r * 1.05 + 0.03).clamp(0.0, 1.0);
            g = (g * 1.05 + 0.02).clamp(0.0, 1.0);
            b = (b * 1.08 + 0.00).clamp(0.0, 1.0);

            // Subtle dither
            let n = (rand::random::<u8>() as f32 / 255.0 - 0.5) * 0.01;
            let to_u8 = |v: f32| ((v + n).clamp(0.0, 1.0) * 255.0) as u8;
            out.put_pixel(x as u32, y as u32, Rgba([to_u8(r), to_u8(g), to_u8(b), 255]));
        }
    }

    DynamicImage::ImageRgba8(out)
}

fn apply_picasso_style(img: &DynamicImage) -> DynamicImage {
    // Picasso-inspired: bold palette posterization + blocky segmentation + dark outlines
    let (width, height) = img.dimensions();
    let mut out = RgbaImage::new(width, height);

    // Vibrant palette (inspired by Picasso color blocks)
    let palette: [Rgba<u8>; 10] = [
        Rgba([230, 57, 70, 255]),   // red
        Rgba([29, 53, 87, 255]),    // navy
        Rgba([69, 123, 157, 255]),  // teal-blue
        Rgba([42, 157, 143, 255]),  // teal-green
        Rgba([233, 196, 106, 255]), // yellow
        Rgba([244, 162, 97, 255]),  // orange
        Rgba([239, 71, 111, 255]),  // pink-red
        Rgba([87, 117, 144, 255]),  // slate
        Rgba([250, 250, 250, 255]), // white
        Rgba([15, 15, 20, 255]),    // near-black (for outlines)
    ];

    // Helper closures
    #[inline]
    fn luma(p: Rgba<u8>) -> f32 {
        0.299 * p[0] as f32 + 0.587 * p[1] as f32 + 0.114 * p[2] as f32
    }
    #[inline]
    fn dist2(a: Rgba<u8>, b: Rgba<u8>) -> u32 {
        let dr = a[0] as i32 - b[0] as i32;
        let dg = a[1] as i32 - b[1] as i32;
        let db = a[2] as i32 - b[2] as i32;
        (dr * dr + dg * dg + db * db) as u32
    }
    #[inline]
    fn nearest_palette(p: Rgba<u8>, palette: &[Rgba<u8>]) -> Rgba<u8> {
        let mut best = palette[0];
        let mut best_d = dist2(p, best);
        for &c in palette.iter().skip(1) {
            let d = dist2(p, c);
            if d < best_d {
                best_d = d;
                best = c;
            }
        }
        best
    }

    // Precompute luminance for edge detection
    let mut lum = vec![0f32; (width * height) as usize];
    for y in 0..height {
        for x in 0..width {
            let p = img.get_pixel(x, y);
            lum[(y * width + x) as usize] = luma(p);
        }
    }

    // Simple Sobel edge magnitude
    let mut edge = vec![0f32; (width * height) as usize];
    if width > 2 && height > 2 {
        for y in 1..height - 1 {
            for x in 1..width - 1 {
                let idx = |xx: u32, yy: u32| -> usize { (yy * width + xx) as usize };
                let gx = -lum[idx(x - 1, y - 1)] - 2.0 * lum[idx(x - 1, y)] - lum[idx(x - 1, y + 1)]
                    + lum[idx(x + 1, y - 1)] + 2.0 * lum[idx(x + 1, y)] + lum[idx(x + 1, y + 1)];
                let gy = -lum[idx(x - 1, y - 1)] - 2.0 * lum[idx(x, y - 1)] - lum[idx(x + 1, y - 1)]
                    + lum[idx(x - 1, y + 1)] + 2.0 * lum[idx(x, y + 1)] + lum[idx(x + 1, y + 1)];
                edge[(y * width + x) as usize] = (gx * gx + gy * gy).sqrt();
            }
        }
    }

    // Dynamic block size scaled to image
    let min_dim = width.min(height);
    let block = (min_dim / 40).max(10); // 10.. for mid-size blocks

    // Block posterization
    let palette_for_fill = &palette[..9]; // keep last color for outlines
    let outline = palette[9];
    for by in (0..height).step_by(block as usize) {
        for bx in (0..width).step_by(block as usize) {
            let x1 = bx;
            let y1 = by;
            let x2 = (bx + block).min(width);
            let y2 = (by + block).min(height);

            // Average color within block
            let mut sr: u64 = 0;
            let mut sg: u64 = 0;
            let mut sb: u64 = 0;
            let mut count: u64 = 0;
            for y in y1..y2 {
                for x in x1..x2 {
                    let p = img.get_pixel(x, y);
                    sr += p[0] as u64;
                    sg += p[1] as u64;
                    sb += p[2] as u64;
                    count += 1;
                }
            }
            let avg = if count > 0 {
                Rgba([
                    (sr / count) as u8,
                    (sg / count) as u8,
                    (sb / count) as u8,
                    255,
                ])
            } else {
                Rgba([0, 0, 0, 255])
            };

            // Map average to nearest palette color
            let target = nearest_palette(avg, palette_for_fill);

            for y in y1..y2 {
                for x in x1..x2 {
                    out.put_pixel(x, y, target);
                }
            }
        }
    }

    // Overlay dark outlines on strong edges
    let mut max_edge = 0.0f32;
    for v in &edge { if *v > max_edge { max_edge = *v; } }
    let thresh = (max_edge * 0.35).max(60.0); // adaptive threshold with floor
    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let e = edge[(y * width + x) as usize];
            if e >= thresh {
                out.put_pixel(x, y, outline);
            }
        }
    }

    DynamicImage::ImageRgba8(out)
}

fn apply_cyberpunk_style(img: &DynamicImage) -> DynamicImage {
    // Enhanced Cyberpunk: teal-magenta grade, neon bloom, edge glow, light chromatic aberration
    let (width, height) = img.dimensions();
    let src = img.to_rgba8();
    let mut out = RgbaImage::new(width, height);

    let idx = |x: i32, y: i32| -> usize {
        let xx = x.clamp(0, (width as i32) - 1) as u32;
        let yy = y.clamp(0, (height as i32) - 1) as u32;
        ((yy * width + xx) * 4) as usize
    };

    let lum = |i: usize| -> f32 {
        let r = src.as_raw()[i] as f32 / 255.0;
        let g = src.as_raw()[i + 1] as f32 / 255.0;
        let b = src.as_raw()[i + 2] as f32 / 255.0;
        0.2126 * r + 0.7152 * g + 0.0722 * b
    };

    for y in 0..(height as i32) {
        for x in 0..(width as i32) {
            let i = idx(x, y);
            let r0 = src.as_raw()[i] as f32 / 255.0;
            let g0 = src.as_raw()[i + 1] as f32 / 255.0;
            let b0 = src.as_raw()[i + 2] as f32 / 255.0;
            let a = src.as_raw()[i + 3];

            // Base grade: push shadows to teal/blue, mids to magenta, cut green a bit
            let l = lum(i);
            let shadows = (1.0 - l).max(0.0).powf(2.0);
            let highlights = l.powf(2.0);
            let mids = (1.0 - shadows - highlights).max(0.0);

            let mut r = r0 * 1.05 + 0.10 * mids + 0.08 * highlights; // magenta/pink
            let mut g = g0 * 0.85 - 0.05 * mids;                      // trim green
            let mut b = b0 * 1.25 + 0.20 * shadows + 0.06 * mids;     // teal/blue push

            // Saturation boost
            let avg = (r + g + b) / 3.0;
            let s_gain = 0.35;
            r = avg + (r - avg) * (1.0 + s_gain);
            g = avg + (g - avg) * (1.0 + s_gain);
            b = avg + (b - avg) * (1.0 + s_gain);

            // Highlight mask (for bloom)
            let bright = l > 0.70;
            let mut bloom = [0.0f32; 3];
            if bright {
                // small radius blur for neon bloom
                let mut wsum = 0.0;
                for oy in -2..=2 {
                    for ox in -2..=2 {
                        let di = idx(x + ox, y + oy);
                        let ll = lum(di);
                        if ll > 0.70 {
                            let w = 1.0 / (1.0 + (ox * ox + oy * oy) as f32);
                            bloom[0] += src.as_raw()[di] as f32 / 255.0 * w;
                            bloom[1] += src.as_raw()[di + 1] as f32 / 255.0 * w;
                            bloom[2] += src.as_raw()[di + 2] as f32 / 255.0 * w;
                            wsum += w;
                        }
                    }
                }
                if wsum > 0.0 {
                    bloom[0] = (bloom[0] / wsum) * 0.9 + 0.1; // bias toward neon
                    bloom[1] = (bloom[1] / wsum) * 0.4 + 0.05;
                    bloom[2] = (bloom[2] / wsum) * 1.1 + 0.2;
                    r += bloom[0] * 0.35;
                    g += bloom[1] * 0.20;
                    b += bloom[2] * 0.45;
                }
            }

            // Edge glow using Sobel magnitude
            let gx = lum(idx(x + 1, y)) - lum(idx(x - 1, y));
            let gy = lum(idx(x, y + 1)) - lum(idx(x, y - 1));
            let grad = (gx * gx + gy * gy).sqrt();
            let edge = ((grad - 0.08) / 0.5).clamp(0.0, 1.0);
            r += edge * 0.15;   // pink edge
            b += edge * 0.25;   // cyan edge

            // Subtle chromatic aberration on edges: offset R and B
            if edge > 0.0 {
                let ir = idx(x + 1, y);
                let ib = idx(x - 1, y);
                r = (r + src.as_raw()[ir] as f32 / 255.0 * 0.5) / 1.5;
                b = (b + src.as_raw()[ib + 2] as f32 / 255.0 * 0.5) / 1.5;
            }

            // Clamp
            let to_u8 = |v: f32| (v.clamp(0.0, 1.0) * 255.0) as u8;
            out.put_pixel(
                x as u32,
                y as u32,
                Rgba([to_u8(r), to_u8(g), to_u8(b), a]),
            );
        }
    }

    DynamicImage::ImageRgba8(out)
}

// Simple random number generator for effects
mod rand {
    // Tiny xorshift PRNG to avoid panics/unreachable in WASM
    static mut STATE: u64 = 0x853c49e6748fea9b;

    #[inline]
    fn next_u8() -> u8 {
        unsafe {
            // xorshift64*
            let mut x = STATE;
            x ^= x >> 12;
            x ^= x << 25;
            x ^= x >> 27;
            STATE = x;
            let result = x.wrapping_mul(0x2545F4914F6CDD1D);
            (result & 0xFF) as u8
        }
    }

    pub fn random<T>() -> T
    where
        T: Copy + From<u8>,
    {
        next_u8().into()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet() {
        let result = greet("World");
        assert_eq!(result, "Hello, World! Welcome to Image Style Transfer");
    }

    #[test]
    fn test_style_transfer_result_creation() {
        let result = StyleTransferResult {
            success: true,
            message: "Test message".to_string(),
            processed_image_data: Some("test_data".to_string()),
        };
        
        assert_eq!(result.success, true);
        assert_eq!(result.message, "Test message");
        assert_eq!(result.processed_image_data, Some("test_data".to_string()));
    }
}
