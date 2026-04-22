import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";
import LoadingModal from "../components/common/LoadingModal";

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry"];

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirmPassword: "",
    voterID: "", aadharNumber: "", age: "", gender: "",
    address: "", state: "", city: "", pincode: "", contactNumber: "",
  });

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match"); 
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters"); 
      return;
    }
    if (form.contactNumber.length !== 10 || !/^\d{10}$/.test(form.contactNumber)) {
      toast.error("Contact number must be 10 digits");
      return;
    }
    if (form.aadharNumber.length !== 12 || !/^\d{12}$/.test(form.aadharNumber)) {
      toast.error("Aadhar number must be 12 digits");
      return;
    }
    if (form.pincode.length !== 6 || !/^\d{6}$/.test(form.pincode)) {
      toast.error("Pincode must be 6 digits");
      return;
    }
    if (Number(form.age) < 18) {
      toast.error("You must be at least 18 years old to register");
      return;
    }
    
    setLoading(true);
    setLoadingMessage('Creating your voter account...');
    try {
      const { confirmPassword, ...payload } = form;
      await api.post("/auth/register", { ...payload, age: Number(payload.age) });
      toast.success("Registration submitted! Please wait for admin approval.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <>
      <LoadingModal isOpen={loading} message={loadingMessage} subMessage="Setting up your voter profile" />
      <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-fingerprint text-white text-4xl"></i>
            </div>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Voter Registration
          </h1>
          <p className="text-slate-600 mt-2">Join India's most secure digital voting platform</p>
          <div className="inline-flex items-center gap-2 mt-4 bg-emerald-100 text-emerald-700 px-4 py-1 rounded-3xl text-sm font-medium">
            <i className="fa-solid fa-shield-halved"></i>
            Aadhaar + Face + Blockchain Verified
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Info Banner */}
          <div className="bg-emerald-50 border-b border-emerald-100 px-8 py-5 text-sm text-emerald-800 flex items-start gap-3">
            <i className="fa-solid fa-circle-info mt-0.5 text-lg"></i>
            <div>
              Your registration will be reviewed and approved by the Election Administrator. 
              Once approved, you can complete face verification and start voting.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-10">
            
            {/* Personal Information */}
            <div>
              <h2 className="uppercase text-xs font-semibold tracking-widest text-slate-500 mb-5">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name (as per Aadhaar) *</label>
                  <input 
                    name="fullName" 
                    value={form.fullName} 
                    onChange={set} 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900 placeholder:text-slate-400" 
                    placeholder="Enter your full name" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Age *</label>
                  <input 
                    name="age" 
                    type="number" 
                    min="18" 
                    max="120" 
                    value={form.age} 
                    onChange={set} 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900" 
                    placeholder="18+" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender *</label>
                  <select 
                    name="gender" 
                    value={form.gender} 
                    onChange={set} 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Number *</label>
                  <input 
                    name="contactNumber" 
                    value={form.contactNumber} 
                    onChange={set} 
                    required 
                    maxLength={10}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900" 
                    placeholder="10-digit mobile number" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
                  <input 
                    name="email" 
                    type="email" 
                    value={form.email} 
                    onChange={set} 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900" 
                    placeholder="you@example.com" 
                  />
                </div>
              </div>
            </div>

            {/* Identity Documents */}
            <div>
              <h2 className="uppercase text-xs font-semibold tracking-widest text-slate-500 mb-5">Identity Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Voter ID Number *</label>
                  <input 
                    name="voterID" 
                    value={form.voterID} 
                    onChange={set} 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900" 
                    placeholder="e.g. ABC1234567" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Aadhaar Number *</label>
                  <input 
                    name="aadharNumber" 
                    value={form.aadharNumber} 
                    onChange={set} 
                    required 
                    maxLength={12}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900" 
                    placeholder="12-digit Aadhaar number" 
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="uppercase text-xs font-semibold tracking-widest text-slate-500 mb-5">Address Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Residential Address *</label>
                  <input 
                    name="address" 
                    value={form.address} 
                    onChange={set} 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900" 
                    placeholder="House No., Street, Locality" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">State *</label>
                  <select 
                    name="state" 
                    value={form.state} 
                    onChange={set} 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900"
                  >
                    <option value="">Select your state</option>
                    {STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">City / District *</label>
                  <input 
                    name="city" 
                    value={form.city} 
                    onChange={set} 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900" 
                    placeholder="City or District" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Pincode *</label>
                  <input 
                    name="pincode" 
                    value={form.pincode} 
                    onChange={set} 
                    required 
                    maxLength={6}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900" 
                    placeholder="6-digit PIN code" 
                  />
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div>
              <h2 className="uppercase text-xs font-semibold tracking-widest text-slate-500 mb-5">Create Secure Password</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
                  <input 
                    name="password" 
                    type="password" 
                    value={form.password} 
                    onChange={set} 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900" 
                    placeholder="Minimum 8 characters" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password *</label>
                  <input 
                    name="confirmPassword" 
                    type="password" 
                    value={form.confirmPassword} 
                    onChange={set} 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900" 
                    placeholder="Re-enter password" 
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-4 rounded-3xl text-lg transition-all active:scale-[0.985]"
            >
              {loading ? "Submitting Registration..." : "Submit Voter Registration"}
            </button>
          </form>

          <div className="px-8 py-6 border-t bg-slate-50 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-600 font-medium hover:underline">
              Login here
            </Link>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="text-center text-xs text-slate-500 mt-8 flex flex-col items-center gap-y-1">
          <div className="flex items-center gap-4">
            <span>🔒 Secure</span>
            <span>•</span>
            <span>🛡️ Encrypted</span>
            <span>•</span>
            <span>✅ Verified</span>
          </div>
          <p>Data protected under Representation of the People Act, 1951</p>
        </div>
      </div>
    </div>
    </>
  );
}