import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Article = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) {
        toast.error("Kunde inte hämta artikeln");
        throw error;
      }
      
      return data;
    }
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-gray-700 rounded mb-4"></div>
          <div className="h-12 w-64 bg-gray-700 rounded mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!article) {
    return (
      <PageLayout>
        <Button onClick={() => navigate("/learn")} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2" />
          Tillbaka
        </Button>
        <p>Artikel hittades inte.</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <Button 
          onClick={() => navigate("/learn")} 
          variant="ghost" 
          className="mb-6 -ml-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka
        </Button>
        
        <div className="mb-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            article.category === "Kaffekunskap" ? "bg-[#8B5E3C]" : "bg-primary"
          } text-white inline-block`}>
            {article.category}
          </span>
        </div>
        
        <h1 className="text-3xl font-bold mb-8 leading-tight">{article.title}</h1>
        
        <div 
          className="prose prose-invert max-w-none prose-headings:text-xl prose-headings:font-semibold prose-headings:mb-4 prose-headings:mt-8 prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </PageLayout>
  );
};

export default Article;