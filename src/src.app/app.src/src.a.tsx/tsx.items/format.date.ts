export const formatMessageDate = (createdAt: string) => {
    const messageDate = new Date(createdAt);
    const now = new Date();
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const differenceInDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24));

    if (differenceInDays === 0) {
        return messageDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    }

    if (differenceInDays === 1) {
        return messageDate.toLocaleDateString("uk-UA", {
            weekday: "long",
        });
    }

    return messageDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
};