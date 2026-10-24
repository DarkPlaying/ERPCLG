import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, HelpCircle, MessageSquareQuote, Check, X, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ConfirmModalConfig {
  open: boolean;
  title: string;
  description: string;
  variant?: 'danger' | 'warning' | 'info' | 'prompt';
  confirmText?: string;
  cancelText?: string;
  requireInput?: boolean;
  inputPlaceholder?: string;
  inputDefaultValue?: string;
  matchValue?: string; // If set, confirm button is disabled unless input matches this string (e.g. 'DELETE')
  onConfirm: (inputVal?: string) => void | Promise<void>;
  onCancel?: () => void;
}

interface ModernConfirmModalProps {
  config: ConfirmModalConfig;
  onClose: () => void;
}

export const ModernConfirmModal: React.FC<ModernConfirmModalProps> = ({ config, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (config.open) {
      setInputValue(config.inputDefaultValue || '');
      setIsSubmitting(false);
    }
  }, [config.open, config.inputDefaultValue]);

  if (!config.open) return null;

  const handleConfirm = async () => {
    if (config.matchValue && inputValue.trim() !== config.matchValue) {
      return;
    }
    setIsSubmitting(true);
    try {
      await config.onConfirm(inputValue);
      onClose();
    } catch (error) {
      console.error('Modal action failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (config.onCancel) config.onCancel();
    onClose();
  };

  const variant = config.variant || (config.requireInput ? 'prompt' : 'danger');

  const variantStyles = {
    danger: {
      border: 'border-border',
      iconBg: 'bg-foreground/10 border-border text-foreground',
      btn: 'bg-foreground text-background hover:bg-foreground/90 shadow-xs',
      icon: <Trash2 className="h-5 w-5" />,
    },
    warning: {
      border: 'border-border',
      iconBg: 'bg-foreground/10 border-border text-foreground',
      btn: 'bg-foreground text-background hover:bg-foreground/90 shadow-xs',
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    prompt: {
      border: 'border-border',
      iconBg: 'bg-foreground/10 border-border text-foreground',
      btn: 'bg-foreground text-background hover:bg-foreground/90 shadow-xs',
      icon: <MessageSquareQuote className="h-5 w-5" />,
    },
    info: {
      border: 'border-border',
      iconBg: 'bg-foreground/10 border-border text-foreground',
      btn: 'bg-foreground text-background hover:bg-foreground/90 shadow-xs',
      icon: <HelpCircle className="h-5 w-5" />,
    },
  }[variant];

  const isConfirmDisabled =
    isSubmitting ||
    (config.matchValue ? inputValue.trim() !== config.matchValue : false) ||
    (config.requireInput && !config.matchValue ? !inputValue.trim() : false);

  return (
    <Dialog open={config.open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent
        className="bg-card border border-border text-foreground sm:max-w-md shadow-2xl [&>button]:hidden select-none animate-in fade-in zoom-in-95 duration-200 rounded-2xl p-6"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border ${variantStyles.iconBg} flex-shrink-0`}>
            {variantStyles.icon}
          </div>

          <div className="flex-1 min-w-0">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                {config.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                {config.description}
              </DialogDescription>
            </DialogHeader>

            {config.requireInput && (
              <div className="mt-4 space-y-2">
                {config.matchValue && (
                  <p className="text-xs text-muted-foreground">
                    Type <code className="bg-muted px-1.5 py-0.5 rounded border border-border text-foreground font-mono font-bold">{config.matchValue}</code> to confirm:
                  </p>
                )}
                <Input
                  autoFocus
                  placeholder={config.inputPlaceholder || 'Type here...'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isConfirmDisabled) {
                      e.preventDefault();
                      handleConfirm();
                    }
                  }}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground h-9 text-xs"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-5 flex flex-row justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="border-border bg-background hover:bg-muted text-foreground text-xs h-9 font-medium"
          >
            {config.cancelText || 'Cancel'}
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`${variantStyles.btn} text-xs h-9 font-semibold`}
          >
            {isSubmitting ? 'Processing...' : config.confirmText || 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
