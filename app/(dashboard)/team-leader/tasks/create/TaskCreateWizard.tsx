"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils/helpers";
import {
  CheckCircle, MapPin, ClipboardList, Users, UserCheck, Eye, Loader2,
  ChevronRight, ChevronLeft,
} from "lucide-react";
import Step1Location from "./Step1Location";
import Step2Details from "./Step2Details";
import Step3Workforce from "./Step3Workforce";
import Step4Assignment from "./Step4Assignment";
import Step5Review from "./Step5Review";
import { createTaskAction } from "./actions";

export interface TaskFormData {
  // Step 1
  warehouseId: string;
  warehouseName: string;
  clusterId: string;
  clusterName: string;
  taskDate: string;
  startTime: string;
  endTime: string;
  // Step 2
  clientId: string;
  clientName: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  equipmentTypeId: string;
  equipmentTypeName: string;
  equipmentQuantity: number;
  notes: string;
  // Step 3
  requiredWorkerCount: number;
  // Step 4
  supervisorId: string;
  selectedSameClusterWorkerIds: string[];
  selectedBorrowedWorkerIds: string[];
  adhocWorkerCount: number;
}

const STEPS = [
  { id: 1, label: "Location & Time", icon: MapPin, shortLabel: "Location" },
  { id: 2, label: "Task Details", icon: ClipboardList, shortLabel: "Details" },
  { id: 3, label: "Workforce Req.", icon: Users, shortLabel: "Workforce" },
  { id: 4, label: "Assignment", icon: UserCheck, shortLabel: "Assign" },
  { id: 5, label: "Review & Confirm", icon: Eye, shortLabel: "Review" },
];

interface TaskCreateWizardProps {
  warehouseId: string;
  warehouseName: string;
  clusters: Array<{ id: string; name: string; code: string }>;
  clients: Array<{ id: string; name: string; code: string }>;
  categories: Array<{
    id: string;
    name: string;
    subCategories: Array<{ id: string; name: string }>;
  }>;
  equipmentTypes: Array<{ id: string; name: string }>;
  supervisors: Array<{ id: string; name: string; email: string }>;
  createdById: string;
}

export default function TaskCreateWizard({
  warehouseId,
  warehouseName,
  clusters,
  clients,
  categories,
  equipmentTypes,
  supervisors,
  createdById,
}: TaskCreateWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<TaskFormData>>({
    warehouseId,
    warehouseName,
  });

  const updateFormData = (data: Partial<TaskFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const goNext = () => {
    if (currentStep < 5) setCurrentStep((prev) => prev + 1);
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await createTaskAction({
        ...formData as TaskFormData,
        createdById,
      });

      if (result.success) {
        toast.success("Task created successfully!", {
          description: `Task ${result.taskNumber} has been scheduled.`,
        });
        router.push("/team-leader/tasks");
      } else {
        toast.error("Failed to create task", {
          description: result.error ?? "An unexpected error occurred.",
        });
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isPending = currentStep < step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      isCompleted
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : isCurrent
                        ? "bg-white border-indigo-600 text-indigo-600"
                        : "bg-white border-slate-200 text-slate-300"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-[10px] font-medium mt-1.5 hidden sm:block",
                      isCurrent ? "text-indigo-600" : isCompleted ? "text-slate-700" : "text-slate-400"
                    )}
                  >
                    {step.shortLabel}
                  </p>
                </div>

                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2 transition-all duration-300",
                      isCompleted ? "bg-indigo-600" : "bg-slate-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Step {currentStep} of {STEPS.length}
          </p>
          <p className="text-base font-semibold text-foreground">
            {STEPS[currentStep - 1].label}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <div className="animate-fade-in">
        {currentStep === 1 && (
          <Step1Location
            formData={formData}
            updateFormData={updateFormData}
            clusters={clusters}
            onNext={goNext}
          />
        )}
        {currentStep === 2 && (
          <Step2Details
            formData={formData}
            updateFormData={updateFormData}
            clients={clients}
            categories={categories}
            equipmentTypes={equipmentTypes}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {currentStep === 3 && (
          <Step3Workforce
            formData={formData}
            updateFormData={updateFormData}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {currentStep === 4 && (
          <Step4Assignment
            formData={formData}
            updateFormData={updateFormData}
            supervisors={supervisors}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {currentStep === 5 && (
          <Step5Review
            formData={formData}
            onBack={goBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
