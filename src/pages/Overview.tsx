import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { DateFilterSection } from "@/components/overview/DateFilterSection";
import { StatsSection } from "@/components/overview/StatsSection";
import { useSalesData } from "@/hooks/useSalesData";
import { importZettleHistory } from "@/utils/importZettleHistory";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

const Overview = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [selectedDate, setSelectedDate] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { data: stats, isLoading } = useSalesData(selectedPeriod);
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    try {
      setIsImporting(true);
      await importZettleHistory();
      toast.success("Historical data import completed successfully");
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Failed to import historical data");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <DateFilterSection
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onPeriodChange={setSelectedPeriod}
          />
          <Button 
            onClick={handleImport}
            disabled={isImporting}
            variant="outline"
          >
            {isImporting ? "Importing..." : "Import Historical Data"}
          </Button>
        </div>
        <StatsSection
          stats={stats}
          isLoading={isLoading}
          selectedPeriod={selectedPeriod}
        />
      </div>
    </PageLayout>
  );
};

export default Overview;