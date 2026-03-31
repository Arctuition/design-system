import React, { useState } from "react";
import { Navigate, Link } from "react-router";
import { useAppData } from "../../store/data-store";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ArrowLeft, Plus, Trash2, User, Shield, Pencil, Save, X, Eye, EyeOff, Key, Copy } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "../../utils/clipboard";

function generateRandomPassword(length = 12): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;

  // Ensure at least one of each category
  let pw = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  for (let i = pw.length; i < length; i++) {
    pw.push(all[Math.floor(Math.random() * all.length)]);
  }
  // Shuffle
  for (let i = pw.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pw[i], pw[j]] = [pw[j], pw[i]];
  }
  return pw.join("");
}

export function AccountManager() {
  const { isAuthenticated, currentUser, editors, addUser, updateUser, removeUser } = useAppData();
  const [adding, setAdding] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"editor" | "admin">("editor");
  const [generatedPassword, setGeneratedPassword] = useState(() => generateRandomPassword());

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<"editor" | "admin">("editor");
  const [editPassword, setEditPassword] = useState("");
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);

  // Password change state
  const [changingPasswordId, setChangingPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  if (!isAuthenticated || currentUser?.role !== "admin") {
    return <Navigate to="/cms/login" replace />;
  }

  const handleAdd = () => {
    const normalizedUsername = username.trim();
    if (!normalizedUsername) { toast.error("Username is required"); return; }
    if (editors.some((e) => e.username.trim().toLowerCase() === normalizedUsername.toLowerCase())) {
      toast.error("Username already exists");
      return;
    }
    addUser({ username: normalizedUsername, password: generatedPassword, role });
    setAdding(false);
    setUsername("");
    setGeneratedPassword(generateRandomPassword());
    toast.success("Account created");
  };

  const startEdit = (editor: typeof editors[0]) => {
    setEditingId(editor.id);
    setEditRole(editor.role);
    setEditPassword(editor.password);
    setChangingPasswordId(null);
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateUser(editingId, { role: editRole });
    setEditingId(null);
    toast.success("Account updated");
  };

  const startPasswordChange = (editorId: string) => {
    setChangingPasswordId(editorId);
    setNewPassword("");
  };

  const savePasswordChange = (editorId: string) => {
    if (!newPassword.trim()) { toast.error("Password cannot be empty"); return; }
    updateUser(editorId, { password: newPassword });
    setChangingPasswordId(null);
    setNewPassword("");
    toast.success("Password updated");
  };

  const copyPassword = (pw: string) => {
    copyToClipboard(pw);
    toast.success("Password copied to clipboard");
  };

  const regeneratePassword = () => {
    setGeneratedPassword(generateRandomPassword());
  };

  return (
    <div className="max-w-[800px] mx-auto px-8 py-10">
      <Link to="/cms" className="flex items-center gap-1.5 text-primary mb-6 hover:underline" style={{ fontSize: "var(--text-label)" }}>
        <ArrowLeft className="size-4" /> Back to CMS
      </Link>
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
          Account Management
        </h1>
        <Button onClick={() => { setAdding(true); setGeneratedPassword(generateRandomPassword()); }}>
          <Plus className="size-4 mr-1" /> Add User
        </Button>
      </div>
      <div className="h-px bg-border mt-3 mb-6" />

      {/* Add form */}
      {adding && (
        <div className="border border-primary rounded-[var(--radius-card)] p-4 mb-6 bg-primary/5">
          <div className="space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block mb-1.5 text-card-foreground" style={{ fontSize: "var(--text-label)" }}>Username</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
              </div>
              <div className="w-[140px]">
                <label className="block mb-1.5 text-card-foreground" style={{ fontSize: "var(--text-label)" }}>Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "editor" | "admin")}
                  className="w-full h-9 px-3 border border-border rounded-[var(--radius)] bg-input-background text-foreground outline-none"
                  style={{ fontSize: "var(--text-input)" }}
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Generated password */}
            <div>
              <label className="block mb-1.5 text-card-foreground" style={{ fontSize: "var(--text-label)" }}>Generated Password</label>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 h-9 flex items-center px-3 border border-border rounded-[var(--radius)] bg-secondary text-foreground select-all"
                  style={{ fontSize: "var(--text-input)" }}
                >
                  {generatedPassword}
                </code>
                <Button variant="outline" size="icon" className="size-9 shrink-0" onClick={() => copyPassword(generatedPassword)} title="Copy password">
                  <Copy className="size-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="shrink-0" onClick={regeneratePassword} style={{ fontSize: "var(--text-label)" }}>
                  Regenerate
                </Button>
              </div>
              <p className="mt-1 text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                Share this password with the user. It can be changed later.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleAdd}>Create</Button>
              <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Editors list */}
      <div className="space-y-2">
        {editors.map((editor) => (
          <div key={editor.id} className="p-4 border border-border rounded-[var(--radius-card)]">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {editor.role === "admin" ? (
                  <Shield className="size-5 text-primary" />
                ) : (
                  <User className="size-5 text-primary" />
                )}
              </div>

              {editingId === editor.id ? (
                /* Editing mode */
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-3">
                    <p className="text-foreground" style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
                      {editor.username}
                    </p>
                    {editor.id === currentUser?.id && (
                      <span className="text-muted-foreground" style={{ fontSize: "11px" }}>(you)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-card-foreground shrink-0" style={{ fontSize: "var(--text-label)" }}>Role:</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as "editor" | "admin")}
                      className="h-8 px-3 border border-border rounded-[var(--radius)] bg-input-background text-foreground outline-none"
                      style={{ fontSize: "var(--text-input)" }}
                      disabled={editor.id === currentUser?.id}
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    {editor.id === currentUser?.id && (
                      <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                        Cannot change own role
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit}>
                      <Save className="size-3.5 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground" style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
                        {editor.username}
                      </p>
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-[var(--radius)]" style={{ fontSize: "11px" }}>
                        {editor.role}
                      </span>
                      {editor.id === currentUser?.id && (
                        <span className="text-muted-foreground" style={{ fontSize: "11px" }}>(you)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                        Password: {showPasswordFor === editor.id ? editor.password : "••••••••"}
                      </p>
                      <button
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPasswordFor(showPasswordFor === editor.id ? null : editor.id)}
                        title={showPasswordFor === editor.id ? "Hide password" : "Show password"}
                      >
                        {showPasswordFor === editor.id ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                      <button
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => copyPassword(editor.password)}
                        title="Copy password"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-muted-foreground mt-0.5" style={{ fontSize: "var(--text-label)" }}>
                      Created: {editor.createdAt}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => startEdit(editor)} title="Edit role">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => startPasswordChange(editor.id)} title="Change password">
                      <Key className="size-3.5" />
                    </Button>
                    {editor.id !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => {
                          if (confirm(`Remove ${editor.username}?`)) {
                            removeUser(editor.id);
                            toast.success("Account removed");
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Password change inline */}
            {changingPasswordId === editor.id && editingId !== editor.id && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <label className="block mb-1.5 text-card-foreground" style={{ fontSize: "var(--text-label)" }}>
                  New Password for {editor.username}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    style={{ fontSize: "var(--text-label)" }}
                  >
                    Generate
                  </Button>
                  <Button size="sm" onClick={() => savePasswordChange(editor.id)}>
                    <Save className="size-3.5 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setChangingPasswordId(null)}>
                    <X className="size-3.5" />
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
