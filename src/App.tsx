import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wine, Search, Star, Utensils, Droplets, Wind, Grape, MapPin, Calendar, Loader2 } from 'lucide-react';
import { generateWineNotes } from './services/geminiService';
import { WineData } from './types';

export default function App() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wineData, setWineData] = useState<WineData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getWineImage = (type: string) => {
    switch (type) {
      case 'red': return 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=600&q=80';
      case 'white': return 'https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?auto=format&fit=crop&w=600&q=80';
      case 'sparkling': return 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80';
      case 'rose': return 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4?auto=format&fit=crop&w=600&q=80';
      case 'sweet': return 'https://images.unsplash.com/photo-1572913017567-02f0649bc4fd?auto=format&fit=crop&w=600&q=80';
      case 'fortified': return 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=600&q=80';
      default: return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80';
    }
  };

  const getWineTypeName = (type: string) => {
    switch (type) {
      case 'red': return '紅酒';
      case 'white': return '白酒';
      case 'sparkling': return '氣泡酒';
      case 'rose': return '玫瑰酒';
      case 'sweet': return '甜酒';
      case 'fortified': return '加烈酒';
      default: return '葡萄酒';
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setWineData(null);

    try {
      const data = await generateWineNotes(query);
      setWineData(data);
    } catch (err) {
      console.error(err);
      setError("唔好意思，我搵唔到呢款酒嘅品酒筆記。試下入過另一個名啦。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] selection:bg-wine-900 selection:text-white pb-20">
      {/* Header */}
      <header className="pt-16 pb-12 px-6 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#351515_0%,_transparent_60%)] opacity-60 pointer-events-none"></div>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="w-16 h-16 rounded-full border border-wine-800/50 flex items-center justify-center mx-auto mb-6 bg-wine-950/30 backdrop-blur-sm">
            <Wine className="w-8 h-8 text-wine-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium tracking-tight mb-4 text-white">
            虛擬侍酒師
          </h1>
          <p className="text-neutral-400 max-w-md mx-auto font-light text-sm md:text-base tracking-wide">
            輸入酒名，即刻為你送上品酒筆記、專業評分同埋完美配餐建議。
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          onSubmit={handleSearch} 
          className="w-full max-w-xl mx-auto mt-10 relative z-10"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例如：Château Margaux 2015, Opus One..."
              className="w-full bg-neutral-900/80 border border-neutral-800 rounded-full py-4 pl-6 pr-14 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-wine-600 focus:border-wine-600 transition-all backdrop-blur-md"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 w-10 h-10 rounded-full bg-wine-800 hover:bg-wine-700 disabled:bg-neutral-800 disabled:text-neutral-500 flex items-center justify-center text-white transition-colors"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
        </motion.form>
      </header>

      {/* Main Content Area */}
      <main className="px-4 md:px-8 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-red-950/30 border border-red-900/50 rounded-2xl p-6 text-center text-red-200"
            >
              <p>{error}</p>
            </motion.div>
          )}

          {isLoading && !wineData && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-wine-400"
            >
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-serif italic text-neutral-400">幫你醒緊酒，準備緊筆記...</p>
            </motion.div>
          )}

          {wineData && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Hero Card */}
              <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-3xl p-8 md:p-10 backdrop-blur-sm relative overflow-hidden flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Wine className="w-64 h-64" />
                </div>
                
                {wineData.wineType && (
                  <div className="w-full md:w-1/3 shrink-0 relative z-10 flex justify-center">
                    <div className="relative w-48 h-72 md:w-56 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800/50 bg-neutral-950">
                      <img 
                        src={getWineImage(wineData.wineType)} 
                        alt={getWineTypeName(wineData.wineType)} 
                        className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-medium tracking-wider text-white">
                        {getWineTypeName(wineData.wineType)}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                    </div>
                  </div>
                )}

                <div className="relative z-10 flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-3 mb-4 text-xs font-semibold tracking-wider uppercase text-wine-400">
                    <span className="flex items-center gap-1.5 bg-wine-950/50 px-3 py-1 rounded-full border border-wine-900/50">
                      <MapPin className="w-3.5 h-3.5" /> {wineData.region}
                    </span>
                    <span className="flex items-center gap-1.5 bg-neutral-800/50 px-3 py-1 rounded-full border border-neutral-700/50 text-neutral-300">
                      <Calendar className="w-3.5 h-3.5" /> {wineData.vintage}
                    </span>
                  </div>
                  
                  <h2 className="text-3xl md:text-5xl font-serif mb-6 leading-tight">
                    {wineData.wineName}
                  </h2>
                  
                  <p className="text-neutral-300 text-lg leading-relaxed mb-8 max-w-2xl font-light">
                    {wineData.description}
                  </p>

                  <div className="flex flex-wrap gap-6 items-center pt-6 border-t border-neutral-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-wine-900/30 flex items-center justify-center border border-wine-800/50">
                        <Star className="w-6 h-6 text-wine-400 fill-wine-400/20" />
                      </div>
                      <div>
                        <div className="text-2xl font-serif text-white">{wineData.rating}<span className="text-sm text-neutral-500 font-sans">/100</span></div>
                        <div className="text-xs text-neutral-400 uppercase tracking-widest">評分</div>
                      </div>
                    </div>

                    <div className="h-10 w-px bg-neutral-800 hidden sm:block"></div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-neutral-800/50 flex items-center justify-center border border-neutral-700/50">
                        <Grape className="w-6 h-6 text-neutral-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white max-w-[200px] truncate">
                          {wineData.grapeVarieties.join(', ')}
                        </div>
                        <div className="text-xs text-neutral-400 uppercase tracking-widest mt-0.5">葡萄品種</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasting Notes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-6 hover:bg-neutral-900/50 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Droplets className="w-5 h-5 text-wine-400" />
                    <h3 className="font-serif text-xl text-white">外觀</h3>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed font-light">
                    {wineData.tastingNotes.appearance}
                  </p>
                </div>

                <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-6 hover:bg-neutral-900/50 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Wind className="w-5 h-5 text-wine-400" />
                    <h3 className="font-serif text-xl text-white">香氣</h3>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed font-light">
                    {wineData.tastingNotes.aroma}
                  </p>
                </div>

                <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-6 hover:bg-neutral-900/50 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Wine className="w-5 h-5 text-wine-400" />
                    <h3 className="font-serif text-xl text-white">口感</h3>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed font-light">
                    {wineData.tastingNotes.palate}
                  </p>
                </div>

                <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-6 hover:bg-neutral-900/50 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-5 h-5 rounded-full border-2 border-wine-400 opacity-80"></div>
                    <h3 className="font-serif text-xl text-white">餘韻</h3>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed font-light">
                    {wineData.tastingNotes.finish}
                  </p>
                </div>
              </div>

              {/* Vintage Notes */}
              {wineData.vintageNotes && (
                <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-3xl p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-6 h-6 text-wine-400" />
                    <h3 className="font-serif text-2xl text-white">
                      {wineData.vintageNotes.type === 'specific' 
                        ? `${wineData.vintageNotes.year || wineData.vintage} 年份表現` 
                        : '產區優秀年份'}
                    </h3>
                  </div>
                  <p className="text-neutral-300 font-light leading-relaxed">
                    {wineData.vintageNotes.description}
                  </p>
                </div>
              )}

              {/* Food Pairings */}
              <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Utensils className="w-6 h-6 text-wine-400" />
                  <h3 className="font-serif text-2xl text-white">完美配餐</h3>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wineData.foodPairings.map((pairing, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-wine-600 mt-2 shrink-0"></span>
                      <span className="text-neutral-300 font-light leading-relaxed">{pairing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
