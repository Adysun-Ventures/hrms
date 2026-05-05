// GlobalPDFFooter.jsx
import { View, Text } from "@react-pdf/renderer";
import { HEADER_FOOTER_FONT_FAMILY } from "@/components/pdf/documentFont";

const GlobalPDFFooter = () => {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 20,
        left: 35,
        right: 35,
        textAlign: "left",
        fontSize: 10,
        borderTopWidth: 1,
        borderTopColor: "#000",
        paddingTop: 6,
        fontFamily: HEADER_FOOTER_FONT_FAMILY,
      }}
    >
      <Text style={{ color: "#D85604", fontWeight: "bold", fontFamily: HEADER_FOOTER_FONT_FAMILY, fontSize: 10 }}>
        Adysun Ventures Pvt. Ltd.
      </Text>
      <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 2, justifyContent: "flex-start" }}>
        <Text style={{ fontSize: 8, marginRight: 6, color: "#666" }}>•</Text>
        <Text style={{ fontSize: 8, flex: 1, color: "#666" }}>
          Pune Office, S no 47, WorkPlex, Pune-Satara Road, Pune 411009
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 1, justifyContent: "flex-start" }}>
        <Text style={{ fontSize: 8, marginRight: 6, color: "#666" }}>•</Text>
        <Text style={{ fontSize: 8, flex: 1, color: "#666" }}>
          Thane Office, A2, 704, Kanchanpushp Society, kavesar, Thane West, Thane, Maharashtra - 400607
        </Text>
      </View>
      <Text style={{textAlign: "justify", fontSize: 8, color: "#666" }}>www.adysunventures.com | hr@adysunventures.com | 9579537523 | CIN : U72900PN2020PTC196380</Text>
      
    </View>
  );
};

export default GlobalPDFFooter;
