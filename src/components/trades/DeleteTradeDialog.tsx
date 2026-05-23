"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  tradePair: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteTradeDialog({ open, tradePair, onClose, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#0e1223] border-[#1e293b] text-[#f8fafc] max-w-sm w-full p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-5 h-5 text-[#ef4444]" strokeWidth={2} />
          </div>
          <DialogTitle className="text-[15px] font-bold">Delete Trade</DialogTitle>
          <p className="text-[13px] text-[#94a3b8] mt-1.5 leading-relaxed">
            Are you sure you want to delete the{" "}
            <span className="text-[#f8fafc] font-semibold">{tradePair}</span> trade?{" "}
            This cannot be undone.
          </p>
        </DialogHeader>
        <div className="flex items-center gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-lg border border-[#1e293b] text-[13px] font-semibold text-[#475569] hover:border-[#334155] hover:text-[#f8fafc] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 h-9 rounded-lg bg-[#ef4444] text-white text-[13px] font-bold hover:bg-[#dc2626] active:scale-[0.99] transition-all cursor-pointer"
          >
            Delete
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
