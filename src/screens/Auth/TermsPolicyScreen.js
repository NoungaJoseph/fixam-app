import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const TermsPolicyScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  
  return (
    <View 
      style={[styles.background, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Terms & Privacy Policy</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>Last Updated: May 2024</Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Terms of Service</Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            Welcome to Fixam. By using our platform, you agree to comply with and be bound by the following terms and conditions of use...
          </Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            We connect clients with professional service providers. Fixam is not responsible for the quality of work performed but facilitates the connection and payment process.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Privacy Policy</Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            Your privacy is important to us. It is Fixam's policy to respect your privacy regarding any information we may collect from you across our website and app...
          </Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>3. User Accounts</Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Contact Us</Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            If you have any questions about these Terms, please contact us at support@fixam.com.
          </Text>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 25 },
  lastUpdated: { fontSize: 13, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  text: { fontSize: 15, lineHeight: 24, marginBottom: 15 },
});

export default TermsPolicyScreen;
