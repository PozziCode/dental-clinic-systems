import { TreatmentManagementClient } from "@/features/services/TreatmentManagementClient";
import { getBranches, getInventoryItems, getServices } from "@/lib/database/queries";

export default async function AdminTreatmentsPage() {
  const [services, branches, inventoryItems] = await Promise.all([
    getServices({ includeArchived: true }),
    getBranches(),
    getInventoryItems(),
  ]);

  return (
    <TreatmentManagementClient
      services={services}
      branches={branches}
      inventoryItems={inventoryItems}
    />
  );
}
