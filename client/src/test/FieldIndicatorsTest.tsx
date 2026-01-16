import { SourceStatsBadge, EditedCountBadge } from '@/application/shell/SourceStatsBadge';
import { ConfidenceStatsBar } from '@/application/shell/ConfidenceStatsBar';
import { FieldDetailTooltip } from '@/application/shell/FieldDetailTooltip';
import { SourceBadge } from '@/shared/ui/SourceBadge';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';

const mockSourceStats = {
  ai_extracted: 15,
  proxy_entered: 3,
  proxy_edited: 5,
  auditor_verified: 2,
  total: 25,
};

const mockConfidenceStats = {
  high: 10,
  medium: 3,
  low: 2,
  total: 15,
};

const mockLowConfidenceFields = [
  { fieldId: 'acreage_total', fieldLabel: 'Total Acreage', confidence: 65, source: 'ai_extracted' as const },
  { fieldId: 'revenue_projected', fieldLabel: 'Projected Revenue', confidence: 72, source: 'ai_extracted' as const },
  { fieldId: 'entity_name', fieldLabel: 'Entity Name', confidence: 58, source: 'ai_extracted' as const },
];

export function FieldIndicatorsTest() {
  return (
    <div className="min-h-screen bg-[#061623] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white">Field Indicators Test</h1>

        {/* Source Badges */}
        <section className="bg-[#0D2233] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Source Badges</h2>
          <div className="flex flex-wrap gap-4">
            <SourceBadge source="ai_extracted" />
            <SourceBadge source="proxy_entered" />
            <SourceBadge source="proxy_edited" />
            <SourceBadge source="auditor_verified" />
          </div>
        </section>

        {/* Confidence Badges */}
        <section className="bg-[#0D2233] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Confidence Badges</h2>
          <div className="flex flex-wrap gap-4">
            <ConfidenceBadge confidence={95} />
            <ConfidenceBadge confidence={82} />
            <ConfidenceBadge confidence={65} />
            <ConfidenceBadge confidence={45} />
          </div>
        </section>

        {/* Source Stats Badge */}
        <section className="bg-[#0D2233] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Source Statistics Bar</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm text-white/60 mb-2">Full display</h3>
              <SourceStatsBadge stats={mockSourceStats} size="md" />
            </div>
            <div>
              <h3 className="text-sm text-white/60 mb-2">Compact</h3>
              <SourceStatsBadge stats={mockSourceStats} size="sm" compact />
            </div>
          </div>
        </section>

        {/* Confidence Stats Bar */}
        <section className="bg-[#0D2233] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Confidence Statistics Bar</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm text-white/60 mb-2">With low confidence fields</h3>
              <ConfidenceStatsBar
                stats={mockConfidenceStats}
                lowConfidenceFields={mockLowConfidenceFields}
                onViewLowConfidence={() => alert('View low confidence fields')}
              />
            </div>
            <div>
              <h3 className="text-sm text-white/60 mb-2">All high confidence</h3>
              <ConfidenceStatsBar
                stats={{ high: 15, medium: 0, low: 0, total: 15 }}
              />
            </div>
          </div>
        </section>

        {/* Edited Count Badge */}
        <section className="bg-[#0D2233] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Edited Count Badge</h2>
          <div className="flex gap-4">
            <EditedCountBadge count={3} onClick={() => alert('View edited fields')} />
            <EditedCountBadge count={12} animate />
          </div>
        </section>

        {/* Field Detail Tooltip */}
        <section className="bg-[#0D2233] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Field Detail Tooltip</h2>
          <p className="text-white/60 mb-4">Hover over the badges below:</p>
          <div className="flex flex-wrap gap-4">
            <FieldDetailTooltip
              fieldId="applicant_name"
              fieldLabel="Applicant Name"
              value="John Smith"
              source="ai_extracted"
              confidence={92}
              sourceDocument="Tax Return 2024.pdf"
            >
              <div className="px-3 py-2 bg-white/10 rounded cursor-pointer hover:bg-white/20 text-white">
                AI Extracted Field
              </div>
            </FieldDetailTooltip>

            <FieldDetailTooltip
              fieldId="total_acreage"
              fieldLabel="Total Acreage"
              value={1250}
              source="proxy_edited"
              confidence={72}
              originalValue={1200}
              lastModified={new Date()}
            >
              <div className="px-3 py-2 bg-[#FEF3C7] text-[#92400E] rounded cursor-pointer hover:bg-[#FDE68A]">
                Edited Field
              </div>
            </FieldDetailTooltip>

            <FieldDetailTooltip
              fieldId="entity_type"
              fieldLabel="Entity Type"
              value="LLC"
              source="auditor_verified"
            >
              <div className="px-3 py-2 bg-[#DCFCE7] text-[#166534] rounded cursor-pointer hover:bg-[#BBF7D0]">
                Verified Field
              </div>
            </FieldDetailTooltip>
          </div>
        </section>
      </div>
    </div>
  );
}

export default FieldIndicatorsTest;
