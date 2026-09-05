import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type DialogHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export function SkipLink({ targetId = 'contenu-principal' }: { readonly targetId?: string }) {
  return (
    <a className="skip-link" href={`#${targetId}`}>
      Aller au contenu principal
    </a>
  );
}

export function AppShell({
  appName,
  navigation,
  children,
  footer,
}: {
  readonly appName: string;
  readonly navigation: ReactNode;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}) {
  return (
    <>
      <SkipLink />
      <header className="site-header">
        <div className="site-header__inner">
          <span className="site-name">{appName}</span>
          {navigation}
        </div>
      </header>
      <main id="contenu-principal" className="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">{footer ?? 'Socle technique V4 — Lot 1'}</footer>
    </>
  );
}

export function PageTitle({ children }: { readonly children: ReactNode }) {
  return (
    <h1 className="page-title" tabIndex={-1} data-page-title>
      {children}
    </h1>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function Button({ className = '', type = 'button', ...props }, ref) {
    return <button ref={ref} className={`button ${className}`.trim()} type={type} {...props} />;
  },
);

export function TextField({
  label,
  hint,
  error,
  id: providedId,
  required,
  ...inputProps
}: InputHTMLAttributes<HTMLInputElement> & {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
}) {
  const externalDescribedBy = inputProps['aria-describedby'];
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [externalDescribedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </label>
      {hint ? (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      <input
        {...inputProps}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        id={id}
        required={required}
      />
      {error ? (
        <span className="field__error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function StatusMessage({
  children,
  kind = 'status',
}: {
  readonly children: ReactNode;
  readonly kind?: 'status' | 'error';
}) {
  return (
    <p className={`status status--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}

export function Dialog({
  open,
  title,
  children,
  onClose,
  ...dialogProps
}: Omit<DialogHTMLAttributes<HTMLDialogElement>, 'open' | 'onClose'> & {
  readonly open: boolean;
  readonly title: string;
  readonly children: ReactNode;
  readonly onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      dialog.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
    }

    if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      triggerRef.current?.focus();
    }
  }, [open]);

  return (
    <dialog
      {...dialogProps}
      aria-labelledby={titleId}
      className="dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <h2 id={titleId}>{title}</h2>
      {children}
      <Button data-initial-focus onClick={onClose}>
        Fermer
      </Button>
    </dialog>
  );
}
