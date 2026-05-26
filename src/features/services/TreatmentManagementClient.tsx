"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Archive,
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { useActionState, useMemo, useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
  archiveServiceAction,
  bulkUpdateServicesAction,
  duplicateServiceAction,
  restoreServiceAction,
  saveServiceAction,
} from "@/features/admin/actions";
import type {
  Branch,
  InventoryItem,
  ServiceWithRelations,
} from "@/lib/database.types";
import { serviceSchema } from "@/lib/validators/clinic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type ServiceFormInput = z.input<typeof serviceSchema>;
type ServiceFormOutput = z.output<typeof serviceSchema>;

type Props = {
  services: ServiceWithRelations[];
  branches: Branch[];
  inventoryItems: InventoryItem[];
};

const pageSize = 8;

function peso(value: number | null | undefined) {
  return `PHP ${Number(value ?? 0).toLocaleString()}`;
}

function branchNames(service: ServiceWithRelations, branches: Branch[]) {
  const ids = new Set(
    (service.service_branch_settings ?? [])
      .filter((setting) => setting.is_available)
      .map((setting) => setting.branch_id)
  );
  return branches.filter((branch) => ids.has(branch.id)).map((branch) => branch.name);
}

function defaultValues(service?: ServiceWithRelations | null): ServiceFormInput {
  return {
    id: service?.id,
    name: service?.name ?? "",
    slug: service?.slug ?? "",
    description: service?.description ?? "",
    category: service?.category ?? "",
    duration_mins: service?.duration_mins ?? 30,
    base_price: service?.base_price ?? 0,
    price_min: service?.price_min ?? "",
    price_max: service?.price_max ?? "",
    image_url: service?.image_url ?? "",
    icon: service?.icon ?? "",
    color_tag: service?.color_tag ?? "",
    is_active: service?.is_active ?? true,
    is_featured: service?.is_featured ?? false,
    is_popular: service?.is_popular ?? false,
    requires_followup: service?.requires_followup ?? false,
    preparation_notes: service?.preparation_notes ?? "",
    recovery_notes: service?.recovery_notes ?? "",
    notes: service?.notes ?? "",
  };
}

