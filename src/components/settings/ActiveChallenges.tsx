import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash, Edit2, Check, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const ActiveChallenges = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingReward, setEditingReward] = useState("");

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

  const handleEdit = (id: string, currentReward: number) => {
    setEditingId(id);
    setEditingReward(currentReward.toString());
  };

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from("challenges")
        .update({ reward: parseFloat(editingReward) })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Utmaning uppdaterad",
        description: "Beloppet har uppdaterats",
        className: "bg-green-500 text-white border-none rounded-xl shadow-lg",
      });

      setEditingId(null);
      refetch();
    } catch (error) {
      console.error("Error updating challenge:", error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte uppdatera utmaningen",
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
        <h2 className="text-xl font-bold mb-4">Aktiva tävlingar</h2>
        <p className="text-gray-400">Inga aktiva tävlingar</p>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <h2 className="text-xl font-bold mb-4">Aktiva tävlingar</h2>
      <div className="space-y-4">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="flex items-center justify-between p-4 bg-[#1A1F2C] rounded-lg"
          >
            <div className="flex-grow">
              <h3 className="font-bold">{getTypeLabel(challenge.type)}</h3>
              <p className="text-gray-400">
                {formatDateRange(challenge.start_date, challenge.end_date, challenge.type)}
              </p>
              {editingId === challenge.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={editingReward}
                    onChange={(e) => setEditingReward(e.target.value)}
                    className="w-32 h-8 text-sm"
                  />
                  <span className="text-gray-400">SEK bonus</span>
                </div>
              ) : (
                <p className="text-green-500">{challenge.reward} SEK bonus</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {editingId === challenge.id ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSave(challenge.id)}
                    className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                  >
                    <Check size={20} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingId(null)}
                    className="text-gray-400 hover:text-gray-500 hover:bg-gray-500/10"
                  >
                    <X size={20} />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(challenge.id, challenge.reward)}
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                  >
                    <Edit2 size={20} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(challenge.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash size={20} />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};