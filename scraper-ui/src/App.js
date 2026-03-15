import React, { useState, useEffect } from "react";

function App() {
  const [mode, setMode] = useState("single");
  const [url, setUrl] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRawImages, setShowRawImages] = useState(false);
  const [showRawVideos, setShowRawVideos] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkData, setBulkData] = useState(null);

  useEffect(() => {
    console.log(
      "%c SpectreData %c Developed by YourName ",
      "color: #fff; background: #0f172a; padding: 5px 10px; border-radius: 5px 0 0 5px; font-weight: bold;",
      "color: #fff; background: #3b82f6; padding: 5px 10px; border-radius: 0 5px 5px 0;"
    );
  }, []);

  const handleSingleScrape = async () => {
    if (!url) return;
    setLoading(true); setError(null); setData(null); setShowRawImages(false); setShowRawVideos(false);
    try {
      const response = await fetch(`http://localhost:8080/api/scrape?url=${encodeURIComponent(url)}`);
      const result = await response.json();
      if (result.error) setError(result.error);
      else setData(result);
    } catch (err) { setError("Backend connection failed. Is the Java server running?"); }
    finally { setLoading(false); }
  };

  const handleBulkScrape = async () => {
    if (!bulkUrls) return;
    setLoading(true); setError(null); setBulkData(null);
    const urlArray = bulkUrls.split("\n").map((u) => u.trim()).filter((u) => u !== "");
    try {
      const response = await fetch(`http://localhost:8080/api/bulk-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(urlArray),
      });
      const result = await response.json();
      setBulkData(result);
    } catch (err) { setError("Bulk extraction failed."); }
    finally { setLoading(false); }
  };

  const exportToCSV = () => {
    if (!bulkData) return;
    let csvContent = "Source URL,Found Video URLs\n";
    bulkData.forEach((item) => {
      csvContent += `"${item.targetUrl}","${item.videoUrls?.join(" | ") || "None"}"\n`;
    });
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `SpectreData_Export.csv`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-16 font-sans text-slate-900">
      
      {/* BRAND HEADER */}
      <header className="text-center mb-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-2">
          Spectre<span className="text-blue-500">Data</span>
        </h1>
        <p className="text-lg text-slate-500 font-medium">Advanced Stealth Data Extraction Engine</p>
      </header>

      {/* TABS */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-slate-200 p-1 rounded-xl">
          <button 
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${mode === 'single' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setMode("single")}
          >
            Single Search
          </button>
          <button 
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${mode === 'bulk' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setMode("bulk")}
          >
            Bulk Hunter
          </button>
        </div>
      </div>

      <main className="flex flex-col gap-6">
        
        {/* INPUT CARDS */}
        {mode === "single" ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-slide-down">
            <div className="flex gap-3 w-full">
              <input 
                type="text" 
                placeholder="Paste product URL here..." 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                disabled={loading} 
                className="flex-1 min-w-0 px-5 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-base bg-slate-50 focus:bg-white"
              />
              <button 
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold whitespace-nowrap transition-all disabled:opacity-70 disabled:cursor-not-allowed" 
                onClick={handleSingleScrape} 
                disabled={loading}
              >
                {loading ? "Extracting..." : "Run Spectre"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-slide-down">
            <div className="flex flex-col gap-4 w-full">
              <textarea 
                placeholder="Paste multiple URLs here (one per line)..." 
                value={bulkUrls} 
                onChange={(e) => setBulkUrls(e.target.value)} 
                disabled={loading} 
                className="w-full min-h-[160px] p-5 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-base bg-slate-50 focus:bg-white resize-y"
              />
              <button 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed" 
                onClick={handleBulkScrape} 
                disabled={loading || !bulkUrls}
              >
                {loading ? "Processing Bulk List..." : "Start Bulk Scrape"}
              </button>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center animate-pulse">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Spectre is bypassing anti-bot measures and extracting data...</p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* --- SINGLE RESULT VIEW --- */}
        {data && !loading && mode === "single" && (
          <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 animate-slide-down">
            
            <div className="flex justify-between items-start gap-5 mb-4">
              <h2 className="text-2xl font-bold text-slate-900 leading-tight m-0">{data.title}</h2>
              <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg font-extrabold text-xl whitespace-nowrap">
                {data.price}
              </div>
            </div>
            
            <div className="flex gap-4 pb-6 border-b border-slate-100 mb-6 text-sm">
              <span className="text-slate-500"><strong className="text-slate-700">Brand:</strong> {data.brand || "Generic"}</span>
              <span className="text-emerald-500 font-semibold">✓ Data Extracted</span>
            </div>

            {/* IMAGE ASSETS */}
            {data.imageUrls && data.imageUrls.length > 0 && (
              <div className="mb-8">
                <div className="relative w-full max-w-sm mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5 flex justify-center items-center">
                  <img src={data.imageUrls[0]} alt="Product Hero" className="w-full max-h-[300px] object-contain rounded-lg" />
                  {data.imageUrls.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold">
                      +{data.imageUrls.length - 1} Images
                    </div>
                  )}
                </div>

                <div className="w-full">
                  <button 
                    className="w-full bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-600 px-4 py-3 rounded-xl font-semibold transition-all"
                    onClick={() => setShowRawImages(!showRawImages)}
                  >
                    {showRawImages ? "Hide Image Links" : "View All Image Assets"}
                  </button>
                  
                  {showRawImages && (
                    <div className="flex flex-col gap-2 mt-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-slide-down">
                      {data.imageUrls.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noreferrer" className="flex justify-between items-center p-3.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold text-sm hover:border-blue-500 hover:-translate-y-0.5 transition-all shadow-sm hover:shadow">
                          <span>🔗 Image Asset {i + 1}</span>
                          <span className="text-slate-400">↗</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIDEO ASSETS */}
            {data.videoUrls && data.videoUrls.length > 0 && (
              <div className="w-full">
                <button 
                  className="w-full bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-600 px-4 py-3 rounded-xl font-semibold transition-all"
                  onClick={() => setShowRawVideos(!showRawVideos)}
                >
                  {showRawVideos ? "Hide Video Links" : `View ${data.videoUrls.length} Video Assets`}
                </button>
                
                {showRawVideos && (
                  <div className="flex flex-col gap-2 mt-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-slide-down">
                    {data.videoUrls.map((v, i) => (
                      <a key={i} href={v} target="_blank" rel="noreferrer" className="flex justify-between items-center p-3.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold text-sm hover:border-blue-500 hover:-translate-y-0.5 transition-all shadow-sm hover:shadow">
                        <span>🎬 Video Asset {i + 1}</span>
                        <span className="text-slate-400">↗</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- BULK RESULT VIEW --- */}
        {bulkData && !loading && mode === "bulk" && (
          <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 animate-slide-down">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Bulk Extraction Complete</h3>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm" onClick={exportToCSV}>
                💾 Download CSV
              </button>
            </div>
            
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Source URL</th>
                    <th className="p-4 font-semibold">Extracted Video Assets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bulkData.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <a href={item.targetUrl} target="_blank" rel="noreferrer" className="text-slate-700 font-medium hover:text-blue-600 hover:underline">
                          Source Target {i + 1}
                        </a>
                      </td>
                      <td className="p-4">
                        {item.videoUrls?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {item.videoUrls.map((v, idx) => (
                              <a key={idx} href={v} target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white px-3 py-1 rounded-full text-xs font-bold transition-all">
                                Video {idx + 1}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm italic">No videos found</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-16 pt-8 border-t border-slate-200 text-center">
        <p className="font-bold text-slate-900 text-sm">© 2024 YourName</p>
        <p className="text-slate-500 text-xs font-medium mt-1">SpectreData Engine • v1.3 PRO</p>
      </footer>
    </div>
  );
}

export default App;