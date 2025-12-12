import React from 'react';
import { LaundryOrderResult } from '../types';

interface HistoryModalProps {
  data: LaundryOrderResult | null;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
        <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-3xl w-full">
          
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white" id="modal-title">
                {data.laundry_service_name}
              </h3>
              <p className="text-indigo-100 text-sm mt-1">
                {new Date(data.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-indigo-700 hover:bg-indigo-800 text-white rounded-full p-2 transition-colors focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-6 space-y-8 max-h-[80vh] overflow-y-auto">
            
            {/* Key Stats */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Weight</p>
                <p className="text-4xl font-bold text-gray-900">{data.laundry_weight_kg} <span className="text-lg text-gray-500 font-medium">kg</span></p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Price</p>
                <p className="text-4xl font-bold text-indigo-600">€{data.price?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Order Number</p>
                <p className="text-2xl font-bold text-gray-900">{data.shopify_order_number || "N/A"}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Customer Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{data.customer_name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="font-medium text-gray-900 whitespace-pre-line">{data.delivery_address || "Unknown"}</p>
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Captured Images</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 text-center">Scale Verification</p>
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {data.weight_image_src ? (
                      <img 
                        src={data.weight_image_src} 
                        alt="Scale reading" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 text-center">Shipping Label</p>
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {data.customer_image_src ? (
                      <img 
                        src={data.customer_image_src} 
                        alt="Customer Label" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;