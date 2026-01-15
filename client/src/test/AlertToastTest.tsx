import { useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '../shared/ui/alert';
import { Button } from '../shared/ui/button';
import { Card } from '../shared/ui/card';
import { useToast } from '../shared/ui/use-toast';
import { Toaster } from '../shared/ui/toaster';

export function AlertToastTest() {
  const { toast } = useToast();
  const [showAlerts, setShowAlerts] = useState({
    success: true,
    warning: true,
    error: true,
    info: true,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#061623]">Alert & Toast Test</h1>

        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#061623]">Alert Components</h2>
            <div className="space-y-4">
              {showAlerts.success && (
                <Alert variant="success" onClose={() => setShowAlerts(prev => ({ ...prev, success: false }))}>
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Your application has been submitted successfully.
                  </AlertDescription>
                </Alert>
              )}

              {showAlerts.warning && (
                <Alert variant="warning" onClose={() => setShowAlerts(prev => ({ ...prev, warning: false }))}>
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Please review your information before proceeding.
                  </AlertDescription>
                </Alert>
              )}

              {showAlerts.error && (
                <Alert variant="error" onClose={() => setShowAlerts(prev => ({ ...prev, error: false }))}>
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    There was an error processing your request. Please try again.
                  </AlertDescription>
                </Alert>
              )}

              {showAlerts.info && (
                <Alert variant="info" onClose={() => setShowAlerts(prev => ({ ...prev, info: false }))}>
                  <AlertTitle>Information</AlertTitle>
                  <AlertDescription>
                    Your data will be saved automatically every 30 seconds.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={() => setShowAlerts({ success: true, warning: true, error: true, info: true })}
                variant="outline"
              >
                Reset All Alerts
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#061623]">Toast Notifications</h2>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  id="toast-success"
                  onClick={() => {
                    toast({
                      variant: "success",
                      title: "Success!",
                      description: "Your changes have been saved successfully.",
                    });
                  }}
                >
                  Show Success Toast
                </Button>

                <Button
                  id="toast-warning"
                  variant="secondary"
                  onClick={() => {
                    toast({
                      variant: "warning",
                      title: "Warning",
                      description: "This action cannot be undone.",
                    });
                  }}
                >
                  Show Warning Toast
                </Button>

                <Button
                  id="toast-error"
                  variant="destructive"
                  onClick={() => {
                    toast({
                      variant: "error",
                      title: "Error",
                      description: "Failed to process your request.",
                    });
                  }}
                >
                  Show Error Toast
                </Button>

                <Button
                  id="toast-info"
                  variant="outline"
                  onClick={() => {
                    toast({
                      variant: "info",
                      title: "Info",
                      description: "New features are available in the latest update.",
                    });
                  }}
                >
                  Show Info Toast
                </Button>
              </div>

              <p className="text-sm text-gray-600 mt-4">
                Toasts will automatically dismiss after 4 seconds. You can also close them manually.
              </p>
            </div>
          </div>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
