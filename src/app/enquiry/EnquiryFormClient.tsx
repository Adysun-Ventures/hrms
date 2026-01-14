"use client";
import { useState, useRef, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import { validatePANFormat, checkPANExistsAnywhere } from "@/utils/firebaseUtils";
import { checkMobileExists, checkEmailExists } from "@/utils/firebaseUtils";
import Image from "next/image";
import Link from "next/link";
import SocialMediaLinks from "@/components/ui/SocialMediaLinks";
import { FiArrowRight, FiExternalLink, FiUserPlus } from "react-icons/fi";
import { COMPANY_LINKS } from "@/constants/companyLinks";
import Navigation from "@/components/website/layout/Navigation";

interface EnquiryFormData {
  name: string;
  mobile: string;
  pan: string;
  email: string;
  passoutYear: string;
  technology: string;
  role: string;
  totalWorkExperience: string;
  interestedIn: string;
  message: string;
}

// Header Component for Enquiry Form
const EnquiryHeader = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16">
          <div className="flex items-center">
            <Image
              src="/adysun-logo.png"
              alt="Adysun Ventures Logo"
              width={40}
              height={40}
              className="object-contain mr-3"
              priority
            />
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 uppercase tracking-tight leading-none">
                ADYSUN VENTURES
              </h1>
              <p className="text-lg text-gray-500 font-normal leading-tight -mt-1">
                Inspire. Imagine. Implement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Google Form embed component
type EnquiryGoogleFormProps = {
  formUrl?: string;
  mobileHeight?: number; // px for mobile (<=768px)
  desktopHeight?: number; // px for desktop (>768px). If 0, use calc with offset
  offset?: number; // offset in px to subtract from viewport when desktopHeight not provided
};

export const EnquiryGoogleForm = ({
  formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfEXAMPLE/viewform?embedded=true",
  mobileHeight,
  desktopHeight,
  offset = 200,
}: EnquiryGoogleFormProps) => {
  // set --vh to handle mobile browser chrome correctly
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    };
    setVh();
    window.addEventListener("resize", setVh, { passive: true });
    window.addEventListener("orientationchange", setVh);
    return () => {
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", setVh);
    };
  }, []);

  // compute iframe height depending on viewport (fallback)
  const defaultMobileHeight = 1610;
  let iframeHeight = `calc(var(--vh) * 100 - ${offset}px)`;
  if (typeof window !== "undefined") {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      iframeHeight = `${mobileHeight ?? defaultMobileHeight}px`;
    } else {
      iframeHeight =
        typeof desktopHeight === "number" && desktopHeight > 0
          ? `${desktopHeight}px`
          : `calc(var(--vh) * 100 - ${offset}px)`;
    }
  }

  // measured height state to compute exact available space (header/footer)
  const [measuredHeight, setMeasuredHeight] = useState<string | null>(null);

  useEffect(() => {
    const compute = () => {
      if (typeof window === "undefined") return;
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setMeasuredHeight(`${mobileHeight ?? defaultMobileHeight}px`);
        return;
      }
      if (typeof desktopHeight === "number" && desktopHeight > 0) {
        setMeasuredHeight(`${desktopHeight}px`);
        return;
      }
      const navEl = document.querySelector(".navigation-container") as HTMLElement | null;
      const footerEl = document.querySelector("#footer") as HTMLElement | null;
      const navH = navEl ? navEl.offsetHeight : 0;
      const footH = footerEl ? footerEl.offsetHeight : 0;
      const available = Math.max(300, window.innerHeight - navH - footH - 32);
      setMeasuredHeight(`${available}px`);
    };

    compute();
    window.addEventListener("resize", compute, { passive: true });
    window.addEventListener("orientationchange", compute);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, [mobileHeight, desktopHeight, offset]);

  return (
    <div id="enquiry-form" tabIndex={-1} className="w-full">
      <iframe
        src={formUrl}
        width="100%"
        style={{
          height: measuredHeight ?? iframeHeight,
          border: 0,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
        }}
        frameBorder={0}
        marginHeight={0}
        marginWidth={0}
        className="w-full"
        title="Enquiry Google Form"
      />
    </div>
  );
};

