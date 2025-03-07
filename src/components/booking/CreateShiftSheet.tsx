
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CreateShiftForm } from "@/components/booking/CreateShiftForm";

interface CreateShiftSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateShiftSheet({ open, onOpenChange }: CreateShiftSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-gradient-to-br from-[#1e253a]/95 to-[#252a3d]/98 backdrop-blur-sm border-[#33333A]">
        <SheetHeader className="space-y-1 mb-5">
          <SheetTitle className="text-xl font-medium">Skapa nytt säljpass</SheetTitle>
          <SheetDescription>
            Fyll i detaljerna för att skapa ett nytt säljpass
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-4">
          <CreateShiftForm onSuccess={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
