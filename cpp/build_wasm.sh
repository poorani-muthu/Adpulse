#!/bin/bash
# build_wasm.sh — Compiles C++ engines to WebAssembly via Emscripten
# Prerequisites: Install Emscripten https://emscripten.org/docs/getting_started/downloads.html

set -e

echo "🔨 Building C++ engines to WebAssembly..."

emcc src/ABTestEngine.cpp src/KeywordMatchEngine.cpp src/ClickFraudDetector.cpp \
  -I include \
  -O3 \
  -s WASM=1 \
  -s EXPORTED_RUNTIME_METHODS='["cwrap","ccall"]' \
  -s EXPORTED_FUNCTIONS='["_ab_test","_keyword_match","_detect_fraud","_malloc","_free"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME=AdPulseEngines \
  -o ../frontend/public/adpulse_engines.js

echo "✅ WASM build complete: frontend/public/adpulse_engines.js + adpulse_engines.wasm"
echo "   Import in React: import AdPulseEngines from '/adpulse_engines.js'"
