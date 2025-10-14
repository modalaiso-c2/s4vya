/**
 * Error handler utility to prevent leaking sensitive information to users
 * Maps technical errors to user-friendly messages
 */

interface ErrorMap {
  [key: string]: string;
}

const ERROR_MESSAGES: ErrorMap = {
  // Auth errors
  'Invalid login credentials': 'Email ou mot de passe incorrect',
  'User already registered': 'Un compte existe déjà avec cet email',
  'Email not confirmed': 'Veuillez confirmer votre email',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
  
  // Database errors
  '23505': 'Cette valeur existe déjà',
  '23503': 'Impossible de supprimer cet élément',
  'duplicate key': 'Cette valeur existe déjà',
  
  // Storage errors
  'The resource already exists': 'Ce fichier existe déjà',
  'Object not found': 'Fichier introuvable',
};

/**
 * Handles errors by returning user-friendly messages
 * Logs technical details in development only
 */
export const handleError = (error: any, fallbackMessage: string = 'Une erreur est survenue'): string => {
  // Log error in development mode only
  if (import.meta.env.DEV) {
    console.error('Error details:', error);
  }

  // Extract error message
  const errorMessage = error?.message || error?.error_description || String(error);
  
  // Check for known error patterns
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(key)) {
      return message;
    }
  }
  
  // Check for PostgreSQL error codes
  if (error?.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  
  // Return fallback for unknown errors
  return fallbackMessage;
};
