"use client";

import { useState, useEffect } from "react";
import { generateContent, getGenHistory } from "@/actions/generation-tools";
import { addCredits } from "@/actions/credits"; 
import { toast } from "sonner";
import { Loader2, Video, Image as ImageIcon, Sparkles, CreditCard, Coins, Download, History, RefreshCcw } from "lucide-react";

export default function GenAISelector({ userCredits = 0 }) {
  const [activeTab, setActiveTab] = useState("create"); // 'create' | 'history'
  const [historyList, setHistoryList] = useState([]);
  
  const [credits, setCredits] = useState(userCredits);
  const [selectedType, setSelectedType] = useState(null); 
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
    
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [buying, setBuying] = useState(false);

  // ✅ Load History when tab changes
  useEffect(() => {
    if (activeTab === "history") {
        fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
        const data = await getGenHistory();
        setHistoryList(data);
    } catch (err) {
        console.error("Failed to load history");
    }
  };

  const handleGenerate = async () => {
    if (!selectedType) return toast.error("Select a type!");
    if (!prompt) return toast.error("Enter a prompt!");    
    const cost = selectedType === "IMAGE" ? 1 : 5;
    if (credits < cost) {
        setShowPaymentModal(true); 
        return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await generateContent(prompt, selectedType);
      
      if (response.limitReached) {
        setShowPaymentModal(true);
        setLoading(false);
        return;
      }

      if (!response.success) {
        toast.error(response.error || "Generation failed");
        setLoading(false);
        return;
      }

      setResult(response.data);
      setCredits(response.remainingCredits); 
      toast.success(`${selectedType} generated!`);
      
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleBuyCredits = async (amount) => {
    setBuying(true);
    const response = await addCredits(amount);
    
    if (response.success) {
        setCredits(response.newBalance);
        setShowPaymentModal(false);
        toast.success(`Purchased ${amount} Credits!`);
    } else {
        toast.error("Purchase failed");
    }
    setBuying(false);
  };

  const handleDownload = (url, type) => {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = type === "IMAGE" ? "generated-image.png" : "generated-video.mp4";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative">
            
      <div className="p-6 border rounded-xl bg-card shadow-sm space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Studio
          </h2>
          <div className="flex items-center gap-3">
             <div className="text-sm font-medium bg-secondary px-3 py-1 rounded-full border flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span>{credits} Credits</span>
             </div>
             <button 
                onClick={() => setShowPaymentModal(true)}
                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-all"
             >
                Get More
             </button>
          </div>
        </div>

        {/* ✅ Tabs Navigation */}
        <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg">
            <button
                onClick={() => setActiveTab("create")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "create" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-background/50"}`}
            >
                Create New
            </button>
            <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "history" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-background/50"}`}
            >
                My History
            </button>
        </div>
        
        {/* === CREATE TAB === */}
        {activeTab === "create" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => { setSelectedType("IMAGE"); setResult(null); }}
                        className={`p-6 border-2 rounded-xl flex flex-col items-center gap-3 transition-all ${
                        selectedType === "IMAGE" 
                            ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-md" 
                            : "border-border hover:border-blue-200 hover:bg-gray-50"
                        }`}
                    >
                        <div className={`p-3 rounded-full ${selectedType === "IMAGE" ? "bg-blue-100" : "bg-gray-100"}`}>
                            <ImageIcon className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                            <span className="font-semibold block">Generate Image</span>
                            <span className="text-xs text-muted-foreground">Cost: 1 Credit</span>
                        </div>
                    </button>

                    <button
                        onClick={() => { setSelectedType("VIDEO"); setResult(null); }}
                        className={`p-6 border-2 rounded-xl flex flex-col items-center gap-3 transition-all ${
                        selectedType === "VIDEO" 
                            ? "border-purple-500 bg-purple-50/50 text-purple-700 shadow-md" 
                            : "border-border hover:border-purple-200 hover:bg-gray-50"
                        }`}
                    >
                        <div className={`p-3 rounded-full ${selectedType === "VIDEO" ? "bg-purple-100" : "bg-gray-100"}`}>
                            <Video className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                            <span className="font-semibold block">Generate Video</span>
                            <span className="text-xs text-muted-foreground">Cost: 5 Credits</span>
                        </div>
                    </button>
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">Your Prompt</label>
                    <textarea
                        className="w-full p-4 border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px] resize-none"
                        placeholder={selectedType ? `Describe the ${selectedType.toLowerCase()}...` : "Select a type above to start..."}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={!selectedType || loading}
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading || !selectedType || !prompt}
                    className="w-full py-4 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 hover:opacity-90 transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/25"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {loading ? "Generating..." : "Generate Content"}
                </button>
            
                {result && (
                    <div className="mt-8 p-4 border rounded-xl bg-muted/30 animate-in fade-in zoom-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Result</h3>
                            <button
                                onClick={() => handleDownload(result, selectedType)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-all shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                        <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
                            {selectedType === "IMAGE" ? (
                                <img src={result} alt="Generated" className="w-full h-auto object-cover max-h-[500px]" />
                            ) : (
                                <video src={result} controls autoPlay loop className="w-full h-auto max-h-[500px]" />
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* === HISTORY TAB === */}
        {activeTab === "history" && (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <History className="w-4 h-4" /> Recent Creations
                    </h3>
                    <button onClick={fetchHistory} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        <RefreshCcw className="w-3 h-3" /> Refresh
                    </button>
                </div>

                {historyList.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                        <p>No history yet. Start creating!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {historyList.map((item) => (
                            <div key={item.id} className="border rounded-lg p-3 bg-muted/20 hover:bg-muted/40 transition-all">
                                <div className="aspect-video relative rounded-md overflow-hidden bg-black/5 mb-3 border">
                                    {item.type === "IMAGE" ? (
                                        <img src={item.content} alt={item.prompt} className="w-full h-full object-cover" />
                                    ) : (
                                        <video src={item.content} controls className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 h-8 mb-2 font-medium">
                                    {item.prompt}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-background px-2 py-1 rounded border">
                                        {item.type}
                                    </span>
                                    <button 
                                        onClick={() => handleDownload(item.content, item.type)}
                                        className="p-2 hover:bg-background rounded-full border bg-background shadow-sm text-primary"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
        )}
      </div>
  
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
            <div className="bg-background p-8 rounded-2xl shadow-2xl max-w-md w-full border relative">
                <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >✕</button>
                
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold">Top Up Credits</h3>
                    <p className="text-muted-foreground mt-2">
                        You need more credits to generate {selectedType === "VIDEO" ? "Video" : "Images"}.
                    </p>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={() => handleBuyCredits(10)}
                        disabled={buying}
                        className="w-full p-4 border rounded-xl hover:bg-secondary transition-all flex justify-between items-center group"
                    >
                        <div className="flex items-center gap-3">
                            <Coins className="w-5 h-5 text-yellow-500" />
                            <span className="font-semibold">10 Credits</span>
                        </div>
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            $5.00
                        </span>
                    </button>

                    <button 
                        onClick={() => handleBuyCredits(50)}
                        disabled={buying}
                        className="w-full p-4 border-2 border-primary/20 rounded-xl bg-primary/5 hover:bg-primary/10 transition-all flex justify-between items-center relative"
                    >
                        <div className="absolute top-0 right-0 bg-primary text-[10px] text-primary-foreground px-2 py-0.5 rounded-bl-lg">POPULAR</div>
                        <div className="flex items-center gap-3">
                            <Coins className="w-5 h-5 text-yellow-500" />
                            <span className="font-semibold">50 Credits</span>
                        </div>
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                            $20.00
                        </span>
                    </button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-6">
                    This is a secure demo transaction. No actual card required.
                </p>
            </div>
        </div>
      )}

    </div>
  );
}