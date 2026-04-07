import { useState } from 'react';
import { useOneOnOneRoom } from "../../src.a.chats/ws.chats";
import { useLocation } from "react-router-dom";
import { Menu } from '../tsx.items/items.menu/menu';

const LobbyPageContent = () => {
    const location = useLocation();
    const peerWsId = location.state?.peerWsId || "";
    const { messages, isPeerOnline, sendMessage, removeMessage, updateMessage } = useOneOnOneRoom({ peerWsId });
    const [defEdit, setEdit] = useState(false);
    const [text, setText] = useState("");

    const switchEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEdit(prev => !prev);
    };

    const handleSubmit = () => {
        if (!text.trim()) return;
        sendMessage({ messageStatus: "mine", messageId: "", content: text });
        setText("");
    };

    return (
        <>
            <div className="chat-page">

                <ul className="chat-page__container">
                    {messages.map(message => (
                        <li id={message.messageId} key={message.messageId} style={{ margin: message.messageStatus === "got" ? "20px auto 0 0" : "20px 0 0 auto" }} className="chat-message">
                            <div contentEditable={true} className="chat-message--text">{message.content}</div>
                            <div className="chat-message__hidden">
                                {message.messageStatus === "mine" ? <div className="chat-message__hidden--item" onClick={e => { e.stopPropagation(); defEdit ? updateMessage(message.messageId, message.content) : switchEdit(e) }}>
                                    {defEdit
                                        ? <svg className="chat-message__hidden--item__icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        : <svg className="chat-message__hidden--item__icon" width="14" height="14" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity="0.85" d="M12.8054 3.35851L15.4766 6.03033M10.4444 17.9996H18M1 18L1.04481 17.6863C1.2034 16.576 1.28269 16.0208 1.46305 15.5025C1.6231 15.0427 1.84173 14.6053 2.11356 14.2013C2.41989 13.746 2.81635 13.3494 3.60925 12.5564L14.6101 1.55335C15.3478 0.815555 16.5438 0.815546 17.2815 1.55335C18.0191 2.29115 18.0191 3.48736 17.2815 4.22516L6.07869 15.43C5.35936 16.1496 4.99969 16.5093 4.59002 16.7954C4.22639 17.0493 3.83421 17.2597 3.42154 17.4222C2.95662 17.6051 2.45799 17.7057 1.46082 17.907L1 18Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    }
                                    <div className="chat-message__hidden--item__edit">{defEdit ? "Save" : "Edit"}</div>
                                </div> : null}

                                {message.messageStatus === "mine" ? <div className="chat-message__hidden--item">
                                    <svg className="chat-message__hidden--item__icon" style={{ transform: "rotate(45deg)" }} width="14" height="14" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="1"><path d="M7.34091 0H9.65909V17H7.34091V0Z" fill="currentColor" /><path d="M17 7.34091V9.65909L0 9.65909L0 7.34091L17 7.34091Z" fill="currentColor" /></g></svg>
                                    <div className="chat-message__hidden--item__edit" color="white" onClick={() => removeMessage(message.messageId)}>Delete</div>
                                </div> : null}
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="chat-page__add-message">
                    <div className="chat-page__add-message--pin">
                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                        {/* <div className="chat-page__add-message--pin__note">This feature is not yet available</div> */}
                    </div>
                    <div onClick={handleSubmit} className="chat-page__add-message--icon">
                        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="1"><path d="M7.34091 0H9.65909V17H7.34091V0Z" fill="white" /><path d="M17 7.34091V9.65909L0 9.65909L0 7.34091L17 7.34091Z" fill="white" /></g></svg>
                    </div>
                    <textarea className="chat-page__add-message--field" placeholder="SEND MESSAGE" value={text} onChange={(e) => setText(e.target.value)} />
                </div>
                <div className="chat-page__status">
                    {isPeerOnline
                        ? <div className="chat-page__status">
                            <div className="chat-page__status--icon"></div>
                            <div className="">Online</div>
                        </div>

                        : <div className="chat-page__status">
                            <div className="chat-page__status--icon-1"></div>
                            <div className="">Offline</div>
                        </div>}
                </div>
            </div>
            <Menu />
        </>
    );
};

export default LobbyPageContent;