import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Settings = () => {
  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-8">Dagens inställningar</h1>

      <div className="space-y-6">
        <div className="stat-card">
          <div className="space-y-4">
            <div>
              <label className="block text-white text-lg mb-2">Försäljningsmål</label>
              <Input 
                type="number" 
                value="12000" 
                className="bg-[#1A1F2C] border-none text-white h-12 text-lg" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-lg mb-2">Arbetspass start</label>
                <Input 
                  type="time" 
                  value="17:00" 
                  className="bg-[#1A1F2C] border-none text-white h-12 text-lg" 
                />
              </div>
              <div>
                <label className="block text-white text-lg mb-2">Arbetspass slut</label>
                <Input 
                  type="time" 
                  value="20:00" 
                  className="bg-[#1A1F2C] border-none text-white h-12 text-lg" 
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-lg mb-2">Dagens bonus</label>
              <Input 
                type="number" 
                value="200" 
                className="bg-[#1A1F2C] border-none text-white h-12 text-lg" 
              />
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-lg">
              Spara inställningar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;