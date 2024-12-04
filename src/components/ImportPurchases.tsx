import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"

export function ImportPurchases() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleImport = async () => {
    try {
      setIsLoading(true)
      console.log('Starting import for dates:', startDate, endDate)

      const { data, error } = await supabase.functions.invoke('import-historical-purchases', {
        body: { startDate, endDate }
      })

      if (error) throw error

      console.log('Import response:', data)
      toast({
        title: "Import slutförd",
        description: data.message,
      })
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte importera köp. Kontrollera API-nyckeln och försök igen.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Importera historiska köp</h2>
      <div className="space-y-2">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-1">
            Startdatum
          </label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium mb-1">
            Slutdatum
          </label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <Button 
        onClick={handleImport} 
        disabled={!startDate || !endDate || isLoading}
      >
        {isLoading ? "Importerar..." : "Importera köp"}
      </Button>
    </div>
  )
}