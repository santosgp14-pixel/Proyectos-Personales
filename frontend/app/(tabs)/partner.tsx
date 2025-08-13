import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { couplesAPI, activitiesAPI } from '../../utils/api';
import LoadingScreen from '../../components/LoadingScreen';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { ActivityRating } from '../../types';

export default function PartnerScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, setValue } = useForm<ActivityRating>();

  const { data: partner, isLoading: partnersLoading } = useQuery({
    queryKey: ['my-partner'],
    queryFn: couplesAPI.getMyPartner,
  });

  const { data: pendingRatings, isLoading: ratingsLoading } = useQuery({
    queryKey: ['pending-ratings'],
    queryFn: activitiesAPI.getPendingRatings,
  });

  const ratingMutation = useMutation({
    mutationFn: ({ activityId, rating }: { activityId: string; rating: ActivityRating }) =>
      activitiesAPI.rateActivity(activityId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setRatingModalVisible(false);
      setSelectedActivity(null);
      reset();
      Alert.alert('¡Calificación enviada!', 'Tu calificación ha sido guardada');
    },
    onError: (error: any) => {
      Alert.alert('Error', 'No se pudo enviar la calificación');
    },
  });

  const openRatingModal = (activity: any) => {
    setSelectedActivity(activity);
    setRatingModalVisible(true);
  };

  const submitRating = (data: ActivityRating) => {
    if (selectedActivity) {
      ratingMutation.mutate({
        activityId: selectedActivity.id,
        rating: data,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['my-partner'] }),
      queryClient.invalidateQueries({ queryKey: ['pending-ratings'] }),
    ]);
    setRefreshing(false);
  };

  if (partnersLoading || ratingsLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Partner Info */}
        {partner && (
          <View style={styles.partnerSection}>
            <View style={styles.partnerHeader}>
              <Ionicons name="heart" size={32} color="#ff69b4" />
              <Text style={styles.partnerName}>{partner.name}</Text>
            </View>
            
            {partner.latest_mood && (
              <View style={styles.moodSection}>
                <Text style={styles.moodTitle}>Estado de ánimo actual</Text>
                <View style={styles.moodDisplay}>
                  <Text style={styles.moodEmoji}>{partner.latest_mood}</Text>
                  {partner.mood_note && (
                    <Text style={styles.moodNote}>{partner.mood_note}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Pending Ratings */}
        <View style={styles.ratingsSection}>
          <Text style={styles.sectionTitle}>
            Actividades por calificar ({pendingRatings?.length || 0})
          </Text>
          
          {pendingRatings && pendingRatings.length > 0 ? (
            pendingRatings.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{activity.category}</Text>
                  </View>
                </View>
                
                <Text style={styles.activityDescription}>{activity.description}</Text>
                
                <View style={styles.activityFooter}>
                  <Text style={styles.activityDate}>
                    {new Date(activity.created_at).toLocaleDateString()}
                  </Text>
                  <Button
                    title="Calificar"
                    onPress={() => openRatingModal(activity)}
                    style={styles.rateButton}
                  />
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color="#4ecdc4" />
              <Text style={styles.emptyTitle}>¡Todo al día!</Text>
              <Text style={styles.emptyText}>
                No tienes actividades pendientes por calificar
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calificar Actividad</Text>
              <TouchableOpacity
                onPress={() => setRatingModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedActivity && (
              <View style={styles.modalBody}>
                <Text style={styles.activityTitleModal}>{selectedActivity.title}</Text>
                <Text style={styles.activityDescriptionModal}>{selectedActivity.description}</Text>
                
                <View style={styles.ratingSection}>
                  <Text style={styles.ratingLabel}>Calificación (1-5 estrellas)</Text>
                  <Controller
                    control={control}
                    name="rating"
                    rules={{ required: 'Selecciona una calificación' }}
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            onPress={() => onChange(star)}
                            style={styles.starButton}
                          >
                            <Ionicons
                              name={value >= star ? 'star' : 'star-outline'}
                              size={32}
                              color="#ffd700"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  />
                </View>

                <Controller
                  control={control}
                  name="comment"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Comentario (opcional)"
                      placeholder="Deja un comentario sobre esta actividad..."
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      multiline
                      numberOfLines={3}
                      style={styles.commentInput}
                    />
                  )}
                />

                <View style={styles.modalActions}>
                  <Button
                    title="Cancelar"
                    onPress={() => setRatingModalVisible(false)}
                    variant="outline"
                    style={styles.cancelButton}
                  />
                  <Button
                    title={ratingMutation.isPending ? 'Enviando...' : 'Enviar'}
                    onPress={handleSubmit(submitRating)}
                    disabled={ratingMutation.isPending}
                    style={styles.submitButton}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
  },
  partnerSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  partnerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  moodSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  moodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  moodNote: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  ratingsSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  activityCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#ff69b4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityDate: {
    fontSize: 12,
    color: '#999',
  },
  rateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
  },
  activityTitleModal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  activityDescriptionModal: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 4,
  },
  commentInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
});