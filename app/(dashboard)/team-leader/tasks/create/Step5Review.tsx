"use client";

import { ChevronLeft, Loader2, CheckCircle, Warehouse, Clock, Users, Briefcase, Truck } from "lucide-react";
import type { TaskFormData } from "./TaskCreateWizard";

interface Step5Props {
  formData: Partial<TaskFormData>;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function ReviewRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground text-right max-w-xs">{value}</span>
    </div>
  );
}

export default function Step5Review({ formData, onBack, onSubmit, isSubmitting }: Step5Props) {
  const totalAssigned =
    (formData.selectedSameClusterWorkerIds?.length ?? 0) +
    (formData.selectedBorrowedWorkerIds?.length ?? 0) +
    (formData.adhocWorkerCount ?? 0);

  return (
    <div className="space-y-4">
      {/* Task Summary */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-slate-50/50">
          <Warehouse className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold">Location & Timing</h3>
        </div>
        <div className="px-5 py-2">
          <ReviewRow label="Warehouse" value={formData.warehouseName ?? "—"} />
          <ReviewRow label="Cluster" value={formData.clusterName ?? "—"} />
          <ReviewRow label="Task Date" value={formData.taskDate ?? "—"} />
          <ReviewRow label="Start Time" value={formData.startTime ?? "—"} />
          <ReviewRow label="End Time" value={formData.endTime ?? "—"} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-slate-50/50">
          <Briefcase className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold">Task Details</h3>
        </div>
        <div className="px-5 py-2">
          <ReviewRow label="Client" value={formData.clientName ?? "—"} />
          <ReviewRow label="Category" value={formData.categoryName ?? "—"} />
          <ReviewRow label="Sub-Category" value={formData.subCategoryName ?? "—"} />
          <ReviewRow label="Equipment" value={formData.equipmentTypeName ?? "—"} />
          <ReviewRow label="Quantity" value={formData.equipmentQuantity ?? "—"} />
          {formData.notes && <ReviewRow label="Notes" value={formData.notes} />}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-slate-50/50">
          <Users className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold">Workforce Summary</h3>
        </div>
        <div className="px-5 py-2">
          <ReviewRow label="Required Workers" value={formData.requiredWorkerCount ?? "—"} />
          <ReviewRow
            label="Same-Cluster Workers"
            value={formData.selectedSameClusterWorkerIds?.length ?? 0}
          />
          <ReviewRow
            label="Borrowed Workers"
            value={formData.selectedBorrowedWorkerIds?.length ?? 0}
          />
          <ReviewRow
            label="Ad-hoc Workers"
            value={formData.adhocWorkerCount ?? 0}
          />
          <div className="flex items-center justify-between py-3 font-semibold">
            <span className="text-sm">Total Workers Assigned</span>
            <span
              className={`text-sm ${
                totalAssigned >= (formData.requiredWorkerCount ?? 0)
                  ? "text-emerald-600"
                  : "text-orange-600"
              }`}
            >
              {totalAssigned} / {formData.requiredWorkerCount}
            </span>
          </div>
        </div>
      </div>

      {/* Confirm Notice */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-900">Ready to Submit</p>
          <p className="text-xs text-indigo-700 mt-0.5">
            This task will be created as <strong>Scheduled</strong>. The supervisor will be notified
            and workers will be marked as assigned immediately.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          id="step5-back"
          className="inline-flex items-center gap-2 px-6 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          id="step5-confirm"
          className="inline-flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Task...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Confirm & Create Task
            </>
          )}
        </button>
      </div>
    </div>
  );
}
