/**
 * Test component for loading states and skeleton loaders
 */

import { useState } from 'react';
import {
  Skeleton,
  SkeletonShimmer,
  SkeletonText,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  Spinner,
  ProgressBar,
  LoadingButton,
  LoadingOverlay,
} from '@/shared/ui/Skeleton';

export function SkeletonTest() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const simulateButtonClick = () => {
    setButtonLoading(true);
    setTimeout(() => {
      setButtonLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Loading States & Skeleton Loaders
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive loading UX components with animations
          </p>
        </div>

        {/* Spinners */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Spinners
          </h2>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <Spinner size="sm" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Small</p>
            </div>
            <div className="text-center">
              <Spinner size="md" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Medium</p>
            </div>
            <div className="text-center">
              <Spinner size="lg" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Large</p>
            </div>
          </div>
        </section>

        {/* Progress Bars */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Progress Bars
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Simulator
              </h3>
              <ProgressBar
                value={uploadProgress}
                showLabel
                variant={uploadProgress === 100 ? 'success' : 'default'}
                size="lg"
              />
              <div className="mt-3">
                <button
                  onClick={simulateUpload}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Start Upload'}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Variants
              </h3>
              <div className="space-y-4">
                <ProgressBar value={75} showLabel variant="default" />
                <ProgressBar value={100} showLabel variant="success" />
                <ProgressBar value={50} showLabel variant="warning" />
                <ProgressBar value={25} showLabel variant="error" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Indeterminate (Unknown Duration)
              </h3>
              <ProgressBar value={0} showLabel indeterminate variant="default" />
            </div>
          </div>
        </section>

        {/* Skeleton Text */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Skeleton Text
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Pulse Animation
              </h3>
              <SkeletonText lines={4} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Shimmer Effect
              </h3>
              <div className="space-y-2">
                <SkeletonShimmer className="h-4 w-full" />
                <SkeletonShimmer className="h-4 w-full" />
                <SkeletonShimmer className="h-4 w-3/4" />
                <SkeletonShimmer className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        </section>

        {/* Skeleton Cards */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Skeleton Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard hasImage hasAvatar lines={3} />
            <SkeletonCard hasImage={false} hasAvatar lines={4} />
            <SkeletonCard hasImage hasAvatar={false} lines={2} />
          </div>
        </section>

        {/* Skeleton List */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Skeleton List
          </h2>
          <SkeletonList count={5} hasAvatar />
        </section>

        {/* Skeleton Table */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Skeleton Table
          </h2>
          <SkeletonTable rows={5} columns={4} />
        </section>

        {/* Loading Buttons */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Loading Buttons
          </h2>
          <div className="flex gap-4">
            <LoadingButton
              loading={buttonLoading}
              onClick={simulateButtonClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Click Me
            </LoadingButton>
            <LoadingButton
              loading={true}
              className="px-4 py-2 bg-gray-600 text-white rounded-md"
            >
              Loading State
            </LoadingButton>
            <LoadingButton
              loading={false}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Normal State
            </LoadingButton>
          </div>
        </section>

        {/* Loading Overlay */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Loading Overlay
          </h2>
          <button
            onClick={() => {
              setShowOverlay(true);
              setTimeout(() => setShowOverlay(false), 2000);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Show Overlay (2s)
          </button>
        </section>

        {/* Usage Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Components Available
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Skeleton - Base skeleton with pulse animation</li>
            <li>• SkeletonShimmer - Skeleton with shimmer effect</li>
            <li>• SkeletonText - Multiple text lines</li>
            <li>• SkeletonCard - Card with image and avatar</li>
            <li>• SkeletonList - List items with avatars</li>
            <li>• SkeletonTable - Table rows and columns</li>
            <li>• Spinner - Loading spinner (sm/md/lg)</li>
            <li>• ProgressBar - Progress indicator with variants</li>
            <li>• LoadingButton - Button with loading state</li>
            <li>• LoadingOverlay - Full page loading overlay</li>
          </ul>
        </div>
      </div>

      <LoadingOverlay show={showOverlay} message="Processing..." size="lg" />
    </div>
  );
}
