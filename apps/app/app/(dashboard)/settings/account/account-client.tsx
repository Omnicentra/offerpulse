"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTRPC } from "@/src/lib/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { authClient } from "@/src/server/auth/client";
import { Loader2 } from "lucide-react";

interface AccountClientProps {
  embedded?: boolean;
}

export function AccountClient({ embedded = false }: AccountClientProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { data: profile } = useQuery({
    ...trpc.users.getProfile.queryOptions(),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setImageUrl(profile.image ?? "");
  }, [profile]);

  const updateProfileMutation = useMutation(
    trpc.users.updateProfile.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.users.getProfile.queryFilter());
        toast({
          title: "Profile updated",
          description: "Your profile information has been saved.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message ?? "Failed to update profile",
          variant: "destructive",
        });
      },
    })
  );

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name: name.trim() || undefined,
      image: imageUrl.trim() || null,
    });
  };

  const handlePasswordSubmit = async () => {
    if (!profile) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    if (profile.hasPassword && !currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      if (profile.hasPassword) {
        const { error } = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: false,
        });

        if (error) {
          toast({
            title: "Error",
            description: error.message ?? "Failed to change password",
            variant: "destructive",
          });
          return;
        }
      } else {
        const res = await fetch("/api/auth/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }),
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) {
          toast({
            title: "Error",
            description: data.error ?? "Failed to set password",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: profile.hasPassword ? "Password changed" : "Password set",
        description:
          profile.hasPassword
            ? "Your password has been updated successfully."
            : "You can now sign in with your email and password.",
      });

      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries(trpc.users.getProfile.queryFilter());
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const hasProfileChanges =
    profile != null &&
    (name.trim() !== (profile.name ?? "") ||
      imageUrl.trim() !== (profile.image ?? ""));

  if (!profile) {
    return (
      <div className={embedded ? "space-y-8" : "mx-auto max-w-4xl space-y-8"}>
        {!embedded && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your personal account information
            </p>
          </div>
        )}
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-8" : "mx-auto max-w-4xl space-y-8"}>
      {!embedded && (
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your personal account information
          </p>
        </div>
      )}

      {/* Profile Information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Profile Information</h2>

        <div className="space-y-6">
          {/* Avatar */}
          <div>
            <Label className="mb-3 block">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={imageUrl || undefined} alt={name || "User"} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="max-w-md"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Enter a URL to an image or leave empty to use initials
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="mb-3 block">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <Label htmlFor="email" className="mb-3 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="max-w-md bg-slate-50 text-slate-600"
            />
            <p className="mt-2 text-xs text-slate-500">
              Contact support to change your email address
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setName(profile.name ?? "");
              setImageUrl(profile.image ?? "");
            }}
            disabled={!hasProfileChanges}
          >
            Reset
          </Button>
          <Button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending || !hasProfileChanges}
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Security</h2>

        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Password</h3>
            <p className="mt-1 text-sm text-slate-600">
              {profile.hasPassword
                ? "Update your password to keep your account secure"
                : "You signed in with a social account. Set a password to also sign in with email."}
            </p>
          </div>
          <Button onClick={() => setPasswordDialogOpen(true)}>
            {profile.hasPassword ? "Change Password" : "Set Password"}
          </Button>
        </div>
      </div>

      {/* Password Dialog (Change or Set) */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {profile.hasPassword ? "Change Password" : "Set Password"}
            </DialogTitle>
            <DialogDescription>
              {profile.hasPassword
                ? "Enter your current password and choose a new password (minimum 8 characters)"
                : "Choose a password to sign in with email (minimum 8 characters)"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {profile.hasPassword && (
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={passwordLoading}
                />
              </div>
            )}
            <div>
              <Label htmlFor="new-password">
                {profile.hasPassword ? "New Password" : "Password"}
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={passwordLoading}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={passwordLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              disabled={passwordLoading}
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit} disabled={passwordLoading}>
              {passwordLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : profile.hasPassword ? (
                "Update Password"
              ) : (
                "Set Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