export function TreatmentManagementClient({
  services,
  branches,
  inventoryItems,
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [branch, setBranch] = useState("all");
  const [sort, setSort] = useState<"name" | "category" | "price" | "duration">("name");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<ServiceWithRelations | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const categories = useMemo(
    () => Array.from(new Set(services.map((service) => service.category))).sort(),
    [services]
  );

  const filtered = useMemo(() => {
    const text = query.toLowerCase().trim();
    return services
      .filter((service) => {
        const matchesText =
          !text ||
          service.name.toLowerCase().includes(text) ||
          service.description?.toLowerCase().includes(text) ||
          service.slug.toLowerCase().includes(text);
        const matchesCategory = category === "all" || service.category === category;
        const matchesStatus =
          status === "all" ||
          (status === "active" && service.is_active && !service.archived_at) ||
          (status === "inactive" && !service.is_active && !service.archived_at) ||
          (status === "archived" && Boolean(service.archived_at));
        const matchesBranch =
          branch === "all" ||
          (service.service_branch_settings ?? []).some(
            (setting) => setting.branch_id === branch && setting.is_available
          );
        return matchesText && matchesCategory && matchesStatus && matchesBranch;
      })
      .sort((a, b) => {
        if (sort === "price") return Number(a.base_price) - Number(b.base_price);
        if (sort === "duration") return a.duration_mins - b.duration_mins;
        return String(a[sort]).localeCompare(String(b[sort]));
      });
  }, [branch, category, query, services, sort, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function openForm(service?: ServiceWithRelations) {
    setEditing(service ?? null);
    setDialogOpen(true);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Treatment Management</h1>
          <p className="text-sm text-slate-500">
            Admin-controlled dental services, pricing, branches, and inventory links.
          </p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="h-4 w-4" />
          Add treatment
        </Button>
      </div>

      <section className="rounded-lg border bg-white shadow-sm">
        <div className="grid gap-3 border-b p-4 lg:grid-cols-[1fr_repeat(4,180px)]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="pl-9"
              placeholder="Search treatments"
            />
          </label>
          <select className="rounded-lg border px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select className="rounded-lg border px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <select className="rounded-lg border px-3 text-sm" value={branch} onChange={(event) => setBranch(event.target.value)}>
            <option value="all">All branches</option>
            {branches.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <select className="rounded-lg border px-3 text-sm" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
            <option value="name">Sort by name</option>
            <option value="category">Sort by category</option>
            <option value="price">Sort by price</option>
            <option value="duration">Sort by duration</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <p className="text-sm text-slate-500">
            {filtered.length} treatments found. {selectedIds.length} selected.
          </p>
          <div className="flex gap-2">
            <BulkButton ids={selectedIds} isActive={true} label="Bulk activate" />
            <BulkButton ids={selectedIds} isActive={false} label="Bulk deactivate" />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <span className="sr-only">Select</span>
              </TableHead>
              <TableHead>Treatment</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Branches</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((service) => {
              const names = branchNames(service, branches);
              return (
                <TableRow key={service.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(service.id)}
                      onChange={() => toggleSelected(service.id)}
                      aria-label={`Select ${service.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-slate-50 text-xs font-semibold text-sky-700">
                        {service.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={service.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          service.icon || service.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{service.name}</p>
                        <p className="max-w-xs truncate text-xs text-slate-500">{service.description}</p>
                        <div className="mt-1 flex gap-1">
                          {service.is_popular ? <Badge tone="amber">Popular</Badge> : null}
                          {service.is_featured ? <Badge tone="sky">Featured</Badge> : null}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{service.category}</TableCell>
                  <TableCell>{peso(service.base_price)}</TableCell>
                  <TableCell>{service.duration_mins} mins</TableCell>
                  <TableCell>
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {names.length ? names.map((name) => <Badge key={name}>{name}</Badge>) : <Badge tone="slate">No branches</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {service.archived_at ? (
                      <Badge tone="slate">Archived</Badge>
                    ) : service.is_active ? (
                      <Badge tone="emerald">Active</Badge>
                    ) : (
                      <Badge tone="rose">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${service.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openForm(service)}>
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <ActionMenuItem action={duplicateServiceAction} id={service.id}>
                          <Copy className="h-4 w-4" /> Duplicate
                        </ActionMenuItem>
                        {service.archived_at ? (
                          <ActionMenuItem action={restoreServiceAction} id={service.id}>
                            <RotateCcw className="h-4 w-4" /> Restore
                          </ActionMenuItem>
                        ) : (
                          <ActionMenuItem action={archiveServiceAction} id={service.id} destructive>
                            <Archive className="h-4 w-4" /> Archive
                          </ActionMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t p-4">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            Previous
          </Button>
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
            Next
          </Button>
        </div>
      </section>

      <ServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editing}
        branches={branches}
        inventoryItems={inventoryItems}
      />
    </div>
  );
}

function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "sky" | "emerald" | "rose" | "amber";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function BulkButton({
  ids,
  isActive,
  label,
}: {
  ids: string[];
  isActive: boolean;
  label: string;
}) {
  return (
    <form action={bulkUpdateServicesAction}>
      {ids.map((id) => (
        <input key={id} type="hidden" name="ids" value={id} />
      ))}
      <input type="hidden" name="is_active" value={String(isActive)} />
      <Button variant="outline" disabled={!ids.length}>
        {label}
      </Button>
    </form>
  );
}

function ActionMenuItem({
  action,
  id,
  children,
  destructive = false,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  children: ReactNode;
  destructive?: boolean;
}) {
  return (
    <DropdownMenuItem asChild variant={destructive ? "destructive" : "default"}>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <button className="flex w-full items-center gap-2 px-1.5 py-1 text-left text-sm">
          {children}
        </button>
      </form>
    </DropdownMenuItem>
  );
}

function ServiceDialog({
  open,
  onOpenChange,
  service,
  branches,
  inventoryItems,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceWithRelations | null;
  branches: Branch[];
  inventoryItems: InventoryItem[];
}) {
  const [, startTransition] = useTransition();
  const [state, formAction] = useActionState(saveServiceAction, { success: "" });
  const form = useForm<ServiceFormInput, unknown, ServiceFormOutput>({
    resolver: zodResolver(serviceSchema),
    values: defaultValues(service),
  });
  const selectedBranchIds = new Set(
    (service?.service_branch_settings ?? []).map((setting) => setting.branch_id)
  );
  const selectedInventoryIds = new Set(
    (service?.service_inventory_items ?? []).map((item) => item.inventory_item_id)
  );

  function branchSetting(branchId: string) {
    return service?.service_branch_settings?.find((setting) => setting.branch_id === branchId);
  }

  function inventorySetting(itemId: string) {
    return service?.service_inventory_items?.find((item) => item.inventory_item_id === itemId);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{service ? "Edit treatment" : "Add treatment"}</DialogTitle>
          <DialogDescription>
            Configure the service catalog entry patients and staff will see.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            const formElement = event.currentTarget;
            void form.handleSubmit(() => {
              startTransition(() => {
                formAction(new FormData(formElement));
              });
            })(event);
          }}
        >
          {service?.id ? <input type="hidden" value={service.id} {...form.register("id")} /> : null}
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Treatment name" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} placeholder="Oral Prophylaxis" />
            </Field>
            <Field label="Slug" error={form.formState.errors.slug?.message}>
              <Input {...form.register("slug")} placeholder="oral-prophylaxis" />
            </Field>
            <Field label="Category" error={form.formState.errors.category?.message}>
              <Input {...form.register("category")} placeholder="Preventive Care" />
            </Field>
            <Field label="Duration in minutes" error={form.formState.errors.duration_mins?.message}>
              <Input type="number" min="1" {...form.register("duration_mins")} />
            </Field>
            <Field label="Base price" error={form.formState.errors.base_price?.message}>
              <Input type="number" min="0" step="0.01" {...form.register("base_price")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price min" error={form.formState.errors.price_min?.message}>
                <Input type="number" min="0" step="0.01" {...form.register("price_min")} />
              </Field>
              <Field label="Price max" error={form.formState.errors.price_max?.message}>
                <Input type="number" min="0" step="0.01" {...form.register("price_max")} />
              </Field>
            </div>
            <Field label="Icon">
              <Input {...form.register("icon")} placeholder="sparkles" />
            </Field>
            <Field label="Color tag">
              <Input type="color" {...form.register("color_tag")} />
            </Field>
          </div>
          <Field label="Short description" error={form.formState.errors.description?.message}>
            <Textarea {...form.register("description")} rows={3} />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Image URL">
              <Input {...form.register("image_url")} placeholder="https://..." />
            </Field>
            <Field label="Upload image/icon">
              <Input name="image_file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" />
            </Field>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Checkbox label="Active" {...form.register("is_active")} />
            <Checkbox label="Popular" {...form.register("is_popular")} />
            <Checkbox label="Featured" {...form.register("is_featured")} />
            <Checkbox label="Requires follow-up" {...form.register("requires_followup")} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Preparation instructions">
              <Textarea {...form.register("preparation_notes")} rows={3} />
            </Field>
            <Field label="Recovery notes">
              <Textarea {...form.register("recovery_notes")} rows={3} />
            </Field>
            <Field label="Notes/instructions">
              <Textarea {...form.register("notes")} rows={3} />
            </Field>
          </div>
          <section className="rounded-lg border p-4">
            <h3 className="font-semibold text-slate-900">Available branches</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {branches.map((branch) => {
                const setting = branchSetting(branch.id);
                return (
                  <div key={branch.id} className="rounded-lg border p-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input name="branch_ids" type="checkbox" value={branch.id} defaultChecked={selectedBranchIds.has(branch.id)} />
                      {branch.name}
                    </label>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Input name={`branch_price_${branch.id}`} type="number" min="0" step="0.01" placeholder="Price override" defaultValue={setting?.price_override ?? ""} />
                      <Input name={`branch_duration_${branch.id}`} type="number" min="1" placeholder="Duration override" defaultValue={setting?.duration_override_mins ?? ""} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="rounded-lg border p-4">
            <h3 className="font-semibold text-slate-900">Recommended inventory items</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {inventoryItems.map((item) => {
                const setting = inventorySetting(item.id);
                return (
                  <div key={item.id} className="rounded-lg border p-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input name="inventory_item_ids" type="checkbox" value={item.id} defaultChecked={selectedInventoryIds.has(item.id)} />
                      {item.name}
                    </label>
                    <Input className="mt-3" name={`inventory_quantity_${item.id}`} type="number" min="0" step="0.01" placeholder={`Quantity used (${item.unit})`} defaultValue={setting?.quantity_used ?? ""} />
                  </div>
                );
              })}
            </div>
          </section>
          {state?.error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}
          {state?.success ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{state.success}</p> : null}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save treatment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function Checkbox({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium text-slate-700">
      <input type="checkbox" {...props} />
      {label}
    </label>
  );
}
