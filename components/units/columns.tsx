"use client";

import { ColumnDef } from "@tanstack/react-table";

export type UnitRow = {
  id: string;
  code: string | null;
  name: string;
  shortcut?: string | null;
  qdecimals?: number | null;
  softoneCode?: string | null;
};

export const columns: ColumnDef<UnitRow>[] = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "shortcut", header: "Shortcut" },
  { accessorKey: "qdecimals", header: "Q Decimals" },
  { accessorKey: "softoneCode", header: "SoftOne" },
];





