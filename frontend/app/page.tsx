"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Image as ImageIcon, Download, Sparkles } from "lucide-react";
import ImageStyleTransfer from "../components/ImageStyleTransfer";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          Image Style Transfer
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Transform your images with AI-powered style transfer using WebAssembly
          and Rust. Choose from Van Gogh, Picasso, or Cyberpunk styles.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-accent-600">
          <Sparkles className="w-6 h-6" />
          <span className="text-lg font-medium">
            Powered by WebAssembly & Rust
          </span>
        </div>
      </div>

      <ImageStyleTransfer />

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Upload Image
            </h3>
            <p className="text-gray-600">
              Select any image from your device to get started
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-accent-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Choose Style
            </h3>
            <p className="text-gray-600">
              Pick from Van Gogh, Picasso, or Cyberpunk styles
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Download Result
            </h3>
            <p className="text-gray-600">
              Get your transformed image ready to use
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
