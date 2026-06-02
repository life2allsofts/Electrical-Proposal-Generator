import { Eye, Settings, ShieldCheck, HelpCircle } from 'lucide-react';

interface Step5Props {
  formData: Record<string, any>;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function Step5_Review({ formData, onGenerate, isGenerating }: Step5Props) {
  return (
    <div className="space-y-6" id="step5-container">
      <div className="border-b border-brand-border pb-3 mb-4">
        <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
          <Eye className="w-5 h-5 text-brand-primary" />
          5. Verification & Submission
        </h3>
        <p className="text-xs text-brand-muted">Review compliance categories, materials, cost entries, and submit to orchestrate system prompts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="review-summary-grid">
        <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-2">
          <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Job Classification</span>
          <p className="text-sm font-semibold text-brand-text">{formData.jobType || 'Not Selected'}</p>
          <div className="text-xs space-y-1 text-brand-muted">
            <p><span className="font-medium">Client:</span> {formData.clientName || 'N/A'}</p>
            <p><span className="font-medium">Contact:</span> {formData.contactPerson || 'N/A'}</p>
            <p><span className="font-medium">Site Address:</span> {formData.siteAddress || 'N/A'}</p>
            <p><span className="font-medium">Job Ref:</span> {formData.jobReference || 'N/A'}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-2">
          <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Labor & Commercial Rates</span>
          <p className="text-sm font-semibold text-brand-text">{formData.priceEstimate || 'Pending Estimate'}</p>
          <div className="text-xs space-y-1 text-brand-muted">
            <p><span className="font-medium">Electricians:</span> {formData.crewSize || '0'} Crew Members</p>
            <p><span className="font-medium">Allocated Hours:</span> {formData.estimatedHours || '0'} Hrs</p>
            <p><span className="font-medium">Shutdown:</span> {formData.shutdownNeeded || 'None'}</p>
            <p><span className="font-medium">Access Lift:</span> {formData.accessRequirements || 'Standard'}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-bg border border-brand-border md:col-span-2 space-y-1.5">
          <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Materials Specified</span>
          <p className="text-xs text-brand-text whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto font-mono bg-brand-card p-2 rounded border border-brand-border" id="review-materials-raw">
            {formData.primaryMaterials || 'No materials entered yet.'}
          </p>
        </div>
      </div>

      <div className="p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/20 flex gap-3 text-brand-text items-start" id="compliance-declaration-well">
        <ShieldCheck className="w-5 h-5 text-brand-primary mt-0.5 shrink-0" />
        <div className="text-xs space-y-1" id="compliance-declaration-body">
          <p className="font-bold">AS/NZS 3000 Standard Pre-Validation Check</p>
          <p className="text-brand-muted">This proposal includes prompt parameters validating that main switches, isolating links, and RCDs conform to physical installation regulations of the Australian Wirings rules.</p>
        </div>
      </div>

      <div className="pt-4 flex flex-col items-center justify-center space-y-3" id="review-submission-wrapper">
        <button
          id="trigger-ai-generator-btn"
          onClick={onGenerate}
          disabled={isGenerating || !formData.clientName || !formData.jobType}
          className="w-full md:w-auto md:px-8 py-3.5 bg-brand-primary text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] disabled:opacity-50 transition-all font-sans"
        >
          {isGenerating ? (
            <>
              <Settings className="w-5 h-5 animate-spin" />
              Applying Rules & Creating Draft...
            </>
          ) : (
            <>
              <Settings className="w-5 h-5" />
              Draft Proposal with Gemini AI
            </>
          )}
        </button>
        <span className="text-[10px] text-brand-muted flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" /> Runs server-side model with prompt-configured engineering rules.
        </span>
      </div>
    </div>
  );
}
