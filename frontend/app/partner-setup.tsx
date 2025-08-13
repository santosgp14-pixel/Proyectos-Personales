import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import Input from '../components/Input';
import { couplesAPI } from '../utils/api';
import { LinkPartnerData } from '../types';

export default function PartnerSetupScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateUser } = useAuth();
  
  const { control, handleSubmit, formState: { errors } } = useForm<LinkPartnerData>();

  const onSubmit = async (data: LinkPartnerData) => {
    try {
      setIsLoading(true);
      await couplesAPI.linkPartner(data);
      
      // Update user to have partner
      if (user) {
        updateUser({ ...user, has_partner: true });
      }
      
      Alert.alert(
        '¡Pareja vinculada!',
        'Te has conectado exitosamente con tu pareja',
        [
          {
            text: 'Continuar',
            onPress: () => router.replace('/(tabs)/home')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error al vincular pareja',
        error.response?.data?.detail || 'Código inválido o pareja ya vinculada'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    if (user?.partner_code) {
      // In a real app, we'd use Clipboard API
      Alert.alert(
        'Código copiado',
        `Tu código es: ${user.partner_code}\n\nCompártelo con tu pareja para que puedan conectarse.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>💕 Vincular Pareja</Text>
            <Text style={styles.subtitle}>
              Conecta con tu pareja para comenzar a compartir momentos especiales
            </Text>
          </View>

          <View style={styles.codeSection}>
            <Text style={styles.sectionTitle}>Tu código único</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{user?.partner_code}</Text>
              <Button
                title="Copiar Código"
                onPress={copyCode}
                variant="outline"
                style={styles.copyButton}
              />
            </View>
            <Text style={styles.codeHelp}>
              Comparte este código con tu pareja para que se pueda conectar contigo
            </Text>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Código de tu pareja</Text>
            
            <Controller
              control={control}
              name="code"
              rules={{
                required: 'El código es requerido',
                minLength: {
                  value: 6,
                  message: 'El código debe tener 6 caracteres'
                },
                maxLength: {
                  value: 6,
                  message: 'El código debe tener 6 caracteres'
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Código de vinculación"
                  placeholder="ABC123"
                  value={value}
                  onChangeText={(text) => onChange(text.toUpperCase())}
                  onBlur={onBlur}
                  error={errors.code?.message}
                  autoCapitalize="characters"
                  maxLength={6}
                />
              )}
            />

            <Button
              title={isLoading ? 'Vinculando...' : 'Vincular Pareja'}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={styles.linkButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff69b4',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  codeSection: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff69b4',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ff69b4',
    marginBottom: 16,
    letterSpacing: 4,
  },
  copyButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  codeHelp: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  linkButton: {
    marginTop: 8,
  },
});