"use client";

import { useState } from "react";
import { autoAllocateTaskAction } from "./actions";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

interface AllocateButtonProps {
  taskId: string;
  supervisorId: string;
}

export default function AllocateButton({ taskId, supervisorId }: AllocateButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleAllocate = async () => {
    setIsPending(true);
    try {
      const res = await autoAllocateTaskAction(taskId, supervisorId);
      if (res.success) {
        toast.success("Auto-allocation complete!", {
          description: "Required workforce has been successfully assigned using priority rules.",
        });
      } else {
        toast.error("Allocation failed", {
          description: res.error || "Could not complete auto-allocation.",
        });
      }
    } catch (err) {
      toast.error("An unexpected error occurred during allocation.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleAllocate}
      disabled={isPending}
      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4.5 h-4.5 animate-spin" />
          Allocating...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Auto-Allocate Workers
        </>
      )}
    </button>
  );
}
