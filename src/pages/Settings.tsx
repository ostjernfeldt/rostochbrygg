import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Settings = () => {
  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Dagens inställningar</h1>

      <div className="space-y-6">
        <div>
          <label className="block text-gray-400 mb-2">Försäljningsmål</label>
          <Input type="number" value="12000" className="bg-card border-gray-700" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 mb-2">Arbetspass start</label>
            <Input type="time" value="17:00" className="bg-card border-gray-700" />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Arbetspass slut</label>
            <Input type="time" value="20:00" className="bg-card border-gray-700" />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Dagens bonus</label>
          <Input type="number" value="200" className="bg-card border-gray-700" />
        </div>

        <Button className="w-full bg-primary hover:bg-primary/90">
          Spara inställningar
        </Button>
      </div>
    </div>
  );
};

export default Settings;