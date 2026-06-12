<!-- eslint-disable import/order -->
<script setup>
import { computed, ref, watch } from "vue";
import { useAppKit } from '@reown/appkit/vue';
import { router } from "@inertiajs/vue3";
import { debouncedWatch, useUrlSearchParams } from "@vueuse/core";
import {
    AlarmClockCheck,
    BellPlus,
    ChartCandlestick,
    Flame,
    LoaderCircle,
    Search,
    SquareArrowUp,
} from "lucide-vue-next";

import BaseButton from "@/Components/BaseButton.vue";
import CollapseTransition from "@/Components/CollapseTransition.vue";
import FormInput from "@/Components/FormInput.vue";
import Pagination from "@/Components/Pagination.vue";
import SmallSwitch from "@/Components/SmallSwitch.vue";
import { ucfirst } from "@/hooks";
import { useLaunchpadsData } from "@/hooks/useLaunchpadsData";
import AppLayout from "@/Layouts/AppLayout.vue";
import HowItWorksModal from "@/Layouts/AppLayout/HowItWorksModal.vue";
import AnimationsRow from "@/Pages/Launchpads/AnimationsRow.vue";
import BarButton from "@/Pages/Launchpads/BarButton.vue";
import IndexCard from "@/Pages/Launchpads/IndexCard.vue";
import { useChainId } from "@wagmi/vue";

// AppKit modal control
const { open, close } = useAppKit();

// 🔒 Prevent multiple simultaneous open calls
let isOpening = false;

// Connect wallet button
const openConnectModal = () => {
    if (isOpening) return;
    isOpening = true;
    open();
    setTimeout(() => { isOpening = false; }, 1000);
};

// Switch network button
let networkSwitchTimeout = null;
const openNetworkModal = () => {
    if (isOpening) return;
    isOpening = true;
    open({ view: 'Networks' });
    setTimeout(() => { isOpening = false; }, 1000);
    
    if (networkSwitchTimeout) clearTimeout(networkSwitchTimeout);
    networkSwitchTimeout = setTimeout(() => {
        close();
        networkSwitchTimeout = null;
    }, 5000);
};

const props = defineProps({
    launchpads: [Array, Object],
    top: Array,
    usdRates: [Array, Object],
    type: String,
});

const launchpadsList = computed(() => props.launchpads.data);
const launchpadsInfo = useLaunchpadsData(launchpadsList, props.usdRates);
const showHowItWorks = ref(false);
const filters = [
    { id: "trending", icon: Flame },
    { id: "top", icon: ChartCandlestick },
    { id: "rising", icon: SquareArrowUp },
    { id: "new", icon: BellPlus },
    { id: "finalized", icon: AlarmClockCheck },
];
const params = useUrlSearchParams("history");
const search = ref(params.search ?? "");
const chainId = useChainId();

// Watch for network changes and close modal
watch(chainId, (newChainId, oldChainId) => {
    if (oldChainId && newChainId !== oldChainId) {
        if (networkSwitchTimeout) {
            clearTimeout(networkSwitchTimeout);
            networkSwitchTimeout = null;
        }
        close();
    }
});

