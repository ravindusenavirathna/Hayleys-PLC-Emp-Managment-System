"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";
import { markWorkerDoneAction } from "./actions";

interface MarkDoneButtonProps {
  assignmentId: string;
  employeeId: string;
}

export default function MarkDoneButton({ assignmentId, employeeId }: MarkDoneButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const handleMarkDone = () => {
    startTransition(async () => {
      const result = await markWorkerDoneAction({ assignmentId, employeeId });
      if (result.success) {
        setDone(true);
        toast.success("Task marked as done!", {
          description: "Your supervisor has been notified.",
        });
      } else {
        toast.error("Failed to mark task as done", {
          description: result.error,
        });
      }
    });
  };

  if (done) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <CheckCircle className="w-5 h-5 text-emerald-600" />
        <p className="text-sm font-semibold text-emerald-900">Marked as done — awaiting verification</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleMarkDone}
      disabled={isPending}
      id="btn-mark-done"
      className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 text-white text-sm font-semibold rounded-lg
        hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Marking as Done...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4" />
          Mark Task as Done
        </>
      )}
    </button>
  );
}
