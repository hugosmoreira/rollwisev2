import { useId, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import fieldStyles from './Field.module.css';
import styles from './TagInput.module.css';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  /** Max number of tags allowed. */
  max?: number;
  containerClassName?: string;
}

/** Free-form tag entry — add with Enter or comma, remove with the × or Backspace. */
export function TagInput({
  value,
  onChange,
  label,
  hint,
  placeholder = 'Add a tag and press Enter',
  max,
  containerClassName,
}: TagInputProps) {
  const id = useId();
  const [draft, setDraft] = useState('');

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (max && value.length >= max) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...value, tag]);
    setDraft('');
  };

  const removeTag = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className={cn(fieldStyles.field, containerClassName)}>
      {label && (
        <label className={fieldStyles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div className={styles.box}>
        {value.map((tag, i) => (
          <span key={tag} className={styles.tag}>
            {tag}
            <button
              type="button"
              className={styles.remove}
              onClick={() => removeTag(i)}
              aria-label={`Remove ${tag}`}
            >
              <X size={13} strokeWidth={2.4} />
            </button>
          </span>
        ))}
        <input
          id={id}
          className={styles.input}
          value={draft}
          placeholder={value.length ? '' : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => addTag(draft)}
        />
      </div>
      {hint && <span className={fieldStyles.hint}>{hint}</span>}
    </div>
  );
}
