import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

// Supabase admin client for creating auth users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DEMO_PASSWORD = "Demo@1234";

async function createSupabaseUser(email: string, name: string, role: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (error) {
    // User might already exist
    console.log(`  ⚠ Supabase user ${email}: ${error.message}`);
    // Try to get existing user
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existing = listData?.users?.find((u) => u.email === email);
    if (existing) {
      // Update metadata for existing user to ensure role is set
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        user_metadata: { name, role },
      });
      return existing.id;
    }
    throw error;
  }
  return data.user.id;
}

async function main() {
  console.log("🌱 Starting LogiCore WMS seed...\n");

  // ============================================================
  // ROLES
  // ============================================================
  console.log("📋 Seeding roles...");
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: "admin" },
      update: {},
      create: {
        name: "admin",
        displayName: "Administrator",
        permissions: {
          canViewAllWarehouses: true,
          canManageUsers: true,
          canManageEmployees: true,
          canManageTasks: true,
          canViewReports: true,
          canViewAuditLogs: true,
          canOverrideData: true,
        },
      },
    }),
    prisma.role.upsert({
      where: { name: "team_leader" },
      update: {},
      create: {
        name: "team_leader",
        displayName: "Team Leader",
        permissions: {
          canViewOwnWarehouse: true,
          canCreateTasks: true,
          canViewClusterOverview: true,
          canViewReports: true,
        },
      },
    }),
    prisma.role.upsert({
      where: { name: "supervisor" },
      update: {},
      create: {
        name: "supervisor",
        displayName: "Supervisor",
        permissions: {
          canViewOwnWarehouse: true,
          canAssignTasks: true,
          canAssignWorkers: true,
          canBorrowWorkers: true,
          canHireAdhoc: true,
          canMonitorTasks: true,
          canReleaseWorkers: true,
        },
      },
    }),
    prisma.role.upsert({
      where: { name: "assistant" },
      update: {},
      create: {
        name: "assistant",
        displayName: "Assistant",
        permissions: {
          canViewOwnCluster: true,
          canUpdateTaskProgress: true,
          canUpdateAttendance: true,
          canMarkTaskCompleted: true,
        },
      },
    }),
    prisma.role.upsert({
      where: { name: "permanent_worker" },
      update: {},
      create: {
        name: "permanent_worker",
        displayName: "Permanent Worker",
        permissions: {
          canViewOwnTask: true,
          canMarkOwnTaskDone: true,
        },
      },
    }),
    prisma.role.upsert({
      where: { name: "adhoc_worker" },
      update: {},
      create: {
        name: "adhoc_worker",
        displayName: "Ad-hoc Worker",
        permissions: {
          canViewOwnTask: true,
          canMarkOwnTaskDone: true,
        },
      },
    }),
  ]);

  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r]));
  console.log(`  ✓ Created ${roles.length} roles`);

  // ============================================================
  // WAREHOUSES
  // ============================================================
  console.log("\n🏭 Seeding warehouses...");
  const [venusWH, mercuryWH] = await Promise.all([
    prisma.warehouse.upsert({
      where: { code: "VNS" },
      update: {},
      create: { name: "Venus", code: "VNS", description: "Venus Warehouse — Primary logistics hub" },
    }),
    prisma.warehouse.upsert({
      where: { code: "MRC" },
      update: {},
      create: { name: "Mercury", code: "MRC", description: "Mercury Warehouse — Secondary logistics hub" },
    }),
  ]);
  console.log("  ✓ Created 2 warehouses: Venus, Mercury");

  // ============================================================
  // CLUSTERS
  // ============================================================
  console.log("\n🗂 Seeding clusters...");
  const clusters = await Promise.all([
    prisma.cluster.upsert({
      where: { warehouseId_code: { warehouseId: venusWH.id, code: "VNS-A" } },
      update: {},
      create: { warehouseId: venusWH.id, name: "Venus Cluster A", code: "VNS-A" },
    }),
    prisma.cluster.upsert({
      where: { warehouseId_code: { warehouseId: venusWH.id, code: "VNS-B" } },
      update: {},
      create: { warehouseId: venusWH.id, name: "Venus Cluster B", code: "VNS-B" },
    }),
    prisma.cluster.upsert({
      where: { warehouseId_code: { warehouseId: venusWH.id, code: "VNS-C" } },
      update: {},
      create: { warehouseId: venusWH.id, name: "Venus Cluster C", code: "VNS-C" },
    }),
    prisma.cluster.upsert({
      where: { warehouseId_code: { warehouseId: mercuryWH.id, code: "MRC-A" } },
      update: {},
      create: { warehouseId: mercuryWH.id, name: "Mercury Cluster A", code: "MRC-A" },
    }),
    prisma.cluster.upsert({
      where: { warehouseId_code: { warehouseId: mercuryWH.id, code: "MRC-B" } },
      update: {},
      create: { warehouseId: mercuryWH.id, name: "Mercury Cluster B", code: "MRC-B" },
    }),
    prisma.cluster.upsert({
      where: { warehouseId_code: { warehouseId: mercuryWH.id, code: "MRC-C" } },
      update: {},
      create: { warehouseId: mercuryWH.id, name: "Mercury Cluster C", code: "MRC-C" },
    }),
  ]);

  const [vnsA, vnsB, vnsC, mrcA, mrcB, mrcC] = clusters;
  console.log("  ✓ Created 6 clusters");

  // ============================================================
  // CLIENTS
  // ============================================================
  console.log("\n👥 Seeding clients...");
  const clientData = [
    { name: "APL", code: "APL" },
    { name: "TAM", code: "TAM" },
    { name: "FLI", code: "FLI" },
    { name: "HCN", code: "HCN" },
    { name: "MSA", code: "MSA" },
    { name: "ELITE", code: "ELITE" },
    { name: "GVL", code: "GVL" },
    { name: "DLL", code: "DLL" },
  ];
  const clientsCreated = await Promise.all(
    clientData.map((c) =>
      prisma.client.upsert({ where: { code: c.code }, update: {}, create: c })
    )
  );
  const clientMap = Object.fromEntries(clientsCreated.map((c) => [c.code, c]));
  console.log("  ✓ Created 8 clients");

  // ============================================================
  // TASK CATEGORIES & SUB-CATEGORIES
  // ============================================================
  console.log("\n📦 Seeding task categories...");
  const [importCat, exportCat, domesticCat] = await Promise.all([
    prisma.taskCategory.upsert({ where: { name: "Import" }, update: {}, create: { name: "Import" } }),
    prisma.taskCategory.upsert({ where: { name: "Export" }, update: {}, create: { name: "Export" } }),
    prisma.taskCategory.upsert({ where: { name: "Domestic" }, update: {}, create: { name: "Domestic" } }),
  ]);

  const subCatData = [
    { categoryId: importCat.id, name: "FCL" },
    { categoryId: importCat.id, name: "LCL" },
    { categoryId: importCat.id, name: "Empty Return" },
    { categoryId: exportCat.id, name: "FCL" },
    { categoryId: exportCat.id, name: "LCL" },
    { categoryId: exportCat.id, name: "Local Export" },
    { categoryId: domesticCat.id, name: "Warehouse Delivery" },
    { categoryId: domesticCat.id, name: "Hub Transfer" },
  ];

  const subCats = await Promise.all(
    subCatData.map((sc) =>
      prisma.taskSubCategory.upsert({
        where: { id: `${sc.categoryId}-${sc.name}` },
        update: {},
        create: { ...sc, id: `${sc.categoryId}-${sc.name}` },
      })
    )
  );
  console.log("  ✓ Created 3 categories and 8 sub-categories");

  // ============================================================
  // EQUIPMENT TYPES
  // ============================================================
  console.log("\n🚛 Seeding equipment types...");
  const equipTypes = await Promise.all([
    prisma.equipmentType.upsert({ where: { name: "20ft Container" }, update: {}, create: { name: "20ft Container" } }),
    prisma.equipmentType.upsert({ where: { name: "40ft Container" }, update: {}, create: { name: "40ft Container" } }),
    prisma.equipmentType.upsert({ where: { name: "16.5ft Lorry" }, update: {}, create: { name: "16.5ft Lorry" } }),
    prisma.equipmentType.upsert({ where: { name: "CBM/Pallet" }, update: {}, create: { name: "CBM/Pallet" } }),
  ]);
  const [eq20ft, eq40ft, eq165, eqCBM] = equipTypes;
  console.log("  ✓ Created 4 equipment types");

  // ============================================================
  // DEMO USERS (Auth + DB)
  // ============================================================
  console.log("\n🔐 Creating demo users in Supabase Auth...");

  const userSeeds = [
    { email: "admin@example.com", name: "Alex Admin", role: "admin", warehouse: null, cluster: null },
    { email: "teamleader.venus@example.com", name: "Thomas Venus", role: "team_leader", warehouse: venusWH, cluster: null },
    { email: "teamleader.mercury@example.com", name: "Marcus Mercury", role: "team_leader", warehouse: mercuryWH, cluster: null },
    { email: "supervisor.venus@example.com", name: "Sarah Supervisor", role: "supervisor", warehouse: venusWH, cluster: vnsA },
    { email: "supervisor.mercury@example.com", name: "Michael Mercury-Sup", role: "supervisor", warehouse: mercuryWH, cluster: mrcA },
    { email: "assistant.venus.a@example.com", name: "Anna Assistant-A", role: "assistant", warehouse: venusWH, cluster: vnsA },
    { email: "assistant.venus.b@example.com", name: "Brian Assistant-B", role: "assistant", warehouse: venusWH, cluster: vnsB },
    { email: "worker001@example.com", name: "William Worker-01", role: "permanent_worker", warehouse: venusWH, cluster: vnsA },
    { email: "adhoc001@example.com", name: "Adam Adhoc-01", role: "adhoc_worker", warehouse: venusWH, cluster: vnsA },
  ];

  const createdUsers: Record<string, any> = {};

  for (const u of userSeeds) {
    console.log(`  Creating user: ${u.email}...`);
    const supabaseId = await createSupabaseUser(u.email, u.name, u.role);
    const dbUser = await prisma.user.upsert({
      where: { id: supabaseId },
      update: {},
      create: {
        id: supabaseId,
        email: u.email,
        name: u.name,
        roleId: roleMap[u.role].id,
        warehouseId: u.warehouse?.id ?? null,
        clusterId: u.cluster?.id ?? null,
        isActive: true,
      },
    });
    createdUsers[u.email] = dbUser;
    console.log(`  ✓ ${u.name} (${u.role})`);
  }

  // ============================================================
  // EMPLOYEES — 100+ permanent workers
  // ============================================================
  console.log("\n👷 Seeding employees (100+ permanent workers)...");

  const firstNames = ["Kamal", "Nimal", "Sunil", "Priyantha", "Chaminda", "Ruwan", "Dinesh", "Asanka", "Lahiru", "Nuwan",
    "Samantha", "Mahesh", "Gayan", "Thilina", "Kasun", "Randika", "Sachith", "Isuru", "Chanaka", "Buddika",
    "Nalaka", "Harsha", "Shehan", "Damith", "Rajeev", "Indika", "Upul", "Dhanushka", "Manjula", "Prasad"];
  const lastNames = ["Perera", "Silva", "Fernando", "Dissanayake", "Jayawardena", "Wickramasinghe", "Bandara",
    "Rajapaksa", "Gunawardena", "Athukorala", "Kumara", "Pathirana", "Liyanage", "Madushanka", "Seneviratne",
    "Weerasinghe", "Ranasinghe", "Herath", "Edirisinghe", "Mendis"];

  const clusterAssignments = [
    { cluster: vnsA, warehouse: venusWH, count: 20 },
    { cluster: vnsB, warehouse: venusWH, count: 18 },
    { cluster: vnsC, warehouse: venusWH, count: 17 },
    { cluster: mrcA, warehouse: mercuryWH, count: 16 },
    { cluster: mrcB, warehouse: mercuryWH, count: 15 },
    { cluster: mrcC, warehouse: mercuryWH, count: 14 },
  ];

  let workerSeq = 1;
  const allWorkers: any[] = [];

  for (const assignment of clusterAssignments) {
    for (let i = 0; i < assignment.count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const code = `EMP-${String(workerSeq).padStart(4, "0")}`;
      const statusOptions: Array<"free" | "assigned" | "working"> = ["free", "free", "free", "free", "assigned", "working"];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

      const employee = await prisma.employee.upsert({
        where: { employeeCode: code },
        update: {},
        create: {
          employeeCode: code,
          name: `${firstName} ${lastName}`,
          phone: `077${Math.floor(Math.random() * 10000000).toString().padStart(7, "0")}`,
          homeWarehouseId: assignment.warehouse.id,
          homeClusterId: assignment.cluster.id,
          employeeType: "permanent",
          status,
          isActive: true,
        },
      });
      allWorkers.push(employee);
      workerSeq++;
    }
  }

  // Link worker001 user to an employee
  const workerUser = createdUsers["worker001@example.com"];
  const worker001Employee = await prisma.employee.upsert({
    where: { employeeCode: "EMP-0001" },
    update: { userId: workerUser.id },
    create: {
      employeeCode: "EMP-0001",
      name: "William Worker-01",
      homeWarehouseId: venusWH.id,
      homeClusterId: vnsA.id,
      employeeType: "permanent",
      status: "free",
      userId: workerUser.id,
    },
  });

  // Ad-hoc workers
  const adhocUser = createdUsers["adhoc001@example.com"];
  const adhocEmployee = await prisma.employee.upsert({
    where: { employeeCode: "ADHOC-0001" },
    update: { userId: adhocUser.id },
    create: {
      employeeCode: "ADHOC-0001",
      name: "Adam Adhoc-01",
      homeWarehouseId: venusWH.id,
      homeClusterId: vnsA.id,
      employeeType: "adhoc",
      status: "free",
      userId: adhocUser.id,
    },
  });

  // Add 9 more ad-hoc workers
  for (let i = 2; i <= 10; i++) {
    const code = `ADHOC-${String(i).padStart(4, "0")}`;
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    await prisma.employee.upsert({
      where: { employeeCode: code },
      update: {},
      create: {
        employeeCode: code,
        name: `${firstName} ${lastName}`,
        homeWarehouseId: i <= 5 ? venusWH.id : mercuryWH.id,
        homeClusterId: i <= 5 ? vnsA.id : mrcA.id,
        employeeType: "adhoc",
        status: "inactive",
        isActive: false,
      },
    });
  }

  console.log(`  ✓ Created ${workerSeq - 1} permanent workers + 10 ad-hoc workers`);

  // ============================================================
  // SAMPLE TASKS
  // ============================================================
  console.log("\n📋 Seeding sample tasks...");

  const tlVenus = createdUsers["teamleader.venus@example.com"];
  const supVenus = createdUsers["supervisor.venus@example.com"];
  const tlMercury = createdUsers["teamleader.mercury@example.com"];
  const supMercury = createdUsers["supervisor.mercury@example.com"];

  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  // Sub-category lookup
  const getSubCat = (catId: string, name: string) =>
    subCats.find((s) => s.categoryId === catId && s.name === name)!;

  const taskSeeds = [
    {
      taskNumber: "TSK-2024-0001",
      warehouseId: venusWH.id,
      clusterId: vnsA.id,
      clientId: clientMap["APL"].id,
      categoryId: importCat.id,
      subCategoryId: getSubCat(importCat.id, "FCL").id,
      equipmentTypeId: eq40ft.id,
      equipmentQuantity: 5,
      taskDate: today,
      startTime: new Date(today.setHours(8, 0, 0, 0)),
      endTime: new Date(today.setHours(16, 0, 0, 0)),
      requiredWorkerCount: 25,
      status: "in_progress" as const,
      createdById: tlVenus.id,
      supervisorId: supVenus.id,
      notes: "Priority FCL import — handle with care",
    },
    {
      taskNumber: "TSK-2024-0002",
      warehouseId: venusWH.id,
      clusterId: vnsB.id,
      clientId: clientMap["TAM"].id,
      categoryId: exportCat.id,
      subCategoryId: getSubCat(exportCat.id, "LCL").id,
      equipmentTypeId: eq20ft.id,
      equipmentQuantity: 8,
      taskDate: today,
      startTime: new Date(today.setHours(9, 0, 0, 0)),
      endTime: new Date(today.setHours(17, 0, 0, 0)),
      requiredWorkerCount: 15,
      status: "ready_to_start" as const,
      createdById: tlVenus.id,
      supervisorId: supVenus.id,
    },
    {
      taskNumber: "TSK-2024-0003",
      warehouseId: venusWH.id,
      clusterId: vnsC.id,
      clientId: clientMap["FLI"].id,
      categoryId: domesticCat.id,
      subCategoryId: getSubCat(domesticCat.id, "Hub Transfer").id,
      equipmentTypeId: eq165.id,
      equipmentQuantity: 3,
      taskDate: tomorrow,
      startTime: new Date(tomorrow.setHours(7, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(15, 0, 0, 0)),
      requiredWorkerCount: 20,
      status: "worker_allocation_pending" as const,
      createdById: tlVenus.id,
    },
    {
      taskNumber: "TSK-2024-0004",
      warehouseId: mercuryWH.id,
      clusterId: mrcA.id,
      clientId: clientMap["HCN"].id,
      categoryId: importCat.id,
      subCategoryId: getSubCat(importCat.id, "LCL").id,
      equipmentTypeId: eqCBM.id,
      equipmentQuantity: 120,
      taskDate: today,
      startTime: new Date(today.setHours(6, 0, 0, 0)),
      endTime: new Date(today.setHours(14, 0, 0, 0)),
      requiredWorkerCount: 30,
      status: "completed" as const,
      createdById: tlMercury.id,
      supervisorId: supMercury.id,
    },
    {
      taskNumber: "TSK-2024-0005",
      warehouseId: mercuryWH.id,
      clusterId: mrcB.id,
      clientId: clientMap["MSA"].id,
      categoryId: exportCat.id,
      subCategoryId: getSubCat(exportCat.id, "FCL").id,
      equipmentTypeId: eq40ft.id,
      equipmentQuantity: 4,
      taskDate: yesterday,
      startTime: new Date(yesterday.setHours(8, 0, 0, 0)),
      endTime: new Date(yesterday.setHours(16, 0, 0, 0)),
      requiredWorkerCount: 20,
      status: "closed" as const,
      createdById: tlMercury.id,
      supervisorId: supMercury.id,
    },
    {
      taskNumber: "TSK-2024-0006",
      warehouseId: venusWH.id,
      clusterId: vnsA.id,
      clientId: clientMap["ELITE"].id,
      categoryId: importCat.id,
      subCategoryId: getSubCat(importCat.id, "Empty Return").id,
      equipmentTypeId: eq20ft.id,
      equipmentQuantity: 10,
      taskDate: tomorrow,
      startTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(18, 0, 0, 0)),
      requiredWorkerCount: 18,
      status: "scheduled" as const,
      createdById: tlVenus.id,
    },
    {
      taskNumber: "TSK-2024-0007",
      warehouseId: mercuryWH.id,
      clusterId: mrcC.id,
      clientId: clientMap["GVL"].id,
      categoryId: exportCat.id,
      subCategoryId: getSubCat(exportCat.id, "Local Export").id,
      equipmentTypeId: eq165.id,
      equipmentQuantity: 6,
      taskDate: today,
      startTime: new Date(today.setHours(11, 0, 0, 0)),
      endTime: new Date(today.setHours(19, 0, 0, 0)),
      requiredWorkerCount: 22,
      status: "in_progress" as const,
      createdById: tlMercury.id,
      supervisorId: supMercury.id,
    },
    {
      taskNumber: "TSK-2024-0008",
      warehouseId: venusWH.id,
      clusterId: vnsB.id,
      clientId: clientMap["DLL"].id,
      categoryId: domesticCat.id,
      subCategoryId: getSubCat(domesticCat.id, "Warehouse Delivery").id,
      equipmentTypeId: eqCBM.id,
      equipmentQuantity: 85,
      taskDate: yesterday,
      startTime: new Date(yesterday.setHours(7, 0, 0, 0)),
      endTime: new Date(yesterday.setHours(15, 0, 0, 0)),
      requiredWorkerCount: 12,
      status: "verified" as const,
      createdById: tlVenus.id,
      supervisorId: supVenus.id,
    },
  ];

  for (const taskSeed of taskSeeds) {
    await prisma.task.upsert({
      where: { taskNumber: taskSeed.taskNumber },
      update: {},
      create: taskSeed,
    });
  }
  console.log("  ✓ Created 8 sample tasks in various statuses");

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n✅ Seed completed successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 DEMO LOGIN CREDENTIALS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Password for all accounts: Demo@1234\n");
  userSeeds.forEach((u) => {
    console.log(`  ${u.role.padEnd(18)} | ${u.email}`);
  });
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
