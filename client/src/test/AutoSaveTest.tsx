/**
 * Test component for auto-save functionality
 */

import { useState } from 'react';
import { useAutoSave } from '@/shared/hooks';
import { SaveIndicator, FloatingSaveIndicator } from '@/shared/ui/SaveIndicator';

interface FormData {
  name: string;
  email: string;
  message: string;
}

export function AutoSaveTest() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });

  const [serverVersion, setServerVersion] = useState<string>('v1');
  const [saveLog, setSaveLog] = useState<string[]>([]);

  // Simulate API save with version tracking
  const handleSave = async (data: FormData) => {
    // Add to log
    const timestamp = new Date().toLocaleTimeString();
    setSaveLog((prev) => [...prev, `${timestamp}: Saving data...`]);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulate occasional errors (10% chance)
    if (Math.random() < 0.1) {
      setSaveLog((prev) => [...prev, `${timestamp}: ❌ Save failed (network error)`]);
      throw new Error('Network error');
    }

    // Update version
    const newVersion = `v${parseInt(serverVersion.substring(1)) + 1}`;
    setServerVersion(newVersion);

    setSaveLog((prev) => [...prev, `${timestamp}: ✅ Saved successfully (${newVersion})`]);

    return { version: newVersion };
  };

  const autoSave = useAutoSave({
    data: formData,
    onSave: handleSave,
    debounceMs: 1000,
    saveOnBlur: true,
    saveBeforeNavigation: true,
    retryAttempts: 3,
    serverVersion,
    onSaveSuccess: (result) => {
      console.log('[AutoSave] Save succeeded:', result);
    },
    onSaveError: (error) => {
      console.error('[AutoSave] Save failed:', error);
    },
    onConflict: (serverVer, localVer) => {
      console.warn('[AutoSave] Conflict detected:', { serverVer, localVer });
    },
  });

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const clearLog = () => {
    setSaveLog([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Auto-Save Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test auto-save functionality with debouncing, retry logic, and visual indicators
          </p>
        </div>

        {/* Status Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SaveIndicator
                status={autoSave.status}
                error={autoSave.error?.message}
                showLabel={true}
                size="md"
              />
              {autoSave.isDirty && (
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  • Unsaved changes
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Server version: {serverVersion}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Form
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleFieldChange('message', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your message"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-3">
              <button
                onClick={() => autoSave.save()}
                disabled={autoSave.isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {autoSave.isSaving ? 'Saving...' : 'Save Now'}
              </button>
              <button
                onClick={() => autoSave.clearError()}
                disabled={!autoSave.error}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Error
              </button>
              <button
                onClick={() => autoSave.resetDirty()}
                disabled={!autoSave.isDirty}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset Dirty
              </button>
            </div>
          </div>
        </div>

        {/* Save Log */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Save Log
            </h2>
            <button
              onClick={clearLog}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Log
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 max-h-64 overflow-y-auto">
            {saveLog.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No saves yet. Start typing to trigger auto-save...
              </p>
            ) : (
              <div className="space-y-1">
                {saveLog.map((log, index) => (
                  <p
                    key={index}
                    className="text-sm font-mono text-gray-700 dark:text-gray-300"
                  >
                    {log}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Testing Instructions
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Type in any field - auto-save triggers after 1 second</li>
            <li>• Click outside form - save on blur is enabled</li>
            <li>• Navigate away - saves before navigation (with prompt if unsaved)</li>
            <li>• 10% chance of save failure to test retry logic</li>
            <li>• Watch save indicator for status updates</li>
          </ul>
        </div>
      </div>

      {/* Floating Save Indicator */}
      <FloatingSaveIndicator
        status={autoSave.status}
        error={autoSave.error?.message}
        position="bottom-right"
      />
    </div>
  );
}
