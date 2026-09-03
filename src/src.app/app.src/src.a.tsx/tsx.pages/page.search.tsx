import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSendSearchMessage } from '../../src.b.extensions/setApi/set.api.POST/use.ask.gemini';

const SearchPageContent = () => {
    const [text, setText] = useState('');
    const { data: messages = [] } = useQuery<any[]>({ queryKey: ['searchMessages'], queryFn: () => [], staleTime: Infinity, gcTime: Infinity });
    const navigate = useNavigate();
    const sendSearchMessage = useSendSearchMessage();

    const setMessage = () => {
        const messageText = text.trim();

        if (!messageText) return;

        setText('');
        sendSearchMessage.mutate(messageText);
    };

    const handleKeyDown = (event: any) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            setMessage();
        }
    };

    return (
        <div className="lobby-page">
            <div className="chat-page__header appear">
                <div className="list-page__title">ai search</div>
            </div>

            <div className="chat-page" onKeyDown={handleKeyDown}>
                <div className="chat-page__header">
                    <svg onClick={() => navigate('/users')} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="chat-page__button--icon">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>

                    <div className="chat-page__title">
                        <div className="chat-page__title--name">Search</div>
                    </div>
                </div>

                <ul className="chat-page__container">
                    {messages.map((message) => (
                        <li id={message.messageId} key={message.messageId} className={message.messageStatus === 'mine' ? 'chat-message__mine' : 'chat-message__got'}>
                            <div className="chat-message--text">{message.content}</div>

                            <div className={message.messageStatus === 'mine' ? 'chat-message__time--mine' : 'chat-message__time--got'}>00:00</div>
                        </li>
                    ))}

                    {sendSearchMessage.isPending && (
                        <li className="chat-message__got">
                            <div className="search-container">
                                <div className="chat-message--text">Зачекайте</div>
                                <div className="loader-chat"></div>
                            </div>
                            <div className="chat-message__time--got">00:00</div>
                        </li>
                    )}
                </ul>

                <div className="chat-page__add-message">
                    <div className="chat-page__add-message--pin">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                    </div>

                    <div onClick={setMessage} className="chat-page__add-message--icon">
                        <svg width="14" height="14" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g opacity="1">
                                <path d="M7.34091 0H9.65909V17H7.34091V0Z" fill="white" />
                                <path d="M17 7.34091V9.65909L0 9.65909L0 7.34091L17 7.34091Z" fill="white" />
                            </g>
                        </svg>
                    </div>

                    <textarea className="chat-page__add-message--field" placeholder="Send Message" value={text} onChange={(e) => setText(e.target.value)} />
                </div>
            </div>
        </div>
    );
};

export default SearchPageContent;