"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskStep2Schema, type TaskStep2Input } from "@/lib/validations/task.schema";
import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { TaskFormData } from "./TaskCreateWizard";

interface Step2Props {
  formData: Partial<TaskFormData>;
  updateFormData: (data: Partial<TaskFormData>) => void;
  clients: Array<{ id: string; name: string; code: string }>;
  categories: Array<{
    id: string;
    name: string;
    subCategories: Array<{ id: string; name: string }>;
  }>;
  equipmentTypes: Array<{ id: string; name: string }>;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Details({
  formData, updateFormData, clients, categories, equipmentTypes, onNext, onBack,
}: Step2Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(formData.categoryId ?? "");

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<TaskStep2Input>({
    resolver: zodResolver(TaskStep2Schema),
    defaultValues: {
      clientId: formData.clientId ?? "",
      categoryId: formData.categoryId ?? "",
      subCategoryId: formData.subCategoryId ?? "",
      equipmentTypeId: formData.equipmentTypeId ?? "",
      equipmentQuantity: formData.equipmentQuantity ?? 1,
      notes: formData.notes ?? "",
    },
  });

  const onSubmit = (data: TaskStep2Input) => {
    const cat = categories.find((c) => c.id === data.categoryId);
    const subCat = cat?.subCategories.find((s) => s.id === data.subCategoryId);
    const client = clients.find((c) => c.id === data.clientId);
    const eqType = equipmentTypes.find((e) => e.id === data.equipmentTypeId);

    updateFormData({
      ...data,
      categoryName: cat?.name ?? "",
      subCategoryName: subCat?.name ?? "",
      clientName: client?.code ?? "",
      equipmentTypeName: eqType?.name ?? "",
    });
    onNext();
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const availableSubCats = selectedCategory?.subCategories ?? [];

  const inputClass = (hasError: boolean) => `
    w-full px-4 py-2.5 rounded-lg border text-sm bg-white transition-all
    focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
    ${hasError ? "border-red-400" : "border-slate-300"}
  `;

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="step2-form">
      <div className="form-section space-y-5">
        <p className="form-section-title">Task & Equipment Details</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Client */}
          <div className="space-y-1.5">
            <label htmlFor="clientId" className="text-sm font-medium text-slate-700">
              Client <span className="text-red-500">*</span>
            </label>
            <select id="clientId" {...register("clientId")} className={inputClass(!!errors.clientId)}>
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
            {errors.clientId && <p className="text-xs text-red-600">{errors.clientId.message}</p>}
          </div>

          {/* Main Category */}
          <div className="space-y-1.5">
            <label htmlFor="categoryId" className="text-sm font-medium text-slate-700">
              Main Category <span className="text-red-500">*</span>
            </label>
            <select
              id="categoryId"
              {...register("categoryId", {
                onChange: (e) => {
                  setSelectedCategoryId(e.target.value);
                  setValue("subCategoryId", ""); // Reset sub-category when main changes
                },
              })}
              className={inputClass(!!errors.categoryId)}
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-red-600">{errors.categoryId.message}</p>}
          </div>

          {/* Sub-Category — DEPENDENT on main category */}
          <div className="space-y-1.5">
            <label htmlFor="subCategoryId" className="text-sm font-medium text-slate-700">
              Sub-Category <span className="text-red-500">*</span>
            </label>
            <select
              id="subCategoryId"
              {...register("subCategoryId")}
              disabled={!selectedCategoryId}
              className={`${inputClass(!!errors.subCategoryId)} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">
                {selectedCategoryId ? "Select sub-category..." : "Select main category first"}
              </option>
              {availableSubCats.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>
            {errors.subCategoryId && <p className="text-xs text-red-600">{errors.subCategoryId.message}</p>}
          </div>

          {/* Equipment Type */}
          <div className="space-y-1.5">
            <label htmlFor="equipmentTypeId" className="text-sm font-medium text-slate-700">
              Equipment Type <span className="text-red-500">*</span>
            </label>
            <select id="equipmentTypeId" {...register("equipmentTypeId")} className={inputClass(!!errors.equipmentTypeId)}>
              <option value="">Select equipment...</option>
              {equipmentTypes.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            {errors.equipmentTypeId && <p className="text-xs text-red-600">{errors.equipmentTypeId.message}</p>}
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label htmlFor="equipmentQuantity" className="text-sm font-medium text-slate-700">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              id="equipmentQuantity"
              type="number"
              min={1}
              {...register("equipmentQuantity", { valueAsNumber: true })}
              className={inputClass(!!errors.equipmentQuantity)}
              placeholder="e.g. 5"
            />
            {errors.equipmentQuantity && <p className="text-xs text-red-600">{errors.equipmentQuantity.message}</p>}
          </div>

          {/* Notes — full width */}
          <div className="md:col-span-2 space-y-1.5">
            <label htmlFor="notes" className="text-sm font-medium text-slate-700">Notes (Optional)</label>
            <textarea
              id="notes"
              {...register("notes")}
              rows={3}
              placeholder="Add any additional notes or special instructions..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-white resize-none
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button type="button" onClick={onBack} id="step2-back"
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button type="submit" id="step2-next"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Next: Workforce
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
