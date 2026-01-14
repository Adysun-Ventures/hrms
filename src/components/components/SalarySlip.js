import React from "react";
import html2pdf from "html2pdf.js";
import "./SalarySlip.css";
import { Download } from "lucide-react";
const SalarySlip = ({ employeeData, companyDetails }) => {
  // Function to format the date into Month Year format
  console.log("Salary Slip Received Company Details:", companyDetails); // Debugging

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date); // "05 Feb 2025"
  };

  console.log("DOJ Value:", companyDetails?.doj);


  // Function to format amount with 2 decimal places
  const formatAmount = (amount) => {
    if (!amount) return "0.00";
    // Remove any existing commas first
    const cleanAmount = amount.toString().replace(/,/g, "");
    // Convert to float and fix to 2 decimal places
    return parseFloat(cleanAmount).toFixed(2);
  };
  function toTitleCase(str) {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/\b(\w)/g, function (char) {
        return char.toUpperCase();
      });
  }
  const handleDownloadPDF = async () => {
    const element = document.createElement("div");

    element.innerHTML = `
            <div class="salary-slip-container">
               <div class="header" style="border-bottom: 1px solid ${companyDetails?.color};">
    <div class="company-details">
        <h2 class="capitalize" style="color: ${companyDetails?.color};">${toTitleCase(companyDetails?.name)}</h2>
        <p class="capitalize">${toTitleCase(companyDetails?.address)}</p>
        <p class="capitalize">${toTitleCase(companyDetails?.city)}</p>
        <p>Phone: ${companyDetails?.phone || ""}</p>
        <p>${companyDetails?.website || ""}</p>
    </div>
    <div class="logo">
        <img src="${companyDetails?.logo}" alt="Company Logo" class="company-logo" />
    </div>
</div>


                <h3 class="salary-slip-title">SALARY SLIP FOR THE MONTH OF ${formatDate(
      companyDetails?.doj
    ).toUpperCase()}</h3>

                <div class="employee-info">
                    <div class="emp-detail">
                        <span class="label">EMP Code</span>
                        <span class="value">${companyDetails?.empCode || ""
      }</span>
                    </div>
                    <div class="emp-detail">
                        <span class="label">Name</span>
                        <span class="value capitalize">${toTitleCase(companyDetails?.employeeName) || ""
      }</span>
                    </div>
                    <div class="emp-detail">
                        <span class="label">Designation</span>
                        <span class="value capitalize">${toTitleCase(companyDetails?.designation) || ""
      }</span>
                    </div>
                    <div class="emp-detail">
                        <span class="label">PAN</span>
                        <span class="value">${companyDetails?.pan || ""}</span>
                    </div>
                    <div class="emp-detail">
                        <span class="label">Location</span>
                        <span class="value">${toTitleCase(companyDetails?.location) || ""
      }</span>
                    </div>
                    <div class="emp-detail">
                        <span class="label">DOJ</span>
                        <span class="value">${formatDate(companyDetails?.doj) || ""}</span>
                    </div>
                    <div class="emp-detail">
                        <span class="label">Department</span>
                        <span class="value">${toTitleCase(companyDetails?.department) || ""
      }</span>
                    </div>
                    <div class="emp-detail">
                        <span class="label">Payable Days</span>
                        <span class="value">${companyDetails?.payableDays || ""
      }</span>
                    </div>
                </div>

                <div class="salary-details">
                    <div class="salary-header">
                        <div class="salary-item">Earnings</div>
                        <div class="salary-item">Amount (₹)</div>
                        <div class="salary-item">Deductions</div>
                        <div class="salary-item">Amount (₹)</div>
                    </div>
                    <div class="salary-row">
                        <div class="salary-item">Basic</div>
                        <div class="salary-item">${formatAmount(
        companyDetails?.basic
      )}</div>
                        <div class="salary-item">Professional Tax</div>
                        <div class="salary-item">${formatAmount(
        companyDetails?.professionalTax
      )}</div>
                    </div>
                    <div class="salary-row">
                        <div class="salary-item">DA</div>
                        <div class="salary-item">${formatAmount(
        companyDetails?.da
      )}</div>
                        <div class="salary-item">Other Deductions</div>
                        <div class="salary-item">${formatAmount(
        companyDetails?.otherDeductions
      )}</div>
                    </div>
                    <div class="salary-row">
                        <div class="salary-item">Conveyance Allowance</div>
                        <div class="salary-item">${formatAmount(
        companyDetails?.conveyanceAllowance
      )}</div>
                        <div class="salary-item"></div>
                        <div class="salary-item"></div>
                    </div>
                    <div class="salary-row">
                        <div class="salary-item">Other Allowance</div>
                        <div class="salary-item">${formatAmount(
        companyDetails?.otherAllowance
      )}</div>
                        <div class="salary-item"></div>
                        <div class="salary-item"></div>
                    </div>
                    <div class="salary-row">
                        <div class="salary-item">Medical Allowance</div>
                        <div class="salary-item">${formatAmount(
        companyDetails?.medicalAllowance
      )}</div>
                        <div class="salary-item"></div>
                        <div class="salary-item"></div>
                    </div>
                    <div class="salary-row">
                        <div class="salary-item">CCA</div>
                        <div class="salary-item">${formatAmount(
        companyDetails?.cca
      )}</div>
                        <div class="salary-item"></div>
                        <div class="salary-item"></div>
                    </div>
                    <div class="salary-row total">
                        <div class="salary-item">Gross Salary</div>
                        <div class="salary-item">${formatAmount(
        companyDetails?.gross
      )}</div>
                        <div class="salary-item">Total Deductions</div>
                        <div class="salary-item">${formatAmount(
        companyDetails?.totalDeductions
      )}</div>
                    </div>
                    <div class="salary-row net-pay">
                        <div class="salary-item">Net Pay</div>
                        <div class="salary-item">${formatAmount(
        companyDetails?.netPay
      )}</div>
                        <div class="salary-item"></div>
                        <div class="salary-item"></div>
                    </div>
                </div>

                <div class="footer">
                    <p>This is a computer-generated Pay slip. No Signature is required.</p>
                </div>
            </div>
          
        `;

    const opt = {
      margin: 10,
      filename: `SalarySlip_${companyDetails?.employeeName || "Employee"
        }_${formatDate(companyDetails?.doj)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: true,
        allowTaint: true,
        imageTimeout: 2000,
        backgroundColor: "#ffffff",
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (

    <div className="mt-6 flex justify-end">
      <button

        className="download-btn flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-md transition-all duration-200"
        onClick={handleDownloadPDF}>
        <Download size={18} className="mr-2" />
        <span>Generate Salary Slip</span>
      </button>
    </div>
  );
};

export default SalarySlip;
