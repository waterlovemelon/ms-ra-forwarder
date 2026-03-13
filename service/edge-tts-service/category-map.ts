const categoryMap = new Map<string, string>([
    ["General", "通用"],
    ["Conversation", "对话"],
    ["Narration", "旁白"],
    ["News", "新闻"],
    ["Novel", "小说"],
    ["Audiobook", "有声书"],
    ["Assistant", "助手"],
    ["Chat", "聊天"],
    ["CustomerService", "客服"],
    ["Education", "教育"],
])

export function getFriendlyCategoryName(key?: string) {
    if (!key) {
        return "默认"
    }
    return categoryMap.get(key) ?? key
}
