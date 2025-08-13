import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { dashboardAPI, moodsAPI } from '../../utils/api';
import LoadingScreen from '../../components/LoadingScreen';
import { MoodEmoji } from '../../types';
import { Colors } from '../../constants/Colors';

const MOOD_OPTIONS = [
  { emoji: MoodEmoji.VERY_SAD, label: 'Muy triste' },
  { emoji: MoodEmoji.SAD, label: 'Triste' },
  { emoji: MoodEmoji.NEUTRAL, label: 'Normal' },
  { emoji: MoodEmoji.HAPPY, label: 'Feliz' },
  { emoji: MoodEmoji.VERY_HAPPY, label: 'Muy feliz' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<MoodEmoji | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardAPI.getStats,
  });

  const { data: myMoods } = useQuery({
    queryKey: ['my-moods'],
    queryFn: moodsAPI.getMyMoods,
  });

  useEffect(() => {
    // Check if user has set mood today
    if (myMoods && myMoods.length > 0) {
      const today = new Date().toDateString();
      const todayMood = myMoods.find(mood => 
        new Date(mood.date).toDateString() === today
      );
      if (todayMood) {
        setSelectedMood(todayMood.mood_emoji);
      }
    }
  }, [myMoods]);

  const handleMoodSelect = async (mood: MoodEmoji) => {
    try {
      setSelectedMood(mood);
      await moodsAPI.create({ mood_emoji: mood });
      Alert.alert('¡Estado de ánimo actualizado!', 'Tu estado de ánimo ha sido guardado.');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo guardar tu estado de ánimo');
      setSelectedMood(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>¡Hola, {user?.name}! 👋</Text>
          <Text style={styles.welcomeSubtext}>¿Cómo te sientes hoy?</Text>
        </View>

        {/* Mood Selector */}
        <View style={styles.moodSection}>
          <Text style={styles.sectionTitle}>Mi estado de ánimo</Text>
          <View style={styles.moodContainer}>
            {MOOD_OPTIONS.map((mood) => (
              <TouchableOpacity
                key={mood.emoji}
                style={[
                  styles.moodButton,
                  selectedMood === mood.emoji && styles.moodButtonSelected
                ]}
                onPress={() => handleMoodSelect(mood.emoji)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="heart" size={24} color={Colors.secondary} />
              <Text style={styles.statNumber}>{stats?.total_activities_given || 0}</Text>
              <Text style={styles.statLabel}>Actividades dadas</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color={Colors.warning} />
              <Text style={styles.statNumber}>{stats?.average_rating_given?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Calificación promedio</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color={Colors.primary} />
              <Text style={styles.statNumber}>{stats?.achievements_count || 0}</Text>
              <Text style={styles.statLabel}>Logros</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color={Colors.info} />
              <Text style={styles.statNumber}>{stats?.pending_ratings || 0}</Text>
              <Text style={styles.statLabel}>Por calificar</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={20} color={Colors.textLight} />
            <Text style={styles.actionText}>Nueva actividad</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.secondaryActionButton]}>
            <Ionicons name="heart" size={20} color={Colors.textLight} />
            <Text style={styles.actionText}>Ver mi pareja</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  scrollContent: {
    padding: 16,
  },
  welcomeSection: {
    backgroundColor: Colors.background,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  moodSection: {
    backgroundColor: Colors.background,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    minWidth: 60,
  },
  moodButtonSelected: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statsSection: {
    backgroundColor: Colors.background,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  actionsSection: {
    backgroundColor: Colors.background,
    padding: 20,
    borderRadius: 16,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryActionButton: {
    backgroundColor: Colors.secondary,
  },
  actionText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});