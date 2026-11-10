import {
  createContext,
  useContext,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  AlertCircle,
  ArrowRight,
  Check,
  LoaderCircle,
  X,
  Wallet,
  Utensils,
  Plane,
  ShoppingBag,
  House,
  Zap,
  GraduationCap,
  HeartPulse,
  Clapperboard,
  Sparkles,
  Repeat,
  MoreHorizontal,
  Coffee,
  Car,
  Gift,
  Landmark,
  type LucideIcon,
} from 'lucide-react';
import type { Bucket, BudgetStatus } from '../lib/types';
import { statusLabel } from '../lib/format';

export function Button({
  children,
  variant = 'primary',
  busy,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  busy?: boolean;
}) {
  return (
    <button
      {...props}
      className={`button button-${variant} ${className}`}
      disabled={props.disabled || busy}
    >
      {busy && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
  );
}
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-icon">
        <i />
        <i />
      </span>
      <span>
        fintrack<span className="brand-dot">.</span>
      </span>
    </span>
  );
}
export const bucketIcons: Record<string, LucideIcon> = {
  utensils: Utensils,
  plane: Plane,
  shopping: ShoppingBag,
  home: House,
  zap: Zap,
  education: GraduationCap,
  health: HeartPulse,
  entertainment: Clapperboard,
  care: Sparkles,
  subscriptions: Repeat,
  other: MoreHorizontal,
  coffee: Coffee,
  car: Car,
  gift: Gift,
  wallet: Wallet,
  bank: Landmark,
};
export function BucketIcon({
  bucket,
  size = 20,
}: {
  bucket: Pick<Bucket, 'icon' | 'color'>;
  size?: number;
}) {
  const Icon = bucketIcons[bucket.icon] || Wallet;
  return (
    <span
      className="bucket-icon"
      style={{ color: bucket.color, backgroundColor: `${bucket.color}12` }}
    >
      <Icon size={size} strokeWidth={1.8} />
    </span>
  );
}
export function Status({ status }: { status: BudgetStatus }) {
  return (
    <span className={`status status-${status}`}>
      <span />
      {statusLabel[status]}
    </span>
  );
}
export function Progress({
  value,
  status = 'normal',
  color,
}: {
  value: number;
  status?: BudgetStatus;
  color?: string;
}) {
  return (
    <div
      className={`progress progress-${status}`}
      role="progressbar"
      aria-label="Budget used"
      aria-valuenow={Math.round(Math.min(100, value))}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          ...(color && status === 'normal' ? { background: color } : {}),
        }}
      />
    </div>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Wallet size={27} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={26} />
      <span>Getting things ready…</span>
    </div>
  );
}
export function ErrorState({ text, retry }: { text: string; retry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={23} />
      <h3>A small bump in the road</h3>
      <p>{text}</p>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Try again <ArrowRight size={15} />
        </Button>
      )}
    </div>
  );
}
export function FormError({ children }: { children?: ReactNode }) {
  return children ? (
    <p className="form-error" role="alert">
      <AlertCircle size={14} />
      {children}
    </p>
  ) : null;
}
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className={`modal ${wide ? 'modal-wide' : ''}`}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className="modal-header">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              {description && <Dialog.Description>{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="icon-button" aria-label="Close dialog">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  description,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && !busy && onClose()}
      title={title}
      description={description}
    >
      <div className="modal-actions">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Keep it
        </Button>
        <Button variant="danger" onClick={onConfirm} busy={busy}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
const ToastContext = createContext<(text: string, kind?: 'success' | 'error') => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; text: string; kind: string }[]>([]);
  const notify = (text: string, kind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  };
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div className={`toast toast-${t.kind}`} key={t.id}>
            {t.kind === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{t.text}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setToasts((v) => v.filter((x) => x.id !== t.id))}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
