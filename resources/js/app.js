import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createAppKit } from '@reown/appkit/vue';          // ✅ correct
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { WagmiPlugin } from '@wagmi/vue';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { sepolia, arbitrum, bsc, base } from '@reown/appkit/networks';
import { createI18n } from "vue-i18n";
import VueTippy from "vue-tippy";
import { ZiggyVue } from '../../vendor/tightenco/ziggy';
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import "v-calendar/dist/style.css";
import "../css/vcalendar-theme.css";
import "../css/app.css";
import "./bootstrap";
import messages from "./vue-i18n-locales.generated.js";

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const queryClient = new QueryClient();

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob('./Pages/**/*.vue')),
    setup({ el, App, props, plugin }) {
        const i18n = createI18n({
            locale: props.initialPage.props.locale,
            fallbackLocale: "en",
            messages,
            legacy: false,
        });

        // 1. Create Wagmi adapter
        const wagmiAdapter = new WagmiAdapter({
            networks: [sepolia, arbitrum, bsc, base],
            projectId: import.meta.env.VITE_PROJECT_ID,
            transports: {
                [sepolia.id]: `https://rpc.ankr.com/eth_sepolia/${import.meta.env.VITE_ANKR_KEY}`,
                [arbitrum.id]: `https://rpc.ankr.com/arbitrum/${import.meta.env.VITE_ANKR_KEY}`,
                [bsc.id]: `https://rpc.ankr.com/bsc/${import.meta.env.VITE_ANKR_KEY}`,
                [base.id]: `https://rpc.ankr.com/base/${import.meta.env.VITE_ANKR_KEY}`,
            }
        });

        // 2. Initialize AppKit (this registers all web components properly)
        createAppKit({
            adapters: [wagmiAdapter],
            networks: [sepolia, arbitrum, bsc, base],
            projectId: import.meta.env.VITE_PROJECT_ID,
            themeMode: 'dark',
            features: { analytics: false }
        });

        // 3. Mount Vue
        const app = createApp({ render: () => h(App, props) })
            .use(plugin)
            .use(ZiggyVue)
            .use(WagmiPlugin, { config: wagmiAdapter.wagmiConfig })
            .use(VueQueryPlugin, { queryClient })
            .use(i18n)
            .use(VueTippy)
            .mount(el);

        return app;
    },
    progress: { color: '#54b588' },
});
