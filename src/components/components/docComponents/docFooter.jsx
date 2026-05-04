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
      <Text style={{ color: "#D85604", fontWeight: "bold", fontFamily: HEADER_FOOTER_FONT_FAMILY, fontSize: 12 }}>
        Adysun Ventures Pvt. Ltd.
      </Text>
      <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 2 }}>
        <View style={{ width: 10, alignItems: "center", marginRight: 4, marginTop: 1 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#D85604",
            }}
          />
          <View
            style={{
              width: 2,
              height: 5,
              backgroundColor: "#D85604",
              marginTop: 1,
            }}
          />
        </View>
        <Text style={{ fontSize: 10, flex: 1 }}>
          Pune Office, S no 47, WorkPlex, Pune-Satara Road, Pune 411009
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 1 }}>
        <View style={{ width: 10, alignItems: "center", marginRight: 4, marginTop: 1 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#D85604",
            }}
          />
          <View
            style={{
              width: 2,
              height: 5,
              backgroundColor: "#D85604",
              marginTop: 1,
            }}
          />
        </View>
        <Text style={{ fontSize: 10, flex: 1 }}>
          Thane Office, A2, 704, Kanchanpushp Society, kavesar, Thane West, Thane, Maharashtra - 400607
        </Text>
      </View>
      <Text>www.adysunventures.com | hr@adysunventures.com | 9579537523</Text>
      
    </View>
  );
};

export default GlobalPDFFooter;
