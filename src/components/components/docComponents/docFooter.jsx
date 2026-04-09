// GlobalPDFFooter.jsx
import { View, Text } from "@react-pdf/renderer";

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
        paddingTop: 6
      }}
    >
      <Text style={{ color: "#D85604", fontWeight: "bold" }}>Adysun Ventures Pvt. Ltd.</Text>
      <Text>Pune Office, S no 47, WorkPlex, Pune-Satara Road, Pune 411009</Text>
      <Text>Thane Office, A2, 704, Kanchanpushp Society, kavesar, Thane West, Thane, Maharashtra - 400607</Text>
      <Text>www.adysunventures.com | hr@adysunventures.com | 9579537523</Text>
      
    </View>
  );
};

export default GlobalPDFFooter;
