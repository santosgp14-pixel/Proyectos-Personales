import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { activitiesAPI } from '../../utils/api';
import LoadingScreen from '../../components/LoadingScreen';

export default function MemoriesScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: memories, isLoading, refetch } = useQuery({
    queryKey: ['special-memories'],
    queryFn: activitiesAPI.getSpecialMemories,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'físico': return '#ff6b6b';
      case 'emocional': return '#ff69b4';
      case 'práctico': return '#4ecdc4';
      case 'general': return '#95e1d3';
      default: return '#ff69b4';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'físico': return 'fitness';
      case 'emocional': return 'heart';
      case 'práctico': return 'construct';
      case 'general': return 'star';
      default: return 'heart';
    }
  };

  if (isLoading) {
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
        <View style={styles.header}>
          <Text style={styles.title}>✨ Recuerdos Especiales</Text>
          <Text style={styles.subtitle}>
            Momentos mágicos que han recibido 5 estrellas
          </Text>
        </View>

        {memories && memories.length > 0 ? (
          <View style={styles.memoriesContainer}>
            {memories.map((memory, index) => (
              <TouchableOpacity key={memory.id} style={styles.memoryCard}>
                <View style={styles.memoryHeader}>
                  <View style={styles.memoryInfo}>
                    <Text style={styles.memoryTitle}>{memory.title}</Text>
                    <View style={styles.memoryMeta}>
                      <Ionicons 
                        name={getCategoryIcon(memory.category)} 
                        size={16} 
                        color={getCategoryColor(memory.category)} 
                      />
                      <Text style={[styles.categoryText, { color: getCategoryColor(memory.category) }]}>
                        {memory.category}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name="star"
                        size={16}
                        color="#ffd700"
                      />
                    ))}
                  </View>
                </View>

                <Text style={styles.memoryDescription}>{memory.description}</Text>

                {memory.comment && (
                  <View style={styles.commentSection}>
                    <Ionicons name="chatbubble" size={16} color="#666" />
                    <Text style={styles.commentText}>"{memory.comment}"</Text>
                  </View>
                )}

                <View style={styles.memoryFooter}>
                  <Text style={styles.memoryDate}>
                    {new Date(memory.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  {memory.rated_at && (
                    <Text style={styles.ratingDate}>
                      Calificado: {new Date(memory.rated_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshText}>Mostrar nuevos recuerdos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Sin recuerdos especiales aún</Text>
            <Text style={styles.emptyText}>
              Los momentos que reciban 5 estrellas aparecerán aquí como recuerdos especiales
            </Text>
            <TouchableOpacity style={styles.createButton}>
              <Text style={styles.createButtonText}>Crear primera actividad</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  memoriesContainer: {
    flex: 1,
  },
  memoryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  memoryInfo: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  memoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginLeft: 16,
  },
  memoryDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  commentSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  memoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  memoryDate: {
    fontSize: 14,
    color: '#999',
  },
  ratingDate: {
    fontSize: 12,
    color: '#999',
  },
  refreshButton: {
    backgroundColor: '#ff69b4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  refreshText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#ff69b4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});