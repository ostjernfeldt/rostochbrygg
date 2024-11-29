import { Clock } from "lucide-react";

const Learn = () => {
  const articles = [
    {
      category: "Kaffekunskap",
      title: "Kaffe - Grundläggande",
      description: "Snabb introduktion till kaffevärlden",
      duration: "5 min",
      categoryColor: "bg-[#8B5E3C]",
    },
    {
      category: "Säljutbildning",
      title: "Dörrförsäljning 101",
      description: "Snabb introduktion till dörrförsäljning",
      duration: "5 min",
      categoryColor: "bg-primary",
    },
    {
      category: "Säljutbildning",
      title: "Öka ditt snittordervärde",
      description: "Hur ökar man sitt snittordervärde?",
      duration: "5 min",
      categoryColor: "bg-primary",
    },
  ];

  return (
    <div className="p-4 pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Lär dig mer</h1>
        <p className="text-gray-400 text-lg">Utforska våra utbildningar och artiklar</p>
      </div>

      <div className="space-y-4">
        {articles.map((article, index) => (
          <div 
            key={index} 
            className="stat-card hover:scale-[1.02] transition-transform duration-200"
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