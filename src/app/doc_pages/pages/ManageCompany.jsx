'use client';

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react"; // Icons from Lucide

const ManageCompany = () => {
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    mobile: "",
    email: "",
    website: "",
    logo: "",
    signatureLogo: "",
    hrName: "",
    hrDesignation: "",
    hrEmail: "",
  });
  const [editId, setEditId] = useState(null);
  const [isListView, setIsListView] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "companies"));
      const companyList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCompanies(companyList);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const companyDoc = doc(db, "companies", editId);
        await updateDoc(companyDoc, formData);
      } else {
        await addDoc(collection(db, "companies"), formData);
      }

      setFormData({
        name: "",
        address: "",
        mobile: "",
        email: "",
        website: "",
        logo: "",
        signatureLogo: "",
        hrName: "",
        hrDesignation: "",
        hrEmail: "",
      });
      setEditId(null);
      setIsListView(true);
      fetchCompanies();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleEdit = (company) => {
    setFormData(company);
    setEditId(company.id);
    setIsListView(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "companies", id));
      fetchCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
    }
  };

  const handleAddNew = () => {
    setFormData({
      name: "",
      address: "",
      mobile: "",
      email: "",
      website: "",
      cin: "",
      logo: "",
      hrName: "",
      hrMobile: "",
      color:"",
    });
    setEditId(null);
    setIsListView(false);
  };

  const handleGoBack = () => {
    router.back();  // Use Next.js router to go back
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="max-w-[210mm] mx-auto">
        <div className="flex justify-between items-center mb-6 md:mb-12 mt-4 md:mt-6">
          <div className="ml-2 md:ml-4">
            <div onClick={handleGoBack} className="flex items-center text-gray-600 hover:text-gray-900 cursor-pointer">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              <span className="text-sm md:text-base">Back to Home</span>
            </div>
          </div>
        </div>

        {isListView ? (
          <>
            <div className="mt-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Company List</h3>
              {companies.map((company) => (
                <div key={company.id} className="flex justify-between items-center p-4 mb-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  <div>
                    <p className="text-lg font-semibold capitalize">{company.name}</p>
                    <p className="text-gray-600 capitalize">{company.address}</p>
                    <p className="text-gray-600 capitalize">{company.mobile}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(company)}
                      className="bg-yellow-500 text-white p-2 rounded-full hover:bg-yellow-600 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(company.id)}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddNew}
              className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">{editId ? "Edit Company" : "Add New Company"}</h3>
            
            <label htmlFor="name" className="text-gray-700">Company Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Company Name"
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            
            <label htmlFor="address" className="text-gray-700">Address</label>
            <input
              type="text"
              name="address"
              id="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            
            <label htmlFor="mobile" className="text-gray-700">Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              id="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Mobile Number"
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            
            <label htmlFor="email" className="text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            
            <label htmlFor="website" className="text-gray-700">Website</label>
            <input
              type="text"
              name="website"
              id="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="Website"
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <label htmlFor="logo" className="text-gray-700">Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              id="logo"
              className="p-3 border border-gray-300 rounded-md"
            />
            
            <label htmlFor="signatureLogo" className="text-gray-700">Signature Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setFormData({ ...formData, signatureLogo: reader.result });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              id="signatureLogo"
              className="p-3 border border-gray-300 rounded-md"
            />
            
            <label htmlFor="hrName" className="text-gray-700">HR Name</label>
            <input
              type="text"
              name="hrName"
              id="hrName"
              value={formData.hrName}
              onChange={handleChange}
              placeholder="HR Name"
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            
            <label htmlFor="hrDesignation" className="text-gray-700">HR Designation</label>
            <input
              type="text"
              name="hrDesignation"
              id="hrDesignation"
              value={formData.hrDesignation}
              onChange={handleChange}
              placeholder="HR Designation (e.g., Head - HR Department)"
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            
            <label htmlFor="hrEmail" className="text-gray-700">HR Email</label>
            <input
              type="email"
              name="hrEmail"
              id="hrEmail"
              value={formData.hrEmail}
              onChange={handleChange}
              placeholder="HR Email (optional, will use company email if not provided)"
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              className="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              {editId ? "Update Company" : "Add Company"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManageCompany;
