import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentViewerProps {
  documentUrl: string;
  documentType: string;
  filename?: string;
  onClose?: () => void;
}

export default function DocumentViewer({
  documentUrl,
  documentType,
  filename,
  onClose,
}: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPdf = documentType === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf');
  const isImage = documentType?.startsWith('image/') ||
    /\.(png|jpg|jpeg|gif|webp)$/i.test(filename || '');

  useEffect(() => {
    // Reset state when document changes
    setPageNumber(1);
    setScale(1.0);
    setLoading(true);
    setError(null);
  }, [documentUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF document. Please try again.');
    setLoading(false);
  };

  const onImageLoad = () => {
    setLoading(false);
  };

  const onImageError = () => {
    setError('Failed to load image. Please try again.');
    setLoading(false);
  };

  const goToPreviousPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || prev));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isPdf && numPages) {
      if (e.key === 'ArrowLeft') {
        goToPreviousPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      }
    }
    if (e.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false);
    }
  };

  return (
    <div
      className={`document-viewer ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {filename || 'Document'}
          </h3>
          {isPdf && numPages && (
            <p className="text-sm text-gray-500">
              Page {pageNumber} of {numPages}
            </p>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 border-r pr-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>

            <span className="text-sm font-medium min-w-[4rem] text-center">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom in"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>

            <button
              onClick={resetZoom}
              className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
              title="Reset zoom"
            >
              Reset
            </button>
          </div>

          {/* PDF navigation */}
          {isPdf && numPages && numPages > 1 && (
            <div className="flex items-center gap-1 border-r pr-2">
              <button
                onClick={goToPreviousPage}
                disabled={pageNumber <= 1}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-100 rounded"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded ml-2"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Document content */}
      <div className={`overflow-auto ${isFullscreen ? 'h-[calc(100vh-73px)]' : 'h-[600px]'} bg-gray-100`}>
        <div className="flex items-center justify-center min-h-full p-4">
          {loading && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading document...</p>
            </div>
          )}

          {error && (
            <div className="max-w-md p-6 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-center text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && isPdf && (
            <div className="bg-white shadow-lg">
              <Document
                file={documentUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<div className="p-8 text-center">Loading PDF...</div>}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          )}

          {!loading && !error && isImage && (
            <div className="bg-white shadow-lg p-4 max-w-full">
              <img
                src={documentUrl}
                alt={filename || 'Document'}
                onLoad={onImageLoad}
                onError={onImageError}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center',
                  transition: 'transform 0.2s ease-in-out',
                  maxWidth: '100%',
                  height: 'auto',
                }}
                className="mx-auto"
              />
            </div>
          )}

          {!loading && !error && !isPdf && !isImage && (
            <div className="max-w-md p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-center text-yellow-800">
                Unsupported document type. Please download the file to view it.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      {isPdf && numPages && numPages > 1 && !isFullscreen && (
        <div className="p-2 bg-gray-50 border-t text-center text-xs text-gray-500">
          Tip: Use arrow keys (← →) to navigate pages, Esc to exit fullscreen
        </div>
      )}
    </div>
  );
}
