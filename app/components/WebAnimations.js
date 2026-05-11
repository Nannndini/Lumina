/**
 * WebAnimations.js — single source of truth for all Lumina web CSS animations.
 * Import and render at the root of App.js on web only.
 * This keeps all keyframes in one place, easy to maintain.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function WebAnimations() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (document.getElementById('lumina-web-animations')) return;

    const style = document.createElement('style');
    style.id = 'lumina-web-animations';
    style.textContent = `
      /* ── 1. AURORA BACKGROUND ── */
      @keyframes aurora {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .aurora-bg {
        background: linear-gradient(-45deg, #0a0015, #1a0030, #0d001a, #16003a, #0a0015) !important;
        background-size: 400% 400% !important;
        animation: aurora 8s ease infinite !important;
      }

      /* ── 2. SHIMMER TITLE ── */
      @keyframes shimmer {
        0%   { background-position: -200% center; }
        100% { background-position:  200% center; }
      }
      .shimmer-text {
        background: linear-gradient(90deg, #c084fc 0%, #f472b6 25%, #ffffff 50%, #f472b6 75%, #c084fc 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 3s linear infinite;
        font-size: 42px;
        font-weight: 900;
        margin: 0 0 4px 0;
        letter-spacing: 1px;
        display: inline-block;
      }

      /* ── 3. ORBIT RINGS ── */
      @keyframes orbit1 {
        from { transform: rotateX(70deg) rotateZ(0deg); }
        to   { transform: rotateX(70deg) rotateZ(360deg); }
      }
      @keyframes orbit2 {
        from { transform: rotateX(70deg) rotateZ(120deg); }
        to   { transform: rotateX(70deg) rotateZ(480deg); }
      }
      @keyframes orbit3 {
        from { transform: rotateX(70deg) rotateZ(240deg); }
        to   { transform: rotateX(70deg) rotateZ(600deg); }
      }
      .ring-container {
        position: absolute;
        width: 260px;
        height: 260px;
        top: -20px;
        left: -20px;
        pointer-events: none;
        z-index: 2;
      }
      .ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid transparent;
      }
      .ring1 { border-color: #c084fc; animation: orbit1 3s linear infinite; }
      .ring2 { border-color: #f472b6; animation: orbit2 4s linear infinite; }
      .ring3 { border-color: #a855f7; animation: orbit3 5s linear infinite; }

      /* ── 4. PIXEL TRAIL CURSOR ── */
      @keyframes fadePixel {
        from { opacity: 1; transform: scale(1); }
        to   { opacity: 0; transform: scale(0); }
      }
      .lumina-pixel {
        position: fixed;
        width: 6px;
        height: 6px;
        border-radius: 2px;
        pointer-events: none;
        z-index: 9999;
        animation: fadePixel 0.5s ease forwards;
      }

      /* ── 5. RESULT CARD ENTRANCE ── */
      @keyframes cardEntrance {
        from { opacity: 0; transform: translateY(40px) scale(0.95); }
        to   { opacity: 1; transform: translateY(0)   scale(1);    }
      }
      .result-card {
        animation: cardEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      /* ── 6. SCAN BUTTON PULSE ── */
      @keyframes btnPulse {
        0%   { box-shadow: 0 4px 20px #7c3aed60; }
        50%  { box-shadow: 0 4px 40px #a855f780, 0 0 60px #7c3aed40; }
        100% { box-shadow: 0 4px 20px #7c3aed60; }
      }
      .scan-btn-pulse {
        animation: btnPulse 2s ease infinite;
      }

      /* ── 7. STAR TWINKLE ── */
      @keyframes twinkle {
        0%, 100% { opacity: 0.3; transform: scale(1);   }
        50%       { opacity: 1;   transform: scale(1.5); }
      }
      /* Applied dynamically per star via inline style */

      /* ── 9. HISTORY CARD SLIDE-IN ── */
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(-20px); }
        to   { opacity: 1; transform: translateX(0);     }
      }
      .history-card-slide {
        animation: slideIn 0.4s ease forwards;
        opacity: 0;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
}
