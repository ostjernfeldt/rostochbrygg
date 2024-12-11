import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export const ActiveChallenges = () => {
  const { data: challenges, refetch } = useQuery({
    queryKey: ["active-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("challenges")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Utmaning borttagen",
        description: "Utmaningen har tagits bort",
        className: "bg-green-500 text-white border-none rounded-xl shadow-lg",
      });

      refetch();
    } catch (error) {
      console.error("Error deleting challenge:", error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte ta bort utmaningen",
        variant: "destructive",
      });
    }
  };

  const formatDateRange = (startDate: string, endDate: string, type: string) => {
    switch (type) {
      case "daily":
        return format(new Date(startDate), "d MMMM yyyy");
      case "weekly":
        return `Vecka ${format(new Date(startDate), "w")} (${format(new Date(startDate), "d MMM")} - ${format(new Date(endDate), "d MMM")})`;
      case "monthly":
        return format(new Date(startDate), "MMMM yyyy");
      default:
        return "";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "daily":
        return "Dagens utmaning";
      case "weekly":
        return "Veckans utmaning";
      case "monthly":
        return "Månadens utmaning";
      default:
        return "";
    }
  };

  if (!challenges?.length) {
    return (
      <div className="stat-card">
        <h2 className="text-xl font-bold mb-4">Aktiva utmaningar</h2>
        <p className="text-gray-400">Inga aktiva utmaningar</p>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <h2 className="text-xl font-bold mb-4">Aktiva utmaningar</h2>
      <div className="space-y-4">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="flex items-center justify-between p-4 bg-[#1A1F2C] rounded-lg"
          >
            <div>
              <h3 className="font-bold">{getTypeLabel(challenge.type)}</h3>
              <p className="text-gray-400">
                {formatDateRange(challenge.start_date, challenge.end_date, challenge.type)}
              </p>
              <p className="text-green-500">{challenge.reward} SEK bonus</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(challenge.id)}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              <Trash size={20} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};