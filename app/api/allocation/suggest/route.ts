import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AllocationService } from "@/services/allocation.service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clusterId = searchParams.get("clusterId");
    const warehouseId = searchParams.get("warehouseId");
    const taskDate = searchParams.get("taskDate");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const requiredCount = parseInt(searchParams.get("requiredCount") ?? "0");

    if (!clusterId || !warehouseId || !taskDate || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const dateObj = new Date(taskDate);
    const startDateTime = new Date(`${taskDate}T${startTime}:00`);
    const endDateTime = new Date(`${taskDate}T${endTime}:00`);

    // Get full availability with worker details
    const availability = await AllocationService.getWorkerAvailability(
      warehouseId,
      clusterId,
      dateObj,
      startDateTime,
      endDateTime
    );

    // Apply priority logic
    const suggestion = await AllocationService.suggestAllocation(
      warehouseId,
      clusterId,
      dateObj,
      startDateTime,
      endDateTime,
      requiredCount
    );

    const suggestedSameClusterIds = new Set(suggestion.sameClusterWorkers);
    const suggestedBorrowedIds = new Set(suggestion.borrowedWorkers);

    return NextResponse.json({
      sameClusterWorkers: availability.sameClusterFree.filter(w => suggestedSameClusterIds.has(w.id)),
      otherClusterWorkers: availability.otherClustersFree.filter(w => suggestedBorrowedIds.has(w.id)),
      adhocNeeded: suggestion.adhocNeeded,
    });
  } catch (error) {
    console.error("[GET /api/allocation/suggest]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
