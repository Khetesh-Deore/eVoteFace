import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry"];

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirmPassword: "",
    voterID: "", aadharNumber: "", age: "", gender: "",
    address: "", state: "", city: "", pincode: "", contactNumber: "",
  });

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
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
    try {
      const { confirmPassword, ...payload } = form;
      await api.post("/auth/register", { ...payload, age: Number(payload.age) });
      toast.success("Registration submitted! Please wait for admin approval.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-full mb-3">
            <span className="text-white text-2xl">🗳️</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Voter Registration</h1>
          <p className="text-gray-500 text-sm mt-1">eVoteFace — Secure Digital Voting Platform</p>
        </div>

        <div className="card">
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6 text-sm text-blue-800">
            ℹ️ After registration, your account will be reviewed and approved by the Election Administrator.
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Info */}
            <div>
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wide border-b border-gray-200 pb-2 mb-4">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Full Name *</label>
                  <input name="fullName" value={form.fullName} onChange={set} required className="input" placeholder="As per government ID" />
                </div>
                <div>
                  <label className="label">Age *</label>
                  <input name="age" type="number" min="18" max="120" value={form.age} onChange={set} required className="input" placeholder="Must be 18+" />
                </div>
                <div>
                  <label className="label">Gender *</label>
                  <select name="gender" value={form.gender} onChange={set} required className="input">
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Contact Number *</label>
                  <input name="contactNumber" value={form.contactNumber} onChange={set} required className="input" placeholder="10-digit mobile number" maxLength={10} />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input name="email" type="email" value={form.email} onChange={set} required className="input" placeholder="OTP will be sent here" />
                </div>
              </div>
            </div>

            {/* Identity */}
            <div>
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wide border-b border-gray-200 pb-2 mb-4">
                Identity Documents
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Voter ID Number *</label>
                  <input name="voterID" value={form.voterID} onChange={set} required className="input" placeholder="e.g. ABC1234567" />
                </div>
                <div>
                  <label className="label">Aadhar Number *</label>
                  <input name="aadharNumber" value={form.aadharNumber} onChange={set} required className="input" placeholder="12-digit Aadhar" maxLength={12} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wide border-b border-gray-200 pb-2 mb-4">
                Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Full Address *</label>
                  <input name="address" value={form.address} onChange={set} required className="input" placeholder="House/Flat No., Street, Area" />
                </div>
                <div>
                  <label className="label">State *</label>
                  <select name="state" value={form.state} onChange={set} required className="input">
                    <option value="">Select state</option>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">City *</label>
                  <input name="city" value={form.city} onChange={set} required className="input" placeholder="City / District" />
                </div>
                <div>
                  <label className="label">Pincode *</label>
                  <input name="pincode" value={form.pincode} onChange={set} required className="input" placeholder="6-digit pincode" maxLength={6} />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wide border-b border-gray-200 pb-2 mb-4">
                Set Password
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Password *</label>
                  <input name="password" type="password" value={form.password} onChange={set} required className="input" placeholder="Min 8 characters" />
                </div>
                <div>
                  <label className="label">Confirm Password *</label>
                  <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={set} required className="input" placeholder="Re-enter password" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-center">
              {loading ? "Submitting..." : "Submit Registration"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already registered?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
