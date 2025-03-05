import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
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
import { useCreateShift } from "@/hooks/shifts";

interface CreateShiftFormValues {
  date: Date;
  startTime: string;
  endTime: string;
  availableSlots: number;
  description: string;
}

export function CreateShiftForm() {
  const [date, setDate] = useState<Date>();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateShiftFormValues>();
  const createShift = useCreateShift();
  
  const onSubmit = async (data: CreateShiftFormValues) => {
    if (!date) return;
    
    try {
      await createShift.mutateAsync({
        date: format(date, 'yyyy-MM-dd'),
        start_time: data.startTime,
        end_time: data.endTime,
        available_slots: Number(data.availableSlots),
        description: data.description || undefined
      });
      
      // Reset form
      reset();
      setDate(undefined);
    } catch (error) {
      console.error("Error creating shift:", error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date" className="text-sm">Datum</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal border-[#33333A] bg-black/20 hover:bg-black/30 hover:border-primary/30",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPPP") : "Välj datum"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              className="bg-card"
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-xs text-red-500">{errors.date.message}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime" className="text-sm">Starttid</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="startTime"
              type="time"
              className="pl-10 bg-black/20 border-[#33333A] focus-visible:border-primary/30"
              {...register("startTime", { required: "Starttid krävs" })}
            />
          </div>
          {errors.startTime && (
            <p className="text-xs text-red-500">{errors.startTime.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endTime" className="text-sm">Sluttid</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="endTime"
              type="time"
              className="pl-10 bg-black/20 border-[#33333A] focus-visible:border-primary/30"
              {...register("endTime", { required: "Sluttid krävs" })}
            />
          </div>
          {errors.endTime && (
            <p className="text-xs text-red-500">{errors.endTime.message}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="availableSlots" className="text-sm">Antal platser</Label>
        <Input
          id="availableSlots"
          type="number"
          min="1"
          className="bg-black/20 border-[#33333A] focus-visible:border-primary/30"
          {...register("availableSlots", { 
            required: "Antal platser krävs",
            min: { value: 1, message: "Minst 1 plats krävs" },
            valueAsNumber: true
          })}
        />
        {errors.availableSlots && (
          <p className="text-xs text-red-500">{errors.availableSlots.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm">Beskrivning (valfritt)</Label>
        <Textarea
          id="description"
          placeholder="Lägg till information om säljpasset"
          className="bg-black/20 resize-none min-h-24 border-[#33333A] focus-visible:border-primary/30"
          {...register("description")}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90 text-white shadow-md transition-all"
        disabled={createShift.isPending || !date}
      >
        {createShift.isPending ? "Skapar..." : "Skapa säljpass"}
      </Button>
    </form>
  );
}
