'use client';

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

const ManageStudent = () => {
  const [candidates, setCandidates] = useState([]);
  const [formData, setFormData] = useState({
    candidateName: "",
    designation: "",
    employeeCode: "",
    panNo: "",
    location: "",
    department: "",
    DateOfJoining: "",
    lastWorkingDate: "",
    packageLPA: "",
    inhandSalary: "",
  });
  const [editId, setEditId] = useState(null);
  const [isListView, setIsListView] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const querySnapshot = await getDocs(collection(db, "candidates"));
    const candidateList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setCandidates(candidateList);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      const candidateDoc = doc(db, "candidates", editId);
      await updateDoc(candidateDoc, formData);
    } else {
      await addDoc(collection(db, "candidates"), formData);
    }
    setFormData({
      candidateName: "",
      designation: "",
      employeeCode: "",
      panNo: "",
      location: "",
      department: "",
      DateOfJoining: "",
      lastWorkingDate: "",
      packageLPA: "",
      inhandSalary: "",
    });
    setEditId(null);
    setIsListView(true);
    fetchCandidates();
  };

  const handleEdit = (candidate) => {
    setFormData(candidate);
    setEditId(candidate.id);
    setIsListView(false);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "candidates", id));
    fetchCandidates();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 cursor-pointer">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back</span>
          </Link>
        </div>

        {isListView ? (
          <>
            <h3 className="text-2xl font-semibold mb-4">Candidate List</h3>
            {candidates.map((candidate) => (
              <div key={candidate.id} className="flex justify-between p-4 mb-4 bg-white rounded-lg shadow">
                <div>
                  <p className="text-lg font-semibold capitalize">{candidate.candidateName}</p>
                  <p className="text-gray-600 capitalize">{candidate.designation}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(candidate)}
                    className="bg-yellow-500 text-white w-10 h-10 rounded-full flex items-center justify-center"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(candidate.id)}
                    className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => setIsListView(false)} className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full">
              <Plus className="w-6 h-6" />
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4">{editId ? "Edit Candidate" : "Add Candidate"}</h3>
            {Object.keys(formData).map((field) => (
              <div key={field} className="mb-4">
                <label htmlFor={field} className="block text-gray-700 capitalize font-semibold mb-1">
                  {field.replace(/([A-Z])/g, " $1").trim()}
                </label>
                <input
                  id={field}
                  type={field.includes("Date") ? "date" : "text"}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  placeholder={field.replace(/([A-Z])/g, " $1").trim()}
                  className="p-3 border border-gray-300 rounded-md w-full"
                  required
                />
              </div>
            ))}
            <button type="submit" className="bg-blue-600 text-white p-3 rounded-md w-full">
              {editId ? "Update Candidate" : "Add Candidate"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManageStudent;
