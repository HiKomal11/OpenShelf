"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
"pdfjs-dist/build/pdf.worker.min.mjs",
import.meta.url
).toString();

type PDFReaderProps = {
fileUrl: string;
};

export default function PDFReader({ fileUrl }: PDFReaderProps) {
const [numPages, setNumPages] = useState<number>(0);
const [pageNumber, setPageNumber] = useState<number>(1);
const [scale, setScale] = useState<number>(1);
const [loadError, setLoadError] = useState(false);

function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
setNumPages(numPages);
setPageNumber(1);
setLoadError(false);
}

function goToPreviousPage() {
setPageNumber((currentPage) => Math.max(currentPage - 1, 1));
}

function goToNextPage() {
setPageNumber((currentPage) =>
Math.min(currentPage + 1, numPages)
);
}

function zoomIn() {
setScale((currentScale) =>
Math.min(Number((currentScale + 0.2).toFixed(2)), 2)
);
}

function zoomOut() {
setScale((currentScale) =>
Math.max(Number((currentScale - 0.2).toFixed(2)), 0.6)
);
}

function resetZoom() {
setScale(1);
}

function openInNewTab() {
window.open(fileUrl, "_blank", "noopener,noreferrer");
}

const buttonClass =
"inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300";

return ( <section
   aria-label="PDF document reader"
   className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
 > <div className="border-b border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-5"> <div className="flex flex-col gap-5"> <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"> <div className="min-w-0"> <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
PDF reader </p> <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
Read, navigate, and zoom into this document. </p> </div>


        <button
          type="button"
          onClick={openInNewTab}
          className={`${buttonClass} w-full shrink-0 sm:w-auto`}
        >
          <span className="mr-2" aria-hidden="true">↗</span>
          Open in new tab
        </button>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={pageNumber <= 1 || numPages === 0}
            className={buttonClass}
          >
            <span className="mr-1" aria-hidden="true">←</span>
            Previous
          </button>

          <span
            className="min-w-0 flex-1 text-center text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200 sm:flex-none sm:px-2"
            aria-live="polite"
            aria-atomic="true"
          >
            {numPages > 0
              ? `Page ${pageNumber} of ${numPages}`
              : "Loading pages…"}
          </span>

          <button
            type="button"
            onClick={goToNextPage}
            disabled={numPages === 0 || pageNumber >= numPages}
            className={buttonClass}
          >
            Next
            <span className="ml-1" aria-hidden="true">→</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 sm:justify-end">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Zoom
          </span>

          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= 0.6}
            aria-label="Zoom out"
            title="Zoom out"
            className={`${buttonClass} w-10 px-0 text-xl leading-none`}
          >
            −
          </button>

          <button
            type="button"
            onClick={resetZoom}
            aria-label="Reset zoom to 100 percent"
            title="Reset zoom"
            className={`${buttonClass} min-w-[4.5rem] px-2 tabular-nums`}
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= 2}
            aria-label="Zoom in"
            title="Zoom in"
            className={`${buttonClass} w-10 px-0 text-xl leading-none`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  </div>

  <div className="min-h-[320px] overflow-auto bg-slate-100 p-2 dark:bg-slate-950 sm:min-h-[500px] sm:p-4 lg:p-6">
    {loadError ? (
      <div
        role="alert"
        className="mx-auto my-12 max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center dark:border-red-900 dark:bg-slate-900"
      >
        <p className="font-semibold text-red-700 dark:text-red-300">
          Unable to load this PDF
        </p>
        <p className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-slate-400">
          The file may be unavailable or the connection may have been interrupted.
          Try opening the document in a new tab or reload the page.
        </p>
        <button
          type="button"
          onClick={() => {
            setLoadError(false);
            setNumPages(0);
            setPageNumber(1);
          }}
          className={`${buttonClass} mt-4`}
        >
          Retry loading
        </button>
      </div>
    ) : (
      <Document
        key={fileUrl}
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={() => setLoadError(true)}
        loading={
          <div
            role="status"
            className="flex min-h-[280px] items-center justify-center px-4 text-center text-sm text-slate-600 dark:text-slate-300"
          >
            Loading PDF…
          </div>
        }
        error={
          <div
            role="alert"
            className="flex min-h-[280px] items-center justify-center px-4 text-center text-sm text-red-600 dark:text-red-300"
          >
            Unable to load this PDF.
          </div>
        }
        className="flex justify-center"
      >
        {numPages > 0 && (
          <div className="mx-auto w-fit max-w-full overflow-auto rounded-sm bg-white shadow-md">
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer
              renderAnnotationLayer
              loading={
                <div
                  role="status"
                  className="flex min-h-[300px] items-center justify-center p-8 text-sm text-slate-500"
                >
                  Rendering page…
                </div>
              }
            />
          </div>
        )}
      </Document>
    )}
  </div>

  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
    <span>Text selection and PDF links are supported where available.</span>
    <span>Zoom: 60%–200%</span>
  </div>
</section>

);
}
