"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Image as ImageIcon, Download, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import ImageStyleTransfer from "../components/ImageStyleTransfer";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-12">
      <motion.div
        className="text-center mb-12 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4 drop-shadow-[0_4px_24px_rgba(168,85,247,0.45)]">
          <span className="relative">
            <span
              className="absolute -inset-0.5 bg-gradient-to-r from-accent-600 to-primary-600 blur-2xl opacity-30"
              aria-hidden="true"
            />
            <span className="relative">Image Style Transfer</span>
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-100 max-w-3xl mx-auto">
          Transform your images with AI‑powered style transfer using WebAssembly
          and Rust. Choose from ONNX fast styles for instant transformations.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-accent-300">
          <Sparkles className="w-6 h-6" />
          <span className="text-base md:text-lg font-medium">
            Powered by WebAssembly & Rust
          </span>
        </div>
      </motion.div>

      <ImageStyleTransfer />

      <div className="mt-20 text-center">
        <motion.h2
          className="text-2xl font-semibold text-white mb-6 relative z-10"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          How It Works
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <motion.div
            className="card text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            whileHover={{ y: -4 }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/10">
              <Upload className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Upload Image
            </h3>
            <p className="text-gray-300">
              Select any image from your device to get started
            </p>
          </motion.div>

          <motion.div
            className="card text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            whileHover={{ y: -4 }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/10">
              <Sparkles className="w-8 h-8 text-accent-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Choose Style
            </h3>
            <p className="text-gray-300">
              Pick from our fast ONNX neural style models
            </p>
          </motion.div>

          <motion.div
            className="card text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            whileHover={{ y: -4 }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/10">
              <Download className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Download Result
            </h3>
            <p className="text-gray-300">
              Get your transformed image ready to use
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
