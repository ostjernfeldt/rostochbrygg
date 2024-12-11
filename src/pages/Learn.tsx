import { Clock, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";

const Learn = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
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
    const matchesFilter = filter === "all" || article.category === filter;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  console.log('Current filter:', filter);
  console.log('Current search:', searchQuery);
  console.log('Filtered articles:', filteredArticles);

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Kunskap</h1>
        <p className="text-gray-400 text-lg">Utforska våra utbildningar och artiklar</p>
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
    </PageLayout>
  );
};

export default Learn;