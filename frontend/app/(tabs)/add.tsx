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
  TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { activitiesAPI } from '../../utils/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { ActivityCategory, ActivityCreate } from '../../types';

const CATEGORIES = [
  { value: ActivityCategory.FISICO, label: '💪 Físico', color: '#ff6b6b' },
  { value: ActivityCategory.EMOCIONAL, label: '💖 Emocional', color: '#ff69b4' },
  { value: ActivityCategory.PRACTICO, label: '🛠️ Práctico', color: '#4ecdc4' },
  { value: ActivityCategory.GENERAL, label: '✨ General', color: '#95e1d3' },
];

export default function AddActivityScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm<Omit<ActivityCreate, 'receiver_id'>>();
  const selectedCategory = watch('category');

  const onSubmit = async (data: Omit<ActivityCreate, 'receiver_id'>) => {
    if (!user?.has_partner) {
      Alert.alert('Error', 'Necesitas vincular una pareja primero');
      return;
    }

    try {
      setIsLoading(true);
      
      // For now, we'll use the partner_id (this would normally come from user context)
      const activityData: ActivityCreate = {
        ...data,
        receiver_id: 'partner-id' // This should be the actual partner ID
      };

      await activitiesAPI.create(activityData);
      
      Alert.alert(
        '¡Actividad creada!',
        'Tu actividad de amor ha sido registrada exitosamente',
        [
          {
            text: 'Crear otra',
            onPress: () => reset(),
          },
          {
            text: 'Ver actividades',
            style: 'default',
          }
        ]
      );
      
      reset();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'No se pudo crear la actividad'
      );
    } finally {
      setIsLoading(false);
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
            <Text style={styles.title}>Nueva Actividad de Amor</Text>
            <Text style={styles.subtitle}>
              Registra un momento especial que quieres compartir con tu pareja
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="title"
              rules={{
                required: 'El título es requerido',
                minLength: {
                  value: 3,
                  message: 'Mínimo 3 caracteres'
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Título de la actividad"
                  placeholder="Ej: Cena romántica en casa"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.title?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              rules={{
                required: 'La descripción es requerida',
                minLength: {
                  value: 10,
                  message: 'Mínimo 10 caracteres'
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Descripción"
                  placeholder="Describe lo que hiciste o planeas hacer..."
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.description?.message}
                  multiline
                  numberOfLines={4}
                  style={styles.textArea}
                />
              )}
            />

            <View style={styles.categorySection}>
              <Text style={styles.categoryLabel}>Categoría</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((category) => (
                  <Controller
                    key={category.value}
                    control={control}
                    name="category"
                    rules={{ required: 'Selecciona una categoría' }}
                    render={({ field: { onChange, value } }) => (
                      <TouchableOpacity
                        style={[
                          styles.categoryButton,
                          { borderColor: category.color },
                          value === category.value && [
                            styles.categoryButtonSelected,
                            { backgroundColor: category.color + '20' }
                          ]
                        ]}
                        onPress={() => onChange(category.value)}
                      >
                        <Text style={styles.categoryText}>{category.label}</Text>
                      </TouchableOpacity>
                    )}
                  />
                ))}
              </View>
              {errors.category && (
                <Text style={styles.error}>{errors.category.message}</Text>
              )}
            </View>

            <Button
              title={isLoading ? 'Creando actividad...' : 'Crear Actividad'}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={styles.submitButton}
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
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff69b4',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  categoryButtonSelected: {
    borderWidth: 2,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  error: {
    color: '#ff4757',
    fontSize: 14,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 8,
  },
});