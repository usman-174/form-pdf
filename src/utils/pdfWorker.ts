// src/utils/pdfWorker.ts
export function getPdfWorkerUrl() {
    return new URL('/pdf.worker.mjs', window.location.origin).toString();
  }
  