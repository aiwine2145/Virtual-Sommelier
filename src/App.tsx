import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wine, Search, Star, Utensils, Droplets, Wind, Grape, MapPin, Calendar, Loader2, Activity, Tag, Camera, ChefHat } from 'lucide-react';
import { generateWineNotes, extractWineInfoFromImage, getWinePairingForDish } from './services/geminiService';
import { WineData, WinePairing } from './types';
import { DecantingTimeLogo } from './components/WineCategoryLogo';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function App() {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'wine' | 'dish'>('wine');
  const [isLoading, setIsLoading] = useState(false);
  const [wineData, setWineData] = useState<WineData | null>(null);
  const [winePairingData, setWinePairingData] = useState<WinePairing | null>(null);
  const [excludedWineries, setExcludedWineries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGrapesExpanded, setIsGrapesExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const getFallbackCountryCode = (region: string) => {
    const lowerRegion = region.toLowerCase();
    if (lowerRegion.includes('france') || lowerRegion.includes('法國')) return 'fr';
    if (lowerRegion.includes('italy') || lowerRegion.includes('義大利') || lowerRegion.includes('意大利')) return 'it';
    if (lowerRegion.includes('spain') || lowerRegion.includes('西班牙')) return 'es';
    if (lowerRegion.includes('usa') || lowerRegion.includes('美國') || lowerRegion.includes('california')) return 'us';
    if (lowerRegion.includes('australia') || lowerRegion.includes('澳洲')) return 'au';
    if (lowerRegion.includes('chile') || lowerRegion.includes('智利')) return 'cl';
    if (lowerRegion.includes('argentina') || lowerRegion.includes('阿根廷')) return 'ar';
    if (lowerRegion.includes('south africa') || lowerRegion.includes('南非')) return 'za';
    if (lowerRegion.includes('new zealand') || lowerRegion.includes('紐西蘭') || lowerRegion.includes('新西蘭')) return 'nz';
    if (lowerRegion.includes('germany') || lowerRegion.includes('德國')) return 'de';
    if (lowerRegion.includes('portugal') || lowerRegion.includes('葡萄牙')) return 'pt';
    if (lowerRegion.includes('china') || lowerRegion.includes('中國')) return 'cn';
    if (lowerRegion.includes('japan') || lowerRegion.includes('日本')) return 'jp';
    return null;
  };

  const getWineTypeName = (type: string) => {
    switch (type) {
      case 'red': return '紅酒';
      case 'white': return '白酒';
      case 'sparkling': return '氣泡酒';
      case 'champagne': return '香檳';
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
    setWinePairingData(null);
    setIsGrapesExpanded(false);

    try {
      if (searchMode === 'wine') {
        const data = await generateWineNotes(query);
        setWineData(data);
      } else {
        const data = await getWinePairingForDish(query, excludedWineries);
        setWinePairingData(data);
        if (data.recommendations) {
          const newWineries = data.recommendations.map(r => r.winery);
          setExcludedWineries(prev => [...prev, ...newWineries]);
        }
      }
    } catch (err) {
      console.error(err);
      setError(searchMode === 'wine' ? "唔好意思，我搵唔到呢款酒嘅品酒筆記。試下入過另一個名啦。" : "唔好意思，我搵唔到合適嘅配酒建議。試下入過另一道菜名啦。");
    } finally {
      setIsLoading(false);
    }
  };

  const processImageFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setWineData(null);
    setIsGrapesExpanded(false);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          const mimeType = base64data.split(';')[0].split(':')[1];
          const base64Image = base64data.split(',')[1];

          const extractedInfo = await extractWineInfoFromImage(base64Image, mimeType);
          
          const parts = [];
          if (extractedInfo.winery && extractedInfo.winery !== "null") parts.push(extractedInfo.winery);
          if (extractedInfo.wine_name && extractedInfo.wine_name !== "null") parts.push(extractedInfo.wine_name);
          if (extractedInfo.vintage && extractedInfo.vintage !== "null") parts.push(extractedInfo.vintage);
          if (extractedInfo.region && extractedInfo.region !== "null") parts.push(extractedInfo.region);
          if (extractedInfo.country && extractedInfo.country !== "null") parts.push(extractedInfo.country);
          
          const newQuery = parts.join(' ');
          
          if (newQuery) {
            setQuery(newQuery);
            const data = await generateWineNotes(newQuery);
            setWineData(data);
          } else {
            setError("無法從圖片中辨識出酒款資訊，請重新拍攝或手動輸入。");
          }
        } catch (err) {
          console.error(err);
          setError("分析圖片時發生錯誤，請稍後再試。");
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError("讀取圖片時發生錯誤。");
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("處理圖片時發生錯誤。");
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] selection:bg-wine-900 selection:text-white pb-20 relative overflow-hidden">
      {/* Global Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#6a1a1a_0%,_transparent_75%)] opacity-80 pointer-events-none"></div>
      
      {/* Header */}
      <header className="pt-16 pb-12 px-6 flex flex-col items-center text-center relative z-10">
        
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
            {searchMode === 'wine' 
              ? "輸入酒名或上傳圖片，即刻為你送上品酒筆記、專業評分同埋完美配餐建議。"
              : "輸入菜式名稱，即刻為你建議配餐用酒"}
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          onSubmit={handleSearch} 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full max-w-xl mx-auto mt-10 relative z-10 rounded-full transition-all duration-300 ${isDragging ? 'ring-2 ring-wine-500 bg-wine-900/20 scale-[1.02]' : ''}`}
        >
          <div className="flex justify-center gap-4 mb-4">
            <button
              type="button"
              onClick={() => setSearchMode('wine')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${searchMode === 'wine' ? 'bg-wine-800 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
            >
              <Wine className="w-4 h-4 inline mr-1" /> 搜尋酒款
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('dish')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${searchMode === 'dish' ? 'bg-wine-800 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
            >
              <ChefHat className="w-4 h-4 inline mr-1" /> 配餐推薦酒
            </button>
          </div>
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchMode === 'wine' ? (isDragging ? "放開以分析酒標圖片..." : "例如：Château Margaux 2015, Opus One...") : "例如：北京填鴨, 壽司, 芝士漢堡..."}
              className={`w-full bg-neutral-900/80 border rounded-full py-4 pl-6 pr-24 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-wine-600 focus:border-wine-600 transition-all backdrop-blur-md ${isDragging ? 'border-wine-500' : 'border-neutral-800'}`}
              disabled={isLoading}
            />
            <div className="absolute right-2 flex items-center gap-1">
              {searchMode === 'wine' && (
                <label className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isLoading ? 'opacity-50 pointer-events-none text-neutral-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    onChange={handleImageUpload}
                    disabled={isLoading}
                  />
                  <Camera className="w-5 h-5" />
                </label>
              )}
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-10 h-10 rounded-full bg-wine-800 hover:bg-wine-700 disabled:bg-neutral-800 disabled:text-neutral-500 flex items-center justify-center text-white transition-colors"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>
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

          {isLoading && !wineData && !winePairingData && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-wine-400"
            >
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-serif italic text-neutral-400">{searchMode === 'wine' ? '幫你醒緊酒，準備緊筆記...' : '侍酒師正在為您尋找完美搭配...'}</p>
            </motion.div>
          )}

          {winePairingData && (
            <motion.div
              key="pairing-results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-neutral-900/50 border border-neutral-800/80 rounded-3xl p-8 md:p-10 backdrop-blur-sm space-y-6"
            >
              <div className="flex items-center gap-3">
                <ChefHat className="w-8 h-8 text-wine-400" />
                <h2 className="text-3xl font-serif text-white">配餐推薦</h2>
              </div>
              <div className="space-y-4">
                <p className="text-neutral-400">為您的菜色 <span className="text-white font-semibold">"{query}"</span> 推薦以下酒款：</p>
                
                {winePairingData.refusalReason ? (
                  <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-800">
                    <p className="text-neutral-300 italic leading-relaxed">{winePairingData.refusalReason}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {winePairingData.recommendations?.map((rec, index) => (
                      <div key={index} className="bg-neutral-950 rounded-2xl p-6 border border-neutral-800 space-y-4">
                        {/* ✅ 加入 gap-4 並為右側標籤加入 shrink-0 whitespace-nowrap 防變形 */}
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="text-2xl font-serif text-wine-400 mb-1">{rec.wine_name}</h3>
                            <p className="text-neutral-300 font-medium">{rec.winery} ({rec.vintage})</p>
                          </div>
                          <div className="shrink-0 whitespace-nowrap bg-wine-950/50 px-3 py-1 rounded-full border border-wine-900/50 text-xs font-semibold tracking-wider uppercase text-wine-400">
                            {rec.wineType ? getWineTypeName(rec.wineType) : '葡萄酒'}
                          </div>
                        </div>
                        
                        <p className="text-neutral-400 italic leading-relaxed border-b border-neutral-800 pb-4">"{rec.reason}"</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
                          {rec.region && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {rec.region}</span>}
                          {rec.rating && <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-wine-400" /> {rec.rating}/100</span>}
                          {rec.estimatedPriceHKD && <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> {rec.estimatedPriceHKD}</span>}
                          {rec.decantingTime && <span className="flex items-center gap-1.5"><Wind className="w-4 h-4" /> 醒酒: {rec.decantingTime}</span>}
                        </div>
                        
                        {rec.grapeVarieties && rec.grapeVarieties.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {rec.grapeVarieties.map((grape, i) => (
                              <span key={i} className="text-xs font-medium text-white bg-neutral-800/80 px-2 py-1 rounded border border-neutral-700/50">
                                {grape}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                
                <div className="w-full md:w-1/3 shrink-0 relative z-10 flex flex-col items-center gap-6">
                  <div className="relative w-48 h-72 md:w-56 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800/50 bg-neutral-950">
                    <DecantingTimeLogo decantingTime={wineData.decantingTime} wineType={wineData.wineType} className="w-full h-full" />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                    
                    {/* ✅ 加入 shrink-0 whitespace-nowrap 防變形 */}
                    <div className="shrink-0 whitespace-nowrap absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-sm font-medium tracking-wider text-white">
                      {getWineTypeName(wineData.wineType)}
                    </div>

                    {/* Country Flag */}
                    {(wineData.countryCode || getFallbackCountryCode(wineData.region)) && (
                      <div className="absolute top-3 right-3 shadow-lg overflow-hidden rounded-sm border border-white/20 bg-black/20">
                        <img 
                          src={`https://flagcdn.com/w80/${(wineData.countryCode || getFallbackCountryCode(wineData.region))?.toLowerCase()}.png`} 
                          alt="Country Flag" 
                          className="w-12 h-auto object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {wineData.mapSearchQuery && (
                    <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800/50 bg-neutral-950 group">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(wineData.mapSearchQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 grayscale group-hover:grayscale-0"
                      ></iframe>
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-medium tracking-wider text-white pointer-events-none">
                        酒莊位置
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-3 mb-4 text-xs font-semibold tracking-wider uppercase text-wine-400">
                    {/* ✅ 加入 shrink-0 whitespace-nowrap 防變形 */}
                    <span className="shrink-0 whitespace-nowrap flex items-center gap-1.5 bg-wine-950/50 px-3 py-1 rounded-full border border-wine-900/50">
                      <MapPin className="w-3.5 h-3.5" /> {wineData.region}
                    </span>
                    <span className="shrink-0 whitespace-nowrap flex items-center gap-1.5 bg-neutral-800/50 px-3 py-1 rounded-full border border-neutral-700/50 text-neutral-300">
                      <Calendar className="w-3.5 h-3.5" /> {wineData.vintage}
                    </span>
                    {wineData.estimatedPriceHKD && (
                      <span className="shrink-0 whitespace-nowrap flex items-center gap-1.5 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-900/50 text-emerald-400">
                        <Tag className="w-3.5 h-3.5" /> Wine-Searcher 參考售價: {wineData.estimatedPriceHKD}
                      </span>
                    )}
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

                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-neutral-800/50 flex items-center justify-center border border-neutral-700/50 shrink-0">
                        <Grape className="w-6 h-6 text-neutral-400" />
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xs text-neutral-400 uppercase tracking-widest mb-1">葡萄品種</div>
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {(isGrapesExpanded ? wineData.grapeVarieties : wineData.grapeVarieties.slice(0, 2)).map((grape, i) => (
                            <span key={i} className="text-sm font-medium text-white bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700/50">
                              {grape}
                            </span>
                          ))}
                          {wineData.grapeVarieties.length > 2 && (
                            <button 
                              onClick={() => setIsGrapesExpanded(!isGrapesExpanded)}
                              className="text-xs font-medium text-wine-400 hover:text-wine-300 bg-wine-950/30 px-2 py-0.5 rounded border border-wine-900/50 transition-colors"
                            >
                              {isGrapesExpanded ? '收起' : `+${wineData.grapeVarieties.length - 2} 更多`}
                            </button>
                          )}
                        </div>
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

              {/* Analysis Radar Chart */}
              {wineData.analysis && (
                <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-3xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Activity className="w-6 h-6 text-wine-400" />
                    <h3 className="font-serif text-2xl text-white">五角形分析</h3>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                        { subject: '酸度', A: wineData.analysis.acidity, fullMark: 10 },
                        { subject: '甜度', A: wineData.analysis.sweetness, fullMark: 10 },
                        { subject: '酒體', A: wineData.analysis.body, fullMark: 10 },
                        { subject: '複雜度', A: wineData.analysis.complexity, fullMark: 10 },
                        { subject: '平衡', A: wineData.analysis.balance, fullMark: 10 },
                      ]}>
                        <PolarGrid stroke="#404040" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#a3a3a3', fontSize: 14 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                        <Radar name="Wine Analysis" dataKey="A" stroke="#9f1239" fill="#9f1239" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

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