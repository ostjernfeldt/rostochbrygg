
import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon, Clock, Users, AlignLeft, CheckCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useCreateShift } from "@/hooks/useShifts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";
import { SellerSelect } from "./SellerSelect";
import { SelectedSellersList } from "./SelectedSellersList";
import { useBatchBookShifts } from "@/hooks/booking/useBatchBookShifts";

interface CreateShiftFormValues {
  date: Date;
  startTime: string;
  endTime: string;
  availableSlots: number;
  description: string;
}

interface CreateShiftFormProps {
  onSuccess?: () => void;
}

interface Seller {
  user_display_name: string;
  email: string | null;
  role: string;
}

export function CreateShiftForm({ onSuccess }: CreateShiftFormProps) {
  const [date, setDate] = useState<Date>();
  const [enableSellerSelection, setEnableSellerSelection] = useState(false);
  const [selectedSellers, setSelectedSellers] = useState<Seller[]>([]);
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm<CreateShiftFormValues>({
    mode: "onChange"
  });
  
  const createShift = useCreateShift();
  const batchBookShifts = useBatchBookShifts();
  const isMobile = useIsMobile();
  
  const onSubmit = async (data: CreateShiftFormValues) => {
    if (!date) return;
    
    try {
      // Create the shift
      const shiftResult = await createShift.mutateAsync({
        date: format(date, 'yyyy-MM-dd'),
        start_time: data.startTime,
        end_time: data.endTime,
        available_slots: Number(data.availableSlots),
        description: data.description || undefined
      });
      
      // If we have selected sellers and a valid shift ID, book them
      if (enableSellerSelection && selectedSellers.length > 0 && shiftResult?.id) {
        try {
          // Map sellers to booking format
          const bookings = selectedSellers.map(seller => ({
            shiftId: shiftResult.id,
            userDisplayName: seller.user_display_name,
            userEmail: seller.email || undefined
          }));
          
          // Book all selected sellers
          await batchBookShifts.mutateAsync(bookings);
        } catch (error) {
          console.error("Error booking sellers:", error);
        }
      }
      
      // Reset form
      reset();
      setDate(undefined);
      setSelectedSellers([]);
      
      // Close sheet if onSuccess callback is provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating shift:", error);
    }
  };
  
  const handleSellerSelect = (seller: Seller) => {
    // Check if seller is already selected
    if (!selectedSellers.some(s => s.user_display_name === seller.user_display_name)) {
      setSelectedSellers([...selectedSellers, seller]);
    }
  };
  
  const handleRemoveSeller = (index: number) => {
    const newSellers = [...selectedSellers];
    newSellers.splice(index, 1);
    setSelectedSellers(newSellers);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Date picker */}
      <div className="space-y-2.5">
        <Label htmlFor="date" className="text-sm flex items-center gap-2 font-medium">
          <CalendarIcon className="h-4 w-4 text-primary/80" />
          Datum
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal border-[#33333A] bg-black/20 hover:bg-black/30 hover:border-primary/30 h-11",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "EEEE d MMMM yyyy", { locale: sv }) : "Välj datum"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              locale={sv}
              className="bg-card"
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>
        )}
      </div>
      
      {/* Available slots */}
      <div className="space-y-2.5">
        <Label htmlFor="availableSlots" className="text-sm flex items-center gap-2 font-medium">
          <Users className="h-4 w-4 text-primary/80" />
          Antal platser
        </Label>
        <div className="relative">
          <Input
            id="availableSlots"
            type="number"
            min="1"
            className="pl-4 bg-black/20 border-[#33333A] focus-visible:border-primary/30 h-11"
            {...register("availableSlots", { 
              required: "Antal platser krävs",
              min: { value: 1, message: "Minst 1 plats krävs" },
              valueAsNumber: true
            })}
          />
        </div>
        {errors.availableSlots && (
          <p className="text-xs text-red-500 mt-1">{errors.availableSlots.message}</p>
        )}
      </div>
      
      {/* Time selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2.5">
          <Label htmlFor="startTime" className="text-sm flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4 text-primary/80" />
            Starttid
          </Label>
          <div className="relative">
            <Input
              id="startTime"
              type="time"
              className="pl-4 bg-black/20 border-[#33333A] focus-visible:border-primary/30 h-11"
              {...register("startTime", { required: "Starttid krävs" })}
            />
          </div>
          {errors.startTime && (
            <p className="text-xs text-red-500 mt-1">{errors.startTime.message}</p>
          )}
        </div>
        
        <div className="space-y-2.5">
          <Label htmlFor="endTime" className="text-sm flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4 text-primary/80" />
            Sluttid
          </Label>
          <div className="relative">
            <Input
              id="endTime"
              type="time"
              className="pl-4 bg-black/20 border-[#33333A] focus-visible:border-primary/30 h-11"
              {...register("endTime", { required: "Sluttid krävs" })}
            />
          </div>
          {errors.endTime && (
            <p className="text-xs text-red-500 mt-1">{errors.endTime.message}</p>
          )}
        </div>
      </div>
      
      {/* Description */}
      <div className="space-y-2.5">
        <Label htmlFor="description" className="text-sm flex items-center gap-2 font-medium">
          <AlignLeft className="h-4 w-4 text-primary/80" />
          Beskrivning (valfritt)
        </Label>
        <Textarea
          id="description"
          placeholder="Lägg till information om säljpasset"
          className="bg-black/20 resize-none min-h-24 border-[#33333A] focus-visible:border-primary/30"
          {...register("description")}
        />
      </div>
      
      {/* Seller selection toggle */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label 
            htmlFor="enable-seller-selection" 
            className="text-sm flex items-center gap-2 font-medium cursor-pointer"
          >
            <UserPlus className="h-4 w-4 text-primary/80" />
            Lägg till säljare direkt
          </Label>
          <Switch
            id="enable-seller-selection"
            checked={enableSellerSelection}
            onCheckedChange={setEnableSellerSelection}
          />
        </div>
        
        {enableSellerSelection && (
          <div className="mt-3 space-y-3">
            <SellerSelect 
              onSellerSelect={handleSellerSelect}
            />
            <SelectedSellersList 
              sellers={selectedSellers} 
              onRemove={handleRemoveSeller} 
            />
          </div>
        )}
      </div>
      
      {/* Submit button */}
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90 text-white shadow-md transition-all h-12 mt-4 flex items-center gap-2"
        disabled={createShift.isPending || !date}
      >
        {createShift.isPending ? (
          <>
            <div className="h-4 w-4 border-2 border-white/30 border-t-white/90 rounded-full animate-spin"></div>
            Skapar...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" />
            Skapa säljpass
          </>
        )}
      </Button>
    </form>
  );
}
