import { useState } from 'react';
import { Eye, Edit, Save, ArrowLeft, Download, RefreshCw, FileText } from 'lucide-react';
import { Proposal } from '../../types';

interface ProjectEditorProps {
  proposal: Proposal;
  onSave: (id: number, content: string, clientName: string, siteAddress: string) => Promise<void>;
  onClose: () => void;
  onDownloadDocx: (id: number, clientName: string) => void;
  onDownloadPdf: (id: number, clientName: string) => void;
}

export default function ProposalEditor({
  proposal,
  onSave,
  onClose,
  onDownloadDocx,
  onDownloadPdf
}: ProjectEditorProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [content, setContent] = useState(proposal.generated_content);
  const [clientName, setClientName] = useState(proposal.client_name);
  const [siteAddress, setSiteAddress] = useState(proposal.site_address);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(proposal.id, content, clientName, siteAddress);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6" id="editor-container-main">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-brand-border pb-4" id="editor-header-bar">
        <div className="flex items-center gap-3">
          <button
            id="editor-btn-back"
            onClick={onClose}
            className="p-1.5 hover:bg-brand-border rounded border border-brand-border text-brand-muted cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="inline-block text-[9px] font-bold text-brand-primary uppercase tracking-widest font-mono">
              Draft ID: {proposal.id}
            </span>
            <input
              id="editor-client-name-field"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="font-bold text-xl text-brand-text bg-transparent border-b border-transparent focus:border-brand-primary/50 focus:outline-none py-0.5 max-w-[280px]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center" id="editor-controls">
          <div className="flex bg-brand-bg border border-brand-border rounded-lg p-0.5 text-xs">
            <button
              id="editor-tab-preview"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'preview' 
                  ? 'bg-brand-card text-brand-text shadow-sm' 
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Document Preview
            </button>
            <button
              id="editor-tab-edit"
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'edit' 
                  ? 'bg-brand-card text-brand-text shadow-sm' 
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              <Edit className="w-3.5 h-3.5" />
              Raw Edit
            </button>
          </div>

          <button
            id="editor-btn-save"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="editor-layout-grid">
        <div className="lg:col-span-3 min-h-[500px]" id="editor-view-pane">
          {activeTab === 'edit' ? (
            <textarea
              id="editor-raw-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-[500px] p-5 border border-brand-border bg-brand-card text-brand-text font-mono text-sm shadow-inner rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary/30 resize-y leading-relaxed"
              placeholder="Structure your electrical draft using standard Markdown tags..."
            />
          ) : (
            <div className="border border-brand-border rounded-xl bg-brand-card p-8 md:p-12 shadow-sm font-sans leading-relaxed text-brand-text max-h-[650px] overflow-y-auto" id="editor-rendered-view">
              <div className="prose max-w-none text-sm dark:prose-invert space-y-6">
                {content.split('\n').map((line, idx) => {
                  const cleaned = line.trim();
                  if (!line) return <div key={idx} className="h-2" />;
                  
                  if (cleaned.startsWith('# ')) {
                    return <h1 key={idx} className="text-2xl font-bold border-b border-brand-border pb-2 text-brand-primary mt-6">{cleaned.slice(2)}</h1>;
                  }
                  if (cleaned.startsWith('## ')) {
                    return <h2 key={idx} className="text-lg font-bold text-brand-text mt-5">{cleaned.slice(3)}</h2>;
                  }
                  if (cleaned.startsWith('### ')) {
                    return <h3 key={idx} className="text-base font-bold text-brand-muted mt-4">{cleaned.slice(4)}</h3>;
                  }
                  if (cleaned.startsWith('- ') || cleaned.startsWith('* ')) {
                    return <li key={idx} className="ml-4 list-disc text-brand-text -mt-1">{cleaned.slice(2)}</li>;
                  }
                  
                  return <p key={idx} className="text-brand-text leading-relaxed tracking-wide text-sm">{cleaned}</p>;
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4" id="editor-meta-panel">
          <div className="p-4 rounded-xl bg-brand-card border border-brand-border space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-brand-text uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-primary" /> Document Settings
            </h4>
            
            <div className="space-y-3 text-xs" id="editor-fields-stack">
              <div>
                <label className="block text-brand-muted font-medium mb-1">Site Address</label>
                <input
                  id="editor-meta-address"
                  type="text"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  className="w-full p-2 border border-brand-border bg-brand-bg text-brand-text rounded-md focus:outline-none"
                />
              </div>
              
              <div className="text-[11px] text-brand-muted space-y-1 pt-1.5 border-t border-brand-border">
                <p><span className="font-semibold text-brand-text">Work Classification:</span> {proposal.job_type}</p>
                <p><span className="font-semibold text-brand-text">Dating Period:</span> {proposal.created_at.split('T')[0]}</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-brand-card border border-brand-border space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-brand-text uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-brand-primary" /> Export Packages
            </h4>
            
            <div className="flex flex-col gap-2 pointer-on-action" id="editor-download-button-stack">
              <button
                id="editor-dl-btn-pdf"
                onClick={() => onDownloadPdf(proposal.id, clientName)}
                className="w-full py-2.5 px-3 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-500 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" /> Download PDF Blueprint
              </button>
              
              <button
                id="editor-dl-btn-word"
                onClick={() => onDownloadDocx(proposal.id, clientName)}
                className="w-full py-2.5 px-3 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-blue-500 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" /> Download MS Word DOCX
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
