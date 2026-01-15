import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
} from '@/shared/ui/dropdown-menu';
import { Button } from '@/shared/ui/button';
import { User, Settings, LogOut, Mail, MessageSquare, PlusCircle, Cloud, Github, LifeBuoy, Keyboard } from 'lucide-react';
import { useState } from 'react';

export function DropdownMenuTest() {
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [showActivityBar, setShowActivityBar] = useState(false);
  const [position, setPosition] = useState('bottom');

  return (
    <div className="min-h-screen bg-[#061623] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dropdown Menu Component Test</h1>
          <p className="text-gray-400">Testing Radix UI Dropdown Menu with keyboard navigation and various features</p>
        </div>

        {/* Basic Dropdown */}
        <div className="bg-[#0D2233] border border-[#193B28] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Basic Dropdown Menu</h2>
          <p className="text-gray-400 text-sm mb-4">Click the button or use keyboard navigation (Tab, Enter, Arrow keys)</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" id="basic-dropdown-trigger">Open Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" id="basic-dropdown-content">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                <span>Messages</span>
                <DropdownMenuShortcut>⌘M</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Checkbox Items */}
        <div className="bg-[#0D2233] border border-[#193B28] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Checkbox Items</h2>
          <p className="text-gray-400 text-sm mb-4">Toggle multiple options with checkboxes</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">View Options</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showStatusBar}
                onCheckedChange={setShowStatusBar}
              >
                Status Bar
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showActivityBar}
                onCheckedChange={setShowActivityBar}
              >
                Activity Bar
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="mt-4 text-white text-sm">
            <p>Status Bar: {showStatusBar ? '✓ Enabled' : '✗ Disabled'}</p>
            <p>Activity Bar: {showActivityBar ? '✓ Enabled' : '✗ Disabled'}</p>
          </div>
        </div>

        {/* Radio Items */}
        <div className="bg-[#0D2233] border border-[#193B28] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Radio Items</h2>
          <p className="text-gray-400 text-sm mb-4">Select one option from a group</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Position: {position}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
                <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="mt-4 text-white text-sm">
            <p>Selected Position: <span className="text-[#DDC66F] font-semibold">{position}</span></p>
          </div>
        </div>

        {/* Submenu */}
        <div className="bg-[#0D2233] border border-[#193B28] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Nested Submenu</h2>
          <p className="text-gray-400 text-sm mb-4">Hover or arrow right to open submenu</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>New File</span>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Invite users</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Email</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Message</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>More...</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Cloud className="mr-2 h-4 w-4" />
                  <span>More Tools</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>
                    <Github className="mr-2 h-4 w-4" />
                    <span>GitHub</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    <span>Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Keyboard className="mr-2 h-4 w-4" />
                    <span>Keyboard Shortcuts</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Keyboard Navigation Instructions */}
        <div className="bg-[#0D2233] border border-[#193B28] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Keyboard Navigation</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p><kbd className="px-2 py-1 bg-[#193B28] rounded">Tab</kbd> - Focus trigger button</p>
            <p><kbd className="px-2 py-1 bg-[#193B28] rounded">Enter</kbd> or <kbd className="px-2 py-1 bg-[#193B28] rounded">Space</kbd> - Open menu</p>
            <p><kbd className="px-2 py-1 bg-[#193B28] rounded">↑</kbd> <kbd className="px-2 py-1 bg-[#193B28] rounded">↓</kbd> - Navigate items</p>
            <p><kbd className="px-2 py-1 bg-[#193B28] rounded">→</kbd> - Open submenu</p>
            <p><kbd className="px-2 py-1 bg-[#193B28] rounded">←</kbd> - Close submenu</p>
            <p><kbd className="px-2 py-1 bg-[#193B28] rounded">Esc</kbd> - Close menu</p>
            <p><kbd className="px-2 py-1 bg-[#193B28] rounded">Enter</kbd> - Select item</p>
          </div>
        </div>
      </div>
    </div>
  );
}
