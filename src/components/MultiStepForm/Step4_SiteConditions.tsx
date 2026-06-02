import { FormField } from '../../types';

interface StepProps {
  fields: FormField[];
  formData: Record<string, any>;
  onChange: (id: string, value: any) => void;
}

export default function Step4_SiteConditions({ fields, formData, onChange }: StepProps) {
  return (
    <div className="space-y-5" id="step4-container">
      <div className="border-b border-brand-border pb-3 mb-4">
        <h3 className="text-lg font-bold text-brand-text">4. Site Environment & Hazards</h3>
        <p className="text-xs text-brand-muted">Define access details, shutdown safety windows, and isolation targets to reference in safety plans.</p>
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} id={`step4-field-wrap-${field.id}`}>
            <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5 font-sans">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            
            {field.type === 'select' ? (
              <select
                id={`step4-field-${field.id}`}
                value={formData[field.id] || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-brand-bg text-brand-text text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-sans cursor-pointer"
                required={field.required}
              >
                <option value="">-- Choose Option --</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                id={`step4-field-${field.id}`}
                value={formData[field.id] || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-brand-bg text-brand-text placeholder-brand-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-sans resize-y"
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
