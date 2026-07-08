import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";

export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data: columns, error: colError } = await supabaseAdmin
    .from("timetable_columns")
    .select("id, label, sort_order")
    .eq("user_id", uid)
    .order("sort_order", { ascending: true });
  if (colError) return NextResponse.json({ error: colError.message }, { status: 500 });

  const { data: cells, error: cellError } = await supabaseAdmin
    .from("timetable_cells")
    .select("column_id, day_of_week, content")
    .eq("user_id", uid);
  if (cellError) return NextResponse.json({ error: cellError.message }, { status: 500 });

  return NextResponse.json({ columns: columns || [], cells: cells || [] });
}

// Full replace: the whole timetable is saved in one shot from the editor,
// so the simplest correct behavior is to drop the user's existing columns
// (cells cascade with them) and reinsert whatever the client sent.
export async function POST(request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { columns, cells } = await request.json();
  if (!Array.isArray(columns) || !Array.isArray(cells)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const cleanColumns = columns
    .map((c, index) => ({ label: (c.label || "").trim(), sort_order: index }))
    .filter((c) => c.label);

  const { error: deleteError } = await supabaseAdmin
    .from("timetable_columns")
    .delete()
    .eq("user_id", uid);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (cleanColumns.length === 0) {
    return NextResponse.json({ columns: [], cells: [] });
  }

  const { data: insertedColumns, error: insertColError } = await supabaseAdmin
    .from("timetable_columns")
    .insert(cleanColumns.map((c) => ({ ...c, user_id: uid })))
    .select("id, label, sort_order")
    .order("sort_order", { ascending: true });
  if (insertColError) return NextResponse.json({ error: insertColError.message }, { status: 500 });

  const cellsToInsert = cells
    .filter((cell) => typeof cell.content === "string" && cell.content.trim())
    .filter((cell) => insertedColumns[cell.colIndex])
    .map((cell) => ({
      user_id: uid,
      column_id: insertedColumns[cell.colIndex].id,
      day_of_week: cell.day,
      content: cell.content.trim(),
    }));

  if (cellsToInsert.length > 0) {
    const { error: insertCellError } = await supabaseAdmin
      .from("timetable_cells")
      .insert(cellsToInsert);
    if (insertCellError) {
      return NextResponse.json({ error: insertCellError.message }, { status: 500 });
    }
  }

  const { data: savedCells } = await supabaseAdmin
    .from("timetable_cells")
    .select("column_id, day_of_week, content")
    .eq("user_id", uid);

  return NextResponse.json({ columns: insertedColumns, cells: savedCells || [] });
}
