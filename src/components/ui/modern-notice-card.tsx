import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ShieldAlert, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NoticeVariant = 'info' | 'warning' | 'error' | 'success' | 'notice' | 'security';

interface ModernNoticeCardProps {
  variant?: NoticeVariant;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  glowing?: boolean;
}

const variantStyles: Record<NoticeVariant, {
  border: string;
  bg: string;
  badgeBg: string;
  badgeText: string;
  iconColor: string;
  defaultIcon: React.ReactNode;
  glow: string;
}> = {
  info: {
    border: 'border-blue-500/30 dark:border-blue-500/20',
    bg: 'bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-slate-900/40',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-400',
    iconColor: 'text-blue-400',
    defaultIcon: <Info className="h-5 w-5" />,
    glow: 'shadow-blue-500/10',
  },
  notice: {
    border: 'border-sky-500/30 dark:border-sky-500/20',
    bg: 'bg-gradient-to-r from-sky-950/40 via-slate-900/60 to-slate-900/40',
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-300',
    iconColor: 'text-sky-400',
    defaultIcon: <Sparkles className="h-5 w-5" />,
    glow: 'shadow-sky-500/10',
  },
  warning: {
    border: 'border-amber-500/30 dark:border-amber-500/20',
    bg: 'bg-gradient-to-r from-amber-950/35 via-slate-900/60 to-slate-900/40',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    iconColor: 'text-amber-400',
    defaultIcon: <AlertCircle className="h-5 w-5" />,
    glow: 'shadow-amber-500/10',
  },
  error: {
    border: 'border-rose-500/30 dark:border-rose-500/20',
    bg: 'bg-gradient-to-r from-rose-950/35 via-slate-900/60 to-slate-900/40',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    iconColor: 'text-rose-400',
    defaultIcon: <AlertTriangle className="h-5 w-5" />,
    glow: 'shadow-rose-500/10',
  },
  success: {
    border: 'border-emerald-500/30 dark:border-emerald-500/20',
    bg: 'bg-gradient-to-r from-emerald-950/35 via-slate-900/60 to-slate-900/40',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    iconColor: 'text-emerald-400',
    defaultIcon: <CheckCircle2 className="h-5 w-5" />,
    glow: 'shadow-emerald-500/10',
  },
  security: {
    border: 'border-indigo-500/30 dark:border-indigo-500/20',
    bg: 'bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/50',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-400',
    iconColor: 'text-indigo-400',
    defaultIcon: <ShieldAlert className="h-5 w-5" />,
    glow: 'shadow-indigo-500/15',
  },
};

export function ModernNoticeCard({
  variant = 'info',
  title,
  description,
  icon,
  action,
  onDismiss,
  className,
  glowing = true,
}: ModernNoticeCardProps) {
  const currentVariant = variantStyles[variant] || variantStyles.info;

  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        'relative overflow-hidden rounded-xl border backdrop-blur-md p-4 transition-all duration-200',
        currentVariant.border,
        currentVariant.bg,
        glowing && `shadow-lg ${currentVariant.glow}`,
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            'flex-shrink-0 p-2.5 rounded-lg border border-white/5 backdrop-blur-sm',
            currentVariant.badgeBg,
            currentVariant.iconColor
          )}
        >
          {icon || currentVariant.defaultIcon}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn('text-sm font-semibold tracking-wide', currentVariant.badgeText)}>
              {title}
            </h4>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
                aria-label="Dismiss notice"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {description && (
            <div className="mt-1 text-xs sm:text-sm text-slate-300/90 leading-relaxed font-normal">
              {description}
            </div>
          )}

          {action && <div className="mt-3 flex items-center gap-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}
