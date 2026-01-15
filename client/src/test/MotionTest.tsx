import { useState } from 'react';
import { AnimatePresence, Fade, SlideUp, Panel, Scale, motion } from '@/shared/ui/motion';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/shared/ui/card';
import {
  fadeVariants,
  slideUpVariants,
  scaleVariants,
  staggerContainer,
  staggerItem,
  rotateVariants,
  pulseVariants,
  prefersReducedMotion,
} from '@/lib/animations';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function MotionTest() {
  const [showFade, setShowFade] = useState(true);
  const [showSlide, setShowSlide] = useState(true);
  const [showScale, setShowScale] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [panelDirection, setPanelDirection] = useState<'left' | 'right'>('right');
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion());

  const listItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

  return (
    <div className="min-h-screen bg-[#061623] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Framer Motion Animations Test</h1>
          <p className="text-gray-400">Testing animation presets and reduced motion support</p>
        </div>

        {/* Reduced Motion Indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className={reducedMotion ? 'text-[#DDC66F]' : 'text-[#30714C]'} />
              <div>
                <p className="text-white font-medium">
                  Reduced Motion: {reducedMotion ? 'ENABLED' : 'DISABLED'}
                </p>
                <p className="text-sm text-gray-400">
                  {reducedMotion
                    ? 'Animations are disabled or minimal for accessibility'
                    : 'Animations are enabled and running normally'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setReducedMotion(!reducedMotion)}
              className="mt-4"
              size="sm"
              id="toggle-reduced-motion"
            >
              Simulate {reducedMotion ? 'Disable' : 'Enable'} Reduced Motion
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fade Animation */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-white">Fade Animation</h2>
              <p className="text-sm text-gray-400">Simple opacity transition</p>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {showFade && (
                  <Fade key="fade-box">
                    <div className="bg-[#30714C] text-white p-6 rounded-lg text-center" id="fade-demo">
                      <p className="font-medium">Fading Content</p>
                      <p className="text-sm opacity-80 mt-2">Smooth opacity transition</p>
                    </div>
                  </Fade>
                )}
              </AnimatePresence>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setShowFade(!showFade)} variant="outline">
                {showFade ? 'Hide' : 'Show'}
              </Button>
            </CardFooter>
          </Card>

          {/* Slide Up Animation */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-white">Slide Up Animation</h2>
              <p className="text-sm text-gray-400">Slides up from bottom with spring</p>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {showSlide && (
                  <SlideUp key="slide-box">
                    <div className="bg-[#DDC66F] text-[#061623] p-6 rounded-lg text-center" id="slide-demo">
                      <p className="font-medium">Sliding Content</p>
                      <p className="text-sm opacity-80 mt-2">Spring-based motion</p>
                    </div>
                  </SlideUp>
                )}
              </AnimatePresence>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setShowSlide(!showSlide)} variant="outline">
                {showSlide ? 'Hide' : 'Show'}
              </Button>
            </CardFooter>
          </Card>

          {/* Scale Animation */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-white">Scale Animation</h2>
              <p className="text-sm text-gray-400">Perfect for modals and dialogs</p>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {showScale && (
                  <Scale key="scale-box">
                    <div className="bg-[#193B28] text-white p-6 rounded-lg text-center border border-[#30714C]" id="scale-demo">
                      <p className="font-medium">Scaling Content</p>
                      <p className="text-sm opacity-80 mt-2">Scales from 95% to 100%</p>
                    </div>
                  </Scale>
                )}
              </AnimatePresence>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setShowScale(!showScale)} variant="outline">
                {showScale ? 'Hide' : 'Show'}
              </Button>
            </CardFooter>
          </Card>

          {/* Stagger Animation */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-white">Stagger Animation</h2>
              <p className="text-sm text-gray-400">Children animate in sequence</p>
            </CardHeader>
            <CardContent>
              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-2"
                id="stagger-demo"
              >
                {listItems.map((item, index) => (
                  <motion.li
                    key={index}
                    variants={staggerItem}
                    className="bg-[#0D2233] text-white p-3 rounded border border-[#193B28]"
                  >
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </CardContent>
          </Card>
        </div>

        {/* Panel Animation */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Panel Animation</h2>
            <p className="text-sm text-gray-400">Side panel with spring animation</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Button onClick={() => { setPanelDirection('right'); setShowPanel(true); }}>
                Open Right Panel
              </Button>
              <Button onClick={() => { setPanelDirection('left'); setShowPanel(true); }}>
                Open Left Panel
              </Button>
            </div>
            <AnimatePresence>
              {showPanel && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowPanel(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    id="panel-backdrop"
                  />
                  {/* Panel */}
                  <Panel
                    direction={panelDirection}
                    className={`fixed top-0 ${panelDirection === 'right' ? 'right-0' : 'left-0'} h-full w-80 bg-[#0D2233] border-${panelDirection === 'right' ? 'l' : 'r'} border-[#193B28] z-50 p-6`}
                  >
                    <div id="panel-content">
                      <h3 className="text-xl font-bold text-white mb-4">Panel</h3>
                      <p className="text-gray-400 mb-6">
                        This panel slides in from the {panelDirection} with a spring animation.
                      </p>
                      <Button onClick={() => setShowPanel(false)} variant="outline">
                        Close Panel
                      </Button>
                    </div>
                  </Panel>
                </>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Rotate Animation (Spinner) */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Rotate Animation</h2>
            <p className="text-sm text-gray-400">Continuous rotation for loading states</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <motion.div
                variants={rotateVariants}
                initial="initial"
                animate="animate"
                id="rotate-demo"
              >
                <RefreshCw className="w-8 h-8 text-[#30714C]" />
              </motion.div>
              <p className="text-white">Loading spinner with infinite rotation</p>
            </div>
          </CardContent>
        </Card>

        {/* Pulse Animation */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Pulse Animation</h2>
            <p className="text-sm text-gray-400">Subtle pulsing for indicators</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <motion.div
                variants={pulseVariants}
                initial="initial"
                animate="animate"
                className="w-4 h-4 bg-[#30714C] rounded-full"
                id="pulse-demo"
              />
              <p className="text-white">Status indicator with pulse animation</p>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Note */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">♿ Accessibility</h2>
          </CardHeader>
          <CardContent>
            <div className="text-gray-300 space-y-2">
              <p>✓ All animations respect <code className="bg-[#193B28] px-2 py-1 rounded text-[#DDC66F]">prefers-reduced-motion</code></p>
              <p>✓ When reduced motion is enabled, animations are disabled or minimal</p>
              <p>✓ Spring physics provide natural, smooth motion</p>
              <p>✓ Stagger animations create visual hierarchy</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
