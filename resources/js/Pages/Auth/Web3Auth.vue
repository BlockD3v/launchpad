<script setup>
import { computed, ref, watch } from "vue";
import { router, usePage } from "@inertiajs/vue3";
import { useAppKit } from "@reown/appkit/vue";
import { useAccount, useDisconnect, useSignMessage } from "@wagmi/vue";
import axios from "axios";
import { Power } from "lucide-vue-next";

import DangerButton from "@/Components/DangerButton.vue";
import PrimaryButton from "@/Components/PrimaryButton.vue";
import SecondaryButton from "@/Components/SecondaryButton.vue";
import { shortenAddress } from "@/lib/wagmi";

// Global locks to ensure only one signature runs across all component instances
let globalProcessing = false;
let globalSigned = false;

const { open, close } = useAppKit();

const openConnectModal = async () => {
    try {
        await close();
        setTimeout(() => open(), 100);
    } catch (e) {
        console.warn(e);
        open();
    }
};

defineProps({
    size: { type: String, default: "xs" },
    full: Boolean
});

const authCheck = computed(() => !!usePage().props.auth.user);
const { address, isConnected } = useAccount();
const { disconnect } = useDisconnect();
const { signMessageAsync } = useSignMessage();

const isVerifying = ref(false);

const handleVerify = async () => {
    // Prevent multiple clicks on the same button
    if (isVerifying.value) return;
    // Prevent concurrent executions from different components
    if (globalProcessing) {
        console.log("Signature already in progress elsewhere");
        return;
    }
    if (globalSigned) {
        console.log("Signature already completed");
        return;
    }

    isVerifying.value = true;
    globalProcessing = true;

    try {
        const { data } = await axios.post(window.route("auth.code"));
        const authCode = data.authCode;
        const signature = await signMessageAsync({ message: authCode });
        await router.post(
            window.route("login"),
            { address: address.value, signature },
            { preserveState: true, preserveScroll: true }
        );
        globalSigned = true;
    } catch (error) {
        console.error("Verification failed:", error);
        // Allow retry on error
        globalSigned = false;
    } finally {
        isVerifying.value = false;
        globalProcessing = false;
    }
};

const isSigningOut = ref(false);
const signOut = async () => {
    if (isSigningOut.value) return;
    isSigningOut.value = true;
    if (authCheck.value) {
        await router.post(window.route("logout"), {}, {
            onFinish: () => {
                isSigningOut.value = false;
                globalSigned = false;
            }
        });
    } else {
        isSigningOut.value = false;
    }
};

// Auto‑logout when wallet disconnects while logged in
watch([isConnected, authCheck], ([connected, authed]) => {
    if (!connected && authed) {
        signOut();
    }
});
</script>

<template>
    <div class="flex gap-2">
        <template v-if="$page.props.auth.user && isConnected">
            <SecondaryButton
                :size="size"
                :class="{ 'w-full': full }"
                @click="openConnectModal()"
                outlined
            >
                {{ shortenAddress(address) }}
            </SecondaryButton>
            <DangerButton
                size="sm"
                :class="{ 'w-full': full }"
                :icon-mode="!full"
                outlined
                @click="disconnect"
            >
                <span class="mr-2" v-if="full"> Logout </span>
                <Power class="w-4 h-4 stroke-[3]" />
            </DangerButton>
        </template>
        <template v-else-if="isConnected">
            <SecondaryButton
                :size="size"
                :class="{ 'w-full': full }"
                @click="handleVerify"
                :disabled="isVerifying"
            >
                {{ isVerifying ? 'Verifying...' : 'Verify Signature' }}
            </SecondaryButton>
            <DangerButton
                :size="size"
                :class="{ 'w-full': full }"
                @click="disconnect()"
            >
                Disconnect
            </DangerButton>
        </template>
        <template v-else>
            <PrimaryButton
                :size="size"
                outlined
                :class="{ 'w-full': full }"
                @click="openConnectModal"
            >
                Connect Wallet
            </PrimaryButton>
        </template>
    </div>
</template>
