import { useState } from "react";
import { useCreatingNote } from "../tsx.extensions/setApi/use.send.content.api";
import Navbar from '../tsx.items/navbar';

const LobbyPagePrevContent = () => {
    const [text, setText] = useState("");
    const { mutate } = useCreatingNote(() => setText(""));

    const handleSubmit = () => {
        if (!text.trim()) return;
        mutate({ noteId: "", content: text });
    };

    return (
        <div>
            <div className="lobby-prev-page">
                <div className="lobby-prev-page__title">Add a first note</div>
                <div className="lobby-prev-page__text-field">
                    <div className="lobby-prev-page__text-field--edit" onClick={handleSubmit}>
                        <svg className="lobby-prev-page__text-field--icon" width="18" height="18" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.34091 0H9.65909V17H7.34091V0Z" fill="white" />
                            <path d="M17 7.34091V9.65909L0 9.65909L1.01331e-07 7.34091L17 7.34091Z" fill="white" />
                        </svg>
                    </div>
                    <textarea className="lobby-prev-page__text-field--input" placeholder="Apply Text" value={text} onChange={(e) => setText(e.target.value)} />
                </div>
            </div>
            <Navbar />
        </div>
    );
};

export default LobbyPagePrevContent;