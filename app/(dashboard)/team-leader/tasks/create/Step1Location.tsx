"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskStep1Schema, type TaskStep1Input } from "@/lib/validations/task.schema";
import { ChevronRight } from "lucide-react";
import type { TaskFormData } from "./TaskCreateWizard";

interface Step1Props {
  formData: Partial<TaskFormData>;
  updateFormData: (data: Partial<TaskFormData>) => void;
  clusters: Array<{ id: string; name: string; code: string }>;
  onNext: () => void;
}

export default function Step1Location({ formData, updateFormData, clusters, onNext }: Step1Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<TaskStep1Input>({
    resolver: zodResolver(TaskStep1Schema),
    defaultValues: {
      warehouseId: formData.warehouseId ?? "",
      clusterId: formData.clusterId ?? "",
      taskDate: formData.taskDate ?? "",
      startTime: formData.startTime ?? "",
      endTime: formData.endTime ?? "",
    },
  });

  const onSubmit = (data: TaskStep1Input) => {
    const selectedCluster = clusters.find((c) => c.id === data.clusterId);
    updateFormData({
      ...data,
      clusterName: selectedCluster?.name ?? "",
    });
    onNext();
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="step1-form">
      <div className="form-section space-y-5">
        <p className="form-section-title">Location & Scheduling</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Warehouse — locked to user's warehouse */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Warehouse</label>
            <input
              {...register("warehouseId")}
              type="hidden"
              value={formData.warehouseId}
            />
            <div className="px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              {formData.warehouseName}
              <span className="ml-auto text-xs text-muted-foreground">(Your warehouse)</span>
            </div>
          </div>

          {/* Cluster */}
          <div className="space-y-1.5">
            <label htmlFor="clusterId" className="text-sm font-medium text-slate-700">
              Cluster <span className="text-red-500">*</span>
            </label>
            <select
              id="clusterId"
              {...register("clusterId")}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white transition-all
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                ${errors.clusterId ? "border-red-400" : "border-slate-300"}`}
            >
              <option value="">Select cluster...</option>
              {clusters.map((cluster) => (
                <option key={cluster.id} value={cluster.id}>
                  {cluster.name}
                </option>
              ))}
            </select>
            {errors.clusterId && (
              <p className="text-xs text-red-600">{errors.clusterId.message}</p>
            )}
          </div>

          {/* Task Date */}
          <div className="space-y-1.5">
            <label htmlFor="taskDate" className="text-sm font-medium text-slate-700">
              Task Date <span className="text-red-500">*</span>
            </label>
            <input
              id="taskDate"
              type="date"
              min={minDate}
              {...register("taskDate")}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white transition-all
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                ${errors.taskDate ? "border-red-400" : "border-slate-300"}`}
            />
            {errors.taskDate && (
              <p className="text-xs text-red-600">{errors.taskDate.message}</p>
            )}
          </div>

          {/* Start Time */}
          <div className="space-y-1.5">
            <label htmlFor="startTime" className="text-sm font-medium text-slate-700">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              id="startTime"
              type="time"
              {...register("startTime")}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white transition-all
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                ${errors.startTime ? "border-red-400" : "border-slate-300"}`}
            />
            {errors.startTime && (
              <p className="text-xs text-red-600">{errors.startTime.message}</p>
            )}
          </div>

          {/* End Time */}
          <div className="space-y-1.5">
            <label htmlFor="endTime" className="text-sm font-medium text-slate-700">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              id="endTime"
              type="time"
              {...register("endTime")}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white transition-all
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                ${errors.endTime ? "border-red-400" : "border-slate-300"}`}
            />
            {errors.endTime && (
              <p className="text-xs text-red-600">{errors.endTime.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button
            type="submit"
            id="step1-next"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Next: Task Details
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
