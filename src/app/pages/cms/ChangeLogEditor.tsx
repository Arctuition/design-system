import React, { useState } from "react";
import { Navigate, Link } from "react-router";
import { useAppData } from "../../store/data-store";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import type { ChangeLogEntry } from "../../store/data-store";

export function ChangeLogEditor() {
  const { isAuthenticated, changeLogs, addChangeLog, updateChangeLog, removeChangeLog } = useAppData();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Omit<ChangeLogEntry, "id">>({ date: "", version: "", title: "", description: "" });

  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  const startAdd = () => {
    setAdding(true);
    setEditing(null);
    setForm({ date: new Date().toISOString().split("T")[0], version: "", title: "", description: "" });
  };

  const startEdit = (entry: ChangeLogEntry) => {
    setEditing(entry.id);
    setAdding(false);
    setForm({ date: entry.date, version: entry.version, title: entry.title, description: entry.description });
  };

  const saveNew = () => {
    if (!form.version || !form.title) { toast.error("Version and title required"); return; }
    addChangeLog(form);
    setAdding(false);
    toast.success("Entry added");
  };

  const saveEdit = () => {
    if (!editing) return;
    updateChangeLog(editing, form);
    setEditing(null);
    toast.success("Entry updated");
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this entry?")) {
      removeChangeLog(id);
      toast.success("Entry deleted");
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-8 py-10">
      <Link to="/cms" className="flex items-center gap-1.5 text-primary mb-6 hover:underline" style={{ fontSize: "var(--text-label)" }}>
        <ArrowLeft className="size-4" /> Back to CMS
      </Link>
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
          Change Log
        </h1>
        <Button onClick={startAdd}><Plus className="size-4 mr-1" /> Add Entry</Button>
      </div>
      <div className="h-px bg-border mt-3 mb-6" />

      {/* Add form */}
      {adding && (
        <div className="border border-primary rounded-[var(--radius-card)] p-4 mb-6 bg-primary/5">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Input placeholder="Version (e.g. 1.2.0)" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mb-3" />
          <div className="flex gap-2">
            <Button onClick={saveNew}><Save className="size-4 mr-1" /> Save</Button>
            <Button variant="ghost" onClick={() => setAdding(false)}><X className="size-4 mr-1" /> Cancel</Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {changeLogs.map((entry) => (
          <div key={entry.id} className="border border-border rounded-[var(--radius-card)] p-4">
            {editing === entry.id ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mb-3" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit}><Save className="size-3.5 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              </>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-[var(--radius)]" style={{ fontSize: "var(--text-label)" }}>
                      {entry.version}
                    </span>
                    <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                      {entry.date}
                    </span>
                  </div>
                  <p className="mt-1 text-foreground" style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
                    {entry.title}
                  </p>
                  <p className="mt-0.5 text-card-foreground" style={{ fontSize: "var(--text-label)" }}>
                    {entry.description}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0 ml-4">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => startEdit(entry)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDelete(entry.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}