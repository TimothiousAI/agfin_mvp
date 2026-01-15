import { Badge } from '../shared/ui/badge';
import { Card } from '../shared/ui/card';

export function BadgeTest() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#061623]">Badge Component Test</h1>

        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#061623]">Confidence Score Badges</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-32">High (≥90%):</span>
                <Badge confidence={95} id="badge-high-95" />
                <Badge confidence={92} id="badge-high-92" />
                <Badge confidence={90} id="badge-high-90" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-32">Medium (70-89%):</span>
                <Badge confidence={85} id="badge-medium-85" />
                <Badge confidence={75} id="badge-medium-75" />
                <Badge confidence={70} id="badge-medium-70" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-32">Low (&lt;70%):</span>
                <Badge confidence={65} id="badge-low-65" />
                <Badge confidence={50} id="badge-low-50" />
                <Badge confidence={30} id="badge-low-30" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#061623]">Source Type Badges</h2>
            <div className="flex flex-wrap gap-3">
              <Badge variant="ai" id="badge-ai">AI Generated</Badge>
              <Badge variant="manual" id="badge-manual">Manual Entry</Badge>
              <Badge variant="modified" id="badge-modified">Modified</Badge>
              <Badge variant="verified" id="badge-verified">Verified</Badge>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#061623]">Size Variants</h2>
            <div className="flex items-center gap-3">
              <Badge size="sm" id="badge-size-sm">Small</Badge>
              <Badge size="default" id="badge-size-default">Default</Badge>
              <Badge size="lg" id="badge-size-lg">Large</Badge>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#061623]">Other Variants</h2>
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#061623]">Real-World Examples</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">Farm Name:</span>
                <strong>Green Acres Farm</strong>
                <Badge confidence={95} />
                <Badge variant="ai">AI</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Total Acres:</span>
                <strong>450</strong>
                <Badge confidence={78} />
                <Badge variant="manual">Manual</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Crop Type:</span>
                <strong>Wheat</strong>
                <Badge confidence={62} />
                <Badge variant="modified">Modified</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
