import { EdgeTTSClient } from "@/service/edge-tts-service/client"
import { getFriendlyVoiceName } from "@/service/edge-tts-service/voice-map"
import { getFirendlyPersonalityName } from "@/service/edge-tts-service/personality-map"
import { getFriendlyCategoryName } from "@/service/edge-tts-service/category-map"
import { getLocaleFriendlyName } from "@/service/edge-tts-service/locale-map"

type ApiVoice = {
    value: string
    label: string
    locale: string
    gender: string
    format: string
    personalities: string[]
    names: {
        zh: string
        en: string
    }
    localeName: {
        zh: string
        en: string
    }
    characteristics: {
        personalities: {
            raw: string[]
            zh: string[]
            en: string[]
        }
        categories: {
            raw: string[]
            zh: string[]
            en: string[]
        }
    }
    shortName: string
    status: string
}

export async function GET(request: Request) {
    try {
        const authorization = request.headers.get("authorization")
        const requiredToken = process.env.MS_RA_FORWARDER_TOKEN || process.env.TOKEN

        if (requiredToken) {
            if (!authorization || authorization !== "Bearer " + requiredToken) {
                return new Response("Unauthorized", { status: 401 })
            }
        }

        const { searchParams } = new URL(request.url)
        const locale = (searchParams.get("locale") ?? "").trim()

        const voices = await EdgeTTSClient.voices()
        const normalized: ApiVoice[] = voices.map((rawVoice: unknown) => {
            const item = (rawVoice ?? {}) as Record<string, unknown>
            const voiceTag = (item["VoiceTag"] ?? {}) as Record<string, unknown>
            const shortName = String(item["ShortName"] ?? "")
            const localeCode = String(item["Locale"] ?? "")
            const personalities = (voiceTag["VoicePersonalities"] ?? []) as string[]
            const categories = (voiceTag["ContentCategories"] ?? []) as string[]
            const englishName = String(item["FriendlyName"] ?? shortName)
            const localizedName = getFriendlyVoiceName(shortName, englishName)

            return {
                // backward-compatible fields
                value: String(item["Name"] ?? ""),
                label: localizedName,
                locale: localeCode,
                gender: String(item["Gender"] ?? ""),
                format: String(item["SuggestedCodec"] ?? ""),
                personalities,

                // richer multilingual fields
                names: {
                    zh: localizedName,
                    en: englishName,
                },
                localeName: {
                    zh: getLocaleFriendlyName(localeCode),
                    en: localeCode,
                },
                characteristics: {
                    personalities: {
                        raw: personalities,
                        zh: personalities.map((name) => getFirendlyPersonalityName(name)),
                        en: personalities,
                    },
                    categories: {
                        raw: categories,
                        zh: categories.map((name) => getFriendlyCategoryName(name)),
                        en: categories,
                    },
                },
                shortName,
                status: String(item["Status"] ?? ""),
            }
        })

        const filtered = locale
            ? normalized.filter((voice: ApiVoice) => voice.locale === locale)
            : normalized

        return new Response(JSON.stringify(filtered), {
            status: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
        })
    } catch (error) {
        console.log("list voices error", error)
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            {
                status: 500,
                headers: { "Content-Type": "application/json; charset=utf-8" },
            },
        )
    }
}