debouncedWatch(
    [search],
    ([search]) => {
        router.get(
            window.route("launchpads.index"),
            { search },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    },
    { maxWait: 700 },
);
const animate = ref(true);
</script>

<template>
    <AppLayout compact>
        <template #header>
            <div class="flex items-center w-full bg-gray-850 h-12 relative overflow-x-hidden">
                <div class="flex w-full items-center overflow-x-auto [scrollbar-width:none]">
                    <div class="flex w-full items-center">
                        <BarButton
                            v-for="(launch, i) in top"
                            :key="launch.id"
                            :launch="launch"
                            :active="i === 0"
                        />
                    </div>
                </div>
                <div
                    class="h-12 w-20 absolute right-0 pointer-events-none bg-gradient-to-r from-transparent via-gray-850/50 to-gray-850">
                </div>
            </div>
        </template>
        <div class="grid my-8 container">
            <div
                v-if="type === 'mine'"
                class="flex flex-col justify-center"
            >
                <h3 class="flex items-center">
                    <LoaderCircle
                        v-if="launchpadsInfo.loading.value"
                        class="w-6 h-6 mr-2 animate-spin"
                    />
                    {{ $t("My Launchpads") }}
                </h3>
                <div class="flex items-center mt-4 gap-4">
                    <BaseButton
                        link
                        href="/launch"
                        outlined
                    >
                        {{ $t("Launch a new token") }}
                    </BaseButton>
                </div>
            </div>
            <template v-else>
                <div class="flex flex-col items-center sm:flex-row sm:items-start justify-center sm:justify-between">
                    <div class="flex flex-col justify-center items-center sm:items-start">
                        <h3 class="text-xl font-extralight">
                            {{ $t("Discover the next trending meme") }}
                        </h3>
                        <h3>{{ $t("before everyone else!") }}</h3>
                        <div class="flex items-center mt-4 gap-4">
                            <BaseButton
                                @click="showHowItWorks = !showHowItWorks"
                                secondary
                                outlined
                            >
                                {{ $t("How Does it work") }}
                            </BaseButton>
                            <BaseButton
                                link
                                href="/launch"
                                outlined
                            >
                                {{ $t("Launch your meme") }}
                            </BaseButton>
                        </div>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                        <a
                            v-for="ad in $page.props.ads"
                            :key="ad.id"
                            :href="ad.url"
                        >
                            <img
                                class="w-auto h-40 border border-gray-650 rounded"
                                :src="ad.image"
                            />
                        </a>
                    </div>
                </div>
                <div class="flex gap-4 items-center my-8 mx-4 justify-center sm:justify-start sm:mx-[unset] flex-wrap">
                    <!-- ✅ Fixed: regular button using AppKit modal -->
                    <BaseButton
                        v-if="chainId"
                        @click="openNetworkModal"
                        secondary
                        size="xs"
                        class="font-semibold !px-4"
                    >
                        Switch Network
                    </BaseButton>
                    <BaseButton
                        @click="animate = !animate"
                        size="xss"
                        class="font-semibold !px-4 py-1"
                    >
                        {{ $t("Animation") }}
                        <SmallSwitch
                            :modelValue="animate"
                            class="ml-2"
                        ></SmallSwitch>
                    </BaseButton>
                    <BaseButton
                        v-for="filter in filters"
                        :key="filter.id"
                        :href="route('launchpads.index', {
                            type: filter.id == 'trending' ? '' : filter.id,
                        })"
                        :secondary="filter.id != type"
                        link
                        size="xs"
                        class="font-semibold !px-4"
                    >
                        <component
                            :is="filter.icon"
                            class="w-4 h-4 mr-1 -ml-1 inline-flex"
                        />
                        {{ ucfirst(filter.id) }}
                    </BaseButton>
                    <FormInput
                        v-model="search"
                        class="ml-auto sm:max-w-xs w-full"
                        size="sm"
                    >
                        <template #lead>
                            <Search class="w-4 h-4 ml-1 text-gray-400" />
                        </template>
                    </FormInput>
                </div>
            </template>
            <LoaderCircle
                v-if="type !== 'mine' && launchpadsInfo.loading.value"
                class="w-8 mt-5 text-white h-8 mr-2 animate-spin"
            />
            <CollapseTransition>
                <AnimationsRow
                    :initialTrades="$page.props.initialTrades"
                    v-show="animate"
                />
            </CollapseTransition>

            <div class="grid mb-6 md:grid-col-3 lg:grid-cols-3 gap-5">
                <IndexCard
                    v-for="lpd in launchpadsInfo.launchpads.value"
                    :key="lpd.name"
                    :id="lpd.contract"
                    :launchpad="lpd"
                />
            </div>
            <Pagination :meta="launchpads.meta" />
            <HowItWorksModal v-model:show="showHowItWorks" />
        </div>
    </AppLayout>
</template>
