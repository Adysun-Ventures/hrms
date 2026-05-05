import React from "react";
import { View, Text, Image } from "@react-pdf/renderer";
import hrSign from "/public/assets/hr-sign.png";
import logo from "/public/assets/adysunventures_logo.png";
import { HEADER_FOOTER_FONT_FAMILY } from "@/components/pdf/documentFont";

const GlobalPDFHeader = () => {
  const COMPANY = {
    name: "ADYSUN VENTURES PVT. LTD.",
    contact: "info@adysunventures.com | hr@adysunventures.com | www.AdysunVentures.com",
    addressLine1: "Adysun Ventures, WorkPlex, S no 47, near Bhapkar petrol pump",
    addressLine2: "Pune - Satara Rd, Bibwewadi, Pune, Maharashtra 411009",
    logo: "/assets/adysunventures_logo.png" 
  };

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
      
      {/* LEFT TEXT BLOCK */}
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={{ fontSize: 16, marginBottom: 8, fontWeight: "bold", color: "#D85604", fontFamily: HEADER_FOOTER_FONT_FAMILY }}>
          {COMPANY.name}
        </Text>

        <Text  wrap={false} style={{ fontSize: 10, marginTop: 4, marginBottom: 4, fontFamily: HEADER_FOOTER_FONT_FAMILY, color: "#666" }}>
          {COMPANY.contact}
        </Text>

        <Text style={{ fontSize: 10, marginTop: 4, marginBottom: 4, fontFamily: HEADER_FOOTER_FONT_FAMILY, color: "#666" }}>
          {COMPANY.addressLine1}
        </Text>
        <Text style={{ fontSize: 10, marginTop: 4, marginBottom: 4, fontFamily: HEADER_FOOTER_FONT_FAMILY, color: "#666"  }}>
          {COMPANY.addressLine2}
        </Text>
      </View>

      {/* RIGHT LOGO */}
      <Image
        src={COMPANY.logo}
        // src="/assets/hr-sign.png"
        style={{ width: 60, height: 60, marginLeft: 12 }}
      />
    </View>
  );
};

export default GlobalPDFHeader;
