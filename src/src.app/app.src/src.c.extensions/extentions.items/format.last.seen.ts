export const formatLastSeen = (value?: string | number | Date | null) => {
    if (!value) return "Offline";

    console.log(value)
    const date = new Date(value);

    if (isNaN(date.getTime())) return "Offline";

    const now = new Date();

    const time = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    const isToday = date.toDateString() === now.toDateString();

    if (isToday) return `Last seen at ${time}`;

    const diffDays = Math.floor(
        (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
            new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
        86400000
    );

    if (diffDays <= 7) {
        const weekday = date.toLocaleDateString("en-US", {
            weekday: "long",
        }).toLowerCase();

        return `Last seen on ${weekday}, ${time}`;
    }

    return `Last seen ${String(date.getDate()).padStart(2, "0")}.${String(
        date.getMonth() + 1
    ).padStart(2, "0")}`;
};