// Vibrant yet Professional Color Palette for LoveActs V2.0
export const Colors = {
  // Primary colors - More vibrant blues
  primary: '#3498db',          // Bright blue
  primaryLight: '#5dade2',     // Light bright blue
  primaryDark: '#2980b9',      // Darker bright blue
  
  // Secondary colors - Warm and friendly
  secondary: '#e74c3c',        // Warm red/coral
  secondaryLight: '#ec7063',   // Light coral
  secondaryDark: '#c0392b',    // Dark coral
  
  // Accent colors - Fresh and lively
  accent: '#f39c12',           // Warm orange
  accentLight: '#f7dc6f',      // Light warm yellow
  
  // Neutral colors - Warm grays
  background: '#ffffff',       // Pure white background
  backgroundSecondary: '#f8f9fa', // Very light gray
  backgroundTertiary: '#ecf0f1',  // Light warm gray
  
  // Text colors - Professional but warm
  textPrimary: '#2c3e50',      // Dark blue-gray text
  textSecondary: '#7f8c8d',    // Medium gray text
  textTertiary: '#bdc3c7',     // Light gray text
  textLight: '#ffffff',        // White text
  
  // Border colors
  border: '#dee2e6',           // Light border
  borderSecondary: '#ced4da',  // Medium border
  
  // Status colors - Vibrant and clear
  success: '#27ae60',          // Fresh green
  warning: '#f39c12',          // Warm orange
  error: '#e74c3c',            // Clear red
  info: '#3498db',            // Bright blue
  
  // Special colors for love theme
  love: '#e91e63',            // Pink for romantic elements
  loveLight: '#f8bbd9',       // Light pink
  heart: '#e74c3c',           // Heart red
  
  // UI Elements
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Legacy color mapping for easy migration
export const LegacyColors = {
  pink: Colors.love,
  blue: Colors.primary,
  white: Colors.background,
};