import React, { useState, useEffect } from 'react';
import { extractLaundryData } from './services/geminiService';
import { LaundryOrderResult, Step } from './types';
import FileUpload from './components/FileUpload';
import ResultsView from './components/ResultsView';
import HistoryModal from './components/HistoryModal';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.INPUT);
  const [serviceName, setServiceName] = useState('');
  const [weightPhoto, setWeightPhoto] = useState<File | null>(null);
  const [customerPhoto, setCustomerPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LaundryOrderResult | null>(null);
  
  // Initialize history from localStorage
  const [history, setHistory] = useState<LaundryOrderResult[]>(() => {
    try {
      const saved = localStorage.getItem('laundryTrackerHistory');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load history from local storage", e);
    }
    return [];
  });

  const [selectedOrder, setSelectedOrder] = useState<LaundryOrderResult | null>(null);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTimestamps, setSelectedTimestamps] = useState<Set<number>>(new Set());

  // Save to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem('laundryTrackerHistory', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to local storage", e);
      // In a production app, handle QuotaExceededError specifically
    }
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !weightPhoto || !customerPhoto) {
      setError("Please complete all fields.");
      return;
    }

    setStep(Step.PROCESSING);
    setError(null);

    try {
      const data = await extractLaundryData(serviceName, weightPhoto, customerPhoto);
      setResult(data);
      setStep(Step.RESULT);
    } catch (err) {
      console.error(err);
      setError("Failed to process the order. Please ensure the API key is valid and try again.");
      setStep(Step.INPUT);
    }
  };

  const handleSaveAndReset = (finalData: LaundryOrderResult) => {
    setHistory(prev => [finalData, ...prev]);
    setServiceName('');
    setWeightPhoto(null);
    setCustomerPhoto(null);
    setResult(null);
    setError(null);
    setStep(Step.INPUT);
  };

  const handleDiscard = () => {
    setResult(null);
    setStep(Step.INPUT);
  };

  // Selection Logic
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedTimestamps(new Set());
  };

  const toggleSelection = (timestamp: number) => {
    const next = new Set(selectedTimestamps);
    if (next.has(timestamp)) {
      next.delete(timestamp);
    } else {
      next.add(timestamp);
    }
    setSelectedTimestamps(next);
  };

  const deleteSelected = () => {
    if (selectedTimestamps.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedTimestamps.size} selected items?`)) {
      setHistory(prev => prev.filter(item => !selectedTimestamps.has(item.timestamp)));
      setIsSelectionMode(false);
      setSelectedTimestamps(new Set());
    }
  };

  const exportToCSV = () => {
    if (history.length === 0) return;

    const headers = [
      "Date",
      "Time",
      "Laundry Service",
      "Order Number",
      "Customer Name",
      "Delivery Address",
      "Weight (kg)",
      "Price (EUR)"
    ];

    const csvRows = [headers.join(",")];

    history.forEach(row => {
      const date = new Date(row.timestamp);
      const values = [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        `"${(row.laundry_service_name || '').replace(/"/g, '""')}"`,
        `"${(row.shopify_order_number || '').replace(/"/g, '""')}"`,
        `"${(row.customer_name || '').replace(/"/g, '""')}"`,
        `"${(row.delivery_address || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        row.laundry_weight_kg,
        (row.price || 0).toFixed(2)
      ];
      csvRows.push(values.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laundry-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Group history by Month -> Laundry Service
  // Structure: { 'YYYY-MM': { label: 'Month Year', services: { 'normalized_name': { displayName: 'Name', records: [...] } } } }
  const groupedHistory = history.reduce((acc, curr) => {
    const date = new Date(curr.timestamp);
    const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!acc[sortKey]) {
      acc[sortKey] = {
        label: monthLabel,
        services: {}
      };
    }

    const rawName = curr.laundry_service_name.trim();
    const normalizedServiceKey = rawName.toLowerCase();

    if (!acc[sortKey].services[normalizedServiceKey]) {
      // Use the casing from the most recent entry (first encountered) as display name
      acc[sortKey].services[normalizedServiceKey] = {
        displayName: rawName,
        records: []
      };
    }
    acc[sortKey].services[normalizedServiceKey].records.push(curr);
    return acc;
  }, {} as Record<string, { label: string, services: Record<string, { displayName: string, records: LaundryOrderResult[] }> }>);

  const sortedMonthKeys = Object.keys(groupedHistory).sort().reverse();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">LaundryTracker</span>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            Commercial Batch Processor v2.2
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Error Notification */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Input Form */}
        {step === Step.INPUT && (
          <div className="max-w-3xl mx-auto animate-fade-in mb-16">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900">New Batch Entry</h1>
              <p className="mt-2 text-lg text-gray-600">Upload photos of the scale and shipping label to record weight.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl overflow-hidden">
              <div className="p-8 space-y-8">
                
                {/* 1. Laundry Service Name */}
                <div className="border-b border-gray-100 pb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                    Laundry Service
                  </h2>
                  <div>
                    <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-1">
                      Laundry Service Name
                    </label>
                    <input
                      type="text"
                      id="serviceName"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="e.g. Sparkle Cleaners, QuickWash Pro"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                    />
                  </div>
                </div>

                {/* 2. Weight Photo */}
                <div className="border-b border-gray-100 pb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                    Weight Verification
                  </h2>
                  <FileUpload
                    id="weight"
                    label="Upload Scale Photo"
                    subLabel="Ensure the analog dial is clearly visible and well-lit."
                    onFileSelect={setWeightPhoto}
                  />
                </div>

                {/* 3. Customer Data */}
                <div className="pb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                    Customer Details
                  </h2>
                  <FileUpload
                    id="customer"
                    label="Upload Shipping Label"
                    subLabel="Capture the entire label for best OCR results."
                    onFileSelect={setCustomerPhoto}
                  />
                </div>

              </div>

              <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={!serviceName || !weightPhoto || !customerPhoto}
                  className={`px-6 py-3 rounded-lg font-semibold text-white shadow-md transition-all 
                    ${(!serviceName || !weightPhoto || !customerPhoto) 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'}`}
                >
                  Process Batch
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Processing State */}
        {step === Step.PROCESSING && (
          <div className="max-w-xl mx-auto text-center pt-20 animate-pulse">
            <div className="inline-block relative">
              <div className="h-24 w-24 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              </div>
            </div>
            <h2 className="mt-8 text-2xl font-bold text-gray-900">Analyzing Batch...</h2>
            <p className="mt-2 text-gray-600">Reading analog scale and extracting customer data.</p>
          </div>
        )}

        {/* Results View */}
        {step === Step.RESULT && result && (
          <ResultsView 
            data={result} 
            onSave={handleSaveAndReset} 
            onDiscard={handleDiscard}
          />
        )}

        {/* Saved History - Grouped by Month */}
        {sortedMonthKeys.length > 0 && step === Step.INPUT && (
          <div className="max-w-5xl mx-auto mt-16 animate-fade-in-up">
            <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-2">
              <h2 className="text-2xl font-bold text-gray-900">Saved Batches</h2>
              <div className="flex gap-2">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Export CSV
                </button>
                {isSelectionMode && selectedTimestamps.size > 0 && (
                  <button 
                    onClick={deleteSelected}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    Delete ({selectedTimestamps.size})
                  </button>
                )}
                <button 
                  onClick={toggleSelectionMode}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    isSelectionMode 
                    ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-700" 
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {isSelectionMode ? 'Cancel Selection' : 'Select / Delete'}
                </button>
              </div>
            </div>
            
            {sortedMonthKeys.map(monthKey => {
              const { label, services } = groupedHistory[monthKey];
              
              return (
                <div key={monthKey} className="mb-12">
                  <h3 className="text-lg font-semibold text-gray-600 mb-4 sticky top-16 bg-gray-50/95 py-2 backdrop-blur-sm z-0 inline-block px-3 rounded-md">
                    {label}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {Object.values(services).map(({ displayName, records }) => {
                      const totalWeight = records.reduce((sum, record) => {
                        const val = Number(record.laundry_weight_kg) || 0;
                        return sum + val;
                      }, 0);

                      const totalPrice = records.reduce((sum, record) => {
                         return sum + (record.price || 0);
                      }, 0);

                      return (
                        <div key={`${monthKey}-${displayName}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-lg truncate">{displayName}</h3>
                            <span className="bg-gray-200 text-gray-700 py-1 px-3 rounded-full text-xs font-semibold whitespace-nowrap ml-2">
                              {records.length} records
                            </span>
                          </div>
                          <ul className="divide-y divide-gray-100 flex-grow">
                            {records.map((record, idx) => {
                              const isSelected = selectedTimestamps.has(record.timestamp);
                              return (
                                <li 
                                  key={record.timestamp} 
                                  onClick={() => isSelectionMode ? toggleSelection(record.timestamp) : setSelectedOrder(record)}
                                  className={`px-6 py-4 transition-colors cursor-pointer group flex items-center gap-4 ${
                                    isSelectionMode && isSelected 
                                      ? 'bg-indigo-50/70' 
                                      : 'hover:bg-indigo-50'
                                  }`}
                                >
                                  {isSelectionMode && (
                                    <div className="flex-shrink-0">
                                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                        isSelected 
                                          ? 'bg-indigo-600 border-indigo-600' 
                                          : 'bg-white border-gray-300'
                                      }`}>
                                        {isSelected && (
                                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex-grow">
                                    <div className="flex justify-between items-center mb-2">
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-indigo-700 text-lg group-hover:text-indigo-800">{record.laundry_weight_kg} kg</span>
                                        <span className="text-sm font-medium text-gray-500">€{record.price?.toFixed(2)}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-xs font-bold text-gray-600 block">
                                          {new Date(record.timestamp).toLocaleDateString()}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                          {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                      <div className="text-sm text-gray-600">
                                        <span className="font-medium text-gray-900 block">{record.customer_name || 'No Name'}</span>
                                        <span className="text-xs text-gray-500">#{record.shopify_order_number || 'No Order #'}</span>
                                      </div>
                                      {!isSelectionMode && (
                                        <span className="text-indigo-500 text-xs font-semibold flex items-center">
                                          View Details
                                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                          <div className="bg-gray-100 px-6 py-4 border-t border-gray-200 mt-auto">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-600">Total Weight</span>
                              <span className="text-lg font-bold text-gray-800">{totalWeight.toFixed(1)} kg</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">Total Price</span>
                              <span className="text-xl font-bold text-indigo-800">€{totalPrice.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* History Details Modal */}
        <HistoryModal 
          data={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
        
      </main>
    </div>
  );
};

export default App;