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
import * as Application from "expo-application";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import appConfig from "../../app.json";
import { supabase } from "../lib/supabase";

type VersionInfo = {
    latest_version: string;
    play_store_url: string;
};

type UpdateStatus = "checking" | "current" | "update" | "error";

const UPDATE_VERIFIED_KEY = "@app_update_last_verified";
const COOLDOWN_PERIOD_MS = 6 * 60 * 60 * 1000; // 6 hours cooldown between background checks

function getInstalledVersion(): string {
    const rawVersion =
        Application.nativeApplicationVersion ??
        Constants.expoConfig?.version ??
        (Constants as any).nativeAppVersion ??
        (appConfig as any)?.expo?.version ??
        (appConfig as any)?.default?.expo?.version;

    return rawVersion ? String(rawVersion).trim() : "1.0.2";
}

function parseVersionNumbers(v: string): number[] {
    const clean = String(v).replace(/[^0-9.]/g, "").trim();
    if (!clean) return [0];
    return clean.split(".").map((n) => Number(n) || 0);
}

function isNewerVersion(latest: string, current: string): boolean {
    const a = parseVersionNumbers(latest);
    const b = parseVersionNumbers(current);

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
    // Default to "current" so the app mounts immediately without blank screens or disrupting active forms
    const [status, setStatus] = useState<UpdateStatus>("current");
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const statusRef = useRef<UpdateStatus>("current");
    statusRef.current = status;
    const isCheckingRef = useRef<boolean>(false);
    const lastCheckTime = useRef<number>(Date.now());

    const checkVersion = useCallback(async (isSilent = false) => {
        if (isCheckingRef.current) return;
        isCheckingRef.current = true;

        try {
            if (Platform.OS !== "android") {
                setStatus("current");
                return;
            }

            // Check if verified recently to avoid unnecessary network queries when switching apps/camera
            if (isSilent) {
                try {
                    const cachedStr = await AsyncStorage.getItem(UPDATE_VERIFIED_KEY);
                    if (cachedStr) {
                        const cached = JSON.parse(cachedStr);
                        if (
                            cached &&
                            cached.timestamp &&
                            Date.now() - cached.timestamp < COOLDOWN_PERIOD_MS
                        ) {
                            return;
                        }
                    }
                } catch { }
            }

            const installedVersion = getInstalledVersion();

            // Timeout after 3.5 seconds to avoid freezing the app for users on poor connections
            const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
                setTimeout(() => resolve({ data: null, error: new Error("Update check timeout") }), 3500)
            );

            const fetchPromise = supabase
                .from("app_updates")
                .select("*")
                .order("id", { ascending: false })
                .limit(5);

            const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;

            if (error || !data || data.length === 0) {
                // If query fails or times out, never trap the user
                return;
            }

            // Find matching Android row or default to the most recent row
            let targetRow = data[0];
            const androidRow = data.find(
                (r: any) =>
                    r.platform === "android" ||
                    r.os === "android" ||
                    r.platform_name === "android"
            );
            if (androidRow) {
                targetRow = androidRow;
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
                return;
            }

            const info: VersionInfo = {
                latest_version: String(latestVersion).trim(),
                play_store_url: String(playStoreUrl).trim(),
            };

            if (isNewerVersion(info.latest_version, installedVersion)) {
                setVersionInfo(info);
                setStatus("update");
            } else {
                setVersionInfo(null);
                setStatus("current");
                void AsyncStorage.setItem(
                    UPDATE_VERIFIED_KEY,
                    JSON.stringify({ version: installedVersion, timestamp: Date.now() })
                );
            }
        } catch (error) {
            console.warn("[AppUpdateGate] Update check failed gracefully:", error);
        } finally {
            isCheckingRef.current = false;
            lastCheckTime.current = Date.now();
        }
    }, []);

    useEffect(() => {
        // Run initial check on app startup in silent mode so children stay rendered
        void checkVersion(true);

        const subscription = AppState.addEventListener("change", (state) => {
            // Only re-check if app comes to foreground AND cooldown elapsed.
            // This guarantees camera, gallery, crop, or permissions modals NEVER re-trigger update checks.
            if (state === "active") {
                const now = Date.now();
                if (now - lastCheckTime.current > COOLDOWN_PERIOD_MS) {
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

    if (status === "current" || status === "checking") {
        return <>{children}</>;
    }

    return (
        <View className="flex-1 items-center justify-center bg-white px-6">
            <Text className="mt-5 text-center text-2xl font-bold text-gray-900">
                {status === "update"
                    ? "MFCT Update Required"
                    : "Unable to Verify Update"}
            </Text>

            <Text className="mb-6 mt-3 text-center text-base leading-6 text-gray-600">
                {status === "update"
                    ? `Version ${versionInfo?.latest_version} is available. Please update MFCT to continue.`
                    : "We could not verify your app version. Check your internet connection and try again."}
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
                    onPress={() => void checkVersion(false)}
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
