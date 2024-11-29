import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Learn = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  
  const articles = [
    {
      slug: "kaffe-grundlaggande",
      category: "Kaffekunskap",
      title: "Kaffe - Grundläggande",
      description: "Snabb introduktion till kaffevärlden",
      duration: "5 min",
      categoryColor: "bg-[#8B5E3C]",
    },
    {
      slug: "dorrforsaljning-101",
      category: "Säljutbildning",
      title: "Dörrförsäljning 101",
      description: "Snabb introduktion till dörrförsäljning",
      duration: "5 min",
      categoryColor: "bg-primary",
    },
    {
      slug: "oka-snittordervarde",
      category: "Säljutbildning",
      title: "Öka ditt snittordervärde",
      description: "Hur ökar man sitt snittordervärde?",
      duration: "5 min",
      categoryColor: "bg-primary",
    },
  ];

  const filteredArticles = articles.filter(article => {
    if (filter === "all") return true;
    return article.category === filter;
  });

  console.log('Current filter:', filter);
  console.log('Filtered articles:', filteredArticles);

  return (
    <div className="p-4 pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Lär dig mer</h1>
        <p className="text-gray-400 text-lg">Utforska våra utbildningar och artiklar</p>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className="text-white"
        >
          Allt
        </Button>
        <Button
          variant={filter === "Kaffekunskap" ? "default" : "outline"}
          onClick={() => setFilter("Kaffekunskap")}
          className={`${filter === "Kaffekunskap" ? "bg-[#8B5E3C]" : ""} hover:bg-[#8B5E3C]/90`}
        >
          Kaffekunskap
        </Button>
        <Button
          variant={filter === "Säljutbildning" ? "default" : "outline"}
          onClick={() => setFilter("Säljutbildning")}
          className={`${filter === "Säljutbildning" ? "bg-primary" : ""} hover:bg-primary/90`}
        >
          Säljutbildning
        </Button>
      </div>

      <div className="space-y-4">
        {filteredArticles.map((article, index) => (
          <div 
            key={index} 
            className="stat-card hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
            onClick={() => navigate(`/learn/${article.slug}`)}
          >
            <div className="mb-3">
              <span className={`px-3 py-1 rounded-full text-sm ${article.categoryColor} text-white`}>
                {article.category}
              </span>
            </div>
            <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
            <p className="text-gray-400 mb-3">{article.description}</p>
            <div className="flex items-center text-gray-400">
              <Clock size={16} className="mr-2" />
              <span>{article.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Learn;