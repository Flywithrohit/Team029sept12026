const { reactive } = Vue;

export const store = reactive({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,

    // Helper to check if the browser session cookie exists
    isSessionActive() {
        return document.cookie.split(';').some((item) => item.trim().startsWith('crm_session_active='));
    },

    // Bridge logic: If browser was closed and reopened, clear localStorage
    checkSession() {
        if (this.token && !this.isSessionActive()) {
            console.log("Browser session expired (browser was closed). Logging out...");
            this.logout();
            window.location.hash = '#/login';
            return false;
        }
        return true;
    },

    login(user, token) {
        this.user = user;
        this.token = token;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        
        // Set a session cookie (no expires/max-age makes it a session cookie)
        // This cookie stays active as long as the browser (or any related tab) is open
        document.cookie = "crm_session_active=true; path=/";
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    logout() {
        this.user = null;
        this.token = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Clear the session cookie
        document.cookie = "crm_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        
        delete axios.defaults.headers.common['Authorization'];
    },

    isAuthenticated() {
        // Must have token AND an active browser session
        return !!this.token && this.isSessionActive();
    },

    isVerified() {
        return !!this.user?.is_verified;
    },

    hasRole(roles) {
        if (!this.user) return false;
        return roles.includes(this.user.role);
    }
});

// Run session check immediately on load
store.checkSession();

if (store.token && store.isSessionActive()) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${store.token}`;
}
axios.defaults.baseURL = ''; 

axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            store.logout();
            window.location.hash = '#/login';
        }
        return Promise.reject(error);
    }
);
