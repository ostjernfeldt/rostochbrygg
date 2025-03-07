
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Seller {
  user_display_name: string;
  email: string | null;
  role: string;
}

export function useSellerSearch() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all sellers
  useEffect(() => {
    async function fetchSellers() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("staff_roles")
          .select("user_display_name, email, role")
          .eq("hidden", false)
          .order("user_display_name");

        if (error) throw error;
        
        // Ensure sellers is always an array
        const sellersData = Array.isArray(data) ? data : [];
        setSellers(sellersData);
        setFilteredSellers(sellersData);
      } catch (error) {
        console.error("Error fetching sellers:", error);
        setSellers([]);
        setFilteredSellers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSellers();
  }, []);

  // Filter sellers based on search input
  useEffect(() => {
    if (search.trim() === "") {
      setFilteredSellers(sellers);
    } else {
      const searchLower = search.toLowerCase();
      const filtered = sellers.filter(seller => 
        seller.user_display_name.toLowerCase().includes(searchLower) || 
        (seller.role && seller.role.toLowerCase().includes(searchLower))
      );
      setFilteredSellers(filtered);
    }
  }, [search, sellers]);

  return {
    sellers: filteredSellers,
    loading,
    search,
    setSearch
  };
}
