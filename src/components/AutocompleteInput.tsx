import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  suggestions: string[];
  /** debounce in ms for calling onChange; default 250 */
  debounceMs?: number;
}

export const AutocompleteInput = React.memo(
  ({ suggestions, debounceMs = 250, onChange, value, ...props }: Props) => {
    const listId = React.useId();

    const [localValue, setLocalValue] = React.useState<string>(() =>
      value == null ? '' : String(value)
    );

    // sync when controlled value changes from outside
    React.useEffect(() => {
      if (value == null) return;
      const v = String(value);
      if (v !== localValue) setLocalValue(v);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const timerRef = React.useRef<number | null>(null);

    const flush = React.useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (onChange) {
        // call with a minimal event-like object that callers expect (e.target.value)
        try {
          (onChange as any)({ target: { value: localValue } });
        } catch (err) {
          // ignore
        }
      }
    }, [localValue, onChange]);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setLocalValue(v);
        if (!onChange) return;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        // schedule debounced call
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          try {
            (onChange as any)({ target: { value: v } });
          } catch (err) {
            // ignore
          }
        }, debounceMs);
      },
      [debounceMs, onChange]
    );

    React.useEffect(() => {
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, []);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          flush();
        }
        if (props.onKeyDown) props.onKeyDown(e);
      },
      [flush, props]
    );

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        flush();
        if (props.onBlur) props.onBlur(e);
      },
      [flush, props]
    );

    return (
      <>
        <input
          {...props}
          list={listId}
          autoComplete="off"
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
        <datalist id={listId}>
          {suggestions.map((s, i) => (
            <option key={i} value={s} />
          ))}
        </datalist>
      </>
    );
  },
  (prev, next) => {
    return (
      prev.value === next.value &&
      prev.suggestions.length === next.suggestions.length &&
      prev.suggestions.every((v, i) => v === next.suggestions[i])
    );
  }
);
