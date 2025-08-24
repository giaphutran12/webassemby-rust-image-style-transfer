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
    let mut processed = img.clone();
    
    // Cyberpunk style: neon colors, high saturation, futuristic look
    let (width, height) = processed.dimensions();
    let mut new_img = RgbaImage::new(width, height);
    
    for y in 0..height {
        for x in 0..width {
            let pixel = processed.get_pixel(x, y);
            let mut new_pixel = pixel;
            
            // Enhance neon colors
            new_pixel[0] = (pixel[0] as f32 * 1.5).min(255.0) as u8; // Red
            new_pixel[1] = (pixel[1] as f32 * 0.8).min(255.0) as u8; // Green
            new_pixel[2] = (pixel[2] as f32 * 1.6).min(255.0) as u8; // Blue
            
            // Add neon glow effect
            if pixel[0] > 200 || pixel[2] > 200 {
                new_pixel[0] = 255;
                new_pixel[1] = 0;
                new_pixel[2] = 255;
            }
            
            // Add scan lines effect
            if y % 2 == 0 {
                new_pixel[0] = (new_pixel[0] as u16 + 20).min(255) as u8;
                new_pixel[1] = (new_pixel[1] as u16 + 20).min(255) as u8;
                new_pixel[2] = (new_pixel[2] as u16 + 20).min(255) as u8;
            }
            
            new_img.put_pixel(x, y, new_pixel);
        }
    }
    
    DynamicImage::ImageRgba8(new_img)
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
