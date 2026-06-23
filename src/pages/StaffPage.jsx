import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { UserCog, PlusCircle, Search, Mail, Phone, Briefcase, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

const ROLES = ["manager", "agent", "mechanic", "admin", "driver", "user"];

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviteStatus, setInviteStatus] = useState(null); // null | 'loading' | 'success' | 'error'

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteStatus("loading");
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      setInviteStatus("success");
      setInviteEmail("");
    } catch (err) {
      setInviteStatus("error");
    }
  };

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.Staff.list("-created_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Staff.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Staff.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff"] }); setEditStaff(null); },
  });

  const filtered = staff.filter((s) =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-0">
        <PageHeader
          title="Staff"
          subtitle={`${staff.length} team members`}
          action={() => setShowForm(true)}
          actionLabel="Add Staff"
          actionIcon={PlusCircle}
        />
        <Button variant="outline" className="gap-2 shrink-0" onClick={() => { setShowInvite(true); setInviteStatus(null); }}>
          <UserPlus className="w-4 h-4" /> Invite User
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={UserCog} title="No staff" description="Add your team members" actionLabel="Add Staff" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setEditStaff(s)}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">
                  {s.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s.role}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /><span className="truncate">{s.email}</span></div>
                {s.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{s.phone}</span></div>}
                <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /><span>{s.rentals_handled || 0} rentals handled</span></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Invite User Dialog */}
      <Dialog open={showInvite} onOpenChange={(o) => { setShowInvite(o); setInviteStatus(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          {inviteStatus === "success" ? (
            <div className="py-4 text-center">
              <p className="text-sm text-green-600 font-medium">Invite sent to {inviteEmail || "user"}!</p>
              <p className="text-xs text-muted-foreground mt-1">They'll receive an email to set up their account.</p>
              <Button className="mt-4 w-full" variant="outline" onClick={() => { setInviteStatus(null); setInviteEmail(""); }}>Invite Another</Button>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <Label>Email Address *</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" required />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {inviteStatus === "error" && <p className="text-xs text-destructive">Failed to send invite. Please try again.</p>}
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={inviteStatus === "loading"}>
                {inviteStatus === "loading" ? "Sending..." : "Send Invite"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <StaffDialog
        open={showForm || !!editStaff}
        onClose={() => { setShowForm(false); setEditStaff(null); }}
        staffMember={editStaff}
        onSave={(data) => {
          if (editStaff) updateMutation.mutate({ id: editStaff.id, data });
          else createMutation.mutate(data);
        }}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function StaffDialog({ open, onClose, staffMember, onSave, isSaving }) {
  const [form, setForm] = React.useState({
    name: "", role: "agent", email: "", phone: "", hire_date: "", status: "active", notes: "",
  });

  React.useEffect(() => {
    if (staffMember) {
      setForm({
        name: staffMember.name || "", role: staffMember.role || "agent", email: staffMember.email || "",
        phone: staffMember.phone || "", hire_date: staffMember.hire_date || "", status: staffMember.status || "active",
        notes: staffMember.notes || "",
      });
    } else {
      setForm({ name: "", role: "agent", email: "", phone: "", hire_date: "", status: "active", notes: "" });
    }
  }, [staffMember, open]);

  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{staffMember ? "Edit Staff" : "Add Staff"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Full Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div>
            <Label>Role *</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Hire Date</Label><Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} /></div>
          {staffMember && (
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSaving}>
            {isSaving ? "Saving..." : staffMember ? "Update Staff" : "Add Staff"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}