// Neutral Color Palette for LoveActs V2.0
export const Colors = {
  // Primary colors
  primary: '#5a6c75',          // Dark blue-gray
  primaryLight: '#7a8c95',     // Light blue-gray
  primaryDark: '#3a4c55',      // Darker blue-gray
  
  // Secondary colors
  secondary: '#4caf50',        // Soft green
  secondaryLight: '#6cbf70',   // Light green
  secondaryDark: '#2c8f30',    // Dark green
  
  // Neutral colors
  background: '#ffffff',       // White background
  backgroundSecondary: '#f8f9fa', // Light gray background
  backgroundTertiary: '#e9ecef',  // Medium gray background
  
  // Text colors
  textPrimary: '#2c3e50',      // Dark gray-blue text
  textSecondary: '#6c757d',    // Medium gray text
  textTertiary: '#adb5bd',     // Light gray text
  textLight: '#ffffff',        // White text
  
  // Border colors
  border: '#dee2e6',           // Light border
  borderSecondary: '#ced4da',  // Medium border
  
  // Status colors
  success: '#28a745',          // Green
  warning: '#ffc107',          // Yellow
  error: '#dc3545',            // Red
  info: '#17a2b8',            // Blue
  
  // UI Elements
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Legacy color mapping for easy migration
export const LegacyColors = {
  pink: Colors.primary,
  blue: Colors.secondary,
  white: Colors.background,
};