import './mockApi.js';
import router from './router.js?v=20260318-calendar-refresh-3';

const app = Vue.createApp({
    template: `
        <div>
            <router-view></router-view>
        </div>
    `
});

app.use(router);
app.mount('#app');
