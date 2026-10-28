
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    AppState,
    Linking,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import Constants from "expo-constants";
import appConfig from "../../app.json";
import { supabase } from "../lib/supabase";

type VersionInfo = {
    latest_version: string;
    play_store_url: string;
};

type UpdateStatus = "checking" | "current" | "update" | "error";

function getInstalledVersion(): string {
    const version =
        Constants.expoConfig?.version ??
        (Constants as any).nativeAppVersion ??
        (Constants as any).manifest2?.extra?.expoClient?.version ??
        appConfig?.expo?.version;

    return version ? String(version) : "1.0.0";
}

function isNewerVersion(latest: string, current: string): boolean {
    const a = latest.split(".").map(Number);
    const b = current.split(".").map(Number);

    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const x = a[i] ?? 0;
        const y = b[i] ?? 0;

        if (x > y) return true;
        if (x < y) return false;
    }

    return false;
}

export default function AppUpdateGate({
    children,
}: {
    children: React.ReactNode;
}) {
    const [status, setStatus] = useState<UpdateStatus>("checking");
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const hasCheckedInitial = useRef(false);
    const lastCheckTime = useRef<number>(0);

    const checkVersion = useCallback(async (isSilent = false) => {
        // Never unmount children or reset to "checking" if app is already active/current
        if (!isSilent && !hasCheckedInitial.current) {
            setStatus("checking");
        }

        try {
            if (Platform.OS !== "android") {
                setStatus("current");
                hasCheckedInitial.current = true;
                return;
            }

            const installedVersion = getInstalledVersion();

            // Timeout after 3.5 seconds to avoid freezing the app for users on poor connections
            const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
                setTimeout(() => resolve({ data: null, error: new Error("Update check timeout") }), 3500)
            );

            const fetchPromise = supabase
                .from("app_updates")
                .select("*");

            const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;

            if (error || !data || data.length === 0) {
                if (!hasCheckedInitial.current) {
                    setStatus("current");
                }
                return;
            }

            // Find matching Android row or default to the latest row
            let targetRow = data[data.length - 1];
            if (data.length > 1) {
                const androidRow = data.find(
                    (r: any) =>
                        r.platform === "android" ||
                        r.os === "android" ||
                        r.platform_name === "android"
                );
                if (androidRow) {
                    targetRow = androidRow;
                }
            }

            const latestVersion =
                targetRow?.build_version ??
                targetRow?.latest_version ??
                targetRow?.version ??
                targetRow?.app_version;

            const playStoreUrl =
                targetRow?.google_play_link ??
                targetRow?.play_store_url ??
                targetRow?.playstore_url ??
                targetRow?.playstore_link ??
                targetRow?.url ??
                targetRow?.link;

            if (!latestVersion || !playStoreUrl) {
                if (!hasCheckedInitial.current) {
                    setStatus("current");
                }
                return;
            }

            const info: VersionInfo = {
                latest_version: String(latestVersion),
                play_store_url: String(playStoreUrl),
            };

            if (isNewerVersion(info.latest_version, installedVersion)) {
                setVersionInfo(info);
                setStatus("update");
            } else if (!hasCheckedInitial.current || status !== "update") {
                setVersionInfo(null);
                setStatus("current");
            }
        } catch (error) {
            console.warn("[AppUpdateGate] Update check failed gracefully:", error);
            if (!hasCheckedInitial.current) {
                setStatus("current");
            }
        } finally {
            hasCheckedInitial.current = true;
            lastCheckTime.current = Date.now();
        }
    }, [status]);

    useEffect(() => {
        // Initial check on app startup
        void checkVersion(false);

        const subscription = AppState.addEventListener("change", (state) => {
            // Only re-check in background if app comes to foreground AND at least 30 minutes elapsed.
            // This prevents image-picker, crop, camera, or permissions modals from re-triggering checks.
            if (state === "active") {
                const now = Date.now();
                if (now - lastCheckTime.current > 30 * 60 * 1000) {
                    void checkVersion(true);
                }
            }
        });

        return () => subscription.remove();
    }, [checkVersion]);

    const openPlayStore = async () => {
        if (!versionInfo?.play_store_url) return;

        try {
            await Linking.openURL(versionInfo.play_store_url);
        } catch (error) {
            console.error("Could not open Play Store:", error);
        }
    };

    if (status === "current") {
        return <>{children}</>;
    }

    return (
        <View className="flex-1 items-center justify-center bg-white px-6">
            {status === "checking" && (
                <ActivityIndicator size="large" color="#c2185b" />
            )}

            <Text className="mt-5 text-center text-2xl font-bold text-gray-900">
                {status === "update"
                    ? "MFCT Update Required"
                    : status === "error"
                        ? "Unable to Verify Update"
                        : "Checking for Updates"}
            </Text>

            <Text className="mb-6 mt-3 text-center text-base leading-6 text-gray-600">
                {status === "update"
                    ? `Version ${versionInfo?.latest_version} is available. Please update MFCT to continue.`
                    : status === "error"
                        ? "We could not verify your app version. Check your internet connection and try again."
                        : "Please wait while we check your app version."}
            </Text>

            {status === "update" && (
                <Pressable
                    onPress={openPlayStore}
                    className="rounded-lg bg-pink-700 px-8 py-4 active:bg-pink-800"
                >
                    <Text className="text-base font-bold text-white">
                        Update Now
                    </Text>
                </Pressable>
            )}

            {status === "error" && (
                <Pressable
                    onPress={() => void checkVersion()}
                    className="rounded-lg bg-pink-700 px-8 py-4 active:bg-pink-800"
                >
                    <Text className="text-base font-bold text-white">
                        Retry
                    </Text>
                </Pressable>
            )}
        </View>
    );
}
