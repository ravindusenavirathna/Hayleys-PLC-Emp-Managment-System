"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, UserCheck, Users, UserPlus } from "lucide-react";
import type { TaskFormData } from "./TaskCreateWizard";

interface Step4Props {
  formData: Partial<TaskFormData>;
  updateFormData: (data: Partial<TaskFormData>) => void;
  supervisors: Array<{ id: string; name: string; email: string }>;
  onNext: () => void;
  onBack: () => void;
}

interface WorkerOption {
  id: string;
  name: string;
  employeeCode: string;
  homeClusterName?: string;
}

interface SuggestionData {
  sameClusterWorkers: WorkerOption[];
  otherClusterWorkers: WorkerOption[];
  adhocNeeded: number;
}

export default function Step4Assignment({
  formData, updateFormData, supervisors, onNext, onBack,
}: Step4Props) {
  const [suggestions, setSuggestions] = useState<SuggestionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSameCluster, setSelectedSameCluster] = useState<string[]>(
    formData.selectedSameClusterWorkerIds ?? []
  );
  const [selectedBorrowed, setSelectedBorrowed] = useState<string[]>(
    formData.selectedBorrowedWorkerIds ?? []
  );
  const [adhocCount, setAdhocCount] = useState(formData.adhocWorkerCount ?? 0);
  const [supervisorId, setSupervisorId] = useState(formData.supervisorId ?? "");

  useEffect(() => {
    if (!formData.clusterId || !formData.warehouseId || !formData.requiredWorkerCount) return;
    setIsLoading(true);

    fetch(
      `/api/allocation/suggest?clusterId=${formData.clusterId}&warehouseId=${formData.warehouseId}&taskDate=${formData.taskDate}&startTime=${formData.startTime}&endTime=${formData.endTime}&requiredCount=${formData.requiredWorkerCount}`
    )
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(data);
        // Auto-select suggested workers
        setSelectedSameCluster(data.sameClusterWorkers.map((w: WorkerOption) => w.id));
        setSelectedBorrowed(data.otherClusterWorkers.map((w: WorkerOption) => w.id));
        setAdhocCount(data.adhocNeeded);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const toggleWorker = (id: string, type: "same" | "borrowed") => {
    if (type === "same") {
      setSelectedSameCluster((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedBorrowed((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const handleNext = () => {
    updateFormData({
      supervisorId,
      selectedSameClusterWorkerIds: selectedSameCluster,
      selectedBorrowedWorkerIds: selectedBorrowed,
      adhocWorkerCount: adhocCount,
    });
    onNext();
  };

  const totalSelected = selectedSameCluster.length + selectedBorrowed.length + adhocCount;

  return (
    <div className="space-y-4">
      {/* Supervisor Selection */}
      <div className="form-section space-y-4">
        <p className="form-section-title">Supervisor Assignment</p>
        <div className="space-y-1.5">
          <label htmlFor="supervisorId" className="text-sm font-medium text-slate-700">
            Assign Supervisor
          </label>
          <select
            id="supervisorId"
            value={supervisorId}
            onChange={(e) => setSupervisorId(e.target.value)}
            className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">No supervisor assigned</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Worker Selection */}
      <div className="form-section space-y-5">
        <div className="flex items-center justify-between">
          <p className="form-section-title">Worker Assignment</p>
          <div className="text-sm">
            <span className="font-semibold text-indigo-700">{totalSelected}</span>
            <span className="text-muted-foreground">/{formData.requiredWorkerCount} workers</span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-lg" />
            ))}
          </div>
        ) : suggestions ? (
          <div className="space-y-6">
            {/* Same cluster workers */}
            {suggestions.sameClusterWorkers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-semibold">
                    Same Cluster Workers ({selectedSameCluster.length}/{suggestions.sameClusterWorkers.length} selected)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {suggestions.sameClusterWorkers.map((worker) => {
                    const isSelected = selectedSameCluster.includes(worker.id);
                    return (
                      <button
                        key={worker.id}
                        type="button"
                        id={`worker-same-${worker.id}`}
                        onClick={() => toggleWorker(worker.id, "same")}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-400 text-indigo-900"
                            : "bg-white border-slate-200 text-foreground hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 ${
                          isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                        }`}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{worker.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{worker.employeeCode}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Borrowed workers from other clusters */}
            {suggestions.otherClusterWorkers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold">
                    Borrowed from Other Clusters ({selectedBorrowed.length}/{suggestions.otherClusterWorkers.length} selected)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {suggestions.otherClusterWorkers.map((worker) => {
                    const isSelected = selectedBorrowed.includes(worker.id);
                    return (
                      <button
                        key={worker.id}
                        type="button"
                        id={`worker-borrow-${worker.id}`}
                        onClick={() => toggleWorker(worker.id, "borrowed")}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "bg-blue-50 border-blue-400 text-blue-900"
                            : "bg-white border-slate-200 text-foreground hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 ${
                          isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300"
                        }`}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{worker.name}</p>
                          <p className="text-[10px] text-muted-foreground">{worker.homeClusterName}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ad-hoc count */}
            {suggestions.adhocNeeded > 0 && (
              <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserPlus className="w-4 h-4 text-orange-600" />
                  <h4 className="text-sm font-semibold text-orange-800">Ad-hoc Workers Required</h4>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="adhocCount" className="text-xs font-medium text-orange-700">
                    Number of ad-hoc workers to hire
                  </label>
                  <input
                    id="adhocCount"
                    type="number"
                    min={0}
                    value={adhocCount}
                    onChange={(e) => setAdhocCount(parseInt(e.target.value) || 0)}
                    className="w-32 px-3 py-2 rounded-lg border border-orange-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <p className="text-xs text-orange-600">
                    Suggested: {suggestions.adhocNeeded} ad-hoc workers needed based on permanent worker shortfall
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No worker suggestions available. Please ensure cluster and date/time are set correctly.
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button type="button" onClick={onBack} id="step4-back"
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button type="button" onClick={handleNext} id="step4-next"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Review & Confirm
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
