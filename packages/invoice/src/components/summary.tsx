import { Text, View } from "@react-pdf/renderer";
import { formatAmount } from "../utils/format";

interface SummaryProps {
  amount: number;
  tax?: number;
  vat?: number;
  currency: string;
}

export function Summary({ amount, tax, vat, currency }: SummaryProps) {
  return (
    <View
      style={{
        marginTop: 60,
        marginBottom: 40,
        alignItems: "flex-end",
        marginLeft: "auto",
        width: 400,
      }}
    >
      {tax && (
        <View style={{ flexDirection: "row", marginBottom: 5 }}>
          <Text style={{ fontSize: 9, marginRight: 10 }}>Tax</Text>
          <Text style={{ fontSize: 9 }}>
            {formatAmount({ currency, amount: tax })}
          </Text>
        </View>
      )}

      {vat && (
        <View style={{ flexDirection: "row", marginBottom: 5 }}>
          <Text style={{ fontSize: 9, marginRight: 10 }}>VAT</Text>
          <Text style={{ fontSize: 9 }}>
            {formatAmount({ currency, amount: vat })}
          </Text>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          marginTop: 5,
          borderTopWidth: 0.5,
          borderTopColor: "#000",
          paddingTop: 5,
        }}
      >
        <Text style={{ fontSize: 11, marginRight: 10 }}>Total:</Text>
        <Text style={{ fontSize: 21 }}>
          {formatAmount({ currency, amount })}
        </Text>
      </View>
    </View>
  );
}