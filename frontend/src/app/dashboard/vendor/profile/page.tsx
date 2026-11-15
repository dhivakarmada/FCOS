'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Users, 
  Plus, 
  Mail, 
  ShieldAlert, 
  CheckCircle2, 
  Key, 
  Settings, 
  UserPlus, 
  UserMinus, 
  Shield,
  Fingerprint
} from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Vendor Admin' | 'Inventory Manager' | 'Finance Manager' | 'Operations Analyst';
  scopes: string[];
  status: 'active' | 'invited' | 'suspended';
}

const initialTeam: TeamMember[] = [
  { id: 'usr-1', name: 'Alice Smith', email: 'alice@d2cbrand.com', role: 'Vendor Admin', scopes: ['read:all', 'write:all', 'delete:all'], status: 'active' },
  { id: 'usr-2', name: 'John Doe', email: 'john@d2cbrand.com', role: 'Inventory Manager', scopes: ['read:inventory', 'write:inventory', 'read:warehouses'], status: 'active' },
  { id: 'usr-3', name: 'Bob Johnson', email: 'bob@d2cbrand.com', role: 'Finance Manager', scopes: ['read:billing', 'write:billing', 'read:reports'], status: 'active' },
];

export default function ProfilePage() {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  
  // Invite state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Vendor Admin' | 'Inventory Manager' | 'Finance Manager' | 'Operations Analyst'>('Inventory Manager');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      toast.error("Please fill in first name, last name, and invite email.");
      return;
    }

    const scopesMap: Record<string, string[]> = {
      'Vendor Admin': ['read:all', 'write:all', 'delete:all'],
      'Inventory Manager': ['read:inventory', 'write:inventory', 'read:warehouses'],
      'Finance Manager': ['read:billing', 'write:billing', 'read:reports'],
      'Operations Analyst': ['read:analytics', 'read:reports'],
    };

    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      role,
      scopes: scopesMap[role] || ['read:analytics'],
      status: 'invited'
    };

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Registering team seat invitation...',
        success: () => {
          setTeam([...team, newMember]);
          setFirstName('');
          setLastName('');
          setEmail('');
          setIsInviteOpen(false);
          return `Invitation dispatched to ${newMember.email}.`;
        },
        error: 'Failed to invite team member.',
      }
    );
  };

  const handleRevoke = (id: string, name: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: `Revoking ${name} access...`,
        success: () => {
          setTeam(prev => prev.filter(m => m.id !== id));
          return `${name}'s FCOS seat has been revoked.`;
        },
        error: 'Failed to revoke access.',
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground font-medium">Manage team sub-accounts, allocate operational roles, and audit access security scopes.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Invite dialog */}
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                <UserPlus className="h-4 w-4" /> Invite Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 rounded-3xl">
              <form onSubmit={handleInviteMember}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                    <Users className="w-5 h-5 text-primary" />
                    Invite Brand Staff
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Assign granular roles and permissions to coordinate inventory, billing, or shipping activities.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">First Name</span>
                      <Input 
                        placeholder="e.g. John" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-10 border-slate-850 bg-slate-950 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">Last Name</span>
                      <Input 
                        placeholder="e.g. Doe" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-10 border-slate-850 bg-slate-950 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">Email Address</span>
                    <Input 
                      type="email"
                      placeholder="e.g. john@d2cbrand.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 border-slate-850 bg-slate-950 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">Assigned Operational Role</span>
                    <Select value={role} onValueChange={(val: any) => setRole(val)}>
                      <SelectTrigger className="border-slate-850 bg-slate-950 text-xs rounded-xl h-10">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-850 text-slate-100">
                        <SelectItem value="Inventory Manager">Inventory Manager</SelectItem>
                        <SelectItem value="Finance Manager">Finance Manager</SelectItem>
                        <SelectItem value="Operations Analyst">Operations Analyst</SelectItem>
                        <SelectItem value="Vendor Admin">Vendor Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" className="rounded-xl border-slate-800 text-slate-300 hover:bg-slate-800" onClick={() => setIsInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl shadow-lg shadow-primary/20">
                    Send Invitation
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-350 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10 text-primary transition-all duration-500">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400">Total seat limit: 5</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  Active Team Members
                </p>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50">
                  {team.length} Members
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1">
                  {team.filter(m => m.status === 'active').length} Active, {team.filter(m => m.status === 'invited').length} Invited
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-350 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 transition-all duration-500">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-emerald-500">Strict mode active</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  Assigned Scope Rules
                </p>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50">
                  Granular RBAC
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1">
                  12 permission scopes verified
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-350 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 transition-all duration-500">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-full font-bold">Secure</Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  Team Authentication
                </p>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50">
                  2FA Mandated
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1">
                  Enforced on password changes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team registry table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Team Roster</CardTitle>
          <CardDescription className="text-xs">Roster registry tracking authorized sub-accounts and assigned security scope filters.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
              <TableRow className="border-slate-100 dark:border-slate-800">
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Name & Email</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Operational Role</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Verified Permission Scopes</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Status</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((member) => (
                <TableRow key={member.id} className="border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{member.name}</span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {member.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-350">{member.role}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {member.scopes.map(s => (
                        <Badge key={s} variant="outline" className="text-[8px] px-1 py-0 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-550 dark:text-slate-400 font-mono">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={
                      member.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[9px] rounded-full'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[9px] rounded-full'
                    }>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="xs" variant="outline" className="h-7 text-[10px] rounded-lg border-slate-200 dark:border-slate-800" onClick={() => toast.info(`Modifying scopes for ${member.name}`)}>
                        Edit Scopes
                      </Button>
                      {member.role !== 'Vendor Admin' && (
                        <Button size="xs" variant="ghost" className="h-7 text-[10px] rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20" onClick={() => handleRevoke(member.id, member.name)}>
                          <UserMinus className="w-3 h-3 mr-1" /> Revoke
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
