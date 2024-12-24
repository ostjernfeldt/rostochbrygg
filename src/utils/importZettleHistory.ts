import { supabase } from "@/integrations/supabase/client";

export const importZettleHistory = async () => {
  console.log("Starting Zettle history import...");
  
  const { data, error } = await supabase.functions.invoke('import-zettle-history');
  
  if (error) {
    console.error("Error importing Zettle history:", error);
    throw error;
  }
  
  console.log("Import completed:", data);
  return data;
};