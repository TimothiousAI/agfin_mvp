import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../shared/ui/dialog';
import { Button } from '../shared/ui/button';
import { Input } from '../shared/ui/input';
import { Label } from '../shared/ui/label';
import { Card } from '../shared/ui/card';

export function DialogTest() {
  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#061623]">Dialog/Modal Component Test</h1>

        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#061623]">Basic Dialog</h2>
            <Dialog open={isOpen1} onOpenChange={setIsOpen1}>
              <DialogTrigger asChild>
                <Button id="open-dialog-1">Open Basic Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Basic Dialog</DialogTitle>
                  <DialogDescription>
                    This is a basic dialog with header, content, and footer sections.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-gray-600">
                    Dialog content goes here. The backdrop has a blur effect and the dialog
                    animates in with opacity and scale transitions.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen1(false)} id="close-dialog-1">
                    Close
                  </Button>
                  <Button onClick={() => setIsOpen1(false)}>Okay</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#061623]">Dialog with Form</h2>
            <Dialog open={isOpen2} onOpenChange={setIsOpen2}>
              <DialogTrigger asChild>
                <Button variant="secondary" id="open-dialog-2">
                  Open Form Dialog
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Farm Details</DialogTitle>
                  <DialogDescription>
                    Enter the farm information below. Press ESC or click outside to close.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="farm-name">Farm Name</Label>
                    <Input id="farm-name" placeholder="Green Acres Farm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="farm-acres">Total Acres</Label>
                    <Input id="farm-acres" type="number" placeholder="450" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="farm-crop">Primary Crop</Label>
                    <Input id="farm-crop" placeholder="Wheat" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen2(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsOpen2(false)} id="save-dialog-2">
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#061623]">Features Tested</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>Backdrop overlay with blur effect</li>
              <li>Fade and scale animations on open/close</li>
              <li>Focus trap - Tab key stays within dialog</li>
              <li>ESC key closes the dialog</li>
              <li>Click outside closes the dialog</li>
              <li>Close button in top-right corner</li>
              <li>Header, content, and footer sections</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
