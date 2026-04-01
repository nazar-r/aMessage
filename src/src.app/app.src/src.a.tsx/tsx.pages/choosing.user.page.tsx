import { useState } from "react";
import { useCreatingMessage } from "../tsx.extensions/setApi/use.send.messages.api";
import { Menu } from '../tsx.items/items.menu/menu';

const ChoosingUserPageContent = () => {
    const [text, setText] = useState("");
    const { mutate } = useCreatingMessage(() => setText(""));

    return (
        <div>
            <div className="chat-prev-page">
                <div className="chat-prev-page__title">Add a first note</div>
                <div className="chat-prev-page__text-field">
                    <div className="chat-prev-page__text-field--edit">
                        <svg className="chat-prev-page__text-field--icon" width="18" height="18" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.34091 0H9.65909V17H7.34091V0Z" fill="white" />
                            <path d="M17 7.34091V9.65909L0 9.65909L1.01331e-07 7.34091L17 7.34091Z" fill="white" />
                        </svg>
                    </div>
                    <textarea className="chat-prev-page__text-field--input" placeholder="Apply Text" value={text} onChange={(e) => setText(e.target.value)} />
                </div>
            </div>
            <Menu />
        </div>
    );
};

export default ChoosingUserPageContent;