"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTRPC } from "@/src/lib/trpc/client";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";
import { useQuery } from "@tanstack/react-query";
import { type Members } from "@/src/lib/trpc/types";

const inviteSchema = z.object({
  email: z.email("Invalid email address"),
  role: z.enum(["owner", "admin", "member"]),
});

type InviteForm = z.infer<typeof inviteSchema>;
type Member = RouterOutputs["users"]["list"][number];

interface MembersTabProps {
  workspaceId: string;
  initialMembers: Members;
}

export function MembersTab({ workspaceId, initialMembers }: MembersTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    membershipId: string;
    name: string;
  } | null>(null);

  const { data: members = [] } = useQuery({
    ...trpc.users.list.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
    initialData: initialMembers,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: "member",
    },
  });

  const inviteMutation = useMutation(
    trpc.users.invite.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.users.list.queryFilter({ workspaceId }));
        toast({
          title: "Member invited",
          description: "The team member has been added.",
        });
        setInviteDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message ?? "Failed to invite member",
          variant: "destructive",
        });
      },
    })
  );

  const removeMutation = useMutation(
    trpc.users.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.users.list.queryFilter({ workspaceId }));
        toast({
          title: "Member removed",
          description: "The team member has been removed.",
        });
        setMemberToRemove(null);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message ?? "Failed to remove member",
          variant: "destructive",
        });
      },
    })
  );

  const onSubmit = (data: InviteForm) => {
    inviteMutation.mutate({
      workspaceId,
      email: data.email,
      role: data.role,
    });
  };

  const role = watch("role");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">
            {members.length} member{members.length === 1 ? "" : "s"} in your workspace
          </p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Role
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member: Member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white">
                        {getInitials(member.name ?? "U")}
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {member.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{member.email}</td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        member.role === "owner"
                          ? "default"
                          : member.role === "admin"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {member.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setMemberToRemove({
                          membershipId: member.membershipId,
                          name: member.name ?? "this member",
                        })
                      }
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="text-sm font-semibold text-blue-900">About Roles</h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="font-medium">Owner:</span>
            <span>Full access to all features including deleting the workspace</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">Admin:</span>
            <span>Full access to features, settings and billing</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">Member:</span>
            <span>Can view and manage competitors, changes, and recommendations</span>
          </li>
        </ul>
      </div>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your workspace. They&apos;ll receive access immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) =>
                  setValue("role", value as "owner" | "admin" | "member")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInviteDialogOpen(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? "Inviting..." : "Send Invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {memberToRemove?.name}? They will lose
              access to the workspace immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                memberToRemove &&
                removeMutation.mutate({
                  workspaceId,
                  membershipId: memberToRemove.membershipId,
                })
              }
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