// Footer Component for Enquiry Form
const EnquiryFooter = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Our Locations */}
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center text-orange-400">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Our Locations
            </h3>
            
            {/* Pune Office */}
            <div className="mb-6">
              <div className="flex items-start mb-3">
                <svg className="w-4 h-4 mr-2 mt-1 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div>
                  <p className="font-semibold text-sm">{COMPANY_LINKS.locations.pune.name}</p>
                  <p className="text-gray-300 text-sm">Adysun Ventures Pvt. Ltd.</p>
                  <p className="text-gray-300 text-sm">{COMPANY_LINKS.locations.pune.address}</p>
                </div>
              </div>
              <div className="flex space-x-2 ml-6">
                <Link href={COMPANY_LINKS.locations.pune.maps} target="_blank">
                <button className="border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-3 py-1 rounded text-xs flex items-center transition-colors">
                  <svg className="w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Google Maps
                </button>
                </Link>
                <Link href={COMPANY_LINKS.locations.pune.googleSearch} target="_blank">
                <button className="border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-3 py-1 rounded text-xs flex items-center transition-colors">
                  <svg className="w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google Search
                </button>
                </Link>
              </div>
            </div>

            {/* Thane Office */}
            <div>
              <div className="flex items-start mb-3">
                <svg className="w-6 h-6 mr-2 mt-1 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div>
                  <p className="font-semibold text-sm">{COMPANY_LINKS.locations.thane.name}</p>
                  <p className="text-gray-300 text-sm">Adysun Ventures Pvt. Ltd.</p>
                  <p className="text-gray-300 text-sm">{COMPANY_LINKS.locations.thane.address}</p>
                </div>
              </div>
              <div className="flex space-x-2 ml-6">
                <Link href={COMPANY_LINKS.locations.thane.maps} target="_blank">
                <button className="border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-3 py-1 rounded text-xs flex items-center transition-colors">
                  <svg className="w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Google Maps
                </button>
                </Link>
                <Link href={COMPANY_LINKS.locations.thane.googleSearch} target="_blank">
                <button className="border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-3 py-1 rounded text-xs flex items-center transition-colors">
                  <svg className="w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google Search
                </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center text-orange-400">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Contact Us
            </h3>

            {/* Email Addresses */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <svg className="w-4 h-4 mr-2 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="font-semibold text-sm">Email Addresses</span>
              </div>
              <div className="ml-6 space-y-2">
                <p className="text-gray-300 text-sm">
                  <span className="font-medium">General Inquiries:</span> {COMPANY_LINKS.contact.email.general}
                </p>
                <p className="text-gray-300 text-sm">
                  <span className="font-medium">HR & Recruitment:</span> {COMPANY_LINKS.contact.email.hr}
                </p>
              </div>
            </div>

            {/* Social Media Links */}
            <div>
              <SocialMediaLinks title="Follow Us" />
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Adysun Ventures. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

type EnquiryFormClientProps = {
  useGoogleForm?: boolean;
  formUrl?: string;
  // legacy single height prop (treated as mobileHeight for backward compatibility)
  height?: number;
  // explicit controls
  mobileHeight?: number;
  desktopHeight?: number;
};

export default function EnquirySubmitPage({
  useGoogleForm = false,
  formUrl,
  height,
  mobileHeight,
  desktopHeight,
}: EnquiryFormClientProps) {
  const [formData, setFormData] = useState<EnquiryFormData>({
    name: "",
    mobile: "",
    pan: "",
    email: "",
    passoutYear: "",
    technology: "",
    role: "",
    totalWorkExperience: "",
    interestedIn: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [panError, setPanError] = useState<string | null>(null);
  const [panDuplicateError, setPanDuplicateError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const panDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);
    setMobileError(null);
    setPanError(null);
    setEmailError(null);
    setPanDuplicateError(null);

    // Validate required fields
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.mobile.trim()) {
      setError("Mobile number is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email address is required");
      return;
    }

    if (!formData.message.trim()) {
      setError("Message is required");
      return;
    }

    // Validate Interested In field
    if (!formData.interestedIn.trim()) {
      setError("Please select an option for Interested In");
      return;
    }

    // Validate Passout Year field
    if (!formData.passoutYear.trim()) {
      setError("Please select your Passout Year");
      return;
    }

    // Validate Technology field
    if (!formData.technology.trim()) {
      setError("Please select a Technology");
      return;
    }

    // Validate Role field
    if (!formData.role.trim()) {
      setError("Please select a Role");
      return;
    }

    // Validate Total Work Experience field
    if (!formData.totalWorkExperience.trim()) {
      setError("Please select your Total Work Experience");
      return;
    }

    // Validate mobile number format
    if (formData.mobile.length !== 10) {
      setError("Mobile number must be exactly 10 digits");
      return;
    }

    const firstDigit = parseInt(formData.mobile.charAt(0));
    if (firstDigit < 6 || firstDigit > 9) {
      setError("Mobile number must start with 6, 7, 8, or 9");
      return;
    }

    // Validate mobile number contains only digits
    if (!/^\d{10}$/.test(formData.mobile)) {
      setError("Mobile number must contain only digits");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate PAN card (required)
    if (!validatePANFormat(formData.pan)) {
      setError("Please enter a valid PAN number (e.g., ABCDE1234F)");
      return;
    }

    // Check if PAN already exists
    const panExists = await checkPANExistsAnywhere(formData.pan.toUpperCase());
    if (panExists) {
      setError("This PAN number is already registered. Please use a different PAN or contact support.");
      return;
    }

    // Check if mobile already exists
    const mobileExists = await checkMobileExists(formData.mobile.trim());
    if (mobileExists) {
      setError("This mobile number is already registered. Please use a different mobile number or contact support.");
      return;
    }

    // Check if email already exists
    const emailExists = await checkEmailExists(formData.email.trim());
    if (emailExists) {
      setError("This email address is already registered. Please use a different email or contact support.");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "enquiries"), {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        pan: formData.pan.trim() ? formData.pan.trim().toUpperCase() : null,
        email: formData.email.trim(),
        passoutYear: formData.passoutYear.trim() || null,
        technology: formData.technology.trim() || null,
        role: formData.role.trim() || null,
        totalWorkExperience: formData.totalWorkExperience.trim() || null,
        interestedIn: formData.interestedIn.trim(),
        message: formData.message.trim(),
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setFormData({
        name: "",
        mobile: "",
        pan: "",
        email: "",
        passoutYear: "",
        technology: "",
        role: "",
        totalWorkExperience: "",
        interestedIn: "",
        message: "",
      });
    } catch (error: unknown) {
      console.error("Enquiry submission error:", error);
      setError("Failed to submit enquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const processedValue =
      name === "pan"
        ? value.toUpperCase().replace(/\s+/g, "")
        : value;

    setFormData({
      ...formData,
      [name]: processedValue,
    });

    // Mobile number validation
    if (name === "mobile") {
      if (value.length > 0) {
        const firstDigit = parseInt(value.charAt(0));
        if (firstDigit >= 1 && firstDigit <= 5) {
          setMobileError("Mobile number must start with 6, 7, 8, or 9");
        } else {
          setMobileError(null);
        }
      } else {
        setMobileError(null);
      }
    }

    // PAN number validation
    if (name === "pan") {
      if (processedValue.length > 0) {
        if (!validatePANFormat(processedValue)) {
          setPanError("Please enter a valid PAN number (e.g., ABCDE1234F)");
          setPanDuplicateError(null);
        } else {
          setPanError(null);
          setPanDuplicateError(null);
        }
      } else {
        setPanError(null);
        setPanDuplicateError(null);
      }
    }

    // Email validation
    if (name === "email") {
      if (value.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          setEmailError("Please enter a valid email address");
        } else {
          setEmailError(null);
        }
      } else {
        setEmailError(null);
      }
      if (panDebounceRef.current) {
        clearTimeout(panDebounceRef.current);
      }
      if (processedValue.length === 10 && validatePANFormat(processedValue)) {
        panDebounceRef.current = setTimeout(async () => {
          try {
            const exists = await checkPANExistsAnywhere(processedValue);
            setPanDuplicateError(exists ? "This PAN number is already registered" : null);
          } catch (error) {
            console.error("Error checking PAN uniqueness:", error);
          }
        }, 1000);
      } else {
        setPanDuplicateError(null);
      }
    }

    // Mobile uniqueness validation (debounced)
    if (name === "mobile") {
      if (value.length === 10 && /^[6-9]\d{9}$/.test(value)) {
        // Check mobile uniqueness after a delay
        setTimeout(async () => {
          try {
            const exists = await checkMobileExists(value);
            if (exists) {
              setMobileError("This mobile number is already registered");
            } else {
              setMobileError(null);
            }
          } catch (error) {
            console.error('Error checking mobile uniqueness:', error);
          }
        }, 1000); // 1 second delay
      }
    }

    // Email uniqueness validation (debounced)
    if (name === "email") {
      if (value.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        // Check email uniqueness after a delay
        setTimeout(async () => {
          try {
            const exists = await checkEmailExists(value);
            if (exists) {
              setEmailError("This email address is already registered");
            } else {
              setEmailError(null);
            }
          } catch (error) {
            console.error('Error checking email uniqueness:', error);
          }
        }, 1000); // 1 second delay
      }
    }
  };

  // If page should use Google Form embed, render header + google form + footer
  if (useGoogleForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center pt-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl w-full">
            <EnquiryGoogleForm
              formUrl={formUrl}
              mobileHeight={mobileHeight ?? height ?? 1610}
              desktopHeight={desktopHeight ?? 0}
              offset={200}
            />
          </div>
        </div>
        <EnquiryFooter />
      </div>
    );
  }

  if (success) {
    return (
      <>
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .fade-in-up {
            animation: fadeInUp 0.6s ease-out forwards;
          }
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5);
            }
            100% {
              box-shadow: 0 0 0 12px rgba(255, 255, 255, 0);
            }
          }
          @keyframes shimmer {
            0% {
              transform: translateX(-100%) skewX(-15deg);
            }
            100% {
              transform: translateX(200%) skewX(-15deg);
            }
          }
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-3px);
            }
          }
          .cta-button {
            animation: pulse 1.2s ease-out infinite, bounce 2.5s ease-in-out infinite;
            background: rgba(255, 255, 255, 0.25);
            position: relative;
            overflow: hidden;
          }
          .cta-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 50%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
            animation: shimmer 2.5s infinite;
          }
          .cta-button:hover {
            animation: none;
            background: rgba(255, 255, 255, 0.35);
          }
        `}</style>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navigation />
          <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center fade-in-up">
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Enquiry Submitted!
                </h2>
                <p className="text-gray-600">
                  Thank you for your enquiry. We'll get back to you soon.
                </p>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Follow us on social media to stay connected:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-center">
                  {/* Instagram Card */}
                  <div className="flex justify-center">
                    <a
                      href={COMPANY_LINKS.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full group relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl p-6 text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 fade-in-up"
                      style={{ animationDelay: '0.2s', opacity: 0 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-center mb-3">
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-center mb-2">Follow us on Instagram</h3>
                        <p className="text-sm text-white/90 text-center">Stay updated with our latest news</p>
                        <div className="mt-4 flex items-center justify-center">
                          <span className="cta-button inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-6 py-2.5 rounded-full transition-all duration-200 group-hover:scale-110 group-hover:shadow-xl min-w-[100px] relative z-10">
                            <FiUserPlus className="w-4 h-4 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12 relative z-10" />
                            <span className="relative z-10">Follow</span>
                          </span>
                        </div>
                      </div>
                    </a>
                  </div>
                  
                  {/* LinkedIn Card */}
                  <div className="flex justify-center">
                    <a
                      href={COMPANY_LINKS.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full group relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-xl p-6 text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 fade-in-up"
                      style={{ animationDelay: '0.4s', opacity: 0 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-700/20 to-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-center mb-3">
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-center mb-2">Connect with us on LinkedIn</h3>
                        <p className="text-sm text-white/90 text-center">Join our professional network</p>
                        <div className="mt-4 flex items-center justify-center">
                          <span className="cta-button inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-6 py-2.5 rounded-full transition-all duration-200 group-hover:scale-110 group-hover:shadow-xl min-w-[100px] relative z-10">
                            <FiUserPlus className="w-4 h-4 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12 relative z-10" />
                            <span className="relative z-10">Connect</span>
                          </span>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <EnquiryFooter />
      </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Submit Your Enquiry
            </h1>
            <p className="text-gray-600">
              Please fill out the form below and we&apos;ll get back to you
              soon.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      <span className="text-red-500">*</span> Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="mobile"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      <span className="text-red-500">*</span> Mobile
                    </label>
                    <input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      inputMode="numeric"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        mobileError ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter 10-digit mobile number"
                      title="Mobile number must start with 6, 7, 8, or 9"
                    />
                    {mobileError && (
                      <p className="mt-1 text-sm text-red-600">{mobileError}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="pan"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      <span className="text-red-500">*</span> PAN Number
                    </label>
                    <input
                      type="text"
                      id="pan"
                      name="pan"
                      value={formData.pan}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        panError || panDuplicateError ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter PAN number (e.g., ABCDE1234F)"
                      pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                      title="PAN number must be in format: ABCDE1234F"
                    />
                    {panError && (
                      <p className="mt-1 text-sm text-red-600">{panError}</p>
                    )}
                    {panDuplicateError && !panError && (
                      <p className="mt-1 text-sm text-red-600">{panDuplicateError}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      <span className="text-red-500">*</span> Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        emailError ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your email address"
                    />
                    {emailError && (
                      <p className="mt-1 text-sm text-red-600">{emailError}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label
                      htmlFor="passoutYear"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      <span className="text-red-500">*</span> Passout Year
                    </label>
                    <select
                      id="passoutYear"
                      name="passoutYear"
                      value={formData.passoutYear}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Passout Year</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                      <option value="2021">2021</option>
                      <option value="2020">2020</option>
                      <option value="2019">2019</option>
                      <option value="2018">2018</option>
                      <option value="2017">2017</option>
                      <option value="2016">2016</option>
                      <option value="2015">2015</option>
                      <option value="2014">2014</option>
                      <option value="2013">2013</option>
                      <option value="2012">2012</option>
                      <option value="2011">2011</option>
                      <option value="2010">2010</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="technology"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      <span className="text-red-500">*</span> Technology
                    </label>
                    <select
                      id="technology"
                      name="technology"
                      value={formData.technology}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Technology</option>
                      <option value="React">React</option>
                      <option value="Angular">Angular</option>
                      <option value="Vue.js">Vue.js</option>
                      <option value="Node.js">Node.js</option>
                      <option value="Python">Python</option>
                      <option value="Java">Java</option>
                      <option value="C#">C#</option>
                      <option value="PHP">PHP</option>
                      <option value="Ruby">Ruby</option>
                      <option value="Go">Go</option>
                      <option value="Swift">Swift</option>
                      <option value="Kotlin">Kotlin</option>
                      <option value="Flutter">Flutter</option>
                      <option value="React Native">React Native</option>
                      <option value="AWS">AWS</option>
                      <option value="Azure">Azure</option>
                      <option value="Google Cloud">Google Cloud</option>
                      <option value="Docker">Docker</option>
                      <option value="Kubernetes">Kubernetes</option>
                      <option value="MongoDB">MongoDB</option>
                      <option value="PostgreSQL">PostgreSQL</option>
                      <option value="MySQL">MySQL</option>
                      <option value="Redis">Redis</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      <span className="text-red-500">*</span> Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Role</option>
                      <option value="Frontend Developer">
                        Frontend Developer
                      </option>
                      <option value="Backend Developer">
                        Backend Developer
                      </option>
                      <option value="Full Stack Developer">
                        Full Stack Developer
                      </option>
                      <option value="Mobile Developer">Mobile Developer</option>
                      <option value="DevOps Engineer">DevOps Engineer</option>
                      <option value="Data Scientist">Data Scientist</option>
                      <option value="Data Engineer">Data Engineer</option>
                      <option value="Machine Learning Engineer">
                        Machine Learning Engineer
                      </option>
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="QA Engineer">QA Engineer</option>
                      <option value="Software Architect">
                        Software Architect
                      </option>
                      <option value="System Administrator">
                        System Administrator
                      </option>
                      <option value="Database Administrator">
                        Database Administrator
                      </option>
                      <option value="Security Engineer">
                        Security Engineer
                      </option>
                      <option value="Business Analyst">Business Analyst</option>
                      <option value="Technical Lead">Technical Lead</option>
                      <option value="Team Lead">Team Lead</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="totalWorkExperience"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      <span className="text-red-500">*</span> Total Work Experience
                    </label>
                    <select
                      id="totalWorkExperience"
                      name="totalWorkExperience"
                      value={formData.totalWorkExperience}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Experience</option>
                      <option value="Fresher">Fresher (0 years)</option>
                      <option value="1 year">1 year</option>
                      <option value="2 years">2 years</option>
                      <option value="3 years">3 years</option>
                      <option value="4 years">4 years</option>
                      <option value="5 years">5 years</option>
                      <option value="6-8 years">6-8 years</option>
                      <option value="9-12 years">9-12 years</option>
                      <option value="13+ years">13+ years</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="interestedIn"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      <span className="text-red-500">*</span> Interested In
                    </label>
                    <select
                      id="interestedIn"
                      name="interestedIn"
                      value={formData.interestedIn}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Option</option>
                      <option value="Fulltime Job">Fulltime Job</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-4">
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      <span className="text-red-500">*</span> Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Please enter your enquiry message..."
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded border border-red-200">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                  >
                    {loading ? "Submitting..." : "Submit Enquiry"}
                  </button>
                  {/* <button
                    type="button"
                    onClick={() => setSuccess(true)}
                    className="bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 text-sm font-medium border-2 border-orange-600"
                    title="Test button to preview success screen"
                  >
                    🧪 Test Success UI
                  </button> */}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <EnquiryFooter />
    </div>
  );
}
