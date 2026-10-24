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
      border: 'border-red-500/40',
      iconBg: 'bg-red-500/15 border-red-500/30 text-red-400',
      btn: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-900/30',
      icon: <Trash2 className="h-6 w-6" />,
    },
    warning: {
      border: 'border-amber-500/40',
      iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      btn: 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg shadow-amber-900/30',
      icon: <AlertTriangle className="h-6 w-6" />,
    },
    prompt: {
      border: 'border-blue-500/40',
      iconBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
      btn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-900/30',
      icon: <MessageSquareQuote className="h-6 w-6" />,
    },
    info: {
      border: 'border-slate-700',
      iconBg: 'bg-slate-800 border-slate-700 text-slate-300',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: <HelpCircle className="h-6 w-6" />,
    },
  }[variant];

  const isConfirmDisabled =
    isSubmitting ||
    (config.matchValue ? inputValue.trim() !== config.matchValue : false) ||
    (config.requireInput && !config.matchValue ? !inputValue.trim() : false);

  return (
    <Dialog open={config.open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent
        className={`bg-slate-950/95 ${variantStyles.border} text-white sm:max-w-md backdrop-blur-2xl shadow-2xl [&>button]:hidden select-none animate-in fade-in zoom-in-95 duration-200`}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex items-start gap-4 pt-1">
          <div className={`p-3 rounded-2xl border ${variantStyles.iconBg} flex-shrink-0`}>
            {variantStyles.icon}
          </div>

          <div className="flex-1 min-w-0">
            <DialogHeader className="text-left space-y-1.5">
              <DialogTitle className="text-lg font-bold text-slate-100">
                {config.title}
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-sm leading-relaxed">
                {config.description}
              </DialogDescription>
            </DialogHeader>

            {config.requireInput && (
              <div className="mt-4 space-y-2">
                {config.matchValue && (
                  <p className="text-xs text-slate-400">
                    Type <code className="bg-slate-800 px-1.5 py-0.5 rounded text-red-400 font-mono font-bold">{config.matchValue}</code> to confirm:
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
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-row justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white"
          >
            {config.cancelText || 'Cancel'}
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`${variantStyles.btn} transition-all font-medium`}
          >
            {isSubmitting ? 'Processing...' : config.confirmText || 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
