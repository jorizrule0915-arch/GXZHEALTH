import React from 'react';
import { Package, ArrowLeft, Mail, Globe, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const RefundPolicy: React.FC = () => {
  const lastUpdated = "March 14, 2026";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white py-20 pt-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Package className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-medium">Customer Care</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Refund & Return <span className="text-teal-400">Policy</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            At GXZ Health, we stand behind the quality of our products and strive to ensure every customer has a positive experience.
          </p>
          <p className="text-sm text-slate-400 mt-4">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Introduction Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <p className="text-slate-700 text-lg leading-relaxed">
            At GXZ Health, we stand behind the quality of our products and strive to ensure every customer has a positive experience. Please review the policy below regarding refunds, returns, and exchanges.
          </p>
        </div>

        {/* Returns Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-teal-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Returns</h2>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
            <p className="text-slate-700 mb-6 leading-relaxed">
              Due to the nature of health, wellness, and personal care products, returns are generally not accepted once an item has been opened or used.
            </p>
            
            <h3 className="text-xl font-semibold text-slate-900 mb-4">To be eligible for a return, the item must:</h3>
            <ul className="space-y-3 mb-6">
              {[
                'Be unused and in the same condition that you received it',
                'Be in the original packaging',
                'Be returned within 30 days of delivery'
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-teal-500">
              <p className="text-slate-700 font-medium">
                Proof of purchase (order confirmation or receipt) is required for all returns.
              </p>
            </div>
          </div>
        </section>

        {/* Damaged Items Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Damaged, Missing, or Incorrect Items</h2>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <p className="text-slate-700 mb-6">
              If your order arrives damaged, defective, or incorrect, please contact us within <span className="font-semibold text-teal-600">7 days of delivery</span>.
            </p>
            
            <h3 className="text-xl font-semibold text-slate-900 mb-4">When contacting us, please include:</h3>
            <ul className="space-y-3 mb-8">
              {[
                'Your order number',
                'Photos of the item and packaging',
                'A brief description of the issue'
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <div className="bg-gradient-to-r from-teal-50 to-slate-50 rounded-xl p-6 border border-teal-100">
              <h4 className="font-semibold text-slate-900 mb-3">Once reviewed, we will either:</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-slate-700 font-medium">Send a replacement item</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-slate-700 font-medium">Issue a refund to your original payment method</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Non-Returnable Items */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-rose-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Non-Returnable Items</h2>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <p className="text-slate-700 mb-6">
              The following items cannot be returned for safety and hygiene reasons:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Opened or used health products',
                'Supplements or consumable products once opened',
                'Personal care items once opened',
                'Clearance or final sale items'
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-rose-50 rounded-lg border border-rose-100">
                  <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Refund Process */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Refund Process</h2>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <p className="text-slate-700 mb-6 font-semibold">If your return is approved:</p>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">1</div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Refund Processing</h4>
                  <p className="text-slate-700">Refunds will be processed to the original payment method</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">2</div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Processing Time</h4>
                  <p className="text-slate-700">Please allow <span className="font-semibold">5–10 business days</span> for the refund to appear on your statement</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Shipping Costs</h4>
                  <p className="text-slate-700">Shipping costs are non-refundable unless the return is due to our error.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Order Cancellations */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-slate-900 to-teal-900 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Order Cancellations</h2>
            <p className="text-slate-300 leading-relaxed">
              Orders may be canceled before they are shipped. Once an order has been shipped, it cannot be canceled.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section>
          <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Contact Us</h2>
          <p className="text-slate-700 text-center mb-8 max-w-2xl mx-auto">
            If you have any questions regarding your order or this policy, please contact us:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <a 
              href="mailto:support@gxzhealth.com" 
              className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-500 transition-colors">
                <Mail className="w-6 h-6 text-teal-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Email</p>
                <p className="text-slate-900 font-semibold">support@gxzhealth.com</p>
              </div>
            </a>
            
            <a 
              href="https://health.gxzhealth.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-500 transition-colors">
                <Globe className="w-6 h-6 text-teal-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Website</p>
                <p className="text-slate-900 font-semibold">health.gxzhealth.com</p>
              </div>
            </a>
          </div>
        </section>

        {/* Back to Top */}
        <div className="mt-16 text-center">
          <a 
            href="#" 
            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rotate-90" />
            Back to top
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RefundPolicy;