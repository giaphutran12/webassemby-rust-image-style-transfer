use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

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
    _image_data: &[u8],
    style: &str,
) -> JsValue {
    // Currently only ONNX styles are supported
    let result = StyleTransferResult {
        success: false,
        message: format!("Style '{}' not supported. Only ONNX styles are available.", style),
        processed_image_data: None,
    };
    return serde_wasm_bindgen::to_value(&result).unwrap_or_else(|_| JsValue::NULL);
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
