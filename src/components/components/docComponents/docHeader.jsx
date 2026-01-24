import React from "react";
import { View, Text, Image } from "@react-pdf/renderer";
import hrSign from "/public/assets/hr-sign.png";
import logo from "/public/assets/adysunventures_logo.png";

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
      <View style={{ flex: 1, paddingRight: 6 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#D85604" }}>
          {COMPANY.name}
        </Text>

        <Text style={{ fontSize: 11, marginTop: 4 }}>
          {COMPANY.contact}
        </Text>

        <Text style={{ fontSize: 11, marginTop: 4 }}>
          {COMPANY.addressLine1}
        </Text>
        <Text style={{ fontSize: 11 }}>
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
