'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Briefcase, File, User, Clipboard, ToggleLeft, ToggleRight, Building } from "lucide-react"; // Import icons

function Home() {
  // Load initial state from localStorage, default to false if not present
  const [useV2, setUseV2] = useState(() => {
    // Check if we're in a browser environment before accessing localStorage
    if (typeof window !== 'undefined') {
      const savedVersion = localStorage.getItem("useV2");
      return savedVersion ? JSON.parse(savedVersion) : false;
    }
    return false;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("useV2", JSON.stringify(useV2));
  }, [useV2]);

  const documents = [
    { title: "Offer Letter", path: "/dashboard/documents/offer-letter", v2Path: "/dashboard/documents/v2/offer-letter", icon: <FileText size={32} /> },
    { title: "Appointment Letter", path: "/dashboard/documents/appointment-letter", v2Path: "/dashboard/documents/v2/appointment-letter", icon: <FileText size={32} /> },
    { title: "Salary Slip", path: "/dashboard/documents/salary-slip", v2Path: "/dashboard/documents/v2/salary-slip", icon: <File size={32} /> },
    { title: "Relieving Letter", path: "/dashboard/documents/relieving-letter", v2Path: "/dashboard/documents/v2/relieving-letter", icon: <FileText size={32} /> },
    { title: "Appraisal Letter", path: "/dashboard/documents/appraisal-letter", v2Path: "/dashboard/documents/v2/appraisal-letter", icon: <Clipboard size={32} /> },
    // { title: "Increment Letter", path: "/dashboard/documents/increment-letter", v2Path: "/dashboard/documents/v2/increment-letter", icon: <Briefcase size={32} /> },
    { title: "Manage Company", path: "/dashboard/documents/company-card", icon: <Building size={32} /> },
   
    { title: "Manage Candidates", path: "/dashboard/documents/manage-student", icon: <User size={32} /> },
    { title: "Manage Bank", v2Path: "/dashboard/documents/v2/manage-bank", icon: <File size={32} /> },
    { title: "Bank Statement", v2Path: "/dashboard/documents/v2/bank-statement", icon: <FileText size={32} /> },
  ];

  const toggleVersion = () => {
    setUseV2(prev => !prev);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">
        Document Portal
      </h1>

      <div className="flex justify-center mb-8">
        <div 
          onClick={toggleVersion} 
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer
            ${useV2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
            transition-all duration-300 hover:shadow-md
          `}
        >
          <span className="font-medium">
            {useV2 ? 'v2: Text-Selectable PDFs' : 'Current Version'}
          </span>
          {useV2 ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {documents.map((doc, index) => {
          // Skip rendering v2 options for management pages
          if (!doc.v2Path && useV2) return null;
          // Hide Manage Bank and Bank Statement from current version
          if ((doc.title === "Manage Bank" || doc.title === "Bank Statement") && !useV2) return null;
          
          const linkPath = useV2 && doc.v2Path ? doc.v2Path : doc.path;
          
          return (
            <Link
              key={index}
              href={linkPath}
              className={`
                block p-8 bg-white border-l-4 rounded-xl shadow-xl 
                transform hover:scale-105 transition-all duration-300 ease-in-out 
                flex items-center justify-center text-gray-800
                ${useV2 && doc.v2Path ? 'border-blue-600' : 'border-blue-500'}
              `}
            >
              <div className="flex flex-col items-center">
                <div className="mb-4">{doc.icon}</div>
                <h2 className="text-2xl font-semibold text-center">{doc.title}</h2>
                {useV2 && doc.v2Path && (
                  <span className="mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Text-Selectable
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Home;
