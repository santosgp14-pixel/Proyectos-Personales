import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { achievementsAPI } from '../../utils/api';
import LoadingScreen from '../../components/LoadingScreen';
import Button from '../../components/Button';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['my-achievements'],
    queryFn: achievementsAPI.getMyAchievements,
  });

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await logout();
            setLoggingOut(false);
          },
        },
      ]
    );
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'first_activity': return 'heart';
      case 'ten_activities': return 'trophy';
      case 'first_five_stars': return 'star';
      case 'five_five_stars': return 'ribbon';
      case 'daily_mood_week': return 'happy';
      case 'partner_linked': return 'people';
      default: return 'medal';
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'first_activity': return '#ff69b4';
      case 'ten_activities': return '#ffd700';
      case 'first_five_stars': return '#87ceeb';
      case 'five_five_stars': return '#ff6b6b';
      case 'daily_mood_week': return '#4ecdc4';
      case 'partner_linked': return '#95e1d3';
      default: return '#999';
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#ff69b4" />
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          {user?.has_partner && (
            <View style={styles.partnerStatus}>
              <Ionicons name="heart" size={16} color="#4ecdc4" />
              <Text style={styles.partnerText}>Conectado con tu pareja</Text>
            </View>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Mi Código Único</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{user?.partner_code}</Text>
            <TouchableOpacity style={styles.copyButton}>
              <Ionicons name="copy" size={20} color="#ff69b4" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>
            Mis Logros ({achievements?.length || 0})
          </Text>
          
          {achievements && achievements.length > 0 ? (
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementCard}>
                  <View style={styles.achievementIcon}>
                    <Ionicons
                      name={getAchievementIcon(achievement.achievement_type)}
                      size={32}
                      color={getAchievementColor(achievement.achievement_type)}
                    />
                  </View>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                  <Text style={styles.achievementDate}>
                    {new Date(achievement.unlocked_at).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyAchievements}>
              <Ionicons name="trophy-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>Sin logros aún</Text>
              <Text style={styles.emptyText}>
                Comienza a usar la aplicación para desbloquear logros
              </Text>
            </View>
          )}
        </View>

        {/* App Info */}
        <View style={styles.infoSection}>
          <TouchableOpacity style={styles.infoItem}>
            <Ionicons name="help-circle" size={24} color="#666" />
            <Text style={styles.infoText}>Ayuda y Soporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.infoItem}>
            <Ionicons name="information-circle" size={24} color="#666" />
            <Text style={styles.infoText}>Acerca de LoveActs</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.infoItem}>
            <Ionicons name="document-text" size={24} color="#666" />
            <Text style={styles.infoText}>Términos y Condiciones</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>LoveActs v2.0.0</Text>
        </View>

        {/* Logout Button */}
        <Button
          title={loggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
          onPress={handleLogout}
          disabled={loggingOut}
          variant="outline"
          style={styles.logoutButton}
        />
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
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  partnerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0ffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  partnerText: {
    fontSize: 14,
    color: '#4ecdc4',
    fontWeight: '500',
    marginLeft: 4,
  },
  statsSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  codeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff69b4',
    flex: 1,
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  achievementsSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIcon: {
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDate: {
    fontSize: 10,
    color: '#999',
  },
  emptyAchievements: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  versionSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
  logoutButton: {
    marginBottom: 16,
  },
});