import React, { useState } from "react";
import { Navigate, Link } from "react-router";
import { useAppData } from "../../store/data-store";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { ArrowLeft, Plus, Pencil, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function PatternsEditor() {
  const {
    isAuthenticated, patterns,
    addPattern, softDeletePattern, restorePattern, permanentDeletePattern,
  } = useAppData();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  const activePatterns = patterns.filter((p) => !p.deleted);
  const deletedPatterns = patterns.filter((p) => p.deleted);

  const startCreate = () => {
    setCreating(true);
    setTitle("");
  };

  const saveCreate = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    addPattern({ title, content: "<h2>New Section</h2><p>Start writing your pattern documentation here...</p>" });
    setCreating(false);
    toast.success("Pattern created. Click Edit to add content.");
  };

  return (
    <div className="max-w-[900px] mx-auto px-8 py-10">
      <Link to="/cms" className="flex items-center gap-1.5 text-primary mb-6 hover:underline" style={{ fontSize: "var(--text-label)" }}>
        <ArrowLeft className="size-4" /> Back to CMS
      </Link>
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
          Patterns Manager
        </h1>
        <Button onClick={startCreate}><Plus className="size-4 mr-1" /> New Pattern</Button>
      </div>
      <div className="h-px bg-border mt-3 mb-6" />

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activePatterns.length})</TabsTrigger>
          <TabsTrigger value="deleted">
            Deleted ({deletedPatterns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {/* Create form */}
          {creating && (
            <div className="border border-primary rounded-[var(--radius-card)] p-5 mb-6 bg-primary/5">
              <h3 className="mb-4" style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
                Create New Pattern
              </h3>
              <Input placeholder="Pattern title" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-4" />
              <div className="flex gap-2">
                <Button onClick={saveCreate}>Create</Button>
                <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Pattern list */}
          <div className="space-y-3">
            {activePatterns.map((pattern) => (
              <div key={pattern.id} className="flex items-center gap-4 p-4 border border-border rounded-[var(--radius-card)]">
                <div className="flex-1 min-w-0">
                  <p className="text-foreground" style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>{pattern.title}</p>
                  <p className="text-muted-foreground mt-0.5" style={{ fontSize: "var(--text-label)" }}>
                    Updated: {pattern.updatedAt}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Link to={`/cms/patterns-editor/${pattern.id}/edit`}>
                    <Button variant="ghost" size="sm" className="gap-1.5" title="Edit">
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => { softDeletePattern(pattern.id); toast.success("Moved to recycle bin"); }} title="Delete">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deleted" className="mt-6">
          {deletedPatterns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" style={{ fontSize: "var(--text-p)" }}>
              Recycle bin is empty.
            </div>
          ) : (
            <div className="space-y-3">
              {deletedPatterns.map((pattern) => (
                <div key={pattern.id} className="flex items-center gap-4 p-4 border border-border rounded-[var(--radius-card)] opacity-70">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground" style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>{pattern.title}</p>
                    <p className="text-muted-foreground mt-0.5" style={{ fontSize: "var(--text-label)" }}>
                      Deleted: {pattern.deletedAt}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { restorePattern(pattern.id); toast.success("Pattern restored"); }}>
                      <RotateCcw className="size-3.5 mr-1" /> Restore
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
                      if (confirm("Permanently delete? This cannot be undone.")) {
                        permanentDeletePattern(pattern.id);
                        toast.success("Permanently deleted");
                      }
                    }}>
                      <AlertTriangle className="size-3.5 mr-1" /> Delete Forever
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}