import React from "react";
import { Download } from "lucide-react";
import { useDownloadPDF } from "../../hooks/useDownloadPDF";

function LetterContainer({ title, children }) {
  const { containerRef, handleDownload } = useDownloadPDF();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download size={20} />
          Download PDF
        </button>
      </div>

      <div ref={containerRef} className="space-y-6">
        {children}
      </div>
    </div>
  );
}

export default LetterContainer;
