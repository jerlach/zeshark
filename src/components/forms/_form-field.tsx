import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type FormFieldProps = {
  label: string
  description?: string
  placeholder?: string
  error?: string
  inputType?:
    | 'text'
    | 'number'
    | 'email'
    | 'password'
    | 'textarea'
    | 'select'
    | 'currency'
    | 'date'
    | 'datetime'
    | 'checkbox'
  options?: { label: string; value: string }[]
  value: string | number | boolean | undefined
  onChange: (value: string | number | boolean) => void
  onBlur?: () => void
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
}

export function FormField({
  label,
  description,
  placeholder,
  error,
  inputType = 'text',
  options,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  required,
}: FormFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={cn(error && 'text-destructive')}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {inputType === 'textarea' ? (
        <Textarea
          id={id}
          placeholder={placeholder}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(error && 'border-destructive')}
        />
      ) : inputType === 'select' ? (
        <Select
          value={String(value ?? '')}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger className={cn(error && 'border-destructive')}>
            <SelectValue placeholder={placeholder ?? `Select ${label.toLowerCase()}...`} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : inputType === 'currency' ? (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id={id}
            type="number"
            step="0.01"
            min="0"
            placeholder={placeholder}
            value={value ?? ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            onBlur={onBlur}
            disabled={disabled}
            readOnly={readOnly}
            className={cn('pl-7', error && 'border-destructive')}
          />
        </div>
      ) : inputType === 'date' || inputType === 'datetime' ? (
        <Input
          id={id}
          type={inputType === 'datetime' ? 'datetime-local' : 'date'}
          placeholder={placeholder}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(error && 'border-destructive')}
        />
      ) : inputType === 'number' ? (
        <Input
          id={id}
          type="number"
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(error && 'border-destructive')}
        />
      ) : (
        <Input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(error && 'border-destructive')}
        />
      )}

      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
