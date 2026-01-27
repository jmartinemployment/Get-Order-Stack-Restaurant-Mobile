import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  modifiers?: { name: string; priceAdjustment: number }[];
}

interface ReceiptData {
  orderNumber: string;
  orderType: string;
  customerName?: string;
  tableNumber?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
}

interface RestaurantInfo {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
}

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  data: ReceiptData | null;
  restaurantInfo?: RestaurantInfo;
}

const TAX_RATE = 0.065;

export function ReceiptModal({ visible, onClose, data, restaurantInfo }: ReceiptModalProps) {
  if (!visible || !data) return null;

  // Default restaurant info if not provided
  const restaurant = restaurantInfo || {
    name: 'Restaurant',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
  };

  const isDineIn = data.orderType.toLowerCase() === 'dine_in' || data.orderType.toLowerCase() === 'dine-in';

  const handlePrint = async () => {
    if (Platform.OS === 'web') {
      // For web, open print dialog
      const printContent = generatePrintHTML(data, restaurant);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    } else {
      // For mobile, show alert (would integrate with actual printer SDK)
      Alert.alert(
        'Print Receipt',
        'Receipt sent to printer',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Receipt Preview</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.receiptContainer}>
          <View style={styles.receipt} nativeID="receiptPreview">
            {/* Restaurant Header */}
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            {restaurant.address && (
              <Text style={styles.restaurantInfoText}>{restaurant.address}</Text>
            )}
            {(restaurant.city || restaurant.state || restaurant.zipCode) && (
              <Text style={styles.restaurantInfoText}>
                {[restaurant.city, restaurant.state, restaurant.zipCode].filter(Boolean).join(', ')}
              </Text>
            )}
            {restaurant.phone && (
              <Text style={styles.restaurantInfoText}>{restaurant.phone}</Text>
            )}

            <View style={styles.divider} />

            {/* Order Info */}
            <Text style={styles.orderNumber}>Order #{data.orderNumber}</Text>
            <Text style={styles.orderInfo}>
              {new Date(data.createdAt).toLocaleString()}
            </Text>
            <Text style={styles.orderInfo}>
              {data.orderType.toUpperCase()}
            </Text>
            {isDineIn && data.tableNumber && (
              <Text style={styles.tableInfo}>Table #{data.tableNumber}</Text>
            )}
            {data.customerName && (
              <Text style={styles.orderInfo}>Customer: {data.customerName}</Text>
            )}
            
            <View style={styles.divider} />
            
            {/* Items */}
            {data.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemQty}>{item.quantity}x</Text>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.modifiers?.map((mod, i) => (
                      <Text key={i} style={styles.itemMod}>
                        + {mod.name}
                        {mod.priceAdjustment > 0 && ` ($${mod.priceAdjustment.toFixed(2)})`}
                      </Text>
                    ))}
                  </View>
                </View>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              </View>
            ))}
            
            <View style={styles.divider} />
            
            {/* Totals */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${data.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({(TAX_RATE * 100).toFixed(1)}%)</Text>
              <Text style={styles.totalValue}>${data.tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>${data.total.toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            {/* Footer */}
            <Text style={styles.footer}>Thank you for your order!</Text>
            <Text style={styles.footerSmall}>Powered by OrderStack</Text>
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
            <Text style={styles.printBtnText}>🖨️ Print Receipt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function generatePrintHTML(data: ReceiptData, restaurant: RestaurantInfo): string {
  const isDineIn = data.orderType.toLowerCase() === 'dine_in' || data.orderType.toLowerCase() === 'dine-in';

  const itemsHTML = data.items.map(item => `
    <tr>
      <td>${item.quantity}x ${item.name}${
        item.modifiers?.map(m => `<br/><small style="color:#666">+ ${m.name}</small>`).join('') || ''
      }</td>
      <td style="text-align:right">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const addressLine = [restaurant.city, restaurant.state, restaurant.zipCode].filter(Boolean).join(', ');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${data.orderNumber}</title>
      <style>
        body { font-family: monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
        h1 { text-align: center; margin: 0; font-size: 18px; }
        .info { text-align: center; font-size: 12px; color: #666; }
        .table-info { text-align: center; font-size: 14px; font-weight: bold; margin: 5px 0; }
        hr { border: none; border-top: 1px dashed #ccc; margin: 10px 0; }
        table { width: 100%; font-size: 14px; }
        .total { font-weight: bold; }
        .grand-total { font-size: 16px; }
        .footer { text-align: center; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>${restaurant.name}</h1>
      <p class="info">${restaurant.address ? `${restaurant.address}<br/>` : ''}${addressLine ? `${addressLine}<br/>` : ''}${restaurant.phone || ''}</p>
      <hr/>
      <p><strong>Order #${data.orderNumber}</strong><br/>
      ${new Date(data.createdAt).toLocaleString()}<br/>
      ${data.orderType.toUpperCase()}<br/>
      ${isDineIn && data.tableNumber ? `<span class="table-info">Table #${data.tableNumber}</span><br/>` : ''}
      ${data.customerName ? `Customer: ${data.customerName}` : ''}</p>
      <hr/>
      <table>
        ${itemsHTML}
      </table>
      <hr/>
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">$${data.subtotal.toFixed(2)}</td></tr>
        <tr><td>Tax (${(TAX_RATE * 100).toFixed(1)}%)</td><td style="text-align:right">$${data.tax.toFixed(2)}</td></tr>
        <tr class="total grand-total"><td>TOTAL</td><td style="text-align:right">$${data.total.toFixed(2)}</td></tr>
      </table>
      <hr/>
      <p class="footer">Thank you for your order!<br/><small>Powered by OrderStack</small></p>
    </body>
    </html>
  `;
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: width * 0.4,
    maxHeight: height * 0.85,
    backgroundColor: '#16213e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: '#999',
    fontSize: 24,
  },
  receiptContainer: {
    padding: 16,
    maxHeight: height * 0.55,
  },
  receipt: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a2e',
  },
  restaurantInfoText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  tableInfo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  orderInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  itemQty: {
    width: 30,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  itemName: {
    color: '#1a1a2e',
    flex: 1,
  },
  itemMod: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  itemPrice: {
    color: '#1a1a2e',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    color: '#666',
    fontSize: 14,
  },
  totalValue: {
    color: '#1a1a2e',
    fontSize: 14,
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  grandTotalLabel: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    fontSize: 14,
    color: '#1a1a2e',
    marginTop: 8,
  },
  footerSmall: {
    textAlign: 'center',
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  printBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  printBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
