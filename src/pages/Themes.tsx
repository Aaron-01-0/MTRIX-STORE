import { useState } from 'react';
import { ArrowRight, Grid3X3, List, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Themes = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const themes = [
    {
      id: 1,
      name: "Minimalist Dark",
      description: "Clean, modern designs with dark aesthetics perfect for professional environments",
      image: "/api/placeholder/400/250",
      productCount: 45,
      isPopular: true,
      colors: ['#000000', '#1a1a1a', '#333333'],
      category: "Professional"
    },
    {
      id: 2,
      name: "Neon Cyberpunk",
      description: "Futuristic glowing designs for the digital age with electric vibes",
      image: "/api/placeholder/400/250",
      productCount: 32,
      isNew: true,
      colors: ['#00ffff', '#ff0080', '#ffff00'],
      category: "Futuristic"
    },
    {
      id: 3,
      name: "Vintage Retro",
      description: "Classic designs with a nostalgic touch bringing back the golden era",
      image: "/api/placeholder/400/250",
      productCount: 28,
      isTrending: true,
      colors: ['#d2691e', '#8b4513', '#f4a460'],
      category: "Classic"
    },
    {
      id: 4,
      name: "Nature Inspired",
      description: "Eco-friendly designs celebrating nature and sustainability",
      image: "/api/placeholder/400/250",
      productCount: 38,
      colors: ['#228b22', '#32cd32', '#90ee90'],
      category: "Eco"
    },
    {
      id: 5,
      name: "Aesthetic Pastel",
      description: "Soft, dreamy colors perfect for Instagram-worthy lifestyle",
      image: "/api/placeholder/400/250",
      productCount: 52,
      isPopular: true,
      colors: ['#ffb6c1', '#e6e6fa', '#f0f8ff'],
      category: "Aesthetic"
    },
    {
      id: 6,
      name: "Bold Geometric",
      description: "Strong shapes and patterns for statement-making designs",
      image: "/api/placeholder/400/250",
      productCount: 29,
      colors: ['#ff4500', '#1e90ff', '#ffd700'],
      category: "Modern"
    },
    {
      id: 7,
      name: "Anime Inspired",
      description: "Japanese animation style designs for otaku culture enthusiasts",
      image: "/api/placeholder/400/250",
      productCount: 41,
      isTrending: true,
      colors: ['#ff1493', '#00bfff', '#ffd700'],
      category: "Pop Culture"
    },
    {
      id: 8,
      name: "Luxury Gold",
      description: "Premium golden accents for sophisticated and elegant looks",
      image: "/api/placeholder/400/250",
      productCount: 24,
      colors: ['#ffd700', '#000000', '#b8860b'],
      category: "Premium"
    }
  ];

  const filteredThemes = themes.filter(theme =>
    theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-16 px-6 bg-gradient-dark">
          <div className="container mx-auto text-center">
            <h1 className="text-5xl font-orbitron font-bold text-gradient-gold mb-4">
              MTRIX Themes
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Discover our curated collection of design themes that match your unique style and personality
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search themes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-mtrix-dark border-mtrix-gray"
              />
            </div>
          </div>
        </section>

        {/* Themes Grid */}
        <section className="py-12 px-6">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold text-foreground">
                  All Themes ({filteredThemes.length})
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-gradient-gold text-mtrix-black' : ''}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-gradient-gold text-mtrix-black' : ''}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 gap-8' 
                : 'space-y-6'
            }`}>
              {filteredThemes.map((theme) => (
                <Card
                  key={theme.id}
                  className="group relative overflow-hidden bg-mtrix-dark border-mtrix-gray hover:border-primary transition-all duration-500"
                >
                  <CardContent className="p-0">
                    <div className={`${viewMode === 'list' ? 'flex' : ''}`}>
                      <div 
                        className={`bg-cover bg-center ${
                          viewMode === 'list' ? 'w-1/3 h-48' : 'w-full h-64'
                        }`}
                        style={{ backgroundImage: `url(${theme.image})` }}
                      />
                      
                      <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {theme.isPopular && (
                            <Badge className="bg-primary text-mtrix-black">Popular</Badge>
                          )}
                          {theme.isNew && (
                            <Badge className="bg-green-500 text-white">New</Badge>
                          )}
                          {theme.isTrending && (
                            <Badge className="bg-red-500 text-white">Trending</Badge>
                          )}
                          <Badge variant="outline" className="border-mtrix-gray">
                            {theme.category}
                          </Badge>
                        </div>

                        <h3 className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors mb-3">
                          {theme.name}
                        </h3>
                        
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                          {theme.description}
                        </p>

                        {/* Color Palette */}
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-sm text-muted-foreground">Colors:</span>
                          <div className="flex gap-1">
                            {theme.colors.map((color, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded-full border-2 border-mtrix-gray"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-primary font-semibold">
                            {theme.productCount} Products
                          </span>
                          <Button 
                            size="sm"
                            className="bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300"
                          >
                            Explore Theme
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredThemes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No themes found matching your search.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Themes;