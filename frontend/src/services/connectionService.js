// frontend/src/services/connectionService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/connections';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export const connectionService = {
  // Enviar solicitud de conexión
  sendRequest: async (receiverId, message = '', petId = null) => {
    try {
      const response = await axios.post(
        `${API_URL}/request`,
        { receiverId, message, petId },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      throw error;
    }
  },

  // Obtener solicitudes recibidas
  getReceivedRequests: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/requests/received`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      throw error;
    }
  },

  // Obtener solicitudes enviadas
  getSentRequests: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/requests/sent`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      throw error;
    }
  },

  // Aceptar solicitud
  acceptRequest: async (requestId) => {
    try {
      const response = await axios.post(
        `${API_URL}/request/${requestId}/accept`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
      throw error;
    }
  },

  // Rechazar solicitud
  rejectRequest: async (requestId) => {
    try {
      const response = await axios.post(
        `${API_URL}/request/${requestId}/reject`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      throw error;
    }
  },

  // Verificar estado de conexión con un usuario
  checkConnectionStatus: async (userId) => {
    try {
      const response = await axios.get(
        `${API_URL}/status/${userId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al verificar estado:', error);
      throw error;
    }
  },

  // Obtener mis conexiones
  getMyConnections: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/my-connections`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener conexiones:', error);
      throw error;
    }
  }
};