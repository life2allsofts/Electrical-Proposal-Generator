import { useState } from 'react';
import { FileText, Search, Edit2, Copy, Trash2, FileDown, Plus } from 'lucide-react';
import { Proposal } from '../../types';

interface ProjectListProps {
  proposals: Proposal[];
  onSelect: (proposal: Proposal) => void;
  onDuplicate: (proposal: Proposal) => void;
  onDelete: (id: number) => void;
  onDownloadDocx: (id: number, clientName: string) => void;
  onDownloadPdf: (id: number, clientName: string) => void;
  onNewProposal: () => void;
}

export default function ProposalList({
  proposals,
  onSelect,
  onDuplicate,
  onDelete,
  onDownloadDocx,
  onDownloadPdf,
  onNewProposal
}: ProjectListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = proposals.filter(p => 
    p.client_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.job_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.site_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" id="dashboard-list-subgrid">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center" id="dashboard-list-header">
        <div>
          <h2 className="text-xl font-bold text-brand-text tracking-tight font-sans">Saved Compliance Drafts</h2>
          <p className="text-xs text-brand-muted">Search, configure, and download historical electrical estimates.</p>
        </div>
        <button
          id="dashboard-new-proposal-btn"
          onClick={onNewProposal}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-all hover:opacity-90 active:scale-95 shadow"
        >
          <Plus className="w-4 h-4" />
          Create New Proposal
        </button>
      </div>

      <div className="relative" id="dashboard-search-container">
        <span className="absolute left-3 top-3 text-brand-muted">
          <Search className="w-4 h-4" />
        </span>
        <input
          id="dashboard-list-search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter proposals by client name, suburb, or job category..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-border bg-brand-card text-brand-text text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 placeholder-brand-muted font-sans"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-brand-card border border-brand-border border-dashed rounded-xl" id="dashboard-empty-well">
          <FileText className="w-12 h-12 text-brand-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-brand-text">No active proposals found</p>
          <p className="text-xs text-brand-muted max-w-sm mx-auto mt-1">
            {searchTerm 
              ? 'Try widening your query filtering.' 
              : 'Let\'s generate your first proposal using the AS/NZS compliance questionnaire.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="dashboard-proposals-grid">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="p-5 bg-brand-card border border-brand-border rounded-xl shadow-sm hover:border-brand-primary/40 transition-all flex flex-col justify-between"
              id={`proposal-card-${p.id}`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full capitalize mb-1 inline-flex">
                      Compliance Draft
                    </span>
                    <h3 className="text-base font-bold text-brand-text tracking-tight max-w-[220px] truncate" title={p.client_name}>
                      {p.client_name}
                    </h3>
                  </div>
                  <span className="text-[10px] text-brand-muted font-mono">{p.created_at.split('T')[0]}</span>
                </div>

                <div className="space-y-1 text-xs text-brand-muted" id={`proposal-meta-lines-${p.id}`}>
                  <p><span className="font-semibold text-brand-text">Workscope:</span> {p.job_type}</p>
                  <p><span className="font-semibold text-brand-text">Address:</span> {p.site_address}</p>
                  <p><span className="font-semibold text-brand-text">Value:</span> {p.form_data?.priceEstimate || 'N/A'}</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-brand-border flex flex-wrap gap-2 justify-between items-center" id={`proposal-actions-footer-${p.id}`}>
                <div className="flex gap-1">
                  <button
                    id={`proposal-btn-edit-${p.id}`}
                    onClick={() => onSelect(p)}
                    title="View & Edit content"
                    className="p-1.5 hover:bg-brand-primary/10 rounded text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    id={`proposal-btn-duplicate-${p.id}`}
                    onClick={() => onDuplicate(p)}
                    title="Duplicate proposal structure"
                    className="p-1.5 hover:bg-brand-primary/10 rounded text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    id={`proposal-btn-delete-${p.id}`}
                    onClick={() => onDelete(p.id)}
                    title="Delete proposal permanently"
                    className="p-1.5 hover:bg-red-500/10 rounded text-brand-muted hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <button
                    id={`proposal-btn-dl-pdf-${p.id}`}
                    onClick={() => onDownloadPdf(p.id, p.client_name)}
                    className="px-2.5 py-1.5 bg-brand-bg text-brand-text hover:bg-brand-border border border-brand-border text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5 text-red-500" />
                    PDF
                  </button>
                  <button
                    id={`proposal-btn-dl-word-${p.id}`}
                    onClick={() => onDownloadDocx(p.id, p.client_name)}
                    className="px-2.5 py-1.5 bg-brand-bg text-brand-text hover:bg-brand-border border border-brand-border text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-500" />
                    DOCX
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
