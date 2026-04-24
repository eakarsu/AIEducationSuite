import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      dashboard: 'Dashboard',
      essays: 'Essay Grader',
      music: 'Music Teacher',
      quizzes: 'Quiz Maker',
      reading: 'Reading Analyzer',
      learning: 'Learning Paths',
      profile: 'Profile',
      settings: 'Settings',
      notifications: 'Notifications',
      search: 'Search',
      progress: 'Progress',
      feedback: 'Feedback',
      contact: 'Contact',
      admin: 'Admin Panel',
      logout: 'Logout',
      welcome: 'Welcome back',
      login: 'Sign In',
      register: 'Register',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service'
    }
  },
  es: {
    translation: {
      dashboard: 'Panel',
      essays: 'Corrector de Ensayos',
      music: 'Profesor de Musica',
      quizzes: 'Creador de Examenes',
      reading: 'Analizador de Lectura',
      learning: 'Rutas de Aprendizaje',
      profile: 'Perfil',
      settings: 'Configuracion',
      notifications: 'Notificaciones',
      search: 'Buscar',
      progress: 'Progreso',
      feedback: 'Comentarios',
      contact: 'Contacto',
      admin: 'Panel de Admin',
      logout: 'Cerrar Sesion',
      welcome: 'Bienvenido',
      login: 'Iniciar Sesion',
      register: 'Registrarse',
      privacy: 'Politica de Privacidad',
      terms: 'Terminos de Servicio'
    }
  },
  fr: {
    translation: {
      dashboard: 'Tableau de bord',
      essays: 'Correcteur de Dissertations',
      music: 'Professeur de Musique',
      quizzes: 'Createur de Quiz',
      reading: 'Analyseur de Lecture',
      learning: 'Parcours d\'Apprentissage',
      profile: 'Profil',
      settings: 'Parametres',
      notifications: 'Notifications',
      search: 'Rechercher',
      progress: 'Progres',
      feedback: 'Commentaires',
      contact: 'Contact',
      admin: 'Panneau Admin',
      logout: 'Deconnexion',
      welcome: 'Bienvenue',
      login: 'Se connecter',
      register: 'S\'inscrire',
      privacy: 'Politique de Confidentialite',
      terms: 'Conditions d\'Utilisation'
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;
