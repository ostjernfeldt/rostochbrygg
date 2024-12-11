import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type ChallengeType = "daily" | "weekly" | "monthly";

export const ChallengeManager = () => {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<ChallengeType>("daily");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [week, setWeek] = useState(format(new Date(), "yyyy-'W'ww"));
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [reward, setReward] = useState("");
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let startDate: Date;
    let endDate: Date;

    switch (type) {
      case "daily":
        startDate = new Date(date);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        const [year, weekNum] = week.split("-W");
        startDate = startOfWeek(new Date(parseInt(year), 0, 1 + (parseInt(weekNum) - 1) * 7));
        endDate = endOfWeek(startDate);
        break;
      case "monthly":
        startDate = startOfMonth(new Date(month));
        endDate = endOfMonth(startDate);
        break;
    }

    try {
      const { error } = await supabase
        .from("challenges")
        .insert({
          type,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          reward: parseFloat(reward),
        });

      if (error) throw error;

      toast({
        title: "Utmaning skapad!",
        description: "Din nya utmaning har sparats",
        className: "bg-green-500 text-white border-none rounded-xl shadow-lg",
      });

      // Reset form and refresh challenges list
      setShowForm(false);
      setReward("");
      queryClient.invalidateQueries({ queryKey: ["active-challenges"] });
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte skapa utmaningen",
        variant: "destructive",
      });
    }
  };

  if (!showForm) {
    return (
      <div className="stat-card">
        <h2 className="text-xl font-bold mb-4">Skapa ny tävling</h2>
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-lg"
        >
          <Calendar className="mr-2" />
          Skapa tävling
        </Button>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <h2 className="text-xl font-bold mb-4">Skapa ny utmaning</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white text-lg mb-2">Typ av tävling</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ChallengeType)}
            className="w-full bg-[#1A1F2C] border-none text-white h-12 text-lg rounded-md px-3"
          >
            <option value="daily">Dagens tävling</option>
            <option value="weekly">Veckans tävling</option>
            <option value="monthly">Månadens tävling</option>
          </select>
        </div>

        {type === "daily" && (
          <div>
            <label className="block text-white text-lg mb-2">Datum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#1A1F2C] border-none text-white h-12 text-lg rounded-md px-3"
            />
          </div>
        )}

        {type === "weekly" && (
          <div>
            <label className="block text-white text-lg mb-2">Vecka</label>
            <input
              type="week"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="w-full bg-[#1A1F2C] border-none text-white h-12 text-lg rounded-md px-3"
            />
          </div>
        )}

        {type === "monthly" && (
          <div>
            <label className="block text-white text-lg mb-2">Månad</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-[#1A1F2C] border-none text-white h-12 text-lg rounded-md px-3"
            />
          </div>
        )}

        <div>
          <label className="block text-white text-lg mb-2">Belöning (SEK)</label>
          <input
            type="number"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            className="w-full bg-[#1A1F2C] border-none text-white h-12 text-lg rounded-md px-3"
            placeholder="Ange belopp..."
          />
        </div>

        <div className="flex gap-4">
          <Button 
            type="submit"
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-6 text-lg"
          >
            Skapa tävling
          </Button>
          <Button 
            type="button"
            onClick={() => setShowForm(false)}
            variant="outline"
            className="flex-1 py-6 text-lg"
          >
            Avbryt
          </Button>
        </div>
      </form>
    </div>
  );
};