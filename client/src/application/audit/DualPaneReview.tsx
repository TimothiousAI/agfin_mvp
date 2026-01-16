import { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { PanelResizer } from '../shell/PanelResizer';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Extracted field data for display
 */
export interface ExtractedField {
  id: string;
  fieldName: string;
  value: string | number | null;
  confidence: number;
  location?: {
    pageNumber: number;
    boundingBox: { x: number; y: number; width: number; height: number };
  };
  status: 'pending' | 'reviewed' | 'edited';
}

/**
 * Props for DualPaneReview component
 */
export interface DualPaneReviewProps {
  /** PDF document URL or file */
  pdfUrl: string;
  /** Extracted fields from document */
  extractedFields: ExtractedField[];
  /** Currently highlighted field */
  highlightedFieldId?: string;
  /** Callback when field is clicked */
  onFieldClick?: (field: ExtractedField) => void;
  /** Callback when field is edited */
  onFieldEdit?: (fieldId: string, newValue: string) => void;
  /** Callback when field is confirmed */
  onFieldConfirm?: (fieldId: string) => void;
  /** Custom right pane content (overrides default field list) */
  rightPaneContent?: React.ReactNode;
  /** Enable synchronized scrolling */
  synchronizedScrolling?: boolean;
  /** Initial pane width ratio (0-1, default 0.5) */
  initialSplitRatio?: number;
  /** Loading state */
  loading?: boolean;
}

/**
 * Dual Pane Review Component
 *
 * Audit view with side-by-side document and extracted fields:
 * - Left pane: PDF document viewer with zoom and navigation
 * - Right pane: Extracted fields list with confidence indicators
 * - Resizable divider between panes
 * - Field highlighting on document when clicked
 * - Full-screen toggle for PDF viewer
 * - Synchronized scrolling option
 * - Responsive layout
 */
export default function DualPaneReview({
  pdfUrl,
  extractedFields,
  highlightedFieldId: _highlightedFieldId,
  onFieldClick: _onFieldClick,
  onFieldEdit: _onFieldEdit,
  onFieldConfirm: _onFieldConfirm,
  rightPaneContent,
  synchronizedScrolling = false,
  initialSplitRatio = 0.5,
  loading = false,
}: DualPaneReviewProps) {
  // Panel sizing state
  const [leftPaneWidth, setLeftPaneWidth] = useState<number>(initialSplitRatio * 100);
  const containerRef = useRef<HTMLDivElement>(null);

  // PDF viewer state
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Scroll sync state
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });

  /**
   * Handle panel resize
   */
  const handleResize = useCallback((delta: number) => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const deltaPercent = (delta / containerWidth) * 100;

    setLeftPaneWidth((prev) => {
      const newWidth = prev + deltaPercent;
      // Clamp between 20% and 80%
      return Math.max(20, Math.min(80, newWidth));
    });
  }, []);

  /**
   * Reset to 50/50 split
   */
  const handleDoubleClickDivider = useCallback(() => {
    setLeftPaneWidth(50);
  }, []);

  /**
   * Handle PDF document load
   */
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setPdfError(null);
  }, []);

  /**
   * Handle PDF load error
   */
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setPdfError('Failed to load PDF document');
  }, []);

  /**
   * Navigate to specific page
   */
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= numPages) {
        setPageNumber(page);
      }
    },
    [numPages]
  );

  /**
   * Zoom in
   */
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  }, []);

  /**
   * Zoom out
   */
  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  }, []);

  /**
   * Toggle full-screen mode
   */
  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
  }, []);

  /**
   * Synchronized scrolling handler
   */
  useEffect(() => {
    if (!synchronizedScrolling || !leftPaneRef.current || !rightPaneRef.current) return;

    const leftPane = leftPaneRef.current;
    const rightPane = rightPaneRef.current;

    const handleLeftScroll = () => {
      if (isScrolling.right) return;

      setIsScrolling({ left: true, right: false });
      const scrollRatio = leftPane.scrollTop / (leftPane.scrollHeight - leftPane.clientHeight);
      rightPane.scrollTop = scrollRatio * (rightPane.scrollHeight - rightPane.clientHeight);

      setTimeout(() => setIsScrolling({ left: false, right: false }), 100);
    };

    const handleRightScroll = () => {
      if (isScrolling.left) return;

      setIsScrolling({ left: false, right: true });
      const scrollRatio = rightPane.scrollTop / (rightPane.scrollHeight - rightPane.clientHeight);
      leftPane.scrollTop = scrollRatio * (leftPane.scrollHeight - leftPane.clientHeight);

      setTimeout(() => setIsScrolling({ left: false, right: false }), 100);
    };

    leftPane.addEventListener('scroll', handleLeftScroll);
    rightPane.addEventListener('scroll', handleRightScroll);

    return () => {
      leftPane.removeEventListener('scroll', handleLeftScroll);
      rightPane.removeEventListener('scroll', handleRightScroll);
    };
  }, [synchronizedScrolling, isScrolling]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#061623]">
        <div className="text-white text-lg">Loading document...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex h-full bg-[#061623] ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}
      data-tour="audit-view"
    >
      {/* Left Pane - PDF Viewer */}
      <div
        ref={leftPaneRef}
        className="flex flex-col overflow-hidden bg-[#0D2233]"
        style={{ width: isFullScreen ? '100%' : `${leftPaneWidth}%` }}
      >
        {/* PDF Toolbar */}
        <div className="flex items-center justify-between bg-[#061623] border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => goToPage(pageNumber - 1)}
              disabled={pageNumber <= 1}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-white text-sm font-medium min-w-[80px] text-center">
              {numPages > 0 ? `${pageNumber} / ${numPages}` : 'Loading...'}
            </span>

            <button
              onClick={() => goToPage(pageNumber + 1)}
              disabled={pageNumber >= numPages}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>

            <span className="text-white text-sm font-medium min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-white/10" />

            <button
              onClick={toggleFullScreen}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
              aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* PDF Document */}
        <div className="flex-1 overflow-auto bg-gray-800 flex items-start justify-center p-4">
          {pdfError ? (
            <div className="text-red-400 text-center p-8">
              <p className="font-semibold mb-2">Error Loading PDF</p>
              <p className="text-sm">{pdfError}</p>
            </div>
          ) : (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="text-white p-8">
                  <div className="animate-pulse">Loading PDF...</div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </Document>
          )}
        </div>
      </div>

      {/* Resizable Divider - Only show when not full screen */}
      {!isFullScreen && (
        <PanelResizer
          direction="horizontal"
          onResize={handleResize}
          onDoubleClick={handleDoubleClickDivider}
          className="bg-white/5 hover:bg-[#30714C]/20"
        />
      )}

      {/* Right Pane - Extracted Fields or Custom Content */}
      {!isFullScreen && (
        <div
          ref={rightPaneRef}
          className="flex flex-col overflow-hidden bg-[#0D2233]"
          style={{ width: `${100 - leftPaneWidth}%` }}
        >
          {rightPaneContent || (
            <div className="flex-1 overflow-auto p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Extracted Fields ({extractedFields.length})
              </h2>

              {/* Fields will be rendered by ExtractedFieldList component passed as rightPaneContent */}
              <div className="text-white/60 text-sm">
                Pass ExtractedFieldList component as rightPaneContent prop
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
