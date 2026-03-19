const { reactive } = Vue;

export const store = reactive({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,

    login(user, token) {
        this.user = user;
        this.token = token;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    logout() {
        this.user = null;
        this.token = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('crm-mock-current-user-id');
        delete axios.defaults.headers.common['Authorization'];
    },

    isAuthenticated() {
        return !!this.token;
    },

    isVerified() {
        return !!this.user?.is_verified;
    },

    hasRole(roles) {
        if (!this.user) return false;
        return roles.includes(this.user.role);
    }
});

if (store.token) {
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
