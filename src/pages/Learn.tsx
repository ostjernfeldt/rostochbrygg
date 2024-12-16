import { Clock, Search, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { ArticleDialog } from "@/components/articles/ArticleDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Learn = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  
  const { data: articles = [], refetch } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error("Kunde inte hämta artiklar");
        throw error;
      }
      
      return data;
    }
  });

  const filteredArticles = articles.filter(article => {
    const matchesFilter = filter === "all" || article.category === filter;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    setIsDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingArticle(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingArticle(null);
    refetch();
  };

  return (
    <PageLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Kunskap</h1>
          <p className="text-gray-400 text-lg">Utforska våra utbildningar och artiklar</p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ny artikel
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-sm ${filter === "all" ? "bg-gray-600" : "border border-gray-600"} text-white`}
        >
          Allt
        </button>
        <button
          onClick={() => setFilter("Kaffekunskap")}
          className={`px-3 py-1 rounded-full text-sm ${filter === "Kaffekunskap" ? "bg-[#8B5E3C]" : "border border-[#8B5E3C]"} text-white`}
        >
          Kaffekunskap
        </button>
        <button
          onClick={() => setFilter("Säljutbildning")}
          className={`px-3 py-1 rounded-full text-sm ${filter === "Säljutbildning" ? "bg-primary" : "border border-primary"} text-white`}
        >
          Säljutbildning
        </button>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Sök efter artikel..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pl-10 bg-card/50 border border-gray-800 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-primary/50"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      </div>

      <div className="space-y-4">
        {filteredArticles.map((article) => (
          <div 
            key={article.id} 
            className="stat-card hover:scale-[1.02] transition-transform duration-200 cursor-pointer group"
            onClick={() => navigate(`/learn/${article.slug}`)}
          >
            <div className="mb-3 flex justify-between items-center">
              <span className={`px-3 py-1 rounded-full text-sm ${
                article.category === "Kaffekunskap" ? "bg-[#8B5E3C]" : "bg-primary"
              } text-white`}>
                {article.category}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(article);
                }}
              >
                Redigera
              </Button>
            </div>
            <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
            <p className="text-gray-400 mb-3 line-clamp-2">{article.content}</p>
            <div className="flex items-center text-gray-400">
              <Clock size={16} className="mr-2" />
              <span>5 min</span>
            </div>
          </div>
        ))}
      </div>

      <ArticleDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        article={editingArticle}
        onClose={handleDialogClose}
      />
    </PageLayout>
  );
};

export default Learn;