import { FormField } from '../../types';

interface StepProps {
  fields: FormField[];
  formData: Record<string, any>;
  onChange: (id: string, value: any) => void;
}

export default function Step3_Labour({ fields, formData, onChange }: StepProps) {
  return (
    <div className="space-y-5" id="step3-container">
      <div className="border-b border-brand-border pb-3 mb-4">
        <h3 className="text-lg font-bold text-brand-text">3. Labour Estimations & Commercials</h3>
        <p className="text-xs text-brand-muted">Input scheduled electrician allocations and draft approximate commercial rates (AUD).</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {fields.map((field) => (
          <div key={field.id} className={`${field.id === 'priceEstimate' ? 'md:col-span-3' : ''}`} id={`step3-field-wrap-${field.id}`}>
            <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5 font-sans">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              id={`step3-field-${field.id}`}
              type={field.type === 'number' ? 'number' : 'text'}
              value={formData[field.id] || ''}
              min={1}
              onChange={(e) => onChange(field.id, e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-brand-bg text-brand-text placeholder-brand-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-sans"
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
