"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskStep3Schema, type TaskStep3Input } from "@/lib/validations/task.schema";
import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Users, UserCheck, UserPlus, AlertTriangle } from "lucide-react";
import type { TaskFormData } from "./TaskCreateWizard";

interface Step3Props {
  formData: Partial<TaskFormData>;
  updateFormData: (data: Partial<TaskFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface AvailabilityData {
  sameClusterCount: number;
  otherClustersCount: number;
  totalAvailablePermanent: number;
}

export default function Step3Workforce({ formData, updateFormData, onNext, onBack }: Step3Props) {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [requiredCount, setRequiredCount] = useState(formData.requiredWorkerCount ?? 10);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<TaskStep3Input>({
    resolver: zodResolver(TaskStep3Schema),
    defaultValues: { requiredWorkerCount: formData.requiredWorkerCount ?? 10 },
  });

  const watchedCount = watch("requiredWorkerCount");

  useEffect(() => {
    if (!formData.clusterId || !formData.taskDate || !formData.startTime || !formData.endTime) return;
    setIsLoadingAvailability(true);

    // Fetch availability
    fetch(`/api/allocation/availability?clusterId=${formData.clusterId}&warehouseId=${formData.warehouseId}&taskDate=${formData.taskDate}&startTime=${formData.startTime}&endTime=${formData.endTime}`)
      .then((r) => r.json())
      .then((data) => setAvailability(data))
      .catch(() => {})
      .finally(() => setIsLoadingAvailability(false));
  }, [formData.clusterId, formData.warehouseId, formData.taskDate, formData.startTime, formData.endTime]);

  const onSubmit = (data: TaskStep3Input) => {
    updateFormData({ requiredWorkerCount: data.requiredWorkerCount });
    onNext();
  };

  // Calculate allocation breakdown
  const sameCluster = availability?.sameClusterCount ?? 0;
  const otherClusters = availability?.otherClustersCount ?? 0;
  const totalPermanent = availability?.totalAvailablePermanent ?? 0;

  const fromSameCluster = Math.min(watchedCount ?? 0, sameCluster);
  const remaining1 = Math.max(0, (watchedCount ?? 0) - fromSameCluster);
  const fromOtherClusters = Math.min(remaining1, otherClusters);
  const adhocNeeded = Math.max(0, remaining1 - fromOtherClusters);

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="step3-form">
      <div className="form-section space-y-6">
        <p className="form-section-title">Workforce Requirement</p>

        {/* Required Worker Count */}
        <div className="space-y-1.5">
          <label htmlFor="requiredWorkerCount" className="text-sm font-medium text-slate-700">
            Required Worker Count <span className="text-red-500">*</span>
          </label>
          <input
            id="requiredWorkerCount"
            type="number"
            min={1}
            max={1000}
            {...register("requiredWorkerCount", { valueAsNumber: true })}
            className={`w-full max-w-xs px-4 py-2.5 rounded-lg border text-sm bg-white transition-all
              focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
              ${errors.requiredWorkerCount ? "border-red-400" : "border-slate-300"}`}
            placeholder="e.g. 25"
          />
          {errors.requiredWorkerCount && (
            <p className="text-xs text-red-600">{errors.requiredWorkerCount.message}</p>
          )}
        </div>

        {/* Availability Overview */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">
            Worker Availability — {formData.clusterName}
          </h4>

          {isLoadingAvailability ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Same cluster */}
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Same Cluster Permanent</p>
                    <p className="text-xs text-muted-foreground">{formData.clusterName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-700 tabular-nums">{sameCluster}</p>
                  <p className="text-[10px] text-muted-foreground">available</p>
                </div>
              </div>

              {/* Other clusters */}
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Other Clusters (Same Warehouse)</p>
                    <p className="text-xs text-muted-foreground">Borrowable permanent workers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-700 tabular-nums">{otherClusters}</p>
                  <p className="text-[10px] text-muted-foreground">available to borrow</p>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                <p className="text-sm font-semibold text-indigo-700">Total Permanent Available</p>
                <p className="text-lg font-bold text-indigo-700 tabular-nums">{totalPermanent}</p>
              </div>
            </div>
          )}
        </div>

        {/* Allocation Preview */}
        {!isLoadingAvailability && watchedCount > 0 && (
          <div className="bg-white rounded-xl border border-border p-5">
            <h4 className="text-sm font-semibold mb-4">Allocation Breakdown Preview</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-sm">From same cluster (priority 1)</span>
                </div>
                <span className="font-semibold text-indigo-700">{fromSameCluster} workers</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Borrowed from other clusters (priority 2)</span>
                </div>
                <span className="font-semibold text-blue-700">{fromOtherClusters} workers</span>
              </div>
              {adhocNeeded > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-sm">Ad-hoc workers needed (priority 3)</span>
                  </div>
                  <span className="font-semibold text-orange-700">{adhocNeeded} workers</span>
                </div>
              )}
              <div className="pt-2 mt-2 border-t border-border flex justify-between font-semibold">
                <span>Total Required</span>
                <span>{watchedCount}</span>
              </div>
            </div>

            {adhocNeeded > 0 && (
              <div className="mt-4 flex items-start gap-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">{adhocNeeded} ad-hoc workers</span> will need to be hired for this task. You will be able to select them in the next step.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button type="button" onClick={onBack} id="step3-back"
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button type="submit" id="step3-next"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Next: Assignment
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
