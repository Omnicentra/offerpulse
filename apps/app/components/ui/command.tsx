"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-slate-950",
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

interface CommandDialogProps extends React.ComponentProps<typeof Dialog> {
  /** Merged onto `DialogContent` (padding, max-width, position, etc.). */
  dialogContentClassName?: string;
  /** Extra props for `DialogContent` (e.g. `onOpenAutoFocus`). */
  dialogContentProps?: Omit<React.ComponentPropsWithoutRef<typeof DialogContent>, "children">;
  showClose?: boolean;
  /** Screen-reader title (visible heading is usually the command input). */
  ariaTitle?: string;
  ariaDescription?: string;
  /** Rendered after `<Command />` inside `DialogContent` (e.g. shortcut hints). */
  footer?: React.ReactNode;
  /** Passed through to the root `cmdk` `Command` (e.g. `shouldFilter={false}`). */
  commandProps?: React.ComponentPropsWithoutRef<typeof CommandPrimitive>;
}

const CommandDialog = ({
  children,
  dialogContentClassName,
  dialogContentProps,
  showClose = true,
  ariaTitle = "Command menu",
  ariaDescription = "Search or select a command to run.",
  footer,
  commandProps,
  ...dialogProps
}: CommandDialogProps) => {
  const { className: contentClassFromProps, ...restContentProps } = dialogContentProps ?? {};
  return (
    <Dialog {...dialogProps}>
      <DialogContent
        showClose={showClose}
        {...restContentProps}
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0 shadow-lg",
          dialogContentClassName,
          contentClassFromProps
        )}
      >
        <DialogTitle className="sr-only">{ariaTitle}</DialogTitle>
        <DialogDescription className="sr-only">{ariaDescription}</DialogDescription>
        <Command
          {...commandProps}
          className={cn(
            "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500",
            "[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2",
            "[&_[cmdk-input-wrapper]_svg]:h-4 [&_[cmdk-input-wrapper]_svg]:w-4",
            "[&_[cmdk-input]]:h-10 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4",
            "min-h-0 flex-1 rounded-none border-0 bg-transparent shadow-none",
            commandProps?.className
          )}
        >
          {children}
        </Command>
        {footer}
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-2" cmdk-input-wrapper="">
    <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md bg-transparent text-base outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[min(55vh,420px)] min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-2", className)}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty ref={ref} className={cn("py-8 text-center text-sm text-slate-500", className)} {...props} />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-0 text-slate-950 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-slate-400",
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn("-mx-1 h-px bg-slate-200", className)} {...props} />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-start gap-3 rounded-lg px-3 py-2.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900 aria-selected:bg-slate-100 data-[disabled=true]:opacity-50 [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

function CommandShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ml-auto text-xs tracking-widest text-slate-500", className)} {...props} />;
}
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
