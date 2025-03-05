
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
import { useCreateShift } from "@/hooks/useShifts";

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
        <Label htmlFor="date">Datum</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPPP") : "Välj datum"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-xs text-red-500">{errors.date.message}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Starttid</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="startTime"
              type="time"
              className="pl-10"
              {...register("startTime", { required: "Starttid krävs" })}
            />
          </div>
          {errors.startTime && (
            <p className="text-xs text-red-500">{errors.startTime.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endTime">Sluttid</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="endTime"
              type="time"
              className="pl-10"
              {...register("endTime", { required: "Sluttid krävs" })}
            />
          </div>
          {errors.endTime && (
            <p className="text-xs text-red-500">{errors.endTime.message}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="availableSlots">Antal platser</Label>
        <Input
          id="availableSlots"
          type="number"
          min="1"
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
        <Label htmlFor="description">Beskrivning (valfritt)</Label>
        <Textarea
          id="description"
          placeholder="Lägg till information om säljpasset"
          {...register("description")}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={createShift.isPending || !date}
      >
        {createShift.isPending ? "Skapar..." : "Skapa säljpass"}
      </Button>
    </form>
  );
}
