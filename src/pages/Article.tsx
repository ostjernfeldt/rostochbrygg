import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const articles = {
  "kaffe-grundlaggande": {
    category: "Kaffekunskap",
    title: "Kaffe - Grundläggande",
    content: `
      <h2>Introduktion till kaffe</h2>
      <p>Kaffe är en av världens mest populära drycker och har en rik historia som sträcker sig hundratals år tillbaka i tiden.</p>
      
      <h2>Kaffebönan</h2>
      <p>Kaffebönor kommer från kaffeplantan och det finns huvudsakligen två typer: Arabica och Robusta.</p>
      
      <h2>Rostning</h2>
      <p>Rostningsprocessen är avgörande för kaffets smak. Olika rostningstider ger olika smaker och intensitet.</p>
    `,
    categoryColor: "bg-[#8B5E3C]",
  },
  "dorrforsaljning-101": {
    category: "Säljutbildning",
    title: "Dörrförsäljning 101",
    content: `
      <h2>Grunderna i dörrförsäljning</h2>
      <p>Dörrförsäljning är en direkt form av försäljning där du möter kunden på deras hemmaplan.</p>
      
      <h2>Första intrycket</h2>
      <p>De första sekunderna är avgörande. Ett professionellt och vänligt bemötande öppnar dörrar.</p>
      
      <h2>Presentationsteknik</h2>
      <p>En effektiv presentation är kort, relevant och anpassad efter kundens behov.</p>
    `,
    categoryColor: "bg-primary",
  },
  "oka-snittordervarde": {
    category: "Säljutbildning",
    title: "Öka ditt snittordervärde",
    content: `
      <h2>Strategier för högre ordervärde</h2>
      <p>Att öka snittordervärdet är ett effektivt sätt att förbättra din försäljning utan att behöva fler kunder.</p>
      
      <h2>Merförsäljning</h2>
      <p>Identifiera kompletterande produkter som kan vara relevanta för kunden.</p>
      
      <h2>Värdehöjande argument</h2>
      <p>Fokusera på värdet och fördelarna snarare än priset när du presenterar uppgraderingsmöjligheter.</p>
    `,
    categoryColor: "bg-primary",
  },
};

const Article = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const article = articles[slug as keyof typeof articles];

  if (!article) {
    return (
      <div className="p-4">
        <Button onClick={() => navigate("/learn")} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2" />
          Tillbaka
        </Button>
        <p>Artikel hittades inte.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 animate-fade-in">
      <Button onClick={() => navigate("/learn")} variant="ghost" className="mb-4">
        <ArrowLeft className="mr-2" />
        Tillbaka
      </Button>
      
      <div className="mb-3">
        <span className={`px-3 py-1 rounded-full text-sm ${article.categoryColor} text-white`}>
          {article.category}
        </span>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">{article.title}</h1>
      
      <div 
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </div>
  );
};

export default Article;