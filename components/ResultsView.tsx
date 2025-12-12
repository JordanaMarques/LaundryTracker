import React, { useState, useEffect } from 'react';
import { LaundryOrderResult } from '../types';
import { calculatePrice } from '../services/geminiService';

interface ResultsViewProps {
  data: LaundryOrderResult;
  onSave: (finalData: LaundryOrderResult) => void;
  onDiscard: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ data, onSave, onDiscard }) => {
  // Weight editing state
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [editedWeight, setEditedWeight] = useState<string>(data.laundry_weight_kg.toString());
  const [currentPrice, setCurrentPrice] = useState<number>(data.price || 0);
  
  // Customer details editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(data.customer_name);
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState(data.delivery_address);

  const isHighConfidence = data.extraction_confidence_score > 0.8;
  const isMediumConfidence = data.extraction_confidence_score > 0.5 && data.extraction_confidence_score <= 0.8;

  // Recalculate price when edited weight changes
  useEffect(() => {
    const weight = parseFloat(editedWeight);
    if (!isNaN(weight)) {
      // Use shared pricing logic
      setCurrentPrice(calculatePrice(weight));
    } else {
      setCurrentPrice(0);
    }
  }, [editedWeight]);

  const handleSave = () => {
    // Construct the final object with potentially edited values
    const finalData: LaundryOrderResult = {
      ...data,
      laundry_weight_kg: parseFloat(editedWeight) || 0, // Ensure it's a number
      price: currentPrice,
      customer_name: editedName,
      delivery_address: editedAddress
    };
    onSave(finalData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      
      {/* Status Banner */}
      <div className={`p-4 rounded-lg border-l-4 shadow-sm flex items-start space-x-3 ${
        isHighConfidence ? 'bg-green-50 border-green-500 text-green-700' :
        isMediumConfidence ? 'bg-yellow-50 border-yellow-500 text-yellow-700' :
        'bg-red-50 border-red-500 text-red-700'
      }`}>
        <div className="flex-shrink-0 mt-0.5">
          {isHighConfidence ? (
            <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium">
            AI Extraction Confidence: {(data.extraction_confidence_score * 100).toFixed(0)}%
          </h3>
          <p className="text-sm mt-1 opacity-90">
            {isHighConfidence ? "The data was extracted with high confidence." : "Please review the extracted data manually."}
          </p>
        </div>
      </div>

      {/* Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Weight & Price Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden relative group">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white h-full flex flex-col justify-between">
             <div>
               <div className="flex justify-between items-start">
                 <p className="text-indigo-100 font-medium text-sm tracking-wider uppercase">Measured Weight</p>
                 {!isEditingWeight && (
                   <button 
                     onClick={() => setIsEditingWeight(true)}
                     className="text-indigo-200 hover:text-white transition-colors"
                     title="Edit Weight"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                   </button>
                 )}
               </div>

               {isEditingWeight ? (
                 <div className="mt-2 flex items-center space-x-2">
                   <input 
                     type="number" 
                     value={editedWeight}
                     onChange={(e) => setEditedWeight(e.target.value)}
                     className="text-4xl font-bold text-gray-900 rounded-lg px-3 py-1 w-full max-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                     step="0.1"
                     autoFocus
                   />
                   <span className="text-2xl font-medium text-indigo-200">kg</span>
                   <button 
                     onClick={() => setIsEditingWeight(false)}
                     className="ml-2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                   </button>
                 </div>
               ) : (
                 <h2 className="text-5xl font-bold mt-2">
                   {editedWeight} <span className="text-2xl font-medium text-indigo-200">kg</span>
                 </h2>
               )}
               <p className="mt-2 text-sm text-indigo-100 mb-6">
                 {isEditingWeight ? "Enter correct value manually" : "Extracted from analog scale"}
               </p>
             </div>

             <div className="border-t border-indigo-500/30 pt-4">
               <p className="text-indigo-200 text-sm mb-1 uppercase tracking-wider">Price</p>
               <p className="text-3xl font-bold">€ {currentPrice.toFixed(2)}</p>
             </div>
          </div>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Customer Details</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Service Provider</dt>
              <dd className="mt-1 text-base font-semibold text-indigo-600">{data.laundry_service_name}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Shopify Order #</dt>
              <dd className="mt-1 text-base font-semibold text-gray-900">{data.shopify_order_number || "N/A"}</dd>
            </div>

            {/* Customer Name */}
            <div>
              <div className="flex justify-between items-center">
                <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
                {!isEditingName && (
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Edit Name"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                )}
              </div>
              {isEditingName ? (
                <div className="mt-1 flex items-center space-x-2">
                   <input 
                     type="text" 
                     value={editedName}
                     onChange={(e) => setEditedName(e.target.value)}
                     className="text-base text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full border px-3 py-1"
                   />
                   <button 
                     onClick={() => setIsEditingName(false)}
                     className="text-green-600 hover:text-green-700 p-1 bg-green-50 rounded-md"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                   </button>
                </div>
              ) : (
                <dd className="mt-1 text-base text-gray-900">{editedName || "N/A"}</dd>
              )}
            </div>

            {/* Delivery Address */}
            <div>
              <div className="flex justify-between items-center">
                <dt className="text-sm font-medium text-gray-500">Delivery Address</dt>
                {!isEditingAddress && (
                  <button 
                    onClick={() => setIsEditingAddress(true)}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Edit Address"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                )}
              </div>
              {isEditingAddress ? (
                <div className="mt-1 flex items-start space-x-2">
                   <textarea 
                     value={editedAddress}
                     onChange={(e) => setEditedAddress(e.target.value)}
                     rows={3}
                     className="text-base text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full border px-3 py-2 resize-none"
                   />
                   <button 
                     onClick={() => setIsEditingAddress(false)}
                     className="text-green-600 hover:text-green-700 p-1 bg-green-50 rounded-md mt-1"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                   </button>
                </div>
              ) : (
                <dd className="mt-1 text-base text-gray-900 whitespace-pre-wrap">{editedAddress || "N/A"}</dd>
              )}
            </div>
          </dl>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
        <button
          onClick={onDiscard}
          className="px-6 py-3 bg-white border border-gray-300 shadow-sm text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Discard & Retry
        </button>
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-blue-600 border border-transparent shadow-sm text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save & Process New Batch
        </button>
      </div>

    </div>
  );
};

export default ResultsView;