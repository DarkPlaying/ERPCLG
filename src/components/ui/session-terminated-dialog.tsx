import React from 'react';
import { ShieldAlert, LogOut, ExternalLink, Laptop } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SessionTerminatedDialogProps {
  open: boolean;
  onConfirm: () => void;
  role?: string;
  userName?: string;
}

export const SessionTerminatedDialog: React.FC<SessionTerminatedDialogProps> = ({
  open,
  onConfirm,
  role = 'User',
  userName,
}) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="bg-slate-950/95 border-amber-500/40 text-white sm:max-w-md backdrop-blur-2xl shadow-2xl [&>button]:hidden select-none"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center text-center pt-2">
          {/* Animated Warning Icon */}
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl animate-pulse" />
            <div className="relative p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="h-10 w-10" />
            </div>
          </div>

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold text-slate-100 flex items-center justify-center gap-2">
              <span>Session Terminated</span>
            </DialogTitle>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium mx-auto">
              <Laptop className="h-3.5 w-3.5" />
              <span>Logged In From Another Window or Device</span>
            </div>
            <DialogDescription className="text-slate-300 text-sm pt-2 leading-relaxed">
              Your account{userName ? ` (${userName})` : ''} was logged into from another window, browser, or device.
              <br />
              <span className="text-slate-400 text-xs block mt-2">
                For security and privacy, only one active session is permitted at a time. The previous session has been safely closed.
              </span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Account Role: <strong className="text-slate-200 capitalize">{role}</strong></span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            Active on other device
          </span>
        </div>

        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onConfirm}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium shadow-lg shadow-amber-900/30 transition-all"
          >
            <LogOut className="h-4 w-4 mr-2" /> Return to Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
