const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    // Try refresh token
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('token', data.token);
          // Retry not implemented here to keep simple - user will see auth error
        }
      } catch (e) { /* refresh failed */ }
    }
    const error = await response.json().catch(() => ({ error: 'Unauthorized' }));
    throw new Error(error.error || 'Unauthorized');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
};

export const api = {
  // Auth
  login: async (email, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(response);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  },

  register: async (email, password, name) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    return handleResponse(response);
  },

  getDemoCredentials: async () => {
    const response = await fetch(`${API_BASE}/auth/demo-credentials`);
    return handleResponse(response);
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    } catch (e) { /* ok */ }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  completeOnboarding: async () => {
    const response = await fetch(`${API_BASE}/auth/onboarding-complete`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Password Reset
  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE}/password-reset/forgot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(response);
  },

  resetPassword: async (token, password) => {
    const response = await fetch(`${API_BASE}/password-reset/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    return handleResponse(response);
  },

  // Essays
  essays: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE}/essays${query ? '?' + query : ''}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    getOne: async (id) => {
      const response = await fetch(`${API_BASE}/essays/${id}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (data) => {
      const response = await fetch(`${API_BASE}/essays`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    update: async (id, data) => {
      const response = await fetch(`${API_BASE}/essays/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE}/essays/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      return handleResponse(response);
    },
    regrade: async (id) => {
      const response = await fetch(`${API_BASE}/essays/${id}/regrade`, { method: 'POST', headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },

  // Music Lessons
  music: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE}/music${query ? '?' + query : ''}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    getOne: async (id) => {
      const response = await fetch(`${API_BASE}/music/${id}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (data) => {
      const response = await fetch(`${API_BASE}/music`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    update: async (id, data) => {
      const response = await fetch(`${API_BASE}/music/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE}/music/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      return handleResponse(response);
    },
    regenerate: async (id) => {
      const response = await fetch(`${API_BASE}/music/${id}/regenerate`, { method: 'POST', headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },

  // Quizzes
  quizzes: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE}/quizzes${query ? '?' + query : ''}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    getOne: async (id) => {
      const response = await fetch(`${API_BASE}/quizzes/${id}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (data) => {
      const response = await fetch(`${API_BASE}/quizzes`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    update: async (id, data) => {
      const response = await fetch(`${API_BASE}/quizzes/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE}/quizzes/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      return handleResponse(response);
    },
    regenerate: async (id) => {
      const response = await fetch(`${API_BASE}/quizzes/${id}/regenerate`, { method: 'POST', headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },

  // Reading Analyses
  reading: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE}/reading${query ? '?' + query : ''}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    getOne: async (id) => {
      const response = await fetch(`${API_BASE}/reading/${id}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (data) => {
      const response = await fetch(`${API_BASE}/reading`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    update: async (id, data) => {
      const response = await fetch(`${API_BASE}/reading/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE}/reading/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      return handleResponse(response);
    },
    reanalyze: async (id) => {
      const response = await fetch(`${API_BASE}/reading/${id}/reanalyze`, { method: 'POST', headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },

  // Learning Paths
  learning: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE}/learning${query ? '?' + query : ''}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    getOne: async (id) => {
      const response = await fetch(`${API_BASE}/learning/${id}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (data) => {
      const response = await fetch(`${API_BASE}/learning`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    update: async (id, data) => {
      const response = await fetch(`${API_BASE}/learning/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE}/learning/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      return handleResponse(response);
    },
    regenerate: async (id) => {
      const response = await fetch(`${API_BASE}/learning/${id}/regenerate`, { method: 'POST', headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },

  // Language Immersion
  language: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE}/language${query ? '?' + query : ''}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    getOne: async (id) => {
      const response = await fetch(`${API_BASE}/language/${id}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (data) => {
      const response = await fetch(`${API_BASE}/language`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    update: async (id, data) => {
      const response = await fetch(`${API_BASE}/language/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE}/language/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      return handleResponse(response);
    },
    regenerate: async (id) => {
      const response = await fetch(`${API_BASE}/language/${id}/regenerate`, { method: 'POST', headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },

  // Profile
  profile: {
    get: async () => {
      const response = await fetch(`${API_BASE}/profile`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    update: async (data) => {
      const response = await fetch(`${API_BASE}/profile`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    changePassword: async (currentPassword, newPassword) => {
      const response = await fetch(`${API_BASE}/profile/password`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ currentPassword, newPassword }) });
      return handleResponse(response);
    }
  },

  // Settings
  settings: {
    get: async () => {
      const response = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    update: async (data) => {
      const response = await fetch(`${API_BASE}/settings`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    }
  },

  // Admin
  admin: {
    getUsers: async () => {
      const response = await fetch(`${API_BASE}/admin/users`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    getUser: async (id) => {
      const response = await fetch(`${API_BASE}/admin/users/${id}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    updateUser: async (id, data) => {
      const response = await fetch(`${API_BASE}/admin/users/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    deleteUser: async (id) => {
      const response = await fetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      return handleResponse(response);
    },
    getStats: async () => {
      const response = await fetch(`${API_BASE}/admin/stats`, { headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },

  // Progress
  progress: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/progress`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    getStats: async () => {
      const response = await fetch(`${API_BASE}/progress/stats`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (data) => {
      const response = await fetch(`${API_BASE}/progress`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    }
  },

  // Search
  search: async (q, type = 'all') => {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}&type=${type}`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  // Export
  exportData: async (type, format = 'json') => {
    const response = await fetch(`${API_BASE}/export/${type}?format=${format}`, { headers: getAuthHeaders() });
    if (format === 'csv') {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      return;
    }
    return handleResponse(response);
  },

  // Notifications
  notifications: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    getUnreadCount: async () => {
      const response = await fetch(`${API_BASE}/notifications/unread-count`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    markRead: async (id) => {
      const response = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT', headers: getAuthHeaders() });
      return handleResponse(response);
    },
    markAllRead: async () => {
      const response = await fetch(`${API_BASE}/notifications/read-all`, { method: 'PUT', headers: getAuthHeaders() });
      return handleResponse(response);
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE}/notifications/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },

  // Feedback
  feedback: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/feedback`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    getOne: async (id) => {
      const response = await fetch(`${API_BASE}/feedback/${id}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (data) => {
      const response = await fetch(`${API_BASE}/feedback`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    update: async (id, data) => {
      const response = await fetch(`${API_BASE}/feedback/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
      return handleResponse(response);
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE}/feedback/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },

  // Contact
  contact: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/contact`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (data) => {
      const response = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    }
  },

  // Audit Logs
  auditLogs: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE}/audit-logs${query ? '?' + query : ''}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },

  // GDPR
  gdpr: {
    exportData: async () => {
      const response = await fetch(`${API_BASE}/gdpr/export`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    getDataSummary: async () => {
      const response = await fetch(`${API_BASE}/gdpr/data-summary`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    deleteAccount: async (confirmation) => {
      const response = await fetch(`${API_BASE}/gdpr/delete-account`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ confirmation })
      });
      return handleResponse(response);
    }
  }
};

export default api;
